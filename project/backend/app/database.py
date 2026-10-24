"""SQLite metadata database for documents and query logs."""

import sqlite3
import json
from datetime import datetime, timezone
from typing import Any

from app.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    enabled INTEGER NOT NULL DEFAULT 1,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    uploaded_at TEXT NOT NULL,
    preview TEXT DEFAULT '',
    is_sample INTEGER NOT NULL DEFAULT 0,
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS query_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    status TEXT NOT NULL,
    citations_json TEXT,
    processing_time_ms INTEGER,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total INTEGER NOT NULL,
    correct INTEGER NOT NULL,
    incorrect INTEGER NOT NULL,
    accuracy REAL NOT NULL,
    results_json TEXT NOT NULL,
    ran_at TEXT NOT NULL
);
"""


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_db()
    conn.executescript(SCHEMA)
    conn.close()


def upsert_document(doc: dict[str, Any]) -> dict[str, Any]:
    conn = get_db()
    conn.execute(
        """INSERT OR REPLACE INTO documents
           (id, name, type, status, enabled, chunk_count, size_bytes, uploaded_at, preview, is_sample, error_message)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            doc["id"], doc["name"], doc["type"], doc["status"],
            int(doc["enabled"]), doc["chunk_count"], doc["size_bytes"],
            doc["uploaded_at"], doc.get("preview", ""),
            int(doc.get("is_sample", False)), doc.get("error_message"),
        ),
    )
    conn.commit()
    conn.close()
    return doc


def get_document(doc_id: str) -> dict[str, Any] | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def list_documents() -> list[dict[str, Any]]:
    conn = get_db()
    rows = conn.execute("SELECT * FROM documents ORDER BY name").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def delete_document(doc_id: str) -> bool:
    conn = get_db()
    cursor = conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def update_document_enabled(doc_id: str, enabled: bool) -> dict[str, Any] | None:
    conn = get_db()
    status = "ready" if enabled else "disabled"
    conn.execute(
        "UPDATE documents SET enabled = ?, status = ? WHERE id = ?",
        (int(enabled), status, doc_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def log_query(question: str, answer: str, status: str, citations: list, processing_time_ms: int):
    conn = get_db()
    conn.execute(
        """INSERT INTO query_logs (question, answer, status, citations_json, processing_time_ms, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (question, answer, status, json.dumps(citations), processing_time_ms,
         datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()


def save_test_report(report: dict[str, Any]):
    conn = get_db()
    conn.execute(
        """INSERT INTO test_results (total, correct, incorrect, accuracy, results_json, ran_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (report["total"], report["correct"], report["incorrect"],
         report["accuracy"], json.dumps(report["results"]), report["ran_at"]),
    )
    conn.commit()
    conn.close()


def get_stats() -> dict[str, int]:
    conn = get_db()
    rows = conn.execute("SELECT chunk_count, enabled, status FROM documents").fetchall()
    conn.close()
    total_chunks = sum(r["chunk_count"] for r in rows)
    doc_count = len(rows)
    return {"document_count": doc_count, "chunk_count": total_chunks}
