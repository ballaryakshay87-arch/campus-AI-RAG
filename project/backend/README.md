# College Knowledge RAG Assistant — Python Backend

A production-ready FastAPI backend implementing the complete RAG pipeline with
ChromaDB vector storage, SQLite metadata, sentence-transformer embeddings, and
configurable LLM (Ollama or OpenAI).

## Quick Start

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload --port 8000
```

## Architecture

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, routers
│   ├── config.py            # Environment configuration
│   ├── models.py            # Pydantic request/response models
│   ├── database.py          # SQLite metadata store
│   ├── chunking.py          # Text extraction & chunking
│   ├── embeddings.py        # Embedding model wrapper
│   ├── vectorstore.py       # ChromaDB vector store
│   ├── llm.py               # LLM answer generation
│   ├── rag.py               # RAG pipeline orchestration
│   ├── security.py          # Admin auth dependency
│   └── routers/
│       ├── chat.py          # POST /api/chat
│       ├── documents.py     # CRUD + upload + reindex
│       ├── health.py        # GET /api/health
│       └── tests.py         # GET /api/tests
├── sample_docs/             # 12 sample college documents (.txt)
├── tests/                   # 21 test cases + runner
├── requirements.txt
└── README.md
```

## Environment Variables

See `../.env.example` for all configuration options.

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Security

- Admin-only document management via `X-Admin-Key` header
- CORS restricted to configured origins
- File type and size validation on uploads
- Document contents treated as evidence, never as instructions
- No API keys or sensitive details exposed in responses
