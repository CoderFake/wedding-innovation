from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.section import HeaderSection, FamilySection, InviteSection, FooterSection
from app.models.date_of_organization import DateOfOrganization
from app.models.session_image import SessionImage
from app.schemas.requests import (
    HeaderSectionCreateRequest, HeaderSectionUpdateRequest,
    FamilySectionCreateRequest, FamilySectionUpdateRequest,
    InviteSectionCreateRequest, InviteSectionUpdateRequest,
    FooterSectionCreateRequest, FooterSectionUpdateRequest,
    DateOfOrganizationCreateRequest, DateOfOrganizationUpdateRequest,
    SessionImageCreateRequest, SessionImageUpdateRequest
)


# ==================== Date of Organization Service ====================

class DateOfOrganizationService:
    """Service for DateOfOrganization CRUD operations."""
    
    @staticmethod
    async def create_or_update(
        db: AsyncSession,
        intro_id: str,
        data: DateOfOrganizationCreateRequest
    ) -> DateOfOrganization:
        """Create or update date of organization for an intro."""
        result = await db.execute(
            select(DateOfOrganization).where(DateOfOrganization.intro_id == intro_id)
        )
        date_org = result.scalar_one_or_none()
        
        if date_org:
            # Update existing
            for key, value in data.model_dump().items():
                setattr(date_org, key, value)
        else:
            # Create new
            date_org = DateOfOrganization(intro_id=intro_id, **data.model_dump())
            db.add(date_org)
        
        await db.commit()
        await db.refresh(date_org)
        return date_org
    
    @staticmethod
    async def get_by_intro(db: AsyncSession, intro_id: str) -> Optional[DateOfOrganization]:
        """Get date of organization by intro ID."""
        result = await db.execute(
            select(DateOfOrganization).where(DateOfOrganization.intro_id == intro_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def delete_by_intro(db: AsyncSession, intro_id: str) -> bool:
        """Delete date of organization by intro ID."""
        date_org = await DateOfOrganizationService.get_by_intro(db, intro_id)
        if not date_org:
            return False
        await db.delete(date_org)
        await db.commit()
        return True


# ==================== Session Image Service ====================

class SessionImageService:
    """Service for SessionImage CRUD operations."""
    
    @staticmethod
    async def create_image(
        db: AsyncSession,
        intro_id: str,
        data: SessionImageCreateRequest
    ) -> SessionImage:
        """Create a new session image."""
        image = SessionImage(intro_id=intro_id, **data.model_dump())
        db.add(image)
        await db.commit()
        await db.refresh(image)
        return image
    
    @staticmethod
    async def get_image_by_id(db: AsyncSession, image_id: str) -> Optional[SessionImage]:
        """Get session image by ID."""
        result = await db.execute(select(SessionImage).where(SessionImage.id == image_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_images_by_intro(db: AsyncSession, intro_id: str) -> list[SessionImage]:
        """Get all session images for an intro."""
        result = await db.execute(
            select(SessionImage).where(SessionImage.intro_id == intro_id)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def delete_image(db: AsyncSession, image_id: str) -> bool:
        """Delete a session image."""
        image = await SessionImageService.get_image_by_id(db, image_id)
        if not image:
            return False
        await db.delete(image)
        await db.commit()
        return True


# ==================== Header Section Service ====================

class HeaderSectionService:
    """Service for HeaderSection CRUD operations."""
    
    @staticmethod
    async def create_or_update(
        db: AsyncSession,
        intro_id: str,
        data: HeaderSectionCreateRequest
    ) -> HeaderSection:
        """Create or update header section for an intro."""
        result = await db.execute(
            select(HeaderSection).where(HeaderSection.intro_id == intro_id)
        )
        header = result.scalar_one_or_none()
        
        if header:
            # Update existing
            for key, value in data.model_dump().items():
                setattr(header, key, value)
        else:
            # Create new
            header = HeaderSection(intro_id=intro_id, **data.model_dump())
            db.add(header)
        
        await db.commit()
        await db.refresh(header)
        return header
    
    @staticmethod
    async def get_by_intro(db: AsyncSession, intro_id: str) -> Optional[HeaderSection]:
        """Get header section by intro ID."""
        result = await db.execute(
            select(HeaderSection).where(HeaderSection.intro_id == intro_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_header_response_dict(db: AsyncSession, intro_id: str) -> Optional[dict]:
        """Get header section with image URL loaded."""
        result = await db.execute(
            select(HeaderSection)
            .options(selectinload(HeaderSection.session_image))
            .where(HeaderSection.intro_id == intro_id)
        )
        header = result.scalar_one_or_none()
        if not header:
            return None
        
        return {
            "id": header.id,
            "intro_id": header.intro_id,
            "session_image_id": header.session_image_id,
            "photo_url": header.session_image.url if header.session_image else None,
            "created_at": header.created_at,
            "updated_at": header.updated_at,
        }
    
    @staticmethod
    async def delete_by_intro(db: AsyncSession, intro_id: str) -> bool:
        """Delete header section by intro ID."""
        header = await HeaderSectionService.get_by_intro(db, intro_id)
        if not header:
            return False
        await db.delete(header)
        await db.commit()
        return True


# ==================== Family Section Service ====================

class FamilySectionService:
    """Service for FamilySection CRUD operations."""
    
    @staticmethod
    async def create_or_update(
        db: AsyncSession,
        intro_id: str,
        data: FamilySectionCreateRequest
    ) -> FamilySection:
        """Create or update family section for an intro."""
        result = await db.execute(
            select(FamilySection).where(FamilySection.intro_id == intro_id)
        )
        family = result.scalar_one_or_none()
        
        if family:
            # Update existing
            for key, value in data.model_dump().items():
                setattr(family, key, value)
        else:
            # Create new
            family = FamilySection(intro_id=intro_id, **data.model_dump())
            db.add(family)
        
        await db.commit()
        await db.refresh(family)
        return family
    
    @staticmethod
    async def get_by_intro(db: AsyncSession, intro_id: str) -> Optional[FamilySection]:
        """Get family section by intro ID."""
        result = await db.execute(
            select(FamilySection).where(FamilySection.intro_id == intro_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_family_response_dict(db: AsyncSession, intro_id: str) -> Optional[dict]:
        """Get family section with image URL loaded."""
        result = await db.execute(
            select(FamilySection)
            .options(
                selectinload(FamilySection.session_image),
                selectinload(FamilySection.groom_image),
                selectinload(FamilySection.bride_image)
            )
            .where(FamilySection.intro_id == intro_id)
        )
        family = result.scalar_one_or_none()
        if not family:
            return None
        
        return {
            "id": family.id,
            "intro_id": family.intro_id,
            "groom_father_name": family.groom_father_name,
            "groom_mother_name": family.groom_mother_name,
            "groom_address": family.groom_address,
            "bride_father_name": family.bride_father_name,
            "bride_mother_name": family.bride_mother_name,
            "bride_address": family.bride_address,
            "session_image_id": family.session_image_id,
            "photo_url": family.session_image.url if family.session_image else None,
            "groom_image_id": family.groom_image_id,
            "groom_image_url": family.groom_image.url if family.groom_image else None,
            "bride_image_id": family.bride_image_id,
            "bride_image_url": family.bride_image.url if family.bride_image else None,
            "created_at": family.created_at,
            "updated_at": family.updated_at,
        }
    
    @staticmethod
    async def delete_by_intro(db: AsyncSession, intro_id: str) -> bool:
        """Delete family section by intro ID."""
        family = await FamilySectionService.get_by_intro(db, intro_id)
        if not family:
            return False
        await db.delete(family)
        await db.commit()
        return True


# ==================== Invite Section Service ====================

class InviteSectionService:
    """Service for InviteSection CRUD operations."""
    
    @staticmethod
    async def create_or_update(
        db: AsyncSession,
        intro_id: str,
        data: InviteSectionCreateRequest
    ) -> InviteSection:
        """Create or update invite section for an intro."""
        result = await db.execute(
            select(InviteSection).where(InviteSection.intro_id == intro_id)
        )
        invite_section = result.scalar_one_or_none()
        
        if invite_section:
            # Update existing
            for key, value in data.model_dump().items():
                setattr(invite_section, key, value)
        else:
            # Create new
            invite_section = InviteSection(intro_id=intro_id, **data.model_dump())
            db.add(invite_section)
        
        await db.commit()
        await db.refresh(invite_section)
        return invite_section
    
    @staticmethod
    async def get_by_intro(db: AsyncSession, intro_id: str) -> Optional[InviteSection]:
        """Get invite section by intro ID."""
        result = await db.execute(
            select(InviteSection).where(InviteSection.intro_id == intro_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_invite_response_dict(db: AsyncSession, intro_id: str) -> Optional[dict]:
        """Get invite section with all 3 image URLs loaded."""
        result = await db.execute(
            select(InviteSection)
            .options(
                selectinload(InviteSection.left_image),
                selectinload(InviteSection.center_image),
                selectinload(InviteSection.right_image)
            )
            .where(InviteSection.intro_id == intro_id)
        )
        invite = result.scalar_one_or_none()
        if not invite:
            return None
        
        return {
            "id": invite.id,
            "intro_id": invite.intro_id,
            "left_image_id": invite.left_image_id,
            "left_image_url": invite.left_image.url if invite.left_image else None,
            "center_image_id": invite.center_image_id,
            "center_image_url": invite.center_image.url if invite.center_image else None,
            "right_image_id": invite.right_image_id,
            "right_image_url": invite.right_image.url if invite.right_image else None,
            "greeting_text": invite.greeting_text,
            "attendance_request_text": invite.attendance_request_text,
            "created_at": invite.created_at,
            "updated_at": invite.updated_at,
        }
    
    @staticmethod
    async def delete_by_intro(db: AsyncSession, intro_id: str) -> bool:
        """Delete invite section by intro ID."""
        invite = await InviteSectionService.get_by_intro(db, intro_id)
        if not invite:
            return False
        await db.delete(invite)
        await db.commit()
        return True


# ==================== Footer Section Service ====================

class FooterSectionService:
    """Service for FooterSection CRUD operations."""
    
    @staticmethod
    async def create_or_update(
        db: AsyncSession,
        intro_id: str,
        data: FooterSectionCreateRequest
    ) -> FooterSection:
        """Create or update footer section for an intro."""
        result = await db.execute(
            select(FooterSection).where(FooterSection.intro_id == intro_id)
        )
        footer = result.scalar_one_or_none()
        
        if footer:
            # Update existing
            for key, value in data.model_dump().items():
                setattr(footer, key, value)
        else:
            # Create new
            footer = FooterSection(intro_id=intro_id, **data.model_dump())
            db.add(footer)
        
        await db.commit()
        await db.refresh(footer)
        return footer
    
    @staticmethod
    async def get_by_intro(db: AsyncSession, intro_id: str) -> Optional[FooterSection]:
        """Get footer section by intro ID."""
        result = await db.execute(
            select(FooterSection).where(FooterSection.intro_id == intro_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_footer_response_dict(db: AsyncSession, intro_id: str) -> Optional[dict]:
        """Get footer section with image URL loaded."""
        result = await db.execute(
            select(FooterSection)
            .options(selectinload(FooterSection.session_image))
            .where(FooterSection.intro_id == intro_id)
        )
        footer = result.scalar_one_or_none()
        if not footer:
            return None
        
        return {
            "id": footer.id,
            "intro_id": footer.intro_id,
            "session_image_id": footer.session_image_id,
            "photo_url": footer.session_image.url if footer.session_image else None,
            "thank_you_text": footer.thank_you_text,
            "closing_message": footer.closing_message,
            "created_at": footer.created_at,
            "updated_at": footer.updated_at,
        }
    
    @staticmethod
    async def delete_by_intro(db: AsyncSession, intro_id: str) -> bool:
        """Delete footer section by intro ID."""
        footer = await FooterSectionService.get_by_intro(db, intro_id)
        if not footer:
            return False
        await db.delete(footer)
        await db.commit()
        return True

