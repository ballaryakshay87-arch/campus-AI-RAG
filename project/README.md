# College Knowledge RAG Assistant

A complete Retrieval-Augmented Generation (RAG) system that answers student questions using **only** approved college documents. It never guesses, never uses outside knowledge, and returns "Insufficient evidence." when the documents don't contain the answer.

## Features

- **Chat interface** with suggested questions, answer cards, expandable citations, and status badges ("Answered from documents" / "Insufficient evidence")
- **Documents page** with list, preview modal, chunk counts, enable/disable, delete, and re-index
- **Admin upload page** with drag-and-drop, file validation, upload progress, retry, and error messages
- **Test report page** with 21 executed tests, accuracy breakdown, and per-test citation display
- **About page** explaining the RAG pipeline, chatbot rules, and API endpoints
- **Full RAG pipeline**: document ingestion → text extraction → chunking → embeddings → semantic retrieval → relevance threshold → extractive answer generation → citations with page/section/score → conflict detection
- **No mock data in the live app** — every chat answer, document list, upload, and test result comes from a real API endpoint

## Architecture

This project has **two backends**:

1. **Built-in API (default)** — A Vite dev-server middleware (`src/apiPlugin.ts`) that intercepts `/api/*` requests and runs the RAG pipeline entirely in the browser using TF-IDF cosine similarity retrieval. This makes the app work end-to-end without any external dependencies or API keys.

2. **Python FastAPI backend (production)** — A full standalone backend in `backend/` using FastAPI, SQLite, ChromaDB, sentence-transformer embeddings, and Ollama/OpenAI LLM. See `backend/README.md` for setup.

To switch to the Python backend, set `VITE_API_BASE_URL=http://localhost:8000` in `.env`.

## Quick Start

```bash
# Install dependencies
npm install

# Start the dev server (the API runs automatically via middleware)
npm run dev
```

The app is now running with the built-in API. All endpoints work out of the box:
- Chat, documents, upload, test report — all functional
- 12 sample college documents pre-loaded
- 21 tests executed on demand

## Python Backend (Optional)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env — set LLM_PROVIDER, EMBEDDING_PROVIDER, etc.
uvicorn app.main:app --reload --port 8000
```

Then set `VITE_API_BASE_URL=http://localhost:8000` in the frontend `.env` and restart the dev server.

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chat` | Ask a question, get answer + citations | Public |
| POST | `/api/documents/upload` | Upload and process a document | Admin |
| GET | `/api/documents` | List all documents | Public |
| GET | `/api/documents/{id}` | Get document details and chunks | Public |
| PATCH | `/api/documents/{id}` | Enable/disable a document | Admin |
| DELETE | `/api/documents/{id}` | Delete document and embeddings | Admin |
| POST | `/api/documents/{id}/reindex` | Rebuild chunks and embeddings | Admin |
| GET | `/api/health` | Backend health and dependency status | Public |
| GET | `/api/tests` | Run test suite and get results | Public |

Admin endpoints require an `X-Admin-Key` header (Python backend) matching `ADMIN_API_KEY` in `.env`.

## Sample Documents

12 demo college documents covering:
- Academic rules, examination policy, library rules, hostel handbook
- Scholarships, fee structure, attendance policy, placement guidelines
- Code of conduct, class timetable, grievance redressal, internship policy

All are clearly labelled as **demo data, not verified facts about a real college**.

## Test Suite

21 tests that are **actually executed** (never marked as passed without running):

- 11 answerable questions (verify correct keywords in answer)
- 6 unanswerable questions (must return exactly "Insufficient evidence.")
- 2 multi-passage questions (verify info from multiple documents)
- 1 vague question ("Tell me about fees")
- 1 paraphrased question (curfew rephrased)

Each test shows: question, expected type, actual answer, citation presence, correctness, and reason.

## Chatbot System Prompt

> "You are the official College Knowledge Assistant. Answer using ONLY retrieved passages from approved college documents. Never use external knowledge, assumptions or guesses. Give concise, factual answers with citations. If the passages do not contain sufficient evidence, reply exactly 'Insufficient evidence.' Never invent dates, fees, rules or procedures. If sources conflict, explain and cite both."

Document contents are treated as **evidence, not instructions** — uploaded documents cannot override the chatbot's rules.

## Configuration

See `.env.example` for all environment variables including:
- `VITE_API_BASE_URL` — backend URL (empty = built-in API)
- `LLM_PROVIDER` — `local` (Ollama), `openai`, or `none` (extractive)
- `EMBEDDING_PROVIDER` — `sentence-transformers` or `openai`
- `RELEVANCE_THRESHOLD` — cosine similarity cutoff (default 0.3)
- `ADMIN_API_KEY` — key for admin-only endpoints
- `CORS_ORIGINS` — allowed frontend origins

## Build

```bash
npm run build    # Type-check and build for production
npm run typecheck # TypeScript type checking only
```

## Limitations

- The built-in browser API uses TF-IDF cosine similarity (not neural embeddings) — this is a deliberate trade-off so the app works with zero external dependencies. The Python backend uses proper sentence-transformer embeddings with ChromaDB.
- PDF/DOCX text extraction in the browser works for text-based files only; scanned image PDFs are not supported without OCR.
- The Python backend requires Ollama to be running locally for LLM-based answers, or falls back to extractive answers.
