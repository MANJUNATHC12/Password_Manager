from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=12, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: UUID
    exp: int
    type: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class VaultEntryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    username: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    url: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    totp_secret: Optional[str] = None


class VaultEntryCreate(VaultEntryBase):
    password: Optional[str] = Field(None)
    custom_fields: Optional[dict] = None


class VaultEntryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    username: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=1)
    url: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    totp_secret: Optional[str] = None


class VaultEntryResponse(VaultEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class VaultEntryListResponse(BaseModel):
    entries: list[VaultEntryResponse]
    total: int


class CategoryResponse(BaseModel):
    category: str
    count: int


class HealthResponse(BaseModel):
    status: str
    database: str
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    detail: str


class SuccessResponse(BaseModel):
    message: str