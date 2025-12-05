from contextlib import asynccontextmanager
from pathlib import Path
import logging
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.types import ASGIApp, Receive, Scope, Send

from config.settings import settings
from app.core.database import db_manager
from app.core.middleware import DynamicCORSMiddleware
from app.api.router import api_router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create static directory if not exists
STATIC_DIR = Path(__file__).parent / "static" / "uploads"
STATIC_DIR.mkdir(parents=True, exist_ok=True)


class CORSStaticFiles(StaticFiles):
    """StaticFiles with CORS headers for cross-origin image access."""
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            # Get origin from headers
            headers = dict(scope.get("headers", []))
            origin = headers.get(b"origin", b"").decode("utf-8")
            
            # Create wrapper to add CORS headers to response
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    # Add CORS headers
                    headers = list(message.get("headers", []))
                    
                    if origin:
                        headers.append((b"access-control-allow-origin", origin.encode()))
                    else:
                        headers.append((b"access-control-allow-origin", b"*"))
                    headers.append((b"access-control-allow-methods", b"GET, OPTIONS"))
                    headers.append((b"access-control-allow-headers", b"*"))
                    
                    message = {**message, "headers": headers}
                
                await send(message)
            
            await super().__call__(scope, receive, send_wrapper)
        else:
            await super().__call__(scope, receive, send)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""

    await db_manager.connect()
    yield
    # Shutdown
    await db_manager.disconnect()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# Custom CORS middleware - supports wildcard subdomains
app.add_middleware(DynamicCORSMiddleware)

# Include API router
app.include_router(api_router, prefix="/api")

# Mount static files with CORS support
app.mount("/static", CORSStaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return {
        "message": "Wedding Innovation API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

