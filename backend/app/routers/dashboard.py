from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.models.database import (
    get_db, Customer, VerificationSession,
    VerificationStatusEnum, SessionStatusEnum
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

    # Total all time
    total = db.query(Customer).count()

    # Pending
    pending = db.query(Customer).filter(
        Customer.verification_status == VerificationStatusEnum.pending
    ).count()

    # Approved all time
    approved = db.query(Customer).filter(
        Customer.verification_status == VerificationStatusEnum.approved
    ).count()

    # Rejected all time
    rejected = db.query(Customer).filter(
        Customer.verification_status == VerificationStatusEnum.rejected
    ).count()

    # Submitted today
    today_submitted = db.query(Customer).filter(
        func.date(Customer.created_at) == today
    ).count()

    # OTP verified
    otp_verified = db.query(Customer).filter(
        Customer.otp_verified == True
    ).count()

    # High risk score >= 70
    high_risk = db.query(Customer).filter(
        Customer.risk_score >= 70
    ).count()

    # Approval rate
    approval_rate = round(
        (approved / total * 100) if total > 0 else 0, 1
    )

    # Active sessions in progress
    active_sessions = db.query(VerificationSession).filter(
        VerificationSession.status == SessionStatusEnum.in_progress
    ).count()

    # Time series last 7 days
    time_series = []
    for i in range(6, -1, -1):
        day = date.today() - timedelta(days=i)
        count = db.query(Customer).filter(
            func.date(Customer.created_at) == day
        ).count()
        time_series.append({
            "date": day.strftime("%d %b"),
            "count": count
        })

    # Hourly submissions today
    hourly = []
    for hour in range(8, 20):
        count = db.query(Customer).filter(
            func.date(Customer.created_at) == today,
            func.extract("hour", Customer.created_at) == hour
        ).count()
        hourly.append({
            "hour": f"{hour:02d}:00",
            "count": count
        })

    return {
        "total_applications": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "today_submitted": today_submitted,
        "otp_verified": otp_verified,
        "high_risk": high_risk,
        "approval_rate": approval_rate,
        "active_sessions": active_sessions,
        "time_series": time_series,
        "hourly": hourly,
    }