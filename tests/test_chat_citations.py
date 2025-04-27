import re
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

_CITATION_REGEX = re.compile(r"(Q \d+:\d+|Bukhari|Muslim)")


def test_chat_response_schema(monkeypatch):
    """Ensure /chat returns schema-compliant JSON and valid citations."""

    # Monkeypatch retrieval & llm to deterministic outputs
    async def _fake_retrieve(query: str):  # noqa: D401
        return ["Context"], 0.9

    async def _fake_chat(ctx, q):  # noqa: ANN001
        return "Answer [[Q 2:255]]", 0.9

    monkeypatch.setattr("backend.retrieval.retrieve_context", _fake_retrieve)
    monkeypatch.setattr("backend.llm.chat", _fake_chat)
    monkeypatch.setattr("backend.llm.moderate", lambda text: False)

    response = client.post("/chat", json={"query": "Who is Allah?"})
    assert response.status_code == 200

    data = response.json()
    assert 0 <= data["confidence"] <= 1
    assert _CITATION_REGEX.search(" ".join(c["ref"] for c in data["citations"])) 