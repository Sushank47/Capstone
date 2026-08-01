from fastapi import APIRouter, HTTPException, Depends
from app.database import get_collection
from app.models.document import ReportComparisonRequest, ReportComparisonResponse, DocumentResponse, DocumentCategory
from app.security.auth import get_current_user
from app.security.consent_check import check_document_access_permission
from app.services.azure_openai_service import azure_openai_service
from app.services.azure_speech_service import azure_speech_service
from app.services.audit_service import log_audit_event
from app.models.audit import AuditAction

router = APIRouter(prefix="/api/ai", tags=["Azure AI Services"])

@router.post("/speech-tts")
async def generate_speech_audio(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text payload is required")
    
    audio_b64 = await azure_speech_service.text_to_speech_base64(text)
    return {"audio_base64": audio_b64, "format": "audio/wav"}

@router.post("/compare", response_model=ReportComparisonResponse)
async def compare_medical_reports(
    req: ReportComparisonRequest,
    current_user: dict = Depends(get_current_user)
):
    docs_coll = get_collection("documents")
    doc1 = await docs_coll.find_one({"_id": req.document_id_1})
    doc2 = await docs_coll.find_one({"_id": req.document_id_2})

    if not doc1 or not doc2:
        raise HTTPException(status_code=404, detail="One or both medical reports were not found.")

    await check_document_access_permission(current_user, doc1)
    await check_document_access_permission(current_user, doc2)

    comp_res = await azure_openai_service.compare_reports(doc1, doc2)

    await log_audit_event(
        action=AuditAction.AI_ANALYSIS_RUN,
        performed_by=current_user,
        target_patient_id=str(doc1["owner_id"]),
        reason=f"Executed AI Report Comparison between '{doc1.get('file_name')}' and '{doc2.get('file_name')}'"
    )

    doc1_resp = DocumentResponse(
        id=str(doc1["_id"]),
        owner_id=str(doc1["owner_id"]),
        file_name=doc1["file_name"],
        file_type=doc1["file_type"],
        file_size_bytes=doc1["file_size_bytes"],
        category=DocumentCategory(doc1["category"]),
        tags=doc1.get("tags", []),
        is_favorite=doc1.get("is_favorite", False),
        blob_url=doc1["blob_url"],
        uploaded_at=doc1["uploaded_at"],
        ocr_data=doc1.get("ocr_data"),
        entities=doc1.get("entities", []),
        ai_summary=doc1.get("ai_summary"),
        indexed_in_search=doc1.get("indexed_in_search", True)
    )

    doc2_resp = DocumentResponse(
        id=str(doc2["_id"]),
        owner_id=str(doc2["owner_id"]),
        file_name=doc2["file_name"],
        file_type=doc2["file_type"],
        file_size_bytes=doc2["file_size_bytes"],
        category=DocumentCategory(doc2["category"]),
        tags=doc2.get("tags", []),
        is_favorite=doc2.get("is_favorite", False),
        blob_url=doc2["blob_url"],
        uploaded_at=doc2["uploaded_at"],
        ocr_data=doc2.get("ocr_data"),
        entities=doc2.get("entities", []),
        ai_summary=doc2.get("ai_summary"),
        indexed_in_search=doc2.get("indexed_in_search", True)
    )

    return ReportComparisonResponse(
        document_1=doc1_resp,
        document_2=doc2_resp,
        diff_summary=comp_res.get("diff_summary", ""),
        improved_metrics=comp_res.get("improved_metrics", []),
        worsened_metrics=comp_res.get("worsened_metrics", []),
        stable_metrics=comp_res.get("stable_metrics", []),
        recommendations=comp_res.get("recommendations", []),
        medical_disclaimer=comp_res.get("medical_disclaimer", "")
    )
