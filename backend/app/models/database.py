"""
Database models and configuration for the Digital KYC application.
"""
from contextlib import contextmanager
from typing import Generator
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime, Text, Boolean,
    Enum, Numeric, ForeignKey, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import enum

from app.core.config import settings

# Create database engine
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith(
        "sqlite") else {}
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


# Database dependency
def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI endpoints.

    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """
    Context manager for database sessions (for use outside of FastAPI dependencies).

    Usage:
        with get_db_context() as db:
            # Use db here
            db.query(...)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== Enums ====================

class VerificationStatusEnum(enum.Enum):  # bank agent approve rejet or pending
    """Customer verification status"""
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class LanguageEnum(enum.Enum):
    """Supported languages"""
    en = "en"
    si = "si"
    ta = "ta"


class SessionStatusEnum(enum.Enum):
    """Verification session status"""
    started = "started"
    in_progress = "in_progress"
    completed = "completed"


class LogResultEnum(enum.Enum):
    """Verification log result"""
    success = "success"
    failed = "failed"
    warning = "warning"


class DocumentTypeEnum(enum.Enum):
    """Document types"""
    nic_front = "nic_front"
    nic_back = "nic_back"
    signature = "signature"
    video_frame = "video_frame"


class SignatureTypeEnum(enum.Enum):
    """Signature types"""
    canvas = "canvas"
    uploaded = "uploaded"


# ==================== Models ====================

class Customer(Base):
    """
    Customer model for storing KYC customer information.
    """
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    nic_number = Column(String(20), index=True, nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)

    # Contact Information
    phone_number = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)

    # OTP Verification
    otp_code = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    otp_verified = Column(Boolean, default=False, nullable=False)
    otp_attempts = Column(Integer, default=0, nullable=False)

    # Selfie Image (base64 encoded)
    selfie_image = Column(Text, nullable=True)

    account_purpose = Column(String(50), nullable=True)
    account_number = Column(String(50), unique=True, nullable=True)
    verification_status = Column(
        Enum(VerificationStatusEnum),
        default=VerificationStatusEnum.pending,
        nullable=False
    )
    risk_score = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow, nullable=False)

    # Relationships
    verification_sessions = relationship(
        "VerificationSession", back_populates="customer")
    accounts = relationship("Account", back_populates="customer")
    signatures = relationship("Signature", back_populates="customer")

    def __repr__(self) -> str:
        return f"<Customer(id={self.id}, nic={self.nic_number}, status={self.verification_status})>"


class VerificationSession(Base):
    """
    Verification session model for tracking KYC verification process.
    """
    __tablename__ = "verification_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    language = Column(Enum(LanguageEnum),
                      default=LanguageEnum.en, nullable=False)
    status = Column(
        Enum(SessionStatusEnum),
        default=SessionStatusEnum.started,
        nullable=False
    )
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    name_verified = Column(Boolean, default=False, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="verification_sessions")
    logs = relationship("VerificationLog", back_populates="session")
    documents = relationship("Document", back_populates="session")

    def __repr__(self) -> str:
        return f"<VerificationSession(id={self.id}, session_id={self.session_id}, status={self.status})>"


# Alias for compatibility with user-provided code
KYCSession = VerificationSession


class VerificationLog(Base):
    """
    Verification log model for tracking verification steps and results.
    """
    __tablename__ = "verification_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey(
        "verification_sessions.id"), nullable=False)
    step = Column(String(50), nullable=False)
    action = Column(String(255), nullable=False)
    result = Column(Enum(LogResultEnum), nullable=False)
    details = Column(Text, nullable=True)
    confidence_score = Column(Numeric(5, 2), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("VerificationSession", back_populates="logs")

    # Index for faster queries on session and timestamp
    __table_args__ = (
        Index('idx_session_timestamp', 'session_id', 'timestamp'),
    )

    def __repr__(self) -> str:
        return f"<VerificationLog(id={self.id}, step={self.step}, result={self.result})>"


class WatchlistNIC(Base):
    """
    Watchlist NIC model for storing flagged NIC numbers.
    """
    __tablename__ = "watchlist_nics"

    id = Column(Integer, primary_key=True, index=True)
    nic_number = Column(String(20), unique=True, index=True, nullable=False)
    reason = Column(Text, nullable=False)
    added_by = Column(String(100), nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<WatchlistNIC(id={self.id}, nic={self.nic_number})>"


class Account(Base):
    """
    Account model for customer bank accounts.
    """
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String(50), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    account_type = Column(String(50), default="Savings", nullable=False)
    branch = Column(String(100), default="Main Branch", nullable=False)
    status = Column(String(20), default="Active", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="accounts")

    def __repr__(self) -> str:
        return f"<Account(id={self.id}, account_number={self.account_number}, status={self.status})>"


class Document(Base):
    """
    Document model for storing uploaded KYC documents.
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey(
        "verification_sessions.id"), nullable=False)
    document_type = Column(Enum(DocumentTypeEnum), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    quality_score = Column(Numeric(5, 2), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("VerificationSession", back_populates="documents")

    # Index for faster queries on session and document type
    __table_args__ = (
        Index('idx_session_doctype', 'session_id', 'document_type'),
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, type={self.document_type}, session_id={self.session_id})>"


class Signature(Base):
    """
    Signature model for storing customer signatures.
    """
    __tablename__ = "signatures"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    signature_type = Column(Enum(SignatureTypeEnum), nullable=False)
    signature_data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="signatures")

    def __repr__(self) -> str:
        return f"<Signature(id={self.id}, customer_id={self.customer_id}, type={self.signature_type})>"


# ==================== Legacy Model ====================

class KYCDocument(Base):
    """
    Legacy KYC Document model for backward compatibility.
    """
    __tablename__ = "kyc_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), index=True, nullable=False)
    document_type = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    extracted_data = Column(Text, nullable=True)
    verification_status = Column(String(50), default="pending")
    verification_notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<KYCDocument(id={self.id}, user_id={self.user_id}, type={self.document_type})>"


# ==================== Database Initialization ====================

def init_db() -> None:
    """
    Initialize the database by creating all tables.
    This function should be called on application startup.
    """
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


def drop_all_tables() -> None:
    """
    Drop all tables from the database.
    WARNING: This will delete all data! Use only for development/testing.
    """
    print("WARNING: Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped!")


def reset_db() -> None:
    """
    Reset the database by dropping and recreating all tables.
    WARNING: This will delete all data! Use only for development/testing.
    """
    drop_all_tables()
    init_db()
