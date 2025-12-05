from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import CHAR
import uuid

from app.models.base import Base, TimestampMixin


class Intro(Base, TimestampMixin):
    """
    Intro/Wedding information model.
    Contains groom and bride information.
    """
    __tablename__ = "intros"
    
    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    groom_name: Mapped[str] = mapped_column(String(255), nullable=False)
    groom_full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bride_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bride_full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="intros")
    date_of_organization = relationship("DateOfOrganization", back_populates="intro", uselist=False, cascade="all, delete-orphan")
    guests = relationship("Guest", back_populates="intro", cascade="all, delete-orphan")
    session_images = relationship("SessionImage", back_populates="intro", cascade="all, delete-orphan")
    header_section = relationship("HeaderSection", back_populates="intro", uselist=False, cascade="all, delete-orphan")
    family_section = relationship("FamilySection", back_populates="intro", uselist=False, cascade="all, delete-orphan")
    invite_section = relationship("InviteSection", back_populates="intro", uselist=False, cascade="all, delete-orphan")
    album_sessions = relationship("AlbumSession", back_populates="intro", cascade="all, delete-orphan")
    footer_section = relationship("FooterSection", back_populates="intro", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Intro(id={self.id}, groom={self.groom_name}, bride={self.bride_name})>"
