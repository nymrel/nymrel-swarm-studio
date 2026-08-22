from __future__ import annotations

import unittest
from datetime import UTC, datetime, timedelta

from relay_core import (
    ConcurrentMutationError,
    InMemoryRunStore,
    RelayEngine,
    RunStatus,
    StepDefinition,
    StepStatus,
    digest_json,
    run_from_document,
    run_to_document,
)

VALID_DIGEST = "sha256:" + "a" * 64


class RelayCoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.store = InMemoryRunStore()
        self.engine = RelayEngine(self.store)

    def create_two_step_run(self):
        return self.engine.create_run(
            run_id="run_test",
            goal="Validate a public artifact and prepare an approved deployment.",
            max_parallel=2,
            steps=[
                StepDefinition(
                    step_id="validate",
                    capability="validation",
                    description="Validate the public artifact.",
                ),
                StepDefinition(
                    step_id="deploy",
                    capability="deployment",
                    description="Deploy the validated artifact.",
                    depends_on=["validate"],
                    protected_action=True,
                ),
            ],
        )

    def test_dependency_approval_and_completion_flow(self) -> None:
        run = self.create_two_step_run()
        self.assertEqual(run.status, RunStatus.QUEUED)

        validate = self.engine.claim_next(
            run_id=run.run_id,
            worker_id="validator-1",
            capabilities={"validation", "deployment"},
        )
        assert validate is not None
        self.assertEqual(validate.definition.step_id, "validate")

        receipt = self.engine.record_result(
            run_id=run.run_id,
            step_id="validate",
            worker_id="validator-1",
            idempotency_key="validate-attempt-1",
            expected="artifact is valid",
            observed="all deterministic checks passed",
            result="pass",
            artifact_digests=[VALID_DIGEST],
        )
        self.assertEqual(receipt.result, "pass")

        self.assertIsNone(
            self.engine.claim_next(
                run_id=run.run_id,
                worker_id="deployer-1",
                capabilities={"deployment"},
            )
        )

        approval = self.engine.request_approval(
            run_id=run.run_id,
            step_id="deploy",
            action="Deploy to an isolated competition environment",
            reason="The validated artifact must be demonstrated on Google Cloud.",
            cost_usd=0,
        )
        current = self.engine.get_run(run.run_id)
        self.assertEqual(current.status, RunStatus.AWAITING_APPROVAL)

        self.engine.resolve_approval(
            run_id=run.run_id,
            approval_id=approval.approval_id,
            decision="approved",
            note="Approved for isolated zero-spend demonstration only.",
        )
        deploy = self.engine.claim_next(
            run_id=run.run_id,
            worker_id="deployer-1",
            capabilities={"deployment"},
        )
        assert deploy is not None
        self.assertEqual(deploy.definition.step_id, "deploy")

        self.engine.record_result(
            run_id=run.run_id,
            step_id="deploy",
            worker_id="deployer-1",
            idempotency_key="deploy-attempt-1",
            expected="isolated deployment returns healthy",
            observed="deployment health check passed",
            result="pass",
        )
        final = self.engine.get_run(run.run_id)
        self.assertEqual(final.status, RunStatus.COMPLETED)
        self.assertEqual(final.final_reason, "all_steps_completed")

    def test_duplicate_result_delivery_returns_existing_receipt(self) -> None:
        run = self.engine.create_run(
            run_id="run_idempotent",
            goal="Validate once.",
            steps=[StepDefinition("validate", "validation", "Validate once.")],
        )
        self.engine.claim_next(
            run_id=run.run_id,
            worker_id="worker",
            capabilities={"validation"},
        )
        first = self.engine.record_result(
            run_id=run.run_id,
            step_id="validate",
            worker_id="worker",
            idempotency_key="delivery-123",
            expected="one receipt",
            observed="one receipt",
            result="pass",
        )
        duplicate = self.engine.record_result(
            run_id=run.run_id,
            step_id="validate",
            worker_id="different-worker",
            idempotency_key="delivery-123",
            expected="ignored duplicate payload",
            observed="ignored duplicate payload",
            result="error",
        )
        self.assertEqual(first.receipt_id, duplicate.receipt_id)
        current = self.engine.get_run(run.run_id)
        self.assertEqual(len(current.receipts), 1)

    def test_stale_lease_is_recovered_without_marking_completion(self) -> None:
        start = datetime(2026, 8, 21, 12, 0, tzinfo=UTC)
        run = self.engine.create_run(
            run_id="run_recovery",
            goal="Recover a worker crash.",
            steps=[StepDefinition("inspect", "validation", "Inspect evidence.")],
        )
        self.engine.claim_next(
            run_id=run.run_id,
            worker_id="crashed-worker",
            capabilities={"validation"},
            lease_seconds=10,
            now=start,
        )
        recovered = self.engine.recover_stale_leases(
            run_id=run.run_id,
            now=start + timedelta(seconds=11),
        )
        self.assertEqual(recovered, 1)
        current = self.engine.get_run(run.run_id)
        self.assertEqual(current.steps["inspect"].status, StepStatus.PENDING)
        self.assertEqual(
            current.steps["inspect"].reason_code,
            "stale_lease_recovered",
        )
        self.assertIsNone(current.steps["inspect"].result_digest)

    def test_failed_attempt_retries_then_exhausts(self) -> None:
        run = self.engine.create_run(
            run_id="run_retry",
            goal="Retry a bounded validation.",
            steps=[
                StepDefinition(
                    "inspect",
                    "validation",
                    "Inspect evidence.",
                    max_attempts=2,
                )
            ],
        )
        for attempt in (1, 2):
            self.engine.claim_next(
                run_id=run.run_id,
                worker_id="worker",
                capabilities={"validation"},
            )
            self.engine.record_result(
                run_id=run.run_id,
                step_id="inspect",
                worker_id="worker",
                idempotency_key=f"attempt-{attempt}",
                expected="valid evidence",
                observed="validation error",
                result="error",
            )
        current = self.engine.get_run(run.run_id)
        self.assertEqual(current.steps["inspect"].status, StepStatus.FAILED)
        self.assertEqual(current.status, RunStatus.FAILED)

    def test_denied_approval_blocks_run(self) -> None:
        run = self.engine.create_run(
            run_id="run_denied",
            goal="Request a protected action.",
            steps=[
                StepDefinition(
                    "publish",
                    "deployment",
                    "Publish a demo.",
                    protected_action=True,
                )
            ],
        )
        approval = self.engine.request_approval(
            run_id=run.run_id,
            step_id="publish",
            action="Publish a public demo",
            reason="Competition judging requires a URL.",
        )
        self.engine.resolve_approval(
            run_id=run.run_id,
            approval_id=approval.approval_id,
            decision="denied",
            note="Public release has not passed privacy review.",
        )
        current = self.engine.get_run(run.run_id)
        self.assertEqual(current.steps["publish"].status, StepStatus.BLOCKED)
        self.assertEqual(current.status, RunStatus.INCONCLUSIVE)

    def test_cycle_and_naive_time_fail_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "cycle"):
            self.engine.create_run(
                goal="Invalid cycle.",
                steps=[
                    StepDefinition("a", "validation", "A", depends_on=["b"]),
                    StepDefinition("b", "validation", "B", depends_on=["a"]),
                ],
            )

        run = self.engine.create_run(
            run_id="run_time",
            goal="Reject naive time.",
            steps=[StepDefinition("a", "validation", "A")],
        )
        with self.assertRaisesRegex(ValueError, "timezone-aware"):
            self.engine.claim_next(
                run_id=run.run_id,
                worker_id="worker",
                capabilities={"validation"},
                now=datetime(2026, 8, 21, 12, 0),
            )

    def test_serialization_round_trip_and_digest_are_stable(self) -> None:
        run = self.create_two_step_run()
        document = run_to_document(run)
        restored = run_from_document(document)
        self.assertEqual(run_to_document(restored), document)
        self.assertEqual(digest_json(document), digest_json(run_to_document(restored)))

    def test_store_rejects_stale_concurrent_writes(self) -> None:
        run = self.engine.create_run(
            run_id="run_concurrent",
            goal="Reject stale writers.",
            steps=[StepDefinition("a", "validation", "A")],
        )
        first = self.store.get(run.run_id)
        second = self.store.get(run.run_id)
        assert first is not None and second is not None
        first.goal = "First writer"
        self.store.put(first)
        second.goal = "Stale writer"
        with self.assertRaises(ConcurrentMutationError):
            self.store.put(second)


if __name__ == "__main__":
    unittest.main()
