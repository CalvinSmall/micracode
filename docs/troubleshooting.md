# Troubleshooting

If something doesn't work, start here. Most issues fall into a handful
of categories.

## "Port 3000 / 8000 is already in use"

Another process is bound to the port Micracode wants. Either stop
that process or change ports — see "Changing ports" in
[Configuration](./configuration.md).

Quick check on macOS / Linux:

```bash
lsof -i :3000
lsof -i :8000
```

## The web app loads but nothing happens when I submit a prompt

Almost always one of:

1. **The API isn't running.** Check the terminal you started `bun run
   dev` in for FastAPI logs. Re-run `bun run dev:api` on its own to
   see startup errors.
2. **`NEXT_PUBLIC_API_BASE_URL` doesn't match what the API is bound
   to.** The defaults are `http://localhost:8000` and `127.0.0.1:8000`
   respectively, which the browser treats as the same origin.
3. **CORS is blocking the request.** If you changed the web URL or
   port, set `APP_WEB_ORIGIN` on the API to the exact same origin
   (scheme + host + port, no trailing slash).
4. **No API key is configured.** See the next section.

Open the browser devtools network tab, find the failing request to
`/v1/...`, and look at the response — it usually says exactly what's
wrong.

## "Provider 'gemini' / 'openai' is selected but … is not configured on the server"

You picked a model in the chat composer for a provider whose key isn't
set on the server. Two options:

- Add the key to `apps/api/.env` (`GOOGLE_API_KEY=...` or
  `OPENAI_API_KEY=...`) and restart the API.
- Pick a model from a provider that *is* configured. The picker greys
  out unavailable providers — if both look greyed out, no keys are
  set.

Verify what the server thinks is available:

```bash
curl http://127.0.0.1:8000/v1/models
```

The `available: true/false` field per provider is the source of truth.

## "Unknown model 'X' for provider 'Y'"

The model ID isn't in the server's registry. Either pick one from
[Configuration → Supported model IDs](./configuration.md#supported-model-ids)
or add the new ID to
[`apps/api/src/micracode_api/agents/model_catalog.py`](../apps/api/src/micracode_api/agents/model_catalog.py)
and restart the API.

## Node version errors

If `bun install` or `bun run dev` complains about Node, you're on the
wrong version. From the repo root:

```bash
nvm use   # picks up .nvmrc -> 22.18.0
```

If `nvm` says it isn't installed, run `nvm install 22.18.0` first.

## `uv` not found / Python errors

`bun run api:install` and `bun run dev:api` both shell out to `uv`. If
`uv` is missing:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

…and reopen your shell so it's on `PATH`.

If `uv sync` fails on a Python version error, let `uv` install one:
`uv python install 3.12` then retry.

## "I changed `.env` but nothing changed"

The API only reads env vars at startup. Restart the FastAPI process
(stop `bun run dev` with Ctrl-C and start it again, or restart just
`bun run dev:api`).

For the web app, `NEXT_PUBLIC_*` vars are baked in at build/dev start —
also a restart.

## My project's files / chat are gone

Check the project folder still exists under `~/opener-apps/` (or
wherever you pointed `OPENER_APPS_DIR`). The workspace reads
everything from disk, so:

- Folder deleted/moved → project is gone from the UI too.
- `project.json` deleted or corrupted → the project won't load. Restore
  from a backup if you have one.
- `prompts.jsonl` deleted → source files are still fine, but chat
  history is lost. Future turns will work; they just start fresh.

## Browser preview shows COEP / cross-origin warnings

The web app sends strict cross-origin headers
(`Cross-Origin-Embedder-Policy: require-corp`,
`Cross-Origin-Opener-Policy: same-origin`) that the in-browser
sandbox needs.

If you're loading external images, fonts, or scripts in your generated
app and they fail, the upstream needs to send
`Cross-Origin-Resource-Policy: cross-origin` and you need
`crossOrigin="anonymous"` on the tag. For most third-party assets the
fix is to host them locally inside the project instead.

## Getting more info from the API

Bump the log level in `apps/api/.env`:

```ini
LOG_LEVEL=DEBUG
```

Then restart the API. You'll see every request and stream event in the
terminal.

## Still stuck?

Check the per-package READMEs ([apps/api](../apps/api/README.md)) and
the project's issue tracker on GitHub.
