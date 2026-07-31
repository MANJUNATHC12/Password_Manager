from typing import Optional
from datetime import datetime, date
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.database import get_db_dependency
from app.auth.dependencies import get_current_user
from app.models import GymWorkout, GymExercise, GymDietLog, GymWeightLog

router = APIRouter(prefix="/gym", tags=["Gym"])

# ─── PRESET EXERCISES LIBRARY ──────────────────────────────────────────

PRESET_EXERCISES = {
    "Chest": [
        {"name": "Barbell Bench Press", "muscle": "Chest", "default_sets": 4, "default_reps": 10, "default_weight": 60},
        {"name": "Incline Dumbbell Press", "muscle": "Chest", "default_sets": 3, "default_reps": 12, "default_weight": 22},
        {"name": "Decline Barbell Press", "muscle": "Chest", "default_sets": 3, "default_reps": 10, "default_weight": 50},
        {"name": "Dumbbell Chest Flyes", "muscle": "Chest", "default_sets": 3, "default_reps": 12, "default_weight": 14},
        {"name": "Cable Crossover Flyes", "muscle": "Chest", "default_sets": 4, "default_reps": 15, "default_weight": 15},
        {"name": "Chest Dips", "muscle": "Chest", "default_sets": 3, "default_reps": 10, "default_weight": 0},
        {"name": "Push-Ups", "muscle": "Chest", "default_sets": 4, "default_reps": 20, "default_weight": 0},
        {"name": "Dumbbell Pullover", "muscle": "Chest", "default_sets": 3, "default_reps": 12, "default_weight": 18},
    ],
    "Back": [
        {"name": "Barbell Deadlift", "muscle": "Back", "default_sets": 4, "default_reps": 6, "default_weight": 100},
        {"name": "Lat Pulldown", "muscle": "Back", "default_sets": 4, "default_reps": 12, "default_weight": 55},
        {"name": "Bent-Over Barbell Row", "muscle": "Back", "default_sets": 4, "default_reps": 10, "default_weight": 50},
        {"name": "Seated Cable Row", "muscle": "Back", "default_sets": 3, "default_reps": 12, "default_weight": 45},
        {"name": "Pull-Ups / Chin-Ups", "muscle": "Back", "default_sets": 3, "default_reps": 8, "default_weight": 0},
        {"name": "Single-Arm Dumbbell Row", "muscle": "Back", "default_sets": 3, "default_reps": 12, "default_weight": 24},
        {"name": "T-Bar Row", "muscle": "Back", "default_sets": 3, "default_reps": 10, "default_weight": 40},
        {"name": "Hyperextensions (Back Extensions)", "muscle": "Back", "default_sets": 3, "default_reps": 15, "default_weight": 10},
    ],
    "Legs": [
        {"name": "Barbell Back Squat", "muscle": "Legs", "default_sets": 4, "default_reps": 8, "default_weight": 80},
        {"name": "Leg Press", "muscle": "Legs", "default_sets": 4, "default_reps": 12, "default_weight": 120},
        {"name": "Romanian Deadlift", "muscle": "Legs", "default_sets": 3, "default_reps": 10, "default_weight": 60},
        {"name": "Lying Leg Curl", "muscle": "Legs", "default_sets": 3, "default_reps": 12, "default_weight": 35},
        {"name": "Leg Extensions", "muscle": "Legs", "default_sets": 3, "default_reps": 15, "default_weight": 40},
        {"name": "Dumbbell Walking Lunges", "muscle": "Legs", "default_sets": 3, "default_reps": 12, "default_weight": 16},
        {"name": "Standing Calf Raise", "muscle": "Legs", "default_sets": 4, "default_reps": 15, "default_weight": 50},
        {"name": "Goblet Squats", "muscle": "Legs", "default_sets": 3, "default_reps": 12, "default_weight": 20},
    ],
    "Shoulders": [
        {"name": "Overhead Barbell Military Press", "muscle": "Shoulders", "default_sets": 4, "default_reps": 8, "default_weight": 40},
        {"name": "Seated Dumbbell Shoulder Press", "muscle": "Shoulders", "default_sets": 3, "default_reps": 10, "default_weight": 20},
        {"name": "Lateral Dumbbell Raises", "muscle": "Shoulders", "default_sets": 4, "default_reps": 15, "default_weight": 10},
        {"name": "Front Dumbbell Raises", "muscle": "Shoulders", "default_sets": 3, "default_reps": 12, "default_weight": 10},
        {"name": "Rear Delt Cable Flyes", "muscle": "Shoulders", "default_sets": 3, "default_reps": 15, "default_weight": 12},
        {"name": "Arnold Press", "muscle": "Shoulders", "default_sets": 3, "default_reps": 10, "default_weight": 18},
        {"name": "Face Pulls", "muscle": "Shoulders", "default_sets": 4, "default_reps": 15, "default_weight": 25},
        {"name": "Barbell Upright Rows", "muscle": "Shoulders", "default_sets": 3, "default_reps": 12, "default_weight": 30},
    ],
    "Biceps": [
        {"name": "Barbell Bicep Curl", "muscle": "Biceps", "default_sets": 4, "default_reps": 10, "default_weight": 30},
        {"name": "Dumbbell Hammer Curls", "muscle": "Biceps", "default_sets": 3, "default_reps": 12, "default_weight": 14},
        {"name": "Preacher Curl", "muscle": "Biceps", "default_sets": 3, "default_reps": 10, "default_weight": 25},
        {"name": "Incline Dumbbell Curl", "muscle": "Biceps", "default_sets": 3, "default_reps": 12, "default_weight": 12},
        {"name": "Concentration Curl", "muscle": "Biceps", "default_sets": 3, "default_reps": 12, "default_weight": 10},
        {"name": "Cable Bicep Curls", "muscle": "Biceps", "default_sets": 3, "default_reps": 15, "default_weight": 20},
    ],
    "Triceps": [
        {"name": "Tricep Rope Pushdown", "muscle": "Triceps", "default_sets": 4, "default_reps": 12, "default_weight": 30},
        {"name": "Skull Crushers (Lying Tricep Ext)", "muscle": "Triceps", "default_sets": 3, "default_reps": 10, "default_weight": 25},
        {"name": "Close-Grip Bench Press", "muscle": "Triceps", "default_sets": 3, "default_reps": 8, "default_weight": 50},
        {"name": "Tricep Bench Dips", "muscle": "Triceps", "default_sets": 3, "default_reps": 15, "default_weight": 0},
        {"name": "Overhead Dumbbell Extension", "muscle": "Triceps", "default_sets": 3, "default_reps": 12, "default_weight": 16},
    ],
    "Core": [
        {"name": "Plank", "muscle": "Core", "default_sets": 3, "default_reps": 60, "default_weight": 0},
        {"name": "Hanging Leg Raises", "muscle": "Core", "default_sets": 3, "default_reps": 15, "default_weight": 0},
        {"name": "Cable Woodchoppers", "muscle": "Core", "default_sets": 3, "default_reps": 12, "default_weight": 20},
        {"name": "Ab Wheel Rollouts", "muscle": "Core", "default_sets": 3, "default_reps": 12, "default_weight": 0},
        {"name": "Russian Twists", "muscle": "Core", "default_sets": 3, "default_reps": 20, "default_weight": 8},
        {"name": "Decline Sit-Ups", "muscle": "Core", "default_sets": 3, "default_reps": 15, "default_weight": 5},
    ],
    "Cardio": [
        {"name": "Treadmill Running", "muscle": "Cardio", "default_sets": 1, "default_reps": 20, "default_weight": 0},
        {"name": "Stationary Bike", "muscle": "Cardio", "default_sets": 1, "default_reps": 30, "default_weight": 0},
        {"name": "Rowing Machine", "muscle": "Cardio", "default_sets": 1, "default_reps": 15, "default_weight": 0},
        {"name": "Jump Rope", "muscle": "Cardio", "default_sets": 3, "default_reps": 100, "default_weight": 0},
        {"name": "Kettlebell Swings", "muscle": "Cardio", "default_sets": 4, "default_reps": 20, "default_weight": 16},
    ],
}

