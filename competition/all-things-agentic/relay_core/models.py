"""Domain models for the Nymrel Relay competition slice.

The core stays independent from Google Cloud and ADK so that policy, recovery,
and evidence behavior can be tested without credentials or network access.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any, Literal

JSONValue = str | int | float | bool | None | list["JSONValue"] | dict[str, "JSONValue"]


def utc_now() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


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
    depends_on: list[str] = field(default_factory=list)
    protected_action: bool = False
    max_attempts: int = 3


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
