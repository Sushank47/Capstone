from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_collection
from app.models.user import UserResponse, UserRole
from app.security.auth import require_role
from app.config import settings

router = APIRouter(prefix="/api/admin", tags=["Admin Platform Management"])

@router.get("/metrics")
async def get_platform_metrics(current_user: dict = Depends(require_role(["ADMIN"]))):
    users_coll = get_collection("users")
    docs_coll = get_collection("documents")
    consent_coll = get_collection("consent_requests")
    audit_coll = get_collection("audit_logs")

    total_users = await users_coll.count_documents({})
    patients_count = await users_coll.count_documents({"role": "PATIENT"})
    admins_count = await users_coll.count_documents({"role": "ADMIN"})
    
    total_docs = await docs_coll.count_documents({})
    
    # Calculate total storage across platform
    cursor = await users_coll.find({})
    users = await cursor.to_list(length=1000)
    total_storage_bytes = sum(u.get("storage_used_bytes", 0) for u in users)

    pending_access_requests = await consent_coll.count_documents({"status": "PENDING"})
    approved_access_requests = await consent_coll.count_documents({"status": "APPROVED"})
    
    total_audit_events = await audit_coll.count_documents({})

    return {
        "platform_status": "Healthy / Operational",
        "total_users": total_users,
        "patients_count": patients_count,
        "admins_count": admins_count,
        "total_documents_indexed": total_docs,
        "total_storage_used_bytes": total_storage_bytes,
        "total_storage_used_mb": round(total_storage_bytes / (1024 * 1024), 2),
        "pending_consent_requests": pending_access_requests,
        "active_approved_consent_requests": approved_access_requests,
        "total_security_audit_events": total_audit_events,
        "azure_services_status": {
            "azure_blob_storage": "Connected" if settings.AZURE_STORAGE_CONNECTION_STRING else "Fallback Mode (Active)",
            "azure_ai_vision_ocr": "Connected" if settings.AZURE_VISION_KEY else "Fallback Mode (Active)",
            "azure_ai_language": "Connected" if settings.AZURE_LANGUAGE_KEY else "Fallback Mode (Active)",
            "azure_openai": "Connected" if settings.AZURE_OPENAI_KEY else "Fallback Mode (Active)",
            "azure_ai_search_rag": "Connected" if settings.AZURE_SEARCH_KEY else "Fallback Mode (Active)",
            "azure_ai_speech": "Connected" if settings.AZURE_SPEECH_KEY else "Fallback Mode (Active)"
        }
    }

@router.get("/users", response_model=List[UserResponse])
async def list_user_metadata(current_user: dict = Depends(require_role(["ADMIN"]))):
    """
    Returns non-sensitive metadata for users. DOES NOT return medical files or document contents.
    """
    users_coll = get_collection("users")
    docs_coll = get_collection("documents")
    
    cursor = await users_coll.find({})
    users = await cursor.to_list(length=500)

    results = []
    for u in users:
        u_id = str(u["_id"])
        doc_count = await docs_coll.count_documents({"owner_id": u_id})
        results.append(UserResponse(
            id=u_id,
            full_name=u.get("full_name", "User"),
            email=u["email"],
            role=UserRole(u.get("role", "PATIENT")),
            is_verified=u.get("is_verified", True),
            storage_used_bytes=u.get("storage_used_bytes", 0),
            document_count=doc_count,
            created_at=u.get("created_at", "2026-07-31T00:00:00")
        ))
    return results

@router.post("/users/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    payload: dict,
    current_user: dict = Depends(require_role(["ADMIN"]))
):
    users_coll = get_collection("users")
    is_verified = payload.get("is_verified", True)
    await users_coll.update_one({"_id": user_id}, {"$set": {"is_verified": is_verified}})
    return {"message": f"User status updated to verified={is_verified}"}
