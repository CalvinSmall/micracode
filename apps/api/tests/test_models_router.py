"""HTTP tests for ``GET /v1/models``."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from micracode_api.config import get_settings


def test_models_endpoint_returns_catalog(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-x")
    monkeypatch.setenv("OPENAI_MODEL", "gpt-5.4")
    monkeypatch.setenv("GOOGLE_API_KEY", "")
    get_settings.cache_clear()
    try:
        response = client.get("/v1/models")
    finally:
        get_settings.cache_clear()

    assert response.status_code == 200
    body = response.json()
    providers = {p["id"]: p for p in body["providers"]}
    assert providers["openai"]["available"] is True
    assert providers["gemini"]["available"] is False
    assert body["default"] == {"provider": "openai", "model": "gpt-5.4"}
    # Every model entry carries an id + human label.
    for provider in body["providers"]:
        for model in provider["models"]:
            assert {"id", "label"} <= model.keys()
