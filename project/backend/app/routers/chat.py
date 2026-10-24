"""Chat router — POST /api/chat"""

from fastapi import APIRouter, HTTPException
from app.models import ChatRequest, ChatResponse
from app.rag import answer_question
from app.database import log_query

router = APIRouter()


@router.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.question.strip():
        raise HTTPException(status_code=422, detail="Question must not be empty.")

    result = answer_question(req.question.strip())

    log_query(
        result["question"],
        result["answer"],
        result["status"],
        result["citations"],
        result["processing_time_ms"],
    )

    return ChatResponse(**result)
