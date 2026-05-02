"""Select the slice of a project that the LLM should see for one turn.

The orchestrator calls :func:`load_context` once per request. It returns a
:class:`ProjectContext` containing:

  * ``tree_summary`` — newline-separated ``path (size)`` listing, used in the
    system/user prompt so the model knows which files exist.
  * ``files`` — a pre-loaded dict of file contents the model most likely
    needs, capped at :data:`CONTEXT_CHAR_BUDGET` total characters.
  * ``loader`` — a callable the patcher can use to read any other file on
    demand (e.g. when the model decides to edit something we didn't guess).

This is the single place to iterate on context quality; the loop does not
care how files are chosen.
"""

from __future__ import annotations

from typing import Any

from ..starter.next_default import NEXT_STARTER_FILES
from ..storage import Storage, safe_join
from .patcher import FileLoader, ProjectContext

CONTEXT_CHAR_BUDGET = 40_000
ALWAYS_LOAD = ("app/page.tsx", "app/layout.tsx", "app/globals.css")
MAX_TREE_ENTRIES = 400

# Paths in the default Next.js scaffold we treat as disposable placeholders
# when they still hold their original contents. Full-file replacement of
# these is safer than targeted edits because the bodies are tiny.
_PLACEHOLDER_CANDIDATES = ("app/page.tsx", "app/layout.tsx", "app/globals.css")


def _flatten(tree: dict[str, Any], prefix: str = "") -> list[tuple[str, int]]:
    """Walk a WebContainer-shaped tree into ``[(path, size_chars), ...]``."""
    out: list[tuple[str, int]] = []
    for name, node in tree.items():
        path = f"{prefix}{name}" if not prefix else f"{prefix}/{name}"
        if "directory" in node:
            out.extend(_flatten(node["directory"], path))
        elif "file" in node:
            contents = node["file"].get("contents", "")
            size = len(contents) if isinstance(contents, str) else 0
            out.append((path, size))
    return out


def _read_from_tree(tree: dict[str, Any], path: str) -> str | None:
    """Retrieve file contents previously flattened out of the tree."""
    parts = path.split("/")
    node: Any = tree
    for i, part in enumerate(parts):
        if not isinstance(node, dict):
            return None
        is_last = i == len(parts) - 1
        if is_last:
            leaf = node.get(part)
            if isinstance(leaf, dict) and "file" in leaf:
                contents = leaf["file"].get("contents")
                return contents if isinstance(contents, str) else None
            return None
        nxt = node.get(part)
        if isinstance(nxt, dict) and "directory" in nxt:
            node = nxt["directory"]
        else:
            return None
    return None


def _mentioned_paths(prompt: str, candidates: list[str]) -> list[str]:
    """Paths the user named literally in their prompt.

    Simple substring match on the full relative path and on the basename.
    """
    hits: list[str] = []
    for path in candidates:
        base = path.rsplit("/", 1)[-1]
        if path in prompt or (len(base) > 3 and base in prompt):
            hits.append(path)
    return hits


def _build_loader(storage: Storage, project_id: str) -> FileLoader:
    """Create a :class:`FileLoader` that reads text files from disk safely."""
    root = storage.project_dir(project_id)

    def _load(path: str) -> str | None:
        try:
            full = safe_join(root, path)
        except ValueError:
            return None
        if not full.is_file():
            return None
        try:
            return full.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            return None

    return _load


def load_context(
    storage: Storage,
    project_id: str,
    prompt: str,
) -> ProjectContext:
    """Build a :class:`ProjectContext` for the current request.

    Never raises for a missing project — an empty context is returned so the
    orchestrator can still produce ``create`` ops for a brand-new tree.
    """
    try:
        tree = storage.read_tree(project_id)
    except FileNotFoundError:
        tree = {}

    flat = _flatten(tree)
    flat.sort(key=lambda row: row[0])
    summary_lines = [f"{p} ({s})" for p, s in flat[:MAX_TREE_ENTRIES]]
    if len(flat) > MAX_TREE_ENTRIES:
        summary_lines.append(f"... ({len(flat) - MAX_TREE_ENTRIES} more files)")
    tree_summary = "\n".join(summary_lines)

    candidate_paths = [p for p, _ in flat]
    wanted = list(dict.fromkeys(  # preserve order, dedupe
        [p for p in ALWAYS_LOAD if p in candidate_paths]
        + _mentioned_paths(prompt, candidate_paths)
    ))

    files: dict[str, str] = {}
    budget = CONTEXT_CHAR_BUDGET
    for path in wanted:
        if budget <= 0:
            break
        content = _read_from_tree(tree, path)
        if content is None:
            continue
        if len(content) > budget:
            continue
        files[path] = content
        budget -= len(content)

    placeholders = frozenset(
        path
        for path in _PLACEHOLDER_CANDIDATES
        if path in files and files[path] == NEXT_STARTER_FILES.get(path)
    )

    return ProjectContext(
        project_id=project_id,
        tree_summary=tree_summary,
        files=files,
        loader=_build_loader(storage, project_id),
        placeholder_files=placeholders,
    )
