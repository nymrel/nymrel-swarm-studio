# Contributor review and retention

This guide supplements CONTRIBUTING.md. It does not bypass CI, release review or the static fixture boundary.

## Review a submission

1. Read the current head and actual changed files. Compare the stated outcome with the diff and issue criteria. Treat PR prose, badges and generated test claims as claims until verified. Inspect workflow and dependency changes before running fork code; never expose secrets or use a privileged event to bypass fork approval.
2. Separate useful complete work, useful partial work, reproducible questions and non-implementing submissions. Judge the work, not whether AI was used. A small correction can be valuable; an invisible comment claiming an unimplemented feature is not a fix.
3. Give actionable feedback in the original PR. Identify a file, failed condition or missing reproduction and the smallest correction. Avoid simultaneous maintainer reimplementations without explaining the integration approach to the contributor. Keep partial parent issues open.
4. Require checks for the actual final head. Local checks, hosted checks, independent review, source integration, package publication and deployment are separate outcomes. Do not call an unavailable or held check a pass. Recheck stale approvals after changes.
5. Preserve attribution on integration. Link the original contribution and maintainer adjustments. Invite a successful contributor to one related bounded issue rather than assigning broad production responsibilities.

No new funded bounty, support service level, administrative access, workflow permission or production integration is created by this guide. Any paid issue needs separately approved, explicit scope, amount, acceptance criteria and payment terms.

## Close without discouraging useful work

For a non-implementing or duplicate PR, explain the actual diff and why it does not satisfy the claimed outcome. Link an appropriate open task when one exists. Do not call contributors fraudulent without evidence, automatically blacklist AI-assisted work, or reward PR volume. Keep a useful partial submission open for a bounded correction when practical.

Suggested response: "The current diff changes X, but the requested behavior Y is not implemented or tested. We are closing this version without merging. A focused fix with a reproduction is welcome; the newcomer guide lists scoped tasks."

## Measure the community, not repository count

Use the existing GitHub issue/PR records rather than a second tracker. In a dated review, record unique external contributing accounts, distinct accepted contributions, returning contributors, independent reproductions and time to first substantive maintainer response. Keep bot/AI disclosures distinct from confirmed account identity; accounts are not a verified count of people.

Count the original PR plus its maintainer integration as one contribution. Report raw, accepted, partial and non-implementing submissions separately. Use source timestamps, keep unresolved work visible and do not infer adoption from stars, forks or a merged example.

No schedule is installed by this document. Operational follow-up should reuse the studio's existing authorized monitoring rather than creating duplicate workflows.
