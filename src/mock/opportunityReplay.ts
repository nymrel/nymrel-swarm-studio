import type { IncomeScoreDimensions } from '../types';
import { computeWeightedScore } from './incomeRegistry';
import { computeSha256 } from './merkle';

/** Offline experiment only: supplied facts are synthetic, never an authority grant. */
export const REPLAY_POLICY = 'synthetic-opportunity-replay-v1' as const;

export interface SyntheticOpportunity {
  readonly id: string;
  readonly economics: Readonly<IncomeScoreDimensions>;
  readonly authority: {
    readonly state: 'available' | 'withdrawn';
    readonly validFromMs: number;
    readonly expiresAtMs: number;
  } | null;
  readonly evidence: {
    readonly state: 'present' | 'disputed';
    readonly observedAtMs: number;
    readonly expiresAtMs: number;
  } | null;
  readonly deadlineAtMs: number;
  readonly estimatedDurationMs: number;
}

export interface SyntheticSnapshot {
  readonly nowMs: number;
  readonly candidates: readonly SyntheticOpportunity[];
}

export const REPLAY_REASONS = {
  'authority-missing': 'No synthetic authority fact was supplied for this snapshot.',
  'authority-withdrawn': 'The supplied synthetic authority is withdrawn.',
  'authority-not-yet-valid': 'The synthetic authority interval has not started.',
  'authority-expired': 'The synthetic authority interval has ended.',
  'evidence-missing': 'No synthetic evidence was supplied for this snapshot.',
  'evidence-disputed': 'The supplied synthetic evidence is disputed.',
  'evidence-not-yet-observed': 'The evidence observation is later than this snapshot.',
  'evidence-stale': 'The synthetic evidence expiry has been reached.',
  'deadline-impossible': 'The supplied duration does not fit before the deadline at this clock value.',
} as const;

export type ReplayReason = keyof typeof REPLAY_REASONS;

export interface SyntheticAssessment {
  readonly candidateId: string;
  readonly economicScore: number;
  readonly eligibleInThisSnapshot: boolean;
  readonly reasons: readonly ReplayReason[];
}

export interface SyntheticReplayReceipt {
  readonly policy: typeof REPLAY_POLICY;
  readonly synthetic: true;
  readonly authorityGranted: false;
  readonly evaluatedAtMs: number;
  readonly inputDigest: string;
  readonly assessments: readonly SyntheticAssessment[];
  readonly rankedEligibleIds: readonly string[];
  readonly recommendedCandidateId: string | null;
  /** Local content checksum, not provenance, authorization, or an audit signature. */
  readonly receiptDigest: string;
}

function validTime(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError('Synthetic times and durations must be nonnegative safe integer milliseconds.');
  }
}

function validInterval(start: number, end: number): void {
  validTime(start);
  validTime(end);
  if (end <= start) throw new RangeError('Synthetic intervals must end after they start.');
}

// Explicit code-unit order, independent of locale or the caller's array order.
function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * Recompute a recommendation from one complete snapshot. No previous receipt,
 * wall clock, storage, network, dispatch, or UI state participates. Eligibility
 * describes this instant only; it does not prove eligibility throughout work.
 */
export function evaluateSyntheticSnapshot(snapshot: SyntheticSnapshot): SyntheticReplayReceipt {
  validTime(snapshot.nowMs);
  const seen = new Set<string>();
  const candidates = [...snapshot.candidates].sort((a, b) => compareIds(a.id, b.id));
  const canonicalInputs: unknown[] = [];
  const assessments = candidates.map((candidate): SyntheticAssessment => {
    if (typeof candidate.id !== 'string' || candidate.id.trim().length === 0 || seen.has(candidate.id)) {
      throw new TypeError('Synthetic candidate IDs must be nonempty and unique.');
    }
    seen.add(candidate.id);
    validTime(candidate.deadlineAtMs);
    validTime(candidate.estimatedDurationMs);
    const economicScore = computeWeightedScore(candidate.economics);
    const reasons: ReplayReason[] = [];
    const { authority, evidence } = candidate;

    if (authority === null) {
      reasons.push('authority-missing');
    } else {
      validInterval(authority.validFromMs, authority.expiresAtMs);
      if (!['available', 'withdrawn'].includes(authority.state)) throw new TypeError('Invalid synthetic authority state.');
      if (authority.state === 'withdrawn') reasons.push('authority-withdrawn');
      if (snapshot.nowMs < authority.validFromMs) reasons.push('authority-not-yet-valid');
      if (snapshot.nowMs >= authority.expiresAtMs) reasons.push('authority-expired');
    }

    if (evidence === null) {
      reasons.push('evidence-missing');
    } else {
      validInterval(evidence.observedAtMs, evidence.expiresAtMs);
      if (!['present', 'disputed'].includes(evidence.state)) throw new TypeError('Invalid synthetic evidence state.');
      if (evidence.state === 'disputed') reasons.push('evidence-disputed');
      if (snapshot.nowMs < evidence.observedAtMs) reasons.push('evidence-not-yet-observed');
      if (snapshot.nowMs >= evidence.expiresAtMs) reasons.push('evidence-stale');
    }

    // Subtraction avoids overflow from adding two safe integer timestamps.
    if (candidate.estimatedDurationMs > candidate.deadlineAtMs - snapshot.nowMs) {
      reasons.push('deadline-impossible');
    }

    const d = candidate.economics;
    // Arrays give an explicit canonical field order, including dimensions with equal totals.
    canonicalInputs.push([
      candidate.id,
      [d.demand, d.timeToFirstDollar, d.recurring, d.reuse, d.distribution, d.margin, d.fulfillment, d.proof],
      authority === null ? null : [authority.state, authority.validFromMs, authority.expiresAtMs],
      evidence === null ? null : [evidence.state, evidence.observedAtMs, evidence.expiresAtMs],
      candidate.deadlineAtMs,
      candidate.estimatedDurationMs,
    ]);
    return { candidateId: candidate.id, economicScore, eligibleInThisSnapshot: reasons.length === 0, reasons };
  });

  const rankedEligibleIds = assessments
    .filter(candidate => candidate.eligibleInThisSnapshot)
    .sort((a, b) => b.economicScore - a.economicScore || compareIds(a.candidateId, b.candidateId))
    .map(candidate => candidate.candidateId);
  const body = {
    policy: REPLAY_POLICY,
    synthetic: true as const,
    authorityGranted: false as const,
    evaluatedAtMs: snapshot.nowMs,
    inputDigest: computeSha256([REPLAY_POLICY, snapshot.nowMs, canonicalInputs]),
    assessments,
    rankedEligibleIds,
    recommendedCandidateId: rankedEligibleIds[0] ?? null,
  };
  return { ...body, receiptDigest: computeSha256(body) };
}

/** Independent snapshots in caller-supplied order; no implicit carry-forward. */
export function replaySyntheticSnapshots(snapshots: readonly SyntheticSnapshot[]): readonly SyntheticReplayReceipt[] {
  return snapshots.map(evaluateSyntheticSnapshot);
}
