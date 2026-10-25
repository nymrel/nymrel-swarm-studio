import { describe, expect, it } from 'vitest';
import type { IncomeLaneEntry, IncomeScoreDimensions } from '../src/types';
import {
  INCOME_REGISTRY_WAVE_1,
  REGISTRY_SCORING,
  computeWeightedScore,
} from '../src/mock/incomeRegistry';

const VALID_CLASSES: IncomeLaneEntry['class'][] = [
  'Cash now',
  'Recurring',
  'Recurring / marketplace',
  'Recurring / API',
];

describe('Income Opportunity Registry fixture (illustrative excerpt)', () => {
  it('exposes the Wave 1 portfolio map rows referenced by issue #21', () => {
    expect(INCOME_REGISTRY_WAVE_1).toHaveLength(5);
    expect(INCOME_REGISTRY_WAVE_1.map((entry) => entry.asset)).toEqual([
      'Nymrel Studio / services',
      'Nymrel Website Intelligence',
      'Nymrel MCP Hub / Remote',
      'Nymrel Publisher',
      'Crawler Mesh',
    ]);
  });

  it('validates every row shape and illustrative score range', () => {
    const seenIds = new Set<string>();
    for (const entry of INCOME_REGISTRY_WAVE_1) {
      seenIds.add(entry.id);
      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(0);
      expect(typeof entry.asset).toBe('string');
      expect(entry.asset.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.incomeLanes) && entry.incomeLanes.length).toBeGreaterThan(0);
      entry.incomeLanes.forEach((lane) => expect(typeof lane).toBe('string'));
      expect(typeof entry.commercialState).toBe('string');
      expect(entry.commercialState.length).toBeGreaterThan(0);
      expect(typeof entry.primaryBlocker).toBe('string');
      expect(entry.primaryBlocker.length).toBeGreaterThan(0);
      expect(typeof entry.nextRevenueAction).toBe('string');
      expect(entry.nextRevenueAction.length).toBeGreaterThan(0);
      expect(VALID_CLASSES).toContain(entry.class);
      expect(entry.illustrativeScore).toBeTruthy();
      const score = entry.illustrativeScore! as IncomeScoreDimensions;
      expect(Object.keys(score).sort()).toEqual(
        ['demand', 'fulfillment', 'margin', 'proof', 'recurring', 'reuse', 'timeToFirstDollar', 'distribution'].sort(),
      );
      Object.values(score).forEach((value) => {
        expect(Number.isFinite(value) && value >= 1 && value <= 5).toBe(true);
      });
    }
    expect(seenIds.size).toBe(INCOME_REGISTRY_WAVE_1.length);
  });

  it('computes the weighted execution score from issue #21', () => {
    const byAsset = new Map(
      INCOME_REGISTRY_WAVE_1.map((entry) => [entry.asset, entry]),
    );

    const expected: Record<string, number> = {
      'Nymrel Studio / services': 44,
      'Nymrel Website Intelligence': 44,
      'Nymrel MCP Hub / Remote': 44,
      'Nymrel Publisher': 37,
      'Crawler Mesh': 45,
    };

    for (const [asset, total] of Object.entries(expected)) {
      const entry = byAsset.get(asset)!;
      expect(entry.illustrativeScore).toBeTruthy();
      expect(computeWeightedScore(entry.illustrativeScore!)).toBe(total);
    }
  });

  const base: IncomeScoreDimensions = {
    demand: 3,
    timeToFirstDollar: 3,
    recurring: 3,
    reuse: 3,
    distribution: 3,
    margin: 3,
    fulfillment: 3,
    proof: 3,
  };
  const dimensionKeys = Object.keys(base) as (keyof IncomeScoreDimensions)[];

  it.each([
    [1, 12],
    [5, 60],
  ])('scores all dimensions at %i as %i', (value, expected) => {
    const dimensions = { ...base };
    for (const key of dimensionKeys) dimensions[key] = value;
    expect(computeWeightedScore(dimensions)).toBe(expected);
  });

  describe.each(dimensionKeys)('dimension %s', (key) => {
    it.each([0, 6, NaN, Infinity, -Infinity])('rejects invalid value %p', (value) => {
      expect(() => computeWeightedScore({ ...base, [key]: value })).toThrow(RangeError);
    });

    it('rejects a missing dimension at the runtime boundary', () => {
      const incomplete: Partial<IncomeScoreDimensions> = { ...base };
      delete incomplete[key];
      // Simulate malformed external input that bypasses TypeScript's required fields.
      expect(() => computeWeightedScore(incomplete as IncomeScoreDimensions)).toThrow(RangeError);
    });
  });

  it('documents the scoring formula and maximum', () => {
    expect(REGISTRY_SCORING.formula).toBe(
      '2×Demand + 2×TTF$ + 2×Recurring + 2×Reuse + Distribution + Margin + Fulfillment + Proof',
    );
    expect(REGISTRY_SCORING.maxScore).toBe(60);
    expect(REGISTRY_SCORING.scale).toBe('Each dimension scored 1–5.');
  });
});
