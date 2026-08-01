from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ConsentStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"

class AccessRequestCreate(BaseModel):
    patient_id: str
    document_id: Optional[str] = None  # None means request all documents
    reason: str = Field(..., min_length=10, example="Technical support to verify AI OCR parsing error on blood report")
    duration_hours: int = Field(default=24, ge=1, le=168)  # Default 24 hours

class AccessRequestResponse(BaseModel):
    id: str
    admin_id: str
    admin_name: str
    admin_email: str
    patient_id: str
    patient_email: str
    document_id: Optional[str] = None
    document_name: Optional[str] = None
    reason: str
    status: ConsentStatus
    duration_hours: int
    created_at: str
    approved_at: Optional[str] = None
    expires_at: Optional[str] = None
    revoked_at: Optional[str] = None

class AccessRequestAction(BaseModel):
    action: str = Field(..., example="APPROVE")  # "APPROVE", "REJECT", or "REVOKE"
