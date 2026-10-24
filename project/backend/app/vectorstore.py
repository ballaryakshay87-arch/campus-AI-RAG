"""ChromaDB vector store for chunk embeddings."""

import chromadb
from app.config import settings

COLLECTION_NAME = "college_chunks"


class VectorStore:
    def __init__(self):
        self._client = None
        self._collection = None

    def _get_collection(self):
        if self._collection is None:
            self._client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            self._collection = self._client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    def add_chunks(self, chunks: list[dict], embeddings: list[list[float]]):
        col = self._get_collection()
        if not chunks:
            return
        col.upsert(
            ids=[c["id"] for c in chunks],
            embeddings=embeddings,
            documents=[c["text"] for c in chunks],
            metadatas=[
                {
                    "doc_id": c["doc_id"],
                    "doc_name": c["doc_name"],
                    "page": c["page"],
                    "section": c["section"],
                    "index": c["index"],
                }
                for c in chunks
            ],
        )

    def query(self, query_embedding: list[float], n_results: int = 5,
              doc_ids: list[str] | None = None):
        col = self._get_collection()
        where = {"doc_id": {"$in": doc_ids}} if doc_ids else None
        results = col.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"],
        )
        return results

    def delete_by_doc(self, doc_id: str):
        col = self._get_collection()
        existing = col.get(where={"doc_id": doc_id})
        if existing["ids"]:
            col.delete(ids=existing["ids"])

    def count(self) -> int:
        col = self._get_collection()
        return col.count()


vector_store = VectorStore()
