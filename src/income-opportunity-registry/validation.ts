/**
 * Validation for Income Opportunity Registry entries.
 *
 * Ensures every opportunity is well-formed and every score is within the
 * inclusive 1–5 range required by the scoring model.
 */

import type {
  Opportunity,
  OpportunityScores,
  ValidationIssue,
  ValidationResult,
} from './types';

const SCORE_KEYS: readonly (keyof OpportunityScores)[] = [
  'demand',
  'ttfDollar',
  'recurring',
  'reuse',
  'distribution',
  'margin',
  'fulfillment',
  'proof',
];

const REQUIRED_STRING_FIELDS: readonly (keyof Opportunity)[] = [
  'id',
  'title',
  'asset',
  'commercialState',
  'primaryBlocker',
  'nextRevenueAction',
  'class',
  'status',
  'updatedAt',
];

const VALID_CLASSES = new Set([
  'cash-now',
  'recurring',
  'strategic',
  'experimental',
]);

const VALID_STATUSES = new Set([
  'idea',
  'scored',
  'active',
  'shipped',
  'parked',
  'retired',
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Validate a single opportunity. */
export function validateOpportunity(
  opportunity: Opportunity,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = isNonEmptyString(opportunity.id) ? opportunity.id : '<unknown>';

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!isNonEmptyString(opportunity[field])) {
      issues.push({
        opportunityId: id,
        field,
        message: `Field "${field}" must be a non-empty string.`,
      });
    }
  }

  if (!Array.isArray(opportunity.incomeLanes) || opportunity.incomeLanes.length === 0) {
    issues.push({
      opportunityId: id,
      field: 'incomeLanes',
      message: 'At least one income lane is required.',
    });
  }

  if (!VALID_CLASSES.has(opportunity.class)) {
    issues.push({
      opportunityId: id,
      field: 'class',
      message: `Invalid class "${opportunity.class}".`,
    });
  }

  if (!VALID_STATUSES.has(opportunity.status)) {
    issues.push({
      opportunityId: id,
      field: 'status',
      message: `Invalid status "${opportunity.status}".`,
    });
  }

  if (Number.isNaN(Date.parse(opportunity.updatedAt))) {
    issues.push({
      opportunityId: id,
      field: 'updatedAt',
      message: 'updatedAt must be a valid ISO timestamp.',
    });
  }

  for (const key of SCORE_KEYS) {
    const value = opportunity.scores?.[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      issues.push({
        opportunityId: id,
        field: `scores.${key}`,
        message: `Score "${key}" must be a finite number.`,
      });
    } else if (value < 1 || value > 5) {
      issues.push({
        opportunityId: id,
        field: `scores.${key}`,
        message: `Score "${key}" must be between 1 and 5 (received ${value}).`,
      });
    }
  }

  return issues;
}

/** Validate a full registry, including duplicate-id detection. */
export function validateRegistry(
  opportunities: readonly Opportunity[],
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  for (const opportunity of opportunities) {
    issues.push(...validateOpportunity(opportunity));
    if (isNonEmptyString(opportunity.id)) {
      if (seen.has(opportunity.id)) {
        issues.push({
          opportunityId: opportunity.id,
          field: 'id',
          message: `Duplicate opportunity id "${opportunity.id}".`,
        });
      }
      seen.add(opportunity.id);
    }
  }

  return { valid: issues.length === 0, issues };
}
