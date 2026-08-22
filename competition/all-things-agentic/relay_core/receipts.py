"""Canonical evidence receipts for Relay state transitions."""

from __future__ import annotations

import hashlib
import json
import uuid
from typing import Literal

from .models import EvidenceReceipt, utc_now

_ALLOWED_RESULTS = {"pass", "fail", "blocked", "inconclusive", "error"}
_MAX_ARTIFACT_DIGESTS = 32
_MAX_EXPECTED_LENGTH = 1000
_MAX_OBSERVED_LENGTH = 2000


def canonical_json(value: object) -> str:
    try:
        return json.dumps(
            value,
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
            allow_nan=False,
        )
    except (TypeError, ValueError) as exc:
        raise ValueError("receipt payload must be strict JSON") from exc


def digest_json(value: object) -> str:
    payload = canonical_json(value).encode("utf-8")
    return f"sha256:{hashlib.sha256(payload).hexdigest()}"


def _bounded_text(value: str, label: str, maximum: int) -> str:
    normalized = value.strip()
    if not normalized or len(normalized) > maximum:
        raise ValueError(f"{label} must contain 1-{maximum} characters")
    return normalized


def _identifier(value: str, label: str) -> str:
    return _bounded_text(value, label, 200)


def _artifact_digests(values: list[str] | None) -> list[str]:
    digests = list(values or [])
    if len(digests) > _MAX_ARTIFACT_DIGESTS:
        raise ValueError(
            f"artifact_digests must contain at most {_MAX_ARTIFACT_DIGESTS} values"
        )
    if len(digests) != len(set(digests)):
        raise ValueError("artifact_digests must be unique")
    for digest in digests:
        if (
            not isinstance(digest, str)
            or not digest.startswith("sha256:")
            or len(digest) != 71
            or any(character not in "0123456789abcdef" for character in digest[7:])
        ):
            raise ValueError(
                "artifact_digests must use sha256 followed by 64 lowercase hex characters"
            )
    return sorted(digests)


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
    if result not in _ALLOWED_RESULTS:
        raise ValueError(f"unsupported receipt result: {result}")
    normalized_run_id = _identifier(run_id, "run_id")
    normalized_step_id = _identifier(step_id, "step_id")
    normalized_key = _identifier(idempotency_key, "idempotency_key")
    normalized_expected = _bounded_text(
        expected, "expected", _MAX_EXPECTED_LENGTH
    )
    normalized_observed = _bounded_text(
        observed, "observed", _MAX_OBSERVED_LENGTH
    )
    normalized_digests = _artifact_digests(artifact_digests)

    created_at = utc_now()
    receipt_id = f"rcpt_{uuid.uuid4().hex}"
    unsigned = {
        "schema": "nymrel.relay.receipt.v1",
        "receipt_id": receipt_id,
        "run_id": normalized_run_id,
        "step_id": normalized_step_id,
        "idempotency_key": normalized_key,
        "expected": normalized_expected,
        "observed": normalized_observed,
        "result": result,
        "artifact_digests": normalized_digests,
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
        run_id=normalized_run_id,
        step_id=normalized_step_id,
        idempotency_key=normalized_key,
        expected=normalized_expected,
        observed=normalized_observed,
        result=result,
        artifact_digests=normalized_digests,
        created_at=created_at,
        receipt_digest=digest_json(unsigned),
        claims=unsigned["claims"],
    )
