from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import csv
import io
from app.models.database import get_db, WatchlistNIC
from app.models.admin_user import AdminUser
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


class AddNICRequest(BaseModel):
    nic_number: str
    reason: str


@router.get("")
def list_watchlist(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_user)
):
    entries = db.query(WatchlistNIC).order_by(
        WatchlistNIC.added_at.desc()
    ).all()
    return [
        {
            "id": e.id,
            "nic_number": e.nic_number,
            "reason": e.reason,
            "added_by": e.added_by,
            "added_at": e.added_at,
        }
        for e in entries
    ]


@router.post("")
def add_to_watchlist(
    req: AddNICRequest,
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(require_role(["admin", "super_admin"]))
):
    existing = db.query(WatchlistNIC).filter(
        WatchlistNIC.nic_number == req.nic_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="NIC already on watchlist")

    entry = WatchlistNIC(
        nic_number=req.nic_number,
        reason=req.reason,
        added_by=f"{actor.employee_id} ({actor.full_name})"
    )
    db.add(entry)
    db.commit()
    return {"message": "NIC added to watchlist", "nic_number": req.nic_number}


@router.delete("/{id}")
def remove_from_watchlist(
    id: int,
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(require_role(["super_admin"]))
):
    entry = db.query(WatchlistNIC).filter(WatchlistNIC.id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Removed from watchlist"}


@router.get("/export/csv")
def export_watchlist(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(require_role(["super_admin"]))
):
    entries = db.query(WatchlistNIC).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "NIC Number", "Reason", "Added By", "Added At"])
    for e in entries:
        writer.writerow([
            e.id, e.nic_number, e.reason,
            e.added_by, e.added_at
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.read().encode()),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=watchlist.csv"
        }
    )
