from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_root_user
from app.models.user import User, UserRole
from app.services.user import UserService
from app.schemas.requests import UserCreateRequest, UserLoginRequest, UserUpdateRequest
from app.schemas.responses import UserResponse, TokenResponse, GenericResponse
from app.utils.auth import decode_access_token, create_access_token


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login and get access token."""
    user, access_token, refresh_token = await UserService.authenticate_user(db, login_data)
    
    if not user or not access_token or not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
        redirect_url=None
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token."""
    # Extract token from Bearer header
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    refresh_token = authorization.replace("Bearer ", "")
    
    # Decode and verify refresh token
    payload = decode_access_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Get user from database
    user_id = int(payload.get("sub"))
    user = await UserService.get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Generate new access token
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value
    }
    new_access_token = create_access_token(token_data)
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=refresh_token,  # Return same refresh token
        user=UserResponse.model_validate(user)
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user information."""
    updated_user = await UserService.update_user(db, current_user.id, user_data)
    return UserResponse.model_validate(updated_user)


# Root-only endpoints

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreateRequest,
    current_user: User = Depends(get_current_root_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user (root only)."""
    existing_user = await UserService.get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    user = await UserService.create_user(db, user_data)
    return UserResponse.model_validate(user)


@router.get("/users", response_model=list[UserResponse])
async def list_all_users(
    current_user: User = Depends(get_current_root_user),
    db: AsyncSession = Depends(get_db)
):
    """List all users (root only)."""
    users = await UserService.get_all_users(db)
    return [UserResponse.model_validate(user) for user in users]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_root_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific user (root only)."""
    user = await UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdateRequest,
    current_user: User = Depends(get_current_root_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a user (root only)."""
    user = await UserService.update_user(db, user_id, user_data)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}", response_model=GenericResponse)
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_root_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a user (root only)."""
    success = await UserService.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return GenericResponse(message="User deleted successfully")
