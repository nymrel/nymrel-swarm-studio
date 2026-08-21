import React from 'react';
import { useSwarmStore, ActiveTab } from './state/swarmStore';
import { Header } from './components/Header';
import { SwarmRoster } from './components/SwarmRoster';
import { A2UICanvas } from './components/A2UICanvas';
import { ActionSuretyLog } from './components/ActionSuretyLog';
import { TokenEfficiencyRadar } from './components/TokenEfficiencyRadar';
import { WorkspaceInspector } from './components/WorkspaceInspector';
import { TopologyView } from './components/TopologyView';
import { 
  LayoutDashboard, 
  Network, 
  FolderGit2, 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';

export const App: React.FC = () => {
  const [state, store] = useSwarmStore();

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'deck', label: 'Command Deck', icon: <LayoutDashboard size={15} /> },
    { id: 'topology', label: 'Agent Topology', icon: <Network size={15} /> },
    { id: 'workspace', label: 'Workspace Inspector', icon: <FolderGit2 size={15} /> },
    { id: 'security', label: 'Surety Security Ledger', icon: <ShieldCheck size={15} /> }
  ];

  return (
    <div className="app-container">
      {/* Visual Command Deck Header */}
      <Header />

      {/* Main Workspace Area */}
      <main className="main-content">
        {/* Navigation Tabs */}
        <nav className="nav-tab-deck" aria-label="Studio Views">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab-btn ${state.activeTab === tab.id ? 'active' : ''}`}
              onClick={() => store.setActiveTab(tab.id)}
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

            {/* Main Grid: A2UI Streaming Canvas + Action Surety Interceptor Log */}
            <div className="deck-grid-main">
              <A2UICanvas />
              <ActionSuretyLog />
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
              <ActionSuretyLog />
            </div>
          </div>
        )}

        {/* View 4: Surety Security Ledger */}
        {state.activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ActionSuretyLog />
            <div className="deck-grid-top">
              <SwarmRoster />
              <TokenEfficiencyRadar />
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification Banner */}
      {state.toastMessage && (
        <div className="toast-banner">
          <CheckCircle2 size={16} color="#FAF8F2" />
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
            <strong>Nymrel Swarm Studio</strong> • Built under <a href="https://jalenbuilds.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-terracotta)', textDecoration: 'none' }}>JalenBuilds LLC</a>
          </div>
          <div>
            Dual-Audience Machine Trust & A2UI v0.8 Protocol • MIT Licensed • 2026
          </div>
        </div>
      </footer>
    </div>
  );
};
