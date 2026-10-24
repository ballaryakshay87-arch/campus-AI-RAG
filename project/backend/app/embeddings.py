"""Embedding model wrapper — supports sentence-transformers (local) or OpenAI."""

import numpy as np
from app.config import settings


class EmbeddingModel:
    def __init__(self):
        self._model = None
        self._provider = settings.EMBEDDING_PROVIDER
        self._model_name = (
            settings.SENTENCE_TRANSFORMER_MODEL
            if self._provider == "sentence-transformers"
            else "text-embedding-3-small"
        )

    def _load(self):
        if self._model is not None:
            return
        if self._provider == "sentence-transformers":
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(settings.SENTENCE_TRANSFORMER_MODEL)
        else:
            self._model = "openai"  # marker

    def embed(self, texts: list[str]) -> list[list[float]]:
        self._load()
        if self._provider == "sentence-transformers":
            embeddings = self._model.encode(texts, show_progress_bar=False)
            return embeddings.tolist()
        else:
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            resp = client.embeddings.create(
                input=texts, model="text-embedding-3-small"
            )
            return [d.embedding for d in resp.data]

    def embed_query(self, text: str) -> list[float]:
        return self.embed([text])[0]

    @property
    def name(self) -> str:
        return f"{self._provider}/{self._model_name}"


embedding_model = EmbeddingModel()
