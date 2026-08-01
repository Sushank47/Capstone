from typing import List
from fastapi import APIRouter, Depends
from app.database import get_collection
from app.models.audit import AuditLogResponse, AuditAction
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/audit", tags=["Security Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
async def get_audit_logs(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    role = current_user.get("role")
    audit_coll = get_collection("audit_logs")

    if role == "ADMIN":
        cursor = audit_coll.find({})
    else:
        cursor = audit_coll.find({
            "$or": [
                {"target_patient_id": user_id},
                {"performed_by_id": user_id}
            ]
        })

    logs = await cursor.to_list(length=300)
    
    # Sort newest first
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    results = []
    for l in logs:
        results.append(AuditLogResponse(
            id=str(l["_id"]),
            action=AuditAction(l["action"]),
            performed_by_id=l["performed_by_id"],
            performed_by_name=l["performed_by_name"],
            performed_by_role=l["performed_by_role"],
            target_patient_id=l["target_patient_id"],
            document_id=l.get("document_id"),
            document_name=l.get("document_name"),
            reason=l.get("reason"),
            ip_address=l.get("ip_address", "127.0.0.1"),
            details=l.get("details", {}),
            timestamp=l["timestamp"]
        ))

    return results
