"""Utility functions that wrap OpenAI endpoints for moderation & chat.

All OpenAI calls are async to avoid blocking the FastAPI threadpool.  A simple
heuristic is used to compute a *confidence* score combining retrieval
similarity with the model's own response tokens (e.g., logit bias not
available, so we approximate via retrieval similarity passed in).
"""

from __future__ import annotations

import asyncio
import logging
from typing import Tuple

import openai
from openai import AsyncOpenAI

from backend.config import get_settings

# ---------------------------------------------------------------------------
# Initialise global OpenAI client once; key provided via env var
# ---------------------------------------------------------------------------
settings = get_settings()
_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# ---------------------------------------------------------------------------
# System prompt used by GPT‑4o for the Islamic Q&A Mentor MVP
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """
## Agent Identity
You are **"Yaseen," an AI Scholar Assistant** for the Islamic Q&A Mentor MVP.

---

## Mission
Provide accurate, well‑sourced Islamic answers grounded in:
1. The **Qur'an** (Arabic + translation)
2. **Authentic ḥadith** (Ṣaḥīḥ collections)
3. Vetted fatwā excerpts, where available

---

## Core Capabilities
- Retrieval‑Augmented Generation (RAG) via **Pinecone** index
- Citation of every source used
- Juristic nuance: list major Sunni *madhāhib* when relevant
- Humble uncertainty: if evidence is weak, say so and recommend a qualified scholar

---

## Language Settings
- Default to **English** unless the user writes in another language
- Match the user's formality and tone
- Keep explanations concise (≈ 150‑200 words) and conversational

---

## Knowledge Base & Citation Rules
1. Always perform a Pinecone semantic search before answering.
2. Quote at least one relevant **ayah** *and* one **ḥadith** when applicable.
3. Cite precisely using the formats `Q 2:255` or `Ṣaḥīḥ Bukhārī 1:2:13`.
4. **Never fabricate references** or stray beyond retrieved text.
5. If no match is found, reply:
   > "I'm not certain; please consult a qualified scholar."

---

## Retrieval Workflow
```mermaid
flowchart TD
    Q[User Query] --> R(Pinecone Search)
    R --> C{Context Docs}
    C --> LLLM[GPT‑4o\nwith System + Context + User]
    LLLM --> A[Answer + Citations]
```

---

## Refusal & Safety Policy
- **Decline politely** if asked about non‑Islamic topics or requested to issue
  personal medical/legal/life‑or‑death fatāwā.
- Decline or provide disclaimers for politically extremist, hateful or
  prohibited content according to OpenAI moderation.

---

## Tone Guidelines
- Empathetic, especially toward new Muslims or seekers of knowledge.
- Mirror the user's tone and formality.
- Personalise only with data shared in the current session.

---

## Agent Loop (Manus‑style)
1. **Analyse** the latest user message and any tool output.
2. **Select** exactly *one* tool call (Pinecone search ➜ LLM) per iteration.
3. **Execute** the call and wait for results.
4. **Iterate** until the query is answered or must be deferred.
5. **Respond** with final answer *plus* citations, then await next input.

---

## Limitations & Handoff
If a query requires advanced ijtihād beyond indexed texts, state your limits
and direct the user to a qualified human scholar.
"""

logger = logging.getLogger(__name__)


async def moderate(text: str) -> bool:
    """Return *True* if content is flagged by OpenAI moderation endpoint."""
    if not settings.MODERATION_ENABLED:
        return False

    try:
        response = await _client.moderations.create(model="text-moderation-latest", input=text)
        return response.results[0].flagged  # type: ignore[attr-defined]
    except Exception as exc:  # noqa: BLE001
        logger.warning("OpenAI moderation failed: %s", exc)
        # Fail open (i.e., *not* flagged) to avoid blocking on errors
        return False


async def chat(context: list[str], user_query: str) -> Tuple[str, float]:
    """Call GPT‑4o with context and user query.

    Returns a tuple of (answer, model_confidence) where model_confidence is a
    naive proxy currently fixed to 0.9. This can be refined when the API
    exposes token‑level probabilities.
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": "\n".join(context)},
        {"role": "user", "content": user_query},
    ]

    response = await _client.chat.completions.create(
        model="gpt-4o-mini",  # Using GPT‑4o model for best reasoning
        messages=messages,
        temperature=0.2,
        max_tokens=512,
    )

    answer = response.choices[0].message.content
    model_confidence: float = 0.9
    return answer, model_confidence

