#!/usr/bin/env python3
"""Run Relay's failure and approval demo without Google credentials."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, cast

from relay_core import (
    JSONValue,
    InMemoryRunStore,
    RelayEngine,
    StepDefinition,
    StepStatus,
    to_json_dict,
)
from relay_worker.handlers import execute_step


def reject_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    document: dict[str, Any] = {}
    for key, value in pairs:
        if key in document:
            raise ValueError(f"duplicate JSON key: {key}")
        document[key] = value
    return document


def parse_time(value: str) -> datetime:
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        raise ValueError("lease expiry must be timezone-aware")
    return parsed


def load_plan(path: Path) -> tuple[str, int, list[StepDefinition]]:
    document = json.loads(
        path.read_text(encoding="utf-8"),
        object_pairs_hook=reject_duplicates,
        parse_constant=lambda value: (_ for _ in ()).throw(
            ValueError(f"non-standard JSON number: {value}")
        ),
    )
    if not isinstance(document, dict):
        raise ValueError("demo plan must be an object")
    goal = document.get("goal")
    maximum = document.get("max_parallel", 2)
    raw_steps = document.get("steps")
    if not isinstance(goal, str) or not isinstance(maximum, int):
        raise ValueError("demo goal/max_parallel are invalid")
    if not isinstance(raw_steps, list):
        raise ValueError("demo steps must be an array")
    steps: list[StepDefinition] = []
    for index, item in enumerate(raw_steps):
        if not isinstance(item, dict):
            raise ValueError(f"steps[{index}] must be an object")
        input_data = item.get("input_data", {})
        depends_on = item.get("depends_on", [])
        if not isinstance(input_data, dict) or not isinstance(depends_on, list):
            raise ValueError(f"steps[{index}] contains invalid input/dependencies")
        steps.append(
            StepDefinition(
                step_id=str(item["step_id"]),
                capability=str(item["capability"]),
                description=str(item["description"]),
                input_data=cast(dict[str, JSONValue], input_data),
                depends_on=[str(value) for value in depends_on],
                protected_action=bool(item.get("protected_action", False)),
                max_attempts=int(item.get("max_attempts", 3)),
            )
        )
    return goal, maximum, steps


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "plan",
        nargs="?",
        default=str(Path(__file__).with_name("relay_plan.json")),
    )
    args = parser.parse_args()

    goal, max_parallel, steps = load_plan(Path(args.plan))
    engine = RelayEngine(InMemoryRunStore())
    run = engine.create_run(
        run_id="run_public_demo",
        goal=goal,
        max_parallel=max_parallel,
        steps=steps,
    )

    capabilities = {step.capability for step in steps if not step.protected_action}
    duplicate_suppressed = False
    stale_lease_recovered = False
    docs_crash_simulated = False

    while True:
        claimed = engine.claim_next(
            run_id=run.run_id,
            worker_id="demo-worker",
            capabilities=capabilities,
            lease_seconds=10,
        )
        if claimed is None:
            break
        step_id = claimed.definition.step_id

        if step_id == "docs" and not docs_crash_simulated:
            docs_crash_simulated = True
            assert claimed.lease_expires_at is not None
            recovered = engine.recover_stale_leases(
                run_id=run.run_id,
                now=parse_time(claimed.lease_expires_at) + timedelta(seconds=1),
            )
            stale_lease_recovered = recovered == 1
            continue

        result = execute_step(claimed.definition)
        key = f"demo:{step_id}:{claimed.attempts}"
        receipt = engine.record_result(
            run_id=run.run_id,
            step_id=step_id,
            worker_id="demo-worker",
            idempotency_key=key,
            expected=result.expected,
            observed=result.observed,
            result=result.result,
            artifact_digests=result.artifact_digests,
        )
        if step_id == "tests":
            duplicate = engine.record_result(
                run_id=run.run_id,
                step_id=step_id,
                worker_id="duplicate-delivery",
                idempotency_key=key,
                expected="duplicate payload is ignored",
                observed="duplicate payload is ignored",
                result="error",
            )
            duplicate_suppressed = duplicate.receipt_id == receipt.receipt_id

    current = engine.get_run(run.run_id)
    deploy = current.steps["deploy"]
    if deploy.status is StepStatus.PENDING:
        approval = engine.request_approval(
            run_id=run.run_id,
            step_id="deploy",
            action="Deploy Relay to an isolated Google Cloud competition environment",
            reason="The competition requires observable Google Cloud deployment evidence.",
            cost_usd=0,
        )
    else:
        raise RuntimeError("demo did not reach the protected deployment gate")

    final = engine.get_run(run.run_id)
    output = {
        "schema": "nymrel.relay.demo.v1",
        "duplicate_suppressed": duplicate_suppressed,
        "stale_lease_recovered": stale_lease_recovered,
        "human_approval_required": True,
        "approval_id": approval.approval_id,
        "run": to_json_dict(final),
    }
    print(json.dumps(output, indent=2, sort_keys=True))
    return 0 if duplicate_suppressed and stale_lease_recovered else 1


if __name__ == "__main__":
    raise SystemExit(main())
