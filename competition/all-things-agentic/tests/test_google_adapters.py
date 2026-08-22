from __future__ import annotations

import json
import unittest

from relay_google import DispatchEnvelope, PubSubDispatcher


class _Future:
    def __init__(self, message_id: str) -> None:
        self.message_id = message_id

    def result(self, timeout: float | None = None) -> str:
        assert timeout is not None
        return self.message_id


class _Publisher:
    def __init__(self) -> None:
        self.calls: list[tuple[str, bytes, dict[str, str]]] = []

    def topic_path(self, project_id: str, topic: str) -> str:
        return f"projects/{project_id}/topics/{topic}"

    def publish(self, topic: str, payload: bytes, **attributes: str) -> _Future:
        self.calls.append((topic, payload, attributes))
        return _Future("message-123")


class GoogleAdapterTests(unittest.TestCase):
    def test_pubsub_envelope_is_bounded_and_excludes_run_content(self) -> None:
        publisher = _Publisher()
        dispatcher = PubSubDispatcher(
            project_id="relay-demo",
            topic="relay-work",
            publisher=publisher,
        )
        message_id = dispatcher.publish(
            DispatchEnvelope(
                schema="nymrel.relay.dispatch.v1",
                run_id="run_123",
                step_id="validate",
                worker_id="validator-1",
                capability="validation",
                revision=4,
                idempotency_key="run_123:validate:1",
            )
        )
        self.assertEqual(message_id, "message-123")
        topic, payload, attributes = publisher.calls[0]
        self.assertEqual(topic, "projects/relay-demo/topics/relay-work")
        document = json.loads(payload)
        self.assertEqual(document["run_id"], "run_123")
        self.assertEqual(document["worker_id"], "validator-1")
        self.assertEqual(attributes["capability"], "validation")
        self.assertNotIn("goal", document)
        self.assertNotIn("secret", payload.decode("utf-8").lower())
        self.assertLess(len(payload), 16_384)

    def test_invalid_topic_and_schema_fail_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "topic"):
            PubSubDispatcher(
                project_id="relay-demo",
                topic="bad topic",
                publisher=_Publisher(),
            )
        dispatcher = PubSubDispatcher(
            project_id="relay-demo",
            topic="relay-work",
            publisher=_Publisher(),
        )
        with self.assertRaisesRegex(ValueError, "schema"):
            dispatcher.publish(
                DispatchEnvelope(
                    schema="unsupported",
                    run_id="run_123",
                    step_id="validate",
                    worker_id="validator-1",
                    capability="validation",
                    revision=0,
                    idempotency_key="key",
                )
            )


if __name__ == "__main__":
    unittest.main()
