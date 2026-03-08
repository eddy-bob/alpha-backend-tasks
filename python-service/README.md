# InsightOps Python Service

FastAPI service for the briefing report generator task.

## Prerequisites

- Python 3.12
- PostgreSQL running from repository root:

```bash
docker compose up -d postgres
```

## Setup

```bash
cd python-service
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

## Environment

`.env.example` includes:

- `DATABASE_URL`
- `APP_ENV`
- `APP_PORT`

## Run Migrations

Apply pending migrations:

```bash
cd python-service
source .venv/bin/activate
python -m app.db.run_migrations up
```

Roll back the latest migration:

```bash
cd python-service
source .venv/bin/activate
python -m app.db.run_migrations down --steps 1
```

## Run Service

```bash
cd python-service
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

## Run Tests

```bash
cd python-service
source .venv/bin/activate
python -m pytest
```

## Implemented Endpoints

- `POST /briefings`
- `GET /briefings/{id}`
- `POST /briefings/{id}/generate`
- `GET /briefings/{id}/html`

Also retained from starter:

- `GET /health`
- `POST /sample-items`
- `GET /sample-items`

## Project Layout

- `app/main.py`: FastAPI bootstrap and router wiring
- `app/config.py`: environment config
- `app/db/`: SQLAlchemy session management and migration runner
- `db/migrations/`: SQL migration files
- `app/models/`: ORM models
- `app/schemas/`: Pydantic request/response schemas
- `app/services/`: service-layer logic and report formatter
- `app/api/`: route handlers
- `app/templates/`: Jinja templates
- `tests/`: test suite
