import asyncio
import os
import sys
import glob
import uuid
import json
import csv
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

async def ingest_dataset_folder(target_patient_email: str = "sarah.patient@example.com"):
    print("=" * 60)
    print("MediPro AI - Dataset Folder Training & Ingestion Engine")
    print("=" * 60)
    
    await init_db()

    # Get or create target patient account
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
    print(f"Target Patient Account: {user['full_name']} ({user['email']})")
    print(f"Scanning Dataset Directory: {DATASET_DIR}")

    os.makedirs(DATASET_DIR, exist_ok=True)
    
    # Recursively find all supported dataset files
    supported_exts = {".pdf", ".png", ".jpg", ".jpeg", ".txt", ".json", ".csv"}
    file_paths = []
    
    for root, dirs, files in os.walk(DATASET_DIR):
        for f in files:
            if f.endswith("README.md") or f.startswith("."):
                continue
            ext = os.path.splitext(f)[1].lower()
            if ext in supported_exts:
                file_paths.append(os.path.join(root, f))

    if not file_paths:
        print("\n⚠️ No dataset files found in dataset/ folder.")
        print("Creating a sample medical training file in dataset/ sample_cbc_report.txt...")
        sample_path = os.path.join(DATASET_DIR, "sample_cbc_report.txt")
        with open(sample_path, "w") as f:
            f.write(
                "COMPLETE BLOOD COUNT & METABOLIC DATASET SAMPLE\n"
                "Patient ID: PT-10029 | Date: 2026-08-01\n"
                "--------------------------------------------------\n"
                "Hemoglobin: 11.2 g/dL (Low)\n"
                "Fasting Blood Sugar: 118 mg/dL (Elevated)\n"
                "Serum Creatinine: 0.9 mg/dL (Normal)\n"
                "Total Cholesterol: 215 mg/dL (High)\n"
                "Prescription: Ferrous Sulfate 325 mg oral daily."
            )
        file_paths.append(sample_path)

    print(f"\nFound {len(file_paths)} dataset files to process and train AI agent.")

    docs_coll = get_collection("documents")
    ingested_count = 0

    for idx, path in enumerate(file_paths, 1):
        file_name = os.path.basename(path)
        rel_path = os.path.relpath(path, DATASET_DIR)
        print(f"\n[{idx}/{len(file_paths)}] Processing dataset file: {rel_path}...")

        try:
            with open(path, "rb") as f:
                file_bytes = f.read()

            file_size = len(file_bytes)
            ext = os.path.splitext(file_name)[1].lower()
            
            # Determine category based on filename
            category = DocumentCategory.BLOOD_REPORT
            fn_lower = file_name.lower()
            if "presc" in fn_lower or "syncora" in fn_lower:
                category = DocumentCategory.PRESCRIPTION
            elif "xray" in fn_lower or "scan" in fn_lower:
                category = DocumentCategory.XRAY_SCAN
            elif "lab" in fn_lower:
                category = DocumentCategory.LAB_REPORT

            # Upload file
            blob_path, blob_url = await blob_service.upload_file(patient_id, file_bytes, file_name, "application/octet-stream")

            # Extract text based on file format
            if ext in [".txt", ".json", ".csv"]:
                raw_text = file_bytes.decode("utf-8", errors="ignore")
                
                if ext == ".csv":
                    # Parse CSV rows for concise medical summaries
                    try:
                        lines = raw_text.splitlines()[:50]  # Take top 50 sample rows for training RAG
                        ocr_text = f"DATASET CSV TABLE ({file_name}):\n" + "\n".join(lines)
                    except Exception:
                        ocr_text = raw_text[:5000]
                elif ext == ".json":
                    try:
                        obj = json.loads(raw_text)
                        # Format JSON nicely
                        ocr_text = f"DATASET JSON RECORD ({file_name}):\n" + json.dumps(obj, indent=2)[:5000]
                    except Exception:
                        ocr_text = raw_text[:5000]
                else:
                    ocr_text = raw_text[:5000]

                ocr_data_dict = {
                    "extracted_text": ocr_text,
                    "confidence": 1.0,
                    "page_count": 1,
                    "processed_at": datetime.utcnow().isoformat()
                }
            else:
                ocr_data = await azure_vision_service.extract_text_from_file(file_bytes, file_name, category.value)
                ocr_text = ocr_data.extracted_text
                ocr_data_dict = ocr_data.model_dump() if hasattr(ocr_data, 'model_dump') else ocr_data.dict()

            print(" -> Extracting clinical entities with Azure AI Language...")
            entities = await azure_language_service.extract_medical_entities(ocr_text)

            print(" -> Generating GPT-4 patient breakdown with Azure OpenAI...")
            ai_summary = await azure_openai_service.generate_patient_summary(file_name, category.value, ocr_text)

            doc_id = str(uuid.uuid4())
            now_iso = datetime.utcnow().isoformat()

            print(" -> Indexing document vectors into Azure AI Search RAG...")
            await azure_search_rag_service.index_document(patient_id, doc_id, file_name, category.value, ocr_text)

            entities_dump = [e.model_dump() if hasattr(e, 'model_dump') else e.dict() for e in entities]
            summary_dump = ai_summary.model_dump() if hasattr(ai_summary, 'model_dump') else ai_summary.dict()

            doc_record = {
                "_id": doc_id,
                "owner_id": patient_id,
                "file_name": file_name,
                "file_type": f"dataset/{ext[1:]}",
                "file_size_bytes": file_size,
                "category": category.value,
                "tags": ["DatasetFolder", "TrainedDataset", os.path.dirname(rel_path) or "root"],
                "is_favorite": False,
                "blob_path": blob_path,
                "blob_url": blob_url,
                "uploaded_at": now_iso,
                "ocr_data": ocr_data_dict,
                "entities": entities_dump,
                "ai_summary": summary_dump,
                "indexed_in_search": True
            }

            # Upsert into database
            await docs_coll.delete_many({"owner_id": patient_id, "file_name": file_name})
            await docs_coll.insert_one(doc_record)
            ingested_count += 1
            print(f"✓ Successfully trained & indexed dataset file '{file_name}'!")

        except Exception as e:
            print(f"Error processing dataset file '{file_name}': {e}")

    print("\n" + "=" * 60)
    print(f"🎉 Dataset Training Complete! Trained {ingested_count} dataset files into MediPro AI.")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(ingest_dataset_folder())
