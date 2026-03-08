# Backend Engineering Assessment

This repository contains two standalone services:

- `python-service/` (FastAPI + SQLAlchemy + Jinja2)
- `ts-service/` (NestJS + TypeORM)

## Prerequisites

- Docker
- Python 3.12
- Node.js 22+
- npm

## Start Postgres

From repository root:

```bash
docker compose up -d postgres
```

This starts PostgreSQL on `localhost:5432` with:

- database: `assessment_db`
- user: `assessment_user`
- password: `assessment_pass`

## Setup Instructions

### Python service

```bash
cd python-service
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

### TypeScript service

```bash
cd ts-service
npm install
cp .env.example .env
```

## Run Both Services

### Python service

```bash
cd python-service
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

### TypeScript service

```bash
cd ts-service
npm run start:dev
```

## Run Migrations

### Python service

```bash
cd python-service
source .venv/bin/activate
python -m app.db.run_migrations up
```

### TypeScript service

```bash
cd ts-service
npm run migration:run
```

## Run Tests

### Python service

```bash
cd python-service
source .venv/bin/activate
python -m pytest
```

### TypeScript service

```bash
cd ts-service
npm test
npm run test:e2e
```

## Design Decisions

### Python service

- Briefing data is modeled relationally in `briefings`, `briefing_points`, and `briefing_metrics`, with points split by `point_type` and metrics constrained for per-briefing uniqueness.
- Validation is handled in Pydantic request schemas to keep route handlers thin and keep rules centralized.
- HTML generation is server-side through Jinja2 templates to preserve separation between data transformation and presentation.
- A service layer assembles report view models, sorts display-order records, and formats report metadata before rendering.

### TypeScript service

- Candidate documents and summaries are modeled as relational tables linked to starter candidates, with workspace boundaries inherited from candidate ownership.
- Summary generation is asynchronous via queue job enqueueing from API and processing in a worker.
- LLM integration is behind a provider interface with fake and Gemini implementations to keep runtime pluggable and tests deterministic.
- Worker persists explicit status transitions (`pending` to `completed` / `failed`) and stores provider + error metadata.

## Schema Decisions

### Python service

- `briefings` stores primary report identity and generated artifact state (`report_html`, `generated_at`).
- `briefing_points` stores both key points and risks with explicit `display_order` and `point_type`.
- `briefing_metrics` is optional per briefing and uses a unique `(briefing_id, name)` constraint.

### TypeScript service

- `candidate_documents` stores document metadata (`document_type`, `file_name`, `storage_key`) and raw extracted text.
- `candidate_summaries` stores async generation state and structured fields (`score`, `strengths`, `concerns`, `recommended_decision`) with timestamps and failure message support.
- Candidate access control is enforced through `sample_candidates.workspace_id` matching authenticated workspace id.

## Assumptions and Tradeoffs

### Python service

- Metric uniqueness is treated case-insensitively in API validation.
- Report HTML is persisted on generation for deterministic retrieval and simpler read performance.
- The generated endpoint is idempotent in behavior and will regenerate the HTML with a fresh timestamp.
- Styling is intentionally lightweight, semantic, and backend-owned per task scope.

### TypeScript service

- Queue implementation is in-memory/process-local for simplicity.
- Candidate creation remains in starter sample endpoints and is reused by Part B flows.
- `SUMMARY_PROVIDER` defaults to `fake`; `gemini` provider requires `GEMINI_API_KEY` for live API calls.

## Improvements With More Time

- Add richer integration tests against PostgreSQL in CI.
- Add stricter DB-level check constraints for allowed `point_type` values.
- Add pagination/listing endpoints and analyst/workspace ownership controls.
- Add API versioning and richer observability around generation events.
- Replace in-memory queue with durable broker-backed workers and retry policy.
- Add per-workspace candidate CRUD endpoints instead of relying on starter sample module.
