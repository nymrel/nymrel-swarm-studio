"""Firestore-backed Relay run store with optimistic transactions."""

from __future__ import annotations

import copy
from typing import Any

from relay_core.models import RunState
from relay_core.serde import run_from_document, run_to_document
from relay_core.store import ConcurrentMutationError


class FirestoreRunStore:
    def __init__(
        self,
        *,
        project: str | None = None,
        collection: str = "nymrel_relay_runs",
        client: Any | None = None,
    ) -> None:
        if not collection.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Firestore collection contains unsupported characters")
        try:
            from google.cloud import firestore
        except ImportError as exc:  # pragma: no cover - requires Google dependency
            raise RuntimeError(
                "google-cloud-firestore is required for FirestoreRunStore"
            ) from exc
        self._firestore = firestore
        self._client = client or firestore.Client(project=project)
        self._collection = self._client.collection(collection)

    def create(self, run: RunState) -> None:
        if run.revision != 0:
            raise ValueError("new runs must start at revision 0")
        self._collection.document(run.run_id).create(run_to_document(run))

    def get(self, run_id: str) -> RunState | None:
        snapshot = self._collection.document(run_id).get()
        if not snapshot.exists:
            return None
        document = snapshot.to_dict()
        if not isinstance(document, dict):
            raise ValueError("Firestore run document must be an object")
        return run_from_document(document)

    def put(self, run: RunState) -> None:
        document_ref = self._collection.document(run.run_id)
        transaction = self._client.transaction()
        next_run = copy.deepcopy(run)
        next_run.revision += 1

        @self._firestore.transactional
        def apply(transaction: Any) -> int:
            snapshot = document_ref.get(transaction=transaction)
            if not snapshot.exists:
                raise KeyError(f"unknown run: {run.run_id}")
            stored_document = snapshot.to_dict()
            if not isinstance(stored_document, dict):
                raise ValueError("Firestore run document must be an object")
            stored = run_from_document(stored_document)
            if stored.revision != run.revision:
                raise ConcurrentMutationError(
                    f"stale run revision: expected {stored.revision}, got {run.revision}"
                )
            transaction.set(document_ref, run_to_document(next_run))
            return next_run.revision

        run.revision = apply(transaction)

    def list_run_ids(self) -> list[str]:
        return sorted(snapshot.id for snapshot in self._collection.stream())
