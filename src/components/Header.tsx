import React from 'react';
import { useSwarmStore } from '../state/swarmStore';
import { 
  Play, 
  Pause, 
  Zap, 
  RotateCcw, 
  ShieldCheck, 
  Cpu, 
  TrendingUp 
} from 'lucide-react';

export const Header: React.FC = () => {
  const [state, store] = useSwarmStore();
  const activeCount = state.agents.filter(a => a.status === 'active' || a.status === 'thinking').length;

  return (
    <header className="header-wrapper">
      <div className="header-inner">
        {/* Brand & Identity */}
        <div className="header-brand">
          <div className="header-logo-badge">
            <span>🐝</span>
          </div>
          <div className="header-title-group">
            <h1>
              Nymrel Swarm Studio
              <span className="a2ui-badge" style={{ backgroundColor: '#E8EFEA', color: '#2A332E', fontSize: '10.5px' }}>
                A2UI v0.8
              </span>
            </h1>
            <p>Multi-Agent Visual Command Deck & Action Surety Engine</p>
          </div>
        </div>

        {/* Live Swarm Telemetry Stats */}
        <div className="header-center-stats">
          <div className="stat-pill">
            <span className={`status-dot ${state.isStreaming ? 'pulse-dot' : ''}`} style={{ backgroundColor: state.isStreaming ? '#3B7A57' : '#8E8A80' }} />
            <span>Fleet:</span>
            <strong>{activeCount} / {state.agents.length} Online</strong>
          </div>

          <div className="stat-divider" />

          <div className="stat-pill">
            <TrendingUp size={14} color="#A8541F" />
            <span>Efficiency:</span>
            <strong style={{ color: '#A8541F' }}>{state.tokenStats.efficiencyScore}% Local/Edge</strong>
          </div>

          <div className="stat-divider" />

          <div className="stat-pill">
            <Cpu size={14} color="#656E66" />
            <span>Saved:</span>
            <strong style={{ color: '#3B7A57' }}>${state.tokenStats.dollarsSaved.toFixed(2)}</strong>
          </div>

          <div className="stat-divider" />

          <div className="stat-pill" title={`Current Merkle Root: ${state.merkleRoot}`}>
            <ShieldCheck size={14} color="#3B7A57" />
            <span>Merkle:</span>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              {state.merkleRoot.slice(0, 8)}...{state.merkleRoot.slice(-4)}
            </code>
          </div>
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => store.injectChaosEvent()}
            title="Inject simulated security anomaly to test surety interceptor"
          >
            <Zap size={13} color="#A8541F" />
            <span>Simulate Anomaly</span>
          </button>

          <button 
            className={`btn ${state.isStreaming ? 'btn-secondary' : 'btn-primary'} btn-sm`}
            onClick={() => store.toggleStreaming()}
            title={state.isStreaming ? 'Pause live stream simulation' : 'Resume live stream'}
          >
            {state.isStreaming ? <Pause size={13} /> : <Play size={13} />}
            <span>{state.isStreaming ? 'Pause Stream' : 'Resume'}</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => store.resetDemo()}
            title="Reset demo data to clean baseline"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
