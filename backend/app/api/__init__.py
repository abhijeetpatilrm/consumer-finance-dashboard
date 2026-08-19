from fastapi import APIRouter

from app.api.routes import analytics, health, rewards, transactions

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(transactions.router)
api_router.include_router(analytics.router)
api_router.include_router(rewards.router)
