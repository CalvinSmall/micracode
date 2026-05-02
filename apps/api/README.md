# `micracode-api`

FastAPI backend with a custom codegen orchestrator. Streams `StreamEvent`s to the web app over SSE.

## Run

```bash
uv sync
uv run uvicorn micracode_api.main:app --reload --port 8000
```

## Test

```bash
uv run pytest
```

## Routes

- `GET  /v1/health` — liveness probe
- `GET  /v1/me`     — echoes the authenticated Supabase user (JWT-gated)
- `POST /v1/generate` — SSE stream of `StreamEvent` frames (JWT-gated)
