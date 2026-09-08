# Contributing

Nymrel Swarm Studio is intentionally narrow: a truthful, static reference interface. Contributions must preserve that boundary.

## Setup

Use Node.js 22.12 through 26 and npm 11. The repository default is recorded in `.node-version`.

```powershell
npm ci --ignore-scripts
npm run check
npm run audit:ci
```

Use `npm run dev` only for bounded local review and stop the server afterward.

## Change requirements

- Keep every worker, event, cost, path, decision, and metric visibly labeled as synthetic or illustrative.
- Do not imply a backend, live telemetry, execution, enforcement, persistence, provider integration, deployment, revenue, customer, pricing, or protocol conformance that the repository cannot prove.
- Import real TypeScript sources in tests. Do not test copied implementations.
- Preserve keyboard access, visible focus, reduced motion, responsive layouts, and meaningful empty/error states.
- Validate external data with a schema before adding any integration.
- Keep dependencies exact-pinned and explain new runtime dependencies.
- Do not weaken CI, truth checks, security headers, bundle budgets, or workflow permissions to make a change pass.

## Pull requests

Keep changes scoped and include:

- the user outcome and capability boundary;
- tests and validation commands;
- screenshots for visible changes at desktop and mobile widths;
- security, accessibility, performance, and migration notes where relevant;
- any external gate that remains unproven.

Maintainers may require an independent acceptance review for production-impacting or trust-sensitive changes.
