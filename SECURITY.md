# Security policy

## Supported code

Security fixes target the current `main` branch. This repository is a static reference interface, not a security control, agent runtime, or audit service.

## Actual security boundary

The built application:

- reads bundled synthetic fixtures;
- updates in-memory browser state;
- computes local SHA-256 leaves and aggregate roots for those fixtures;
- makes no application-level network requests;
- has no authentication, secrets, persistent storage, backend, shell, filesystem, provider, payment, or deployment integration.

Displayed allow, block, sandbox, approval, diff, rollback, cost, and worker states are examples. A displayed hash establishes only that the bundled local algorithm produced the shown value. It does not establish provenance, authenticity, immutability, enforcement, or third-party verification.

## Browser hardening

The static-host header policy denies application connections, framing, forms, objects, and browser capabilities. Scripts and fonts are same-origin. Inline styles remain enabled because the current React views use style props for data-driven layout; no untrusted HTML is rendered, and scripts do not allow inline execution. Any future untrusted content or backend integration must remove that assumption and receive a new threat model.

Dependencies install with lifecycle scripts disabled in CI. GitHub Actions are pinned by immutable commit, workflows use least-privilege permissions, releases package prebuilt bytes, and static checks reject misleading capability claims.

## Integration requirements

Before connecting an agent, repository, model provider, telemetry stream, file operation, command, credential, network destination, deployment provider, or persistent store:

1. define the trust boundary and data classification;
2. authenticate and authorize every operation server-side;
3. validate schemas at every external boundary;
4. add idempotency, audit retention, revocation, and failure-mode design;
5. protect against request forgery, injection, path traversal, secret exposure, replay, and confused-deputy behavior;
6. prove that UI labels reflect captured backend state rather than optimistic client state;
7. complete independent security review and operator acceptance.

Do not reuse the fixture decision labels as an enforcement implementation.

## Reporting

Report vulnerabilities privately to `security@nymrel.com`. Include the affected commit, reproduction steps, impact, and any suggested mitigation. Do not include real credentials, customer information, or destructive proof-of-concept payloads.
