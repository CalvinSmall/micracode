"""Pydantic mirror of ``packages/shared/src/stream-events.ts``.

Any change here MUST be mirrored in the TypeScript source of truth to keep
the SSE contract in sync.
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field


class _Event(BaseModel):
    """Base event with strict, extras-forbidden config."""

    model_config = ConfigDict(extra="forbid", frozen=True)


class MessageDeltaEvent(_Event):
    type: Literal["message.delta"] = "message.delta"
    content: str


class FileWriteEvent(_Event):
    type: Literal["file.write"] = "file.write"
    path: str
    content: str


class FileDeleteEvent(_Event):
    type: Literal["file.delete"] = "file.delete"
    path: str


class ShellExecEvent(_Event):
    type: Literal["shell.exec"] = "shell.exec"
    command: str
    cwd: str | None = None


class StatusEvent(_Event):
    type: Literal["status"] = "status"
    stage: Literal["planning", "generating", "done", "cancelled"]
    note: str | None = None
    # Populated on the ``generating`` stage to attach the pre-turn
    # snapshot id to the assistant's message so the UI can offer a
    # "revert to before this message" action.
    snapshot_id: str | None = None


class ErrorEvent(_Event):
    type: Literal["error"] = "error"
    message: str
    recoverable: bool = False


StreamEvent = Annotated[
    MessageDeltaEvent
    | FileWriteEvent
    | FileDeleteEvent
    | ShellExecEvent
    | StatusEvent
    | ErrorEvent,
    Field(discriminator="type"),
]


class GenerateRequest(BaseModel):
    """Request body for ``POST /v1/generate``."""

    model_config = ConfigDict(extra="forbid")

    project_id: str = Field(min_length=1, max_length=128)
    prompt: str = Field(min_length=1, max_length=16000)
    history: list[dict[str, str]] | None = None
    # When true, the caller is retrying the previous turn; the prompt is
    # already present in ``prompts.jsonl`` so we skip the append to avoid
    # duplicates. The assistant row (if any) should already have been
    # popped via ``POST /v1/projects/{id}/prompts/pop-assistant``.
    retry: bool = False
    # Per-request model selection. Both fields must be supplied together,
    # or both omitted (to fall back to the server default). The registry
    # in ``agents/model_catalog.py`` is the source of truth for allowed
    # combinations; ``GET /v1/models`` exposes it to the UI.
    provider: Literal["openai", "gemini"] | None = None
    model: str | None = Field(default=None, max_length=128)
