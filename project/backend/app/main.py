"""FastAPI main application — College Knowledge RAG Assistant."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import chat, documents, health, tests
from app.ingestion import ingest_sample_documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    ingest_sample_documents()
    yield


app = FastAPI(
    title="College Knowledge RAG Assistant",
    description="Retrieval-Augmented Generation assistant for college policy documents.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Admin-Key"],
)

app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(health.router)
app.include_router(tests.router)


@app.get("/")
async def root():
    return {"name": "College Knowledge RAG Assistant", "docs": "/docs", "health": "/api/health"}
