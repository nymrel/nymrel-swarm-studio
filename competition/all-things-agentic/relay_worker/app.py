"""Authenticated Cloud Run push worker for Relay Pub/Sub messages."""

from __future__ import annotations

import base64
import json
import os
import threading
from typing import Any

from fastapi import FastAPI, HTTPException, Request

from relay_core import ConcurrentMutationError, RelayEngine, StepStatus, to_json_dict
from relay_google import DispatchEnvelope, FirestoreRunStore
from relay_worker.handlers import execute_step

_MAX_REQUEST_BYTES = 32 * 1024
_STORE: FirestoreRunStore | None = None
_STORE_LOCK = threading.Lock()

app = FastAPI(title="Nymrel Relay Worker", version="0.1.0")


def _store() -> FirestoreRunStore:
    global _STORE
    if _STORE is not None:
        return _STORE
    with _STORE_LOCK:
        if _STORE is None:
            _STORE = FirestoreRunStore(
                project=os.getenv("GOOGLE_CLOUD_PROJECT"),
                collection=os.getenv(
                    "RELAY_FIRESTORE_COLLECTION", "nymrel_relay_runs"
                ),
            )
        return _STORE


def _reject_duplicate_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    document: dict[str, Any] = {}
    for key, value in pairs:
        if key in document:
            raise ValueError(f"duplicate JSON key: {key}")
        document[key] = value
    return document


def _load_json(data: bytes) -> Any:
    try:
        return json.loads(data.decode("utf-8"), object_pairs_hook=_reject_duplicate_pairs)
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        raise ValueError("request contains invalid strict JSON") from exc


def _decode_push(document: Any) -> DispatchEnvelope:
    if not isinstance(document, dict):
        raise ValueError("request root must be an object")

    payload: Any
    if "message" in document:
        message = document.get("message")
        if not isinstance(message, dict):
            raise ValueError("message must be an object")
        encoded = message.get("data")
        if not isinstance(encoded, str):
            raise ValueError("message.data must be base64 text")
        try:
            raw = base64.b64decode(encoded, validate=True)
        except (ValueError, TypeError) as exc:
            raise ValueError("message.data is not valid base64") from exc
        payload = _load_json(raw)
    else:
        payload = document

    if not isinstance(payload, dict):
        raise ValueError("dispatch payload must be an object")
    expected_keys = {
        "schema",
        "run_id",
        "step_id",
        "worker_id",
        "capability",
        "revision",
        "idempotency_key",
    }
    if set(payload) != expected_keys:
        raise ValueError(
            f"dispatch payload keys must equal {sorted(expected_keys)}"
        )
    revision = payload["revision"]
    if not isinstance(revision, int) or isinstance(revision, bool) or revision < 0:
        raise ValueError("revision must be a non-negative integer")
    values = {
        key: payload[key]
        for key in (
            "schema",
            "run_id",
            "step_id",
            "worker_id",
            "capability",
            "idempotency_key",
        )
    }
    if not all(
        isinstance(value, str) and 1 <= len(value.strip()) <= 200
        for value in values.values()
    ):
        raise ValueError("dispatch string fields must contain 1-200 characters")
    return DispatchEnvelope(
        schema=values["schema"],
        run_id=values["run_id"],
        step_id=values["step_id"],
        worker_id=values["worker_id"],
        capability=values["capability"],
        revision=revision,
        idempotency_key=values["idempotency_key"],
    )


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/pubsub")
async def receive_pubsub(request: Request) -> dict[str, Any]:
    raw = await request.body()
    if len(raw) > _MAX_REQUEST_BYTES:
        raise HTTPException(status_code=413, detail="request exceeds Relay limit")
    try:
        envelope = _decode_push(_load_json(raw))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if envelope.schema != "nymrel.relay.dispatch.v1":
        raise HTTPException(status_code=400, detail="unsupported dispatch schema")

    engine = RelayEngine(_store())
    try:
        run = engine.get_run(envelope.run_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="run not found") from exc

    existing_id = run.idempotency_results.get(envelope.idempotency_key)
    if existing_id:
        receipt = run.receipts[existing_id]
        return {
            "success": True,
            "duplicate": True,
            "receipt": to_json_dict(receipt),
        }
    if run.revision < envelope.revision:
        raise HTTPException(status_code=409, detail="dispatch references a future revision")
    step = run.steps.get(envelope.step_id)
    if step is None:
        raise HTTPException(status_code=404, detail="step not found")
    if step.status is not StepStatus.LEASED:
        raise HTTPException(status_code=409, detail="step is not leased")
    if step.lease_owner != envelope.worker_id:
        raise HTTPException(status_code=403, detail="worker does not own the lease")
    if step.definition.capability != envelope.capability:
        raise HTTPException(status_code=409, detail="capability does not match lease")

    try:
        result = execute_step(step.definition)
        receipt = engine.record_result(
            run_id=envelope.run_id,
            step_id=envelope.step_id,
            worker_id=envelope.worker_id,
            idempotency_key=envelope.idempotency_key,
            expected=result.expected,
            observed=result.observed,
            result=result.result,
            artifact_digests=result.artifact_digests,
        )
    except ConcurrentMutationError as exc:
        raise HTTPException(status_code=409, detail="concurrent run mutation") from exc
    except (PermissionError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {
        "success": True,
        "duplicate": False,
        "receipt": to_json_dict(receipt),
    }
