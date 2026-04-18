from typing import Optional
from datetime import datetime
import time
from collections import defaultdict
from fastapi import Request, HTTPException, status

from app.config import settings


class RateLimiter:
    def __init__(self, requests_per_minute: int = None):
        self.requests_per_minute = requests_per_minute or settings.RATE_LIMIT_PER_MINUTE
        self.requests: dict[str, list[float]] = defaultdict(list)

    def _get_client_id(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _clean_old_requests(self, client_id: str) -> None:
        current_time = time.time()
        cutoff = current_time - 60
        self.requests[client_id] = [
            t for t in self.requests[client_id] if t > cutoff
        ]

    def is_allowed(self, request: Request) -> bool:
        client_id = self._get_client_id(request)
        self._clean_old_requests(client_id)

        if len(self.requests[client_id]) >= self.requests_per_minute:
            return False

        self.requests[client_id].append(time.time())
        return True

    def check(self, request: Request) -> None:
        if not self.is_allowed(request):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={"Retry-After": "60"}
            )

    def remaining_requests(self, request: Request) -> int:
        client_id = self._get_client_id(request)
        self._clean_old_requests(client_id)
        return max(0, self.requests_per_minute - len(self.requests[client_id]))


rate_limiter = RateLimiter()


class EndpointRateLimiter:
    def __init__(self):
        self.limiters: dict[str, RateLimiter] = {}
        self.default_limits = {
            "/api/v1/auth/login": 10,
            "/api/v1/auth/register": 5,
            "/api/v1/auth/otp/request": 5,
            "/api/v1/matching/organ": 20,
            "/api/v1/matching/blood": 30,
            "/api/v1/emergency/broadcast": 10,
        }

    def get_limiter(self, path: str) -> RateLimiter:
        if path not in self.limiters:
            limit = self.default_limits.get(
                path, settings.RATE_LIMIT_PER_MINUTE)
            self.limiters[path] = RateLimiter(limit)
        return self.limiters[path]

    def check(self, request: Request) -> None:
        limiter = self.get_limiter(request.url.path)
        limiter.check(request)


endpoint_rate_limiter = EndpointRateLimiter()
