"""Domain models for the Nymrel Relay competition slice.

The core stays independent from Google Cloud and ADK so that policy, recovery,
and evidence behavior can be tested without credentials or network access.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any, Literal

JSONValue = str | int | float | bool | None | list["JSONValue"] | dict[str, "JSONValue"]
_MAX_INPUT_BYTES = 8192
_FORBIDDEN_INPUT_KEYS = {
    "apikey",
    "authorization",
    "cardnumber",
    "cookie",
    "credential",
    "cvv",
    "password",
    "privatekey",
    "secret",
    "token",
}
_FORBIDDEN_KEY_SUFFIXES = (
    "apikey",
    "credential",
    "password",
    "privatekey",
    "secret",
    "token",
)
_FORBIDDEN_VALUE_MARKERS = (
    "-----BEGIN PRIVATE KEY-----",
    "-----BEGIN OPENSSH PRIVATE KEY-----",
    "github_pat_",
    "ghp_",
    "sk-proj-",
    "xoxb-",
    "xoxp-",
)


def utc_now() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def _validate_input_data(value: dict[str, JSONValue]) -> None:
    try:
        encoded = json.dumps(
            value,
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
            allow_nan=False,
        ).encode("utf-8")
    except (TypeError, ValueError) as exc:
        raise ValueError("step input_data must be strict JSON") from exc
    if len(encoded) > _MAX_INPUT_BYTES:
        raise ValueError(f"step input_data exceeds {_MAX_INPUT_BYTES} bytes")

    def inspect(item: JSONValue, path: str) -> None:
        if isinstance(item, dict):
            for key, nested in item.items():
                compact = "".join(character for character in key.casefold() if character.isalnum())
                if compact in _FORBIDDEN_INPUT_KEYS or compact.endswith(
                    _FORBIDDEN_KEY_SUFFIXES
                ):
                    raise ValueError(
                        f"step input_data contains forbidden key at {path}.{key}"
                    )
                inspect(nested, f"{path}.{key}")
        elif isinstance(item, list):
            for index, nested in enumerate(item):
                inspect(nested, f"{path}[{index}]")
        elif isinstance(item, str):
            if any(marker in item for marker in _FORBIDDEN_VALUE_MARKERS):
                raise ValueError(
                    f"step input_data contains a forbidden secret-like value at {path}"
                )

    inspect(value, "input_data")


class RunStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    AWAITING_APPROVAL = "awaiting_approval"
    COMPLETED = "completed"
    FAILED = "failed"
    INCONCLUSIVE = "inconclusive"


class StepStatus(StrEnum):
    PENDING = "pending"
    LEASED = "leased"
    AWAITING_APPROVAL = "awaiting_approval"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"


class ApprovalDecision(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"


@dataclass(slots=True)
class StepDefinition:
    step_id: str
    capability: str
    description: str
    input_data: dict[str, JSONValue] = field(default_factory=dict)
    depends_on: list[str] = field(default_factory=list)
    protected_action: bool = False
    max_attempts: int = 3

    def __post_init__(self) -> None:
        if not isinstance(self.input_data, dict):
            raise ValueError("step input_data must be a JSON object")
        _validate_input_data(self.input_data)


@dataclass(slots=True)
class StepState:
    definition: StepDefinition
    status: StepStatus = StepStatus.PENDING
    attempts: int = 0
    lease_owner: str | None = None
    lease_expires_at: str | None = None
    approval_id: str | None = None
    result_digest: str | None = None
    reason_code: str | None = None
    updated_at: str = field(default_factory=utc_now)


@dataclass(slots=True)
class ApprovalRequest:
    approval_id: str
    run_id: str
    step_id: str
    action: str
    reason: str
    cost_usd: float
    expires_at: str
    decision: ApprovalDecision = ApprovalDecision.PENDING
    decided_at: str | None = None
    decision_note: str | None = None


@dataclass(slots=True)
class EvidenceReceipt:
    schema: Literal["nymrel.relay.receipt.v1"]
    receipt_id: str
    run_id: str
    step_id: str
    idempotency_key: str
    expected: str
    observed: str
    result: Literal["pass", "fail", "blocked", "inconclusive", "error"]
    artifact_digests: list[str]
    created_at: str
    receipt_digest: str
    claims: dict[str, bool]


@dataclass(slots=True)
class RunState:
    schema: Literal["nymrel.relay.run.v1"]
    run_id: str
    goal: str
    status: RunStatus
    created_at: str
    updated_at: str
    max_parallel: int
    revision: int
    steps: dict[str, StepState]
    approvals: dict[str, ApprovalRequest] = field(default_factory=dict)
    receipts: dict[str, EvidenceReceipt] = field(default_factory=dict)
    idempotency_results: dict[str, str] = field(default_factory=dict)
    final_reason: str | None = None


def to_json_dict(value: Any) -> dict[str, JSONValue]:
    """Return a JSON-compatible dictionary for a Relay dataclass."""

    document = asdict(value)
    return _normalize(document)


def _normalize(value: Any) -> Any:
    if isinstance(value, StrEnum):
        return str(value)
    if isinstance(value, dict):
        return {str(key): _normalize(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_normalize(item) for item in value]
    return value
