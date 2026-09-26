# Dependency and Terms Preflight

Status: inventory only. No package, SDK, CLI, simulator, or emulator is installed or authorized.

## Officially suggested web path

The competition overview currently suggests:

- Node.js 20.19.0 or higher;
- Meta Immersive Web SDK (IWSDK);
- `npm create @iwsdk@latest` as the latest-version scaffold command;
- a hosted WebXR URL for judge access.

This repository currently selects Node.js 24.20.0, which is above the stated minimum. That version comparison does not establish IWSDK compatibility.

## Required dependency review before installation

| Check | Required evidence |
| --- | --- |
| Package identity | Exact registry package, publisher, source repository, and official documentation link |
| Version | Exact resolved version; no floating `latest` in committed automation |
| Integrity | Lockfile entry and registry integrity digest |
| License | Package and transitive license inventory compatible with repository and submission use |
| Terms | Controlling IWSDK, Meta developer, VR Start, and distribution terms reviewed |
| Security | Known-vulnerability scan and maintainer/provenance review |
| Scripts | Install and lifecycle scripts reviewed before execution |
| Network | Domains contacted by install, development, build, and runtime documented |
| Data | Confirmation that no credential, telemetry, or private data is required for the fixture slice |
| Reproducibility | Clean install and deterministic build procedure |
| Removal | Reversible rollback path that restores the current static app |

## Prohibited shortcuts

Do not:

- run `npm create @iwsdk@latest` before the package and generated dependency graph are reviewed;
- accept Meta or Devpost terms through a CLI or web flow;
- enable billing, claim promotional credits, add a payment method, or create a wallet;
- place secrets or account identifiers in source, fixtures, logs, screenshots, or receipts;
- deploy a preview merely to test whether the scaffold works;
- describe an unreviewed simulator as equivalent to Meta hardware;
- replace exact-pinned repository dependencies with ranges to accommodate the experiment;
- weaken the existing static truth, audit, coverage, or bundle boundaries.

## Proposed reversible integration shape

If authorized, IWSDK should be isolated behind an experiment-local adapter:

- `experiments/meta-vr-start-2026/src/domain/**`: framework-neutral spatial scene and proposal types;
- `experiments/meta-vr-start-2026/src/fixtures/**`: synthetic deterministic data;
- `experiments/meta-vr-start-2026/src/adapters/iwsdk/**`: IWSDK-specific rendering and hands input;
- `experiments/meta-vr-start-2026/test/**`: schema, reducer, interaction-contract, and fixture tests;
- `experiments/meta-vr-start-2026/evidence/**`: generated receipts with no secrets or local paths.

This shape is a proposal, not authorization to create the directories or install dependencies.

## Legal gate

The official rules state that they are a contract and include indemnities and limitations of rights and remedies. Registration and participation also require factual eligibility representations. Review and explicit acceptance by an authorized human are required before the studio takes an action that binds an entrant.

The following remain unresolved:

- exact Meta developer account and Developer Access state;
- active VR Start membership and associated email;
- entrant form (individual, team, or organization);
- representative authority;
- age, jurisdiction, employment, conflict, and one-entry-limit facts;
- controlling Meta, VR Start, IWSDK, developer, distribution, and Devpost terms;
- publication, trademark/publicity, indemnity, moral-rights, and remedy provisions.

No work item may convert “unresolved” into “accepted” or “true” by inference.
