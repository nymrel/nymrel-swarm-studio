import React from 'react';
import { IncomeEvidenceView } from './IncomeEvidenceView';
import { AlertCircle, Briefcase } from 'lucide-react';
import {
  INCOME_REGISTRY_WAVE_1,
  REGISTRY_SCORING,
  computeWeightedScore,
} from '../mock/incomeRegistry';

const classBadgeStyle: Record<string, string> = {
  'Cash now': 'registry-badge--cash',
  Recurring: 'registry-badge--recurring',
  'Recurring / marketplace': 'registry-badge--recurring',
  'Recurring / API': 'registry-badge--recurring',
};

function laneList(lanes: string[]): React.ReactNode {
  return (
    <ul className="registry-list" style={{ margin: 0, paddingLeft: 16, marginBottom: 0 }}>
      {lanes.map((lane) => (
        <li key={lane} style={{ margin: '2px 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {lane}
        </li>
      ))}
    </ul>
  );
}

const IncomeExamplesView: React.FC = () => {
  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Briefcase size={17} color="#A8541F" />
            Income Opportunity Registry
          </h2>
          <p className="section-subtitle">
            Wave 1 portfolio map: studio assets mapped to digital income lanes, with the weighted execution
            scoring model from issue #21.
          </p>
        </div>
      </div>

      {/* Capability-boundary notice */}
      <div className="registry-notice">
        <AlertCircle size={15} aria-hidden="true" />
        <div>
          <strong>Illustrative reference · no revenue or backend connected</strong>
          <span>
            This view is a static fixture. Every value is illustrative, and the scores are not verified
            demand, revenue, or customer evidence. No billing, marketplace, purchase, or customer system is
            connected, and nothing here is an offer or a commitment.
          </span>
        </div>
      </div>

      {/* Scoring model */}
      <div className="registry-panel">
        <div className="section-header" style={{ marginBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {REGISTRY_SCORING.name}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {REGISTRY_SCORING.scale} {REGISTRY_SCORING.guidance}
            </p>
          </div>
        </div>
        <code className="registry-formula">{REGISTRY_SCORING.formula}</code>
        <p className="registry-note" style={{ margin: 0 }}>
          Maximum weighted score {REGISTRY_SCORING.maxScore}. Demand, TTF$, Recurring, and Reuse carry
          double weight.
        </p>
      </div>

      {/* Portfolio map table */}
      <div
        className="registry-table-wrap"
        role="region"
        aria-labelledby="income-registry-caption"
        tabIndex={0}
      >
        <table className="registry-table">
          <caption id="income-registry-caption">
            Portfolio map — Wave 1 (registry excerpt). Weighted score is the illustrative example only.
          </caption>
          <thead>
            <tr>
              <th>Asset / capability</th>
              <th>Strongest income lanes</th>
              <th>Current commercial state</th>
              <th>Primary blocker</th>
              <th>Next revenue action</th>
              <th>Class</th>
              <th style={{ textAlign: 'center' }}>Weighted score (illustrative)</th>
            </tr>
          </thead>
          <tbody>
            {INCOME_REGISTRY_WAVE_1.map((entry) => {
              const score = entry.illustrativeScore
                ? computeWeightedScore(entry.illustrativeScore)
                : null;
              return (
                <tr key={entry.id}>
                  <td>{entry.asset}</td>
                  <td>{laneList(entry.incomeLanes)}</td>
                  <td>{entry.commercialState}</td>
                  <td>{entry.primaryBlocker}</td>
                  <td>{entry.nextRevenueAction}</td>
                  <td>
                    <span className={`registry-badge ${classBadgeStyle[entry.class]}`}>
                      {entry.class}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {score === null ? (
                      <span style={{ color: 'var(--color-text-muted)' }}>{'—'}</span>
                    ) : (
                      <span className="registry-score">{score}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const IncomeRegistryView: React.FC = () => {
  const [view, setView] = React.useState<'evidence' | 'examples'>('evidence');
  return <div className="income-registry">
    <div className="income-view-switch" role="group" aria-label="Income registry data view">
      <button type="button" className="income-button" aria-pressed={view === 'evidence'} onClick={() => setView('evidence')}>Evidence snapshot</button>
      <button type="button" className="income-button" aria-pressed={view === 'examples'} onClick={() => setView('examples')}>Original illustrative examples</button>
    </div>
    {view === 'evidence' ? <div className="card-panel">
      <h2 className="section-title">Income Opportunity Registry</h2>
      <IncomeEvidenceView />
    </div> : <IncomeExamplesView />}
  </div>;
};
