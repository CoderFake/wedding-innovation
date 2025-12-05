from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_user_by_subdomain, require_user_by_subdomain, get_subdomain_from_request
from app.models.user import User
from app.services.intro import IntroService
from app.services.section import (
    DateOfOrganizationService,
    SessionImageService,
    HeaderSectionService,
    FamilySectionService,
    InviteSectionService,
    FooterSectionService
)
from app.services.album import AlbumSessionService, AlbumImageService
from app.services.invite import GuestService
from app.schemas.requests import (
    IntroCreateRequest, IntroUpdateRequest,
    DateOfOrganizationCreateRequest,
    SessionImageCreateRequest,
    HeaderSectionCreateRequest,
    FamilySectionCreateRequest,
    InviteSectionCreateRequest,
    FooterSectionCreateRequest,
    AlbumSessionCreateRequest, AlbumSessionUpdateRequest,
    AlbumImageCreateRequest,
    GuestCreateRequest, GuestUpdateRequest
)
from app.schemas.responses import (
    IntroResponse,
    CompleteLandingPageResponse,
    DateOfOrganizationResponse,
    SessionImageResponse,
    HeaderSectionResponse,
    FamilySectionResponse,
    InviteSectionResponse,
    FooterSectionResponse,
    AlbumSessionResponse,
    AlbumImageWithUrlResponse,
    GuestResponse,
    PaginatedResponse,
    GenericResponse
)


router = APIRouter(prefix="/landing-page", tags=["Landing Page"])


# ==================== Subdomain-based Public Endpoints ====================

@router.get("/by-subdomain", response_model=CompleteLandingPageResponse)
async def get_landing_page_by_subdomain(
    request: Request,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_user_by_subdomain)
):
    """
    Get complete landing page by subdomain (from X-Subdomain header).
    This returns the wedding info without guest-specific data.
    """
    data = await IntroService.get_landing_page_by_user_id(db, owner.id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wedding invitation not found")
    
    return CompleteLandingPageResponse(
        guest=None,  # No guest for subdomain-only access
        intro=IntroResponse.model_validate(data["intro"]),
        date_of_organization=DateOfOrganizationResponse.model_validate(data["date_of_organization"]) if data["date_of_organization"] else None,
        header_section=HeaderSectionResponse.model_validate(data["header_section"]) if data["header_section"] else None,
        family_section=FamilySectionResponse.model_validate(data["family_section"]) if data["family_section"] else None,
        invite_section=InviteSectionResponse.model_validate(data["invite_section"]) if data["invite_section"] else None,
        album_sessions=[AlbumSessionResponse.model_validate(s) for s in data["album_sessions"]],
        footer_section=FooterSectionResponse.model_validate(data["footer_section"]) if data["footer_section"] else None
    )


@router.get("/by-subdomain/{guest_id}", response_model=CompleteLandingPageResponse)
async def get_landing_page_by_subdomain_and_guest(
    guest_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_user_by_subdomain)
):
    """
    Get complete landing page by subdomain and guest ID.
    Validates that the guest belongs to this subdomain's wedding.
    """
    # Verify guest belongs to this user's intro
    guest = await IntroService.get_guest_by_id_and_user(db, guest_id, owner.id)
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Guest not found or does not belong to this wedding"
        )
    
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wedding invitation not found")
    
    return CompleteLandingPageResponse(
        guest=GuestResponse.model_validate(data["guest"]) if data.get("guest") else None,
        intro=IntroResponse.model_validate(data["intro"]),
        date_of_organization=DateOfOrganizationResponse.model_validate(data["date_of_organization"]) if data["date_of_organization"] else None,
        header_section=HeaderSectionResponse.model_validate(data["header_section"]) if data["header_section"] else None,
        family_section=FamilySectionResponse.model_validate(data["family_section"]) if data["family_section"] else None,
        invite_section=InviteSectionResponse.model_validate(data["invite_section"]) if data["invite_section"] else None,
        album_sessions=[AlbumSessionResponse.model_validate(s) for s in data["album_sessions"]],
        footer_section=FooterSectionResponse.model_validate(data["footer_section"]) if data["footer_section"] else None
    )


