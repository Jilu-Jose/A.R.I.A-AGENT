import time
import asyncio
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Maps IP address to a list of request timestamps
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        # Exclude static files and frontend routes from strict rate limiting if necessary,
        # but since this is primarily an API backend, we'll apply it globally for safety.
        if request.url.path.startswith("/api"):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            
            async with self.lock:
                # Remove timestamps older than the window
                timestamps = [t for t in self.requests.get(client_ip, []) if now - t < self.window_seconds]
                
                if len(timestamps) >= self.max_requests:
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Too Many Requests. Please try again later."}
                    )
                
                # Add current request timestamp
                timestamps.append(now)
                self.requests[client_ip] = timestamps
            
        response = await call_next(request)
        return response