# ─── SCHEMAS FOR FASTAPI ────────────────────────────────────────────────

class GymSetIn(BaseModel):
    set_number: int = 1
    reps: int = 10
    weight_kg: float = 0.0
    completed: bool = False

class GymExerciseIn(BaseModel):
    exercise_name: str
    muscle_group: str = "Chest"
    sets_data: list[GymSetIn] = Field(default_factory=list)
    notes: Optional[str] = None

class GymExerciseOut(BaseModel):
    id: UUID
    workout_id: UUID
    exercise_name: str
    muscle_group: str
    sets_data: Optional[list] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GymWorkoutCreateIn(BaseModel):
    date: str  # YYYY-MM-DD
    title: str
    week_number: int = 1
    day_number: int = 1
    target_muscle: Optional[str] = None
    notes: Optional[str] = None
    exercises: list[GymExerciseIn] = Field(default_factory=list)

class GymWorkoutUpdateIn(BaseModel):
    title: Optional[str] = None
    week_number: Optional[int] = None
    day_number: Optional[int] = None
    target_muscle: Optional[str] = None
    notes: Optional[str] = None
    completed: Optional[bool] = None

class GymWorkoutOut(BaseModel):
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
    exercises: list[GymExerciseOut] = Field(default_factory=list)

    @field_validator("date", mode="before")
    @classmethod
    def _date_to_str(cls, v):
        return v.isoformat() if isinstance(v, (date, datetime)) else str(v)

    class Config:
        from_attributes = True

