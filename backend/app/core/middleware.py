from urllib.parse import urlparse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from config.settings import settings


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    """
    Custom CORS middleware that allows:
    - FRONTEND_BASE_DOMAIN and all its subdomains (*.d-wedding.love)
    - localhost for development
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Get frontend base domain (e.g., "d-wedding.love")
        self.frontend_domain = settings.FRONTEND_BASE_DOMAIN.lower().strip()
    
    def is_origin_allowed(self, origin: str) -> bool:
        """
        Check if origin is allowed.
        Allows:
        - Exact match: d-wedding.love
        - Wildcard subdomains: *.d-wedding.love
        - localhost for development
        """
        if not origin:
            return False
        
        origin = origin.rstrip('/')
        
        try:
            parsed = urlparse(origin)
            hostname = parsed.netloc.lower()
            
            if hostname.startswith('localhost') or hostname.startswith('127.0.0.1'):
                return True
            
            host = hostname.split(':')[0]
            
            if host == self.frontend_domain:
                return True
            
            if host.endswith('.' + self.frontend_domain):
                return True
            
            return False
            
        except Exception:
            return False
    
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        
        if request.method == "OPTIONS":
            if self.is_origin_allowed(origin):
                return Response(
                    status_code=200,
                    headers={
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                        "Access-Control-Allow-Headers": "*",
                        "Access-Control-Allow-Credentials": "true",
                        "Access-Control-Max-Age": "3600",
                    }
                )
            else:
                return Response(status_code=403)
        
        response = await call_next(request)
        
        if self.is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Expose-Headers"] = "*"
        
        return response
