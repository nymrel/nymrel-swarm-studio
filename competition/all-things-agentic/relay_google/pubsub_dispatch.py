"""Pub/Sub dispatch adapter for ready Relay steps.

Messages contain identifiers and capability metadata only. Goals, prompts, secrets,
and approval notes remain in Firestore and are retrieved by an authorized worker.
"""

from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from typing import Any

_TOPIC = re.compile(r"^[A-Za-z][A-Za-z0-9._~-]{2,254}$")


@dataclass(frozen=True, slots=True)
class DispatchEnvelope:
    schema: str
    run_id: str
    step_id: str
    worker_id: str
    capability: str
    revision: int
    idempotency_key: str


class PubSubDispatcher:
    def __init__(
        self,
        *,
        project_id: str,
        topic: str,
        publisher: Any | None = None,
    ) -> None:
        if not project_id.strip():
            raise ValueError("project_id must not be empty")
        if not _TOPIC.fullmatch(topic):
            raise ValueError("topic contains unsupported characters")
        try:
            from google.cloud import pubsub_v1
        except ImportError as exc:  # pragma: no cover - requires Google dependency
            if publisher is None:
                raise RuntimeError(
                    "google-cloud-pubsub is required for PubSubDispatcher"
                ) from exc
            pubsub_v1 = None
        self._publisher = publisher or pubsub_v1.PublisherClient()
        self._topic_path = self._publisher.topic_path(project_id, topic)

    def publish(self, envelope: DispatchEnvelope, timeout: float = 30) -> str:
        if envelope.schema != "nymrel.relay.dispatch.v1":
            raise ValueError("unsupported dispatch envelope schema")
        if envelope.revision < 0:
            raise ValueError("revision must be non-negative")
        for label, value in (
            ("run_id", envelope.run_id),
            ("step_id", envelope.step_id),
            ("worker_id", envelope.worker_id),
            ("capability", envelope.capability),
            ("idempotency_key", envelope.idempotency_key),
        ):
            if not value.strip() or len(value) > 200:
                raise ValueError(f"{label} must contain 1-200 characters")

        payload = json.dumps(
            asdict(envelope),
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")
        if len(payload) > 16_384:
            raise ValueError("dispatch envelope exceeds the 16 KiB Relay limit")
        future = self._publisher.publish(
            self._topic_path,
            payload,
            schema=envelope.schema,
            capability=envelope.capability,
        )
        return str(future.result(timeout=timeout))
