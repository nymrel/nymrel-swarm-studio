import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// Non-blocking provider isolation: a blocked worker must freeze its telemetry
// while unrelated eligible workers keep advancing in the same simulation cycle.

// Execute the real TypeScript modules through the repository's Vite runtime.
// A copied JavaScript mirror can pass while the store or crypto source is wrong.
const sourceLoader = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  logLevel: 'silent',
  server: { middlewareMode: true },
  appType: 'custom'
});

const {
  isAgentBlocked,
  advanceAgentCycle,
  markAgentBlocked
} = await sourceLoader.ssrLoadModule('/src/mock/simulationEngine.ts');

let scheduledStoreTick;
const priorWindow = globalThis.window;
globalThis.window = {
  ...(priorWindow ?? {}),
  setInterval(callback) {
    scheduledStoreTick = callback;
    return 1;
  }
};
const { swarmStore } = await sourceLoader.ssrLoadModule('/src/state/swarmStore.ts');
if (priorWindow === undefined) {
  delete globalThis.window;
} else {
  globalThis.window = priorWindow;
}

after(async () => {
  await sourceLoader.close();
});

// Standalone SHA-256 / Merkle implementation checked against Node crypto standard
function computeSha256(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return '0x' + createHash('sha256').update(str).digest('hex');
}

function computeMerkleRoot(hashes) {
  if (hashes.length === 0) return '0x0000000000000000000000000000000000000000000000000000000000000000';
  if (hashes.length === 1) return hashes[0];

  let currentLevel = [...hashes];
  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const combined = computeSha256(left + ':' + right);
      nextLevel.push(combined);
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}

const NOW = 1755700000000;

const blockedWorker = {
  id: 'agent-codex-sol',
  name: 'Codex Sol',
  provider: 'openai',
  model: 'GPT-5.6 Sol (High Reasoning)',
  role: 'System Architect & Engine Lead',
  status: 'blocked',
  blockedReason: 'Operator rejected approval gate card-gate-1',
  activeTask: 'Synthesizing A2UI streaming transformer for Rust kernel',
  tokenRate: 46,
  totalTokens: 148200,
  fencingGen: 4,
  memoryUsageMb: 248,
  lastPing: NOW - 1000,
  hardware: 'Frontier Cloud',
  costPerHour: 1.25,
  avatarColor: '#10A37F'
};

const activeWorker = {
  id: 'agent-gemini-pro',
  name: 'Gemini 3.6 Pro',
  provider: 'google',
  model: 'gemini-3.6-pro (Antigravity)',
  role: 'Cross-Repo Advisory & Formal Verification',
  status: 'active',
  activeTask: 'Verifying zero-copy deserialization in workspace diffs',
  tokenRate: 64,
  totalTokens: 192800,
  fencingGen: 2,
  memoryUsageMb: 312,
  lastPing: NOW - 1000,
  hardware: 'Frontier Cloud',
  costPerHour: 0.90,
  avatarColor: '#4285F4'
};

