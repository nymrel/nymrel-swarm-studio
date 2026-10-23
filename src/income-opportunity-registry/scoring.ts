/**
 * Weighted execution scoring for the Income Opportunity Registry.
 *
 * Formula (per issue #21):
 *   2×Demand + 2×TTF$ + 2×Recurring + 2×Reuse
 *   + Distribution + Margin + Fulfillment + Proof
 *
 * Each dimension is scored 1–5, so the maximum execution score is 50.
 */

import type {
  Opportunity,
  OpportunityScores,
  ScoredOpportunity,
} from './types';

/** Weights applied to each scoring dimension. */
export const SCORE_WEIGHTS: Readonly<Record<keyof OpportunityScores, number>> =
  Object.freeze({
    demand: 2,
    ttfDollar: 2,
    recurring: 2,
    reuse: 2,
    distribution: 1,
    margin: 1,
    fulfillment: 1,
    proof: 1,
  });

/** Maximum possible execution score (all dimensions = 5). */
export const MAX_EXECUTION_SCORE = Object.values(SCORE_WEIGHTS).reduce(
  (sum, weight) => sum + weight * 5,
  0,
);

/** Minimum possible execution score (all dimensions = 1). */
export const MIN_EXECUTION_SCORE = Object.values(SCORE_WEIGHTS).reduce(
  (sum, weight) => sum + weight * 1,
  0,
);

/**
 * Compute the weighted execution score for a set of raw scores.
 * Throws if any dimension is outside the inclusive 1–5 range.
 */
export function computeExecutionScore(scores: OpportunityScores): number {
  let total = 0;
  for (const key of Object.keys(SCORE_WEIGHTS) as (keyof OpportunityScores)[]) {
    const value = scores[key];
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      throw new RangeError(
        `Score "${key}" must be a number between 1 and 5 (received ${value}).`,
      );
    }
    total += SCORE_WEIGHTS[key] * value;
  }
  return total;
}

/**
 * Score and rank a collection of opportunities.
 *
 * Ranking is by descending execution score. Ties are broken by:
 *   1. higher TTF$ (faster to first dollar),
 *   2. higher Demand,
 *   3. higher Recurring,
 *   4. lexicographic id (stable, deterministic).
 */
export function rankOpportunities(
  opportunities: readonly Opportunity[],
): ScoredOpportunity[] {
  const scored = opportunities.map((opportunity) => ({
    ...opportunity,
    executionScore: computeExecutionScore(opportunity.scores),
    rank: 0,
  }));

  scored.sort((a, b) => {
    if (b.executionScore !== a.executionScore) {
      return b.executionScore - a.executionScore;
    }
    if (b.scores.ttfDollar !== a.scores.ttfDollar) {
      return b.scores.ttfDollar - a.scores.ttfDollar;
    }
    if (b.scores.demand !== a.scores.demand) {
      return b.scores.demand - a.scores.demand;
    }
    if (b.scores.recurring !== a.scores.recurring) {
      return b.scores.recurring - a.scores.recurring;
    }
    return a.id.localeCompare(b.id);
  });

  return scored.map((opportunity, index) => ({
    ...opportunity,
    rank: index + 1,
  }));
}

/**
 * Return the top N opportunities by execution score.
 */
export function topOpportunities(
  opportunities: readonly Opportunity[],
  limit = 100,
): ScoredOpportunity[] {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be a positive integer (received ${limit}).`);
  }
  return rankOpportunities(opportunities).slice(0, limit);
}
