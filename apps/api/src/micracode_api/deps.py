"""Shared FastAPI dependencies.

The local-filesystem build has no auth. We expose the storage module as a
dependency so routers can be trivially swapped for a fake in tests.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from . import storage


def get_storage() -> storage.Storage:
    return storage.get_storage()


StorageDep = Annotated["storage.Storage", Depends(get_storage)]
