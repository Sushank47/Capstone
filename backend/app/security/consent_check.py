from datetime import datetime
from fastapi import HTTPException, status
from app.database import get_collection
from app.models.consent import ConsentStatus
from app.services.audit_service import log_audit_event
from app.models.audit import AuditAction

async def check_document_access_permission(
    current_user: dict,
    document: dict,
    ip_address: str = "127.0.0.1"
) -> bool:
    user_id = str(current_user.get("_id"))
    user_role = current_user.get("role")
    owner_id = str(document.get("owner_id"))
    document_id = str(document.get("_id"))

    # Rule 1: Document owner always has access to their own document
    if user_id == owner_id:
        return True

    # Rule 2: Non-owners who are NOT admin are denied immediately
    if user_role != "ADMIN":
        await log_audit_event(
            action=AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
            performed_by=current_user,
            target_patient_id=owner_id,
            document_id=document_id,
            document_name=document.get("file_name"),
            reason="Non-owner user attempted to access document without permission",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You do not have permission to view or modify this document."
        )

    # Rule 3: Administrators MUST have explicit, unexpired, APPROVED patient consent
    consent_coll = get_collection("consent_requests")
    now_iso = datetime.utcnow().isoformat()

    # Query active consent requests for this patient
    cursor = await consent_coll.find({
        "patient_id": owner_id,
        "admin_id": user_id,
        "status": ConsentStatus.APPROVED.value
    })
    approved_requests = await cursor.to_list(length=100)

    valid_consent = None
    for req in approved_requests:
        # Check document specificity (None means all documents)
        req_doc_id = req.get("document_id")
        if req_doc_id is None or req_doc_id == document_id:
            # Check expiration time
            exp_at = req.get("expires_at")
            if exp_at and exp_at > now_iso:
                valid_consent = req
                break

    if not valid_consent:
        await log_audit_event(
            action=AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
            performed_by=current_user,
            target_patient_id=owner_id,
            document_id=document_id,
            document_name=document.get("file_name"),
            reason="Administrator attempted to access document without active patient consent approval",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Zero-Trust Security Policy requires explicit, unexpired patient consent for administrators to access medical documents."
        )

    # Log successful admin access with consent reason
    await log_audit_event(
        action=AuditAction.ADMIN_DOCUMENT_ACCESS,
        performed_by=current_user,
        target_patient_id=owner_id,
        document_id=document_id,
        document_name=document.get("file_name"),
        reason=f"Admin accessed file under approved consent request '{valid_consent.get('_id')}'. Reason: {valid_consent.get('reason')}",
        ip_address=ip_address
    )
    return True
