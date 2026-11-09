import time
import re
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "microphone=(self), camera=(), geolocation=()"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class RateLimiter:
    def __init__(self, max_requests: int = 60, window_sec: int = 60):
        self.max_requests = max_requests
        self.window_sec = window_sec
        self._clients: dict[str, list[float]] = defaultdict(list)

    async def __call__(self, request: Request):
        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        cutoff = now - self.window_sec
        self._clients[client_ip] = [t for t in self._clients[client_ip] if t > cutoff]

        if len(self._clients[client_ip]) >= self.max_requests:
            raise HTTPException(429, "Too many requests")

        self._clients[client_ip].append(now)


rate_limiter = RateLimiter()


STREAM_URL_REGEX = re.compile(
    r"^https?://"  
    r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"  
    r"localhost|"  
    r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  
    r"(?::\d+)?"  
    r"(?:/?|[/?]\S+)$",
    re.IGNORECASE,
)


def validate_stream_url(url: str) -> bool:
    if not url or len(url) > 2048:
        return False
    return bool(STREAM_URL_REGEX.match(url))


PATH_TRAVERSAL_PATTERN = re.compile(r"(\.\./|\.\.\\|~|%2e%2e)", re.IGNORECASE)


def sanitize_path(path: str) -> str:
    if PATH_TRAVERSAL_PATTERN.search(path):
        raise ValueError("Path traversal detected")
    cleaned = path.replace("\\", "/")
    cleaned = cleaned.lstrip("/")
    return cleaned
