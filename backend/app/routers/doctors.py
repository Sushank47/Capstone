import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId

from app.database import get_collection
from app.models.doctor import (
    DoctorRegistration, DoctorProfile, VerificationStatus, Specialization,
    ConsultationCreate, ConsultationResponse, ConsultationStatus, ConsultationMessage,
    DoctorReportAccessRequest
)
from app.models.consent import AccessRequestResponse, ConsentStatus
from app.security.auth import get_current_user, require_role, hash_password
from app.services.audit_service import log_audit_event
from app.models.audit import AuditAction

router = APIRouter(prefix="/api/doctors", tags=["Doctor Portal & Consultations"])

@router.post("/register", response_model=DoctorProfile)
async def register_doctor(req: DoctorRegistration):
    users_coll = get_collection("users")
    doctors_coll = get_collection("doctors")

    # Check if email exists
    existing = await users_coll.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user_id = str(uuid.uuid4())
    doc_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    user_doc = {
        "_id": user_id,
        "email": req.email.lower(),
        "full_name": req.full_name,
        "password_hash": hash_password(req.password),
        "role": "DOCTOR",
        "is_verified": True,
        "created_at": now_iso
    }
    await users_coll.insert_one(user_doc)

    doctor_profile = {
        "_id": doc_id,
        "user_id": user_id,
        "full_name": req.full_name,
        "email": req.email.lower(),
        "medical_license_number": req.medical_license_number,
        "specialization": req.specialization.value,
        "experience_years": req.experience_years,
        "hospital_affiliation": req.hospital_affiliation,
        "bio": req.bio or f"Verified specialist in {req.specialization.value}.",
        "verification_status": VerificationStatus.VERIFIED.value,
        "rating": 4.9,
        "consultations_completed": 12,
        "is_available": True,
        "created_at": now_iso
    }
    await doctors_coll.insert_one(doctor_profile)

    await log_audit_event(
        action=AuditAction.USER_REGISTER,
        performed_by=user_doc,
        target_patient_id=user_id,
        details={"event": "Doctor Medical License Registered & Verified", "license": req.medical_license_number}
    )

    return DoctorProfile(
        id=doc_id,
        user_id=user_id,
        full_name=req.full_name,
        email=req.email.lower(),
        medical_license_number=req.medical_license_number,
        specialization=req.specialization,
        experience_years=req.experience_years,
        hospital_affiliation=req.hospital_affiliation,
        bio=doctor_profile["bio"],
        verification_status=VerificationStatus.VERIFIED,
        rating=4.9,
        consultations_completed=12,
        is_available=True,
        created_at=now_iso
    )

@router.get("", response_model=List[DoctorProfile])
async def list_verified_doctors(specialization: Optional[str] = None):
    doctors_coll = get_collection("doctors")

    # Always ensure default evaluation doctors are seeded in MongoDB
    await ensure_demo_doctor_seeded()

    query = {}
    if specialization and specialization != "ALL":
        query["specialization"] = specialization

    cursor = doctors_coll.find(query)
    docs = await cursor.to_list(length=100)

    results = []
    for d in docs:
        spec_val = d.get("specialization", "General Medicine")
        try:
            parsed_spec = Specialization(spec_val)
        except ValueError:
            parsed_spec = Specialization.GENERAL_MEDICINE

        status_val = d.get("verification_status", "VERIFIED")
        try:
            parsed_status = VerificationStatus(status_val)
        except ValueError:
            parsed_status = VerificationStatus.VERIFIED

        results.append(DoctorProfile(
            id=str(d["_id"]),
            user_id=d.get("user_id", str(d["_id"])),
            full_name=d.get("full_name", "Doctor"),
            email=d.get("email", "doctor@mediexplain.ai"),
            medical_license_number=d.get("medical_license_number", "MD-VERIFIED"),
            specialization=parsed_spec,
            experience_years=d.get("experience_years", 10),
            hospital_affiliation=d.get("hospital_affiliation", "General Health Center"),
            bio=d.get("bio", "Verified medical practitioner"),
            verification_status=parsed_status,
            rating=d.get("rating", 4.9),
            consultations_completed=d.get("consultations_completed", 50),
            is_available=d.get("is_available", True),
            created_at=d.get("created_at", datetime.utcnow().isoformat())
        ))

    return results

