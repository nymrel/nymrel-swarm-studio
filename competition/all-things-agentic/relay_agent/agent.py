"""Google ADK operator for the Nymrel Relay competition slice."""

from __future__ import annotations

import json
import os
import threading
from typing import Any

from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types

from relay_core import InMemoryRunStore, RelayEngine, StepDefinition, to_json_dict
from relay_google import DispatchEnvelope, FirestoreRunStore, PubSubDispatcher

MODEL = os.getenv("RELAY_MODEL", "gemini-3.5-flash")
MAX_STEPS = 12
_STORE: Any | None = None
_STORE_LOCK = threading.Lock()


def _reject_duplicate_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    document: dict[str, Any] = {}
    for key, value in pairs:
        if key in document:
            raise ValueError(f"duplicate JSON key: {key}")
        document[key] = value
    return document


def _store() -> Any:
    global _STORE
    if _STORE is not None:
        return _STORE
    with _STORE_LOCK:
        if _STORE is not None:
            return _STORE
        mode = os.getenv("RELAY_STORE", "memory").strip().lower()
        if mode == "firestore":
            _STORE = FirestoreRunStore(
                project=os.getenv("GOOGLE_CLOUD_PROJECT"),
                collection=os.getenv("RELAY_FIRESTORE_COLLECTION", "nymrel_relay_runs"),
            )
        elif mode == "memory":
            _STORE = InMemoryRunStore()
        else:
            raise ValueError("RELAY_STORE must be memory or firestore")
        return _STORE


def _engine() -> RelayEngine:
    return RelayEngine(_store())


def _allowed_capabilities() -> set[str]:
    configured = os.getenv(
        "RELAY_ALLOWED_CAPABILITIES",
        "public_research,validation,documentation,review,deployment",
    )
    values = {item.strip() for item in configured.split(",") if item.strip()}
    if not values:
        raise ValueError("RELAY_ALLOWED_CAPABILITIES must not be empty")
    return values


def create_relay_run(goal: str, steps_json: str, max_parallel: int = 3) -> dict[str, Any]:
    """Create a bounded durable run from a JSON array of step specifications.

    Each step may contain step_id, capability, description, depends_on,
    protected_action, and max_attempts. Capabilities must be allowlisted.
    Protected steps cannot execute until a human approval is recorded outside
    the ADK agent.
    """

    try:
        raw = json.loads(steps_json, object_pairs_hook=_reject_duplicate_pairs)
        if not isinstance(raw, list) or not 1 <= len(raw) <= MAX_STEPS:
            raise ValueError(f"steps_json must contain 1-{MAX_STEPS} steps")
        allowed = _allowed_capabilities()
        definitions: list[StepDefinition] = []
        for index, item in enumerate(raw):
            if not isinstance(item, dict):
                raise ValueError(f"step {index} must be an object")
            supported = {
                "step_id",
                "capability",
                "description",
                "depends_on",
                "protected_action",
                "max_attempts",
            }
            unknown = set(item) - supported
            if unknown:
                raise ValueError(f"step {index} has unsupported keys: {sorted(unknown)}")
            step_id = item.get("step_id")
            capability = item.get("capability")
            description = item.get("description")
            if not all(isinstance(value, str) for value in (step_id, capability, description)):
                raise ValueError(f"step {index} id, capability, and description must be strings")
            if capability not in allowed:
                raise ValueError(f"step {index} capability is not allowlisted: {capability}")
            depends_on = item.get("depends_on", [])
            if not isinstance(depends_on, list) or not all(
                isinstance(value, str) for value in depends_on
            ):
                raise ValueError(f"step {index} depends_on must be a string array")
            protected = item.get("protected_action", False)
            if not isinstance(protected, bool):
                raise ValueError(f"step {index} protected_action must be boolean")
            max_attempts = item.get("max_attempts", 3)
            if not isinstance(max_attempts, int) or isinstance(max_attempts, bool):
                raise ValueError(f"step {index} max_attempts must be an integer")
            definitions.append(
                StepDefinition(
                    step_id=step_id,
                    capability=capability,
                    description=description,
                    depends_on=list(depends_on),
                    protected_action=protected,
                    max_attempts=max_attempts,
                )
            )
        run = _engine().create_run(
            goal=goal,
            steps=definitions,
            max_parallel=max_parallel,
        )
        return {"success": True, "run": to_json_dict(run)}
    except (KeyError, TypeError, ValueError) as exc:
        return {"success": False, "reason_code": "invalid_run_plan", "message": str(exc)}


