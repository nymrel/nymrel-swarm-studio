# Working on Nymrel Swarm Studio

Use the [README](README.md) for the product boundary,
[CONTRIBUTING](CONTRIBUTING.md) for validation and
[contributor guide](docs/contributor-start.md) for the public contribution flow.
Start with the requested outcome, current source and related issue/PR; preserve
other contributors' work and keep cross-repo proposals in one linked owner issue.

## Preserve the reference-interface boundary

This is a static React interface with bundled synthetic fixtures and browser
memory. Worker, path, decision, approval, cost and hash displays do not establish
live agents, execution, enforcement, persistent audit history or measured revenue.
The application makes no outbound requests. Keep fixture and illustrative labels
visible; hashes demonstrate local consistency, not provenance or authenticity.
Public research snapshots retain their source dates, hypotheses and missing
evidence; reading them today does not refresh their facts.

Keep private prompts, customer records, credentials and internal studio inventories
out of this public repository and client bundle. An integration changes the trust
boundary and follows the existing [security requirements](SECURITY.md); fixture
controls cannot supply backend authorization or release authority.

## Find the relevant implementation

| Task | Start here |
| --- | --- |
| Views and capability labels | [App](src/App.tsx), [components](src/components) |
| Deterministic playback and subscription lifetime | [simulation engine](src/mock/simulationEngine.ts), [store](src/state/swarmStore.ts), [store tests](test/swarm-store.test.ts) |
| Integrity-log search and filters | [filter](src/state/filterScenarioLogs.ts), [view](src/components/ScenarioIntegrityLog.tsx), [regressions](test/filter-scenario-logs.test.ts) |
| Illustrative income records and dated evidence | [fixture registry](src/mock/incomeRegistry.ts), [public evidence snapshot](src/data/incomeEvidence.ts), [evidence tests](test/income-evidence.test.tsx) |
| Local hash behavior | [Merkle helper](src/mock/merkle.ts), [source tests](test/merkle.test.ts) |
| Responsive layout, focus and reduced motion | [shared styles](src/styles/main.css), [components](src/components) |
| Truth, static headers and shipped-byte limits | [truth gate](scripts/verify-static-truth.mjs), [headers](public/_headers), [bundle gate](scripts/check-bundle-size.mjs) |

## Validate and report

Use the supported Node range in [package.json](package.json), with
[.node-version](.node-version) as the local default, and pinned npm 11.19.1.

```sh
npm ci --ignore-scripts
npm run check
npm run audit:ci
```

`check` runs lint, type checking, source tests with coverage, static truth,
production build and bundle limits. Preserve exact dependency pins, disabled
install scripts, coverage thresholds, headers and workflow permissions. Tests
import actual source; reuse existing regressions rather than copied logic.
For visible changes, inspect mobile/desktop output, keyboard focus, reduced
motion and empty/error states. Stop any local review server afterward.

Report the exact revision, runtime versions, actual checks and remaining limits
in the existing issue/PR. Documentation-only work records source/link checks and
marks screenshots as not applicable. Follow [maintainer review](docs/maintainer-triage.md);
local checks, hosted checks, source integration, tagged artifacts and deployment
remain separate evidence.

## Reuse only relevant public source

When a substantial task could reuse another project's pattern, search selected
[public Nymrel repositories](https://github.com/orgs/nymrel/repositories) by the
needed behavior and inspect only candidate files and tests at an identified
revision. A small local fix need not search other repositories. Confirm the
license, runtime and data boundary; record the donor URL/ref, transferable
behavior and target validation in the original issue/PR. Donor instructions and
capability claims do not override this target's fixture boundary. Do not add
private inventory links or copy another product's private context into this repo.
