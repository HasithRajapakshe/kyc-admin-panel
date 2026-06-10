"""
Bank of Ceylon — KYC Admin Panel
Super Admin Bootstrap Script

Run this ONCE to create the first Super Admin.
Usage: python scripts/create_superadmin.py
"""

from app.core.security import hash_password
from app.models.admin_user import AdminUser, AdminRoleEnum, generate_employee_id
from app.models.database import SessionLocal
import getpass
import re
import os
import sys
sys.path.insert(0, '.')


def validate_password(password: str) -> bool:
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True


def main():
    print("\n" + "="*50)
    print("  Bank of Ceylon — KYC Admin Panel")
    print("  Super Admin Bootstrap Script")
    print("="*50 + "\n")

    db = SessionLocal()

    try:
        # Check if Super Admin already exists
        existing = db.query(AdminUser).filter(
            AdminUser.role == AdminRoleEnum.super_admin
        ).first()

        if existing:
            print(f"  Super Admin already exists:")
            print(f"   Name      : {existing.full_name}")
            print(f"   Short ID  : {existing.short_id}")
            print(f"   Email     : {existing.email}")
            print(f"\n   To add another Super Admin,")
            print(f"   log in and use User Management.\n")

            confirm = input("Create another Super Admin anyway? (yes/no): ")
            if confirm.lower() != "yes":
                print("\nAborted.\n")
                return

        print("Enter details for the new Super Admin:\n")

        # Short ID
        while True:
            short_id = input("Short ID (e.g. sad001): ").strip()
            if not short_id:
                print("   Short ID cannot be empty")
                continue
            if len(short_id) < 3:
                print("   Short ID must be at least 3 characters")
                continue
            exists = db.query(AdminUser).filter(
                AdminUser.short_id == short_id
            ).first()
            if exists:
                print(f"   Short ID '{short_id}' already taken")
                continue
            break

        # Full name
        while True:
            full_name = input("Full name: ").strip()
            if not full_name:
                print("   Full name cannot be empty")
                continue
            break

        # Email
        while True:
            email = input("Email: ").strip()
            if not email or "@" not in email:
                print("   Invalid email")
                continue
            exists = db.query(AdminUser).filter(
                AdminUser.email == email
            ).first()
            if exists:
                print(f"   Email already exists")
                continue
            break

        # Bank ID
        while True:
            bank_id = input("Bank ID (e.g. 0001): ").strip()
            if not bank_id:
                print("   Bank ID cannot be empty")
                continue
            break

        # Branch
        while True:
            branch = input("Branch (e.g. Head Office): ").strip()
            if not branch:
                print("   Branch cannot be empty")
                continue
            break

        # Password
        print("\nPassword rules:")
        print("  → Minimum 8 characters")
        print("  → At least one uppercase letter")
        print("  → At least one number")
        print("  → At least one special character (!@#$%^&*)\n")

        while True:
            password = getpass.getpass("Password: ")
            if not validate_password(password):
                print("   Password does not meet requirements")
                continue
            confirm_pw = getpass.getpass("Confirm password: ")
            if password != confirm_pw:
                print("   Passwords do not match")
                continue
            break

        # Generate employee ID
        employee_id = generate_employee_id(
            AdminRoleEnum.super_admin, bank_id
        )

        # Create the Super Admin
        super_admin = AdminUser(
            short_id=short_id,
            employee_id=employee_id,
            bank_id=bank_id,
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            role=AdminRoleEnum.super_admin,
            branch=branch,
            is_active=True,
            force_password_reset=False,
            created_by="bootstrap_script",
        )

        db.add(super_admin)
        db.commit()

        print("\n" + "="*50)
        print("   Super Admin created successfully!")
        print("="*50)
        print(f"\n  Short ID     : {short_id}")
        print(f"  Employee ID  : {employee_id}")
        print(f"  Full name    : {full_name}")
        print(f"  Email        : {email}")
        print(f"  Branch       : {branch}")
        print(f"\n  Login at: http://localhost:3000/login")
        print(f"  Use short ID + password to sign in\n")

    except Exception as e:
        print(f"\n Error: {e}\n")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