def get_relay_run(run_id: str) -> dict[str, Any]:
    """Return the durable state of a Relay run without provider credentials."""

    try:
        run = _engine().get_run(run_id)
        return {"success": True, "run": to_json_dict(run)}
    except KeyError:
        return {"success": False, "reason_code": "run_not_found"}


def request_human_approval(
    run_id: str,
    step_id: str,
    action: str,
    reason: str,
    cost_usd: float = 0,
) -> dict[str, Any]:
    """Prepare a human approval request for one protected step.

    This tool cannot approve or deny the request. A separate authenticated human
    surface must resolve it.
    """

    try:
        approval = _engine().request_approval(
            run_id=run_id,
            step_id=step_id,
            action=action,
            reason=reason,
            cost_usd=cost_usd,
        )
        return {
            "success": True,
            "approval": to_json_dict(approval),
            "human_decision_required": True,
        }
    except (KeyError, TypeError, ValueError) as exc:
        return {"success": False, "reason_code": "approval_request_rejected", "message": str(exc)}


def dispatch_ready_step(
    run_id: str,
    worker_id: str,
    capabilities_csv: str,
) -> dict[str, Any]:
    """Lease one ready step and dispatch its identifier through Google Pub/Sub.

    The message excludes the goal, prompts, credentials, and approval notes.
    Workers retrieve authorized state from Firestore. If dispatch fails, the
    lease expires and can be recovered; the agent never claims execution.
    """

    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "").strip()
    topic = os.getenv("RELAY_PUBSUB_TOPIC", "").strip()
    if not project_id or not topic:
        return {"success": False, "reason_code": "pubsub_not_configured"}
    capabilities = {item.strip() for item in capabilities_csv.split(",") if item.strip()}
    try:
        engine = _engine()
        step = engine.claim_next(
            run_id=run_id,
            worker_id=worker_id,
            capabilities=capabilities,
        )
        if step is None:
            return {"success": True, "dispatched": False, "reason_code": "no_ready_step"}
        run = engine.get_run(run_id)
        key = f"{run_id}:{step.definition.step_id}:{step.attempts}"
        message_id = PubSubDispatcher(project_id=project_id, topic=topic).publish(
            DispatchEnvelope(
                schema="nymrel.relay.dispatch.v1",
                run_id=run_id,
                step_id=step.definition.step_id,
                worker_id=worker_id,
                capability=step.definition.capability,
                revision=run.revision,
                idempotency_key=key,
            )
        )
        return {
            "success": True,
            "dispatched": True,
            "message_id": message_id,
            "run_id": run_id,
            "step_id": step.definition.step_id,
            "worker_id": worker_id,
            "idempotency_key": key,
        }
    except (KeyError, PermissionError, RuntimeError, TypeError, ValueError) as exc:
        return {"success": False, "reason_code": "dispatch_failed", "message": str(exc)}


def recover_stale_relay_leases(run_id: str) -> dict[str, Any]:
    """Recover expired worker leases without repeating completed effects."""

    try:
        recovered = _engine().recover_stale_leases(run_id=run_id)
        return {"success": True, "recovered": recovered}
    except (KeyError, ValueError) as exc:
        return {"success": False, "reason_code": "recovery_failed", "message": str(exc)}


root_agent = Agent(
    name="relay_operator",
    model=Gemini(
        model=MODEL,
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    description=(
        "Plans and monitors bounded long-running work, preserving durable state, "
        "evidence receipts, retries, and human approval boundaries."
    ),
    instruction="""
You are the Nymrel Relay operator. Convert a bounded operator goal into a small,
acyclic plan and use the available tools to create and monitor it.

Rules:
- Use only allowlisted capabilities and at most 12 steps.
- Mark deployment, publication, spending, account changes, merges, legal terms,
  payments, transactions, and other external writes as protected_action=true.
- You may request a human approval; you can never approve or deny it yourself.
- Never claim a step ran merely because it was queued or dispatched.
- Treat missing evidence as blocked or inconclusive, not success.
- Never include credentials, secrets, private customer data, or chain-of-thought
  in run plans, Pub/Sub messages, receipts, or responses.
- Report exact run, step, approval, message, and reason identifiers.
- Preserve the distinction between observed evidence and certification.
""".strip(),
    tools=[
        create_relay_run,
        get_relay_run,
        request_human_approval,
        dispatch_ready_step,
        recover_stale_relay_leases,
    ],
)

app = App(name="relay_agent", root_agent=root_agent)
