from datetime import datetime, date, time
from typing import Optional, List, Generic, TypeVar
from pydantic import BaseModel, ConfigDict


# ==================== User Responses ====================

class UserResponse(BaseModel):
    """Response schema for user."""
    id: int
    username: str
    subdomain: Optional[str] = None
    role: str
    is_active: bool
    max_invite: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Response schema for authentication token."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
    redirect_url: Optional[str] = None  # URL to redirect after login


# ==================== Intro Responses ====================

class IntroResponse(BaseModel):
    """Response schema for intro."""
    id: str
    user_id: int
    groom_name: str
    groom_full_name: str
    bride_name: str
    bride_full_name: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Date of Organization Responses ====================

class DateOfOrganizationResponse(BaseModel):
    """Response schema for date of organization."""
    id: str
    intro_id: str
    lunar_day: str
    calendar_day: date
    event_time: time
    venue_address: Optional[str] = None
    map_iframe: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Guest Responses ====================

class GuestResponse(BaseModel):
    """Response schema for guest."""
    id: str
    intro_id: str
    name: str
    user_relationship: str
    confirm: bool
    guest_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class GuestListResponse(BaseModel):
    """Response schema for list of guests."""
    items: List[GuestResponse]
    total: int
    page: int
    size: int
    pages: int


# ==================== Session Image Responses ====================

class SessionImageResponse(BaseModel):
    """Response schema for session image."""
    id: str
    intro_id: str
    url: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Header Section Responses ====================

class HeaderSectionResponse(BaseModel):
    """Response schema for header section."""
    id: str
    intro_id: str
    session_image_id: Optional[str] = None
    photo_url: Optional[str] = None  # Added for frontend
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Family Section Responses ====================

class FamilySectionResponse(BaseModel):
    """Response schema for family section."""
    id: str
    intro_id: str
    groom_father_name: str
    groom_mother_name: str
    groom_address: str
    bride_father_name: str
    bride_mother_name: str
    bride_address: str
    session_image_id: Optional[str] = None
    photo_url: Optional[str] = None  # Added for frontend
    groom_image_id: Optional[str] = None
    groom_image_url: Optional[str] = None  # Added for frontend
    bride_image_id: Optional[str] = None
    bride_image_url: Optional[str] = None  # Added for frontend
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Invite Section Responses ====================

class InviteSectionResponse(BaseModel):
    """Response schema for invite section."""
    id: str
    intro_id: str
    left_image_id: Optional[str] = None
    left_image_url: Optional[str] = None  # Added for frontend
    center_image_id: Optional[str] = None
    center_image_url: Optional[str] = None  # Added for frontend
    right_image_id: Optional[str] = None
    right_image_url: Optional[str] = None  # Added for frontend
    greeting_text: Optional[str] = None
    attendance_request_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Album Session Responses ====================

class AlbumImageWithUrlResponse(BaseModel):
    """Album image with URL."""
    id: str
    image_url: str
    order: int

class AlbumSessionResponse(BaseModel):
    """Response schema for album session."""
    id: str
    intro_id: str
    title: Optional[str] = None
    order: int
    images: List['AlbumImageWithUrlResponse'] = []  # Added for frontend
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Album Image Responses ====================

class AlbumImageResponse(BaseModel):
    """Response schema for album image."""
    id: str
    album_session_id: str
    session_image_id: str
    order: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Footer Section Responses ====================

class FooterSectionResponse(BaseModel):
    """Response schema for footer section."""
    id: str
    intro_id: str
    thank_you_text: Optional[str] = None
    closing_message: Optional[str] = None
    session_image_id: Optional[str] = None
    photo_url: Optional[str] = None  # Added for frontend
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Complete Landing Page Response ====================

class CompleteLandingPageResponse(BaseModel):
    """Complete landing page with all sections."""
    guest: Optional[GuestResponse] = None  # Guest info for public page
    intro: IntroResponse
    date_of_organization: Optional[DateOfOrganizationResponse] = None
    header_section: Optional[HeaderSectionResponse] = None
    family_section: Optional[FamilySectionResponse] = None
    invite_section: Optional[InviteSectionResponse] = None
    album_sessions: List[AlbumSessionResponse] = []
    footer_section: Optional[FooterSectionResponse] = None


# ==================== Generic Responses ====================

T = TypeVar('T')

class GenericResponse(BaseModel, Generic[T]):
    """Generic response wrapper."""
    success: bool = True
    message: str = "Operation successful"
    data: Optional[T] = None


class ErrorResponse(BaseModel):
    """Error response schema."""
    success: bool = False
    message: str
    detail: Optional[str] = None
    error_code: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response."""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

