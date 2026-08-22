"""Canonical evidence receipts for Relay state transitions."""

from __future__ import annotations

import hashlib
import json
import uuid
from typing import Literal

from .models import EvidenceReceipt, utc_now


def canonical_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def digest_json(value: object) -> str:
    payload = canonical_json(value).encode("utf-8")
    return f"sha256:{hashlib.sha256(payload).hexdigest()}"


def create_receipt(
    *,
    run_id: str,
    step_id: str,
    idempotency_key: str,
    expected: str,
    observed: str,
    result: Literal["pass", "fail", "blocked", "inconclusive", "error"],
    artifact_digests: list[str] | None = None,
) -> EvidenceReceipt:
    created_at = utc_now()
    receipt_id = f"rcpt_{uuid.uuid4().hex}"
    unsigned = {
        "schema": "nymrel.relay.receipt.v1",
        "receipt_id": receipt_id,
        "run_id": run_id,
        "step_id": step_id,
        "idempotency_key": idempotency_key,
        "expected": expected,
        "observed": observed,
        "result": result,
        "artifact_digests": sorted(artifact_digests or []),
        "created_at": created_at,
        "claims": {
            "agent_identity_verified": False,
            "external_effect_verified": False,
            "production_admission": False,
            "security_certification": False,
        },
    }
    return EvidenceReceipt(
        schema="nymrel.relay.receipt.v1",
        receipt_id=receipt_id,
        run_id=run_id,
        step_id=step_id,
        idempotency_key=idempotency_key,
        expected=expected,
        observed=observed,
        result=result,
        artifact_digests=unsigned["artifact_digests"],
        created_at=created_at,
        receipt_digest=digest_json(unsigned),
        claims=unsigned["claims"],
    )
