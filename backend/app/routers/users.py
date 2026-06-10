from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.database import get_db
from app.models.admin_user import AdminUser, AdminRoleEnum, generate_employee_id
from app.core.security import hash_password
from app.core.dependencies import require_role, get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


class CreateUserRequest(BaseModel):
    full_name: str
    email: EmailStr
    short_id: str
    bank_id: str
    branch: str
    role: str
    password: str       # Initial password set by super admin


class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    branch: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("")
def list_users(
    db: Session = Depends(get_db),
    _=Depends(require_role(["super_admin"]))
):
    users = db.query(AdminUser).order_by(
        AdminUser.created_at.desc()
    ).all()
    return [
        {
            "id": u.id,
            "employee_id": u.employee_id,
            "bank_id": u.bank_id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role.value,
            "branch": u.branch,
            "is_active": u.is_active,
            "force_password_reset": u.force_password_reset,
            "last_login": u.last_login,
            "created_at": u.created_at,
            "created_by": u.created_by,
        }
        for u in users
    ]


@router.post("")
def create_user(
    req: CreateUserRequest,
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(require_role(["super_admin"]))
):
    # Check email not already used
    if db.query(AdminUser).filter(AdminUser.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    # Check bank_id not already used
    if db.query(AdminUser).filter(AdminUser.bank_id == req.bank_id).first():
        raise HTTPException(status_code=400, detail="Bank ID already exists")

    # Validate role — super admin cannot be created via this endpoint
    if req.role not in ["user", "admin"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be 'user' or 'admin'. Super admin cannot be created here."
        )

    role_enum = AdminRoleEnum(req.role)

    # Auto-generate employee_id from role + bank_id
    employee_id = generate_employee_id(role_enum, req.bank_id)

    user = AdminUser(
        employee_id=employee_id,
        short_id=req.short_id,
        bank_id=req.bank_id,
        full_name=req.full_name,
        email=req.email,
        hashed_password=hash_password(req.password),
        role=role_enum,
        branch=req.branch,
        force_password_reset=True,
        created_by=actor.employee_id
    )
    db.add(user)
    db.commit()

    return {
        "message": "User created successfully",
        "employee_id": employee_id,
        "email": req.email,
        "role": req.role,
        "force_password_reset": True
    }


@router.patch("/{employee_id}")
def update_user(
    employee_id: str,
    req: UpdateUserRequest,
    db: Session = Depends(get_db),
    _=Depends(require_role(["super_admin"]))
):
    user = db.query(AdminUser).filter(
        AdminUser.employee_id == employee_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.full_name:
        user.full_name = req.full_name
    if req.branch:
        user.branch = req.branch
    if req.role:
        try:
            user.role = AdminRoleEnum(req.role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
    if req.is_active is not None:
        user.is_active = req.is_active

    db.commit()
    return {"message": "User updated successfully", "employee_id": employee_id}


@router.delete("/{employee_id}")
def deactivate_user(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_role(["super_admin"]))
):
    user = db.query(AdminUser).filter(
        AdminUser.employee_id == employee_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.employee_id == current_user.employee_id:
        raise HTTPException(
            status_code=400, detail="Cannot deactivate yourself")

    # Soft delete — deactivate instead of deleting
    # This preserves audit trail history
    user.is_active = False
    db.commit()
    return {"message": "User deactivated", "employee_id": employee_id}
