import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  evaluateSyntheticSnapshot,
  replaySyntheticSnapshots,
  REPLAY_REASONS,
} from '../src/mock/opportunityReplay';
import type { SyntheticOpportunity, SyntheticSnapshot } from '../src/mock/opportunityReplay';
import { computeWeightedScore } from '../src/mock/incomeRegistry';

function opportunity(id = 'synthetic-high', score = 5): SyntheticOpportunity {
  return {
    id,
    economics: {
      demand: score, timeToFirstDollar: score, recurring: score, reuse: score,
      distribution: score, margin: score, fulfillment: score, proof: score,
    },
    authority: { state: 'available', validFromMs: 0, expiresAtMs: 10_000 },
    evidence: { state: 'present', observedAtMs: 0, expiresAtMs: 5_000 },
    deadlineAtMs: 7_000,
    estimatedDurationMs: 1_000,
  };
}

const fallback: SyntheticOpportunity = {
  ...opportunity('synthetic-fallback', 2),
  authority: { state: 'available', validFromMs: 0, expiresAtMs: 20_000 },
  evidence: { state: 'present', observedAtMs: 0, expiresAtMs: 20_000 },
  deadlineAtMs: 20_000,
};

function snapshot(candidate = opportunity(), nowMs = 1_000): SyntheticSnapshot {
  return { nowMs, candidates: [candidate, fallback] };
}

