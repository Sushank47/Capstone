from enum import Enum
from pydantic import BaseModel
from typing import Optional, Dict, Any

class AuditAction(str, Enum):
    USER_REGISTER = "USER_REGISTER"
    USER_LOGIN = "USER_LOGIN"
    DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD"
    DOCUMENT_VIEW = "DOCUMENT_VIEW"
    DOCUMENT_DOWNLOAD = "DOCUMENT_DOWNLOAD"
    DOCUMENT_DELETE = "DOCUMENT_DELETE"
    AI_ANALYSIS_RUN = "AI_ANALYSIS_RUN"
    CONSENT_REQUEST_SENT = "CONSENT_REQUEST_SENT"
    CONSENT_APPROVED = "CONSENT_APPROVED"
    CONSENT_REJECTED = "CONSENT_REJECTED"
    CONSENT_REVOKED = "CONSENT_REVOKED"
    ADMIN_DOCUMENT_ACCESS = "ADMIN_DOCUMENT_ACCESS"
    UNAUTHORIZED_ACCESS_ATTEMPT = "UNAUTHORIZED_ACCESS_ATTEMPT"

class AuditLogResponse(BaseModel):
    id: str
    action: AuditAction
    performed_by_id: str
    performed_by_name: str
    performed_by_role: str
    target_patient_id: str
    document_id: Optional[str] = None
    document_name: Optional[str] = None
    reason: Optional[str] = None
    ip_address: str = "127.0.0.1"
    details: Optional[Dict[str, Any]] = None
    timestamp: str
