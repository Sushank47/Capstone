import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_collection
from app.models.chat import ChatRequest, ChatResponse, ChatMessage
from app.security.auth import get_optional_current_user, get_current_user
from app.services.azure_search_rag_service import azure_search_rag_service
from app.services.azure_speech_service import azure_speech_service
from app.services.audit_service import log_audit_event
from app.models.audit import AuditAction

router = APIRouter(prefix="/api/chat", tags=["Medical RAG Assistant"])

@router.post("", response_model=ChatResponse)
async def ask_medical_assistant(
    req: ChatRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    user_id = str(current_user["_id"]) if current_user else None
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Chat message content cannot be empty.")

    # Execute RAG query (grounded in user docs if user_id present, or public health guidance if None)
    chat_response = await azure_search_rag_service.query_patient_documents(user_id, req.message)

    # Optional speech synthesis if requested
    if req.voice_enabled:
        audio_b64 = await azure_speech_service.text_to_speech_base64(chat_response.assistant_message.text)
        chat_response.audio_base64 = audio_b64

    # ONLY SAVE CHAT HISTORY TO DATABASE IF USER IS LOGGED IN
    if current_user and user_id:
        chat_coll = get_collection("chat_history")
        history_entry = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "conversation_id": chat_response.conversation_id,
            "user_message": chat_response.user_message.dict(),
            "assistant_message": chat_response.assistant_message.dict(),
            "created_at": datetime.utcnow().isoformat()
        }
        await chat_coll.insert_one(history_entry)

        # Audit log entry for logged-in user
        await log_audit_event(
            action=AuditAction.AI_ANALYSIS_RUN,
            performed_by=current_user,
            target_patient_id=user_id,
            reason=f"Authenticated patient queried Medical RAG Chatbot: '{req.message[:60]}...'"
        )

    return chat_response

@router.get("/history", response_model=List[dict])
async def get_user_chat_history(current_user: dict = Depends(get_current_user)):
    """
    Returns saved persistent chat history ONLY for authenticated logged-in users.
    """
    user_id = str(current_user["_id"])
    chat_coll = get_collection("chat_history")
    cursor = chat_coll.find({"user_id": user_id})
    entries = await cursor.to_list(length=200)
    entries.sort(key=lambda x: x.get("created_at", ""))
    return entries

@router.delete("/history")
async def clear_user_chat_history(current_user: dict = Depends(get_current_user)):
    """
    Clears saved persistent chat history for the authenticated user.
    """
    user_id = str(current_user["_id"])
    chat_coll = get_collection("chat_history")
    result = await chat_coll.delete_many({"user_id": user_id})
    return {"status": "success", "deleted_count": result.deleted_count}

