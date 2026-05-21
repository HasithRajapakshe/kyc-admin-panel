import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from app.models.database import Base


class AdminRoleEnum(enum.Enum):
    user = "user"
    admin = "admin"
    super_admin = "super_admin"


class AdminUser(Base):
    """
    Admin panel user model.
    Stores bank officers and administrators who log into the admin panel.
    This is separate from the Customer model.
    """
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(AdminRoleEnum), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    force_password_reset = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<AdminUser(id={self.id}, email={self.email}, role={self.role})>"
