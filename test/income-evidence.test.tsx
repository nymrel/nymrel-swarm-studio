import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { IncomeRegistryView } from '../src/components/IncomeRegistryView';
import { INCOME_EVIDENCE_SOURCES, INCOME_OPPORTUNITIES, INCOME_REVIEWED_AT } from '../src/data/incomeEvidence';
import { filterOpportunities, hasVerifiedMoneyPath, INCOME_DIMENSIONS, scoreBounds, sourceFreshness, validateIncomeEvidence } from '../src/mock/incomeEvidence';
import { computeWeightedScore } from '../src/mock/incomeRegistry';
import type { IncomeOpportunityEvidence } from '../src/types/incomeEvidence';

const clone = () => structuredClone(INCOME_OPPORTUNITIES);

describe('Evidence-backed income registry snapshot', () => {
  it('covers all 16 original assets without treating documents as commercial proof', () => {
    expect(INCOME_OPPORTUNITIES).toHaveLength(16);
    expect(validateIncomeEvidence(INCOME_OPPORTUNITIES, INCOME_EVIDENCE_SOURCES)).toEqual([]);
    expect(INCOME_OPPORTUNITIES.every(entry => !hasVerifiedMoneyPath(entry))).toBe(true);
    expect(INCOME_OPPORTUNITIES.every(entry => entry.moneyPath.payment.state === 'unknown')).toBe(true);
    expect(INCOME_OPPORTUNITIES.every(entry => entry.scores.demand.value === null && entry.scores.margin.value === null)).toBe(true);
  });

  it('uses the contributor formula for complete assessments and preserves unknown bounds', () => {
    const scores = clone()[0]!.scores;
    for (const { key } of INCOME_DIMENSIONS) scores[key]!.value = 3;
    const complete = { demand: 3, timeToFirstDollar: 3, recurring: 3, reuse: 3, distribution: 3, margin: 3, fulfillment: 3, proof: 3 };
    expect(scoreBounds(scores)).toEqual({ lower: computeWeightedScore(complete), upper: 36, assessed: 8, total: 8 });
    for (const { key } of INCOME_DIMENSIONS) scores[key]!.value = null;
    expect(scoreBounds(scores)).toEqual({ lower: 12, upper: 60, assessed: 0, total: 8 });
    scores.demand.value = 4;
    expect(scoreBounds(scores)).toEqual({ lower: 18, upper: 58, assessed: 1, total: 8 });
  });

  it.each([0, 6, NaN, Infinity, -Infinity, undefined])('rejects malformed assessed values: %s', value => {
    const scores = clone()[0]!.scores;
    scores.demand.value = value as number;
    expect(() => scoreBounds(scores)).toThrow(RangeError);
  });

  it('rejects missing dimensions and disallows missing facts, rationale and source bindings', () => {
    const rows = clone();
    delete (rows[0]!.scores as Partial<IncomeOpportunityEvidence['scores']>).proof;
    rows[0]!.claims[0]!.sourceIds = [];
    rows[0]!.scores.reuse.sourceIds = ['nonexistent'];
    rows[0]!.scores.reuse.explanation = '';
    expect(validateIncomeEvidence(rows, INCOME_EVIDENCE_SOURCES)).toEqual(expect.arrayContaining([
      expect.stringContaining('missing proof'), expect.stringContaining('invalid score'),
      expect.stringContaining('source required'), expect.stringContaining('unknown source'),
      expect.stringContaining('score explanation required'),
    ]));
  });

  it('rejects document promotion to verified money-path behavior', () => {
    const rows = clone();
    rows[0]!.moneyPath.payment = { state: 'verified', sourceIds: ['shop'], explanation: 'A buy link is insufficient.' };
    expect(validateIncomeEvidence(rows, INCOME_EVIDENCE_SOURCES)).toContain('services/payment: document-only snapshot cannot verify live behavior');
    for (const gate of Object.values(rows[0]!.moneyPath)) gate.state = 'verified';
    expect(hasVerifiedMoneyPath(rows[0]!)).toBe(true);
    expect(validateIncomeEvidence(rows, INCOME_EVIDENCE_SOURCES).length).toBeGreaterThan(0);
  });

  it('rejects duplicate identities/order, unknown numeric labeling and incomplete money paths', () => {
    const rows = clone();
    rows[1]!.id = rows[0]!.id;
    rows[1]!.priority!.order = rows[0]!.priority!.order;
    rows[0]!.scores.demand.basis = 'analyst-estimate';
    delete (rows[0]!.moneyPath as Partial<IncomeOpportunityEvidence['moneyPath']>).delivery;
    expect(validateIncomeEvidence(rows, INCOME_EVIDENCE_SOURCES)).toEqual(expect.arrayContaining([
      expect.stringContaining('duplicate opportunity'), expect.stringContaining('invalid validation order'),
      expect.stringContaining('missing score mislabeled'), expect.stringContaining('missing money-path step delivery'),
    ]));
  });

  it('validates provenance URLs, revision, dates and duplicate source ids', () => {
    const sources = structuredClone(INCOME_EVIDENCE_SOURCES);
    sources[0]!.url = 'javascript:alert(1)';
    sources[0]!.revision = '';
    sources[0]!.retrievedAt = 'not-a-date';
    sources.push(sources[1]!);
    expect(validateIncomeEvidence(INCOME_OPPORTUNITIES, sources)).toEqual(expect.arrayContaining([
      'wave1: HTTPS source required', 'wave1: provenance required', 'wave1: invalid date', 'Duplicate source id',
    ]));
  });

  it('keeps old or undated evidence distinct from the retrieval date', () => {
    const source = INCOME_EVIDENCE_SOURCES.find(item => item.id === 'lead-queue')!;
    expect(sourceFreshness(source, INCOME_REVIEWED_AT)).toBe('review overdue');
    expect(sourceFreshness(source, '2026-09-25T12:00:00Z')).toBe('within review window');
    expect(sourceFreshness(INCOME_EVIDENCE_SOURCES.find(item => item.id === 'shop')!, INCOME_REVIEWED_AT)).toBe('source date unknown');
    expect(sourceFreshness(source, source.reviewAfter)).toBe('within review window');
  });

  it('filters real entries by trimmed case-insensitive search and lane without changing order or data', () => {
    const before = JSON.stringify(INCOME_OPPORTUNITIES);
    expect(filterOpportunities(INCOME_OPPORTUNITIES, '  MCP  ', 'All').map(entry => entry.id)).toEqual(['services', 'mcp-remote', 'crawler-mesh']);
    expect(filterOpportunities(INCOME_OPPORTUNITIES, '   ', 'Recurring foundation')).toHaveLength(3);
    expect(filterOpportunities(INCOME_OPPORTUNITIES, 'no such product', 'All')).toEqual([]);
    expect(filterOpportunities(INCOME_OPPORTUNITIES, '', 'Near-term validation')).toHaveLength(5);
    expect(JSON.stringify(INCOME_OPPORTUNITIES)).toBe(before);
  });

  it('has a separate editorial top five with explanations; scores cannot imply that ordering', () => {
    const sequence = INCOME_OPPORTUNITIES.filter(entry => entry.priority).toSorted((a, b) => a.priority!.order - b.priority!.order);
    expect(sequence.map(entry => entry.id)).toEqual(['services', 'website-intelligence', 'digital-products', 'goviral', 'draftadynasty']);
    expect(sequence.every(entry => entry.priority!.reason && entry.nextAction && entry.paidProof)).toBe(true);
  });

  it('renders the actual default view with source provenance, explicit unknowns and an example selector', () => {
    const html = renderToStaticMarkup(<IncomeRegistryView />);
    expect(html).toContain('Original illustrative examples');
    expect(html).toContain('No billing or revenue backend is connected.');
    expect(html).toContain('16 of 16 opportunities shown');
    expect(html).toContain('Payment: unknown');
    expect(html).toContain('id="income-source-wave1"');
    expect(html).toContain('not a forecast, confidence interval or measured revenue rank');
    expect(html).not.toContain('Weighted score (illustrative)');
    expect(html).not.toContain('Customer revenue: 0');
  });
});
