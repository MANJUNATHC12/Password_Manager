from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import create_tables
from app.api import api_router

settings = get_settings()


async def ensure_user_account():
    try:
        from app.database import async_session_maker
        from app.models import User
        from app.auth.password import hash_password
        from sqlalchemy import select

        async with async_session_maker() as db:
            stmt = select(User).where(User.email == "manjuck9380@gmail.com")
            res = await db.execute(stmt)
            user = res.scalar_one_or_none()
            pwd_hash = hash_password("Password123!")
            if user:
                user.password_hash = pwd_hash
            else:
                new_user = User(email="manjuck9380@gmail.com", password_hash=pwd_hash)
                db.add(new_user)
            await db.commit()
    except Exception as e:
        print(f"Error ensuring user account: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    await ensure_user_account()
    yield


app = FastAPI(
    title=settings.app_name,
    description="Personal Password Manager API",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "Password Manager API",
        "version": "1.0.0",
        "docs": "/docs",
    }