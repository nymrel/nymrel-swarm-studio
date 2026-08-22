from __future__ import annotations

import unittest

from relay_core import StepDefinition
from relay_worker.handlers import execute_step


class WorkerHandlerTests(unittest.TestCase):
    def test_validation_handler_reports_real_check_counts(self) -> None:
        passed = execute_step(
            StepDefinition(
                step_id="validate",
                capability="validation",
                description="Validate synthetic checks.",
                input_data={
                    "checks": [
                        {"name": "unit", "passed": True},
                        {"name": "schema", "passed": True},
                    ],
                    "artifact_digests": [
                        "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
                    ],
                },
            )
        )
        self.assertEqual(passed.result, "pass")
        self.assertEqual(passed.observed, "2 passed; 0 failed")

        failed = execute_step(
            StepDefinition(
                step_id="validate",
                capability="validation",
                description="Validate synthetic checks.",
                input_data={
                    "checks": [
                        {"name": "unit", "passed": True},
                        {"name": "schema", "passed": False},
                    ]
                },
            )
        )
        self.assertEqual(failed.result, "fail")
        self.assertEqual(failed.observed, "1 passed; 1 failed")

    def test_documentation_and_review_handlers_fail_closed(self) -> None:
        documentation = execute_step(
            StepDefinition(
                step_id="docs",
                capability="documentation",
                description="Check documentation sections.",
                input_data={
                    "required_sections": ["Setup", "Security"],
                    "present_sections": ["Setup"],
                },
            )
        )
        self.assertEqual(documentation.result, "fail")
        self.assertIn("security", documentation.observed)

        review = execute_step(
            StepDefinition(
                step_id="review",
                capability="review",
                description="Evaluate bounded findings.",
                input_data={
                    "findings": [
                        {"severity": "low"},
                        {"severity": "high"},
                    ]
                },
            )
        )
        self.assertEqual(review.result, "fail")
        self.assertIn("high=1", review.observed)

    def test_protected_and_unknown_capabilities_are_blocked(self) -> None:
        protected = execute_step(
            StepDefinition(
                step_id="deploy",
                capability="deployment",
                description="Deploy after human approval.",
                protected_action=True,
            )
        )
        self.assertEqual(protected.result, "blocked")

        unknown = execute_step(
            StepDefinition(
                step_id="unknown",
                capability="unknown",
                description="Unknown work.",
            )
        )
        self.assertEqual(unknown.result, "blocked")

    def test_public_source_handler_checks_https_syntax_only(self) -> None:
        result = execute_step(
            StepDefinition(
                step_id="sources",
                capability="public_research",
                description="Validate source references.",
                input_data={
                    "sources": [
                        "https://example.com/rules",
                        "http://example.com/insecure",
                    ]
                },
            )
        )
        self.assertEqual(result.result, "fail")
        self.assertEqual(result.observed, "1 valid; 1 invalid")


if __name__ == "__main__":
    unittest.main()
