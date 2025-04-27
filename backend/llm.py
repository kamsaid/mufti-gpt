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
openai.api_key = settings.OPENAI_API_KEY
_client = AsyncOpenAI()

SYSTEM_PROMPT = (
    "You are an AI scholar. Cite Qur'an and authentic ḥadith. If a question is "
    "disputed, list the main Sunni madhhabs briefly. If unsure, say you are "
    "unsure and suggest asking a qualified scholar. Never invent references."
)

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
    """Call GPT-4o with *context* and *user_query*.

    Returns `(answer, model_confidence)` where *model_confidence* is a naive
    proxy (currently fixed to 0.9; can be improved using logit probs when API
    supports it).  We keep it separate from retrieval similarity; upstream
    code will blend both.
    """

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": "\n".join(context)},
        {"role": "user", "content": user_query},
    ]

    response = await _client.chat.completions.create(
        model="gpt-4o-mini",  # cheaper dev model; can switch to gpt-4o in prod
        messages=messages,
        temperature=0.2,
        max_tokens=512,
    )

    answer = response.choices[0].message.content  # type: ignore[assignment]

    # TODO: When OpenAI exposes confidence; for now assume high if returned.
    model_confidence: float = 0.9
    return answer, model_confidence 