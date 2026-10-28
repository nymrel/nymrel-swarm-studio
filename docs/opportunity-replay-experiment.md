# Offline synthetic opportunity replay

Refs [issue #21](https://github.com/nymrel/nymrel-swarm-studio/issues/21).
This is an experimental, local extension of the existing illustrative scorer.
It asks whether a recommendation changes when a complete synthetic snapshot
changes authority, evidence, or deadline feasibility. It supplies no demand,
revenue, production routing, scheduling-safety, or adopted-policy evidence.

The [owner's earlier experiment](https://github.com/nymrel/nymrel-swarm-studio/issues/21#issuecomment-5882459952)
proposes authority and deadline gates before economics and explicitly remains
unadopted. This smaller replay tests snapshot eligibility and receipts only.
It does not implement that proposal's deadline-slack scheduling, approval lanes,
exception workflow, or unknown-duration investigation. It does not reproduce
the earlier experiment's trial counts or scheduling results.

## Source and scope

Base/main inspected: `a99fbf5d48b354a1d9e2e37e192a0dd0f95e9c59`.
Read `README.md`, `SECURITY.md`, `CONTRIBUTING.md`,
`src/mock/incomeRegistry.ts`, its tests, and
`docs/income-registry-verification.md` before implementation.

- `src/mock/opportunityReplay.ts`: pure snapshot evaluator and independent replay.
- `test/opportunity-replay.test.ts`: direct-source scenario and boundary tests.
- This document: experimental contract, observed results, and limits.

The original five registry rows, `computeWeightedScore`, UI, state store,
dependencies, workflows, security headers, and existing tests are untouched.
The evaluator imports the existing scorer and local SHA-256 helper. No product
component imports the evaluator. There is no backend, dispatch, scheduler,
authority grant, permission change, persistence, or external integration.
Fixtures use generic synthetic IDs and invented times; they contain no customer,
provider, private-repository, or credential data.

Open work inspected on October 22, 2026: PR #37 covers the separate public-source
registry evidence view, PR #38 covers original scorer boundaries, and PR #28
proposes separate registry types/scoring/validation. None changes these three
new paths. This experiment does not adopt or replace those proposals. Issue #21
remains open and its commercial validation work is not completed here.

## Experimental contract

Every call supplies the clock and the complete candidate list. Each candidate
has unique nonempty ID, the existing economic dimensions, synthetic authority
and evidence facts (or explicit `null`), a deadline, and an estimated duration.
Times and durations are nonnegative safe integer milliseconds in an invented
timeline. Zero duration is allowed; reversed/empty validity intervals, invalid
numbers/states, duplicate IDs, and invalid scores throw instead of producing a
partial recommendation. This typed local fixture API is not an external schema.

1. Authority must be present, available, and inside `[validFromMs, expiresAtMs)`.
2. Evidence must be present, undisputed, and inside `[observedAtMs, expiresAtMs)`.
3. Duration must fit in `deadlineAtMs - nowMs`. An exact fit is feasible; an
   already-passed deadline is infeasible even for zero-duration work.
4. Only candidates with no blocking reasons are ranked by the unchanged
   economic score, descending. Equal scores use ascending JavaScript string
   code-unit order for IDs, independent of locale and input permutation.
5. The first eligible ID is the snapshot recommendation. Empty or entirely
   ineligible inputs return `null`. All candidates retain their score and every
   blocking reason, ordered authority, evidence, then deadline.

`REPLAY_REASONS` gives an explanation for each code, including distinct missing,
stale, disputed, future, withdrawn, and expired conditions. A 60-point candidate
cannot outrank a 24-point candidate after any eligibility gate fails.

Receipts contain the policy version, explicit `synthetic: true` and
`authorityGranted: false`, evaluated clock, input checksum, assessments, ordered
eligible IDs, recommendation, and receipt checksum. The input checksum binds an
explicit canonical array of modeled fields, including each score dimension.
The receipt checksum binds the resulting body via the existing SHA-256 helper.
Neither checksum is a signature, provenance proof, authorization, or persistent
audit record. Extra unmodeled properties are outside the checksum contract.

Repeated complete inputs produce identical receipts. Candidate permutations
produce identical receipts, including ties. Replay preserves caller snapshot
order and independently recomputes each snapshot; it accepts no prior receipt
or inherited eligibility. A historical receipt remains historical, with its
evaluation time; it cannot establish current eligibility.

## Observed synthetic replay

The direct-source transition test uses a 60-point `synthetic-high` candidate
and a 24-point `synthetic-fallback`. The latter stays eligible throughout.
Every row supplies a complete snapshot. Restoration in a later row requires a
new explicit available/current fact in that row; it is never inferred.

| Clock (ms) | Change to high candidate | Recommendation | High candidate reason |
| --- | --- | --- | --- |
| 1,000 | Initial complete facts | synthetic-high | none |
| 2,000 | Authority withdrawn | synthetic-fallback | authority-withdrawn |
| 3,000 | Authority available; evidence disputed | synthetic-fallback | evidence-disputed |
| 4,000 | Evidence absent | synthetic-fallback | evidence-missing |
| 5,000 | Original evidence reaches expiry | synthetic-fallback | evidence-stale |
| 5,000 | Fresh evidence; duration 1,000, deadline 5,999 | synthetic-fallback | deadline-impossible |
| 6,000 | Fresh evidence; duration 1,000, deadline 7,000 | synthetic-high | none (exact fit) |
| 10,000 | Fresh evidence and later deadline; authority expires | synthetic-fallback | authority-expired |

Additional tests move only the clock from 4,999 to 5,000 to expire evidence,
and from 1,000 to 1,001 to make an exact-fit deadline impossible. They also
cover simultaneous blockers, empty/all-ineligible inputs, all six permutations
of a three-way tie, receipt repetition, equal economic totals from different
dimension inputs, malformed fixtures, no input mutation/output aliasing, and
receipt hashing checked against Node's independent crypto implementation.

## Validation

Local Linux, Node 24.19.0, pinned npm 11.19.1 on October 22, 2026:

```sh
corepack npm@11.19.1 ci --ignore-scripts --no-audit --no-fund
corepack npm@11.19.1 run check
corepack npm@11.19.1 run audit:ci
git diff --check
```

Locked install passed with lifecycle scripts disabled. The complete check passed:
63 tests in five files (33 new replay tests), configured mock-source coverage
100% for statements/branches/functions/lines, lint, strict types, static truth
across 25 surfaces, production build, and existing bundle budgets. Total gzip
bytes: 85,048; largest JavaScript gzip bytes: 79,529.

The high-severity audit gate exited 0, but the audit reports **three moderate
findings**, involving `@vitest/mocker` and its Vitest/coverage dependents:
GHSA-qxg6-89mg-rqv8 and GHSA-xp26-3454-mjgp. No dependency update or audit fix
was applied in this experiment. A passing high-severity gate does not mean a
zero-finding audit.

No browser review was run because there is no visible change or product import.
Hosted CI, the Node 22/26 matrix, independent maintainer acceptance, and any
future integration review are separate from these local results.

## Limits

Eligibility is checked at the supplied instant only. Authority/evidence may
expire during estimated work. The experiment models no resource contention,
queue delay, dependencies, execution duration uncertainty, preemption, urgency
ordering, completion events, real permission semantics, or ongoing revocation
channel. A high-score feasible candidate may still delay a more urgent feasible
candidate. Therefore the ranked list is not a safe schedule or an execution
instruction. Real authority, evidence credibility, deadline confidence, and
commercial outcomes cannot be inferred from these synthetic fields or hashes.
