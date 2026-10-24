"""LLM wrapper — supports Ollama (local), OpenAI, or extractive fallback."""

from app.config import settings

SYSTEM_PROMPT = (
    "You are the official College Knowledge Assistant. "
    "Answer using ONLY retrieved passages from approved college documents. "
    "Never use external knowledge, assumptions or guesses. "
    "Give concise, factual answers with citations. "
    "If the passages do not contain sufficient evidence, "
    "reply exactly 'Insufficient evidence.' "
    "Never invent dates, fees, rules or procedures. "
    "If sources conflict, explain and cite both."
)


def generate_answer(question: str, passages: list[dict]) -> str:
    """Generate an answer using ONLY the retrieved passages."""
    if not passages:
        return "Insufficient evidence."

    context = "\n\n".join(
        f"[{i+1}] {p['doc_name']} ({p.get('section', '')}): {p['text']}"
        for i, p in enumerate(passages)
    )

    user_prompt = (
        f"Question: {question}\n\n"
        f"Retrieved passages:\n{context}\n\n"
        f"Answer using ONLY the passages above. "
        f"If they do not contain sufficient evidence, reply exactly 'Insufficient evidence.'"
    )

    if settings.LLM_PROVIDER == "ollama" or settings.LLM_PROVIDER == "local":
        return _call_ollama(user_prompt)
    elif settings.LLM_PROVIDER == "openai":
        return _call_openai(user_prompt)
    else:
        return _extractive_answer(question, passages)


def _call_ollama(user_prompt: str) -> str:
    try:
        import httpx
        resp = httpx.post(
            f"{settings.OLLAMA_BASE_URL}/api/chat",
            json={
                "model": settings.OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"].strip()
    except Exception:
        return _extractive_fallback_from_prompt(user_prompt)


def _call_openai(user_prompt: str) -> str:
    try:
        import openai
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0,
            max_tokens=300,
        )
        return resp.choices[0].message.content.strip()
    except Exception:
        return _extractive_fallback_from_prompt(user_prompt)


def _extractive_answer(question: str, passages: list[dict]) -> str:
    """Extractive fallback when no LLM is available."""
    import re
    q_words = set(re.findall(r"\b\w+\b", question.lower()))
    stop = {"the", "is", "a", "an", "of", "to", "in", "what", "how", "are", "for",
            "and", "or", "do", "i", "you", "can", "when", "where", "which", "tell",
            "me", "about", "need", "required", "requirement"}
    q_words -= stop

    best = []
    for p in passages:
        sentences = re.split(r'(?<=[.!?])\s+', p["text"])
        for s in sentences:
            s = s.strip()
            if len(s) < 15:
                continue
            s_words = set(re.findall(r"\b\w+\b", s.lower()))
            overlap = len(q_words & s_words)
            if overlap > 0:
                best.append((overlap / max(len(s_words), 1), s, p))

    if not best:
        first = passages[0]["text"].split(".")[0].strip()
        return first if first else "Insufficient evidence."

    best.sort(key=lambda x: x[0], reverse=True)
    return " ".join(b[1] for b in best[:3])


def _extractive_fallback_from_prompt(prompt: str) -> str:
    """Parse passages from the prompt and run extractive answer."""
    import re
    passages = []
    for m in re.finditer(r"\[\d+\] (.+?) \(([^)]*)\): (.+)", prompt):
        passages.append({"doc_name": m.group(1), "section": m.group(2), "text": m.group(3)})
    question_match = re.search(r"Question: (.+?)\n", prompt)
    question = question_match.group(1) if question_match else ""
    if not passages:
        return "Insufficient evidence."
    return _extractive_answer(question, passages)


def get_system_prompt() -> str:
    return SYSTEM_PROMPT


def get_llm_name() -> str:
    if settings.LLM_PROVIDER in ("ollama", "local"):
        return f"ollama/{settings.OLLAMA_MODEL}"
    elif settings.LLM_PROVIDER == "openai":
        return "openai/gpt-4o-mini"
    return "extractive-fallback"
