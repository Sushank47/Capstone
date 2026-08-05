import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_collection
from app.models.consent import (
    AccessRequestCreate, AccessRequestResponse, ConsentStatus, AccessRequestAction
)
from app.security.auth import get_current_user, require_role
from app.services.audit_service import log_audit_event
from app.models.audit import AuditAction

router = APIRouter(prefix="/api/consent", tags=["Zero-Trust Consent Access"])

@router.post("/request", response_model=AccessRequestResponse)
async def create_access_request(
    req: AccessRequestCreate,
    current_user: dict = Depends(require_role(["ADMIN"]))
):
    admin_id = str(current_user["_id"])
    users_coll = get_collection("users")
    
    # Check patient exists
    patient = await users_coll.find_one({"_id": req.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient account not found")

    document_name = None
    if req.document_id:
        docs_coll = get_collection("documents")
        doc = await docs_coll.find_one({"_id": req.document_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Requested document not found")
        document_name = doc.get("file_name")

    request_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    consent_doc = {
        "_id": request_id,
        "admin_id": admin_id,
        "admin_name": current_user.get("full_name", "Admin User"),
        "admin_email": current_user.get("email", "admin@medipro.ai"),
        "patient_id": req.patient_id,
        "patient_email": patient.get("email"),
        "document_id": req.document_id,
        "document_name": document_name,
        "reason": req.reason,
        "status": ConsentStatus.PENDING.value,
        "duration_hours": req.duration_hours,
        "created_at": now_iso,
        "approved_at": None,
        "expires_at": None,
        "revoked_at": None
    }

    consent_coll = get_collection("consent_requests")
    await consent_coll.insert_one(consent_doc)

    await log_audit_event(
        action=AuditAction.CONSENT_REQUEST_SENT,
        performed_by=current_user,
        target_patient_id=req.patient_id,
        document_id=req.document_id,
        document_name=document_name,
        reason=f"Administrator submitted access request. Reason: {req.reason}"
    )

    return AccessRequestResponse(
        id=request_id,
        admin_id=admin_id,
        admin_name=current_user.get("full_name", "Admin User"),
        admin_email=current_user.get("email", "admin@medipro.ai"),
        patient_id=req.patient_id,
        patient_email=patient.get("email"),
        document_id=req.document_id,
        document_name=document_name,
        reason=req.reason,
        status=ConsentStatus.PENDING,
        duration_hours=req.duration_hours,
        created_at=now_iso
    )

@router.get("/requests", response_model=List[AccessRequestResponse])
async def list_access_requests(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    role = current_user.get("role")
    consent_coll = get_collection("consent_requests")

    if role == "ADMIN":
        query = {"admin_id": user_id}
    else:
        query = {"patient_id": user_id}

    cursor = consent_coll.find(query)
    requests_list = await cursor.to_list(length=200)

    now_iso = datetime.utcnow().isoformat()
    results = []
    for r in requests_list:
        status_val = r.get("status")
        exp_at = r.get("expires_at")
        
        # Check auto-expiration
        if status_val == ConsentStatus.APPROVED.value and exp_at and exp_at < now_iso:
            status_val = ConsentStatus.EXPIRED.value
            await consent_coll.update_one({"_id": r["_id"]}, {"$set": {"status": ConsentStatus.EXPIRED.value}})

        results.append(AccessRequestResponse(
            id=str(r["_id"]),
            admin_id=r["admin_id"],
            admin_name=r["admin_name"],
            admin_email=r["admin_email"],
            patient_id=r["patient_id"],
            patient_email=r["patient_email"],
            document_id=r.get("document_id"),
            document_name=r.get("document_name"),
            reason=r["reason"],
            status=ConsentStatus(status_val),
            duration_hours=r.get("duration_hours", 24),
            created_at=r["created_at"],
            approved_at=r.get("approved_at"),
            expires_at=exp_at,
            revoked_at=r.get("revoked_at")
        ))

    return results

@router.post("/{request_id}/action", response_model=AccessRequestResponse)
async def process_consent_action(
    request_id: str,
    action_data: AccessRequestAction,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    consent_coll = get_collection("consent_requests")
    req = await consent_coll.find_one({"_id": request_id})

    if not req:
        raise HTTPException(status_code=404, detail="Access request not found")

    if str(req["patient_id"]) != user_id:
        raise HTTPException(status_code=403, detail="Only the patient can approve, reject, or revoke access requests.")

    act = action_data.action.upper()
    now_dt = datetime.utcnow()
    now_iso = now_dt.isoformat()

    updates = {}
    audit_action = None

    if act == "APPROVE":
        duration = req.get("duration_hours", 24)
        expires_dt = now_dt + timedelta(hours=duration)
        updates = {
            "status": ConsentStatus.APPROVED.value,
            "approved_at": now_iso,
            "expires_at": expires_dt.isoformat()
        }
        audit_action = AuditAction.CONSENT_APPROVED
    elif act == "REJECT":
        updates = {
            "status": ConsentStatus.REJECTED.value
        }
        audit_action = AuditAction.CONSENT_REJECTED
    elif act == "REVOKE":
        updates = {
            "status": ConsentStatus.REVOKED.value,
            "revoked_at": now_iso
        }
        audit_action = AuditAction.CONSENT_REVOKED
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use APPROVE, REJECT, or REVOKE.")

    await consent_coll.update_one({"_id": request_id}, {"$set": updates})
    req.update(updates)

    await log_audit_event(
        action=audit_action,
        performed_by=current_user,
        target_patient_id=user_id,
        document_id=req.get("document_id"),
        document_name=req.get("document_name"),
        reason=f"Patient executed consent action '{act}' for admin {req.get('admin_name')}"
    )

    return AccessRequestResponse(
        id=str(req["_id"]),
        admin_id=req["admin_id"],
        admin_name=req["admin_name"],
        admin_email=req["admin_email"],
        patient_id=req["patient_id"],
        patient_email=req["patient_email"],
        document_id=req.get("document_id"),
        document_name=req.get("document_name"),
        reason=req["reason"],
        status=ConsentStatus(req["status"]),
        duration_hours=req.get("duration_hours", 24),
        created_at=req["created_at"],
        approved_at=req.get("approved_at"),
        expires_at=req.get("expires_at"),
        revoked_at=req.get("revoked_at")
    )

@router.get("/audit", response_model=List[dict])
async def get_security_audit_logs(current_user: dict = Depends(get_current_user)):
    """
    Returns security audit log entries for zero-trust compliance tracking.
    """
    user_id = str(current_user["_id"])
    role = current_user.get("role")
    audit_coll = get_collection("audit_logs")
    
    if role == "ADMIN":
        cursor = audit_coll.find({})
    else:
        cursor = audit_coll.find({"$or": [{"performed_by._id": user_id}, {"target_patient_id": user_id}]})
        
    logs = await cursor.to_list(length=200)
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return logs
