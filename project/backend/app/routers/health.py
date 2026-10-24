"""Health router — GET /api/health"""

from fastapi import APIRouter
from app.models import HealthResponse
from app.database import get_stats
from app.embeddings import embedding_model
from app.llm import get_llm_name
from app.vectorstore import vector_store

router = APIRouter()


@router.get("/api/health", response_model=HealthResponse)
async def health():
    stats = get_stats()
    try:
        chunk_count = vector_store.count()
        vs_ok = True
    except Exception:
        chunk_count = stats["chunk_count"]
        vs_ok = False

    return HealthResponse(
        status="healthy" if vs_ok else "degraded",
        backend=True,
        vector_store=vs_ok,
        embedding_model=embedding_model.name,
        llm_model=get_llm_name(),
        document_count=stats["document_count"],
        chunk_count=chunk_count,
    )
