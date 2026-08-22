from __future__ import annotations

import unittest

from relay_core import create_receipt, digest_json


class ReceiptTests(unittest.TestCase):
    def test_receipt_normalizes_text_and_sorts_valid_digests(self) -> None:
        first = "sha256:" + "b" * 64
        second = "sha256:" + "a" * 64
        receipt = create_receipt(
            run_id=" run_1 ",
            step_id=" step_1 ",
            idempotency_key=" delivery_1 ",
            expected=" checks pass ",
            observed=" all checks passed ",
            result="pass",
            artifact_digests=[first, second],
        )
        self.assertEqual(receipt.run_id, "run_1")
        self.assertEqual(receipt.step_id, "step_1")
        self.assertEqual(receipt.expected, "checks pass")
        self.assertEqual(receipt.artifact_digests, [second, first])
        self.assertTrue(receipt.receipt_digest.startswith("sha256:"))
        self.assertEqual(receipt.claims["security_certification"], False)

    def test_empty_or_oversize_evidence_statements_fail_closed(self) -> None:
        for expected, observed in (
            ("", "observed"),
            ("expected", ""),
            ("x" * 1001, "observed"),
            ("expected", "x" * 2001),
        ):
            with self.subTest(expected=len(expected), observed=len(observed)):
                with self.assertRaisesRegex(ValueError, "must contain"):
                    create_receipt(
                        run_id="run",
                        step_id="step",
                        idempotency_key="key",
                        expected=expected,
                        observed=observed,
                        result="pass",
                    )

    def test_invalid_duplicate_and_excess_digests_fail_closed(self) -> None:
        valid = "sha256:" + "a" * 64
        invalid = [
            "sha256:abc",
            "sha256:" + "A" * 64,
            "md5:" + "a" * 64,
        ]
        for digest in invalid:
            with self.subTest(digest=digest[:16]):
                with self.assertRaisesRegex(ValueError, "artifact_digests"):
                    create_receipt(
                        run_id="run",
                        step_id="step",
                        idempotency_key="key",
                        expected="expected",
                        observed="observed",
                        result="pass",
                        artifact_digests=[digest],
                    )
        with self.assertRaisesRegex(ValueError, "unique"):
            create_receipt(
                run_id="run",
                step_id="step",
                idempotency_key="key",
                expected="expected",
                observed="observed",
                result="pass",
                artifact_digests=[valid, valid],
            )
        with self.assertRaisesRegex(ValueError, "at most 32"):
            create_receipt(
                run_id="run",
                step_id="step",
                idempotency_key="key",
                expected="expected",
                observed="observed",
                result="pass",
                artifact_digests=[f"sha256:{index:064x}" for index in range(33)],
            )

    def test_canonical_digest_rejects_nonstandard_numbers(self) -> None:
        with self.assertRaisesRegex(ValueError, "strict JSON"):
            digest_json({"score": float("nan")})


if __name__ == "__main__":
    unittest.main()
