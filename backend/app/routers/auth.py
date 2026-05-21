from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime
from app.models.database import get_db
from app.models.admin_user import AdminUser
from app.core.security import (
    verify_password, create_access_token,
    create_refresh_token, hash_password
)
from app.core.dependencies import get_current_user
from pydantic import BaseModel
import re

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


class LoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


def validate_password_strength(password: str) -> bool:
    """
    Password must have:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one number
    - At least one special character
    """
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True


@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    user = db.query(AdminUser).filter(
        AdminUser.email == payload.email
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    user.last_login = datetime.utcnow()
    db.commit()

    token_data = {
        "sub": user.email,
        "role": user.role.value,
        "id": user.id,
        "employee_id": user.employee_id
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,   # Change to True in production
        samesite="lax",
        max_age=3600
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,   # Change to True in production
        samesite="lax",
        max_age=604800
    )

    return {
        "employee_id": user.employee_id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role.value,
        "branch": user.branch,
        "force_password_reset": user.force_password_reset
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.get("/me")
def get_me(current_user: AdminUser = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "employee_id": current_user.employee_id,
        "bank_id": current_user.bank_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value,
        "branch": current_user.branch,
        "force_password_reset": current_user.force_password_reset,
        "last_login": current_user.last_login
    }


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    if not validate_password_strength(payload.new_password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters with one uppercase letter, one number and one special character"
        )

    current_user.hashed_password = hash_password(payload.new_password)
    current_user.force_password_reset = False
    db.commit()
    return {"message": "Password changed successfully"}
