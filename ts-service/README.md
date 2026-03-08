# TalentFlow TypeScript Service

NestJS service for candidate document intake and asynchronous LLM-powered candidate summary generation.

## Implemented Workflow

- Upload candidate documents as extracted text.
- Request asynchronous summary generation through the queue module.
- Worker reads stored documents, calls a summarization provider abstraction, and persists a structured summary.
- Retrieve summaries by candidate and by summary id.

## API Endpoints

All candidate endpoints require fake auth headers:

- `x-user-id`
- `x-workspace-id`

Endpoints:

- `POST /candidates/:candidateId/documents`
- `POST /candidates/:candidateId/summaries/generate`
- `GET /candidates/:candidateId/summaries`
- `GET /candidates/:candidateId/summaries/:summaryId`

Starter utility endpoints retained:

- `GET /health`
- `POST /sample/candidates`
- `GET /sample/candidates`

## Prerequisites

- Node.js 22+
- npm
- PostgreSQL running from repository root:

```bash
docker compose up -d postgres
```

## Setup

```bash
cd ts-service
npm install
cp .env.example .env
```

## Environment

- `PORT`
- `DATABASE_URL`
- `NODE_ENV`
- `SUMMARY_PROVIDER` (`fake` default, use `gemini` for live LLM calls)
- `GEMINI_API_KEY` (required when `SUMMARY_PROVIDER=gemini`)

Do not commit API keys or secrets.

## Migrations

```bash
cd ts-service
npm run migration:run
```

Revert last migration:

```bash
cd ts-service
npm run migration:revert
```

## Run Service

```bash
cd ts-service
npm run start:dev
```

## Run Tests

```bash
cd ts-service
npm test
npm run test:e2e
```

## LLM Provider Notes

- Provider abstraction: `SummarizationProvider`.
- Implementations:
  - `FakeSummarizationProvider` (used by default for local/offline/test workflows)
  - `GeminiSummarizationProvider` (real API integration using Google Gemini)
- Gemini responses are requested as JSON and validated before saving. Invalid payloads move summaries to `failed` with `errorMessage`.

## Schema Overview

- `sample_workspaces`: recruiter workspace boundary
- `sample_candidates`: candidate identity and workspace ownership
- `candidate_documents`: uploaded document records
- `candidate_summaries`: async generation state + structured output

## Key Design Decisions

- Workspace access is enforced in service-layer candidate checks for every candidate-scoped endpoint.
- Summary generation happens only through queue jobs; controllers do not run provider calls directly.
- Status transitions are explicit: `pending` -> `completed` or `failed`.
- Worker sets provider metadata and captures failure details for traceability.

## Assumptions and Tradeoffs

- Candidate creation remains available via the starter sample endpoints.
- Queue implementation is in-memory and process-local (sufficient for assessment scope, not production scale).
- Documents are stored as text payloads with storage key metadata rather than binary file handling.
