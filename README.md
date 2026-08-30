# Nymrel Swarm Studio

Nymrel Swarm Studio is a private, fixture-driven reference interface for exploring multi-agent workspace, review, routing, and integrity-log patterns. It is a static React application. It does not connect to agents, repositories, model providers, telemetry, shells, filesystems, sandboxes, deployment platforms, or billing systems.

The interface deliberately resembles an operator deck so interaction and information architecture can be evaluated before an integration exists. Every worker, path, event, cost, token count, decision, progress value, and hash is synthetic. Buttons update browser memory only.

## Capability boundary

What this repository provides:

- responsive, accessible examples for worker rosters, decisions, protected-action review, diffs, progress, and workspace inspection;
- deterministic local fixture playback;
- a small synchronous SHA-256 and Merkle-root helper used to demonstrate locally consistent hashes;
- explicit loading-safe render boundaries and no outbound application requests;
- source-backed unit tests, coverage thresholds, static truth checks, bundle budgets, dependency audit, and pinned CI actions.

What it does not provide:

- agent orchestration, execution, dispatch, approvals, or writer fencing;
- repository inspection, file edits, commits, rollbacks, or deployments;
- security interception, credential protection, policy enforcement, provenance, attestations for displayed events, or immutable audit storage;
- provider usage, live telemetry, current pricing, customer data, savings, revenue, or production analytics;
- conformance with an external agent-to-UI protocol.

Treat any future integration as a separate security and product lane. Do not infer backend capability from this interface.

## Stack

- React 19.2
- Vite 8 with the React/Oxc plugin
- TypeScript 7 in strict mode
- Vitest 4 with V8 coverage
- Oxlint
- Node.js 22.12 through 26; `.node-version` selects Node 24.20.0 for local work
- npm 11

Dependencies are exact-pinned in `package.json` and locked in `package-lock.json`. The application is marked `private`; it is not an npm package.

## Local verification

```powershell
npm ci --ignore-scripts
npm run check
npm run audit:ci
```

`npm run check` runs lint, strict type checking, direct-source tests with coverage, static truth validation, the production build, and the compressed bundle budget.

For local UI review:

```powershell
npm run dev
```

The development server binds only to `127.0.0.1` and fails if port `5173` is unavailable. Stop it when review is complete.

## Architecture

| Area | Purpose |
| --- | --- |
| `src/mock/` | Synthetic fixtures, deterministic playback helpers, and local hash utilities |
| `src/state/swarmStore.ts` | In-memory external store; playback starts only while a React consumer is subscribed |
| `src/components/` | Fixture views and capability-boundary UI |
| `src/styles/main.css` | Warm-paper tokens, responsive layout, visible focus, and reduced-motion behavior |
| `test/` | Vitest tests that import the real TypeScript sources |
| `scripts/` | Truth and bundle-budget gates |
| `.github/workflows/` | CI, security linting, and immutable release-artifact automation |

## Delivery posture

CI builds a static `dist` artifact. A tagged release may package those exact bytes with a checksum and GitHub artifact attestation. Creating a release does not deploy the application, connect a backend, or prove public availability.

Cloudflare Pages can consume `dist` through `wrangler.toml`, but provider access, account configuration, domains, environment policy, and deployment remain explicit operator gates.

## Security and disclosures

Read [SECURITY.md](SECURITY.md) before reporting a vulnerability or proposing an integration. Product and security claims must preserve the capability boundary above.

Copyright © 2026 Nymrel. MIT licensed.
