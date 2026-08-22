# New-work and provenance statement

## Competition period

The Google All Things Agentic submission period began August 3, 2026 and ends August 31, 2026 at 5:00 PM Pacific Time.

## Repository boundary

`nymrel/nymrel-swarm-studio` existed before this competition slice was added. Its pre-existing dashboard, design system, swarm fixtures, and repository governance are not represented as net-new competition implementation.

All Relay implementation in this entry is isolated under:

```text
competition/all-things-agentic/**
```

The path-scoped workflow added for the slice is:

```text
.github/workflows/all-things-agentic-relay.yml
```

The competition branch is:

```text
codex/all-things-agentic-relay-20260821
```

## Net-new implementation

The following were created for the competition on August 21–22, 2026:

- durable Relay run, step, lease, approval, receipt, and revision models;
- dependency-cycle rejection;
- optimistic storage concurrency;
- idempotent result recording;
- bounded retry and stale-lease recovery;
- secret-rejecting Firestore-only task input;
- Firestore transactional store;
- identifier-only Pub/Sub dispatch;
- Gemini 3.5 Flash Google ADK operator;
- deterministic Cloud Run worker handlers;
- Pub/Sub push worker;
- offline crash, duplicate-delivery, and approval demo;
- tests, packaging, Agents CLI manifest, architecture, and competition documentation.

## Reused open-source and platform dependencies

The slice uses normal published dependencies declared in `pyproject.toml`, including Google ADK, Google Cloud Firestore, Google Cloud Pub/Sub, FastAPI, Uvicorn, Hatchling, and their transitive dependencies. Their licenses and versions must be included in the final dependency and submission review.

## Pre-existing concepts

Nymrel previously worked on bounded agent authority, evidence receipts, human escalation, and multi-agent coordination. This entry may disclose those concepts as prior context. The code, tests, adapters, demo, and competition-specific architecture in this directory are new implementation and should be judged on their submitted behavior.

## Submission rule

Final submission materials must link to this statement and must not claim that the entire Swarm Studio repository or its historical work was created during the competition period.
