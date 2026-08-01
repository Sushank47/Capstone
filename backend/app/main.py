import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import auth, documents, ai, chat, consent, audit, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mediexplain")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing MediExplain AI Backend Engine...")
    await init_db()
    yield
    logger.info("Shutting down MediExplain AI Backend...")

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

@app.get("/")
async def root_health():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
