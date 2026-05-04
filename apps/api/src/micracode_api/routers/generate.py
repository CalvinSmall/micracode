"""`POST /v1/generate` — Vercel AI SDK UI Message Stream Protocol.

The wire format is documented at
https://v6.ai-sdk.dev/docs/ai-sdk-ui/stream-protocol. Each frame is a
standard SSE ``data:`` line whose payload is a JSON object describing a
single UI stream part. The stream ends with the literal ``data: [DONE]``
frame; clients also need the ``x-vercel-ai-ui-message-stream: v1``
response header so the AI SDK's ``DefaultChatTransport`` will parse the
response as a data stream.

Responsibilities on the local-filesystem build:

- persist the user's prompt to ``prompts.jsonl`` when the request lands;
- translate orchestrator :class:`StreamEvent` instances to AI SDK wire
  frames (file persistence happens in the orchestrator before each event
  is yielded);
- accumulate the assistant's text deltas and append the full reply to
  ``prompts.jsonl`` when the stream terminates.

The internal orchestrator still yields our Python :class:`StreamEvent`
instances; this router is the adapter that translates them to the AI
SDK wire format.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from collections.abc import AsyncIterator

import orjson
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from ..agents.orchestrator import run_codegen_stream
from ..deps import StorageDep
from ..schemas.stream import GenerateRequest
from ..storage import SLUG_RE, Storage

logger = logging.getLogger(__name__)

router = APIRouter()


def _frame(payload: dict) -> bytes:
    """Encode a single UI stream part as an SSE data frame."""
    return b"data: " + orjson.dumps(payload) + b"\n\n"


_DONE_FRAME = b"data: [DONE]\n\n"


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


async def _ui_message_stream(
    request: Request,
    payload: GenerateRequest,
    storage: Storage,
) -> AsyncIterator[bytes]:
    slug = payload.project_id
    assistant_buffer: list[str] = []
    snapshot_id: str | None = None
    cancelled = False

    try:
        prior_history = storage.read_prompts(slug)
    except Exception:
        logger.exception("failed to read prompt history for %s", slug)
        prior_history = []

    if not payload.retry:
        try:
            storage.append_prompt(slug, "user", payload.prompt)
        except Exception:
            logger.exception("failed to persist user prompt for %s", slug)

    message_id = _new_id("msg")
    text_id = _new_id("txt")
    text_started = False

    yield _frame({"type": "start", "messageId": message_id})
    yield _frame({"type": "start-step"})

    try:
        async for event in run_codegen_stream(
            project_id=slug,
            prompt=payload.prompt,
            history=prior_history,
            storage=storage,
            provider=payload.provider,
            model=payload.model,
        ):
            if await request.is_disconnected():
                logger.info("client disconnected — aborting stream")
                cancelled = True
                break

            if event.type == "message.delta":
                if not text_started:
                    text_started = True
                    yield _frame({"type": "text-start", "id": text_id})
                assistant_buffer.append(event.content)
                yield _frame(
                    {"type": "text-delta", "id": text_id, "delta": event.content}
                )
            elif event.type == "file.write":
                yield _frame(
                    {
                        "type": "data-file-write",
                        "id": event.path,
                        "data": {"path": event.path, "content": event.content},
                    }
                )
            elif event.type == "file.delete":
                yield _frame(
                    {
                        "type": "data-file-delete",
                        "id": event.path,
                        "data": {"path": event.path},
                    }
                )
            elif event.type == "status":
                if event.snapshot_id is not None:
                    snapshot_id = event.snapshot_id
                # Transient: don't persist in message.parts — consumed via onData.
                yield _frame(
                    {
                        "type": "data-status",
                        "data": {
                            "stage": event.stage,
                            "note": event.note,
                            "snapshot_id": event.snapshot_id,
                        },
                        "transient": True,
                    }
                )
            elif event.type == "shell.exec":
                yield _frame(
                    {
                        "type": "data-shell-exec",
                        "data": {"command": event.command, "cwd": event.cwd},
                    }
                )
            elif event.type == "error":
                yield _frame({"type": "error", "errorText": event.message})
    except asyncio.CancelledError:
        # Client aborted the fetch (e.g. useChat.stop()). Mark cancelled
        # so the finally block persists a truncated reply with a marker
        # instead of a plain partial, then re-raise so FastAPI can tear
        # the response down cleanly.
        cancelled = True
        raise
    except Exception as exc:
        logger.exception("codegen stream failed")
        yield _frame({"type": "error", "errorText": f"stream failed: {exc}"})
    finally:
        if text_started:
            yield _frame({"type": "text-end", "id": text_id})
        yield _frame({"type": "finish-step"})
        yield _frame({"type": "finish"})
        yield _DONE_FRAME

        reply = "".join(assistant_buffer).strip()
        # Only persist an assistant row when we actually produced text.
        # Empty replies (planner crashed, API key missing, etc.) stay
        # out of prompt history so retries don't accumulate noise.
        if reply:
            if cancelled:
                reply = f"{reply}\n\n_(generation cancelled)_"
            try:
                storage.append_prompt(
                    slug, "assistant", reply, snapshot_id=snapshot_id
                )
            except Exception:
                logger.exception("failed to persist assistant reply for %s", slug)


@router.post("/generate")
async def generate(
    payload: GenerateRequest,
    request: Request,
    storage: StorageDep,
) -> StreamingResponse:
    if not SLUG_RE.fullmatch(payload.project_id):
        raise HTTPException(status_code=400, detail="invalid project_id")
    if storage.get_project(payload.project_id) is None:
        raise HTTPException(status_code=404, detail="project not found")

    logger.info(
        "generate stream start project=%s prompt_len=%d",
        payload.project_id,
        len(payload.prompt),
    )
    return StreamingResponse(
        _ui_message_stream(request, payload, storage),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            # Required by the AI SDK `DefaultChatTransport` to parse the body
            # as a UI message stream rather than plain text.
            "x-vercel-ai-ui-message-stream": "v1",
        },
    )
