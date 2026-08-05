import asyncio
import os
import sys
import requests
import uuid
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

DATASET_API_URL = "https://datasets-server.huggingface.co/rows?dataset=RootCauseAnalytics%2Fsynthetic-australian-medical-documents-sample&config=default&split=train&offset=0&length=10"

async def import_hf_medical_dataset(target_patient_email: str = "sarah.patient@example.com"):
    print("Initializing MediPro AI Dataset Importer...")
    await init_db()

    users_coll = get_collection("users")
    user = await users_coll.find_one({"email": target_patient_email.lower()})
    if not user:
        print(f"Patient account '{target_patient_email}' not found. Creating default patient...")
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
    print(f"Importing medical documents into account: {user['full_name']} ({user['email']})")

    response = requests.get(DATASET_API_URL)
    if response.status_code != 200:
        print(f"Failed to fetch dataset from Hugging Face API: {response.text}")
        return

    data = response.json()
    rows = data.get("rows", [])
    print(f"Found {len(rows)} medical records in Hugging Face dataset.")

    categories = [
        DocumentCategory.BLOOD_REPORT,
        DocumentCategory.PRESCRIPTION,
        DocumentCategory.LAB_REPORT,
        DocumentCategory.DISCHARGE_SUMMARY,
        DocumentCategory.XRAY_SCAN
    ]

    imported_count = 0
    docs_coll = get_collection("documents")

    for idx, item in enumerate(rows, 1):
        row_data = item.get("row", {})
        pdf_info = row_data.get("pdf", {})
        pdf_url = pdf_info.get("src")

        if not pdf_url:
            continue

        file_name = f"HF_Australian_Medical_Report_{idx}.pdf"
        category = categories[(idx - 1) % len(categories)]

        try:
            print(f"\n[{idx}/{len(rows)}] Downloading {file_name} from Hugging Face...")
            pdf_res = requests.get(pdf_url, timeout=15)
            if pdf_res.status_code != 200:
                print(f"Could not download PDF from {pdf_url}")
                continue

            file_bytes = pdf_res.content
            file_size = len(file_bytes)

            # Upload to storage
            blob_path, blob_url = await blob_service.upload_file(patient_id, file_bytes, file_name, "application/pdf")

            # Azure AI Pipeline
            print(" -> Running Azure AI Vision (OCR)...")
            ocr_data = await azure_vision_service.extract_text_from_file(file_bytes, file_name, category.value)

            print(" -> Running Azure AI Language (Medical Entity Extraction)...")
            entities = await azure_language_service.extract_medical_entities(ocr_data.extracted_text)

            print(" -> Running Azure OpenAI (Patient Breakdown)...")
            ai_summary = await azure_openai_service.generate_patient_summary(file_name, category.value, ocr_data.extracted_text)

            doc_id = str(uuid.uuid4())
            now_iso = datetime.utcnow().isoformat()

            print(" -> Indexing into Azure AI Search RAG Vector Store...")
            await azure_search_rag_service.index_document(patient_id, doc_id, file_name, category.value, ocr_data.extracted_text)

            doc_record = {
                "_id": doc_id,
                "owner_id": patient_id,
                "file_name": file_name,
                "file_type": "application/pdf",
                "file_size_bytes": file_size,
                "category": category.value,
                "tags": ["HuggingFace", "AustralianMedical", "ImportedDataset"],
                "is_favorite": idx == 1,
                "blob_path": blob_path,
                "blob_url": blob_url,
                "uploaded_at": now_iso,
                "ocr_data": ocr_data.dict(),
                "entities": [e.dict() for e in entities],
                "ai_summary": ai_summary.dict(),
                "indexed_in_search": True
            }

            await docs_coll.insert_one(doc_record)
            imported_count += 1
            print(f"✓ Successfully imported {file_name} into Medical Vault!")

        except Exception as e:
            print(f"Error importing row {idx}: {e}")

    print(f"\n🎉 Import Complete! Imported {imported_count} medical documents from Hugging Face dataset into MediPro AI.")

if __name__ == "__main__":
    asyncio.run(import_hf_medical_dataset())
