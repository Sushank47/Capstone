import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import auth, documents, ai, chat, consent, audit, admin, doctors

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medipro")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing MediPro AI Backend Engine...")
    await init_db()
    yield
    logger.info("Shutting down MediPro AI Backend...")

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Enterprise-grade AI Healthcare Platform for complex medical document analysis, "
        "Azure AI Vision OCR, Azure AI Language NLP, Azure OpenAI simplification, Azure Speech audio, "
        "and Zero-Trust Patient Consent Management."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(ai.router)
app.include_router(chat.router)
app.include_router(consent.router)
app.include_router(audit.router)
app.include_router(admin.router)
app.include_router(doctors.router)

@app.get("/")
async def root_health():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }
