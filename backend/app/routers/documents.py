import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Response, status
from fastapi.responses import StreamingResponse
from app.database import get_collection
from app.models.document import DocumentCategory, DocumentResponse, DocumentUpdate
from app.security.auth import get_current_user
from app.security.consent_check import check_document_access_permission
from app.services.azure_blob_service import blob_service
from app.services.azure_vision_service import azure_vision_service
from app.services.azure_language_service import azure_language_service
from app.services.azure_openai_service import azure_openai_service
from app.services.azure_search_rag_service import azure_search_rag_service
from app.services.pdf_export_service import generate_pdf_summary
from app.services.audit_service import log_audit_event
from app.models.audit import AuditAction

router = APIRouter(prefix="/api/documents", tags=["Document Management"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    category: DocumentCategory = Form(DocumentCategory.BLOOD_REPORT),
    tags: str = Form(""),  # Comma-separated tags
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    file_bytes = await file.read()
    file_size = len(file_bytes)
    file_name = file.filename or "medical_report.pdf"
    content_type = file.content_type or "application/pdf"
    
    # 1. Upload file to Azure Blob Storage / Local disk
    blob_path, blob_url = await blob_service.upload_file(user_id, file_bytes, file_name, content_type)
    
    # Parse tags list
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    doc_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    # 2. Run Azure AI Vision (OCR)
    ocr_data = await azure_vision_service.extract_text_from_file(file_bytes, file_name, category.value)

    # 3. Run Azure AI Language (Medical Entity Extraction)
    entities = await azure_language_service.extract_medical_entities(ocr_data.extracted_text)

    # 4. Run Azure OpenAI (Patient Summary Generation)
    ai_summary = await azure_openai_service.generate_patient_summary(file_name, category.value, ocr_data.extracted_text)

    # 5. Index in Azure AI Search RAG
    await azure_search_rag_service.index_document(user_id, doc_id, file_name, category.value, ocr_data.extracted_text)

    # 6. Save document record to MongoDB
    doc_record = {
        "_id": doc_id,
        "owner_id": user_id,
        "file_name": file_name,
        "file_type": content_type,
        "file_size_bytes": file_size,
        "category": category.value,
        "tags": tag_list,
        "is_favorite": False,
        "blob_path": blob_path,
        "blob_url": blob_url,
        "uploaded_at": now_iso,
        "ocr_data": ocr_data.dict(),
        "entities": [e.dict() for e in entities],
        "ai_summary": ai_summary.dict(),
        "indexed_in_search": True
    }

    docs_coll = get_collection("documents")
    await docs_coll.insert_one(doc_record)

    # Update user storage usage
    users_coll = get_collection("users")
    await users_coll.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"storage_used_bytes": file_size, "document_count": 1}}
    )

    # Audit log entry
    await log_audit_event(
        action=AuditAction.DOCUMENT_UPLOAD,
        performed_by=current_user,
        target_patient_id=user_id,
        document_id=doc_id,
        document_name=file_name,
        reason=f"Uploaded new medical document under category '{category.value}'"
    )

    return DocumentResponse(
        id=doc_id,
        owner_id=user_id,
        file_name=file_name,
        file_type=content_type,
        file_size_bytes=file_size,
        category=category,
        tags=tag_list,
        is_favorite=False,
        blob_url=blob_url,
        uploaded_at=now_iso,
        ocr_data=ocr_data,
        entities=entities,
        ai_summary=ai_summary,
        indexed_in_search=True
    )

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    category: Optional[DocumentCategory] = None,
    search: Optional[str] = None,
    favorite_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    docs_coll = get_collection("documents")
    
    query = {"owner_id": user_id}
    if category:
        query["category"] = category.value
    if favorite_only:
        query["is_favorite"] = True
    
    cursor = docs_coll.find(query)
    doc_list = await cursor.to_list(length=500)
    
    results = []
    for d in doc_list:
        if search:
            term = search.lower()
            fname = d.get("file_name", "").lower()
            cat = d.get("category", "").lower()
            tags = " ".join(d.get("tags", [])).lower()
            if term not in fname and term not in cat and term not in tags:
                continue
                
        results.append(DocumentResponse(
            id=str(d["_id"]),
            owner_id=str(d["owner_id"]),
            file_name=d["file_name"],
            file_type=d["file_type"],
            file_size_bytes=d["file_size_bytes"],
            category=DocumentCategory(d["category"]),
            tags=d.get("tags", []),
            is_favorite=d.get("is_favorite", False),
            blob_url=d["blob_url"],
            uploaded_at=d["uploaded_at"],
            ocr_data=d.get("ocr_data"),
            entities=d.get("entities", []),
            ai_summary=d.get("ai_summary"),
            indexed_in_search=d.get("indexed_in_search", True)
        ))
    
    return results

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document_by_id(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    docs_coll = get_collection("documents")
    doc = await docs_coll.find_one({"_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Zero-Trust Consent Check
    await check_document_access_permission(current_user, doc)
    
    # Audit log
    await log_audit_event(
        action=AuditAction.DOCUMENT_VIEW,
        performed_by=current_user,
        target_patient_id=str(doc["owner_id"]),
        document_id=document_id,
        document_name=doc.get("file_name"),
        reason="Viewed document details"
    )
    
    return DocumentResponse(
        id=str(doc["_id"]),
        owner_id=str(doc["owner_id"]),
        file_name=doc["file_name"],
        file_type=doc["file_type"],
        file_size_bytes=doc["file_size_bytes"],
        category=DocumentCategory(doc["category"]),
        tags=doc.get("tags", []),
        is_favorite=doc.get("is_favorite", False),
        blob_url=doc["blob_url"],
        uploaded_at=doc["uploaded_at"],
        ocr_data=doc.get("ocr_data"),
        entities=doc.get("entities", []),
        ai_summary=doc.get("ai_summary"),
        indexed_in_search=doc.get("indexed_in_search", True)
    )

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    update_data: DocumentUpdate,
    current_user: dict = Depends(get_current_user)
):
    docs_coll = get_collection("documents")
    doc = await docs_coll.find_one({"_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await check_document_access_permission(current_user, doc)
    
    updates = {}
    if update_data.category is not None:
        updates["category"] = update_data.category.value
    if update_data.tags is not None:
        updates["tags"] = update_data.tags
    if update_data.is_favorite is not None:
        updates["is_favorite"] = update_data.is_favorite
        
    if updates:
        await docs_coll.update_one({"_id": document_id}, {"$set": updates})
        doc.update(updates)

    return DocumentResponse(
        id=str(doc["_id"]),
        owner_id=str(doc["owner_id"]),
        file_name=doc["file_name"],
        file_type=doc["file_type"],
        file_size_bytes=doc["file_size_bytes"],
        category=DocumentCategory(doc["category"]),
        tags=doc.get("tags", []),
        is_favorite=doc.get("is_favorite", False),
        blob_url=doc["blob_url"],
        uploaded_at=doc["uploaded_at"],
        ocr_data=doc.get("ocr_data"),
        entities=doc.get("entities", []),
        ai_summary=doc.get("ai_summary"),
        indexed_in_search=doc.get("indexed_in_search", True)
    )

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    docs_coll = get_collection("documents")
    doc = await docs_coll.find_one({"_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await check_document_access_permission(current_user, doc)
    
    user_id = str(doc["owner_id"])
    file_name = doc["file_name"]
    
    # Delete from blob storage
    await blob_service.delete_file(user_id, file_name)
    await docs_coll.delete_one({"_id": document_id})
    
    # Decrement storage size
    users_coll = get_collection("users")
    await users_coll.update_one(
        {"_id": doc["owner_id"]},
        {"$inc": {"storage_used_bytes": -doc["file_size_bytes"]}}
    )
    
    await log_audit_event(
        action=AuditAction.DOCUMENT_DELETE,
        performed_by=current_user,
        target_patient_id=user_id,
        document_id=document_id,
        document_name=file_name,
        reason="Permanently deleted medical document"
    )
    
    return {"message": "Document successfully deleted."}

@router.get("/{document_id}/pdf-export")
async def export_document_pdf(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    docs_coll = get_collection("documents")
    doc = await docs_coll.find_one({"_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await check_document_access_permission(current_user, doc)
    
    pdf_bytes = generate_pdf_summary(doc)
    
    await log_audit_event(
        action=AuditAction.DOCUMENT_DOWNLOAD,
        performed_by=current_user,
        target_patient_id=str(doc["owner_id"]),
        document_id=document_id,
        document_name=doc.get("file_name"),
        reason="Downloaded AI Medical Summary PDF report"
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{doc.get("file_name", "report")}_summary.pdf"'}
    )

@router.get("/file-stream/{user_id}/{file_name}")
async def stream_file(user_id: str, file_name: str):
    # Public local file streaming handler for offline blob preview
    try:
        data = await blob_service.get_file_bytes(user_id, file_name)
        media_type = "application/pdf" if file_name.endswith(".pdf") else "image/png"
        return Response(content=data, media_type=media_type)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File content not found")
