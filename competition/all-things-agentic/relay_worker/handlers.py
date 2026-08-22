"""Deterministic public-safe worker handlers.

The demo worker intentionally supports only capabilities that can be evaluated
from bounded Firestore input without credentials or uncontrolled side effects.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Literal
from urllib.parse import urlparse

from relay_core.models import JSONValue, StepDefinition

ResultCode = Literal["pass", "fail", "blocked", "inconclusive", "error"]


@dataclass(frozen=True, slots=True)
class HandlerResult:
    expected: str
    observed: str
    result: ResultCode
    artifact_digests: list[str]


def _artifact_digests(input_data: dict[str, JSONValue]) -> list[str]:
    raw = input_data.get("artifact_digests", [])
    if not isinstance(raw, list) or not all(isinstance(item, str) for item in raw):
        raise ValueError("artifact_digests must be a string array")
    digests = sorted(set(raw))
    if any(not value.startswith("sha256:") or len(value) != 71 for value in digests):
        raise ValueError("artifact digests must be sha256:<64 lowercase hex>")
    if any(any(character not in "0123456789abcdef" for character in value[7:]) for value in digests):
        raise ValueError("artifact digests must use lowercase hexadecimal")
    return digests


def validate_checks(step: StepDefinition) -> HandlerResult:
    raw = step.input_data.get("checks")
    if not isinstance(raw, list) or not raw:
        return HandlerResult(
            expected="one or more named deterministic checks",
            observed="no valid checks supplied",
            result="inconclusive",
            artifact_digests=[],
        )
    passed = 0
    failed = 0
    names: set[str] = set()
    for index, item in enumerate(raw):
        if not isinstance(item, dict):
            raise ValueError(f"checks[{index}] must be an object")
        name = item.get("name")
        status = item.get("passed")
        if not isinstance(name, str) or not name.strip() or len(name) > 100:
            raise ValueError(f"checks[{index}].name must contain 1-100 characters")
        if name in names:
            raise ValueError(f"duplicate check name: {name}")
        if not isinstance(status, bool):
            raise ValueError(f"checks[{index}].passed must be boolean")
        names.add(name)
        if status:
            passed += 1
        else:
            failed += 1
    total = passed + failed
    return HandlerResult(
        expected=f"all {total} named checks pass",
        observed=f"{passed} passed; {failed} failed",
        result="pass" if failed == 0 else "fail",
        artifact_digests=_artifact_digests(step.input_data),
    )


def validate_documentation(step: StepDefinition) -> HandlerResult:
    required = step.input_data.get("required_sections")
    present = step.input_data.get("present_sections")
    if not isinstance(required, list) or not all(isinstance(item, str) for item in required):
        raise ValueError("required_sections must be a string array")
    if not isinstance(present, list) or not all(isinstance(item, str) for item in present):
        raise ValueError("present_sections must be a string array")
    normalized_required = {item.strip().casefold() for item in required if item.strip()}
    normalized_present = {item.strip().casefold() for item in present if item.strip()}
    missing = sorted(normalized_required - normalized_present)
    return HandlerResult(
        expected=f"{len(normalized_required)} required documentation sections",
        observed=(
            "all required sections present"
            if not missing
            else f"{len(missing)} required sections missing: {', '.join(missing[:8])}"
        ),
        result="pass" if not missing else "fail",
        artifact_digests=_artifact_digests(step.input_data),
    )


def validate_public_sources(step: StepDefinition) -> HandlerResult:
    sources = step.input_data.get("sources")
    if not isinstance(sources, list) or not sources:
        return HandlerResult(
            expected="one or more HTTPS public-source references",
            observed="no sources supplied",
            result="inconclusive",
            artifact_digests=[],
        )
    invalid = 0
    for index, item in enumerate(sources):
        if not isinstance(item, str) or len(item) > 500:
            raise ValueError(f"sources[{index}] must be a URL string under 500 characters")
        parsed = urlparse(item)
        if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
            invalid += 1
    return HandlerResult(
        expected=f"{len(sources)} syntactically valid HTTPS public-source references",
        observed=f"{len(sources) - invalid} valid; {invalid} invalid",
        result="pass" if invalid == 0 else "fail",
        artifact_digests=_artifact_digests(step.input_data),
    )


def review_findings(step: StepDefinition) -> HandlerResult:
    findings = step.input_data.get("findings")
    if not isinstance(findings, list):
        raise ValueError("findings must be an array")
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for index, item in enumerate(findings):
        if not isinstance(item, dict):
            raise ValueError(f"findings[{index}] must be an object")
        severity = item.get("severity")
        if severity not in counts:
            raise ValueError(f"findings[{index}].severity is unsupported")
        counts[severity] += 1
    blocking = counts["critical"] + counts["high"]
    observed = "; ".join(f"{key}={value}" for key, value in counts.items())
    return HandlerResult(
        expected="zero critical or high review findings",
        observed=observed,
        result="pass" if blocking == 0 else "fail",
        artifact_digests=_artifact_digests(step.input_data),
    )


def protected_or_unsupported(step: StepDefinition) -> HandlerResult:
    return HandlerResult(
        expected=f"a separately authorized worker for capability {step.capability}",
        observed="generic Relay demo worker does not implement this capability",
        result="blocked",
        artifact_digests=[],
    )


HANDLERS: dict[str, Callable[[StepDefinition], HandlerResult]] = {
    "documentation": validate_documentation,
    "public_research": validate_public_sources,
    "review": review_findings,
    "validation": validate_checks,
}


def execute_step(step: StepDefinition) -> HandlerResult:
    if step.protected_action:
        return protected_or_unsupported(step)
    handler = HANDLERS.get(step.capability)
    if handler is None:
        return protected_or_unsupported(step)
    return handler(step)
