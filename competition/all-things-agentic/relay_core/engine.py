"""Failure-tolerant workflow engine for Nymrel Relay."""

from __future__ import annotations

import copy
import uuid
from datetime import UTC, datetime, timedelta
from typing import Iterable, Literal

from .models import (
    ApprovalDecision,
    ApprovalRequest,
    EvidenceReceipt,
    RunState,
    RunStatus,
    StepDefinition,
    StepState,
    StepStatus,
    utc_now,
)
from .receipts import create_receipt
from .store import RunStore


def _parse_time(value: str) -> datetime:
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        raise ValueError("timestamps must be timezone-aware")
    return parsed.astimezone(UTC)


def _format_time(value: datetime) -> str:
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


class RelayEngine:
    def __init__(self, store: RunStore) -> None:
        self.store = store

    def create_run(
        self,
        *,
        goal: str,
        steps: Iterable[StepDefinition],
        max_parallel: int = 3,
        run_id: str | None = None,
    ) -> RunState:
        normalized_goal = goal.strip()
        if not normalized_goal:
            raise ValueError("goal must not be empty")
        if not 1 <= max_parallel <= 32:
            raise ValueError("max_parallel must be between 1 and 32")

        definitions = list(steps)
        if not definitions:
            raise ValueError("a run requires at least one step")
        step_ids = [step.step_id for step in definitions]
        if len(step_ids) != len(set(step_ids)):
            raise ValueError("step ids must be unique")
        known = set(step_ids)
        for step in definitions:
            if not step.step_id.strip() or not step.capability.strip():
                raise ValueError("step id and capability must not be empty")
            if step.max_attempts < 1 or step.max_attempts > 10:
                raise ValueError("step max_attempts must be between 1 and 10")
            unknown = set(step.depends_on) - known
            if unknown:
                raise ValueError(
                    f"step {step.step_id} has unknown dependencies: {sorted(unknown)}"
                )
            if step.step_id in step.depends_on:
                raise ValueError(f"step {step.step_id} cannot depend on itself")
        self._assert_acyclic(definitions)

        now = utc_now()
        run = RunState(
            schema="nymrel.relay.run.v1",
            run_id=run_id or f"run_{uuid.uuid4().hex}",
            goal=normalized_goal,
            status=RunStatus.QUEUED,
            created_at=now,
            updated_at=now,
            max_parallel=max_parallel,
            steps={step.step_id: StepState(definition=step) for step in definitions},
        )
        self.store.create(run)
        return copy.deepcopy(run)

    def get_run(self, run_id: str) -> RunState:
        run = self.store.get(run_id)
        if run is None:
            raise KeyError(f"unknown run: {run_id}")
        return run

    def request_approval(
        self,
        *,
        run_id: str,
        step_id: str,
        action: str,
        reason: str,
        cost_usd: float = 0,
        expires_in_seconds: int = 3600,
        now: datetime | None = None,
    ) -> ApprovalRequest:
        run = self.get_run(run_id)
        step = self._step(run, step_id)
        if not step.definition.protected_action:
            raise ValueError("approval can only be requested for protected steps")
        if step.status not in {StepStatus.PENDING, StepStatus.AWAITING_APPROVAL}:
            raise ValueError(f"step is not approval-eligible: {step.status}")
        if cost_usd < 0 or cost_usd > 100:
            raise ValueError("approval cost must be between 0 and 100 USD")
        if not action.strip() or not reason.strip():
            raise ValueError("approval action and reason must not be empty")
        if not 60 <= expires_in_seconds <= 86400:
            raise ValueError("approval expiry must be between 60 seconds and 24 hours")

        if step.approval_id:
            existing = run.approvals[step.approval_id]
            if existing.decision is ApprovalDecision.PENDING:
                return copy.deepcopy(existing)

        current = now or datetime.now(UTC)
        approval = ApprovalRequest(
            approval_id=f"approval_{uuid.uuid4().hex}",
            run_id=run_id,
            step_id=step_id,
            action=action.strip(),
            reason=reason.strip(),
            cost_usd=round(cost_usd, 2),
            expires_at=_format_time(current + timedelta(seconds=expires_in_seconds)),
        )
        run.approvals[approval.approval_id] = approval
        step.approval_id = approval.approval_id
        step.status = StepStatus.AWAITING_APPROVAL
        step.updated_at = _format_time(current)
        run.updated_at = step.updated_at
        self._refresh_run_status(run)
        self.store.put(run)
        return copy.deepcopy(approval)

    def resolve_approval(
        self,
        *,
        run_id: str,
        approval_id: str,
        decision: Literal["approved", "denied"],
        note: str,
        now: datetime | None = None,
    ) -> ApprovalRequest:
        run = self.get_run(run_id)
        approval = run.approvals.get(approval_id)
        if approval is None:
            raise KeyError(f"unknown approval: {approval_id}")
        if approval.decision is not ApprovalDecision.PENDING:
            raise ValueError("approval has already been resolved")
        current = now or datetime.now(UTC)
        if _parse_time(approval.expires_at) <= current.astimezone(UTC):
            raise ValueError("approval has expired")
        normalized_note = note.strip()
        if not normalized_note:
            raise ValueError("approval decision note must not be empty")

        approval.decision = ApprovalDecision(decision)
        approval.decided_at = _format_time(current)
        approval.decision_note = normalized_note
        step = self._step(run, approval.step_id)
        step.updated_at = approval.decided_at
        if approval.decision is ApprovalDecision.APPROVED:
            step.status = StepStatus.PENDING
            step.reason_code = "human_approved"
        else:
            step.status = StepStatus.BLOCKED
            step.reason_code = "human_denied"
        run.updated_at = approval.decided_at
        self._refresh_run_status(run)
        self.store.put(run)
        return copy.deepcopy(approval)

    def claim_next(
        self,
        *,
        run_id: str,
        worker_id: str,
        capabilities: set[str],
        lease_seconds: int = 300,
        now: datetime | None = None,
    ) -> StepState | None:
        normalized_worker = worker_id.strip()
        if not normalized_worker:
            raise ValueError("worker_id must not be empty")
        if not capabilities:
            raise ValueError("at least one capability is required")
        if not 10 <= lease_seconds <= 3600:
            raise ValueError("lease_seconds must be between 10 and 3600")

        current = now or datetime.now(UTC)
        run = self.get_run(run_id)
        self._recover_stale_in_place(run, current)
        leased = sum(step.status is StepStatus.LEASED for step in run.steps.values())
        if leased >= run.max_parallel:
            self.store.put(run)
            return None

        for step_id in sorted(run.steps):
            step = run.steps[step_id]
            if step.status is not StepStatus.PENDING:
                continue
            if step.definition.capability not in capabilities:
                continue
            if step.definition.protected_action:
                if not step.approval_id:
                    continue
                approval = run.approvals[step.approval_id]
                if approval.decision is not ApprovalDecision.APPROVED:
                    continue
            if not self._dependencies_complete(run, step):
                continue

            step.status = StepStatus.LEASED
            step.attempts += 1
            step.lease_owner = normalized_worker
            step.lease_expires_at = _format_time(
                current + timedelta(seconds=lease_seconds)
            )
            step.updated_at = _format_time(current)
            step.reason_code = None
            run.updated_at = step.updated_at
            self._refresh_run_status(run)
            self.store.put(run)
            return copy.deepcopy(step)

        self._refresh_run_status(run)
        self.store.put(run)
        return None

    def record_result(
        self,
        *,
        run_id: str,
        step_id: str,
        worker_id: str,
        idempotency_key: str,
        expected: str,
        observed: str,
        result: Literal["pass", "fail", "blocked", "inconclusive", "error"],
        artifact_digests: list[str] | None = None,
        now: datetime | None = None,
    ) -> EvidenceReceipt:
        run = self.get_run(run_id)
        normalized_key = idempotency_key.strip()
        if not normalized_key or len(normalized_key) > 200:
            raise ValueError("idempotency_key must contain 1-200 characters")
        existing_id = run.idempotency_results.get(normalized_key)
        if existing_id:
            existing = run.receipts[existing_id]
            if existing.step_id != step_id:
                raise ValueError("idempotency key is already bound to another step")
            return copy.deepcopy(existing)

        step = self._step(run, step_id)
        if step.status is not StepStatus.LEASED:
            raise ValueError(f"step is not leased: {step.status}")
        if step.lease_owner != worker_id:
            raise PermissionError("worker does not own the step lease")
        current = now or datetime.now(UTC)
        if not step.lease_expires_at or _parse_time(step.lease_expires_at) <= current:
            raise ValueError("step lease has expired")

        receipt = create_receipt(
            run_id=run_id,
            step_id=step_id,
            idempotency_key=normalized_key,
            expected=expected.strip(),
            observed=observed.strip(),
            result=result,
            artifact_digests=artifact_digests,
        )
        run.receipts[receipt.receipt_id] = receipt
        run.idempotency_results[normalized_key] = receipt.receipt_id
        step.result_digest = receipt.receipt_digest
        step.lease_owner = None
        step.lease_expires_at = None
        step.updated_at = _format_time(current)

        if result == "pass":
            step.status = StepStatus.COMPLETED
        elif result == "blocked":
            step.status = StepStatus.BLOCKED
            step.reason_code = "worker_blocked"
        elif step.attempts < step.definition.max_attempts:
            step.status = StepStatus.PENDING
            step.reason_code = f"retry_after_{result}"
        else:
            step.status = StepStatus.FAILED
            step.reason_code = f"attempts_exhausted_{result}"

        run.updated_at = step.updated_at
        self._refresh_run_status(run)
        self.store.put(run)
        return copy.deepcopy(receipt)

    def recover_stale_leases(
        self, *, run_id: str, now: datetime | None = None
    ) -> int:
        current = now or datetime.now(UTC)
        run = self.get_run(run_id)
        recovered = self._recover_stale_in_place(run, current)
        run.updated_at = _format_time(current)
        self._refresh_run_status(run)
        self.store.put(run)
        return recovered

    def _recover_stale_in_place(self, run: RunState, now: datetime) -> int:
        recovered = 0
        for step in run.steps.values():
            if step.status is not StepStatus.LEASED or not step.lease_expires_at:
                continue
            if _parse_time(step.lease_expires_at) > now.astimezone(UTC):
                continue
            recovered += 1
            step.lease_owner = None
            step.lease_expires_at = None
            step.updated_at = _format_time(now)
            if step.attempts < step.definition.max_attempts:
                step.status = StepStatus.PENDING
                step.reason_code = "stale_lease_recovered"
            else:
                step.status = StepStatus.FAILED
                step.reason_code = "stale_lease_attempts_exhausted"
        return recovered

    @staticmethod
    def _step(run: RunState, step_id: str) -> StepState:
        step = run.steps.get(step_id)
        if step is None:
            raise KeyError(f"unknown step: {step_id}")
        return step

    @staticmethod
    def _dependencies_complete(run: RunState, step: StepState) -> bool:
        return all(
            run.steps[dependency].status is StepStatus.COMPLETED
            for dependency in step.definition.depends_on
        )

    @staticmethod
    def _assert_acyclic(definitions: list[StepDefinition]) -> None:
        graph = {step.step_id: set(step.depends_on) for step in definitions}
        visiting: set[str] = set()
        visited: set[str] = set()

        def visit(node: str) -> None:
            if node in visiting:
                raise ValueError("step dependency graph contains a cycle")
            if node in visited:
                return
            visiting.add(node)
            for dependency in graph[node]:
                visit(dependency)
            visiting.remove(node)
            visited.add(node)

        for node in sorted(graph):
            visit(node)

    def _refresh_run_status(self, run: RunState) -> None:
        statuses = {step.status for step in run.steps.values()}
        if statuses == {StepStatus.COMPLETED}:
            run.status = RunStatus.COMPLETED
            run.final_reason = "all_steps_completed"
            return
        if StepStatus.AWAITING_APPROVAL in statuses:
            run.status = RunStatus.AWAITING_APPROVAL
            run.final_reason = None
            return
        if StepStatus.LEASED in statuses:
            run.status = RunStatus.RUNNING
            run.final_reason = None
            return

        pending = [step for step in run.steps.values() if step.status is StepStatus.PENDING]
        runnable = any(self._dependencies_complete(run, step) for step in pending)
        if runnable:
            run.status = RunStatus.QUEUED
            run.final_reason = None
            return
        if StepStatus.FAILED in statuses:
            run.status = RunStatus.FAILED
            run.final_reason = "step_failed"
            return
        if StepStatus.BLOCKED in statuses:
            run.status = RunStatus.INCONCLUSIVE
            run.final_reason = "step_blocked"
            return
        run.status = RunStatus.INCONCLUSIVE
        run.final_reason = "no_runnable_steps"
