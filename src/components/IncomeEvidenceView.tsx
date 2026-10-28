import { useState } from 'react';
import { INCOME_EVIDENCE_SOURCES, INCOME_OPPORTUNITIES, INCOME_REVIEWED_AT, INCOME_SNAPSHOT_NOTICE } from '../data/incomeEvidence';
import { filterOpportunities, INCOME_DIMENSIONS, scoreBounds, sourceFreshness } from '../mock/incomeEvidence';
import { MONEY_PATH_STEPS } from '../types/incomeEvidence';
import type { IncomeOpportunityEvidence, MoneyPathStep } from '../types/incomeEvidence';

const sourceById = new Map(INCOME_EVIDENCE_SOURCES.map(source => [source.id, source]));
const stepLabels: Record<MoneyPathStep, string> = {
  discovery: 'Discovery', pricing: 'Pricing', checkout: 'Checkout', payment: 'Payment',
  signedEvent: 'Signed event', orderPersistence: 'Saved order', intake: 'Intake',
  fulfillment: 'Fulfillment', delivery: 'Delivery', recovery: 'Refund / cancel / recovery',
};

function Sources({ ids }: { ids: string[] }) {
  return <>{ids.map(id => <a key={id} href={`#income-source-${id}`} className="income-source-link">{sourceById.get(id)!.title}</a>)}</>;
}

function Opportunity({ entry }: { entry: IncomeOpportunityEvidence }) {
  const range = scoreBounds(entry.scores);
  const sourceIds = [...new Set(entry.claims.flatMap(claim => claim.sourceIds))];
  const overdue = sourceIds.some(id => sourceFreshness(sourceById.get(id)!, INCOME_REVIEWED_AT) === 'review overdue');
  return (
    <article className="registry-panel income-opportunity" id={`income-${entry.id}`}>
      <div className="income-card-heading">
        <h3>{entry.asset}</h3>
        <span className="income-label">{entry.lane}</span>
      </div>
      <p className="income-lanes">{entry.incomeLanes.join(' · ')}</p>
      <p><strong>Commercial confidence: {entry.confidence}.</strong> {overdue ? 'Historical evidence needs review.' : 'Document evidence only; source dates may be unknown.'}</p>
      <ul className="income-claims">
        {entry.claims.map(claim => <li key={claim.text}>
          <strong>{claim.kind === 'documented-fact' ? 'Documented fact' : 'Hypothesis'}:</strong> {claim.text} <Sources ids={claim.sourceIds} />
        </li>)}
      </ul>
      <p><strong>Buyer hypothesis:</strong> {entry.buyerHypothesis}</p>
      <p><strong>Blocker:</strong> {entry.blocker}</p>
      <p><strong>Next validation:</strong> {entry.nextAction}</p>
      <p><strong>Recurring hypothesis:</strong> {entry.recurringHypothesis}</p>
      <p className="income-range"><strong>Possible weighted range: {range.lower}–{range.upper} / 60</strong> · {range.assessed}/8 dimensions estimated</p>
      <p className="registry-note">Unassessed dimensions span 1–5. This is a sensitivity range, not a forecast, confidence interval or measured revenue rank.</p>
      <details>
        <summary>Scoring explanations and money-path evidence — {entry.asset}</summary>
        <dl className="income-score-list">
          {INCOME_DIMENSIONS.map(({ key, label, weight }) => {
            const score = entry.scores[key];
            return <div key={key}>
              <dt>{label} ×{weight}: {score.value === null ? 'Unknown' : `${score.value}/5 · analyst estimate · ${score.confidence} confidence`}</dt>
              <dd>{score.explanation} <Sources ids={score.sourceIds} /></dd>
            </div>;
          })}
        </dl>
        <h4>Money path</h4>
        <p>Documented means described in a source, not functionally verified. No complete verified path is established for any entry.</p>
        <ul className="income-gates">
          {MONEY_PATH_STEPS.map(step => <li key={step}>
            <strong>{stepLabels[step]}: {entry.moneyPath[step].state}</strong> — {entry.moneyPath[step].explanation} <Sources ids={entry.moneyPath[step].sourceIds} />
          </li>)}
        </ul>
        <p><strong>Paid-proof threshold:</strong> {entry.paidProof}</p>
      </details>
    </article>
  );
}

