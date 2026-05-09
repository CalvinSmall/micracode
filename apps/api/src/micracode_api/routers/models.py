"""`GET /v1/models` — model catalog for the chat UI picker.

Returns the set of provider+model pairs the server will accept, which
providers are actually usable (i.e. their API key is configured), and a
default selection derived from settings. API keys are never returned.
"""

from __future__ import annotations

from fastapi import APIRouter

from ..agents.model_catalog import list_catalog
from ..config import get_settings

router = APIRouter()


@router.get("/models")
async def models() -> dict:
    return await list_catalog(get_settings())
