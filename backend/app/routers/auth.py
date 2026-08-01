import uuid
import random
from datetime import datetime
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_collection
from app.models.user import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    OTPVerifyRequest, ForgotPasswordRequest, ResetPasswordRequest
)
from app.security.auth import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from app.services.audit_service import log_audit_event
from app.models.audit import AuditAction

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class GoogleAuthRequest(BaseModel):
    email: EmailStr
    full_name: str
    google_id: str
    picture_url: str = ""

@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserCreate):
    users_coll = get_collection("users")
    
    # Check if email exists
    existing = await users_coll.find_one({"email": user_in.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please Sign In."
        )
    
    user_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()
    
    # Generate 6-digit verification OTP code
    otp_code = str(random.randint(100000, 999999))
    
    user_doc = {
        "_id": user_id,
        "full_name": user_in.full_name,
        "email": user_in.email.lower(),
        "password_hash": hash_password(user_in.password),
        "role": user_in.role.value,
        "is_verified": False,
        "otp_code": otp_code,
        "storage_used_bytes": 0,
        "document_count": 0,
        "created_at": now_iso
    }
    
    await users_coll.insert_one(user_doc)
    
    # Log Audit Event
    await log_audit_event(
        action=AuditAction.USER_REGISTER,
        performed_by={"_id": user_id, "full_name": user_in.full_name, "role": user_in.role.value},
        target_patient_id=user_id,
        reason=f"New user registered with role {user_in.role.value}"
    )
    
    user_resp = UserResponse(
        id=user_id,
        full_name=user_in.full_name,
        email=user_in.email.lower(),
        role=user_in.role,
        is_verified=False,
        storage_used_bytes=0,
        document_count=0,
        created_at=now_iso
    )
    
    access_token = create_access_token({"sub": user_id, "role": user_in.role.value})
    refresh_token = create_refresh_token({"sub": user_id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_resp
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    users_coll = get_collection("users")
    user = await users_coll.find_one({"email": credentials.email.lower()})
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password combination."
        )
    
    user_id = str(user["_id"])
    
    await log_audit_event(
        action=AuditAction.USER_LOGIN,
        performed_by=user,
        target_patient_id=user_id,
        reason="Successful authentication login"
    )
    
    user_resp = UserResponse(
        id=user_id,
        full_name=user["full_name"],
        email=user["email"],
        role=user["role"],
        is_verified=user.get("is_verified", True),
        storage_used_bytes=user.get("storage_used_bytes", 0),
        document_count=user.get("document_count", 0),
        created_at=user.get("created_at", datetime.utcnow().isoformat())
    )
    
    access_token = create_access_token({"sub": user_id, "role": user["role"]})
    refresh_token = create_refresh_token({"sub": user_id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_resp
    )

@router.post("/google", response_model=TokenResponse)
async def google_auth(req: GoogleAuthRequest):
    """Direct Sign In / Sign Up with Google Authentication."""
    users_coll = get_collection("users")
    user = await users_coll.find_one({"email": req.email.lower()})
    
    now_iso = datetime.utcnow().isoformat()
    if not user:
        user_id = str(uuid.uuid4())
        user_doc = {
            "_id": user_id,
            "full_name": req.full_name,
            "email": req.email.lower(),
            "google_id": req.google_id,
            "picture_url": req.picture_url,
            "role": "PATIENT",
            "is_verified": True, # Google accounts are pre-verified
            "storage_used_bytes": 0,
            "document_count": 0,
            "created_at": now_iso
        }
        await users_coll.insert_one(user_doc)
        user = user_doc
    else:
        user_id = str(user["_id"])
        await users_coll.update_one({"_id": user_id}, {"$set": {"is_verified": True}})

    await log_audit_event(
        action=AuditAction.USER_LOGIN,
        performed_by=user,
        target_patient_id=user_id,
        reason="Successful direct Google OAuth login"
    )

    user_resp = UserResponse(
        id=user_id,
        full_name=user["full_name"],
        email=user["email"],
        role=user["role"],
        is_verified=True,
        storage_used_bytes=user.get("storage_used_bytes", 0),
        document_count=user.get("document_count", 0),
        created_at=user.get("created_at", now_iso)
    )

    access_token = create_access_token({"sub": user_id, "role": user["role"]})
    refresh_token = create_refresh_token({"sub": user_id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_resp
    )

@router.post("/verify-otp")
async def verify_otp(req: OTPVerifyRequest):
    users_coll = get_collection("users")
    user = await users_coll.find_one({"email": req.email.lower()})
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Accept 123456 as master override or saved code
    if req.otp_code.strip() != str(user.get("otp_code", "")).strip() and req.otp_code.strip() != "123456":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid verification code. Use '{user.get('otp_code', '123456')}' or '123456'")
    
    await users_coll.update_one({"_id": user["_id"]}, {"$set": {"is_verified": True}})
    return {"message": "Account email successfully verified."}

@router.post("/resend-otp")
async def resend_otp(email: str):
    users_coll = get_collection("users")
    user = await users_coll.find_one({"email": email.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_otp = str(random.randint(100000, 999999))
    await users_coll.update_one({"_id": user["_id"]}, {"$set": {"otp_code": new_otp}})
    return {"message": "Confirmation code resent.", "otp_code": new_otp}

@router.post("/refresh")
async def refresh_token(token: str):
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    users_coll = get_collection("users")
    user = await users_coll.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_access_token = create_access_token({"sub": user_id, "role": user["role"]})
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    docs_coll = get_collection("documents")
    doc_count = await docs_coll.count_documents({"owner_id": user_id})
    
    return UserResponse(
        id=user_id,
        full_name=current_user["full_name"],
        email=current_user["email"],
        role=current_user["role"],
        is_verified=current_user.get("is_verified", True),
        storage_used_bytes=current_user.get("storage_used_bytes", 0),
        document_count=doc_count,
        created_at=current_user.get("created_at", datetime.utcnow().isoformat())
    )
