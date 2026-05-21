from fastapi import Depends, HTTPException, status, Cookie
from sqlalchemy.orm import Session
from typing import Optional
from app.models.database import get_db
from app.models.admin_user import AdminUser
from app.core.security import decode_token


def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
) -> AdminUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated"
    )
    if not access_token:
        raise credentials_exception
    try:
        payload = decode_token(access_token)
        email: str = payload.get("sub")
        if not email:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = db.query(AdminUser).filter(
        AdminUser.email == email,
        AdminUser.is_active == True
    ).first()

    if not user:
        raise credentials_exception
    return user


def require_role(allowed_roles: list):
    def checker(
        user: AdminUser = Depends(get_current_user)
    ) -> AdminUser:
        if user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user
    return checker
