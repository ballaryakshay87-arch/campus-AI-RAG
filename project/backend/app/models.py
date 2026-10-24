"""Pydantic models for API requests and responses."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)


class Citation(BaseModel):
    doc_id: str
    doc_name: str
    passage: str
    page: int = 0
    section: str = ""
    score: float = 0.0


class ChatResponse(BaseModel):
    question: str
    answer: str
    status: str  # "answered" | "insufficient"
    citations: list[Citation] = []
    processing_time_ms: int = 0
    conflict: bool = False
    system_prompt: str = ""


class DocumentResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    enabled: bool
    chunk_count: int
    size_bytes: int
    uploaded_at: str
    preview: str = ""
    is_sample: bool = False
    error_message: str | None = None


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    count: int


class ChunkResponse(BaseModel):
    id: str
    doc_id: str
    doc_name: str
    text: str
    page: int
    section: str
    index: int


class DocumentDetailResponse(BaseModel):
    document: DocumentResponse
    chunks: list[ChunkResponse]


class PatchDocumentRequest(BaseModel):
    enabled: bool


class HealthResponse(BaseModel):
    status: str
    backend: bool
    vector_store: bool
    embedding_model: str
    llm_model: str
    document_count: int
    chunk_count: int


class TestCaseResponse(BaseModel):
    id: str
    category: str
    question: str
    expected_type: str
    expected_keywords: list[str] = []
    description: str


class TestResultResponse(BaseModel):
    case: TestCaseResponse
    answer: str
    status: str
    citations: list[Citation] = []
    correct: bool
    processing_time_ms: int
    reason: str


class TestReportResponse(BaseModel):
    results: list[TestResultResponse]
    total: int
    correct: int
    incorrect: int
    accuracy: float
    ran_at: str
    executed: bool


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