describe('offline synthetic opportunity replay', () => {
  it('ranks eligible opportunities using the existing economic formula', () => {
    const receipt = evaluateSyntheticSnapshot(snapshot());
    expect(receipt.recommendedCandidateId).toBe('synthetic-high');
    expect(receipt.rankedEligibleIds).toEqual(['synthetic-high', 'synthetic-fallback']);
    expect(receipt.assessments.find(c => c.candidateId === 'synthetic-high')?.economicScore)
      .toBe(computeWeightedScore(opportunity().economics));
    expect(receipt.synthetic).toBe(true);
    expect(receipt.authorityGranted).toBe(false);
  });

  it.each([
    ['missing authority', { authority: null }, 'authority-missing'],
    ['withdrawn authority', { authority: { state: 'withdrawn', validFromMs: 0, expiresAtMs: 10_000 } }, 'authority-withdrawn'],
    ['future authority', { authority: { state: 'available', validFromMs: 2_000, expiresAtMs: 10_000 } }, 'authority-not-yet-valid'],
    ['expired authority', { authority: { state: 'available', validFromMs: 0, expiresAtMs: 1_000 } }, 'authority-expired'],
    ['missing evidence', { evidence: null }, 'evidence-missing'],
    ['disputed evidence', { evidence: { state: 'disputed', observedAtMs: 0, expiresAtMs: 5_000 } }, 'evidence-disputed'],
    ['future evidence', { evidence: { state: 'present', observedAtMs: 2_000, expiresAtMs: 5_000 } }, 'evidence-not-yet-observed'],
    ['stale evidence', { evidence: { state: 'present', observedAtMs: 0, expiresAtMs: 1_000 } }, 'evidence-stale'],
    ['impossible deadline', { deadlineAtMs: 1_999 }, 'deadline-impossible'],
  ] as const)('excludes the maximum-score candidate for %s with a specific reason', (_name, change, reason) => {
    const receipt = evaluateSyntheticSnapshot(snapshot({ ...opportunity(), ...change }));
    expect(receipt.recommendedCandidateId).toBe('synthetic-fallback');
    expect(receipt.rankedEligibleIds).toEqual(['synthetic-fallback']);
    expect(receipt.assessments.find(c => c.candidateId === 'synthetic-high')).toEqual({
      candidateId: 'synthetic-high', economicScore: 60, eligibleInThisSnapshot: false, reasons: [reason],
    });
    expect(REPLAY_REASONS[reason].length).toBeGreaterThan(0);
  });

  it('retains all blocking reasons in authority, evidence, deadline order', () => {
    const candidate: SyntheticOpportunity = {
      ...opportunity(),
      authority: { state: 'withdrawn', validFromMs: 0, expiresAtMs: 1_000 },
      evidence: { state: 'disputed', observedAtMs: 0, expiresAtMs: 1_000 },
      deadlineAtMs: 999,
    };
    expect(evaluateSyntheticSnapshot(snapshot(candidate)).assessments[1]?.reasons).toEqual([
      'authority-withdrawn', 'authority-expired', 'evidence-disputed', 'evidence-stale', 'deadline-impossible',
    ]);
  });

  it('replays withdrawal, evidence changes and deadline changes without carrying eligibility', () => {
    const high = opportunity();
    const receipts = replaySyntheticSnapshots([
      snapshot(high),
      snapshot({ ...high, authority: { ...high.authority!, state: 'withdrawn' } }, 2_000),
      snapshot({ ...high, evidence: { ...high.evidence!, state: 'disputed' } }, 3_000),
      snapshot({ ...high, evidence: null }, 4_000),
      snapshot(high, 5_000),
      snapshot({ ...high, evidence: { ...high.evidence!, expiresAtMs: 15_000 }, deadlineAtMs: 5_999 }, 5_000),
      snapshot({ ...high, evidence: { ...high.evidence!, expiresAtMs: 15_000 } }, 6_000),
      snapshot({ ...high, evidence: { ...high.evidence!, expiresAtMs: 15_000 }, deadlineAtMs: 15_000 }, 10_000),
    ]);
    expect(receipts.map(r => r.recommendedCandidateId)).toEqual([
      'synthetic-high', 'synthetic-fallback', 'synthetic-fallback', 'synthetic-fallback',
      'synthetic-fallback', 'synthetic-fallback', 'synthetic-high', 'synthetic-fallback',
    ]);
    expect(receipts.map(r => r.assessments[1]?.reasons)).toEqual([
      [], ['authority-withdrawn'], ['evidence-disputed'], ['evidence-missing'], ['evidence-stale'],
      ['deadline-impossible'], [], ['authority-expired'],
    ]);
    expect(receipts.every(r => r.authorityGranted === false)).toBe(true);
  });

  it('advancing only the clock invalidates a previous recommendation at evidence expiry', () => {
    const candidates = [opportunity()];
    const [before, after] = replaySyntheticSnapshots([
      { nowMs: 4_999, candidates }, { nowMs: 5_000, candidates },
    ]);
    expect(before?.recommendedCandidateId).toBe('synthetic-high');
    expect(after?.recommendedCandidateId).toBeNull();
    expect(after?.assessments[0]?.reasons).toEqual(['evidence-stale']);
    expect(after?.receiptDigest).not.toBe(before?.receiptDigest);
    expect(after).not.toHaveProperty('authority');
  });

  it('clock-only deadline deterioration excludes a candidate even with current evidence and authority', () => {
    const high = { ...opportunity(), deadlineAtMs: 2_000 };
    expect(evaluateSyntheticSnapshot(snapshot(high, 1_000)).recommendedCandidateId).toBe('synthetic-high');
    expect(evaluateSyntheticSnapshot(snapshot(high, 1_001)).assessments[1]?.reasons).toEqual(['deadline-impossible']);
  });

  it('empty inputs and all ineligible inputs have no recommendation', () => {
    expect(evaluateSyntheticSnapshot({ nowMs: 0, candidates: [] }).recommendedCandidateId).toBeNull();
    expect(evaluateSyntheticSnapshot({ nowMs: 0, candidates: [{ ...opportunity(), authority: null }] }).rankedEligibleIds).toEqual([]);
    expect(replaySyntheticSnapshots([])).toEqual([]);
  });

  it('all input permutations use the same tie break and produce the same entire receipt', () => {
    const a = opportunity('A');
    const b = opportunity('a');
    const c = opportunity('z');
    const permutations = [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]];
    const expected = evaluateSyntheticSnapshot({ nowMs: 1_000, candidates: permutations[0]! });
    expect(expected.rankedEligibleIds).toEqual(['A', 'a', 'z']);
    for (const candidates of permutations) expect(evaluateSyntheticSnapshot({ nowMs: 1_000, candidates })).toEqual(expected);
  });

  it('identical complete snapshots produce identical receipts without clock or history dependencies', () => {
    const input = snapshot();
    const expected = evaluateSyntheticSnapshot(input);
    evaluateSyntheticSnapshot(snapshot({ ...opportunity(), authority: null }));
    expect(evaluateSyntheticSnapshot(structuredClone(input))).toEqual(expected);
    const { receiptDigest, ...body } = expected;
    expect(receiptDigest).toBe(`0x${createHash('sha256').update(JSON.stringify(body)).digest('hex')}`);
  });

  it('binds complete modeled inputs even when economic totals and outcomes are unchanged', () => {
    const first = opportunity('same', 3);
    const second = { ...first, economics: { ...first.economics, demand: 4, recurring: 2 } };
    const a = evaluateSyntheticSnapshot(snapshot(first));
    const b = evaluateSyntheticSnapshot(snapshot(second));
    expect(a.assessments).toEqual(b.assessments);
    expect(a.inputDigest).not.toBe(b.inputDigest);
    expect(a.receiptDigest).not.toBe(b.receiptDigest);
  });

  it('does not mutate inputs or expose input references in output', () => {
    const input = snapshot();
    const saved = structuredClone(input);
    Object.freeze(input.candidates);
    Object.freeze(input);
    const receipt = evaluateSyntheticSnapshot(input);
    expect(input).toEqual(saved);
    const serialised = JSON.stringify(receipt);
    Object.assign(input.candidates[0]!.economics, { demand: 1 });
    expect(JSON.stringify(receipt)).toBe(serialised);
  });

  it.each([NaN, Infinity, -1, 0.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid clock %s', nowMs => {
    expect(() => evaluateSyntheticSnapshot(snapshot(opportunity(), nowMs))).toThrow(RangeError);
  });

  it.each([
    { id: '' }, { id: '  ' }, { id: 'synthetic-fallback' },
    { estimatedDurationMs: -1 }, { deadlineAtMs: Infinity },
    { authority: { state: 'available', validFromMs: 10, expiresAtMs: 10 } },
    { evidence: { state: 'present', observedAtMs: 20, expiresAtMs: 10 } },
    { economics: { ...opportunity().economics, demand: 6 } },
  ] as const)('rejects malformed fixture %j', change => {
    expect(() => evaluateSyntheticSnapshot(snapshot({ ...opportunity(), ...change }))).toThrow();
  });

  it('rejects unsupported synthetic states instead of silently treating them as available', () => {
    const candidate = opportunity();
    const invalidAuthority = { ...candidate, authority: { ...candidate.authority, state: 'granted' } };
    const invalidEvidence = { ...candidate, evidence: { ...candidate.evidence, state: 'verified' } };
    expect(() => evaluateSyntheticSnapshot(snapshot(invalidAuthority as SyntheticOpportunity))).toThrow(TypeError);
    expect(() => evaluateSyntheticSnapshot(snapshot(invalidEvidence as SyntheticOpportunity))).toThrow(TypeError);
  });
});
