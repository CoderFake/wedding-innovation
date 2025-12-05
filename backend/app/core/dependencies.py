from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from urllib.parse import urlparse

from app.core.database import get_db
from app.models.user import User, UserRole
from app.services.user import UserService
from app.utils.auth import decode_access_token


security = HTTPBearer()


def get_subdomain_from_request(request: Request) -> Optional[str]:
    """
    Extract subdomain from request.
    Priority: X-Subdomain header > Origin header > Referer header > Host header
    
    Args:
        request: FastAPI request object
        
    Returns:
        Subdomain string or None
    """
    # 1. Check X-Subdomain header (set by frontend)
    subdomain = request.headers.get("X-Subdomain")
    if subdomain:
        return subdomain.lower().strip()
    
    # 2. Check Origin header
    origin = request.headers.get("Origin")
    if origin:
        parsed = urlparse(origin)
        host = parsed.netloc.split(':')[0]  # Remove port if exists
        parts = host.split('.')
        if len(parts) >= 3:  # e.g., user1.wedding.example.com
            return parts[0].lower()
    
    # 3. Check Referer header
    referer = request.headers.get("Referer")
    if referer:
        parsed = urlparse(referer)
        host = parsed.netloc.split(':')[0]
        parts = host.split('.')
        if len(parts) >= 3:
            return parts[0].lower()
    
    # 4. Check Host header
    host = request.headers.get("Host", "")
    host = host.split(':')[0]  # Remove port
    parts = host.split('.')
    if len(parts) >= 3:
        return parts[0].lower()
    
    return None


async def get_user_by_subdomain(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get user by subdomain from request headers.
    
    Args:
        request: FastAPI request object
        db: Database session
        
    Returns:
        User object or None if subdomain not found
    """
    subdomain = get_subdomain_from_request(request)
    if not subdomain:
        return None
    
    user = await UserService.get_user_by_subdomain(db, subdomain)
    return user


async def require_user_by_subdomain(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Require user by subdomain - raises 404 if not found.
    
    Args:
        request: FastAPI request object
        db: Database session
        
    Returns:
        User object
        
    Raises:
        HTTPException: If subdomain not provided or user not found
    """
    subdomain = get_subdomain_from_request(request)
    if not subdomain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subdomain not provided"
        )
    
    user = await UserService.get_user_by_subdomain(db, subdomain)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Wedding invitation not found for subdomain: {subdomain}"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This wedding invitation is not active"
        )
    
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP bearer token
        db: Database session
        
    Returns:
        Current user object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await UserService.get_user_by_id(db, int(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


async def get_current_root_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure current user is a root user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current user if root
        
    Raises:
        HTTPException: If user is not root
    """
    if current_user.role != UserRole.ROOT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only root users can perform this action"
        )
    return current_user


async def get_current_admin_or_root_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure current user is admin or root.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current user if admin or root
        
    Raises:
        HTTPException: If user is not admin or root
    """
    if current_user.role not in [UserRole.ROOT, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or root users can perform this action"
        )
    return current_user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to optionally get current user (allows unauthenticated access).
    
    Args:
        credentials: Optional HTTP bearer token
        db: Database session
        
    Returns:
        Current user object or None
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        return None
    
    user_id: str = payload.get("sub")
    if user_id is None:
        return None
    
    user = await UserService.get_user_by_id(db, int(user_id))
    if user is None or not user.is_active:
        return None
    
    return user
