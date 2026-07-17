from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db_dependency
from app.config import get_settings

settings = get_settings()
router = APIRouter()


@router.get("")
async def health_check(
    db: AsyncSession = Depends(get_db_dependency),
):
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "version": "1.0.0",
        "environment": settings.environment,
    }