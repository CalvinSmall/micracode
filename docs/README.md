# Micracode — User Documentation

Micracode is an open-source, AI-powered web app builder that runs
entirely on your laptop. You describe an app in natural language, and it
streams code into a workspace where you can chat to iterate, edit files
directly, and (in later phases) preview the result live.

This folder contains everything you need to install, configure, and use
the app. Start with [Getting Started](./getting-started.md).

## Table of contents

1. [Getting Started](./getting-started.md) — install prerequisites and run the app for the first time.
2. [Configuration](./configuration.md) — environment variables, API keys, and switching LLM providers.
3. [Using the Workspace](./usage.md) — the home page, three-panel workspace, chat, editor, and preview.
4. [Projects on Disk](./projects-on-disk.md) — where your generated apps live and what's inside them.
5. [Troubleshooting](./troubleshooting.md) — common errors and how to fix them.
6. [FAQ](./faq.md) — short answers to common questions.

## At a glance

- **Local-first.** No database, no auth, no cloud. Everything lives
  under `~/opener-apps/` on your machine.
- **Bring your own key.** Works with Google Gemini (default) or
  OpenAI. Keys stay on the server you're running.
- **Two processes.** A Next.js web UI on `http://localhost:3000` and a
  FastAPI service bound to `127.0.0.1:8000`. `bun run dev` starts both.

If you're a contributor looking for architecture or code-level docs, see
the per-package READMEs under [`apps/web`](../apps/web),
[`apps/api`](../apps/api), and [`packages/shared`](../packages/shared).