@router.post("/by-subdomain/{guest_id}/confirm", response_model=GuestResponse)
async def confirm_guest_by_subdomain(
    guest_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_user_by_subdomain)
):
    """
    Confirm guest attendance by subdomain and guest ID.
    Validates that the guest belongs to this subdomain's wedding.
    """
    # Verify guest belongs to this user's intro
    guest = await IntroService.get_guest_by_id_and_user(db, guest_id, owner.id)
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Guest not found or does not belong to this wedding"
        )
    
    updated_guest = await GuestService.confirm_guest_attendance(db, guest_id)
    if not updated_guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    
    return GuestResponse.model_validate(updated_guest)


@router.get("/by-subdomain/{guest_id}/intro", response_model=IntroResponse)
async def get_intro_by_subdomain(
    guest_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_user_by_subdomain)
):
    """Get intro section by subdomain and guest ID."""
    guest = await IntroService.get_guest_by_id_and_user(db, guest_id, owner.id)
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    return IntroResponse.model_validate(data["intro"])


@router.get("/by-subdomain/{guest_id}/header", response_model=HeaderSectionResponse)
async def get_header_by_subdomain(
    guest_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_user_by_subdomain)
):
    """Get header section by subdomain and guest ID."""
    guest = await IntroService.get_guest_by_id_and_user(db, guest_id, owner.id)
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data or not data["header_section"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Header section not found")
    
    header = data["header_section"]
    response_dict = {
        "id": header.id,
        "intro_id": header.intro_id,
        "session_image_id": header.session_image_id,
        "photo_url": header.session_image.url if header.session_image else None,
        "created_at": header.created_at,
        "updated_at": header.updated_at
    }
    return HeaderSectionResponse(**response_dict)


@router.get("/by-subdomain/{guest_id}/family", response_model=FamilySectionResponse)
async def get_family_by_subdomain(
    guest_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_user_by_subdomain)
):
    """Get family section by subdomain and guest ID."""
    guest = await IntroService.get_guest_by_id_and_user(db, guest_id, owner.id)
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data or not data["family_section"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family section not found")
    
    family = data["family_section"]
    response_dict = {
        "id": family.id,
        "intro_id": family.intro_id,
        "groom_father_name": family.groom_father_name,
        "groom_mother_name": family.groom_mother_name,
        "groom_address": family.groom_address,
        "bride_father_name": family.bride_father_name,
        "bride_mother_name": family.bride_mother_name,
        "bride_address": family.bride_address,
        "session_image_id": family.session_image_id,
        "photo_url": family.session_image.url if family.session_image else None,
        "groom_image_id": family.groom_image_id,
        "groom_image_url": family.groom_image.url if family.groom_image else None,
        "bride_image_id": family.bride_image_id,
        "bride_image_url": family.bride_image.url if family.bride_image else None,
        "created_at": family.created_at,
        "updated_at": family.updated_at
    }
    return FamilySectionResponse(**response_dict)


@router.get("/by-subdomain/{guest_id}/invite-section", response_model=InviteSectionResponse)
async def get_invite_section_by_subdomain(
    guest_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_user_by_subdomain)
):
    """Get invite section by subdomain and guest ID."""
    guest = await IntroService.get_guest_by_id_and_user(db, guest_id, owner.id)
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data or not data["invite_section"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite section not found")
    
    invite = data["invite_section"]
    invite_images = data.get("invite_images", {})
    response_dict = {
        "id": invite.id,
        "intro_id": invite.intro_id,
        "left_image_id": invite.left_image_id,
        "center_image_id": invite.center_image_id,
        "right_image_id": invite.right_image_id,
        "left_image_url": invite_images.get("left").url if invite_images.get("left") else None,
        "center_image_url": invite_images.get("center").url if invite_images.get("center") else None,
        "right_image_url": invite_images.get("right").url if invite_images.get("right") else None,
        "greeting_text": invite.greeting_text,
        "attendance_request_text": invite.attendance_request_text,
        "created_at": invite.created_at,
        "updated_at": invite.updated_at
    }
    return InviteSectionResponse(**response_dict)


@router.get("/by-subdomain/{guest_id}/albums", response_model=list[AlbumSessionResponse])
async def get_albums_by_subdomain(
    guest_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_user_by_subdomain)
):
    """Get album sessions by subdomain and guest ID."""
    guest = await IntroService.get_guest_by_id_and_user(db, guest_id, owner.id)
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    
    album_responses = []
    for album_session in data["album_sessions"]:
        images = []
        for album_image in album_session.album_images:
            image_dict = {
                "id": album_image.id,
                "image_url": album_image.session_image.url if album_image.session_image else None,
                "order": album_image.order
            }
            images.append(image_dict)
        
        album_dict = {
            "id": album_session.id,
            "intro_id": album_session.intro_id,
            "title": album_session.title,
            "order": album_session.order,
            "images": images,
            "created_at": album_session.created_at,
            "updated_at": album_session.updated_at
        }
        album_responses.append(AlbumSessionResponse(**album_dict))
    
    return album_responses


