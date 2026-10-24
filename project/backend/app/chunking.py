"""Text extraction and chunking for PDF, DOCX, TXT, and Markdown files."""

import re
from pathlib import Path

from app.config import settings

ACCEPTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


def extract_text(file_path: str, file_type: str) -> str:
    """Extract text from a file based on its type."""
    if file_type == "pdf":
        return _extract_pdf(file_path)
    elif file_type == "docx":
        return _extract_docx(file_path)
    elif file_type in ("txt", "md"):
        return _extract_text_file(file_path)
    return ""


def _extract_pdf(file_path: str) -> str:
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages)
    except Exception:
        return ""


def _extract_docx(file_path: str) -> str:
    try:
        from docx import Document
        doc = Document(file_path)
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception:
        return ""


def _extract_text_file(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def clean_text(text: str) -> str:
    """Normalize whitespace and remove problematic characters."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def get_file_type(filename: str) -> str:
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext == "pdf":
        return "pdf"
    if ext in ("doc", "docx"):
        return "docx"
    if ext == "md":
        return "md"
    return "txt"


def split_into_chunks(
    text: str,
    doc_id: str,
    doc_name: str,
    max_chunk_size: int | None = None,
    overlap: int | None = None,
) -> list[dict]:
    """Split text into overlapping chunks, preserving section and page metadata."""
    max_size = max_chunk_size or settings.CHUNK_SIZE
    chunk_overlap = overlap or settings.CHUNK_OVERLAP

    chunks = []
    lines = text.split("\n")
    current_section = "General"
    current_page = 1
    chunk_index = 0
    buffer = ""

    def flush():
        nonlocal buffer, chunk_index
        trimmed = buffer.strip()
        if len(trimmed) < 20:
            buffer = ""
            return
        chunks.append({
            "id": f"{doc_id}-chunk-{chunk_index}",
            "doc_id": doc_id,
            "doc_name": doc_name,
            "text": trimmed,
            "page": current_page,
            "section": current_section,
            "index": chunk_index,
        })
        chunk_index += 1
        buffer = ""

    for line in lines:
        section_match = re.match(r"Section\s+(\d+)", line, re.IGNORECASE)
        page_match = re.match(r"Page\s+(\d+)", line, re.IGNORECASE)

        if section_match:
            flush()
            current_section = f"Section {section_match.group(1)}"
            continue
        if page_match:
            flush()
            current_page = int(page_match.group(1))
            continue

        if len(buffer) + len(line) + 1 > max_size and buffer:
            flush()
            if chunk_overlap > 0:
                words = buffer.split()
                buffer = " ".join(words[-max(1, chunk_overlap // 5):]) + " "
        buffer += line + "\n"

    flush()
    return chunks
