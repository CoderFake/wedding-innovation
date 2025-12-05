from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import CHAR
import uuid

from app.models.base import Base, TimestampMixin


class SessionImage(Base, TimestampMixin):
    """
    Session Image model for storing images used across different sections.
    """
    __tablename__ = "session_images"
    
    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    intro_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("intros.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # Relationships
    intro = relationship("Intro", back_populates="session_images")
    
    def __repr__(self) -> str:
        return f"<SessionImage(id={self.id}, url={self.url})>"
