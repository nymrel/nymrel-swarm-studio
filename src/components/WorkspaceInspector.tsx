import React from 'react';
import { useSwarmStore } from '../state/swarmStore';
import { WorkspaceFile } from '../types';
import { 
  FolderGit2, 
  FileCode2, 
  RotateCcw, 
  GitBranch, 
  Plus, 
  Minus, 
  FileCheck,
  X
} from 'lucide-react';

export const WorkspaceInspector: React.FC = () => {
  const [state, store] = useSwarmStore();
  const selectedFile = state.selectedFile;

  const getStatusBadge = (status: WorkspaceFile['status']) => {
    switch (status) {
      case 'modified':
        return <span className="a2ui-badge" style={{ backgroundColor: '#FDF6EC', color: '#C88A2E' }}>MODIFIED</span>;
      case 'created':
        return <span className="a2ui-badge" style={{ backgroundColor: '#EEF5F1', color: '#3B7A57' }}>CREATED</span>;
      case 'staged':
        return <span className="a2ui-badge" style={{ backgroundColor: '#EDF5F8', color: '#2C6E8F' }}>STAGED</span>;
      default:
        return <span className="a2ui-badge" style={{ backgroundColor: '#F4F0E6', color: '#8E8A80' }}>{status.toUpperCase()}</span>;
    }
  };

  return (
    <div className="card-panel">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <FolderGit2 size={18} color="#A8541F" />
            Workspace & Worktree Inspector
          </h2>
          <p className="section-subtitle">
            Live file modifications, multi-worktree AST diffs, and instant rollback guarantees
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="merkle-hash-badge">
            <GitBranch size={12} />
            branch: <strong>feat/a2ui-streaming-v08</strong>
          </span>
        </div>
      </div>

      <div className="workspace-files-list">
        {state.workspaceFiles.map((file) => {
          const isSelected = selectedFile?.path === file.path;
          return (
            <div 
              key={file.path}
              className={`file-row ${isSelected ? 'selected' : ''}`}
              onClick={() => store.selectFile(isSelected ? null : file)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCode2 size={16} color="#2A332E" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {file.path} • Modified by {file.lastModifiedByAgent}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#3B7A57', display: 'flex', alignItems: 'center' }}>
                    <Plus size={11} />{file.linesAdded}
                  </span>
                  <span style={{ color: '#9E2A2B', display: 'flex', alignItems: 'center' }}>
                    <Minus size={11} />{file.linesRemoved}
                  </span>
                </div>

                {getStatusBadge(file.status)}

                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    store.rollbackFile(file.path);
                  }}
                  title="Revert file to origin state"
                  style={{ padding: '3px 8px' }}
                >
                  <RotateCcw size={12} />
                  <span>Rollback</span>
                </button>
              </div>
            </div>
          );
        })}
        {state.workspaceFiles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            <FileCheck size={28} color="#3B7A57" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            Clean workspace tree. All modifications committed or rolled back safely.
          </div>
        )}
      </div>

      {/* Diff Preview Drawer when a file is selected */}
      {selectedFile && (
        <div style={{
          marginTop: '16px',
          background: 'var(--color-bg-surface-elevated)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode2 size={16} color="#A8541F" />
              <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                Diff Inspection: {selectedFile.path}
              </strong>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => store.selectFile(null)}
              style={{ padding: '2px 6px' }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="diff-box">
            {selectedFile.diffPreview.split('\n').map((line, idx) => (
              <div 
                key={idx} 
                className={
                  line.startsWith('+') ? 'diff-line-add' : 
                  line.startsWith('-') ? 'diff-line-del' : 
                  line.startsWith('@') ? 'diff-line-info' : ''
                }
              >
                {line}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
              Last changed: {new Date(selectedFile.lastModified).toLocaleTimeString()}
            </span>
            <button 
              className="btn btn-danger btn-sm"
              onClick={() => store.rollbackFile(selectedFile.path)}
            >
              <RotateCcw size={12} /> Revert File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
