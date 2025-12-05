from typing import Optional, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.invite import Guest
from app.schemas.requests import GuestCreateRequest, GuestUpdateRequest


class GuestService:
    """Service layer for Guest CRUD operations."""
    
    @staticmethod
    async def create_guest(db: AsyncSession, intro_id: str, guest_data: GuestCreateRequest) -> Guest:
        """
        Create a new guest.
        
        Args:
            db: Database session
            intro_id: Intro ID (UUID string)
            guest_data: Guest creation data
            
        Returns:
            Created guest object
        """
        guest = Guest(intro_id=intro_id, **guest_data.model_dump())
        db.add(guest)
        await db.commit()
        await db.refresh(guest)
        return guest
    
    @staticmethod
    async def get_guest_by_id(db: AsyncSession, guest_id: str) -> Optional[Guest]:
        """
        Get guest by ID.
        
        Args:
            db: Database session
            guest_id: Guest ID (UUID string)
            
        Returns:
            Guest object or None
        """
        result = await db.execute(select(Guest).where(Guest.id == guest_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_guests_by_intro(
        db: AsyncSession,
        intro_id: str,
        skip: int = 0,
        limit: int = 1000,
        confirm: Optional[bool] = None
    ) -> tuple[List[Guest], int]:
        """
        Get list of guests for an intro with pagination.
        
        Args:
            db: Database session
            intro_id: Intro ID (UUID string)
            skip: Number of records to skip
            limit: Maximum number of records to return
            confirm: Filter by confirmation status
            
        Returns:
            Tuple of (list of guests, total count)
        """
        query = select(Guest).where(Guest.intro_id == intro_id)
        count_query = select(func.count()).select_from(Guest).where(Guest.intro_id == intro_id)
        
        if confirm is not None:
            query = query.where(Guest.confirm == confirm)
            count_query = count_query.where(Guest.confirm == confirm)
        
        # Get total count
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()
        
        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(Guest.created_at.desc())
        result = await db.execute(query)
        guests = result.scalars().all()
        
        return list(guests), total
    
    @staticmethod
    async def update_guest(
        db: AsyncSession,
        guest_id: str,
        guest_data: GuestUpdateRequest
    ) -> Optional[Guest]:
        """
        Update a guest.
        
        Args:
            db: Database session
            guest_id: Guest ID (UUID string)
            guest_data: Update data
            
        Returns:
            Updated guest object or None
        """
        guest = await GuestService.get_guest_by_id(db, guest_id)
        if not guest:
            return None
        
        update_data = guest_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(guest, key, value)
        
        await db.commit()
        await db.refresh(guest)
        return guest
    
    @staticmethod
    async def get_first_guest(db: AsyncSession, intro_id: str) -> Optional[Guest]:
        """
        Get the first (demo) guest for an intro.
        
        Args:
            db: Database session
            intro_id: Intro ID (UUID string)
            
        Returns:
            First guest object or None
        """
        result = await db.execute(
            select(Guest)
            .where(Guest.intro_id == intro_id)
            .order_by(Guest.created_at.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def is_first_guest(db: AsyncSession, guest_id: str) -> bool:
        """
        Check if a guest is the first (demo) guest.
        
        Args:
            db: Database session
            guest_id: Guest ID to check
            
        Returns:
            True if it's the first guest, False otherwise
        """
        guest = await GuestService.get_guest_by_id(db, guest_id)
        if not guest:
            return False
        
        first_guest = await GuestService.get_first_guest(db, guest.intro_id)
        return first_guest and first_guest.id == guest_id
    
    @staticmethod
    async def delete_guest(db: AsyncSession, guest_id: str) -> tuple[bool, str]:
        """
        Delete a guest (cannot delete first/demo guest).
        
        Args:
            db: Database session
            guest_id: Guest ID (UUID string)
            
        Returns:
            Tuple of (success, message)
        """
        guest = await GuestService.get_guest_by_id(db, guest_id)
        if not guest:
            return False, "Guest not found"
        
        # Check if it's the first guest (demo guest)
        if await GuestService.is_first_guest(db, guest_id):
            return False, "Cannot delete demo guest"
        
        await db.delete(guest)
        await db.commit()
        return True, "Guest deleted successfully"
    
    @staticmethod
    async def get_guest_stats(db: AsyncSession, intro_id: str) -> dict:
        """
        Get guest statistics for an intro.
        
        Args:
            db: Database session
            intro_id: Intro ID (UUID string)
            
        Returns:
            Dictionary with guest statistics
        """
        total_result = await db.execute(
            select(func.count()).select_from(Guest).where(Guest.intro_id == intro_id)
        )
        total = total_result.scalar_one()
        
        confirmed_result = await db.execute(
            select(func.count()).select_from(Guest).where(
                Guest.intro_id == intro_id,
                Guest.confirm == True
            )
        )
        confirmed = confirmed_result.scalar_one()
        
        return {
            "total_guests": total,
            "confirmed": confirmed,
            "pending": total - confirmed
        }

    @staticmethod
    async def confirm_guest_attendance(db: AsyncSession, guest_id: str) -> Optional[Guest]:
        """
        Confirm guest attendance (set confirm = True).
        
        Args:
            db: Database session
            guest_id: Guest ID (UUID string)
            
        Returns:
            Updated guest object or None
        """
        guest = await GuestService.get_guest_by_id(db, guest_id)
        if not guest:
            return None
        
        guest.confirm = True
        await db.commit()
        await db.refresh(guest)
        return guest

