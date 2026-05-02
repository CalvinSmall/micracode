"""Structured LLM output for the codegen orchestrator.

The model emits a :class:`PatchBundle` describing per-file operations. This
lets follow-up turns produce small search-and-replace edits rather than
re-emitting whole files, which is cheaper and higher fidelity for iterative
UI tweaks. New files still use ``create`` (full content).
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

MAX_CODEGEN_FILES = 10
MAX_FILE_CONTENT_CHARS = 80_000
MAX_PATH_CHARS = 512
MAX_SEARCH_REPLACE_CHARS = 8_000
MAX_EDITS_PER_FILE = 20

Operation = Literal["create", "replace", "edit", "delete"]


class SearchReplace(BaseModel):
    """One search-and-replace op applied to an existing file.

    ``search`` must appear EXACTLY ONCE in the current file contents. The
    replacement is literal (no regex). The orchestrator runs ops sequentially
    on the buffer so later ops can depend on earlier ones.
    """

    model_config = ConfigDict(extra="forbid")

    search: str = Field(
        min_length=1,
        max_length=MAX_SEARCH_REPLACE_CHARS,
        description=(
            "Exact substring (whitespace-significant) of the existing file. "
            "Must occur exactly once; otherwise the edit is rejected."
        ),
    )
    replace: str = Field(
        max_length=MAX_SEARCH_REPLACE_CHARS,
        description="Text that replaces ``search``. May be empty to delete.",
    )


class PatchFile(BaseModel):
    """One file-level operation in a :class:`PatchBundle`.

    Operation semantics:
      * ``create`` — file does not exist yet; ``content`` is written as-is.
      * ``replace`` — overwrite an existing file with ``content``.
      * ``edit`` — apply ``edits`` sequentially to the current file contents.
      * ``delete`` — remove the file; no ``content`` or ``edits``.
    """

    model_config = ConfigDict(extra="forbid")

    path: str = Field(
        max_length=MAX_PATH_CHARS,
        description="Relative path under the project root (POSIX, no '..').",
    )
    operation: Operation = Field(
        description="File-level op. Use 'edit' for small changes to existing files.",
    )
    content: str | None = Field(
        default=None,
        max_length=MAX_FILE_CONTENT_CHARS,
        description="Full file contents for 'create' / 'replace'. Forbidden otherwise.",
    )
    edits: list[SearchReplace] | None = Field(
        default=None,
        max_length=MAX_EDITS_PER_FILE,
        description="Sequential search/replace ops for 'edit'. Forbidden otherwise.",
    )

    @model_validator(mode="after")
    def _check_operation_fields(self) -> PatchFile:
        op = self.operation
        if op in ("create", "replace"):
            if self.content is None:
                raise ValueError(f"operation={op!r} requires 'content'")
            if self.edits is not None:
                raise ValueError(f"operation={op!r} forbids 'edits'")
        elif op == "edit":
            if not self.edits:
                raise ValueError("operation='edit' requires non-empty 'edits'")
            if self.content is not None:
                raise ValueError("operation='edit' forbids 'content'")
        elif op == "delete":
            if self.content is not None or self.edits is not None:
                raise ValueError("operation='delete' forbids 'content' and 'edits'")
        return self


class PatchBundle(BaseModel):
    """Batch of per-file operations produced by the codegen LLM."""

    model_config = ConfigDict(extra="forbid")

    files: list[PatchFile] = Field(
        max_length=MAX_CODEGEN_FILES,
        description=(
            "Files to create, replace, edit, or delete. Use 'replace' when "
            "rewriting a placeholder scaffold or most of a file; use 'edit' "
            "only for surgical tweaks whose search strings exist verbatim in "
            "the file body shown in context."
        ),
    )
