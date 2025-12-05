from datetime import date, time
from sqlalchemy import Date, Time, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import CHAR
from typing import Optional
import uuid

from app.models.base import Base, TimestampMixin


class DateOfOrganization(Base, TimestampMixin):
    """
    Date of organization model for wedding event.
    """
    __tablename__ = "date_of_organizations"
    
    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    intro_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("intros.id", ondelete="CASCADE"), nullable=False, unique=True)
    lunar_day: Mapped[str] = mapped_column(String(100), nullable=False)
    calendar_day: Mapped[date] = mapped_column(Date, nullable=False)
    event_time: Mapped[time] = mapped_column(Time, nullable=False)
    venue_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Wedding venue address
    map_iframe: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Google Maps embed iframe
    
    # Relationships
    intro = relationship("Intro", back_populates="date_of_organization")
    
    def __repr__(self) -> str:
        return f"<DateOfOrganization(id={self.id}, calendar_day={self.calendar_day})>"
