from __future__ import annotations

import unittest

from relay_core import (
    InMemoryRunStore,
    RelayEngine,
    StepDefinition,
    run_from_document,
    run_to_document,
)


class RelayInputPolicyTests(unittest.TestCase):
    def test_safe_input_round_trips_through_durable_state(self) -> None:
        step = StepDefinition(
            step_id="validate",
            capability="validation",
            description="Validate a synthetic public fixture.",
            input_data={
                "checks": [
                    {"name": "unit", "passed": True},
                    {"name": "schema", "passed": True},
                ],
                "artifact_digests": ["sha256:abc"],
            },
        )
        engine = RelayEngine(InMemoryRunStore())
        run = engine.create_run(goal="Validate fixture.", steps=[step])
        restored = run_from_document(run_to_document(run))
        self.assertEqual(
            restored.steps["validate"].definition.input_data,
            step.input_data,
        )

    def test_secret_like_keys_fail_closed_at_any_depth(self) -> None:
        for value in (
            {"api_key": "not-allowed"},
            {"nested": {"access_token": "not-allowed"}},
            {"headers": {"authorization": "Bearer not-allowed"}},
            {"payment": {"card_number": "not-allowed"}},
        ):
            with self.subTest(value=value):
                with self.assertRaisesRegex(ValueError, "forbidden key"):
                    StepDefinition(
                        step_id="blocked",
                        capability="validation",
                        description="Reject secret input.",
                        input_data=value,
                    )

    def test_oversize_and_nonstandard_numbers_fail_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "exceeds"):
            StepDefinition(
                step_id="oversize",
                capability="validation",
                description="Reject large input.",
                input_data={"public_text": "x" * 9000},
            )
        with self.assertRaisesRegex(ValueError, "strict JSON"):
            StepDefinition(
                step_id="nan",
                capability="validation",
                description="Reject NaN.",
                input_data={"score": float("nan")},
            )


if __name__ == "__main__":
    unittest.main()
