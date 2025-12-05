from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import CHAR
from typing import Any
import uuid

from app.models.base import Base, TimestampMixin


class Guest(Base, TimestampMixin):
    """
    Guest model for wedding invitation management.
    """
    __tablename__ = "guests"
    
    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    intro_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("intros.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    confirm: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    user_relationship: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Relationships
    intro = relationship("Intro", back_populates="guests")
    
    def __repr__(self) -> str:
        return f"<Guest(id={self.id}, name={self.name}, relationship={self.relationship})>"

