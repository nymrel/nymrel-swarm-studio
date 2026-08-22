"""Storage protocol and deterministic in-memory implementation."""

from __future__ import annotations

import copy
import threading
from typing import Protocol

from .models import RunState


class ConcurrentMutationError(RuntimeError):
    """The caller attempted to overwrite a newer run revision."""


class RunStore(Protocol):
    def create(self, run: RunState) -> None: ...

    def get(self, run_id: str) -> RunState | None: ...

    def put(self, run: RunState) -> None: ...

    def list_run_ids(self) -> list[str]: ...


class InMemoryRunStore:
    """Thread-safe test/demo store with optimistic revision checks."""

    def __init__(self) -> None:
        self._runs: dict[str, RunState] = {}
        self._lock = threading.RLock()

    def create(self, run: RunState) -> None:
        with self._lock:
            if run.run_id in self._runs:
                raise ValueError(f"run already exists: {run.run_id}")
            if run.revision != 0:
                raise ValueError("new runs must start at revision 0")
            self._runs[run.run_id] = copy.deepcopy(run)

    def get(self, run_id: str) -> RunState | None:
        with self._lock:
            run = self._runs.get(run_id)
            return copy.deepcopy(run) if run is not None else None

    def put(self, run: RunState) -> None:
        with self._lock:
            stored = self._runs.get(run.run_id)
            if stored is None:
                raise KeyError(f"unknown run: {run.run_id}")
            if stored.revision != run.revision:
                raise ConcurrentMutationError(
                    f"stale run revision: expected {stored.revision}, got {run.revision}"
                )
            run.revision += 1
            self._runs[run.run_id] = copy.deepcopy(run)

    def list_run_ids(self) -> list[str]:
        with self._lock:
            return sorted(self._runs)
