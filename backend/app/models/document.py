from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class DocumentCategory(str, Enum):
    BLOOD_REPORT = "Blood Report"
    PRESCRIPTION = "Prescription"
    XRAY_SCAN = "X-Ray / Scan"
    LAB_REPORT = "Lab Report"
    DISCHARGE_SUMMARY = "Discharge Summary"
    DOCTOR_NOTE = "Doctor Note"
    MEDICAL_BILL = "Medical Bill"
    OTHER = "Other"

class MedicalEntity(BaseModel):
    text: str
    category: str  # Medication, Condition, LabValue, BodyPart, Dosage
    confidence: float = 0.95
    explanation: Optional[str] = None
    normal_range: Optional[str] = None
    status: Optional[str] = None  # Normal, High, Low, Critical

class OCRData(BaseModel):
    extracted_text: str
    confidence: float = 0.98
    page_count: int = 1
    processed_at: str

class AISummaryData(BaseModel):
    overview: str
    key_findings: List[str]
    abnormal_values: List[Dict[str, str]]
    medications_mentioned: List[Dict[str, str]]
    patient_actions: List[str]
    questions_for_doctor: List[str]
    medical_disclaimer: str = (
        "DISCLAIMER: MediExplain AI provides educational summaries only. "
        "It does not diagnose medical conditions, prescribe treatments, or replace professional healthcare advice. "
        "Always consult a qualified medical professional regarding your lab results and health."
    )

class DocumentResponse(BaseModel):
    id: str
    owner_id: str
    file_name: str
    file_type: str
    file_size_bytes: int
    category: DocumentCategory
    tags: List[str] = []
    is_favorite: bool = False
    blob_url: str
    uploaded_at: str
    ocr_data: Optional[OCRData] = None
    entities: List[MedicalEntity] = []
    ai_summary: Optional[AISummaryData] = None
    indexed_in_search: bool = False

class DocumentUpdate(BaseModel):
    category: Optional[DocumentCategory] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None

class ReportComparisonRequest(BaseModel):
    document_id_1: str
    document_id_2: str

class ReportComparisonResponse(BaseModel):
    document_1: DocumentResponse
    document_2: DocumentResponse
    diff_summary: str
    improved_metrics: List[str]
    worsened_metrics: List[str]
    stable_metrics: List[str]
    recommendations: List[str]
    medical_disclaimer: str
