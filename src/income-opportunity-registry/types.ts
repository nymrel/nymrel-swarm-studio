/**
 * Income Opportunity Registry — type definitions.
 *
 * The registry is the durable bridge between researched digital-income
 * models, Nymrel's owned assets/capabilities, and the shortest credible
 * path to paid revenue. It is intentionally open: new concepts enter
 * immediately and compete for execution priority on evidence.
 */

/** The eight scoring dimensions, each scored 1–5. */
export interface OpportunityScores {
  /** Current market/customer evidence. */
  demand: number;
  /** Time to first dollar (5 = shortest). */
  ttfDollar: number;
  /** Quality of recurring/usage revenue. */
  recurring: number;
  /** Amount of existing Nymrel code/data/proof reused. */
  reuse: number;
  /** Existing channel/audience/marketplace access. */
  distribution: number;
  /** Expected digital gross margin. */
  margin: number;
  /** Operational burden (5 = low burden). */
  fulfillment: number;
  /** Credible demos, production evidence, case studies, customers. */
  proof: number;
}

/** Commercial classification of an opportunity. */
export type OpportunityClass =
  | 'cash-now'
  | 'recurring'
  | 'strategic'
  | 'experimental';

/** Lifecycle state of an opportunity in the registry. */
export type OpportunityStatus =
  | 'idea'
  | 'scored'
  | 'active'
  | 'shipped'
  | 'parked'
  | 'retired';

/** A single income opportunity entry. */
export interface Opportunity {
  /** Stable unique identifier (slug). */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Asset or capability this opportunity leverages. */
  asset: string;
  /** Strongest income lanes this opportunity targets. */
  incomeLanes: string[];
  /** Current commercial state (free-form, evidence-oriented). */
  commercialState: string;
  /** Primary blocker to revenue. */
  primaryBlocker: string;
  /** Next concrete revenue action. */
  nextRevenueAction: string;
  /** Commercial class. */
  class: OpportunityClass;
  /** Lifecycle status. */
  status: OpportunityStatus;
  /** Raw 1–5 scores. */
  scores: OpportunityScores;
  /** Optional evidence links (PRs, issues, demos, case studies). */
  evidence?: string[];
  /** ISO timestamp of last update. */
  updatedAt: string;
}

/** A scored opportunity with derived execution metrics. */
export interface ScoredOpportunity extends Opportunity {
  /** Weighted execution score. */
  executionScore: number;
  /** Rank within the evaluated set (1 = highest). */
  rank: number;
}

/** Validation result for a single opportunity. */
export interface ValidationIssue {
  opportunityId: string;
  field: string;
  message: string;
}

/** Result of validating a registry. */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
