from typing import Optional, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.album import AlbumSession, AlbumImage
from app.schemas.requests import (
    AlbumSessionCreateRequest, AlbumSessionUpdateRequest,
    AlbumImageCreateRequest, AlbumImageUpdateRequest
)


class AlbumSessionService:
    """Service for AlbumSession CRUD operations."""
    
    @staticmethod
    async def create_album_session(
        db: AsyncSession,
        intro_id: str,
        data: AlbumSessionCreateRequest
    ) -> AlbumSession:
        """Create a new album session."""
        album_session = AlbumSession(intro_id=intro_id, **data.model_dump())
        db.add(album_session)
        await db.commit()
        await db.refresh(album_session)
        return album_session
    
    @staticmethod
    async def get_album_session_by_id(db: AsyncSession, session_id: str) -> Optional[AlbumSession]:
        """Get album session by ID."""
        result = await db.execute(
            select(AlbumSession)
            .options(
                selectinload(AlbumSession.album_images).selectinload(AlbumImage.session_image)
            )
            .where(AlbumSession.id == session_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_album_sessions_by_intro(db: AsyncSession, intro_id: str) -> List[AlbumSession]:
        """Get all album sessions for an intro."""
        result = await db.execute(
            select(AlbumSession)
            .options(
                selectinload(AlbumSession.album_images).selectinload(AlbumImage.session_image)
            )
            .where(AlbumSession.intro_id == intro_id)
            .order_by(AlbumSession.order.asc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def update_album_session(
        db: AsyncSession,
        session_id: str,
        data: AlbumSessionUpdateRequest
    ) -> Optional[AlbumSession]:
        """Update an album session."""
        album_session = await AlbumSessionService.get_album_session_by_id(db, session_id)
        if not album_session:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(album_session, key, value)
        
        await db.commit()
        await db.refresh(album_session)
        return album_session
    
    @staticmethod
    async def delete_album_session(db: AsyncSession, session_id: str) -> bool:
        """Delete an album session."""
        album_session = await AlbumSessionService.get_album_session_by_id(db, session_id)
        if not album_session:
            return False
        
        await db.delete(album_session)
        await db.commit()
        return True


class AlbumImageService:
    """Service for AlbumImage CRUD operations."""
    
    @staticmethod
    async def create_album_image(
        db: AsyncSession,
        album_session_id: str,
        data: AlbumImageCreateRequest
    ) -> AlbumImage:
        """Create a new album image with auto-incremented order."""
        # Get max order in this session
        result = await db.execute(
            select(func.max(AlbumImage.order))
            .where(AlbumImage.album_session_id == album_session_id)
        )
        max_order = result.scalar() or 0
        
        # Use provided order or auto-calculate (starting from 1)
        order = data.order if data.order is not None else max_order + 1
        
        # Create image
        album_image = AlbumImage(
            album_session_id=album_session_id, 
            session_image_id=data.session_image_id,
            order=order
        )
        db.add(album_image)
        await db.commit()
        
        # Reload with session_image relationship
        result = await db.execute(
            select(AlbumImage)
            .options(selectinload(AlbumImage.session_image))
            .where(AlbumImage.id == album_image.id)
        )
        return result.scalar_one()
    
    @staticmethod
    async def get_album_image_by_id(db: AsyncSession, image_id: str) -> Optional[AlbumImage]:
        """Get album image by ID."""
        result = await db.execute(select(AlbumImage).where(AlbumImage.id == image_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_album_images_by_session(
        db: AsyncSession,
        album_session_id: str
    ) -> List[AlbumImage]:
        """Get all album images for an album session."""
        result = await db.execute(
            select(AlbumImage)
            .where(AlbumImage.album_session_id == album_session_id)
            .order_by(AlbumImage.order.asc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def update_album_image(
        db: AsyncSession,
        image_id: str,
        data: AlbumImageUpdateRequest
    ) -> Optional[AlbumImage]:
        """Update an album image."""
        album_image = await AlbumImageService.get_album_image_by_id(db, image_id)
        if not album_image:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(album_image, key, value)
        
        await db.commit()
        await db.refresh(album_image)
        return album_image
    
    @staticmethod
    async def delete_album_image(db: AsyncSession, image_id: str) -> bool:
        """Delete an album image and reindex remaining images."""
        album_image = await AlbumImageService.get_album_image_by_id(db, image_id)
        if not album_image:
            return False
        
        session_id = album_image.album_session_id
        deleted_order = album_image.order
        
        await db.delete(album_image)
        await db.commit()
        
        # Reindex remaining images (starting from 1)
        remaining_images = await AlbumImageService.get_album_images_by_session(db, session_id)
        for idx, img in enumerate(remaining_images, start=1):
            if img.order != idx:
                img.order = idx
        await db.commit()
        
        return True
