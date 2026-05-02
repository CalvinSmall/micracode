# Micracode

An open-source, AI-powered web application builder. Describe an app in
natural language and Micracode streams code into an in-browser
workspace, where you can iterate by chat or edit the code directly in a
Monaco editor. Everything runs on your laptop — there's no database,
no auth, and no cloud service.

> **Status:** Foundation phase. The monorepo, local filesystem storage,
> streaming backend contract, and the three-panel frontend shell are in
> place. The WebContainer sandbox and full AI codegen are delivered in
> later phases.

## Documentation

End-user docs live in [`docs/`](./docs/README.md):

- **[Getting Started](./docs/getting-started.md)** — install
  prerequisites, configure an API key, and run the app.
- **[Configuration](./docs/configuration.md)** — environment variables,
  switching between OpenAI and Gemini, and the supported model IDs.
- **[Using the Workspace](./docs/usage.md)** — the home page, chat,
  editor, and preview panels.
- **[Projects on Disk](./docs/projects-on-disk.md)** — where your
  generated apps live and how to work with them outside the app.
- **[Troubleshooting](./docs/troubleshooting.md)** — common errors and
  how to fix them.
- **[FAQ](./docs/faq.md)** — short answers to common questions.

## Quickstart

```bash
nvm use                      # picks up .nvmrc -> Node 22.18.0
bun install                  # JS workspaces (web + shared)
bun run api:install          # Python deps for the API

cp .env.example apps/api/.env
$EDITOR apps/api/.env        # set GOOGLE_API_KEY (default) or OpenAI

bun run dev                  # web on :3000, API on 127.0.0.1:8000
```

Open <http://localhost:3000>, type a project description into the
prompt box, and you're off. Full walkthrough in
[Getting Started](./docs/getting-started.md).

## Repository layout

```
micracode/
├─ apps/
│  ├─ web/        Next.js 15 (App Router, TS, Tailwind, shadcn/ui, Zustand)
│  └─ api/        FastAPI + custom codegen orchestrator (uv-managed)
├─ packages/
│  └─ shared/     Shared TypeScript types (stream event contract)
└─ docs/          End-user documentation
```

For per-package details see [`apps/web`](./apps/web),
[`apps/api`](./apps/api), and [`packages/shared`](./packages/shared).

## Useful scripts

```bash
bun run dev           # web + api in parallel
bun run dev:web       # Next.js only
bun run dev:api       # FastAPI only (uvicorn --reload, 127.0.0.1:8000)
bun run typecheck     # TS across all workspaces
bun run lint          # eslint across workspaces
bun run format        # prettier
bun run test:api      # pytest (storage + HTTP tests)
bun run api:lint      # ruff check
bun run api:format    # ruff format
```

## License

MIT (placeholder — add a `LICENSE` file before first release).
