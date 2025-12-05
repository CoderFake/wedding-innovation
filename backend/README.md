# Wedding Innovation Backend

A FastAPI-based backend for managing wedding invitation websites with user authentication, landing page customization, guest management, and photo albums.

## Features

- **User Authentication**: JWT-based authentication with role-based access (root/user)
- **Landing Page Management**: Users can create and customize their wedding website with:
  - Wedding intro (groom & bride names)
  - Date and time of organization
  - Header section with image
  - Family section (parents' information)
  - Invite section with three images
  - Photo album sessions with multiple images
  - Footer section with thank you message
- **Guest Management**: Track guests with confirmation status and relationships
- **Image Management**: Upload and manage session images for various sections

## Architecture

- **FastAPI** for async API framework
- **SQLAlchemy 2.0** with async support for ORM
- **MySQL** for database (with aiomysql driver)
- **Alembic** for database migrations
- **JWT** for authentication
- **Bcrypt** for password hashing

## Project Structure

```
backend/
├── alembic/              # Database migrations
├── app/
│   ├── api/
│   │   ├── v1/          # API v1 endpoints
│   │   │   ├── auth.py           # Authentication endpoints
│   │   │   └── landing_page.py   # Landing page CRUD endpoints
│   │   └── router.py    # Main API router
│   ├── common/          # Enums and constants
│   ├── core/            # Core functionality
│   │   ├── database.py       # Database connection
│   │   ├── dependencies.py   # FastAPI dependencies
│   │   └── middleware.py     # Middlewares
│   ├── models/          # SQLAlchemy models
│   │   ├── user.py
│   │   ├── intro.py
│   │   ├── date_of_organization.py
│   │   ├── invite.py (Guest model)
│   │   ├── session_image.py
│   │   ├── section.py (Header, Family, Invite, Footer sections)
│   │   └── album.py (Album sessions and images)
│   ├── schemas/         # Pydantic schemas
│   │   ├── requests.py
│   │   └── responses.py
│   ├── services/        # Business logic layer
│   │   ├── user.py
│   │   ├── intro.py
│   │   ├── invite.py (Guest service)
│   │   ├── section.py
│   │   └── album.py
│   └── utils.py/        # Utility functions
│       ├── auth.py      # JWT and password utilities
│       ├── date.py
│       └── logging.py
├── config/
│   └── settings.py      # Application settings
├── static/              # Static files
├── main.py              # Application entry point
└── requirements.txt     # Python dependencies
```

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create a `.env` file in the backend directory (use `.env.example` as template):

```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database URL
- JWT secret keys
- Other settings as needed

### 4. Setup Database

Create a PostgreSQL database:

```bash
createdb wedding_db
```

Run migrations:

```bash
alembic upgrade head
```

### 5. Create Root User

After starting the server, you'll need to manually create the first root user in the database, or use a migration script.

Example SQL to create root user:

```sql
INSERT INTO users (username, password_hash, role, is_active, created_at, updated_at)
VALUES (
    'admin',
    '$2b$12$...',  -- Use bcrypt to hash your password
    'root',
    true,
    NOW(),
    NOW()
);
```

Or use Python to generate password hash:

```python
import bcrypt
password = "your_password"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(hashed.decode('utf-8'))
```

### 6. Run the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

## API Endpoints

### Authentication (`/api/v1/auth`)

- `POST /login` - User login
- `GET /me` - Get current user info
- `PUT /me` - Update current user
- `POST /users` - Create user (root only)
- `GET /users` - List all users (root only)
- `DELETE /users/{user_id}` - Delete user (root only)

### Landing Page (`/api/v1/landing-page`)

**Intro**
- `POST /intro` - Create intro
- `GET /intro` - Get user's intro
- `PUT /intro` - Update intro
- `GET /complete` - Get complete landing page

**Date & Time**
- `POST /date-organization` - Create/update wedding date

**Images**
- `POST /images` - Upload session image
- `GET /images` - Get all session images
- `DELETE /images/{image_id}` - Delete image

**Sections**
- `POST /header` - Create/update header section
- `POST /family` - Create/update family section
- `POST /invite-section` - Create/update invite section
- `POST /footer` - Create/update footer section

**Album**
- `POST /album-sessions` - Create album session
- `GET /album-sessions` - Get all album sessions
- `PUT /album-sessions/{session_id}` - Update album session
- `DELETE /album-sessions/{session_id}` - Delete album session
- `POST /album-sessions/{session_id}/images` - Add image to album
- `DELETE /album-images/{image_id}` - Delete album image

**Guests**
- `POST /guests` - Create guest
- `GET /guests` - Get guests (paginated, filterable)
- `PUT /guests/{guest_id}` - Update guest
- `DELETE /guests/{guest_id}` - Delete guest
- `GET /guests/stats` - Get guest statistics

## Workflow

### Root User Workflow

1. Root user logs in via `POST /api/v1/auth/login`
2. Root user creates a new user account via `POST /api/v1/auth/users`
3. Root user can manage all users via `/api/v1/auth/users`

### Regular User Workflow

1. User logs in with credentials provided by root
2. User creates their intro (wedding info) via `POST /api/v1/landing-page/intro`
3. User uploads images via `POST /api/v1/landing-page/images`
4. User creates/updates sections:
   - Date of organization
   - Header section
   - Family section  
   - Invite section
   - Footer section
5. User creates album sessions and adds images
6. User manages guest list
7. User retrieves complete landing page via `GET /api/v1/landing-page/complete`

## Database Models

- **User**: Authentication and authorization
- **Intro**: Groom and bride names
- **DateOfOrganization**: Wedding date and time (lunar + calendar)
- **Guest**: Guest list with confirmation status
- **SessionImage**: Reusable images across sections
- **HeaderSection**: Header with image
- **FamilySection**: Family information for both sides
- **InviteSection**: Invitation with 3 images (left, center, right)
- **FooterSection**: Footer with thank you text and image
- **AlbumSession**: Album grouping
- **AlbumImage**: Images within album sessions

## Security

- JWT tokens for authentication
- Bcrypt for password hashing
- Role-based access control (root/user)
- CORS configuration
- Each user can only edit their own landing page

## Development

Run in development mode with auto-reload:

```bash
uvicorn main:app --reload
```

Create new migration:

```bash
alembic revision --autogenerate -m "description"
```

Apply migrations:

```bash
alembic upgrade head
```

## License

Private project
