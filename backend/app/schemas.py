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


# ─── Gym Schemas ───────────────────────────────────────────────

class GymSetSchema(BaseModel):
    set_number: int = 1
    reps: int = 10
    weight_kg: float = 0.0
    completed: bool = False


class GymExerciseCreate(BaseModel):
    exercise_name: str
    muscle_group: str = "Chest"
    sets_data: list[GymSetSchema] = Field(default_factory=list)
    notes: Optional[str] = None


class GymExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workout_id: UUID
    exercise_name: str
    muscle_group: str
    sets_data: Optional[list] = None
    notes: Optional[str] = None
    created_at: datetime


class GymWorkoutCreate(BaseModel):
    date: str  # YYYY-MM-DD
    title: str
    week_number: int = 1
    day_number: int = 1
    target_muscle: Optional[str] = None
    notes: Optional[str] = None
    exercises: list[GymExerciseCreate] = Field(default_factory=list)


class GymWorkoutUpdate(BaseModel):
    title: Optional[str] = None
    week_number: Optional[int] = None
    day_number: Optional[int] = None
    target_muscle: Optional[str] = None
    notes: Optional[str] = None
    completed: Optional[bool] = None


class GymWorkoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    date: str
    title: str
    week_number: int
    day_number: int
    target_muscle: Optional[str] = None
    notes: Optional[str] = None
    completed: bool
    created_at: datetime
    updated_at: datetime
    exercises: list[GymExerciseResponse] = Field(default_factory=list)


class GymDietCreate(BaseModel):
    date: str  # YYYY-MM-DD
    meal_type: str = "Breakfast"
    food_name: str
    calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0
    notes: Optional[str] = None


class GymDietResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    date: str
    meal_type: str
    food_name: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    notes: Optional[str] = None
    created_at: datetime


class GymWeightCreate(BaseModel):
    date: str  # YYYY-MM-DD
    weight_kg: float
    body_fat_pct: Optional[float] = None
    notes: Optional[str] = None


class GymWeightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    date: str
    weight_kg: float
    body_fat_pct: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime


class GymSummaryResponse(BaseModel):
    total_workouts: int
    completed_workouts: int
    total_exercises: int
    avg_calories_per_day: float
    latest_weight: Optional[float] = None
    weight_change: Optional[float] = None
    current_week: int