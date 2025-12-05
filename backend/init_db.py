"""
Database initialization script.
Creates tables and initial root user if they don't exist.
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.models.base import Base
from app.models.user import User, UserRole
from app.models.intro import Intro
from app.models.date_of_organization import DateOfOrganization
from app.models.section import HeaderSection, FamilySection, InviteSection, FooterSection
from app.models.album import AlbumSession, AlbumImage
from app.models.invite import Guest
from app.models.session_image import SessionImage
from app.utils.auth import hash_password
from config.settings import settings


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_database():
    """
    Initialize database schema.
    Creates all tables if they don't exist.
    """
    print("Initializing database schema...")
    
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        print("Database schema initialized successfully")
        return True
        
    except Exception as e:
        print(f" Failed to initialize database: {e}")
        return False


async def create_root_user():
    """
    Create root user if it doesn't exist.
    Uses ROOT_USERNAME and ROOT_PASSWORD from environment variables.
    """
    root_username = settings.ROOT_USERNAME
    root_password = settings.ROOT_PASSWORD
    
    if not root_username or not root_password:
        print("⚠️  ROOT_USERNAME or ROOT_PASSWORD not set in environment")
        print("Skipping root user creation")
        return False
    
    print(f"Checking for root user: {root_username}")
    
    try:
        async with SessionLocal() as session:
            result = await session.execute(
                text("SELECT id FROM users WHERE role = :role"),
                {"role": UserRole.ROOT.value}
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f" Root user already exists")
                return True
            
            print(f"Creating root user: {root_username}")
            
            password_hash = hash_password(root_password)
            
            root_user = User(
                username=root_username,
                password_hash=password_hash,
                role=UserRole.ROOT,
                is_active=True
            )
            
            session.add(root_user)
            await session.commit()
            
            print(f" Root user created successfully: {root_username}")
            print(f"   Password: {root_password}")
            print("     IMPORTANT: Change the password after first login!")
            return True
            
    except Exception as e:
        print(f" Failed to create root user: {e}")
        return False


async def main():
    """
    Main initialization function.
    """
    print("=" * 60)
    print("DATABASE INITIALIZATION")
    print("=" * 60)
    print(f"Environment: {settings.ENV}")
    print(f"Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'N/A'}")
    print("=" * 60)
    
    db_success = await init_database()
    if not db_success:
        print(" Database initialization failed")
        sys.exit(1)
    
    user_success = await create_root_user()
    if not user_success:
        print("  Root user creation failed or skipped")
    
    print("=" * 60)
    print("INITIALIZATION COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
