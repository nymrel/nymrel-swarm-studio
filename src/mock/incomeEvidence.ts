import type { IncomeDimension, IncomeEvidenceSource, IncomeOpportunityEvidence } from '../types/incomeEvidence';
import { MONEY_PATH_STEPS } from '../types/incomeEvidence';

/** Same eight dimensions and weights as issue #21 and the contributor's scorer. */
export const INCOME_DIMENSIONS: { key: IncomeDimension; label: string; weight: number }[] = [
  { key: 'demand', label: 'Demand', weight: 2 },
  { key: 'timeToFirstDollar', label: 'TTF$', weight: 2 },
  { key: 'recurring', label: 'Recurring', weight: 2 },
  { key: 'reuse', label: 'Reuse', weight: 2 },
  { key: 'distribution', label: 'Distribution', weight: 1 },
  { key: 'margin', label: 'Margin', weight: 1 },
  { key: 'fulfillment', label: 'Fulfillment', weight: 1 },
  { key: 'proof', label: 'Proof', weight: 1 },
];

export function scoreBounds(scores: IncomeOpportunityEvidence['scores']) {
  let lower = 0;
  let upper = 0;
  let assessed = 0;
  for (const { key, weight } of INCOME_DIMENSIONS) {
    const assessment = scores[key];
    if (!assessment || (assessment.value !== null &&
        (!Number.isFinite(assessment.value) || assessment.value < 1 || assessment.value > 5))) {
      throw new RangeError(`Invalid income assessment: ${key}`);
    }
    if (assessment.value === null) {
      lower += weight;
      upper += 5 * weight;
    } else {
      lower += assessment.value * weight;
      upper += assessment.value * weight;
      assessed += 1;
    }
  }
  return { lower, upper, assessed, total: INCOME_DIMENSIONS.length };
}

export function sourceFreshness(source: IncomeEvidenceSource, asOf: string) {
  if (Date.parse(asOf) > Date.parse(source.reviewAfter)) return 'review overdue';
  if (source.effectiveAt === null) return 'source date unknown';
  return 'within review window';
}

export function filterOpportunities(entries: IncomeOpportunityEvidence[], query: string, lane: string) {
  const term = query.trim().toLowerCase();
  return entries.filter(entry =>
    (lane === 'All' || entry.lane === lane) &&
    [entry.asset, ...entry.incomeLanes, entry.buyerHypothesis, entry.blocker, entry.nextAction]
      .join(' ').toLowerCase().includes(term));
}

/** A catalog or page can document a step, but cannot satisfy the paid-delivery gate. */
export function hasVerifiedMoneyPath(entry: IncomeOpportunityEvidence) {
  return MONEY_PATH_STEPS.every(step => entry.moneyPath[step].state === 'verified');
}

/** Validate the authored snapshot; never promote a source report to provider proof. */
export function validateIncomeEvidence(entries: IncomeOpportunityEvidence[], sources: IncomeEvidenceSource[]) {
  const errors: string[] = [];
  const sourceIds = new Set(sources.map(source => source.id));
  const seenIds = new Set<string>();
  const priorities = new Set<number>();
  const checkRefs = (refs: string[], label: string, required: boolean) => {
    if (required && refs.length === 0) errors.push(`${label}: source required`);
    if (refs.some(id => !sourceIds.has(id))) errors.push(`${label}: unknown source`);
  };
  for (const source of sources) {
    if (!source.url.startsWith('https://')) errors.push(`${source.id}: HTTPS source required`);
    if (!source.revision || !source.limitation) errors.push(`${source.id}: provenance required`);
    if (![source.retrievedAt, source.reviewAfter, ...(source.effectiveAt === null ? [] : [source.effectiveAt])]
      .every(date => Number.isFinite(Date.parse(date)))) errors.push(`${source.id}: invalid date`);
  }
  if (sourceIds.size !== sources.length) errors.push('Duplicate source id');
  for (const entry of entries) {
    if (seenIds.has(entry.id)) errors.push(`${entry.id}: duplicate opportunity`);
    seenIds.add(entry.id);
    for (const claim of entry.claims) checkRefs(claim.sourceIds, entry.id, true);
    for (const { key } of INCOME_DIMENSIONS) {
      const score = entry.scores[key];
      if (!score) { errors.push(`${entry.id}: missing ${key}`); continue; }
      if ((score.value === null) !== (score.basis === 'unknown')) errors.push(`${entry.id}: missing score mislabeled`);
      if (!score.explanation) errors.push(`${entry.id}: score explanation required`);
      checkRefs(score.sourceIds, `${entry.id}/${key}`, score.value !== null);
    }
    try { scoreBounds(entry.scores); } catch { errors.push(`${entry.id}: invalid score`); }
    for (const step of MONEY_PATH_STEPS) {
      const gate = entry.moneyPath[step];
      if (!gate) { errors.push(`${entry.id}: missing money-path step ${step}`); continue; }
      checkRefs(gate.sourceIds, `${entry.id}/${step}`, gate.state !== 'unknown');
      if (gate.state === 'verified') {
        errors.push(`${entry.id}/${step}: document-only snapshot cannot verify live behavior`);
      }
    }
    if (entry.priority) {
      if (!Number.isInteger(entry.priority.order) || entry.priority.order < 1 || priorities.has(entry.priority.order)) {
        errors.push(`${entry.id}: invalid validation order`);
      }
      priorities.add(entry.priority.order);
    }
  }
  return errors;
}
