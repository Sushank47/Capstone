import asyncio
import os
import sys
import json
import uuid
import requests
from datetime import datetime

# Add parent directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db, get_collection
from app.services.azure_blob_service import blob_service
from app.services.azure_vision_service import azure_vision_service
from app.services.azure_language_service import azure_language_service
from app.services.azure_openai_service import azure_openai_service
from app.services.azure_search_rag_service import azure_search_rag_service
from app.models.document import DocumentCategory

DATASET_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "dataset")

TECHNOCULTURE_URL = "https://datasets-server.huggingface.co/rows?dataset=Technoculture%2Fmedical-prescriptions&config=default&split=train&offset=0&length=10"
CLETM_URL = "https://datasets-server.huggingface.co/rows?dataset=CL-ETM%2Fprescriptions&config=default&split=train&offset=0&length=10"

async def import_all_prescriptions_and_datasets(target_patient_email: str = "sarah.patient@example.com"):
    print("=" * 70)
    print("MediPro AI - Prescription & Medical Dataset Batch Training Engine")
    print("=" * 70)

    await init_db()

    # Get or create target patient
    users_coll = get_collection("users")
    user = await users_coll.find_one({"email": target_patient_email.lower()})
    if not user:
        user_id = str(uuid.uuid4())
        user = {
            "_id": user_id,
            "full_name": "Sarah Patient",
            "email": target_patient_email.lower(),
            "role": "PATIENT",
            "storage_used_bytes": 0,
            "document_count": 0,
            "created_at": datetime.utcnow().isoformat()
        }
        await users_coll.insert_one(user)

    patient_id = str(user["_id"])
    docs_coll = get_collection("documents")
    imported_count = 0

    # -------------------------------------------------------------
    # PART 1: Technoculture/medical-prescriptions
    # -------------------------------------------------------------
    print("\n--- [PART 1] Ingesting Technoculture/medical-prescriptions ---")
    try:
        res = requests.get(TECHNOCULTURE_URL, timeout=15)
        if res.status_code == 200:
            rows = res.json().get("rows", [])
            for idx, item in enumerate(rows, 1):
                row = item.get("row", {})
                json_str = row.get("json", "{}")
                try:
                    obj = json.loads(json_str) if isinstance(json_str, str) else json_str
                    patient_name = obj.get("name", f"Patient_{idx}")
                    encounter = obj.get("encounter", {})
                    reason = encounter.get("reasonCode", [{}])[0].get("coding", [{}])[0].get("display", "Medical Encounter")
                    provider = encounter.get("participant", [{}])[0].get("individual", {}).get("display", "Attending Doctor")
                    
                    doc_content = (
                        f"PRESCRIPTION ENCOUNTER RECORD - {patient_name.upper()}\n"
                        f"Patient MRN: {obj.get('medical record number')}\n"
                        f"Age: {obj.get('age')} | Gender: {obj.get('gender')}\n"
                        f"Attending Physician: {provider}\n"
                        f"Primary Diagnosis / Reason: {reason}\n"
                        f"Observations: {json.dumps(obj.get('observations', []), indent=2)}\n"
                    )
                    
                    file_name = f"Technoculture_Prescription_{idx}_{patient_name.replace(' ', '_')}.txt"
                    file_bytes = doc_content.encode("utf-8")
                    
                    blob_path, blob_url = await blob_service.upload_file(patient_id, file_bytes, file_name, "text/plain")
                    entities = await azure_language_service.extract_medical_entities(doc_content)
                    ai_summary = await azure_openai_service.generate_patient_summary(file_name, DocumentCategory.PRESCRIPTION.value, doc_content)

                    doc_id = str(uuid.uuid4())
                    await azure_search_rag_service.index_document(patient_id, doc_id, file_name, DocumentCategory.PRESCRIPTION.value, doc_content)

                    doc_record = {
                        "_id": doc_id,
                        "owner_id": patient_id,
                        "file_name": file_name,
                        "file_type": "dataset/prescription-json",
                        "file_size_bytes": len(file_bytes),
                        "category": DocumentCategory.PRESCRIPTION.value,
                        "tags": ["Technoculture", "MedicalPrescription", "HuggingFace"],
                        "is_favorite": False,
                        "blob_path": blob_path,
                        "blob_url": blob_url,
                        "uploaded_at": datetime.utcnow().isoformat(),
                        "ocr_data": {"extracted_text": doc_content, "confidence": 1.0, "page_count": 1},
                        "entities": [e.model_dump() if hasattr(e, 'model_dump') else e.dict() for e in entities],
                        "ai_summary": ai_summary.model_dump() if hasattr(ai_summary, 'model_dump') else ai_summary.dict(),
                        "indexed_in_search": True
                    }

                    await docs_coll.delete_many({"owner_id": patient_id, "file_name": file_name})
                    await docs_coll.insert_one(doc_record)
                    imported_count += 1
                    print(f"✓ Trained: {file_name}")

                except Exception as e:
                    print(f"Error parsing Technoculture row {idx}: {e}")
    except Exception as e:
        print(f"Error connecting to Technoculture dataset: {e}")

    # -------------------------------------------------------------
    # PART 2: CL-ETM/prescriptions
    # -------------------------------------------------------------
    print("\n--- [PART 2] Ingesting CL-ETM/prescriptions ---")
    try:
        res = requests.get(CLETM_URL, timeout=15)
        if res.status_code == 200:
            rows = res.json().get("rows", [])
            for idx, item in enumerate(rows, 1):
                row = item.get("row", {})
                drug = row.get("drug", "Medication")
                strength = row.get("prod_strength", "")
                dose = row.get("dose_val_rx", "")
                unit = row.get("dose_unit_rx", "")
                route = row.get("route", "Oral")

                doc_content = (
                    f"CLINICAL PRESCRIPTION ORDER #{idx}\n"
                    f"Medication Drug Name: {drug}\n"
                    f"Strength & Form: {strength}\n"
                    f"Dosage: {dose} {unit}\n"
                    f"Route of Administration: {route}\n"
                    f"Doses per 24 Hours: {row.get('doses_per_24_hrs')}\n"
                    f"NDC Code: {row.get('ndc')}\n"
                )

                file_name = f"CL_ETM_Prescription_Order_{idx}_{drug}.txt"
                file_bytes = doc_content.encode("utf-8")

                blob_path, blob_url = await blob_service.upload_file(patient_id, file_bytes, file_name, "text/plain")
                entities = await azure_language_service.extract_medical_entities(doc_content)
                ai_summary = await azure_openai_service.generate_patient_summary(file_name, DocumentCategory.PRESCRIPTION.value, doc_content)

                doc_id = str(uuid.uuid4())
                await azure_search_rag_service.index_document(patient_id, doc_id, file_name, DocumentCategory.PRESCRIPTION.value, doc_content)

                doc_record = {
                    "_id": doc_id,
                    "owner_id": patient_id,
                    "file_name": file_name,
                    "file_type": "dataset/prescription-order",
                    "file_size_bytes": len(file_bytes),
                    "category": DocumentCategory.PRESCRIPTION.value,
                    "tags": ["CL-ETM", "PrescriptionOrder", "HuggingFace"],
                    "is_favorite": False,
                    "blob_path": blob_path,
                    "blob_url": blob_url,
                    "uploaded_at": datetime.utcnow().isoformat(),
                    "ocr_data": {"extracted_text": doc_content, "confidence": 1.0, "page_count": 1},
                    "entities": [e.model_dump() if hasattr(e, 'model_dump') else e.dict() for e in entities],
                    "ai_summary": ai_summary.model_dump() if hasattr(ai_summary, 'model_dump') else ai_summary.dict(),
                    "indexed_in_search": True
                }

                await docs_coll.delete_many({"owner_id": patient_id, "file_name": file_name})
                await docs_coll.insert_one(doc_record)
                imported_count += 1
                print(f"✓ Trained: {file_name}")

    except Exception as e:
        print(f"Error connecting to CL-ETM dataset: {e}")

    # -------------------------------------------------------------
    # PART 3: Local dataset files in dataset/ (healthcare_dataset.csv, etc.)
    # -------------------------------------------------------------
    print("\n--- [PART 3] Ingesting Local dataset/ folder files ---")
    local_files = ["healthcare_dataset.csv", "healthcare-dataset-metadata.json"]
    for l_file in local_files:
        l_path = os.path.join(DATASET_DIR, l_file)
        if os.path.exists(l_path):
            print(f"Processing local dataset file: {l_file}")
            try:
                with open(l_path, "rb") as f:
                    file_bytes = f.read()

                if l_file.endswith(".csv"):
                    try:
                        import csv
                        lines = file_bytes.decode("utf-8", errors="ignore").splitlines()[:50]
                        doc_content = f"HEALTHCARE DATASET RECORDS ({l_file}):\n" + "\n".join(lines)
                    except Exception:
                        doc_content = file_bytes.decode("utf-8", errors="ignore")[:5000]
                else:
                    doc_content = file_bytes.decode("utf-8", errors="ignore")[:5000]

                blob_path, blob_url = await blob_service.upload_file(patient_id, file_bytes, l_file, "text/plain")
                entities = await azure_language_service.extract_medical_entities(doc_content)
                ai_summary = await azure_openai_service.generate_patient_summary(l_file, DocumentCategory.BLOOD_REPORT.value, doc_content)

                doc_id = str(uuid.uuid4())
                await azure_search_rag_service.index_document(patient_id, doc_id, l_file, DocumentCategory.BLOOD_REPORT.value, doc_content)

                doc_record = {
                    "_id": doc_id,
                    "owner_id": patient_id,
                    "file_name": l_file,
                    "file_type": "dataset/csv",
                    "file_size_bytes": len(file_bytes),
                    "category": DocumentCategory.BLOOD_REPORT.value,
                    "tags": ["LocalDataset", "HealthcareCSV"],
                    "is_favorite": False,
                    "blob_path": blob_path,
                    "blob_url": blob_url,
                    "uploaded_at": datetime.utcnow().isoformat(),
                    "ocr_data": {"extracted_text": doc_content, "confidence": 1.0, "page_count": 1},
                    "entities": [e.model_dump() if hasattr(e, 'model_dump') else e.dict() for e in entities],
                    "ai_summary": ai_summary.model_dump() if hasattr(ai_summary, 'model_dump') else ai_summary.dict(),
                    "indexed_in_search": True
                }

                await docs_coll.delete_many({"owner_id": patient_id, "file_name": l_file})
                await docs_coll.insert_one(doc_record)
                imported_count += 1
                print(f"✓ Trained: {l_file}")

            except Exception as e:
                print(f"Error processing local file {l_file}: {e}")

    print("\n" + "=" * 70)
    print(f"🎉 All Prescription & Medical Datasets Trained Successfully! Ingested {imported_count} records.")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(import_all_prescriptions_and_datasets())
