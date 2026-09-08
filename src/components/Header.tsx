import React from 'react';
import { Cpu, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useSwarmStore } from '../state/swarmStore';

export const Header: React.FC = () => {
  const [state, store] = useSwarmStore();
  const movingExamples = state.agents.filter(agent => agent.status === 'active' || agent.status === 'thinking').length;

  return (
    <header className="header-wrapper">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-logo-badge" aria-hidden="true">N</div>
          <div className="header-title-group">
            <h1>
              Nymrel Swarm Studio
              <span className="status-badge">Reference demo</span>
            </h1>
            <p>Explore human-review, workspace, and integrity-log interaction patterns</p>
          </div>
        </div>

        <div className="header-center-stats" aria-label="Synthetic scenario summary">
          <div className="stat-pill">
            <span className={`status-dot ${state.isPlaybackRunning ? 'pulse-dot' : ''}`} aria-hidden="true" />
            <span>Playback</span>
            <strong>{state.isPlaybackRunning ? 'Running' : 'Paused'}</strong>
          </div>
          <div className="stat-divider" />
          <div className="stat-pill">
            <Sparkles size={14} aria-hidden="true" />
            <span>Examples</span>
            <strong>{movingExamples} moving</strong>
          </div>
          <div className="stat-divider" />
          <div className="stat-pill">
            <Cpu size={14} aria-hidden="true" />
            <span>Illustrative mix</span>
            <strong>{state.tokenStats.efficiencyScore}% local/edge</strong>
          </div>
          <div className="stat-divider" />
          <div className="stat-pill" title={`Locally recomputed fixture root: ${state.merkleRoot}`}>
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Local root</span>
            <code>{state.merkleRoot.slice(0, 8)}…{state.merkleRoot.slice(-4)}</code>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => store.addScenarioEvent()}
            title="Add a synthetic integrity-log scenario"
          >
            <Zap size={13} aria-hidden="true" />
            <span>Add scenario</span>
          </button>
          <button
            className={`btn ${state.isPlaybackRunning ? 'btn-secondary' : 'btn-primary'} btn-sm`}
            onClick={() => store.togglePlayback()}
            aria-pressed={!state.isPlaybackRunning}
          >
            {state.isPlaybackRunning ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
            <span>{state.isPlaybackRunning ? 'Pause fixture' : 'Resume fixture'}</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => store.resetDemo()}>
            <RotateCcw size={13} aria-hidden="true" />
            <span>Reset fixture</span>
          </button>
        </div>
      </div>
    </header>
  );
};