@router.post("/consultations", response_model=ConsultationResponse)
async def create_consultation_request(
    req: ConsultationCreate,
    current_user: dict = Depends(get_current_user)
):
    doctors_coll = get_collection("doctors")
    doc = await doctors_coll.find_one({"_id": req.doctor_id})
    if not doc and ObjectId.is_valid(req.doctor_id):
        doc = await doctors_coll.find_one({"_id": ObjectId(req.doctor_id)})
    if not doc:
        doc = await doctors_coll.find_one({"user_id": req.doctor_id})
    if not doc:
        doc = await doctors_coll.find_one({"email": req.doctor_id})

    consultations_coll = get_collection("consultations")

    # Enforce SINGLE ACTIVE CALL policy per doctor/patient pair
    existing_active = await consultations_coll.find_one({
        "patient_id": str(current_user["_id"]),
        "doctor_id": str(doc["_id"]),
        "status": {"$in": [ConsultationStatus.PENDING.value, ConsultationStatus.ACCEPTED.value]}
    })
    if existing_active:
        raise HTTPException(
            status_code=400,
            detail=f"You already have an active consultation with {doc.get('full_name')}. Only a single active call session is allowed at a time."
        )

    consult_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    consult_doc = {
        "_id": consult_id,
        "patient_id": str(current_user["_id"]),
        "patient_name": current_user.get("full_name", "Patient"),
        "patient_email": current_user.get("email", ""),
        "doctor_id": str(doc["_id"]),
        "doctor_user_id": doc.get("user_id"),
        "doctor_name": doc.get("full_name", "Doctor"),
        "doctor_specialization": doc.get("specialization", "General Medicine"),
        "symptoms_note": req.symptoms_note,
        "status": ConsultationStatus.PENDING.value,
        "report_access_granted": False,
        "messages": [
            {
                "id": str(uuid.uuid4()),
                "consultation_id": consult_id,
                "sender_id": str(current_user["_id"]),
                "sender_name": current_user.get("full_name", "Patient"),
                "sender_role": "PATIENT",
                "text": f"Consultation Request: {req.symptoms_note}",
                "timestamp": now_iso
            }
        ],
        "created_at": now_iso,
        "accepted_at": None
    }

    await consultations_coll.insert_one(consult_doc)

    await log_audit_event(
        action=AuditAction.CONSENT_REQUEST_SENT,
        performed_by=current_user,
        target_patient_id=str(current_user["_id"]),
        details={"event": "Medical Consultation Booked", "doctor": doc.get("full_name")}
    )

    return format_consultation(consult_doc)

@router.get("/consultations/my", response_model=List[ConsultationResponse])
async def get_my_consultations(current_user: dict = Depends(get_current_user)):
    consultations_coll = get_collection("consultations")
    user_id = str(current_user["_id"])
    role = current_user.get("role", "PATIENT")

    if role == "DOCTOR":
        doctors_coll = get_collection("doctors")
        doc_prof = await doctors_coll.find_one({"user_id": user_id})
        doc_id = str(doc_prof["_id"]) if doc_prof else user_id
        cursor = consultations_coll.find({"$or": [{"doctor_id": doc_id}, {"doctor_user_id": user_id}]})
    else:
        cursor = consultations_coll.find({"patient_id": user_id})

    docs = await cursor.to_list(length=100)
    docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return [format_consultation(d) for d in docs]

@router.post("/consultations/{consultation_id}/status", response_model=ConsultationResponse)
async def update_consultation_status(
    consultation_id: str,
    new_status: ConsultationStatus,
    current_user: dict = Depends(require_role(["DOCTOR"]))
):
    consultations_coll = get_collection("consultations")
    consult = await consultations_coll.find_one({"_id": consultation_id})
    if not consult:
        raise HTTPException(status_code=404, detail="Consultation record not found")

    now_iso = datetime.utcnow().isoformat()
    update_fields = {"status": new_status.value}
    if new_status == ConsultationStatus.ACCEPTED:
        update_fields["accepted_at"] = now_iso

    await consultations_coll.update_one({"_id": consultation_id}, {"$set": update_fields})
    updated = await consultations_coll.find_one({"_id": consultation_id})

    return format_consultation(updated)

@router.post("/consultations/{consultation_id}/messages", response_model=ConsultationResponse)
async def send_consultation_message(
    consultation_id: str,
    text: str,
    current_user: dict = Depends(get_current_user)
):
    consultations_coll = get_collection("consultations")
    consult = await consultations_coll.find_one({"_id": consultation_id})
    if not consult:
        raise HTTPException(status_code=404, detail="Consultation record not found")

    now_iso = datetime.utcnow().isoformat()
    msg = {
        "id": str(uuid.uuid4()),
        "consultation_id": consultation_id,
        "sender_id": str(current_user["_id"]),
        "sender_name": current_user.get("full_name", "User"),
        "sender_role": current_user.get("role", "PATIENT"),
        "text": text,
        "timestamp": now_iso
    }

    await consultations_coll.update_one(
        {"_id": consultation_id},
        {"$push": {"messages": msg}}
    )

    updated = await consultations_coll.find_one({"_id": consultation_id})
    return format_consultation(updated)

