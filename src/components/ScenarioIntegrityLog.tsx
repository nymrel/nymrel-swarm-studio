import React, { useState } from 'react';
import { useSwarmStore } from '../state/swarmStore';
import type { LogFilter } from '../state/swarmStore';
import type { ScenarioEvent } from '../types';
import { 
  ShieldCheck, 
  Search, 
  Lock, 
  Hash, 
  FileCode, 
  Terminal, 
  Globe, 
  Key, 
  GitCommit,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';

export const ScenarioIntegrityLog: React.FC = () => {
  const [state, store] = useSwarmStore();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      globalThis.setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      store.showToast('Clipboard access is unavailable in this browser context.');
    }
  };

  const filteredLogs = state.scenarioLogs.filter(log => {
    // 1. Filter by decision type
    if (state.logFilter === 'ALLOW' && log.decision !== 'ALLOW') return false;
    if (state.logFilter === 'BLOCK' && log.decision !== 'BLOCK') return false;
    if (state.logFilter === 'HASHES' && !log.localDigest.locallyConsistent) return false;

    // 2. Filter by search query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      const matchTarget = log.target.toLowerCase().includes(q);
      const matchAgent = log.agentName.toLowerCase().includes(q);
      const matchRule = log.policyRule.toLowerCase().includes(q);
      const matchHash = log.localDigest.leafHash.toLowerCase().includes(q);
      return matchTarget || matchAgent || matchRule || matchHash;
    }

    return true;
  });

  const getActionIcon = (actionType: ScenarioEvent['actionType']) => {
    switch (actionType) {
      case 'file_write': return <FileCode size={13} color="#2C6E8F" />;
      case 'shell_exec': return <Terminal size={13} color="#A8541F" />;
      case 'network_egress': return <Globe size={13} color="#D97706" />;
      case 'secret_read': return <Key size={13} color="#9E2A2B" />;
      case 'git_commit': return <GitCommit size={13} color="#2F6B4B" />;
      default: return <Hash size={13} color="#4F5952" />;
    }
  };

  return (
    <div className="card-panel">
      {/* Header & Merkle Root Banner */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <ShieldCheck size={18} color="#3B7A57" />
            Scenario integrity log
          </h2>
          <p className="section-subtitle">
            Synthetic action records with locally recomputed SHA-256 leaves and roots—not enforcement, provenance, or an audit system
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="local-hash-badge" style={{ backgroundColor: '#EEF5F1', color: '#2F6B4B', fontWeight: 600 }}>
            <CheckCircle size={11} /> Locally recomputed
          </span>
        </div>
      </div>

      {/* Locally recomputed fixture root */}
      <div className="fixture-root-strip" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--color-bg-surface-alt)',
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '12px',
        fontSize: '11.5px',
        fontFamily: 'var(--font-mono)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lock size={12} color="#A8541F" />
          <span style={{ color: 'var(--color-text-secondary)' }}>FIXTURE ROOT:</span>
          <strong style={{ color: 'var(--color-text-primary)' }}>{state.merkleRoot}</strong>
        </div>
        <button 
          className="btn btn-secondary btn-sm"
          style={{ padding: '2px 6px', fontSize: '10.5px' }}
          onClick={() => void handleCopy(state.merkleRoot)}
          aria-label="Copy the locally computed fixture root"
        >
          {copiedHash === state.merkleRoot ? <Check size={11} /> : <Copy size={11} />}
          {copiedHash === state.merkleRoot ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Controls: Search and Filter Pills */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--color-bg-surface-elevated)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 10px'
        }}>
          <Search size={13} color="#555A54" />
          <input 
            type="text"
            placeholder="Search example target, rule, role, or hash…"
            value={state.searchQuery}
            onChange={(e) => store.setSearchQuery(e.target.value)}
            aria-label="Search synthetic integrity records"
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '12px',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>

        <div className="log-filter-deck" style={{ display: 'flex', gap: '4px' }}>
          {(['ALL', 'ALLOW', 'BLOCK', 'HASHES'] as LogFilter[]).map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${state.logFilter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => store.setLogFilter(f)}
              aria-pressed={state.logFilter === f}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              {f === 'BLOCK' ? 'Block scenarios' : f === 'HASHES' ? 'Local hashes' : f === 'ALLOW' ? 'Allow scenarios' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario-integrity records */}
      <div className="integrity-log-list">
        {filteredLogs.map((log) => {
          return (
            <div key={log.id} className={`integrity-log-item decision-${log.decision}`}>
              <div className="integrity-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getActionIcon(log.actionType)}
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {log.agentName}
                  </span>
                  <span className="hardware-tag" style={{ fontSize: '10px' }}>
                    {log.actionType}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="status-badge" style={{
                    backgroundColor: log.decision === 'ALLOW' ? '#EEF5F1' : log.decision === 'BLOCK' ? '#FDF0F0' : '#FDF6EC',
                    color: log.decision === 'ALLOW' ? '#2F6B4B' : log.decision === 'BLOCK' ? '#9E2A2B' : '#744B09',
                    fontSize: '10px'
                  }}>
                    {log.decision} · sample risk {log.riskScore}/100
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Target & Payload */}
              <div className="integrity-target">
                {log.target}
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                {log.payloadSummary}
              </div>

              {/* Fixture policy label and local hash */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px dashed var(--color-border-subtle)',
                paddingTop: '6px',
                marginTop: '2px',
                fontSize: '10.5px'
              }}>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {log.policyRule}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="local-hash-badge" title={`Fixture sequence: ${log.localDigest.blockHeight}`}>
                    <Hash size={10} />
                    {log.localDigest.leafHash.slice(0, 10)}...
                  </span>
                  <button 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '1px 5px', fontSize: '9.5px' }}
                    onClick={() => void handleCopy(log.localDigest.leafHash)}
                  >
                    {copiedHash === log.localDigest.leafHash ? 'Copied' : 'Copy hash'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No synthetic records match the current filter or search.
          </div>
        )}
      </div>
    </div>
  );
};
