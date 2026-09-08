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
            Illustrative routing mix
          </h2>
          <p className="section-subtitle">
            Synthetic token counts and fixed example rates—not provider telemetry, pricing, usage, savings, or invoices
          </p>
        </div>
        <span className="status-badge" style={{ backgroundColor: '#EEF5F1', color: '#2F6B4B' }}>
          {tokenStats.efficiencyScore}% local/edge fixture
        </span>
      </div>

      <div className="radar-container">
        {/* Visual Stacked Efficiency Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Scenario allocation</span>
            <strong style={{ color: 'var(--color-text-primary)' }}>{tokenStats.totalTokens.toLocaleString()} sample tokens</strong>
          </div>
          <div className="efficiency-breakdown-bar">
            <div 
              className="eff-segment eff-local" 
              style={{ width: `${localPct}%` }} 
              title={`Local accelerator fixture: ${localPct}%`}
            />
            <div 
              className="eff-segment eff-edge" 
              style={{ width: `${edgePct}%` }} 
              title={`Edge inference fixture: ${edgePct}%`}
            />
            <div 
              className="eff-segment eff-frontier" 
              style={{ width: `${frontierPct}%` }} 
              title={`Hosted model fixture: ${frontierPct}%`}
            />
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#6B7280' }} />
            <span>Local example ({localPct}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#F38020' }} />
            <span>Edge example ({edgePct}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#10A37F' }} />
            <span>Hosted example ({frontierPct}%)</span>
          </div>
        </div>

        {/* 3 Metrics Cards */}
        <div className="efficiency-stats-grid">
          <div className="eff-stat-card">
            <div className="eff-stat-value" style={{ color: '#2F6B4B' }}>
              ${tokenStats.dollarsSaved.toFixed(2)}
            </div>
            <div className="eff-stat-label">Illustrative difference</div>
          </div>

          <div className="eff-stat-card">
            <div className="eff-stat-value" style={{ color: 'var(--color-brand-terracotta)' }}>
              ${tokenStats.estimatedCostSpent.toFixed(2)}
            </div>
            <div className="eff-stat-label">Illustrative weighted cost</div>
          </div>

          <div className="eff-stat-card">
            <div className="eff-stat-value" style={{ color: '#555A54' }}>
              ${tokenStats.frontierBaselineCost.toFixed(2)}
            </div>
            <div className="eff-stat-label">Illustrative hosted baseline</div>
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
            <strong>Reading the fixture:</strong> the model demonstrates how a product could distinguish local, edge, and hosted workloads. The numbers are deliberately static examples and do not measure a real system.
          </div>
        </div>
      </div>
    </div>
  );
};
