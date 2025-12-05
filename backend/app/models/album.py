from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import CHAR
import uuid

from app.models.base import Base, TimestampMixin


class AlbumSession(Base, TimestampMixin):
    """
    Album session model for grouping album images.
    """
    __tablename__ = "album_sessions"
    
    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    intro_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("intros.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Relationships
    intro = relationship("Intro", back_populates="album_sessions")
    album_images = relationship("AlbumImage", back_populates="album_session", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<AlbumSession(id={self.id}, intro_id={self.intro_id})>"


class AlbumImage(Base, TimestampMixin):
    """
    Album image model for storing images in album sessions.
    """
    __tablename__ = "album_images"
    
    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    album_session_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("album_sessions.id", ondelete="CASCADE"), nullable=False)
    session_image_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("session_images.id", ondelete="CASCADE"), nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Relationships
    album_session = relationship("AlbumSession", back_populates="album_images")
    session_image = relationship("SessionImage")
    
    def __repr__(self) -> str:
        return f"<AlbumImage(id={self.id}, album_session_id={self.album_session_id})>"
