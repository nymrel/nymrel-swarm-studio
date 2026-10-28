# Income evidence snapshot: candidate verification

Verified October 20, 2026. Application, tests and browser-review script:
`99b68f7b575ce4f131e662154951f6ade85398d6`, based on main
`d32b57699c2433f1a8201274a58d5c8c86735515`. This receipt is a subsequent
documentation-only commit. Hosted checks and repository review remain separate.

## Local gate

Linux, Node.js 24.19.0, pinned npm 11.19.1. Locked install with lifecycle scripts
disabled completed successfully. The exact application commit passed:

| Command | Result |
| --- | --- |
| `npm run check` | Pass: lint, strict types, 46 tests in 5 files, coverage, truth checks, build and unchanged bundle budgets |
| `npm run audit:ci` | Pass: zero reported vulnerabilities |
| `git diff --check` | Pass |

Coverage was 100% for the configured `src/mock/**/*.ts` scope, including the new
assessment helpers. This is not whole-application/UI coverage. The unchanged
30 baseline tests plus 16 new cases passed. Static truth checks covered 28 product
surfaces. Built output measured 319,964 raw bytes / 94,628 gzip bytes; largest
JavaScript gzip was 88,715 bytes, within the unchanged 135,000-byte budget.

The original five fixture values and scorer were not changed. The new scorer's
complete-input result is tested against the original function. Schema tests reject
missing provenance, malformed values, duplicate identities, unknown references
and promotion of a document into verified payment behavior. No app dependency,
lockfile, workflow, security header, coverage threshold or release trigger changed.

## Browser review

Playwright 1.62.1, Chromium 153.0.8010.0, axe-core 4.10.3. Review tools were
installed outside the repository. The script starts a local production preview
and closes it afterward; no production provider or account is involved.

Viewports: 1440×1100, 390×844 and 320×844. At each width the script verified:

- sixteen real snapshot entries; whitespace/case-normalized search; lane filters;
  empty-state recovery and restoration of the full portfolio;
- native keyboard expansion of score/payment evidence, source-anchor navigation,
  visible keyboard focus, and the original five-row example view and totals;
- keyboard scrolling of the named example table region at phone widths;
- no document overflow in either view, and none after doubling every computed
  registry text size (a text-resize simulation, not native browser zoom);
- reduced-motion emulation, zero page errors and zero attempted external requests;
- nine axe scans: snapshot, expanded detail and original examples at all three
  widths; zero reported violations.

The browser regression initially exposed intrinsic grid sizing that widened the
old example table's page on mobile. A `minmax(0, 1fr)` track fixed it. The 320px
doubled-text check also exposed long asset headings; wrapping fixed those. Both
remain covered by the reusable browser script.

The default snapshot and representative Website Intelligence card screenshots
were visually inspected. Full results:
[browser-results.json](evidence/income-registry-evidence/browser-results.json).

| View | Desktop | Phone | Narrow phone |
| --- | --- | --- | --- |
| Default view | [1440](evidence/income-registry-evidence/evidence-1440.png) | [390](evidence/income-registry-evidence/evidence-390.png) | [320](evidence/income-registry-evidence/evidence-320.png) |
| Evidence card | [1440](evidence/income-registry-evidence/assessment-1440.png) | [390](evidence/income-registry-evidence/assessment-390.png) | [320](evidence/income-registry-evidence/assessment-320.png) |

## Reproduce

Install the repository's pinned dependencies with lifecycle scripts disabled,
then run its standard check and audit commands. Install Playwright/Chromium and
axe-core in a separate review directory if not already available. Build first:

```sh
npm run build
INCOME_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
INCOME_BROWSER_PATH=/absolute/path/to/chromium \
INCOME_AXE_PATH=/absolute/path/to/axe-core/axe.min.js \
node scripts/review-income-registry.mjs
```

The script can use a normally installed Playwright browser when the module/path
overrides are omitted. `INCOME_REVIEW_URL` defaults to loopback port 4275 and must
remain on `127.0.0.1`. Set `INCOME_USE_EXISTING_PREVIEW=1` only when reusing a local
preview in the same network environment. Without `INCOME_AXE_PATH`, interaction
checks still run but the report contains no automated accessibility scans; do not
claim an axe pass from such a run.

## Limits

This is local Chromium/automated accessibility evidence and source review, not
independent maintainer acceptance, an accessibility certification, Safari/Firefox
coverage, assistive-technology acceptance or physical touch-device testing.
Search-retrieved public pages can lag production and do not bind a deployment to
a source revision. No new live payment read, purchase, genuine buyer test,
fulfillment, renewal or margin measurement was performed. Hosted CI must pass
for the published head before integration; #21 remains open.