describe('Non-blocking swarm scheduler isolation', () => {
  test('a blocked agent does not advance tokens, heartbeat, or memory across a cycle', () => {
    const before = JSON.parse(JSON.stringify(blockedWorker));
    const { agents, frozenAgentIds } = advanceAgentCycle([before, activeWorker], NOW, () => 0);

    const after = agents.find(a => a.id === 'agent-codex-sol');
    assert.equal(after.totalTokens, before.totalTokens, 'blocked worker must not mint tokens');
    assert.equal(after.lastPing, before.lastPing, 'blocked worker heartbeat must stay stale');
    assert.equal(after.memoryUsageMb, before.memoryUsageMb, 'blocked worker memory must not drift');
    assert.deepEqual(frozenAgentIds, ['agent-codex-sol']);
  });

  test('a separate active agent advances during the same cycle', () => {
    const { agents, frozenAgentIds } = advanceAgentCycle(
      [JSON.parse(JSON.stringify(blockedWorker)), JSON.parse(JSON.stringify(activeWorker))],
      NOW,
      () => 0
    );

    const after = agents.find(a => a.id === 'agent-gemini-pro');
    // Deterministic delta with rng()=0: floor(0 * 64 * 2.5) + 10 = 10
    assert.equal(after.totalTokens, 192810);
    assert.equal(after.lastPing, NOW);
    assert.equal(after.memoryUsageMb, 309); // 312 + (floor(0*7)-3)
    assert.deepEqual(frozenAgentIds, ['agent-codex-sol'], 'only the blocked worker freezes');
  });

  test('fencing generation remains unchanged for every agent across scheduler ticks', () => {
    let agents = [JSON.parse(JSON.stringify(blockedWorker)), JSON.parse(JSON.stringify(activeWorker))];
    const gensBefore = agents.map(a => ({ id: a.id, fencingGen: a.fencingGen }));

    for (let cycle = 0; cycle < 5; cycle++) {
      agents = advanceAgentCycle(agents, NOW + cycle * 2000, () => 0).agents;
    }

    // Mid-stream block transition must also never touch writer authority.
    agents = markAgentBlocked(agents, 'agent-gemini-pro', 'Provider rate limited');
    for (let cycle = 0; cycle < 5; cycle++) {
      agents = advanceAgentCycle(agents, NOW + 10000 + cycle * 2000, () => 0).agents;
    }

    const gensAfter = agents.map(a => ({ id: a.id, fencingGen: a.fencingGen }));
    assert.deepEqual(gensAfter, gensBefore);
  });

  test('marking a worker blocked freezes it without touching fencing generation', () => {
    const fleet = [JSON.parse(JSON.stringify(activeWorker))];
    const [frozen] = markAgentBlocked(fleet, 'agent-gemini-pro', 'Surety policy violation');

    assert.equal(frozen.status, 'blocked');
    assert.equal(frozen.blockedReason, 'Surety policy violation');
    assert.equal(frozen.fencingGen, 2, 'fencing generation is never mutated by isolation');

    const { agents } = advanceAgentCycle([frozen], NOW, () => 0);
    assert.equal(agents[0].totalTokens, frozen.totalTokens);
    assert.equal(isAgentBlocked(agents[0]), true);
  });

  test('real store rejection records an independently verified BLOCK and keeps its peer advancing', () => {
    assert.equal(typeof scheduledStoreTick, 'function', 'store must schedule its simulation tick');

    const originalTimeout = globalThis.setTimeout;
    const originalRandom = Math.random;
    const originalNow = Date.now;
    globalThis.setTimeout = () => 0;
    Math.random = () => 0;
    Date.now = () => NOW;

    try {
      swarmStore.resetDemo();
      const before = swarmStore.getState();
      const gate = before.cards.find(card => card.type === 'approval-gate');
      assert.ok(gate, 'fixture must expose an approval gate');

      const blockedBefore = before.agents.find(agent => agent.id === gate.agentId);
      const peerBefore = before.agents.find(agent => agent.id !== gate.agentId);
      assert.ok(blockedBefore, 'gate must identify an existing worker');
      assert.ok(peerBefore, 'fixture must expose an unrelated worker');

      const fencingBefore = before.agents.map(agent => ({
        id: agent.id,
        fencingGen: agent.fencingGen
      }));
      const priorRoot = before.merkleRoot;
      const priorLogCount = before.suretyLogs.length;

      swarmStore.rejectGate(gate.id);
      const rejected = swarmStore.getState();
      const blockedAtRejection = rejected.agents.find(agent => agent.id === gate.agentId);
      const receipt = rejected.suretyLogs[0];

      assert.equal(blockedAtRejection.status, 'blocked');
      assert.equal(blockedAtRejection.blockedReason, `Operator rejected approval gate ${gate.id}`);
      assert.equal(receipt.decision, 'BLOCK');
      assert.equal(receipt.agentId, gate.agentId);
      assert.equal(receipt.merkleReceipt.parentRoot, priorRoot);
      assert.equal(receipt.merkleReceipt.blockHeight, 14200 + priorLogCount);
      assert.equal(rejected.suretyLogs.length, priorLogCount + 1);

      const expectedLeaf = computeSha256({
        agentId: receipt.agentId,
        actionType: receipt.actionType,
        target: receipt.target,
        decision: receipt.decision,
        timestamp: receipt.timestamp
      });
      const expectedRoot = computeMerkleRoot(
        rejected.suretyLogs.map(log => log.merkleReceipt.leafHash)
      );
      const independentlyVerified =
        receipt.merkleReceipt.leafHash === expectedLeaf &&
        receipt.merkleReceipt.currentRoot === expectedRoot;

      assert.equal(receipt.merkleReceipt.verified, independentlyVerified);
      assert.equal(independentlyVerified, true, 'verified must never mask invalid receipt math');

      scheduledStoreTick();
      const afterTick = swarmStore.getState();
      const blockedAfter = afterTick.agents.find(agent => agent.id === gate.agentId);
      const peerAfter = afterTick.agents.find(agent => agent.id === peerBefore.id);

      assert.equal(blockedAfter.totalTokens, blockedBefore.totalTokens);
      assert.equal(blockedAfter.lastPing, blockedBefore.lastPing);
      assert.equal(blockedAfter.memoryUsageMb, blockedBefore.memoryUsageMb);
      assert.equal(peerAfter.totalTokens, peerBefore.totalTokens + 10);
      assert.equal(peerAfter.lastPing, NOW);
      assert.deepEqual(
        afterTick.agents.map(agent => ({ id: agent.id, fencingGen: agent.fencingGen })),
        fencingBefore,
        'simulation and rejection must preserve every fencing generation'
      );
    } finally {
      globalThis.setTimeout = originalTimeout;
      Math.random = originalRandom;
      Date.now = originalNow;
    }
  });
});
