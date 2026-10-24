"""Admin authentication dependency for document management endpoints."""

from fastapi import Depends, HTTPException, Header
from app.config import settings


def require_admin(x_admin_key: str | None = Header(default=None)):
    """Validate the admin API key for protected endpoints."""
    if not x_admin_key or x_admin_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Admin access required. Provide a valid X-Admin-Key header.",
        )
    return True
