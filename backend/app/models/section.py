from sqlalchemy import String, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import CHAR
from typing import Optional
import uuid

from app.models.base import Base, TimestampMixin


class HeaderSection(Base, TimestampMixin):
    """
    Header section model for wedding page header.
    """
    __tablename__ = "header_sections"
    
    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    intro_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("intros.id", ondelete="CASCADE"), nullable=False, unique=True)
    session_image_id: Mapped[Optional[str]] = mapped_column(CHAR(36), ForeignKey("session_images.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    intro = relationship("Intro", back_populates="header_section")
    session_image = relationship("SessionImage")
    
    def __repr__(self) -> str:
        return f"<HeaderSection(id={self.id}, intro_id={self.intro_id})>"


class FamilySection(Base, TimestampMixin):
    """
    Family section model for groom and bride family information.
    """
    __tablename__ = "family_sections"
    
    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    intro_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("intros.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Groom's family
    groom_father_name: Mapped[str] = mapped_column(String(255), nullable=False)
    groom_mother_name: Mapped[str] = mapped_column(String(255), nullable=False)
    groom_address: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Bride's family
    bride_father_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bride_mother_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bride_address: Mapped[str] = mapped_column(Text, nullable=False)
    
    session_image_id: Mapped[Optional[str]] = mapped_column(CHAR(36), ForeignKey("session_images.id", ondelete="SET NULL"), nullable=True)
    
    # Groom and Bride individual images
    groom_image_id: Mapped[Optional[str]] = mapped_column(CHAR(36), ForeignKey("session_images.id", ondelete="SET NULL"), nullable=True)
    bride_image_id: Mapped[Optional[str]] = mapped_column(CHAR(36), ForeignKey("session_images.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    intro = relationship("Intro", back_populates="family_section")
    session_image = relationship("SessionImage", foreign_keys=[session_image_id])
    groom_image = relationship("SessionImage", foreign_keys=[groom_image_id])
    bride_image = relationship("SessionImage", foreign_keys=[bride_image_id])
    
    def __repr__(self) -> str:
        return f"<FamilySection(id={self.id}, intro_id={self.intro_id})>"


class InviteSection(Base, TimestampMixin):
    """
    Invite section model with three images (left, center, right).
    """
    __tablename__ = "invite_sections"
    
    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    intro_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("intros.id", ondelete="CASCADE"), nullable=False, unique=True)
    left_image_id: Mapped[Optional[str]] = mapped_column(CHAR(36), ForeignKey("session_images.id", ondelete="SET NULL"), nullable=True)
    center_image_id: Mapped[Optional[str]] = mapped_column(CHAR(36), ForeignKey("session_images.id", ondelete="SET NULL"), nullable=True)
    right_image_id: Mapped[Optional[str]] = mapped_column(CHAR(36), ForeignKey("session_images.id", ondelete="SET NULL"), nullable=True)
    greeting_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    attendance_request_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    intro = relationship("Intro", back_populates="invite_section")
    left_image = relationship("SessionImage", foreign_keys=[left_image_id])
    center_image = relationship("SessionImage", foreign_keys=[center_image_id])
    right_image = relationship("SessionImage", foreign_keys=[right_image_id])
    
    def __repr__(self) -> str:
        return f"<InviteSection(id={self.id}, intro_id={self.intro_id})>"


class FooterSection(Base, TimestampMixin):
    """
    Footer section model with thanks text and image.
    """
    __tablename__ = "footer_sections"
    
    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    intro_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("intros.id", ondelete="CASCADE"), nullable=False, unique=True)
    thank_you_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    closing_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    session_image_id: Mapped[Optional[str]] = mapped_column(CHAR(36), ForeignKey("session_images.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    intro = relationship("Intro", back_populates="footer_section")
    session_image = relationship("SessionImage")
    
    def __repr__(self) -> str:
        return f"<FooterSection(id={self.id}, intro_id={self.intro_id})>"

