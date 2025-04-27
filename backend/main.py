"""FastAPI entrypoint for the Yaseen backend."""

from __future__ import annotations

import asyncio
import re
import logging
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_429_TOO_MANY_REQUESTS

from backend.config import get_settings
from backend.llm import chat, moderate
from backend.models import ChatRequest, ChatResponse, Citation
from backend.retrieval import retrieve_context

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(debug=settings.FASTAPI_DEBUG, title="Yaseen API")

# For development use
# Note: Cannot use allow_origins=["*"] with allow_credentials=True
# The browser will reject this combination for security reasons
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Specific origin needed for credentials
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

_CITATION_RE = re.compile(r"\[\[(Q\s\d+:\d+|Bukhari[^\]]+|Muslim[^\]]+)\]\]")

def _extract_citations(text: str) -> List[Citation]:
    """Parse `[[Q 2:255]]` or `[[Bukhari 1/2]]` patterns into Citation objects."""

    matches = _CITATION_RE.findall(text)
    citations: List[Citation] = []
    for m in matches:
        if m.startswith("Q"):
            citations.append(Citation(type="quran", ref=m.split()[1]))
        else:
            citations.append(Citation(type="hadith", ref=m.strip()))
    return citations


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:  # noqa: D401  # simple endpoint
    """Main chat completion endpoint used by the front-end."""

    logger.info(f"Received chat request with query: '{payload.query}'")

    # 1️⃣ Safety: moderation check
    if await moderate(payload.query):
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Your question violates content policy. Please rephrase.",
        )

    # 2️⃣ Retrieve knowledge context
    context_chunks, sim_score = await retrieve_context(payload.query)

    # 3️⃣ Fallback when low similarity
    if sim_score < settings.CONFIDENCE_THRESHOLD:
        return ChatResponse(
            answer="I'm not sure about that. It may be best to consult a qualified scholar.",
            citations=[],
            confidence=sim_score,
        )

    # 4️⃣ Generate answer from LLM
    answer, model_conf = await chat(context_chunks, payload.query)

    # 5️⃣ Extract citations from answer text
    citations = _extract_citations(answer)

    # 6️⃣ Combine confidences (simple average for MVP)
    overall_conf = (sim_score + model_conf) / 2

    return ChatResponse(answer=answer, citations=citations, confidence=overall_conf) 