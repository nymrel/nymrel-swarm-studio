import React from 'react';
import { useSwarmStore } from '../state/swarmStore';
import type { SwarmStore } from '../state/swarmStore';
import type {
  DecisionBallotCard, 
  ApprovalGateCard, 
  ParameterSliderCard, 
  DiffViewerCard, 
  ProgressTrackerCard 
} from '../types';
import { 
  Vote, 
  Sliders, 
  ShieldAlert, 
  GitPullRequest, 
  CheckCircle2, 
  Clock, 
  Check, 
  X, 
  Box, 
  Sparkles,
  Layers
} from 'lucide-react';

export const ScenarioCanvas: React.FC = () => {
  const [state, store] = useSwarmStore();

  return (
    <div className="card-panel">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Sparkles size={18} color="#A8541F" />
            Interactive review fixtures
          </h2>
          <p className="section-subtitle">
            Browser-only examples for decisions, protected-action reviews, parameter controls, diffs, and progress states
          </p>
        </div>
        <span className="status-badge" style={{ backgroundColor: '#FBEFEA', color: '#A8541F' }}>
          {state.cards.length} sample cards
        </span>
      </div>

      <div className="scenario-feed">
        {state.cards.map((card) => {
          switch (card.type) {
            case 'approval-gate':
              return <ApprovalGateItem key={card.id} card={card} store={store} />;
            case 'decision-ballot':
              return <DecisionBallotItem key={card.id} card={card} store={store} />;
            case 'diff-viewer':
              return <DiffViewerItem key={card.id} card={card} store={store} />;
            case 'parameter-slider':
              return <ParameterSliderItem key={card.id} card={card} store={store} />;
            case 'progress-tracker':
              return <ProgressTrackerItem key={card.id} card={card} />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};

// Subcomponent: Approval Gate
const ApprovalGateItem: React.FC<{ card: ApprovalGateCard; store: SwarmStore }> = ({ card, store }) => {
  const isPending = card.status === 'pending';

  return (
    <div className="scenario-card type-approval-gate">
      <div className="scenario-card-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="status-badge" style={{ backgroundColor: '#FDF0F0', color: '#9E2A2B' }}>
            <ShieldAlert size={12} />
            Protected-action scenario ({card.riskLevel.toUpperCase()} risk)
          </span>
          <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
            Example owner: <strong>{card.agentName}</strong>
          </span>
        </div>
        {isPending ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#744B09' }}>
            <Clock size={12} />
            {card.timeRemainingSeconds}s fixture countdown
          </span>
        ) : (
          <span className="status-badge" style={{
            backgroundColor: card.status === 'approved' ? '#EEF5F1' : '#FDF0F0',
            color: card.status === 'approved' ? '#3B7A57' : '#9E2A2B'
          }}>
            Status: {card.status.toUpperCase()}
          </span>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          {card.title}
        </h3>
        {card.reason && (
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {card.reason}
          </p>
        )}
      </div>

      {/* Code or command payload preview */}
      <div className="diff-box">
        <div style={{ fontSize: '11px', color: '#D6D8D4', marginBottom: '4px' }}>
          # Example payload · display only
        </div>
        <code>{card.commandOrPayload}</code>
        {card.diffSnippet && (
          <div style={{ marginTop: '8px', borderTop: '1px dashed #445048', paddingTop: '6px' }}>
            {card.diffSnippet.split('\n').map((line, idx) => (
              <div key={idx} className={line.startsWith('+') ? 'diff-line-add' : line.startsWith('-') ? 'diff-line-del' : 'diff-line-info'}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Actions */}
      {isPending && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => store.sandboxGate(card.id)}
            title="Mark this fixture for sandbox review"
          >
            <Box size={13} color="#2C6E8F" />
            <span>Mark sandbox review</span>
          </button>
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => store.rejectGate(card.id)}
            title="Mark this fixture rejected"
          >
            <X size={13} />
            <span>Mark rejected</span>
          </button>
          <button 
            className="btn btn-success btn-sm"
            onClick={() => store.approveGate(card.id)}
            title="Mark this fixture approved"
          >
            <Check size={13} />
            <span>Mark approved</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Decision Ballot
const DecisionBallotItem: React.FC<{ card: DecisionBallotCard; store: SwarmStore }> = ({ card, store }) => {
  const totalVotes = card.options.reduce((acc, opt) => acc + opt.votes, 0);

  return (
    <div className="scenario-card type-decision-ballot">
      <div className="scenario-card-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="status-badge" style={{ backgroundColor: '#EDF5F8', color: '#2C6E8F' }}>
            <Vote size={12} />
            Decision fixture
          </span>
          <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
            Example owner: <strong>{card.proposerAgent}</strong>
          </span>
        </div>
        <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
          {totalVotes} sample votes
        </span>
      </div>

      <div>
        <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          {card.title}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {card.description}
        </p>
      </div>

      <div className="ballot-options-list" role="radiogroup" aria-label={card.title}>
        {card.options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <div 
              key={opt.id}
              className={`ballot-option-row ${opt.userVoted ? 'voted' : ''}`}
              onClick={() => store.castBallotVote(card.id, opt.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  store.castBallotVote(card.id, opt.id);
                }
              }}
              role="radio"
              tabIndex={0}
              aria-checked={Boolean(opt.userVoted)}
            >
              <div className="ballot-option-header">
                <div>
                  <strong style={{ fontSize: '12.5px', color: 'var(--color-text-primary)' }}>
                    {opt.label}
                  </strong>
                  {opt.description && (
                    <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {opt.description}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right', minWidth: '60px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-terracotta)' }}>
                    {pct}%
                  </span>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                    {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="ballot-vote-bar-bg" role="progressbar" aria-label={`${opt.label} sample vote share`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                <div className="ballot-vote-bar-fill" style={{ width: `${pct}%` }} />
              </div>

              {/* Agent Endorsements */}
              {opt.agentEndorsements.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>Sample endorsements:</span>
                  {opt.agentEndorsements.map((agent, aIdx) => (
                    <span key={aIdx} className="hardware-tag" style={{ fontSize: '10px', padding: '1px 5px' }}>
                      {agent}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Subcomponent: Parameter Slider
const ParameterSliderItem: React.FC<{ card: ParameterSliderCard; store: SwarmStore }> = ({ card, store }) => {
  return (
    <div className="scenario-card">
      <div className="scenario-card-meta">
        <span className="status-badge" style={{ backgroundColor: '#FDF6EC', color: '#744B09' }}>
          <Sliders size={12} />
          Fixture tuning
        </span>
        <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
          Example roles: {card.affectedAgents.join(', ')}
        </span>
      </div>

      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {card.title}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {card.description}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
        <input 
          type="range"
          min={card.min}
          max={card.max}
          step={card.step}
          value={card.value}
          onChange={(e) => store.updateParameter(card.id, parseFloat(e.target.value))}
          aria-label={card.title}
          style={{ flex: 1, accentColor: 'var(--color-brand-terracotta)', cursor: 'pointer' }}
        />
        <div style={{
          minWidth: '100px',
          textAlign: 'center',
          background: 'var(--color-bg-surface)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border-default)'
        }}>
          <strong style={{ fontSize: '15px', color: 'var(--color-brand-terracotta)', fontFamily: 'var(--font-mono)' }}>
            {card.value}
          </strong>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{card.unit}</div>
        </div>
      </div>
    </div>
  );
};

// Subcomponent: Diff Viewer
const DiffViewerItem: React.FC<{ card: DiffViewerCard; store: SwarmStore }> = ({ card, store }) => {
  return (
    <div className="scenario-card type-diff-viewer">
      <div className="scenario-card-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="status-badge" style={{ backgroundColor: '#EEF5F1', color: '#2F6B4B' }}>
            <GitPullRequest size={12} />
            Sample diff · display only
          </span>
          <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
            Example owner: <strong>{card.proposerAgent}</strong>
          </span>
        </div>
        <span className="hardware-tag">{card.filePath}</span>
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {card.title}
      </h3>

      {card.hunks.map((hunk) => (
        <div key={hunk.hunkId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="diff-box">
            <div className="diff-line-info">@@ -{hunk.oldStart},2 +{hunk.newStart},3 @@</div>
            {hunk.oldLines.map((l, idx) => (
              <div key={idx} className="diff-line-del">- {l}</div>
            ))}
            {hunk.newLines.map((l, idx) => (
              <div key={idx} className="diff-line-add">+ {l}</div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            {hunk.status === 'pending' ? (
              <>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => store.rejectDiffHunk(card.id, hunk.hunkId)}
                >
                  <X size={12} /> Reject Hunk
                </button>
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => store.acceptDiffHunk(card.id, hunk.hunkId)}
                >
                  <Check size={12} /> Accept Hunk
                </button>
              </>
            ) : (
              <span className="status-badge" style={{
                backgroundColor: hunk.status === 'accepted' ? '#EEF5F1' : '#FDF0F0',
                color: hunk.status === 'accepted' ? '#3B7A57' : '#9E2A2B'
              }}>
                Hunk {hunk.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Subcomponent: Progress Tracker
const ProgressTrackerItem: React.FC<{ card: ProgressTrackerCard }> = ({ card }) => {
  return (
    <div className="scenario-card">
      <div className="scenario-card-meta">
        <span className="status-badge" style={{ backgroundColor: '#E8EFEA', color: '#2A332E' }}>
          <Layers size={12} />
          Sample campaign
        </span>
        <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
          Fixture timer: ~{card.etaSeconds}s
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {card.title}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            ID: {card.campaignId}
          </span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-brand-terracotta)', fontFamily: 'var(--font-mono)' }}>
          {card.overallProgress}%
        </div>
      </div>

      <div className="ballot-vote-bar-bg" style={{ height: '8px' }} role="progressbar" aria-label="Sample campaign progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={card.overallProgress}>
        <div className="ballot-vote-bar-fill" style={{ width: `${card.overallProgress}%`, backgroundColor: '#3B7A57' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
        {card.milestones.map((m) => (
          <div 
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {m.status === 'completed' && <CheckCircle2 size={13} color="#3B7A57" />}
              {m.status === 'in_progress' && <Clock size={13} color="#744B09" className="pulse-dot" />}
              {m.status === 'queued' && <Box size={13} color="#555A54" />}
              <span style={{ 
                color: m.status === 'completed' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: m.status === 'in_progress' ? 600 : 400
              }}>
                {m.label}
              </span>
            </div>
            <span className="hardware-tag" style={{ fontSize: '10px' }}>
              {m.agent} {m.durationMs ? `(${m.durationMs}ms)` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
