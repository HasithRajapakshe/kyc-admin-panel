import sys
import os
from datetime import datetime, timedelta

# Add backend directory to sys.path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models.database import (
    SessionLocal, Customer, VerificationSession, VerificationLog, Document, Signature,
    VerificationStatusEnum, LanguageEnum, SessionStatusEnum, LogResultEnum, DocumentTypeEnum, SignatureTypeEnum
)

def seed():
    db = SessionLocal()
    try:
        print("Creating sample customer 1...")
        # Create Customer 1 (Pending)
        session_id_1 = "ses_9x8f7d6e5c4b3a21"
        c1 = Customer(
            session_id=session_id_1,
            full_name="John Doe",
            nic_number="199012345678",
            date_of_birth=datetime(1990, 1, 1),
            age=36,
            gender="Male",
            address="123 Main St, Colombo",
            phone_number="+94771234567",
            email="john.doe@example.com",
            otp_verified=True,
            otp_attempts=1,
            otp_expires_at=datetime.utcnow() + timedelta(minutes=5),
            account_purpose="Salary",
            verification_status=VerificationStatusEnum.pending,
            risk_score=35.5,
            created_at=datetime.utcnow() - timedelta(minutes=30)
        )
        db.add(c1)
        db.flush()

        s1 = VerificationSession(
            session_id=session_id_1,
            customer_id=c1.id,
            language=LanguageEnum.en,
            status=SessionStatusEnum.completed,
            started_at=datetime.utcnow() - timedelta(minutes=30),
            completed_at=datetime.utcnow() - timedelta(minutes=25)
        )
        db.add(s1)
        db.flush()

        # Logs
        l1 = VerificationLog(session_id=s1.id, step="OTP Verification", action="Sent OTP", result=LogResultEnum.success, timestamp=datetime.utcnow() - timedelta(minutes=29))
        l2 = VerificationLog(session_id=s1.id, step="OTP Verification", action="Verified OTP", result=LogResultEnum.success, timestamp=datetime.utcnow() - timedelta(minutes=28))
        l3 = VerificationLog(session_id=s1.id, step="Document OCR", action="Extracted NIC data", result=LogResultEnum.success, confidence_score=95.5, timestamp=datetime.utcnow() - timedelta(minutes=27))
        l4 = VerificationLog(session_id=s1.id, step="Face Match", action="Compared selfie with NIC", result=LogResultEnum.success, confidence_score=92.1, timestamp=datetime.utcnow() - timedelta(minutes=26))
        db.add_all([l1, l2, l3, l4])

        # Documents
        d1 = Document(session_id=s1.id, document_type=DocumentTypeEnum.nic_front, file_path="/fake/path/nic_front.jpg", file_size=102400, quality_score=88.5)
        d2 = Document(session_id=s1.id, document_type=DocumentTypeEnum.nic_back, file_path="/fake/path/nic_back.jpg", file_size=98000, quality_score=85.2)
        d3 = Document(session_id=s1.id, document_type=DocumentTypeEnum.video_frame, file_path="/fake/path/selfie.jpg", file_size=150000, quality_score=99.1)
        db.add_all([d1, d2, d3])

        # Signature
        sig1 = Signature(customer_id=c1.id, signature_type=SignatureTypeEnum.canvas, signature_data="data:image/png;base64,fakebase64data")
        db.add(sig1)

        print("Creating sample customer 2...")
        # Create Customer 2 (Rejected)
        session_id_2 = "ses_1a2b3c4d5e6f7g89"
        c2 = Customer(
            session_id=session_id_2,
            full_name="Jane Smith",
            nic_number="198598765432",
            date_of_birth=datetime(1985, 5, 12),
            age=41,
            gender="Female",
            address="456 Galle Rd, Colombo",
            phone_number="+94719876543",
            email="jane.smith@example.com",
            otp_verified=False,
            otp_attempts=3,
            account_purpose="Business",
            verification_status=VerificationStatusEnum.rejected,
            risk_score=85.0,
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(c2)
        db.flush()

        s2 = VerificationSession(
            session_id=session_id_2,
            customer_id=c2.id,
            language=LanguageEnum.en,
            status=SessionStatusEnum.completed,
            started_at=datetime.utcnow() - timedelta(hours=2),
            completed_at=datetime.utcnow() - timedelta(hours=1, minutes=50)
        )
        db.add(s2)
        db.flush()

        l5 = VerificationLog(session_id=s2.id, step="OTP Verification", action="Sent OTP", result=LogResultEnum.success, timestamp=datetime.utcnow() - timedelta(hours=1, minutes=59))
        l6 = VerificationLog(session_id=s2.id, step="OTP Verification", action="Failed OTP verification", result=LogResultEnum.failed, timestamp=datetime.utcnow() - timedelta(hours=1, minutes=55))
        l7 = VerificationLog(session_id=s2.id, step="Face Match", action="Compared selfie with NIC", result=LogResultEnum.failed, confidence_score=35.0, timestamp=datetime.utcnow() - timedelta(hours=1, minutes=52))
        db.add_all([l5, l6, l7])

        db.commit()
        print("Sample data added successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
