from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, field_validator
import re

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.user import UserService

router = APIRouter(prefix="/user", tags=["User"])


class UserProfileResponse(BaseModel):
    id: int
    username: str
    subdomain: str | None
    max_invite: int
    is_active: bool

    class Config:
        from_attributes = True


class UpdateSubdomainRequest(BaseModel):
    subdomain: str
    
    @field_validator('subdomain')
    @classmethod
    def validate_subdomain(cls, v: str) -> str:
        v = v.strip().lower()
        
        # Check length
        if len(v) < 3 or len(v) > 50:
            raise ValueError('Subdomain phải từ 3-50 ký tự')
        
        # Only allow lowercase letters, numbers, and hyphens
        if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', v) and len(v) > 2:
            raise ValueError('Subdomain chỉ được chứa chữ thường, số và dấu gạch ngang, không bắt đầu/kết thúc bằng gạch ngang')
        
        if len(v) <= 2 and not re.match(r'^[a-z0-9]+$', v):
            raise ValueError('Subdomain chỉ được chứa chữ thường và số')
        
        # Reserved subdomains
        reserved = ['www', 'api', 'admin', 'mail', 'ftp', 'localhost', 'wedding', 'app', 'dashboard', 'login', 'register']
        if v in reserved:
            raise ValueError(f'Subdomain "{v}" đã được hệ thống sử dụng')
        
        return v


class UpdateSubdomainResponse(BaseModel):
    success: bool
    message: str
    subdomain: str | None
    guest_url_preview: str | None


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's profile."""
    return UserProfileResponse.model_validate(current_user)


@router.put("/subdomain", response_model=UpdateSubdomainResponse)
async def update_subdomain(
    data: UpdateSubdomainRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's subdomain."""
    from config.settings import settings
    
    # Check if subdomain is already taken by another user
    existing_user = await UserService.get_user_by_subdomain(db, data.subdomain)
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subdomain này đã được sử dụng bởi người dùng khác"
        )
    
    # Update subdomain
    updated_user = await UserService.update_subdomain(db, current_user.id, data.subdomain)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể cập nhật subdomain"
        )
    
    guest_url_preview = f"https://{data.subdomain}.{settings.FRONTEND_BASE_DOMAIN}/{{guest_id}}"
    
    return UpdateSubdomainResponse(
        success=True,
        message="Cập nhật subdomain thành công",
        subdomain=updated_user.subdomain,
        guest_url_preview=guest_url_preview
    )


@router.get("/subdomain", response_model=dict)
async def get_subdomain(
    current_user: User = Depends(get_current_user)
):
    """Get current user's subdomain info."""
    from config.settings import settings
    
    subdomain = current_user.subdomain
    if subdomain:
        guest_url_preview = f"https://{subdomain}.{settings.FRONTEND_BASE_DOMAIN}/{{guest_id}}"
    else:
        guest_url_preview = None
    
    return {
        "subdomain": subdomain,
        "guest_url_preview": guest_url_preview,
        "base_domain": settings.FRONTEND_BASE_DOMAIN
    }