@router.get("/by-subdomain/{guest_id}/footer", response_model=FooterSectionResponse)
async def get_footer_by_subdomain(
    guest_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_user_by_subdomain)
):
    """Get footer section by subdomain and guest ID."""
    guest = await IntroService.get_guest_by_id_and_user(db, guest_id, owner.id)
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data or not data["footer_section"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Footer section not found")
    
    footer = data["footer_section"]
    response_dict = {
        "id": footer.id,
        "intro_id": footer.intro_id,
        "thank_you_text": footer.thank_you_text,
        "closing_message": footer.closing_message,
        "session_image_id": footer.session_image_id,
        "photo_url": footer.session_image.url if footer.session_image else None,
        "created_at": footer.created_at,
        "updated_at": footer.updated_at
    }
    return FooterSectionResponse(**response_dict)


@router.get("/by-subdomain/{guest_id}/date", response_model=DateOfOrganizationResponse)
async def get_date_by_subdomain(
    guest_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_user_by_subdomain)
):
    """Get date of organization by subdomain and guest ID."""
    guest = await IntroService.get_guest_by_id_and_user(db, guest_id, owner.id)
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data or not data["date_of_organization"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Date not found")
    return DateOfOrganizationResponse.model_validate(data["date_of_organization"])


# ==================== Legacy Public Endpoint (backward compatible) ====================

@router.get("/public/{guest_id}", response_model=CompleteLandingPageResponse)
async def get_public_landing_page(
    guest_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get complete landing page by guest ID (public access, no authentication required)."""
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest or wedding invitation not found")
    
    return CompleteLandingPageResponse(
        guest=GuestResponse.model_validate(data["guest"]) if data.get("guest") else None,
        intro=IntroResponse.model_validate(data["intro"]),
        date_of_organization=DateOfOrganizationResponse.model_validate(data["date_of_organization"]) if data["date_of_organization"] else None,
        header_section=HeaderSectionResponse.model_validate(data["header_section"]) if data["header_section"] else None,
        family_section=FamilySectionResponse.model_validate(data["family_section"]) if data["family_section"] else None,
        invite_section=InviteSectionResponse.model_validate(data["invite_section"]) if data["invite_section"] else None,
        album_sessions=[AlbumSessionResponse.model_validate(s) for s in data["album_sessions"]],
        footer_section=FooterSectionResponse.model_validate(data["footer_section"]) if data["footer_section"] else None
    )


@router.get("/public/{guest_id}/intro", response_model=IntroResponse)
async def get_public_intro(guest_id: str, db: AsyncSession = Depends(get_db)):
    """Get intro section by guest ID (public)."""
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    return IntroResponse.model_validate(data["intro"])


@router.get("/public/{guest_id}/header", response_model=HeaderSectionResponse)
async def get_public_header(guest_id: str, db: AsyncSession = Depends(get_db)):
    """Get header section by guest ID (public)."""
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data or not data["header_section"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Header section not found")
    
    header = data["header_section"]
    response_dict = {
        "id": header.id,
        "intro_id": header.intro_id,
        "session_image_id": header.session_image_id,
        "photo_url": header.session_image.url if header.session_image else None,
        "created_at": header.created_at,
        "updated_at": header.updated_at
    }
    return HeaderSectionResponse(**response_dict)


@router.get("/public/{guest_id}/family", response_model=FamilySectionResponse)
async def get_public_family(guest_id: str, db: AsyncSession = Depends(get_db)):
    """Get family section by guest ID (public)."""
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data or not data["family_section"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family section not found")
    
    family = data["family_section"]
    response_dict = {
        "id": family.id,
        "intro_id": family.intro_id,
        "groom_father_name": family.groom_father_name,
        "groom_mother_name": family.groom_mother_name,
        "groom_address": family.groom_address,
        "bride_father_name": family.bride_father_name,
        "bride_mother_name": family.bride_mother_name,
        "bride_address": family.bride_address,
        "session_image_id": family.session_image_id,
        "photo_url": family.session_image.url if family.session_image else None,
        "groom_image_id": family.groom_image_id,
        "groom_image_url": family.groom_image.url if family.groom_image else None,
        "bride_image_id": family.bride_image_id,
        "bride_image_url": family.bride_image.url if family.bride_image else None,
        "created_at": family.created_at,
        "updated_at": family.updated_at
    }
    return FamilySectionResponse(**response_dict)


@router.get("/public/{guest_id}/invite-section", response_model=InviteSectionResponse)
async def get_public_invite_section(guest_id: str, db: AsyncSession = Depends(get_db)):
    """Get invite section by guest ID (public)."""
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data or not data["invite_section"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite section not found")
    
    invite = data["invite_section"]
    invite_images = data.get("invite_images", {})
    response_dict = {
        "id": invite.id,
        "intro_id": invite.intro_id,
        "left_image_id": invite.left_image_id,
        "center_image_id": invite.center_image_id,
        "right_image_id": invite.right_image_id,
        "left_image_url": invite_images.get("left").url if invite_images.get("left") else None,
        "center_image_url": invite_images.get("center").url if invite_images.get("center") else None,
        "right_image_url": invite_images.get("right").url if invite_images.get("right") else None,
        "greeting_text": invite.greeting_text,
        "attendance_request_text": invite.attendance_request_text,
        "created_at": invite.created_at,
        "updated_at": invite.updated_at
    }
    return InviteSectionResponse(**response_dict)


@router.get("/public/{guest_id}/albums", response_model=list[AlbumSessionResponse])
async def get_public_albums(guest_id: str, db: AsyncSession = Depends(get_db)):
    """Get album sessions by guest ID (public)."""
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    
    album_responses = []
    for album_session in data["album_sessions"]:
        # Build images list with URLs
        images = []
        for album_image in album_session.album_images:
            image_dict = {
                "id": album_image.id,
                "image_url": album_image.session_image.url if album_image.session_image else None,
                "order": album_image.order
            }
            images.append(image_dict)
        
        # Build album session response
        album_dict = {
            "id": album_session.id,
            "intro_id": album_session.intro_id,
            "title": album_session.title,
            "order": album_session.order,
            "images": images,
            "created_at": album_session.created_at,
            "updated_at": album_session.updated_at
        }
        album_responses.append(AlbumSessionResponse(**album_dict))
    
    return album_responses


@router.get("/public/{guest_id}/footer", response_model=FooterSectionResponse)
async def get_public_footer(guest_id: str, db: AsyncSession = Depends(get_db)):
    """Get footer section by guest ID (public)."""
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data or not data["footer_section"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Footer section not found")
    
    footer = data["footer_section"]
    response_dict = {
        "id": footer.id,
        "intro_id": footer.intro_id,
        "thank_you_text": footer.thank_you_text,
        "closing_message": footer.closing_message,
        "session_image_id": footer.session_image_id,
        "photo_url": footer.session_image.url if footer.session_image else None,
        "created_at": footer.created_at,
        "updated_at": footer.updated_at
    }
    return FooterSectionResponse(**response_dict)


@router.get("/public/{guest_id}/date", response_model=DateOfOrganizationResponse)
async def get_public_date(guest_id: str, db: AsyncSession = Depends(get_db)):
    """Get date of organization by guest ID (public)."""
    data = await IntroService.get_complete_landing_page_by_guest_id(db, guest_id)
    if not data or not data["date_of_organization"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Date not found")
    return DateOfOrganizationResponse.model_validate(data["date_of_organization"])


@router.post("/public/{guest_id}/confirm", response_model=GuestResponse)
async def confirm_attendance(guest_id: str, db: AsyncSession = Depends(get_db)):
    """Confirm guest attendance (public endpoint - no authentication required)."""
    # Get guest by ID
    guest = await GuestService.get_guest_by_id(db, guest_id)
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    
    # Update confirm status to True
    updated_guest = await GuestService.confirm_guest_attendance(db, guest_id)
    if not updated_guest:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to confirm attendance")
    
    return GuestResponse.model_validate(updated_guest)


# ==================== Intro Endpoints ====================

@router.post("/intro", response_model=IntroResponse, status_code=status.HTTP_201_CREATED)
async def create_intro(
    intro_data: IntroCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create intro (groom and bride names)."""
    # Check if user has reached max_invite limit
    existing_intros = await IntroService.get_intros_by_user_id(db, current_user.id)
    if len(existing_intros) >= current_user.max_invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have reached your maximum invitation limit ({current_user.max_invite})"
        )
    
    intro = await IntroService.create_intro(db, current_user.id, intro_data)
    return IntroResponse.model_validate(intro)


@router.get("/intro", response_model=IntroResponse)
async def get_my_intro(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's intro."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    return IntroResponse.model_validate(intro)


@router.get("/intros", response_model=list[IntroResponse])
async def get_my_intros(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all intros for current user."""
    intros = await IntroService.get_intros_by_user_id(db, current_user.id)
    return [IntroResponse.model_validate(intro) for intro in intros]


@router.put("/intro", response_model=IntroResponse)
async def update_intro(
    intro_data: IntroUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's intro."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    updated = await IntroService.update_intro(db, intro.id, intro_data)
    return IntroResponse.model_validate(updated)


@router.get("/complete", response_model=CompleteLandingPageResponse)
async def get_complete_landing_page(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get complete landing page with all sections."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    data = await IntroService.get_complete_landing_page(db, intro.id)
    return CompleteLandingPageResponse(
        intro=IntroResponse.model_validate(data["intro"]),
        date_of_organization=DateOfOrganizationResponse.model_validate(data["date_of_organization"]) if data["date_of_organization"] else None,
        header_section=HeaderSectionResponse.model_validate(data["header_section"]) if data["header_section"] else None,
        family_section=FamilySectionResponse.model_validate(data["family_section"]) if data["family_section"] else None,
        invite_section=InviteSectionResponse.model_validate(data["invite_section"]) if data["invite_section"] else None,
        album_sessions=[AlbumSessionResponse.model_validate(s) for s in data["album_sessions"]],
        footer_section=FooterSectionResponse.model_validate(data["footer_section"]) if data["footer_section"] else None
    )


# ==================== Date of Organization ====================

@router.get("/date-organization", response_model=DateOfOrganizationResponse)
async def get_my_date_organization(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's date of organization."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    data = await IntroService.get_complete_landing_page(db, intro.id)
    if not data or not data["date_of_organization"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Date of organization not found")
    
    return DateOfOrganizationResponse.model_validate(data["date_of_organization"])


@router.post("/date-organization", response_model=DateOfOrganizationResponse)
async def create_or_update_date_organization(
    data: DateOfOrganizationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create or update wedding date information."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found. Create intro first.")
    
    result = await DateOfOrganizationService.create_or_update(db, intro.id, data)
    return DateOfOrganizationResponse.model_validate(result)


@router.delete("/date-organization", response_model=GenericResponse)
async def delete_date_organization(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete date of organization."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    success = await DateOfOrganizationService.delete_by_intro(db, intro.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Date of organization not found")
    return GenericResponse(message="Date of organization deleted successfully")


# ==================== Session Images ====================

@router.post("/images/upload", response_model=SessionImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_session_image_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a session image file and return URL."""
    import os
    import uuid
    from pathlib import Path
    
    # Validate file type
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Get intro
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    # Create upload directory
    upload_dir = Path("static/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = upload_dir / unique_filename
    
    # Save file
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Create session image record with URL
    image_url = f"/static/uploads/{unique_filename}"
    image_data = SessionImageCreateRequest(url=image_url)
    image = await SessionImageService.create_image(db, intro.id, image_data)
    
    return SessionImageResponse.model_validate(image)


@router.post("/images", response_model=SessionImageResponse, status_code=status.HTTP_201_CREATED)
async def create_session_image_url(
    data: SessionImageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a session image with external URL (no file upload)."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    image = await SessionImageService.create_image(db, intro.id, data)
    return SessionImageResponse.model_validate(image)


@router.get("/images", response_model=list[SessionImageResponse])
async def get_session_images(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all session images."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    images = await SessionImageService.get_images_by_intro(db, intro.id)
    return [SessionImageResponse.model_validate(img) for img in images]


@router.delete("/images/{image_id}", response_model=GenericResponse)
async def delete_session_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a session image."""
    success = await SessionImageService.delete_image(db, image_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return GenericResponse(message="Image deleted successfully")


# ==================== Sections ====================

@router.get("/header", response_model=HeaderSectionResponse)
async def get_my_header(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's header section."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    response_dict = await HeaderSectionService.get_header_response_dict(db, intro.id)
    if not response_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Header section not found")
    
    return HeaderSectionResponse(**response_dict)


@router.post("/header", response_model=HeaderSectionResponse)
async def create_or_update_header(
    data: HeaderSectionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create or update header section."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    await HeaderSectionService.create_or_update(db, intro.id, data)
    response_dict = await HeaderSectionService.get_header_response_dict(db, intro.id)
    
    if not response_dict:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create header")
    
    return HeaderSectionResponse(**response_dict)


@router.delete("/header", response_model=GenericResponse)
async def delete_header(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete header section."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    success = await HeaderSectionService.delete_by_intro(db, intro.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Header section not found")
    return GenericResponse(message="Header section deleted successfully")


@router.get("/family", response_model=FamilySectionResponse)
async def get_my_family(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's family section."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    response_dict = await FamilySectionService.get_family_response_dict(db, intro.id)
    if not response_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family section not found")
    
    return FamilySectionResponse(**response_dict)


@router.post("/family", response_model=FamilySectionResponse)
async def create_or_update_family(
    data: FamilySectionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create or update family section."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    await FamilySectionService.create_or_update(db, intro.id, data)
    response_dict = await FamilySectionService.get_family_response_dict(db, intro.id)
    
    if not response_dict:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create family section")
    
    return FamilySectionResponse(**response_dict)


@router.delete("/family", response_model=GenericResponse)
async def delete_family(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete family section."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    success = await FamilySectionService.delete_by_intro(db, intro.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family section not found")
    return GenericResponse(message="Family section deleted successfully")


@router.get("/invite-section", response_model=InviteSectionResponse)
async def get_my_invite_section(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's invite section."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    response_dict = await InviteSectionService.get_invite_response_dict(db, intro.id)
    if not response_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite section not found")
    
    return InviteSectionResponse(**response_dict)


@router.post("/invite-section", response_model=InviteSectionResponse)
async def create_or_update_invite_section(
    data: InviteSectionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create or update invite section with three images."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    await InviteSectionService.create_or_update(db, intro.id, data)
    response_dict = await InviteSectionService.get_invite_response_dict(db, intro.id)
    
    if not response_dict:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create invite section")
    
    return InviteSectionResponse(**response_dict)


@router.delete("/invite-section", response_model=GenericResponse)
async def delete_invite_section(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete invite section."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    success = await InviteSectionService.delete_by_intro(db, intro.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite section not found")
    return GenericResponse(message="Invite section deleted successfully")


@router.get("/footer", response_model=FooterSectionResponse)
async def get_my_footer(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's footer section."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    response_dict = await FooterSectionService.get_footer_response_dict(db, intro.id)
    if not response_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Footer section not found")
    
    return FooterSectionResponse(**response_dict)


@router.post("/footer", response_model=FooterSectionResponse)
async def create_or_update_footer(
    data: FooterSectionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create or update footer section."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    await FooterSectionService.create_or_update(db, intro.id, data)
    response_dict = await FooterSectionService.get_footer_response_dict(db, intro.id)
    
    if not response_dict:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create footer")
    
    return FooterSectionResponse(**response_dict)


@router.delete("/footer", response_model=GenericResponse)
async def delete_footer(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete footer section."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    success = await FooterSectionService.delete_by_intro(db, intro.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Footer section not found")
    return GenericResponse(message="Footer section deleted successfully")


# ==================== Album Sessions ====================

@router.post("/album-sessions", response_model=AlbumSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_album_session(
    data: AlbumSessionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new album session."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    session = await AlbumSessionService.create_album_session(db, intro.id, data)
    return AlbumSessionResponse.model_validate(session)


@router.get("/album-sessions", response_model=list[AlbumSessionResponse])
async def get_album_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all album sessions."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    sessions = await AlbumSessionService.get_album_sessions_by_intro(db, intro.id)
    
    # Build response with images
    result = []
    for session in sessions:
        session_dict = {
            "id": session.id,
            "intro_id": session.intro_id,
            "title": session.title,
            "order": session.order,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "images": [
                {
                    "id": img.id,
                    "image_url": img.session_image.url if img.session_image else None,
                    "order": img.order
                }
                for img in session.album_images
                if img.session_image
            ]
        }
        result.append(AlbumSessionResponse(**session_dict))
    
    return result


@router.put("/album-sessions/{session_id}", response_model=AlbumSessionResponse)
async def update_album_session(
    session_id: str,
    data: AlbumSessionUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an album session."""
    session = await AlbumSessionService.update_album_session(db, session_id, data)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album session not found")
    
    # Build response with images
    session_dict = {
        "id": session.id,
        "intro_id": session.intro_id,
        "title": session.title,
        "order": session.order,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "images": [
            {
                "id": img.id,
                "image_url": img.session_image.url if img.session_image else None,
                "order": img.order
            }
            for img in session.album_images
            if img.session_image
        ]
    }
    return AlbumSessionResponse(**session_dict)


@router.delete("/album-sessions/{session_id}", response_model=GenericResponse)
async def delete_album_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an album session."""
    success = await AlbumSessionService.delete_album_session(db, session_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album session not found")
    return GenericResponse(message="Album session deleted successfully")


# ==================== Album Images ====================

@router.post("/album-sessions/{session_id}/images", response_model=AlbumImageWithUrlResponse, status_code=status.HTTP_201_CREATED)
async def add_album_image(
    session_id: str,
    data: AlbumImageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add an image to an album session."""
    image = await AlbumImageService.create_album_image(db, session_id, data)
    
    # Build response with image_url
    return AlbumImageWithUrlResponse(
        id=image.id,
        image_url=image.session_image.url if image.session_image else None,
        order=image.order
    )


@router.delete("/album-images/{image_id}", response_model=GenericResponse)
async def delete_album_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an album image."""
    success = await AlbumImageService.delete_album_image(db, image_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album image not found")
    return GenericResponse(message="Album image deleted successfully")


@router.put("/album-sessions/{session_id}/reorder", response_model=GenericResponse)
async def reorder_album_images(
    session_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reorder images in an album session."""
    image_orders = data.get("image_orders", [])
    
    for item in image_orders:
        image = await AlbumImageService.get_album_image_by_id(db, item["id"])
        if image and image.album_session_id == session_id:
            image.order = item["order"]
    
    await db.commit()
    return GenericResponse(message="Images reordered successfully")


# ==================== Guests ====================

@router.post("/guests", response_model=GuestResponse, status_code=status.HTTP_201_CREATED)
async def create_guest(
    guest_data: GuestCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new guest."""
    from config.settings import settings
    
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    stats = await GuestService.get_guest_stats(db, intro.id)
    if stats["total_guests"] >= current_user.max_invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Đã đạt giới hạn tối đa {current_user.max_invite} khách mời"
        )
    
    guest = await GuestService.create_guest(db, intro.id, guest_data)
    
    guest_dict = GuestResponse.model_validate(guest).model_dump()
    subdomain = current_user.subdomain or 'wedding'
    guest_dict['guest_url'] = f"https://{subdomain}.{settings.FRONTEND_BASE_DOMAIN}/{guest.id}"
    
    return GuestResponse(**guest_dict)


@router.get("/guests", response_model=PaginatedResponse[GuestResponse])
async def get_guests(
    page: int = 1,
    size: int = 50,
    confirm: bool = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get list of guests."""
    from config.settings import settings
    
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    skip = (page - 1) * size
    guests, total = await GuestService.get_guests_by_intro(db, intro.id, skip, size, confirm)
    pages = (total + size - 1) // size
    
    subdomain = current_user.subdomain or 'wedding'
    guest_responses = []
    for guest in guests:
        guest_dict = GuestResponse.model_validate(guest).model_dump()
        guest_dict['guest_url'] = f"https://{subdomain}.{settings.FRONTEND_BASE_DOMAIN}/{guest.id}"
        guest_responses.append(GuestResponse(**guest_dict))
    
    return PaginatedResponse(
        items=guest_responses,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.put("/guests/{guest_id}", response_model=GuestResponse)
async def update_guest(
    guest_id: str,
    guest_data: GuestUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a guest."""
    guest = await GuestService.update_guest(db, guest_id, guest_data)
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    return GuestResponse.model_validate(guest)


@router.delete("/guests/{guest_id}", response_model=GenericResponse)
async def delete_guest(
    guest_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a guest (cannot delete demo guest)."""
    success, message = await GuestService.delete_guest(db, guest_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return GenericResponse(message=message)


@router.get("/guests/first", response_model=GuestResponse)
async def get_first_guest(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the first (demo) guest for preview."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    guest = await GuestService.get_first_guest(db, intro.id)
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No guest found")
    
    return GuestResponse.model_validate(guest)


@router.get("/guests/stats", response_model=dict)
async def get_guest_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get guest statistics."""
    intro = await IntroService.get_intro_by_user_id(db, current_user.id)
    if not intro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intro not found")
    
    stats = await GuestService.get_guest_stats(db, intro.id)
    stats["max_guests"] = current_user.max_invite
    return stats
