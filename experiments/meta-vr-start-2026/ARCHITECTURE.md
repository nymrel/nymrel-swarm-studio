# Spatial Ops Room Architecture

This is a design contract, not an implemented system.

## Reusable ownership

| Repository | Reusable responsibility | Not authorized here |
| --- | --- | --- |
| `nymrel/nymrel-swarm-studio` | Product owner, operator-deck shell, local fixture playback, protected-action review, responsive UI | Live agent execution, provider calls, deployment |
| `nymrel/builderwars` | Receipt, replay, evidence, and approval-lineage schema inspiration | Runtime dependency or cross-repository copy without provenance review |
| `nymrel/nymrel-mcp-hub` | Future provider-neutral surety, proof, and swarm tool-contract boundary | Network transport, credentials, or tool invocation |
| `nymrel/nymrel-agent` | Body-free job and lifecycle receipt fixture shapes | Hosted agents, keys, or write-capable tools |

Swarm Studio is the sole product and UI owner. No second app or prize-only repository is planned.

## Proposed local-only flow

1. A deterministic fixture bundle supplies synthetic jobs, workers, evidence receipts, decision gates, and timeline events.
2. A fixture adapter normalizes those records into a spatial scene model.
3. A hands-first interaction layer exposes gaze focus, pinch selection, grab/move, bounded scroll, and explicit confirm/cancel.
4. A proposal reducer records local in-memory intent. It cannot execute a protected action.
5. A receipt presenter shows the proposed action, evidence lineage, decision state, and capability boundary.
6. An evaluation harness replays fixed scenarios and records deterministic expected outcomes.

No component requires outbound network access in Stage 0 or the first implementation slice.

## Spatial zones

| Zone | Purpose | Hands-first behavior |
| --- | --- | --- |
| Queue | Prioritized synthetic worker jobs | Gaze to focus; pinch to open |
| Evidence rail | Receipts, diffs, lineage, and timestamps | Grab to inspect; bounded two-axis scroll |
| Decision well | Proposed protected action and policy context | Pinch confirm/cancel; deliberate hold for consequential confirmation |
| Timeline | Incident or job-state history | Grab scrubber; snap to deterministic events |
| Boundary panel | Current limitations and data provenance | Always reachable; cannot be dismissed permanently |

## Capability boundary

The experience may visualize and locally transform synthetic fixtures. It may not:

- dispatch an agent;
- mutate a repository, filesystem, account, deployment, payment, or external service;
- claim that displayed hashes prove external provenance;
- imply live telemetry, current cost, real usage, customer data, or immutable audit storage;
- convert a proposal into execution;
- hide simulator, emulator, or headset evidence provenance.

## Delivery posture

If implementation becomes authorized, the smallest slice should remain inside `experiments/meta-vr-start-2026/**` and preserve the repository's existing fixture-driven truth boundary. Any future IWSDK adapter must sit behind an explicit interface so the interaction model and evaluation fixtures remain reusable outside the competition.

## Trust boundaries

| Boundary | Required behavior |
| --- | --- |
| Fixture to scene | Validate required fields, reject unknown action kinds, and preserve stable identifiers |
| Interaction to proposal | Produce intent only; never invoke a provider or write-capable tool |
| Proposal to confirmation | Show affected object, requested action, evidence, reversibility, and unavailable authority |
| Evaluation to claim | Report only measured fixtures and the exact runtime used |
| Build to deployment | Separate operator gate; no implicit publish step |
