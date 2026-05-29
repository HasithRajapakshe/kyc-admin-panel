import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from app.models.database import Base


class AdminRoleEnum(enum.Enum):
    user = "user"
    admin = "admin"
    super_admin = "super_admin"


def generate_employee_id(role: AdminRoleEnum, bank_id: str) -> str:
    """
    Generate employee ID based on role and bank ID.
    Format:
        USR-{bank_id}-{uuid_segment}   for user
        ADM-{bank_id}-{uuid_segment}   for admin
        SAD-{bank_id}-{uuid_segment}   for super_admin
    Example:
        USR-1234-a3f9-12bc-4d77
        ADM-5678-b7c1-99ef-3a12
        SAD-0001-f02d-44ab-8c90
    """
    prefix_map = {
        AdminRoleEnum.user: "USR",
        AdminRoleEnum.admin: "ADM",
        AdminRoleEnum.super_admin: "SAD",
    }
    prefix = prefix_map[role]
    uid = str(uuid.uuid4()).replace("-", "")
    uid_segment = f"{uid[0:4]}-{uid[4:8]}-{uid[8:12]}"
    return f"{prefix}-{bank_id}-{uid_segment}"


class AdminUser(Base):
    """
    Admin panel user model.
    Stores bank officers and administrators who log into the admin panel.
    Separate from the Customer model.
    """
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    short_id = Column(String(50), unique=True, nullable=True, index=True)
    bank_id = Column(String(50), nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(AdminRoleEnum), nullable=False)
    branch = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    force_password_reset = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(String(50), nullable=True)

    def __repr__(self) -> str:
        return f"<AdminUser(employee_id={self.employee_id}, role={self.role})>"
