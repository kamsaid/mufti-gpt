 # Yaseen Chat

 **A chat application with citations using FastAPI and React**

 ## Overview
 This project consists of:
 - A FastAPI backend (`/backend`) providing a `/chat` endpoint that leverages OpenAI and Pinecone for retrieval-augmented generation.
 - A Vite + React + Tailwind CSS frontend (`/frontend`) serving a single-page chat interface.
 - A data ingestion script (`/scripts/ingest.py`) to load documents into the vector store.
 - Docker and Docker Compose setup for easy local development.

 ## Prerequisites
 - Python 3.10+
 - Node.js 16+
 - Docker & Docker Compose (optional, for containerized setup)

 ## Setup
 1. Clone this repository:
    ```bash
    git clone <repo-url>
    cd <repo-root>
    ```
 2. Environment variables:
    ```bash
    cp .env.example .env
    # Edit .env and fill in your OpenAI and Pinecone keys
    ```
 3. Data ingestion (optional):
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    # Adjust scripts/ingest.py arguments as needed
    python scripts/ingest.py
    ```
 4. Run services via Docker Compose (recommended):
    ```bash
    docker-compose up --build
    ```
    - Backend will be at http://localhost:8000
    - Frontend will be at http://localhost:3000

 Alternatively, run services locally:
 - **Backend**:
   ```bash
   cd backend
   pip install -r ../requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
 - **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

 ## Testing & Linting
 - Run backend tests: `pytest -q`
 - Frontend: consider adding Jest/RTL for component tests.
 - Linting (backend): `pre-commit run --all-files` (if configured)

 ## Usage
 - Open your browser to http://localhost:3000 (frontend) and start chatting.

 ## Configuration
 See [`.env.example`](./.env.example) for all available environment variables.