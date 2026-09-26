# Hands-First Interactions and Evaluation

## Organizer requirements translated into testable contracts

| Official requirement or judging signal | Testable contract |
| --- | --- |
| End-to-end usable without controllers | Every primary flow has a gaze/hand path; controller input is never required |
| Seated and stationary | All required targets remain usable within a two-foot radius |
| Fast cold start | A first-time evaluator can reach a complete inspect-and-decide moment quickly |
| Meaningful agentic interaction | The user can inspect an agent proposal, supporting evidence, and a protected-action decision |
| Technical reliability | Fixed fixtures replay deterministically and invalid states fail closed |
| Polish and presentation | Text remains legible, focus state visible, controls consistent, and errors actionable |
| Public video under three minutes | The demo plan must show the complete loop and state the evidence runtime |

## Primary interaction loop

1. **Orient:** user sees the Queue, Evidence rail, Decision well, Timeline, and Boundary panel.
2. **Select:** gaze focuses one synthetic job; pinch opens it.
3. **Inspect:** grab and move evidence cards; scroll within bounded panels.
4. **Trace:** scrub the timeline to see deterministic state transitions and linked receipts.
5. **Decide:** choose confirm or cancel on a proposal.
6. **Verify:** the system records only a local decision receipt and reiterates that execution authority is absent.
7. **Reset:** return to the initial fixture state without network access or persistent external mutation.

## Interaction rules

- Gaze focus must have a visible state before pinch activation.
- Pinch must not share a gesture with grab/move when a destructive-looking choice is focused.
- Consequential confirmation requires a distinct, deliberate action and must offer cancel.
- Targets must remain reachable without standing, turning fully around, or exceeding the two-foot design radius.
- Scrollable surfaces must expose bounds and prevent content from becoming irretrievable.
- Reduced-motion and high-contrast modes must remain compatible with the core flow.
- The Boundary panel must be reachable at every stage.

## Fixture manifest

The first authorized implementation should define only synthetic records:

| Fixture | Minimum fields | Purpose |
| --- | --- | --- |
| Worker | stable ID, display label, status, synthetic capability list | Populate Queue context |
| Job | stable ID, requested outcome, state, timestamps, worker ID | Primary selected object |
| Evidence receipt | stable ID, job ID, source label, digest, observed time, limitations | Evidence rail |
| Proposal | stable ID, job ID, action kind, target, reversibility, required authority | Decision well |
| Decision receipt | stable ID, proposal ID, local decision, decided time, execution=false | Verify proposal-only behavior |
| Timeline event | stable ID, job ID, event kind, time, linked receipt IDs | Trace state progression |

No fixture may contain a real credential, customer record, private repository path, personal email, wallet, billing identifier, or production endpoint.

## Evaluation matrix

| Scenario | Expected result |
| --- | --- |
| Complete happy path | User reaches a local decision receipt without a controller or network |
| Missing evidence | Confirmation disabled; limitation shown |
| Unknown action kind | Fixture rejected before rendering a decision control |
| Duplicate stable ID | Fixture rejected fail-closed |
| Unavailable execution authority | Proposal may be reviewed; execution remains impossible |
| Attempted external URL | Rejected by fixture validation |
| Interaction outside radius | Test fails; layout must be corrected |
| Reduced-motion mode | Core path completes without motion-dependent meaning |
| Restart | Deterministic initial state restored |

## Evidence separation

Results must identify the exact environment:

- **Static/unit:** schema, reducer, and deterministic fixture checks.
- **Desktop browser:** pointer/keyboard approximation only; never called hand tracking.
- **XR simulator or emulator:** report exact tool and version.
- **Meta device:** report exact device and build only when actually tested.

Passing one level does not establish another. In particular, desktop interaction tests do not prove hands-first usability on Meta hardware.

## Demo evidence plan

A future demo should remain under three minutes and show:

1. the capability boundary;
2. one job selected by hands-first input;
3. evidence and timeline inspection;
4. a protected-action proposal;
5. explicit human confirmation;
6. a local receipt with `execution=false`;
7. the exact simulator, emulator, or device provenance.

No recording or upload is authorized by this packet.
