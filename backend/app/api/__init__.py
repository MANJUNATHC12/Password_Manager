from fastapi import APIRouter
from app.api.v1 import auth, vault, health, documents, expenses

api_router = APIRouter()

api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(vault.router, tags=["Vault"])
api_router.include_router(documents.router, tags=["Documents"])
api_router.include_router(expenses.router, tags=["Expenses"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])