class GymDietIn(BaseModel):
    date: str  # YYYY-MM-DD
    meal_type: str = "Breakfast"
    food_name: str
    calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0
    notes: Optional[str] = None

class GymDietOut(BaseModel):
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

    @field_validator("date", mode="before")
    @classmethod
    def _date_to_str(cls, v):
        return v.isoformat() if isinstance(v, (date, datetime)) else str(v)

    @field_validator("calories", "protein_g", "carbs_g", "fat_g", mode="before")
    @classmethod
    def _num_to_float(cls, v):
        return float(v) if v is not None else 0.0

    class Config:
        from_attributes = True

class GymWeightIn(BaseModel):
    date: str  # YYYY-MM-DD
    weight_kg: float
    body_fat_pct: Optional[float] = None
    notes: Optional[str] = None

class GymWeightOut(BaseModel):
    id: UUID
    date: str
    weight_kg: float
    body_fat_pct: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime

    @field_validator("date", mode="before")
    @classmethod
    def _date_to_str(cls, v):
        return v.isoformat() if isinstance(v, (date, datetime)) else str(v)

    @field_validator("weight_kg", "body_fat_pct", mode="before")
    @classmethod
    def _num_to_float(cls, v):
        return float(v) if v is not None else None

    class Config:
        from_attributes = True


# ─── PRESETS ENDPOINT ──────────────────────────────────────────────────

@router.get("/exercises/presets")
async def get_exercise_presets(
    muscle_group: Optional[str] = Query(None, description="Optional muscle group filter like 'Chest'")
):
    if muscle_group:
        grp = muscle_group.capitalize()
        presets = PRESET_EXERCISES.get(grp, [])
        return {"muscle_group": grp, "exercises": presets}
    return PRESET_EXERCISES


# ─── WORKOUT ENDPOINTS ─────────────────────────────────────────────────

