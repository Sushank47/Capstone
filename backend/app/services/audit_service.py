import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from app.database import get_collection
from app.models.audit import AuditAction

async def log_audit_event(
    action: AuditAction,
    performed_by: dict,
    target_patient_id: str,
    document_id: Optional[str] = None,
    document_name: Optional[str] = None,
    reason: Optional[str] = None,
    ip_address: str = "127.0.0.1",
    details: Optional[Dict[str, Any]] = None
):
    audit_coll = get_collection("audit_logs")
    log_doc = {
        "_id": str(uuid.uuid4()),
        "action": action.value if hasattr(action, 'value') else str(action),
        "performed_by_id": str(performed_by.get("_id")),
        "performed_by_name": performed_by.get("full_name", "Unknown"),
        "performed_by_role": performed_by.get("role", "UNKNOWN"),
        "target_patient_id": target_patient_id,
        "document_id": document_id,
        "document_name": document_name,
        "reason": reason,
        "ip_address": ip_address,
        "details": details or {},
        "timestamp": datetime.utcnow().isoformat()
    }
    await audit_coll.insert_one(log_doc)
    return log_doc
