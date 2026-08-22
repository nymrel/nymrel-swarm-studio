"""Canonical evidence receipts for Relay state transitions."""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime
from typing import Literal

from .models import EvidenceReceipt, utc_now

_ALLOWED_RESULTS = {"pass", "fail", "blocked", "inconclusive", "error"}
_MAX_ARTIFACT_DIGESTS = 32
_MAX_EXPECTED_LENGTH = 1000
_MAX_OBSERVED_LENGTH = 2000
_CLAIMS = {
    "agent_identity_verified": False,
    "external_effect_verified": False,
    "production_admission": False,
    "security_certification": False,
}


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


def _sha256(value: str, label: str) -> str:
    if (
        not isinstance(value, str)
        or not value.startswith("sha256:")
        or len(value) != 71
        or any(character not in "0123456789abcdef" for character in value[7:])
    ):
        raise ValueError(
            f"{label} must use sha256 followed by 64 lowercase hex characters"
        )
    return value


def _artifact_digests(values: list[str] | None) -> list[str]:
    digests = list(values or [])
    if len(digests) > _MAX_ARTIFACT_DIGESTS:
        raise ValueError(
            f"artifact_digests must contain at most {_MAX_ARTIFACT_DIGESTS} values"
        )
    if len(digests) != len(set(digests)):
        raise ValueError("artifact_digests must be unique")
    for digest in digests:
        _sha256(digest, "artifact_digests")
    return sorted(digests)


def _timestamp(value: str) -> str:
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise ValueError("created_at must be an ISO-8601 timestamp") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("created_at must be timezone-aware")
    return value


def _unsigned_document(receipt: EvidenceReceipt) -> dict[str, object]:
    return {
        "schema": receipt.schema,
        "receipt_id": receipt.receipt_id,
        "run_id": receipt.run_id,
        "step_id": receipt.step_id,
        "idempotency_key": receipt.idempotency_key,
        "expected": receipt.expected,
        "observed": receipt.observed,
        "result": receipt.result,
        "artifact_digests": receipt.artifact_digests,
        "created_at": receipt.created_at,
        "claims": receipt.claims,
    }


def verify_receipt(receipt: EvidenceReceipt) -> None:
    """Fail closed when a persisted Relay receipt has been modified."""

    if receipt.schema != "nymrel.relay.receipt.v1":
        raise ValueError("unsupported receipt schema")
    if (
        not receipt.receipt_id.startswith("rcpt_")
        or len(receipt.receipt_id) != 37
        or any(
            character not in "0123456789abcdef"
            for character in receipt.receipt_id[5:]
        )
    ):
        raise ValueError("receipt_id is invalid")
    if receipt.result not in _ALLOWED_RESULTS:
        raise ValueError(f"unsupported receipt result: {receipt.result}")
    if receipt.run_id != _identifier(receipt.run_id, "run_id"):
        raise ValueError("run_id is not normalized")
    if receipt.step_id != _identifier(receipt.step_id, "step_id"):
        raise ValueError("step_id is not normalized")
    if receipt.idempotency_key != _identifier(
        receipt.idempotency_key, "idempotency_key"
    ):
        raise ValueError("idempotency_key is not normalized")
    if receipt.expected != _bounded_text(
        receipt.expected, "expected", _MAX_EXPECTED_LENGTH
    ):
        raise ValueError("expected is not normalized")
    if receipt.observed != _bounded_text(
        receipt.observed, "observed", _MAX_OBSERVED_LENGTH
    ):
        raise ValueError("observed is not normalized")
    if receipt.artifact_digests != _artifact_digests(receipt.artifact_digests):
        raise ValueError("artifact_digests are not canonically ordered")
    _timestamp(receipt.created_at)
    if receipt.claims != _CLAIMS:
        raise ValueError("receipt claims must equal the Relay non-certification contract")
    _sha256(receipt.receipt_digest, "receipt_digest")
    expected_digest = digest_json(_unsigned_document(receipt))
    if receipt.receipt_digest != expected_digest:
        raise ValueError("receipt digest mismatch")


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

    receipt = EvidenceReceipt(
        schema="nymrel.relay.receipt.v1",
        receipt_id=f"rcpt_{uuid.uuid4().hex}",
        run_id=normalized_run_id,
        step_id=normalized_step_id,
        idempotency_key=normalized_key,
        expected=normalized_expected,
        observed=normalized_observed,
        result=result,
        artifact_digests=normalized_digests,
        created_at=utc_now(),
        receipt_digest="sha256:" + "0" * 64,
        claims=dict(_CLAIMS),
    )
    receipt.receipt_digest = digest_json(_unsigned_document(receipt))
    verify_receipt(receipt)
    return receipt