@router.get("/workouts", response_model=list[GymWorkoutOut])
async def list_workouts(
    week_number: Optional[int] = Query(None),
    target_muscle: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    stmt = select(GymWorkout).where(GymWorkout.user_id == current_user.id)
    if week_number is not None:
        stmt = stmt.where(GymWorkout.week_number == week_number)
    if target_muscle:
        stmt = stmt.where(GymWorkout.target_muscle.ilike(f"%{target_muscle}%"))
    
    stmt = stmt.order_by(GymWorkout.week_number.asc(), GymWorkout.day_number.asc(), GymWorkout.date.desc())
    result = await db.execute(stmt)
    workouts = result.scalars().all()
    return [GymWorkoutOut.model_validate(w) for w in workouts]


@router.post("/workouts", response_model=GymWorkoutOut, status_code=status.HTTP_201_CREATED)
async def create_workout(
    data: GymWorkoutCreateIn,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    dt = date.fromisoformat(data.date) if isinstance(data.date, str) else data.date
    workout = GymWorkout(
        user_id=current_user.id,
        date=dt,
        title=data.title,
        week_number=data.week_number,
        day_number=data.day_number,
        target_muscle=data.target_muscle,
        notes=data.notes,
        completed=False,
    )
    db.add(workout)
    await db.flush()

    for ex_data in data.exercises:
        ex = GymExercise(
            workout_id=workout.id,
            user_id=current_user.id,
            exercise_name=ex_data.exercise_name,
            muscle_group=ex_data.muscle_group,
            sets_data=[s.model_dump() for s in ex_data.sets_data],
            notes=ex_data.notes,
        )
        db.add(ex)

    await db.commit()
    await db.refresh(workout)
    return GymWorkoutOut.model_validate(workout)


@router.patch("/workouts/{workout_id}", response_model=GymWorkoutOut)
async def update_workout(
    workout_id: UUID,
    data: GymWorkoutUpdateIn,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    stmt = select(GymWorkout).where(GymWorkout.id == workout_id, GymWorkout.user_id == current_user.id)
    res = await db.execute(stmt)
    workout = res.scalar_one_or_none()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(workout, field, val)

    await db.commit()
    await db.refresh(workout)
    return GymWorkoutOut.model_validate(workout)


@router.put("/workouts/{workout_id}", response_model=GymWorkoutOut)
async def replace_workout(
    workout_id: UUID,
    data: GymWorkoutCreateIn,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    stmt = select(GymWorkout).where(GymWorkout.id == workout_id, GymWorkout.user_id == current_user.id)
    res = await db.execute(stmt)
    workout = res.scalar_one_or_none()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    dt = date.fromisoformat(data.date) if isinstance(data.date, str) else data.date
    workout.title = data.title
    workout.date = dt
    workout.week_number = data.week_number
    workout.day_number = data.day_number
    workout.target_muscle = data.target_muscle
    workout.notes = data.notes

    # Replace exercises list
    await db.execute(delete(GymExercise).where(GymExercise.workout_id == workout_id))

    for ex_data in data.exercises:
        ex = GymExercise(
            workout_id=workout.id,
            user_id=current_user.id,
            exercise_name=ex_data.exercise_name,
            muscle_group=ex_data.muscle_group,
            sets_data=[s.model_dump() for s in ex_data.sets_data],
            notes=ex_data.notes,
        )
        db.add(ex)

    await db.commit()
    await db.refresh(workout)
    return GymWorkoutOut.model_validate(workout)


@router.post("/workouts/{workout_id}/exercises", response_model=GymExerciseOut, status_code=status.HTTP_201_CREATED)
async def add_exercise_to_workout(
    workout_id: UUID,
    ex_data: GymExerciseIn,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    stmt = select(GymWorkout).where(GymWorkout.id == workout_id, GymWorkout.user_id == current_user.id)
    res = await db.execute(stmt)
    workout = res.scalar_one_or_none()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    ex = GymExercise(
        workout_id=workout.id,
        user_id=current_user.id,
        exercise_name=ex_data.exercise_name,
        muscle_group=ex_data.muscle_group,
        sets_data=[s.model_dump() for s in ex_data.sets_data],
        notes=ex_data.notes,
    )
    db.add(ex)
    await db.commit()
    await db.refresh(ex)
    return GymExerciseOut.model_validate(ex)


@router.delete("/workouts/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(
    workout_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    stmt = select(GymWorkout).where(GymWorkout.id == workout_id, GymWorkout.user_id == current_user.id)
    res = await db.execute(stmt)
    workout = res.scalar_one_or_none()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    await db.delete(workout)
    await db.commit()


@router.delete("/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
    exercise_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    stmt = select(GymExercise).where(GymExercise.id == exercise_id, GymExercise.user_id == current_user.id)
    res = await db.execute(stmt)
    ex = res.scalar_one_or_none()
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found")

    await db.delete(ex)
    await db.commit()


# ─── DIET ENDPOINTS ────────────────────────────────────────────────────

@router.get("/diet", response_model=list[GymDietOut])
async def list_diet_logs(
    target_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    stmt = select(GymDietLog).where(GymDietLog.user_id == current_user.id)
    if target_date:
        dt = date.fromisoformat(target_date)
        stmt = stmt.where(GymDietLog.date == dt)
    stmt = stmt.order_by(GymDietLog.date.desc(), GymDietLog.created_at.asc())
    res = await db.execute(stmt)
    items = res.scalars().all()
    return [GymDietOut.model_validate(i) for i in items]


@router.post("/diet", response_model=GymDietOut, status_code=status.HTTP_201_CREATED)
async def create_diet_log(
    data: GymDietIn,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    dt = date.fromisoformat(data.date) if isinstance(data.date, str) else data.date
    log = GymDietLog(
        user_id=current_user.id,
        date=dt,
        meal_type=data.meal_type,
        food_name=data.food_name,
        calories=data.calories,
        protein_g=data.protein_g,
        carbs_g=data.carbs_g,
        fat_g=data.fat_g,
        notes=data.notes,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return GymDietOut.model_validate(log)


@router.delete("/diet/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diet_log(
    log_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    stmt = select(GymDietLog).where(GymDietLog.id == log_id, GymDietLog.user_id == current_user.id)
    res = await db.execute(stmt)
    log = res.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Diet log not found")

    await db.delete(log)
    await db.commit()


# ─── WEIGHT ENDPOINTS ──────────────────────────────────────────────────

@router.get("/weight", response_model=list[GymWeightOut])
async def list_weight_logs(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    stmt = select(GymWeightLog).where(GymWeightLog.user_id == current_user.id).order_by(GymWeightLog.date.asc())
    res = await db.execute(stmt)
    items = res.scalars().all()
    return [GymWeightOut.model_validate(i) for i in items]


@router.post("/weight", response_model=GymWeightOut, status_code=status.HTTP_201_CREATED)
async def create_weight_log(
    data: GymWeightIn,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    dt = date.fromisoformat(data.date) if isinstance(data.date, str) else data.date
    log = GymWeightLog(
        user_id=current_user.id,
        date=dt,
        weight_kg=data.weight_kg,
        body_fat_pct=data.body_fat_pct,
        notes=data.notes,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return GymWeightOut.model_validate(log)


@router.delete("/weight/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_weight_log(
    log_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    stmt = select(GymWeightLog).where(GymWeightLog.id == log_id, GymWeightLog.user_id == current_user.id)
    res = await db.execute(stmt)
    log = res.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Weight log not found")

    await db.delete(log)
    await db.commit()


# ─── SUMMARY & ANALYTICS ────────────────────────────────────────────────

@router.get("/summary")
async def get_gym_summary(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_dependency),
):
    # Total workouts & completed count
    res_workouts = await db.execute(
        select(GymWorkout).where(GymWorkout.user_id == current_user.id)
    )
    all_workouts = res_workouts.scalars().all()
    total_workouts = len(all_workouts)
    completed_workouts = sum(1 for w in all_workouts if w.completed)

    # Max week
    max_week = max([w.week_number for w in all_workouts], default=1)

    # Diet stats (avg calories)
    res_diet = await db.execute(
        select(func.sum(GymDietLog.calories), func.count(func.distinct(GymDietLog.date))).where(
            GymDietLog.user_id == current_user.id
        )
    )
    total_cals, distinct_days = res_diet.first() or (0, 0)
    avg_calories = float(total_cals / distinct_days) if distinct_days and total_cals else 0.0

    # Weight stats
    res_weight = await db.execute(
        select(GymWeightLog).where(GymWeightLog.user_id == current_user.id).order_by(GymWeightLog.date.asc())
    )
    weight_logs = res_weight.scalars().all()
    latest_weight = float(weight_logs[-1].weight_kg) if weight_logs else None
    weight_change = float(weight_logs[-1].weight_kg - weight_logs[0].weight_kg) if len(weight_logs) >= 2 else 0.0

    return {
        "total_workouts": total_workouts,
        "completed_workouts": completed_workouts,
        "current_week": max_week,
        "avg_calories_per_day": round(avg_calories, 1),
        "latest_weight": latest_weight,
        "weight_change": round(weight_change, 2),
    }
