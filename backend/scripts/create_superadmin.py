from app.core.security import hash_password
from app.models.admin_user import AdminUser, AdminRoleEnum, generate_employee_id
from app.models.database import SessionLocal
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def create_superadmin():
    db = SessionLocal()
    try:
        existing = db.query(AdminUser).filter(
            AdminUser.email == "superadmin@kyc.lk"
        ).first()

        if existing:
            print(f"Super admin already exists: {existing.employee_id}")
            return

        bank_id = "0001"
        role = AdminRoleEnum.super_admin
        employee_id = generate_employee_id(role, bank_id)

        admin = AdminUser(
            employee_id=employee_id,
            bank_id=bank_id,
            full_name="Super Admin",
            email="superadmin@kyc.lk",
            hashed_password=hash_password("Admin@1234"),
            role=role,
            branch="Head Office",
            force_password_reset=True,
            created_by="SYSTEM"
        )
        db.add(admin)
        db.commit()

        print("Super admin created successfully")
        print(f"Employee ID : {employee_id}")
        print(f"Email       : superadmin@kyc.lk")
        print(f"Password    : Admin@1234")
        print(f"NOTE        : Change password on first login")

    finally:
        db.close()


if __name__ == "__main__":
    create_superadmin()
