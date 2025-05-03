"""Light-weight wrapper around LangChain + Pinecone to retrieve top-k context
for a given user query.  Isolated into its own module for easier testing and
potential swapping of vector DB or embedding model in the future.
"""

from __future__ import annotations

import logging
from typing import List, Tuple

from pinecone import Pinecone  # type: ignore
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

from backend.config import get_settings

# Set up logging
logger = logging.getLogger(__name__)

async def retrieve_context(query: str, k: int = 5) -> Tuple[List[str], float]:
    """Embed *query* and fetch the *k* most similar chunks from Pinecone.

    Returns a tuple `(contents, max_similarity)` where:
      *contents*         list of plain text strings representing the retrieved
                         knowledge chunks (Qur'an ayāt or ahadith).
      *max_similarity*   the cosine similarity score of the top match; used as
                         a crude confidence proxy upstream.
    """

    settings = get_settings()

    # Lazily create Pinecone instance
    pc: Pinecone = getattr(retrieve_context, "_pc", None)  # type: ignore[assignment]
    if pc is None:
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        retrieve_context._pc = pc  # type: ignore[attr-defined]

    # Ensure index exists
    if settings.PINECONE_INDEX_NAME not in pc.list_indexes().names():  # pragma: no cover
        raise RuntimeError(
            f"Pinecone index '{settings.PINECONE_INDEX_NAME}' not found. Did you run the ingestion script?"
        )

    # Build embedding model; LANGCHAIN caches based on API key in env
    embed_model = OpenAIEmbeddings()

    # Obtain index object
    index = pc.Index(settings.PINECONE_INDEX_NAME)

    # Log index stats for debugging
    try:
        stats = index.describe_index_stats()
        logger.info(f"Pinecone index '{settings.PINECONE_INDEX_NAME}' stats: {stats}")
    except Exception as e:
        logger.error(f"Failed to get Pinecone index stats: {e}")

    # Wrap existing Pinecone index with LangChain vector store
    vector_store = PineconeVectorStore(
        index_name=settings.PINECONE_INDEX_NAME,
        embedding=embed_model,
        text_key="text"
    )

    # LangChain returns list[Document] with .page_content and .metadata
    docs_with_score = vector_store.similarity_search_with_score(query, k=k)

    logger.info(f"Retrieval query: '{query}'")
    logger.info(f"Docs with scores (raw): {docs_with_score}")

    if not docs_with_score:
        return [], 0.0

    contents, scores = zip(*[(doc.page_content, score) for doc, score in docs_with_score])

    # Scores from similarity_search_with_score are already cosine similarities (higher is better)
    max_sim = max(scores) if scores else 0.0

    logger.info(f"Retrieved scores (cosine similarity): {scores}")
    logger.info(f"Max similarity: {max_sim}")

    return list(contents), max_sim 