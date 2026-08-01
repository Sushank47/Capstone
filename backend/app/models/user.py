from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRole(str, Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    ADMIN = "ADMIN"

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, example="Jane Doe")
    email: EmailStr = Field(..., example="jane.doe@example.com")
    password: str = Field(..., min_length=6, example="SecurePass123!")
    role: UserRole = UserRole.PATIENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: UserRole
    is_verified: bool = False
    storage_used_bytes: int = 0
    document_count: int = 0
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str
