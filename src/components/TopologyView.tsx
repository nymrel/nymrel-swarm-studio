import React from 'react';
import { useSwarmStore } from '../state/swarmStore';
import { Network, ArrowRight } from 'lucide-react';

export const TopologyView: React.FC = () => {
  const [state] = useSwarmStore();

  const topologyLinks = [
    { source: 'Claude Opus 5 (UX Orchestrator)', target: 'Codex Sol (System Architect)', protocol: 'gRPC Bus', rate: '42 msg/s' },
    { source: 'Codex Sol (System Architect)', target: 'Hermes 3 (Local GPU)', protocol: 'Shared Memory IPC', rate: '88 msg/s' },
    { source: 'Claude Opus 5 (UX Orchestrator)', target: 'Gemini 3.6 Pro (Advisory)', protocol: 'SSE EventStream', rate: '24 msg/s' },
    { source: 'Hermes 3 (Local GPU)', target: 'Cloudflare Sentinel Agent', protocol: 'HTTP/2 Wasm Gateway', rate: '65 msg/s' },
    { source: 'Cloudflare Sentinel Agent', target: 'Action Surety Interceptor', protocol: 'Zero-Trust Merkle Pipe', rate: '110 msg/s' }
  ];

  return (
    <div className="card-panel">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Network size={18} color="#A8541F" />
            Live Swarm Agent Topology & Interconnect Bus
          </h2>
          <p className="section-subtitle">
            Zero-contention peer communication channels, vector clock coordination, and Merkle telemetry
          </p>
        </div>
        <span className="a2ui-badge" style={{ backgroundColor: '#EEF5F1', color: '#3B7A57' }}>
          Bus Protocol: v1.4 Active
        </span>
      </div>

      {/* SVG Interactive Topology Diagram */}
      <div style={{
        background: 'var(--color-bg-surface-elevated)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          width: '100%',
          marginBottom: '24px'
        }}>
          {state.agents.map((agent) => (
            <div 
              key={agent.id}
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div 
                className="agent-avatar"
                style={{ backgroundColor: agent.avatarColor, width: '32px', height: '32px' }}
              >
                {agent.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {agent.name}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {agent.hardware}
                </div>
              </div>
              <span className="status-dot pulse-dot" style={{ backgroundColor: '#3B7A57' }} />
            </div>
          ))}
        </div>

        {/* Bus Links Matrix */}
        <div style={{ width: '100%' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '10px' }}>
            Active Inter-Agent Data Channels
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topologyLinks.map((link, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--color-bg-surface)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>{link.source}</strong>
                  <ArrowRight size={13} color="#A8541F" />
                  <strong style={{ color: 'var(--color-text-primary)' }}>{link.target}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="hardware-tag">{link.protocol}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#3B7A57', fontWeight: 600 }}>
                    {link.rate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
