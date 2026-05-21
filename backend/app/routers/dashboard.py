from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import date
from app.models.database import (
    get_db, Customer, VerificationStatusEnum
)
from app.models.admin_user import AdminUser
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_user)
):
    today = date.today()

    total_today = db.query(Customer).filter(
        func.date(Customer.created_at) == today
    ).count()

    pending = db.query(Customer).filter(
        Customer.verification_status == VerificationStatusEnum.pending
    ).count()

    approved_today = db.query(Customer).filter(
        func.date(Customer.created_at) == today,
        Customer.verification_status == VerificationStatusEnum.approved
    ).count()

    rejected_today = db.query(Customer).filter(
        func.date(Customer.created_at) == today,
        Customer.verification_status == VerificationStatusEnum.rejected
    ).count()

    total_all = db.query(Customer).count()

    approved_all = db.query(Customer).filter(
        Customer.verification_status == VerificationStatusEnum.approved
    ).count()

    rejected_all = db.query(Customer).filter(
        Customer.verification_status == VerificationStatusEnum.rejected
    ).count()

    return {
        "today": {
            "total": total_today,
            "approved": approved_today,
            "rejected": rejected_today,
        },
        "overall": {
            "total": total_all,
            "pending": pending,
            "approved": approved_all,
            "rejected": rejected_all,
        }
    }
