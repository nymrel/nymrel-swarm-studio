# Start contributing

Nymrel Swarm Studio is a public, MIT-licensed reference interface. It runs on synthetic fixtures in browser memory, not on live agents or private studio systems. The `private: true` npm setting prevents accidental package publication; it does not make the GitHub repository private.

## Run the existing project

Install a supported Node.js version from `.node-version` / `package.json` and the npm version pinned in `package.json`. From a fresh clone:

```sh
git clone https://github.com/nymrel/nymrel-swarm-studio.git
cd nymrel-swarm-studio
node --version
npm --version
npm ci --ignore-scripts
npm run check
npm run audit:ci
npm run dev
```

Open the loopback URL printed by Vite. Stop the server with Ctrl+C when finished. Installing dependencies and auditing require network access; the application itself does not connect to external systems. No private account or API key is needed. A registry or network failure is not a passing install or test result.

To submit changes, fork the repository, clone your fork, create a focused branch, and open a pull request against this repository's main branch. Keep `upstream` pointed at this repository and use the existing lockfile. Do not commit generated dependencies, builds, logs containing secrets, or personal archive data.

## Choose one small task

| Task | Starting point | Useful outcome |
| --- | --- | --- |
| [Search whitespace regression](https://github.com/nymrel/nymrel-swarm-studio/issues/33) | `src/components/ScenarioIntegrityLog.tsx` | Padded searches behave consistently, with a real regression test |
| [Score boundary tests](https://github.com/nymrel/nymrel-swarm-studio/issues/34) | `test/income-registry.test.ts` | Direct-source tests protect valid totals and invalid numeric inputs |
| [Independent quickstart reproduction](https://github.com/nymrel/nymrel-swarm-studio/issues/35) | README and CONTRIBUTING | A truthful clean-clone report or a reproduced documentation fix |

Check the issue and open PRs before starting. A short approach comment helps avoid duplicate work; it is not an exclusive claim, payment promise, or requirement to wait before investigating a bug. Broader ideas are welcome as scoped proposals.

## What makes a useful pull request

Explain the user outcome, affected files, criteria completed and work remaining. Link partial work with `Refs #number`; close an issue only when all its criteria are met. Tests should import real source code. For behavior fixes, show the regression failing before the fix and passing afterward when feasible.

Record the tested commit and actual check results. Use `not run` with a reason when needed. For UI changes, include synthetic desktop/mobile screenshots and keyboard, focus and reduced-motion observations. Documentation-only contributions should identify the exact correction and focused validation; cosmetic changes or hidden verification comments do not implement a feature.

AI-assisted contributions are welcome. The submitter remains responsible for understanding the diff, checking its claims and preserving third-party attribution. Do not include private prompts, credentials, customer data or unrelated generated files.

## Review, credit and payment

Maintainers inspect the diff and dependency/workflow changes before approving fork CI. A held workflow is pending, not passed or failed. See [the maintainer review guide](maintainer-triage.md) and [CONTRIBUTING](../CONTRIBUTING.md).

Accepted external work is credited through original commit ancestry or accurate co-authorship and release notes. [LORDSINE's registry contribution](https://github.com/nymrel/nymrel-swarm-studio/pull/25) was incorporated through [maintainer integration #27](https://github.com/nymrel/nymrel-swarm-studio/pull/27); it remains an illustrative five-row fixture, not verified revenue evidence.

An issue label, third-party bounty listing, bot claim, submitted wallet address or merged PR does not create a payment commitment. Work is unpaid unless a maintainer explicitly publishes approved funding terms for that issue before the work is accepted.

Report security concerns privately through [SECURITY.md](../SECURITY.md), not with sensitive data in a public issue. Follow the existing [MIT license](../LICENSE); submitting a contribution does not transfer repository administration or production access.
