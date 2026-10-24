import type { IncomeScoreDimensions } from './index';

export type IncomeDimension = keyof IncomeScoreDimensions;
export type EvidenceConfidence = 'low' | 'medium' | 'high' | 'unknown';

export interface IncomeEvidenceSource {
  id: string;
  title: string;
  url: string;
  mode: 'public-document' | 'historical-report';
  retrievedAt: string;
  /** Date of the evidence itself, never silently replaced by retrieval time. */
  effectiveAt: string | null;
  reviewAfter: string;
  revision: string;
  limitation: string;
}

export interface IncomeAssessment {
  /** Null means missing evidence, never a measured zero or a pessimistic 1. */
  value: number | null;
  basis: 'analyst-estimate' | 'unknown';
  confidence: EvidenceConfidence;
  explanation: string;
  sourceIds: string[];
}

export interface IncomeClaim {
  text: string;
  kind: 'documented-fact' | 'hypothesis';
  sourceIds: string[];
}

export const MONEY_PATH_STEPS = [
  'discovery', 'pricing', 'checkout', 'payment', 'signedEvent',
  'orderPersistence', 'intake', 'fulfillment', 'delivery', 'recovery',
] as const;
export type MoneyPathStep = typeof MONEY_PATH_STEPS[number];
export interface MoneyPathAssessment {
  state: 'unknown' | 'documented' | 'blocked' | 'verified';
  sourceIds: string[];
  explanation: string;
}

export interface IncomeOpportunityEvidence {
  id: string;
  asset: string;
  lane: 'Near-term validation' | 'Recurring foundation' | 'Evidence collection';
  incomeLanes: string[];
  buyerHypothesis: string;
  claims: IncomeClaim[];
  blocker: string;
  nextAction: string;
  paidProof: string;
  recurringHypothesis: string;
  confidence: EvidenceConfidence;
  scores: Record<IncomeDimension, IncomeAssessment>;
  moneyPath: Record<MoneyPathStep, MoneyPathAssessment>;
  /** Editorial validation order, not weighted revenue rank or dispatch authority. */
  priority: { order: number; reason: string } | null;
}