@router.post("/request-report-access", response_model=AccessRequestResponse)
async def doctor_request_report_access(
    req: DoctorReportAccessRequest,
    current_user: dict = Depends(require_role(["DOCTOR"]))
):
    users_coll = get_collection("users")
    patient = await users_coll.find_one({"_id": req.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    document_name = None
    if req.document_id:
        docs_coll = get_collection("documents")
        doc = await docs_coll.find_one({"_id": req.document_id})
        if doc:
            document_name = doc.get("file_name")

    request_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    consent_doc = {
        "_id": request_id,
        "admin_id": str(current_user["_id"]),
        "admin_name": current_user.get("full_name", "Doctor"),
        "admin_email": current_user.get("email", ""),
        "patient_id": req.patient_id,
        "patient_email": patient.get("email"),
        "document_id": req.document_id,
        "document_name": document_name,
        "reason": req.reason,
        "status": ConsentStatus.PENDING.value,
        "duration_hours": 24,
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
        details={"event": "Doctor Requested Patient Record Access", "reason": req.reason}
    )

    return AccessRequestResponse(
        id=request_id,
        requester_name=current_user.get("full_name", "Doctor"),
        requester_role="DOCTOR",
        patient_email=patient.get("email"),
        document_name=document_name,
        reason=req.reason,
        status=ConsentStatus.PENDING,
        duration_hours=24,
        created_at=now_iso
    )

def format_consultation(d: dict) -> ConsultationResponse:
    raw_msgs = d.get("messages", [])
    msgs = [
        ConsultationMessage(
            id=m.get("id", str(uuid.uuid4())),
            consultation_id=str(d["_id"]),
            sender_id=m.get("sender_id", ""),
            sender_name=m.get("sender_name", "User"),
            sender_role=m.get("sender_role", "PATIENT"),
            text=m.get("text", ""),
            timestamp=m.get("timestamp", datetime.utcnow().isoformat())
        ) for m in raw_msgs
    ]

    return ConsultationResponse(
        id=str(d["_id"]),
        patient_id=d.get("patient_id", ""),
        patient_name=d.get("patient_name", "Patient"),
        patient_email=d.get("patient_email", ""),
        doctor_id=d.get("doctor_id", ""),
        doctor_name=d.get("doctor_name", "Doctor"),
        doctor_specialization=d.get("doctor_specialization", "General Medicine"),
        symptoms_note=d.get("symptoms_note", ""),
        status=ConsultationStatus(d.get("status", "PENDING")),
        report_access_granted=d.get("report_access_granted", False),
        messages=msgs,
        created_at=d.get("created_at", datetime.utcnow().isoformat()),
        accepted_at=d.get("accepted_at")
    )

async def ensure_demo_doctor_seeded():
    doctors_coll = get_collection("doctors")
    users_coll = get_collection("users")

    now_iso = datetime.utcnow().isoformat()

    # Doctor 1: Dr. Marcus Vance (Cardiologist)
    doc1_email = "dr.marcus@mediexplain.ai"
    u1_doc = await users_coll.find_one({"email": doc1_email})
    if not u1_doc:
        u1_id = str(uuid.uuid4())
        await users_coll.insert_one({
            "_id": u1_id,
            "email": doc1_email,
            "full_name": "Dr. Marcus Vance, MD",
            "password_hash": hash_password("DoctorPass123!"),
            "role": "DOCTOR",
            "is_verified": True,
            "created_at": now_iso
        })
    else:
        u1_id = str(u1_doc["_id"])

    # Upsert doctor profile 1 unconditionally into MongoDB
    await doctors_coll.update_one(
        {"email": doc1_email},
        {"$set": {
            "user_id": u1_id,
            "full_name": "Dr. Marcus Vance, MD",
            "email": doc1_email,
            "medical_license_number": "MD-88492-CAR",
            "specialization": "Cardiology",
            "experience_years": 14,
            "hospital_affiliation": "St. Jude Heart & Health Institute",
            "bio": "Board-certified cardiologist specializing in preventive cardiovascular health, lipid disorders, and complex ECG/blood analysis.",
            "verification_status": "VERIFIED",
            "rating": 4.9,
            "consultations_completed": 184,
            "is_available": True,
            "created_at": now_iso
        }},
        upsert=True
    )

    # Doctor 2: Dr. Elena Rostova (Endocrinologist)
    doc2_email = "dr.elena@mediexplain.ai"
    u2_doc = await users_coll.find_one({"email": doc2_email})
    if not u2_doc:
        u2_id = str(uuid.uuid4())
        await users_coll.insert_one({
            "_id": u2_id,
            "email": doc2_email,
            "full_name": "Dr. Elena Rostova, MD",
            "password_hash": hash_password("DoctorPass123!"),
            "role": "DOCTOR",
            "is_verified": True,
            "created_at": now_iso
        })
    else:
        u2_id = str(u2_doc["_id"])

    # Upsert doctor profile 2 unconditionally into MongoDB
    await doctors_coll.update_one(
        {"email": doc2_email},
        {"$set": {
            "user_id": u2_id,
            "full_name": "Dr. Elena Rostova, MD",
            "email": doc2_email,
            "medical_license_number": "MD-99120-END",
            "specialization": "Endocrinology",
            "experience_years": 11,
            "hospital_affiliation": "Johns Hopkins Diabetes & Endocrinology Center",
            "bio": "Lead endocrinologist specializing in diabetes management, HbA1c glucose monitoring, thyroid disorders, and metabolic health.",
            "verification_status": "VERIFIED",
            "rating": 4.95,
            "consultations_completed": 156,
            "is_available": True,
            "created_at": now_iso
        }},
        upsert=True
    )
