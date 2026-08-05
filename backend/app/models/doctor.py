from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class Specialization(str, Enum):
    CARDIOLOGY = "Cardiology"
    ENDOCRINOLOGY = "Endocrinology"
    GENERAL_MEDICINE = "General Medicine"
    NEUROLOGY = "Neurology"
    PEDIATRICS = "Pediatrics"
    ONCOLOGY = "Oncology"
    DERMATOLOGY = "Dermatology"
    PULMONOLOGY = "Pulmonology"
    OTHER = "Other"

class DoctorRegistration(BaseModel):
    full_name: str = Field(..., min_length=2, example="Dr. Marcus Vance")
    email: EmailStr = Field(..., example="dr.marcus@mediexplain.ai")
    password: str = Field(..., min_length=6, example="DoctorPass123!")
    medical_license_number: str = Field(..., min_length=4, example="MD-88492-CAR")
    specialization: Specialization = Specialization.CARDIOLOGY
    experience_years: int = Field(..., ge=1, example=12)
    hospital_affiliation: str = Field(..., example="St. Jude Heart & Health Institute")
    bio: Optional[str] = Field(None, example="Board-certified cardiologist specializing in preventive cardiovascular care and lipid disorders.")
    license_document_name: Optional[str] = "medical_license_certificate.pdf"

class DoctorProfile(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: EmailStr
    medical_license_number: str
    specialization: Specialization
    experience_years: int
    hospital_affiliation: str
    bio: Optional[str] = None
    verification_status: VerificationStatus = VerificationStatus.VERIFIED
    rating: float = 4.9
    consultations_completed: int = 142
    is_available: bool = True
    created_at: str

class ConsultationStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class ConsultationCreate(BaseModel):
    doctor_id: str
    symptoms_note: str = Field(..., min_length=5, example="Consultation regarding recent elevated cholesterol and HbA1c blood test results.")

class ConsultationMessage(BaseModel):
    id: str
    consultation_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    text: str
    timestamp: str

class ConsultationResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    patient_email: str
    doctor_id: str
    doctor_name: str
    doctor_specialization: str
    symptoms_note: str
    status: ConsultationStatus
    report_access_granted: bool = False
    messages: List[ConsultationMessage] = []
    created_at: str
    accepted_at: Optional[str] = None

class DoctorReportAccessRequest(BaseModel):
    consultation_id: str
    patient_id: str
    document_id: Optional[str] = None
    reason: str = Field(..., min_length=5, example="Requires review of blood lab report to evaluate elevated WBC and lipid parameters.")
