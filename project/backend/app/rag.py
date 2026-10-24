"""RAG pipeline orchestration: retrieve, threshold, answer, cite, detect conflicts."""

import time
import re
from app.config import settings
from app.embeddings import embedding_model
from app.vectorstore import vector_store
from app.database import list_documents
from app.llm import generate_answer, get_system_prompt


def answer_question(question: str) -> dict:
    """Full RAG pipeline: embed query, retrieve, threshold, generate, cite."""
    start = time.time()

    # Get enabled doc IDs for filtering
    docs = list_documents()
    enabled_doc_ids = [d["id"] for d in docs if d["enabled"] and d["status"] == "ready"]

    if not enabled_doc_ids:
        elapsed = int((time.time() - start) * 1000)
        return {
            "question": question,
            "answer": "Insufficient evidence.",
            "status": "insufficient",
            "citations": [],
            "processing_time_ms": elapsed,
            "conflict": False,
            "system_prompt": get_system_prompt(),
        }

    query_embedding = embedding_model.embed_query(question)
    results = vector_store.query(
        query_embedding,
        n_results=settings.MAX_RETRIEVED_CHUNKS,
        doc_ids=enabled_doc_ids,
    )

    if not results["ids"] or not results["ids"][0]:
        elapsed = int((time.time() - start) * 1000)
        return {
            "question": question,
            "answer": "Insufficient evidence.",
            "status": "insufficient",
            "citations": [],
            "processing_time_ms": elapsed,
            "conflict": False,
            "system_prompt": get_system_prompt(),
        }

    # Build passages from results (ChromaDB returns cosine distance; similarity = 1 - distance)
    passages = []
    citations = []
    for i, doc_id in enumerate(results["ids"][0]):
        distance = results["distances"][0][i]
        similarity = 1.0 - distance
        if similarity < settings.RELEVANCE_THRESHOLD:
            continue
        meta = results["metadatas"][0][i]
        text = results["documents"][0][i]
        passage = {
            "doc_id": meta["doc_id"],
            "doc_name": meta["doc_name"],
            "text": text,
            "page": meta.get("page", 0),
            "section": meta.get("section", ""),
            "score": round(similarity, 4),
        }
        passages.append(passage)
        citations.append({
            "doc_id": passage["doc_id"],
            "doc_name": passage["doc_name"],
            "passage": text.strip(),
            "page": passage["page"],
            "section": passage["section"],
            "score": passage["score"],
        })

    if not passages:
        elapsed = int((time.time() - start) * 1000)
        return {
            "question": question,
            "answer": "Insufficient evidence.",
            "status": "insufficient",
            "citations": [],
            "processing_time_ms": elapsed,
            "conflict": False,
            "system_prompt": get_system_prompt(),
        }

    # Detect conflicts between different docs
    conflict = _detect_conflict(passages)

    answer = generate_answer(question, passages)
    status = "insufficient" if answer == "Insufficient evidence." else "answered"
    elapsed = int((time.time() - start) * 1000)

    return {
        "question": question,
        "answer": answer,
        "status": status,
        "citations": citations if status == "answered" else [],
        "processing_time_ms": elapsed,
        "conflict": conflict,
        "system_prompt": get_system_prompt(),
    }


def _detect_conflict(passages: list[dict]) -> bool:
    """Detect if different docs cite conflicting numbers/policies."""
    if len(passages) < 2:
        return False
    doc_ids = {p["doc_id"] for p in passages[:3]}
    if len(doc_ids) < 2:
        return False

    numbers = {}
    for p in passages[:3]:
        found = re.findall(r"Rs\.?\s*[\d,]+|\d+\s*(?:%|percent|points|days?|weeks?|lakhs?)", p["text"], re.IGNORECASE)
        if found:
            numbers.setdefault(p["doc_id"], []).extend(found)

    if len(numbers) < 2:
        return False
    all_vals = set()
    for arr in numbers.values():
        for v in arr:
            all_vals.add(re.sub(r"\s+", " ", v.lower()))
    return len(all_vals) >= 2
