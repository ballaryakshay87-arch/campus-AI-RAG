"""Sample document ingestion — loads demo college documents into the RAG system."""

import os
from datetime import datetime, timezone
from app.database import upsert_document, get_document, list_documents
from app.chunking import split_into_chunks
from app.embeddings import embedding_model
from app.vectorstore import vector_store

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "..", "sample_docs")

# Maps filename → doc_id
SAMPLE_FILES = [
    "academic_rules.txt",
    "examination_policy.txt",
    "library_rules.txt",
    "hostel_handbook.txt",
    "scholarships.txt",
    "fee_structure.txt",
    "attendance_policy.txt",
    "placement_guidelines.txt",
    "code_of_conduct.txt",
    "timetable.txt",
    "grievance_policy.txt",
    "internship_policy.txt",
]


def ingest_sample_documents():
    """Load all sample documents if not already ingested."""
    existing = {d["id"] for d in list_documents()}

    for filename in SAMPLE_FILES:
        doc_id = f"sample-{filename.replace('.txt', '')}"
        if doc_id in existing:
            continue

        filepath = os.path.join(SAMPLE_DIR, filename)
        if not os.path.exists(filepath):
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        if len(content.strip()) < 20:
            continue

        doc_name = filename.replace(".txt", "").replace("_", " ").title() + ".pdf"
        chunks = split_into_chunks(content, doc_id, doc_name)

        if not chunks:
            continue

        try:
            embeddings = embedding_model.embed([c["text"] for c in chunks])
            vector_store.add_chunks(chunks, embeddings)
        except Exception:
            pass  # Continue even if embedding fails (e.g. model not downloaded yet)

        upsert_document({
            "id": doc_id,
            "name": doc_name,
            "type": "pdf",
            "status": "ready",
            "enabled": True,
            "chunk_count": len(chunks),
            "size_bytes": len(content.encode("utf-8")),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "preview": content[:280],
            "is_sample": True,
            "error_message": None,
        })
