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
| [Independent quickstart reproduction](https://github.com/nymrel/nymrel-swarm-studio/issues/35) | README and CONTRIBUTING | A truthful clean-clone report or a reproduced documentation fix |

Check the issue and open PRs before starting. A short approach comment helps avoid duplicate work; it is not an exclusive claim, payment promise, or requirement to wait before investigating a bug. A successful reproduction is useful too; no cosmetic PR is needed for a report. [Score boundary coverage #34](https://github.com/nymrel/nymrel-swarm-studio/issues/34) already has [dbdefault's contribution #38](https://github.com/nymrel/nymrel-swarm-studio/pull/38), preserved in this onboarding integration; please avoid duplicating it.

## Bring an original idea

Ideas we have not thought of are welcome, including opportunities that span Nymrel projects. Describe the problem or opportunity, who could benefit, and what you are unsure about. Hypotheses, examples and a smallest experiment are helpful when you have them. Code, proposed files, a finished specification and acceptance criteria are not prerequisites for an early idea.

Use the contribution proposal form or an existing related issue. For an idea spanning repositories, keep one proposal in the most relevant repository and link the other projects rather than opening duplicates. Maintainers can help turn a promising idea into a bounded experiment. Build-ready proposals should then identify scope, observable acceptance and planned validation; review and release requirements still apply.

## Contribute from a phone or through an agent

You can report an observation, ask a question or propose an idea through GitHub on your phone without setting up a development machine. For a mobile observation, include the page or source revision if known, device/browser, viewport if known, steps and what you actually saw. Redact private information. This is useful feedback; it does not establish the full clean-clone acceptance in #35 or a live backend.

Agents can use their supported development environment and the same contribution requirements. Disclose meaningful AI assistance, understand the submitted changes and report the checks actually run. Neither a human nor an agent needs private studio credentials to contribute to this reference interface.

## What makes a useful pull request

Explain the user outcome, affected files, criteria completed and work remaining. Link partial work with `Refs #number`; close an issue only when all its criteria are met. Tests should import real source code. For behavior fixes, show the regression failing before the fix and passing afterward when feasible.

Record the tested commit and actual check results. Use `not run` with a reason when needed. For UI changes, include synthetic desktop/mobile screenshots and keyboard, focus and reduced-motion observations. Documentation-only contributions should identify the exact correction and focused validation; cosmetic changes or hidden verification comments do not implement a feature.

AI-assisted contributions are welcome. The submitter remains responsible for understanding the diff, checking its claims and preserving third-party attribution. Do not include private prompts, credentials, customer data or unrelated generated files.

## Review, credit and payment

Maintainers inspect the diff and dependency/workflow changes before approving fork CI. A held workflow is pending, not passed or failed. See [the maintainer review guide](maintainer-triage.md) and [CONTRIBUTING](../CONTRIBUTING.md).

Accepted external work is credited through original commit ancestry or accurate co-authorship and release notes. [LORDSINE's registry contribution](https://github.com/nymrel/nymrel-swarm-studio/pull/25) was incorporated through [maintainer integration #27](https://github.com/nymrel/nymrel-swarm-studio/pull/27); it remains an illustrative five-row fixture, not verified revenue evidence.

[dbdefault's score-boundary tests](https://github.com/nymrel/nymrel-swarm-studio/pull/38) cover both endpoints, invalid numeric values across all eight dimensions and missing fields. Their original commits are retained in this maintainer integration; the contributor-closed PR remains available as the original discussion.

An issue label, third-party bounty listing, bot claim, submitted wallet address or merged PR does not create a payment commitment. Work is unpaid unless a maintainer explicitly publishes approved funding terms for that issue before the work is accepted.

Report security concerns privately through [SECURITY.md](../SECURITY.md), not with sensitive data in a public issue. Follow the existing [MIT license](../LICENSE); submitting a contribution does not transfer repository administration or production access.
