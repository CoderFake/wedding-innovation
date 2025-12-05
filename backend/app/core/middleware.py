from urllib.parse import urlparse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from config.settings import settings


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    """
    Custom CORS middleware that validates origin by comparing base domain.
    If origin's base domain matches BACKEND_URL's base domain, allow it.
    Also allows localhost for development.
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Extract base domain from BACKEND_URL (remove trailing slash if any)
        backend_url = settings.BACKEND_URL.rstrip('/')
        parsed = urlparse(backend_url)
        self.backend_domain = self._get_base_domain(parsed.netloc)
    
    def _get_base_domain(self, hostname: str) -> str:
        """
        Get base domain by removing subdomain.
        Examples:
        - demo-wedding.hoangdieuit.io.vn -> hoangdieuit.io.vn
        - hoangdieuit.io.vn -> hoangdieuit.io.vn
        - localhost:3000 -> localhost
        """
        # Remove port if present
        host = hostname.split(':')[0]
        parts = host.split('.')
        
        # For domains like hoangdieuit.io.vn (3+ parts), take last 3
        # For domains like example.com (2 parts), take all
        if len(parts) >= 3:
            return '.'.join(parts[-3:])
        return host
    
    def is_origin_allowed(self, origin: str) -> bool:
        """
        Check if origin is allowed by comparing base domain.
        """
        if not origin:
            return False
        
        # Remove trailing slash
        origin = origin.rstrip('/')
        
        try:
            parsed = urlparse(origin)
            hostname = parsed.netloc
            
            # Allow localhost and 127.0.0.1 for development
            if hostname.startswith('localhost') or hostname.startswith('127.0.0.1'):
                return True
            
            # Get base domain of origin and compare with backend domain
            origin_base_domain = self._get_base_domain(hostname)
            return origin_base_domain == self.backend_domain
            
        except Exception:
            return False
    
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        
        # Handle preflight OPTIONS request
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
        
        # Process normal request
        response = await call_next(request)
        
        # Add CORS headers if origin is allowed
        if self.is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Expose-Headers"] = "*"
        
        return response
