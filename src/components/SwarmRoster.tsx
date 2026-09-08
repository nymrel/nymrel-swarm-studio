import React from 'react';
import { useSwarmStore } from '../state/swarmStore';
import type { Agent } from '../types';
import { 
  Bot, 
  Activity, 
  HardDrive, 
  X
} from 'lucide-react';

export const SwarmRoster: React.FC = () => {
  const [state, store] = useSwarmStore();
  const selectedAgent = state.agents.find(a => a.id === state.selectedAgentId);

  const getStatusBadge = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="agent-status-badge" style={{ backgroundColor: '#EEF5F1', color: '#2F6B4B' }}>
            <span className="status-dot pulse-dot" style={{ backgroundColor: '#3B7A57' }} />
            Active
          </span>
        );
      case 'thinking':
        return (
          <span className="agent-status-badge" style={{ backgroundColor: '#FDF6EC', color: '#744B09' }}>
            <span className="status-dot pulse-dot" style={{ backgroundColor: '#744B09' }} />
            Synthesizing
          </span>
        );
      case 'waiting_approval':
        return (
          <span className="agent-status-badge" style={{ backgroundColor: '#FDF0F0', color: '#9E2A2B' }}>
            <span className="status-dot" style={{ backgroundColor: '#9E2A2B' }} />
            Gate Hold
          </span>
        );
      case 'sandboxed':
        return (
          <span className="agent-status-badge" style={{ backgroundColor: '#EDF5F8', color: '#2C6E8F' }}>
            <span className="status-dot" style={{ backgroundColor: '#2C6E8F' }} />
            Sandboxed
          </span>
        );
      case 'blocked':
        return (
          <span className="agent-status-badge" style={{ backgroundColor: '#FDF0F0', color: '#8B3032' }}>
            <span className="status-dot" style={{ backgroundColor: '#8B3032' }} />
            Blocked fixture
          </span>
        );
      default:
        return (
          <span className="agent-status-badge" style={{ backgroundColor: '#F4F0E6', color: '#555A54' }}>
            <span className="status-dot" style={{ backgroundColor: '#555A54' }} />
            Idle
          </span>
        );
    }
  };

  return (
    <div className="card-panel">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Bot size={18} color="#A8541F" />
            Example worker roster
          </h2>
          <p className="section-subtitle">Synthetic roles and changing values for evaluating a command-deck layout</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="hardware-tag">1 local example</span>
          <span className="hardware-tag">1 edge example</span>
          <span className="hardware-tag">3 hosted examples</span>
        </div>
      </div>

      <div className="swarm-roster-grid">
        {state.agents.map((agent) => {
          const isSelected = state.selectedAgentId === agent.id;
          return (
            <div 
              key={agent.id}
              className={`agent-card ${isSelected ? 'selected' : ''}`}
              onClick={() => store.selectAgent(isSelected ? null : agent.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  store.selectAgent(isSelected ? null : agent.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              style={{ cursor: 'pointer' }}
            >
              <div className="agent-card-header">
                <div className="agent-identity">
                  <div 
                    className="agent-avatar" 
                    style={{ backgroundColor: agent.avatarColor }}
                  >
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-model">{agent.model}</div>
                  </div>
                </div>
                {getStatusBadge(agent.status)}
              </div>

              {/* Task description */}
              <div className="agent-task-box">
                <strong style={{ display: 'block', fontSize: '11px', color: '#2A332E', marginBottom: '2px' }}>
                  {agent.role}
                </strong>
                <span>{agent.activeTask}</span>
              </div>

              {/* Telemetry Row */}
              <div className="agent-telemetry-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={12} color="#3B7A57" />
                  <strong>{agent.tokenRate} t/s</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <HardDrive size={12} color="#656E66" />
                  <span>{agent.memoryUsageMb} MB</span>
                </span>
                <span className="hardware-tag">
                  {agent.hardware}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Agent Inspection Drawer */}
      {selectedAgent && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: 'var(--color-bg-surface-elevated)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="agent-avatar" style={{ backgroundColor: selectedAgent.avatarColor, width: '28px', height: '28px' }}>
                {selectedAgent.name.slice(0, 2)}
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                {selectedAgent.name} fixture details
              </strong>
              <span className="status-badge" style={{ background: '#EAE4D7' }}>
                Example generation: {selectedAgent.fencingGen}
              </span>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => store.selectAgent(null)}
              style={{ padding: '2px 6px' }}
              aria-label="Close fixture details"
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
            <div className="eff-stat-card">
              <div className="eff-stat-value">{selectedAgent.totalTokens.toLocaleString()}</div>
              <div className="eff-stat-label">Illustrative tokens</div>
            </div>
            <div className="eff-stat-card">
              <div className="eff-stat-value">${selectedAgent.costPerHour.toFixed(2)}/hr</div>
              <div className="eff-stat-label">Illustrative hourly rate</div>
            </div>
            <div className="eff-stat-card">
              <div className="eff-stat-value">{selectedAgent.tokenRate} t/s</div>
              <div className="eff-stat-label">Illustrative velocity</div>
            </div>
            <div className="eff-stat-card">
              <div className="eff-stat-value">{selectedAgent.memoryUsageMb} MB</div>
              <div className="eff-stat-label">Illustrative memory</div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            <strong>Example task label: </strong>
            <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--color-bg-surface-alt)', padding: '2px 6px', borderRadius: '4px' }}>
              {selectedAgent.activeTask}
            </code>
          </div>
        </div>
      )}
    </div>
  );
};