export function IncomeEvidenceView() {
  const [query, setQuery] = useState('');
  const [lane, setLane] = useState('All');
  const visible = filterOpportunities(INCOME_OPPORTUNITIES, query, lane);
  const priorities = INCOME_OPPORTUNITIES.filter(entry => entry.priority)
    .toSorted((a, b) => a.priority!.order - b.priority!.order);
  const [asOf] = useState(() => new Date().toISOString());
  return (
    <div className="income-evidence">
      <div className="registry-notice"><div>
        <strong>{INCOME_SNAPSHOT_NOTICE}</strong>
        <span>Reviewed {INCOME_REVIEWED_AT.slice(0, 10)} UTC. Covers all 16 assets in issue #21, not the entire studio inventory. All payment, customer-demand and MRR measurements remain unknown here. Historical reports are not reverified by retrieval.</span>
      </div></div>

      <section className="registry-panel" aria-labelledby="income-validation-title">
        <h3 id="income-validation-title">Five next validation steps</h3>
        <p>This is a provisional analyst sequence based on a bounded path to a customer, reuse and open blockers. It is not a weighted-score ranking, execution approval or claim of proven demand.</p>
        <ol className="income-priorities">{priorities.map(entry => <li key={entry.id}>
          <strong>{entry.asset}</strong> — {entry.priority!.reason}
        </li>)}</ol>
        <p className="registry-note">Retain MCP Hub / Remote, Publisher and Crawler Mesh as recurring foundations; their current commercial gates need fresh receipts. Retain the original five example scores separately.</p>
      </section>

      <details className="registry-panel">
        <summary>How scoring and confidence work</summary>
        <p>The issue #21 formula is unchanged: Demand, TTF$, Recurring and Reuse have weight 2; Distribution, Margin, Fulfillment and Proof have weight 1. Each uses 1–5. A completely unassessed entry spans 12–60.</p>
        <p>Every numeric assessment is an analyst estimate with a rationale and source. Unknown is null, never zero or an invented 1. Missing dimensions widen the range; overlapping ranges cannot establish an ordering. Evidence coverage is not a quality score.</p>
        <p>Confidence describes commercial readiness, not the chance of success. Low: documents or historical reports without current functional receipts. Medium would require current independent functional evidence; high would also require paid delivery and repeated use. No entry meets those higher thresholds here.</p>
        <p>Working rubric: 1 = minimal positive support, 2 = limited, 3 = plausible, 4 = substantial, 5 = strongest. Apply it to each dimension's meaning in #21; TTF$ 5 is fastest and Fulfillment 5 is lowest burden. Unmeasured demand, costs, timing and renewal quality stay unknown.</p>
      </details>

      <div className="income-controls">
        <label>Search opportunities<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Asset, buyer, lane or blocker" /></label>
        <label>Decision lane<select value={lane} onChange={event => setLane(event.target.value)}>
          {['All', 'Near-term validation', 'Recurring foundation', 'Evidence collection'].map(value => <option key={value}>{value}</option>)}
        </select></label>
      </div>
      <p role="status" aria-live="polite">{visible.length} of {INCOME_OPPORTUNITIES.length} opportunities shown</p>
      {visible.length === 0 ? <div className="registry-panel">
        <p>No opportunities match. Clear the search and select All to see the portfolio.</p>
        <button type="button" className="income-button" onClick={() => { setQuery(''); setLane('All'); }}>Reset filters</button>
      </div> : visible.map(entry => <Opportunity key={entry.id} entry={entry} />)}

      <section className="registry-panel income-sources" aria-labelledby="income-sources-title">
        <h3 id="income-sources-title">Source provenance and limits</h3>
        <p>Source review windows are editorial reminders, not availability guarantees. Freshness below is evaluated as of {asOf.slice(0, 10)} UTC; a reload rechecks the date without making any network request.</p>
        {INCOME_EVIDENCE_SOURCES.map(source => <div id={`income-source-${source.id}`} key={source.id}>
          <h4><a href={source.url} rel="noreferrer">{source.title}</a></h4>
          <p>{source.mode} · {sourceFreshness(source, asOf)}</p>
          <p>Evidence date: {source.effectiveAt?.slice(0, 10) ?? 'Unknown'} · Retrieved: {source.retrievedAt} · Review after: {source.reviewAfter.slice(0, 10)}</p>
          <p>{source.revision}</p><p>{source.limitation}</p>
        </div>)}
      </section>
    </div>
  );
}
