from fastapi import APIRouter

from app.api.v1 import auth, landing_page, user


api_router = APIRouter()

# Include all v1 routers
api_router.include_router(auth.router, prefix="/v1")
api_router.include_router(landing_page.router, prefix="/v1")
api_router.include_router(user.router, prefix="/v1")
