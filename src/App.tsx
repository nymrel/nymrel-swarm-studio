import React from 'react';
import { useSwarmStore } from './state/swarmStore';
import type { ActiveTab } from './state/swarmStore';
import { Header } from './components/Header';
import { SwarmRoster } from './components/SwarmRoster';
import { ScenarioCanvas } from './components/ScenarioCanvas';
import { ScenarioIntegrityLog } from './components/ScenarioIntegrityLog';
import { TokenEfficiencyRadar } from './components/TokenEfficiencyRadar';
import { WorkspaceInspector } from './components/WorkspaceInspector';
import { TopologyView } from './components/TopologyView';
import { 
  LayoutDashboard, 
  Network, 
  FolderGit2, 
  ShieldCheck, 
  CheckCircle2,
  Info,
} from 'lucide-react';

export const App: React.FC = () => {
  const [state, store] = useSwarmStore();

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'deck', label: 'Scenario Deck', icon: <LayoutDashboard size={15} aria-hidden="true" /> },
    { id: 'topology', label: 'Example Topology', icon: <Network size={15} aria-hidden="true" /> },
    { id: 'workspace', label: 'Workspace Fixture', icon: <FolderGit2 size={15} aria-hidden="true" /> },
    { id: 'security', label: 'Integrity Log', icon: <ShieldCheck size={15} aria-hidden="true" /> },
  ];

  return (
    <div className="app-container">
      {/* Visual Command Deck Header */}
      <Header />

      <aside className="trust-banner" aria-label="Data and capability boundary">
        <Info size={17} aria-hidden="true" />
        <div>
          <strong>Synthetic fixture · browser-only</strong>
          <span>No agents, repositories, providers, telemetry, files, commands, sandboxes, or deployments are connected. Every interaction changes only in-memory example state.</span>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-content">
        {/* Navigation Tabs */}
        <nav className="nav-tab-deck" aria-label="Studio Views">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab-btn ${state.activeTab === tab.id ? 'active' : ''}`}
              onClick={() => store.setActiveTab(tab.id)}
              aria-current={state.activeTab === tab.id ? 'page' : undefined}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* View 1: Unified Command Deck */}
        {state.activeTab === 'deck' && (
          <div>
            {/* Top Grid: Swarm Fleet Roster + Token Efficiency Radar */}
            <div className="deck-grid-top">
              <SwarmRoster />
              <TokenEfficiencyRadar />
            </div>

            {/* Main Grid: scenario canvas + local integrity log */}
            <div className="deck-grid-main">
              <ScenarioCanvas />
              <ScenarioIntegrityLog />
            </div>

            {/* Bottom Row: Workspace Inspector */}
            <div style={{ marginTop: '20px' }}>
              <WorkspaceInspector />
            </div>
          </div>
        )}

        {/* View 2: Swarm Topology */}
        {state.activeTab === 'topology' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <TopologyView />
            <SwarmRoster />
          </div>
        )}

        {/* View 3: Workspace Inspector */}
        {state.activeTab === 'workspace' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <WorkspaceInspector />
            <div className="deck-grid-top">
              <TokenEfficiencyRadar />
              <ScenarioIntegrityLog />
            </div>
          </div>
        )}

        {/* View 4: local scenario-integrity records */}
        {state.activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ScenarioIntegrityLog />
            <div className="deck-grid-top">
              <SwarmRoster />
              <TokenEfficiencyRadar />
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification Banner */}
      {state.toastMessage && (
        <div className="toast-banner" role="status" aria-live="polite">
          <CheckCircle2 size={16} color="#FAF8F2" aria-hidden="true" />
          <span>{state.toastMessage}</span>
        </div>
      )}

      {/* Nymrel Studio Footer */}
      <footer style={{
        background: 'var(--color-bg-surface)',
        borderTop: '1px solid var(--color-border-default)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--color-text-secondary)'
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong>Nymrel Swarm Studio</strong> · A <a href="https://nymrel.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-terracotta)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Nymrel</a> reference interface
          </div>
          <div>
            Synthetic fixtures · no external side effects · MIT licensed · 2026
          </div>
        </div>
      </footer>
    </div>
  );
};
