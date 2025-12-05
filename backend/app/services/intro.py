from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.intro import Intro
from app.models.date_of_organization import DateOfOrganization
from app.models.invite import Guest
from app.models.session_image import SessionImage
from app.models.section import HeaderSection, FamilySection, InviteSection, FooterSection
from app.models.album import AlbumSession, AlbumImage
from app.schemas.requests import IntroCreateRequest, IntroUpdateRequest


class IntroService:
    """Service layer for Intro CRUD operations."""
    
    @staticmethod
    async def create_intro(db: AsyncSession, user_id: int, intro_data: IntroCreateRequest) -> Intro:
        """
        Create a new intro.
        
        Args:
            db: Database session
            user_id: User ID
            intro_data: Intro creation data
            
        Returns:
            Created intro object
        """
        intro = Intro(
            user_id=user_id,
            **intro_data.model_dump()
        )
        db.add(intro)
        await db.commit()
        await db.refresh(intro)
        return intro
    
    @staticmethod
    async def get_intro_by_id(db: AsyncSession, intro_id: str) -> Optional[Intro]:
        """
        Get intro by ID.
        
        Args:
            db: Database session
            intro_id: Intro ID (UUID string)
            
        Returns:
            Intro object or None
        """
        result = await db.execute(select(Intro).where(Intro.id == intro_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_intro_by_user_id(db: AsyncSession, user_id: int) -> Optional[Intro]:
        """
        Get intro by user ID (each user should have only one intro).
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Intro object or None
        """
        result = await db.execute(select(Intro).where(Intro.user_id == user_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_intros_by_user_id(db: AsyncSession, user_id: int) -> list[Intro]:
        """
        Get all intros by user ID.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of intro objects
        """
        result = await db.execute(
            select(Intro)
            .where(Intro.user_id == user_id)
            .order_by(Intro.created_at.desc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_complete_landing_page(db: AsyncSession, intro_id: str) -> Optional[dict]:
        """
        Get complete landing page with all sections.
        
        Args:
            db: Database session
            intro_id: Intro ID (UUID string)
            
        Returns:
            Dictionary with all landing page data
        """
        # Fetch intro with all relationships
        result = await db.execute(
            select(Intro)
            .options(
                selectinload(Intro.date_of_organization),
                selectinload(Intro.header_section),
                selectinload(Intro.family_section),
                selectinload(Intro.invite_section),
                selectinload(Intro.album_sessions).selectinload(AlbumSession.album_images),
                selectinload(Intro.footer_section)
            )
            .where(Intro.id == intro_id)
        )
        intro = result.scalar_one_or_none()
        
        if not intro:
            return None
        
        return {
            "intro": intro,
            "date_of_organization": intro.date_of_organization,
            "header_section": intro.header_section,
            "family_section": intro.family_section,
            "invite_section": intro.invite_section,
            "album_sessions": intro.album_sessions,
            "footer_section": intro.footer_section
        }
    
    @staticmethod
    async def update_intro(
        db: AsyncSession,
        intro_id: str,
        intro_data: IntroUpdateRequest
    ) -> Optional[Intro]:
        """
        Update an intro.
        
        Args:
            db: Database session
            intro_id: Intro ID (UUID string)
            intro_data: Update data
            
        Returns:
            Updated intro object or None
        """
        intro = await IntroService.get_intro_by_id(db, intro_id)
        if not intro:
            return None
        
        update_data = intro_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(intro, key, value)
        
        await db.commit()
        await db.refresh(intro)
        return intro
    
    @staticmethod
    async def delete_intro(db: AsyncSession, intro_id: str) -> bool:
        """
        Delete an intro (cascades to all related sections).
        
        Args:
            db: Database session
            intro_id: Intro ID (UUID string)
            
        Returns:
            True if deleted, False if not found
        """
        intro = await IntroService.get_intro_by_id(db, intro_id)
        if not intro:
            return False
        
        await db.delete(intro)
        await db.commit()
        return True
    
    @staticmethod
    async def get_complete_landing_page_by_guest_id(db: AsyncSession, guest_id: str) -> Optional[dict]:
        """
        Get complete landing page by guest ID (public access).
        
        Args:
            db: Database session
            guest_id: Guest ID (UUID string)
            
        Returns:
            Dictionary with all landing page data and guest info
        """
        # First get the guest
        guest_result = await db.execute(select(Guest).where(Guest.id == guest_id))
        guest = guest_result.scalar_one_or_none()
        
        if not guest:
            return None
        
        # Get the intro with all relationships
        result = await db.execute(
            select(Intro)
            .options(
                selectinload(Intro.date_of_organization),
                selectinload(Intro.header_section).selectinload(HeaderSection.session_image),
                selectinload(Intro.family_section).selectinload(FamilySection.session_image),
                selectinload(Intro.family_section).selectinload(FamilySection.groom_image),
                selectinload(Intro.family_section).selectinload(FamilySection.bride_image),
                selectinload(Intro.invite_section),
                selectinload(Intro.album_sessions).selectinload(AlbumSession.album_images).selectinload(AlbumImage.session_image),
                selectinload(Intro.footer_section).selectinload(FooterSection.session_image)
            )
            .where(Intro.id == guest.intro_id)
        )
        intro = result.scalar_one_or_none()
        
        if not intro:
            return None
        
        # Get invite section images
        invite_section = intro.invite_section
        left_image = None
        center_image = None
        right_image = None
        
        if invite_section:
            if invite_section.left_image_id:
                img_result = await db.execute(select(SessionImage).where(SessionImage.id == invite_section.left_image_id))
                left_image = img_result.scalar_one_or_none()
            if invite_section.center_image_id:
                img_result = await db.execute(select(SessionImage).where(SessionImage.id == invite_section.center_image_id))
                center_image = img_result.scalar_one_or_none()
            if invite_section.right_image_id:
                img_result = await db.execute(select(SessionImage).where(SessionImage.id == invite_section.right_image_id))
                right_image = img_result.scalar_one_or_none()
        
        return {
            "guest": guest,
            "intro": intro,
            "date_of_organization": intro.date_of_organization,
            "header_section": intro.header_section,
            "family_section": intro.family_section,
            "invite_section": intro.invite_section,
            "invite_images": {
                "left": left_image,
                "center": center_image,
                "right": right_image
            },
            "album_sessions": intro.album_sessions,
            "footer_section": intro.footer_section
        }

    @staticmethod
    async def get_landing_page_by_user_id(db: AsyncSession, user_id: int) -> Optional[dict]:
        """
        Get landing page data by user ID (for subdomain access).
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Dictionary with all landing page data (no guest info)
        """
        # Get the intro for this user
        result = await db.execute(
            select(Intro)
            .options(
                selectinload(Intro.date_of_organization),
                selectinload(Intro.header_section).selectinload(HeaderSection.session_image),
                selectinload(Intro.family_section).selectinload(FamilySection.session_image),
                selectinload(Intro.family_section).selectinload(FamilySection.groom_image),
                selectinload(Intro.family_section).selectinload(FamilySection.bride_image),
                selectinload(Intro.invite_section),
                selectinload(Intro.album_sessions).selectinload(AlbumSession.album_images).selectinload(AlbumImage.session_image),
                selectinload(Intro.footer_section).selectinload(FooterSection.session_image)
            )
            .where(Intro.user_id == user_id)
        )
        intro = result.scalar_one_or_none()
        
        if not intro:
            return None
        
        # Get invite section images
        invite_section = intro.invite_section
        left_image = None
        center_image = None
        right_image = None
        
        if invite_section:
            if invite_section.left_image_id:
                img_result = await db.execute(select(SessionImage).where(SessionImage.id == invite_section.left_image_id))
                left_image = img_result.scalar_one_or_none()
            if invite_section.center_image_id:
                img_result = await db.execute(select(SessionImage).where(SessionImage.id == invite_section.center_image_id))
                center_image = img_result.scalar_one_or_none()
            if invite_section.right_image_id:
                img_result = await db.execute(select(SessionImage).where(SessionImage.id == invite_section.right_image_id))
                right_image = img_result.scalar_one_or_none()
        
        return {
            "intro": intro,
            "date_of_organization": intro.date_of_organization,
            "header_section": intro.header_section,
            "family_section": intro.family_section,
            "invite_section": intro.invite_section,
            "invite_images": {
                "left": left_image,
                "center": center_image,
                "right": right_image
            },
            "album_sessions": intro.album_sessions,
            "footer_section": intro.footer_section
        }
    
    @staticmethod
    async def get_guest_by_id_and_user(db: AsyncSession, guest_id: str, user_id: int) -> Optional[Guest]:
        """
        Get guest by ID, validating it belongs to the user's intro.
        
        Args:
            db: Database session
            guest_id: Guest ID
            user_id: User ID (owner)
            
        Returns:
            Guest object or None if not found or doesn't belong to user
        """
        # Get guest with intro relationship
        result = await db.execute(
            select(Guest)
            .options(selectinload(Guest.intro))
            .where(Guest.id == guest_id)
        )
        guest = result.scalar_one_or_none()
        
        if not guest:
            return None
        
        # Verify guest belongs to user's intro
        if guest.intro.user_id != user_id:
            return None
        
        return guest
