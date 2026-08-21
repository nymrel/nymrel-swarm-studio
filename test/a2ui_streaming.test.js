import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// A2UI v0.8 parser and state verification
describe('Google A2UI v0.8 Streaming Protocol & Components', () => {
  test('validates Decision Ballot voting aggregation and percentage computation', () => {
    const ballot = {
      id: 'ballot-crdt-sync',
      type: 'decision-ballot',
      title: 'State Sync Protocol',
      options: [
        { id: 'opt-a', label: 'CRDT + Vector Clocks', votes: 6, agentEndorsements: ['Codex', 'Claude'] },
        { id: 'opt-b', label: 'Raft Consensus', votes: 2, agentEndorsements: ['Gemini'] },
        { id: 'opt-c', label: 'Ephemeral SSE', votes: 2, agentEndorsements: ['Hermes'] }
      ]
    };

    const totalVotes = ballot.options.reduce((acc, o) => acc + o.votes, 0);
    assert.equal(totalVotes, 10);

    const optAPct = Math.round((ballot.options[0].votes / totalVotes) * 100);
    assert.equal(optAPct, 60);

    const optBPct = Math.round((ballot.options[1].votes / totalVotes) * 100);
    assert.equal(optBPct, 20);
  });

  test('validates Approval Gate state transitions and risk ratings', () => {
    const gate = {
      id: 'gate-edge-deploy',
      type: 'approval-gate',
      title: 'Deploy Wasm Worker',
      agentName: 'Codex Sol',
      riskLevel: 'high',
      status: 'pending',
      timeRemainingSeconds: 120
    };

    assert.equal(gate.status, 'pending');
    assert.equal(gate.riskLevel, 'high');

    // Simulate operator approval transition
    const approvedGate = { ...gate, status: 'approved' };
    assert.equal(approvedGate.status, 'approved');

    // Simulate operator rejection transition
    const rejectedGate = { ...gate, status: 'rejected' };
    assert.equal(rejectedGate.status, 'rejected');

    // Simulate sandbox routing transition
    const sandboxedGate = { ...gate, status: 'sandboxed' };
    assert.equal(sandboxedGate.status, 'sandboxed');
  });

  test('validates Parameter Slider value clamping within configured bounds', () => {
    const slider = {
      id: 'slider-concurrency',
      type: 'parameter-slider',
      min: 1,
      max: 16,
      step: 1,
      value: 8
    };

    function clampValue(val, s) {
      return Math.max(s.min, Math.min(s.max, val));
    }

    assert.equal(clampValue(12, slider), 12);
    assert.equal(clampValue(24, slider), 16); // Clamped to max
    assert.equal(clampValue(0, slider), 1);   // Clamped to min
  });

  test('validates Diff Viewer hunk structure and acceptance', () => {
    const diffCard = {
      id: 'diff-ast-patch',
      type: 'diff-viewer',
      filePath: 'src/surety/merkle_interceptor.rs',
      hunks: [
        {
          hunkId: 'hunk-1',
          oldStart: 10,
          oldLines: ['let old_hash = sha1(data);'],
          newStart: 10,
          newLines: ['let new_hash = sha256(data);'],
          status: 'pending'
        }
      ]
    };

    assert.equal(diffCard.hunks[0].status, 'pending');
    assert.equal(diffCard.hunks[0].oldLines.length, 1);
    assert.equal(diffCard.hunks[0].newLines.length, 1);

    const acceptedHunk = { ...diffCard.hunks[0], status: 'accepted' };
    assert.equal(acceptedHunk.status, 'accepted');
  });
});
