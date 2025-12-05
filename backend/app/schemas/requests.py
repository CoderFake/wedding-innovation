from datetime import date, time
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# ==================== User Schemas ====================

class UserCreateRequest(BaseModel):
    """Request schema for creating a new user."""
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field("user", pattern="^(root|user)$")
    max_invite: int = Field(1, ge=1, le=1000)


class UserLoginRequest(BaseModel):
    """Request schema for user login."""
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdateRequest(BaseModel):
    """Request schema for updating a user."""
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    password: Optional[str] = Field(None, min_length=6, max_length=100)
    is_active: Optional[bool] = None
    max_invite: Optional[int] = Field(None, ge=1, le=1000)


# ==================== Intro Schemas ====================

class IntroCreateRequest(BaseModel):
    """Request schema for creating intro."""
    groom_name: str = Field(..., min_length=1, max_length=255)
    groom_full_name: str = Field(..., min_length=1, max_length=255)
    bride_name: str = Field(..., min_length=1, max_length=255)
    bride_full_name: str = Field(..., min_length=1, max_length=255)


class IntroUpdateRequest(BaseModel):
    """Request schema for updating intro."""
    groom_name: Optional[str] = Field(None, min_length=1, max_length=255)
    groom_full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    bride_name: Optional[str] = Field(None, min_length=1, max_length=255)
    bride_full_name: Optional[str] = Field(None, min_length=1, max_length=255)


# ==================== Date of Organization Schemas ====================

class DateOfOrganizationCreateRequest(BaseModel):
    """Request schema for creating date of organization."""
    model_config = ConfigDict(extra='ignore')
    
    lunar_day: str = Field(..., min_length=1, max_length=100)
    calendar_day: date
    event_time: time
    venue_address: Optional[str] = None
    map_iframe: Optional[str] = None


class DateOfOrganizationUpdateRequest(BaseModel):
    """Request schema for updating date of organization."""
    model_config = ConfigDict(extra='ignore')
    
    lunar_day: Optional[str] = Field(None, min_length=1, max_length=100)
    calendar_day: Optional[date] = None
    event_time: Optional[time] = None
    venue_address: Optional[str] = None
    map_iframe: Optional[str] = None


# ==================== Guest Schemas ====================

class GuestCreateRequest(BaseModel):
    """Request schema for creating a guest."""
    name: str = Field(..., min_length=1, max_length=255)
    user_relationship: str = Field(..., min_length=1, max_length=100)
    confirm: bool = False


class GuestUpdateRequest(BaseModel):
    """Request schema for updating a guest."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    user_relationship: Optional[str] = Field(None, min_length=1, max_length=100)
    confirm: Optional[bool] = None


# ==================== Session Image Schemas ====================

class SessionImageCreateRequest(BaseModel):
    """Request schema for creating a session image."""
    url: str = Field(..., min_length=1, max_length=500)


class SessionImageUpdateRequest(BaseModel):
    """Request schema for updating a session image."""
    url: str = Field(..., min_length=1, max_length=500)


# ==================== Header Section Schemas ====================

class HeaderSectionCreateRequest(BaseModel):
    """Request schema for creating header section."""
    session_image_id: Optional[str] = None


class HeaderSectionUpdateRequest(BaseModel):
    """Request schema for updating header section."""
    session_image_id: Optional[str] = None


# ==================== Family Section Schemas ====================

class FamilySectionCreateRequest(BaseModel):
    """Request schema for creating family section."""
    groom_father_name: Optional[str] = Field(None, max_length=255)
    groom_mother_name: Optional[str] = Field(None, max_length=255)
    groom_address: Optional[str] = None
    bride_father_name: Optional[str] = Field(None, max_length=255)
    bride_mother_name: Optional[str] = Field(None, max_length=255)
    bride_address: Optional[str] = None
    session_image_id: Optional[str] = None
    groom_image_id: Optional[str] = None
    bride_image_id: Optional[str] = None


class FamilySectionUpdateRequest(BaseModel):
    """Request schema for updating family section."""
    groom_father_name: Optional[str] = Field(None, max_length=255)
    groom_mother_name: Optional[str] = Field(None, max_length=255)
    groom_address: Optional[str] = None
    bride_father_name: Optional[str] = Field(None, max_length=255)
    bride_mother_name: Optional[str] = Field(None, max_length=255)
    bride_address: Optional[str] = None
    session_image_id: Optional[str] = None
    groom_image_id: Optional[str] = None
    bride_image_id: Optional[str] = None


# ==================== Invite Section Schemas ====================

class InviteSectionCreateRequest(BaseModel):
    """Request schema for creating invite section."""
    left_image_id: Optional[str] = None
    center_image_id: Optional[str] = None
    right_image_id: Optional[str] = None
    greeting_text: Optional[str] = None
    attendance_request_text: Optional[str] = None


class InviteSectionUpdateRequest(BaseModel):
    """Request schema for updating invite section."""
    left_image_id: Optional[str] = None
    center_image_id: Optional[str] = None
    right_image_id: Optional[str] = None
    greeting_text: Optional[str] = None
    attendance_request_text: Optional[str] = None


# ==================== Album Session Schemas ====================

class AlbumSessionCreateRequest(BaseModel):
    """Request schema for creating album session."""
    title: Optional[str] = Field(None, max_length=255)
    order: int = Field(0, ge=0)


class AlbumSessionUpdateRequest(BaseModel):
    """Request schema for updating album session."""
    title: Optional[str] = Field(None, max_length=255)
    order: Optional[int] = Field(None, ge=0)


# ==================== Album Image Schemas ====================

class AlbumImageCreateRequest(BaseModel):
    """Request schema for creating album image."""
    session_image_id: str
    order: Optional[int] = Field(None, ge=0)  # Optional - will auto-calculate if not provided


class AlbumImageUpdateRequest(BaseModel):
    """Request schema for updating album image."""
    session_image_id: Optional[str] = None
    order: Optional[int] = Field(None, ge=0)


# ==================== Footer Section Schemas ====================

class FooterSectionCreateRequest(BaseModel):
    """Request schema for creating footer section."""
    thank_you_text: Optional[str] = None
    closing_message: Optional[str] = None
    session_image_id: Optional[str] = None


class FooterSectionUpdateRequest(BaseModel):
    """Request schema for updating footer section."""
    thank_you_text: Optional[str] = None
    closing_message: Optional[str] = None
    session_image_id: Optional[str] = None

