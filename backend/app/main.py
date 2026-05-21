from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.models.database import init_db

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="KYC Admin Panel API",
    version="1.0.0",
    description="Admin panel API for Digital KYC system"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    print("KYC Admin Panel API is running")


@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.environment}
