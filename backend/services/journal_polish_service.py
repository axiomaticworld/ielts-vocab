"""AI Polish service for journal notes."""

from services.llm_service.chat_streaming import chat


def polish_text(content: str) -> str:
    """Polish the given markdown text using AI. Returns polished markdown."""
    if not content or not content.strip():
        return content

    prompt = (
        "You are a writing assistant for a language learner's daily journal. "
        "Polish the following markdown journal entry to improve fluency, clarity, "
        "and organization while PRESERVING the original meaning, tone, structure, "
        "and all markdown formatting. "
        "Do NOT add new facts or change the content substantially. "
        "Keep the language natural — the user writes in Chinese and English mixed. "
        "Fix minor grammar issues and improve sentence flow. "
        "Return ONLY the polished markdown, no explanations."
    )

    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": content[:8000]},
    ]

    try:
        resp = chat(messages, max_tokens=4096)
        text = resp.get("text", "")
        return text.strip() if text else content
    except Exception:
        # Fallback: return original on error
        return content
