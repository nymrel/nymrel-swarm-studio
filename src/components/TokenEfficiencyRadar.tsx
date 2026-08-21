import React from 'react';
import { useSwarmStore } from '../state/swarmStore';
import { 
  PieChart, 
  Sparkles
} from 'lucide-react';

export const TokenEfficiencyRadar: React.FC = () => {
  const [state] = useSwarmStore();
  const { tokenStats } = state;

  const localPct = tokenStats.totalTokens > 0 
    ? Math.round((tokenStats.localGpuTokens / tokenStats.totalTokens) * 100) 
    : 0;
  const edgePct = tokenStats.totalTokens > 0 
    ? Math.round((tokenStats.edgeWorkersTokens / tokenStats.totalTokens) * 100) 
    : 0;
  const frontierPct = Math.max(0, 100 - localPct - edgePct);

  return (
    <div className="card-panel">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <PieChart size={18} color="#A8541F" />
            Token Routing & Cost Radar
          </h2>
          <p className="section-subtitle">
            Local RTX 4090 ($0) + Cloudflare Edge ($0.0005/k) vs Frontier Cloud ($0.015/k)
          </p>
        </div>
        <span className="a2ui-badge" style={{ backgroundColor: '#EEF5F1', color: '#3B7A57' }}>
          {tokenStats.efficiencyScore}% Non-Metered
        </span>
      </div>

      <div className="radar-container">
        {/* Visual Stacked Efficiency Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Swarm Compute Tier Allocation</span>
            <strong style={{ color: 'var(--color-text-primary)' }}>{tokenStats.totalTokens.toLocaleString()} Total Tokens</strong>
          </div>
          <div className="efficiency-breakdown-bar">
            <div 
              className="eff-segment eff-local" 
              style={{ width: `${localPct}%` }} 
              title={`Local GPU (RTX 4090): ${localPct}%`} 
            />
            <div 
              className="eff-segment eff-edge" 
              style={{ width: `${edgePct}%` }} 
              title={`Edge Workers AI: ${edgePct}%`} 
            />
            <div 
              className="eff-segment eff-frontier" 
              style={{ width: `${frontierPct}%` }} 
              title={`Metered Frontier: ${frontierPct}%`} 
            />
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#6B7280' }} />
            <span>Local GPU ({localPct}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#F38020' }} />
            <span>Edge Workers ({edgePct}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#10A37F' }} />
            <span>Frontier ({frontierPct}%)</span>
          </div>
        </div>

        {/* 3 Metrics Cards */}
        <div className="efficiency-stats-grid">
          <div className="eff-stat-card">
            <div className="eff-stat-value" style={{ color: '#3B7A57' }}>
              ${tokenStats.dollarsSaved.toFixed(2)}
            </div>
            <div className="eff-stat-label">Dollars Saved</div>
          </div>

          <div className="eff-stat-card">
            <div className="eff-stat-value" style={{ color: 'var(--color-brand-terracotta)' }}>
              ${tokenStats.estimatedCostSpent.toFixed(2)}
            </div>
            <div className="eff-stat-label">Actual Spent</div>
          </div>

          <div className="eff-stat-card">
            <div className="eff-stat-value" style={{ color: '#8E8A80' }}>
              ${tokenStats.frontierBaselineCost.toFixed(2)}
            </div>
            <div className="eff-stat-label">Frontier Baseline</div>
          </div>
        </div>

        {/* Efficiency Routing Rule Banner */}
        <div style={{
          background: 'var(--color-bg-surface-elevated)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={16} color="#A8541F" style={{ flexShrink: 0 }} />
          <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
            <strong>Nymrel Peak-Efficiency Doctrine:</strong> High-volume property tests & AST indexing run at $0 on local Hermes 3 (RTX 4090); frontier Sol/Opus models are invoked solely for architectural decisions & high-risk gates.
          </div>
        </div>
      </div>
    </div>
  );
};
