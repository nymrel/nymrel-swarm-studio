"""Stable JSON serialization for durable Relay state."""

from __future__ import annotations

from typing import Any, cast

from .models import (
    JSONValue,
    ApprovalDecision,
    ApprovalRequest,
    EvidenceReceipt,
    RunState,
    RunStatus,
    StepDefinition,
    StepState,
    StepStatus,
    to_json_dict,
)


def run_to_document(run: RunState) -> dict[str, Any]:
    return to_json_dict(run)


def run_from_document(document: dict[str, Any]) -> RunState:
    steps: dict[str, StepState] = {}
    for step_id, value in _dict(document, "steps").items():
        if not isinstance(value, dict):
            raise ValueError(f"steps.{step_id} must be an object")
        definition_doc = _dict(value, "definition")
        input_data = _dict(definition_doc, "input_data", default={})
        definition = StepDefinition(
            step_id=_str(definition_doc, "step_id"),
            capability=_str(definition_doc, "capability"),
            description=_str(definition_doc, "description"),
            input_data=cast(dict[str, JSONValue], input_data),
            depends_on=_string_list(definition_doc.get("depends_on", []), "depends_on"),
            protected_action=_bool(definition_doc, "protected_action", False),
            max_attempts=_int(definition_doc, "max_attempts", 3),
        )
        steps[step_id] = StepState(
            definition=definition,
            status=StepStatus(_str(value, "status")),
            attempts=_int(value, "attempts", 0),
            lease_owner=_optional_str(value.get("lease_owner")),
            lease_expires_at=_optional_str(value.get("lease_expires_at")),
            approval_id=_optional_str(value.get("approval_id")),
            result_digest=_optional_str(value.get("result_digest")),
            reason_code=_optional_str(value.get("reason_code")),
            updated_at=_str(value, "updated_at"),
        )

    approvals: dict[str, ApprovalRequest] = {}
    for approval_id, value in _dict(document, "approvals", default={}).items():
        if not isinstance(value, dict):
            raise ValueError(f"approvals.{approval_id} must be an object")
        approvals[approval_id] = ApprovalRequest(
            approval_id=_str(value, "approval_id"),
            run_id=_str(value, "run_id"),
            step_id=_str(value, "step_id"),
            action=_str(value, "action"),
            reason=_str(value, "reason"),
            cost_usd=_float(value, "cost_usd", 0),
            expires_at=_str(value, "expires_at"),
            decision=ApprovalDecision(_str(value, "decision")),
            decided_at=_optional_str(value.get("decided_at")),
            decision_note=_optional_str(value.get("decision_note")),
        )

    receipts: dict[str, EvidenceReceipt] = {}
    for receipt_id, value in _dict(document, "receipts", default={}).items():
        if not isinstance(value, dict):
            raise ValueError(f"receipts.{receipt_id} must be an object")
        claims_doc = _dict(value, "claims")
        claims = {str(key): bool(item) for key, item in claims_doc.items()}
        result = _str(value, "result")
        if result not in {"pass", "fail", "blocked", "inconclusive", "error"}:
            raise ValueError(f"unsupported receipt result: {result}")
        receipts[receipt_id] = EvidenceReceipt(
            schema="nymrel.relay.receipt.v1",
            receipt_id=_str(value, "receipt_id"),
            run_id=_str(value, "run_id"),
            step_id=_str(value, "step_id"),
            idempotency_key=_str(value, "idempotency_key"),
            expected=_str(value, "expected"),
            observed=_str(value, "observed"),
            result=result,  # type: ignore[arg-type]
            artifact_digests=_string_list(value.get("artifact_digests", []), "artifact_digests"),
            created_at=_str(value, "created_at"),
            receipt_digest=_str(value, "receipt_digest"),
            claims=claims,
        )

    idempotency = _dict(document, "idempotency_results", default={})
    idempotency_results = {
        str(key): _require_string(item, f"idempotency_results.{key}")
        for key, item in idempotency.items()
    }

    return RunState(
        schema="nymrel.relay.run.v1",
        run_id=_str(document, "run_id"),
        goal=_str(document, "goal"),
        status=RunStatus(_str(document, "status")),
        created_at=_str(document, "created_at"),
        updated_at=_str(document, "updated_at"),
        max_parallel=_int(document, "max_parallel"),
        revision=_int(document, "revision", 0),
        steps=steps,
        approvals=approvals,
        receipts=receipts,
        idempotency_results=idempotency_results,
        final_reason=_optional_str(document.get("final_reason")),
    )


def _dict(
    document: dict[str, Any], key: str, default: dict[str, Any] | None = None
) -> dict[str, Any]:
    value = document.get(key, default)
    if not isinstance(value, dict):
        raise ValueError(f"{key} must be an object")
    return value


def _str(document: dict[str, Any], key: str) -> str:
    return _require_string(document.get(key), key)


def _require_string(value: Any, key: str) -> str:
    if not isinstance(value, str):
        raise ValueError(f"{key} must be a string")
    return value


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("optional value must be a string or null")
    return value


def _int(document: dict[str, Any], key: str, default: int | None = None) -> int:
    value = document.get(key, default)
    if not isinstance(value, int) or isinstance(value, bool):
        raise ValueError(f"{key} must be an integer")
    return value


def _float(document: dict[str, Any], key: str, default: float = 0) -> float:
    value = document.get(key, default)
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise ValueError(f"{key} must be numeric")
    return float(value)


def _bool(document: dict[str, Any], key: str, default: bool = False) -> bool:
    value = document.get(key, default)
    if not isinstance(value, bool):
        raise ValueError(f"{key} must be boolean")
    return value


def _string_list(value: Any, key: str) -> list[str]:
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise ValueError(f"{key} must be a string array")
    return list(value)
