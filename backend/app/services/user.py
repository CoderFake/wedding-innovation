from datetime import date, time
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.intro import Intro
from app.models.date_of_organization import DateOfOrganization
from app.models.section import HeaderSection, FamilySection, InviteSection, FooterSection
from app.models.invite import Guest
from app.schemas.requests import UserCreateRequest, UserUpdateRequest, UserLoginRequest
from app.utils.auth import hash_password, verify_password, create_access_token, create_refresh_token


class UserService:
    """Service layer for User CRUD operations and authentication."""
    
    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreateRequest) -> User:
        """
        Create a new user with default intro and sections.
        
        Args:
            db: Database session
            user_data: User creation data
            
        Returns:
            Created user object
        """
        hashed_pw = hash_password(user_data.password)
        user = User(
            username=user_data.username,
            password_hash=hashed_pw,
            role=UserRole(user_data.role),
            max_invite=user_data.max_invite
        )
        db.add(user)
        await db.flush()  
        intro = Intro(
            user_id=user.id,
            groom_name="Chú rể",
            groom_full_name="Nguyễn Văn A",
            bride_name="Cô dâu",
            bride_full_name="Trần Thị B"
        )
        db.add(intro)
        await db.flush()  
        date_org = DateOfOrganization(
            intro_id=intro.id,
            lunar_day="Ngày 01 tháng 01 năm Ất Tỵ",
            calendar_day=date(2025, 1, 29),
            event_time=time(10, 0)
        )
        db.add(date_org)
        
        header = HeaderSection(intro_id=intro.id)
        db.add(header)
        
        family = FamilySection(
            intro_id=intro.id,
            groom_father_name="Ông Nguyễn Văn",
            groom_mother_name="Bà Trần Thị",
            groom_address="Số 1, Đường ABC, Quận XYZ, TP. Hà Nội",
            bride_father_name="Ông Trần Văn",
            bride_mother_name="Bà Lê Thị",
            bride_address="Số 2, Đường DEF, Quận UVW, TP. Hồ Chí Minh"
        )
        db.add(family)
        
        invite = InviteSection(
            intro_id=intro.id,
            greeting_text="Trân trọng kính mời bạn đến dự buổi tiệc chung vui cùng gia đình chúng tôi",
            attendance_request_text="Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi"
        )
        db.add(invite)
        
        footer = FooterSection(
            intro_id=intro.id,
            thank_you_text="Xin chân thành cảm ơn!",
            closing_message="Rất mong được đón tiếp quý khách"
        )
        db.add(footer)
        
        demo_guest = Guest(
            intro_id=intro.id,
            name="Khách Demo",
            user_relationship="Demo",
            confirm=False
        )
        db.add(demo_guest)
        
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            User object or None
        """
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
        """
        Get user by username.
        
        Args:
            db: Database session
            username: Username
            
        Returns:
            User object or None
        """
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        login_data: UserLoginRequest
    ) -> tuple[Optional[User], Optional[str], Optional[str]]:
        """
        Authenticate user and generate access and refresh tokens.
        
        Args:
            db: Database session
            login_data: Login credentials
            
        Returns:
            Tuple of (user object, access token, refresh token) or (None, None, None) if authentication fails
        """
        user = await UserService.get_user_by_username(db, login_data.username)
        if not user:
            return None, None, None
        
        if not user.is_active:
            return None, None, None
        
        if not verify_password(login_data.password, user.password_hash):
            return None, None, None
        
        # Generate access and refresh tokens
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role.value
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return user, access_token, refresh_token
    
    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: int,
        user_data: UserUpdateRequest
    ) -> Optional[User]:
        """
        Update a user.
        
        Args:
            db: Database session
            user_id: User ID
            user_data: Update data
            
        Returns:
            Updated user object or None
        """
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            return None
        
        update_data = user_data.model_dump(exclude_unset=True)
        
        # Hash password if provided
        if "password" in update_data:
            update_data["password_hash"] = hash_password(update_data.pop("password"))
        
        for key, value in update_data.items():
            setattr(user, key, value)
        
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def delete_user(db: AsyncSession, user_id: int) -> bool:
        """
        Delete a user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            True if deleted, False if not found
        """
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            return False
        
        await db.delete(user)
        await db.commit()
        return True
    
    @staticmethod
    async def get_all_users(db: AsyncSession) -> list[User]:
        """
        Get all users (root only).
        
        Args:
            db: Database session
            
        Returns:
            List of all users
        """
        result = await db.execute(select(User).order_by(User.created_at.desc()))
        return list(result.scalars().all())

    @staticmethod
    async def get_user_by_subdomain(db: AsyncSession, subdomain: str) -> Optional[User]:
        """
        Get user by subdomain.
        
        Args:
            db: Database session
            subdomain: User's subdomain
            
        Returns:
            User object or None
        """
        result = await db.execute(
            select(User).where(User.subdomain == subdomain.lower())
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_subdomain(
        db: AsyncSession,
        user_id: int,
        subdomain: str
    ) -> Optional[User]:
        """
        Update user's subdomain.
        
        Args:
            db: Database session
            user_id: User ID
            subdomain: New subdomain
            
        Returns:
            Updated user object or None
        """
        # Check if subdomain is already taken
        existing = await UserService.get_user_by_subdomain(db, subdomain)
        if existing and existing.id != user_id:
            return None
        
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            return None
        
        user.subdomain = subdomain.lower()
        await db.commit()
        await db.refresh(user)
        return user
