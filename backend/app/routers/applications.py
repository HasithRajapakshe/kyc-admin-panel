from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import Optional
import csv
import io
from app.models.database import (
    get_db, Customer, VerificationSession, VerificationLog,
    Document, Signature, Account,
    VerificationStatusEnum, SessionStatusEnum, LogResultEnum
)
from app.models.admin_user import AdminUser
from app.core.dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/applications", tags=["applications"])


class DecisionRequest(BaseModel):
    reason: Optional[str] = ""


@router.get("")
def list_applications(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_user)
):
    query = db.query(Customer)

    if search:
        query = query.filter(or_(
            Customer.full_name.ilike(f"%{search}%"),
            Customer.nic_number.ilike(f"%{search}%"),
            Customer.session_id.ilike(f"%{search}%"),
            Customer.phone_number.ilike(f"%{search}%"),
        ))

    if status:
        try:
            query = query.filter(
                Customer.verification_status == VerificationStatusEnum(status)
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status value")

    allowed_sort = ["created_at", "updated_at", "full_name", "risk_score"]
    if sort_by not in allowed_sort:
        sort_by = "created_at"

    col = getattr(Customer, sort_by)
    query = query.order_by(desc(col) if sort_dir == "desc" else asc(col))

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()

    result = []
    for c in items:
        # Get latest session status
        latest_session = db.query(VerificationSession).filter(
            VerificationSession.customer_id == c.id
        ).order_by(VerificationSession.id.desc()).first()

        result.append({
            "session_id": c.session_id,
            "full_name": c.full_name,
            "nic_number": c.nic_number,
            "phone_number": c.phone_number,
            "email": c.email,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "verification_status": c.verification_status.value,
            "risk_score": str(c.risk_score) if c.risk_score else None,
            "otp_verified": c.otp_verified,
            "account_purpose": c.account_purpose,
            "session_status": latest_session.status.value if latest_session else None,
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "items": result
    }


@router.get("/export/csv")
def export_applications(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_user)
):
    query = db.query(Customer)
    if status:
        query = query.filter(
            Customer.verification_status == VerificationStatusEnum(status)
        )
    customers = query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Session ID", "Full Name", "NIC", "Phone", "Email",
        "Status", "Risk Score", "OTP Verified", "Created At"
    ])
    for c in customers:
        writer.writerow([
            c.session_id, c.full_name, c.nic_number,
            c.phone_number, c.email,
            c.verification_status.value,
            str(c.risk_score) if c.risk_score else "",
            c.otp_verified, c.created_at
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.read().encode()),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=applications.csv"
        }
    )


@router.get("/{session_id}")
def get_application_detail(
    session_id: str,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_user)
):
    customer = db.query(Customer).filter(
        Customer.session_id == session_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Application not found")

    sessions = db.query(VerificationSession).filter(
        VerificationSession.customer_id == customer.id
    ).all()

    logs = []
    docs = []
    for s in sessions:
        logs += db.query(VerificationLog).filter(
            VerificationLog.session_id == s.id
        ).order_by(VerificationLog.timestamp).all()
        docs += db.query(Document).filter(
            Document.session_id == s.id
        ).all()

    signatures = db.query(Signature).filter(
        Signature.customer_id == customer.id
    ).all()
    accounts = db.query(Account).filter(
        Account.customer_id == customer.id
    ).all()

    return {
        "customer": {
            "id": customer.id,
            "session_id": customer.session_id,
            "full_name": customer.full_name,
            "nic_number": customer.nic_number,
            "date_of_birth": customer.date_of_birth,
            "age": customer.age,
            "gender": customer.gender,
            "address": customer.address,
            "phone_number": customer.phone_number,
            "email": customer.email,
            "otp_verified": customer.otp_verified,
            "otp_attempts": customer.otp_attempts,
            "selfie_image": customer.selfie_image,
            "account_purpose": customer.account_purpose,
            "account_number": customer.account_number,
            "verification_status": customer.verification_status.value,
            "risk_score": str(customer.risk_score) if customer.risk_score else None,
            "created_at": customer.created_at,
            "updated_at": customer.updated_at,
        },
        "sessions": [
            {
                "session_id": s.session_id,
                "language": s.language.value,
                "status": s.status.value,
                "started_at": s.started_at,
                "completed_at": s.completed_at,
                "name_verified": s.name_verified,
            }
            for s in sessions
        ],
        "logs": [
            {
                "step": l.step,
                "action": l.action,
                "result": l.result.value,
                "details": l.details,
                "confidence_score": str(l.confidence_score) if l.confidence_score else None,
                "timestamp": l.timestamp,
            }
            for l in logs
        ],
        "documents": [
            {
                "id": d.id,
                "type": d.document_type.value,
                "file_path": d.file_path,
                "file_size": d.file_size,
                "quality_score": str(d.quality_score) if d.quality_score else None,
                "uploaded_at": d.uploaded_at,
            }
            for d in docs
        ],
        "signatures": [
            {
                "type": s.signature_type.value,
                "data": s.signature_data,
                "created_at": s.created_at,
            }
            for s in signatures
        ],
        "accounts": [
            {
                "account_number": a.account_number,
                "account_type": a.account_type,
                "branch": a.branch,
                "status": a.status,
                "created_at": a.created_at,
            }
            for a in accounts
        ]
    }


@router.post("/{session_id}/approve")
def approve_application(
    session_id: str,
    payload: DecisionRequest,
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_user)
):
    customer = db.query(Customer).filter(
        Customer.session_id == session_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Application not found")
    if customer.verification_status != VerificationStatusEnum.pending:
        raise HTTPException(
            status_code=400,
            detail=f"Application is already {customer.verification_status.value}"
        )
    customer.verification_status = VerificationStatusEnum.approved
    _write_audit(db, customer, actor, "approved", payload.reason)
    db.commit()
    return {"status": "approved", "session_id": session_id}


@router.post("/{session_id}/reject")
def reject_application(
    session_id: str,
    payload: DecisionRequest,
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_user)
):
    customer = db.query(Customer).filter(
        Customer.session_id == session_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Application not found")
    if customer.verification_status != VerificationStatusEnum.pending:
        raise HTTPException(
            status_code=400,
            detail=f"Application is already {customer.verification_status.value}"
        )
    customer.verification_status = VerificationStatusEnum.rejected
    _write_audit(db, customer, actor, "rejected", payload.reason)
    db.commit()
    return {"status": "rejected", "session_id": session_id}


def _write_audit(db, customer, actor, action, reason):
    """
    Silently writes audit trail to VerificationLog.
    Uses employee_id so logs are traceable to exact staff member.
    Format: approved by USR-1234-a3f9-12bc (Hasith). Reason: ...
    """
    session = db.query(VerificationSession).filter(
        VerificationSession.customer_id == customer.id
    ).order_by(VerificationSession.id.desc()).first()

    if session:
        log = VerificationLog(
            session_id=session.id,
            step="admin_decision",
            action=(
                f"{action} by {actor.employee_id} "
                f"({actor.full_name}). "
                f"Reason: {reason}"
            ),
            result=LogResultEnum.success
        )
        db.add(log)
