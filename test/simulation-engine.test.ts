import { describe, expect, it } from 'vitest';
import type { Agent } from '../src/types';
import {
  INITIAL_AGENTS,
  advanceAgentCycle,
  computeTokenStats,
  createInitialScenarioLogs,
  isAgentBlocked,
  markAgentBlocked,
} from '../src/mock/simulationEngine';
import { computeMerkleRoot, computeSha256 } from '../src/mock/merkle';

const NOW = 1_800_000_000_000;

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    ...structuredClone(INITIAL_AGENTS[0]!),
    id: 'agent-test',
    totalTokens: 100,
    tokenRate: 20,
    memoryUsageMb: 100,
    lastPing: NOW - 1_000,
    ...overrides,
  };
}

describe('synthetic scheduler', () => {
  it('freezes blocked workers while independently advancing eligible workers', () => {
    const blocked = makeAgent({ id: 'blocked', status: 'blocked', blockedReason: 'example block' });
    const active = makeAgent({ id: 'active' });
    const result = advanceAgentCycle([blocked, active], NOW, () => 0);

    expect(result.frozenAgentIds).toEqual(['blocked']);
    expect(result.agents[0]).toBe(blocked);
    expect(result.agents[1]).toMatchObject({ totalTokens: 110, lastPing: NOW, memoryUsageMb: 97 });
  });

  it('bounds simulated memory drift and preserves fencing generations', () => {
    const high = makeAgent({ id: 'high', memoryUsageMb: 2_400, fencingGen: 9 });
    const low = makeAgent({ id: 'low', memoryUsageMb: 48, fencingGen: 11 });
    expect(advanceAgentCycle([high], NOW, () => 0.999).agents[0]).toMatchObject({ memoryUsageMb: 2_400, fencingGen: 9 });
    expect(advanceAgentCycle([low], NOW, () => 0).agents[0]).toMatchObject({ memoryUsageMb: 48, fencingGen: 11 });
  });

  it('marks only the requested eligible worker blocked', () => {
    const agents = [makeAgent({ id: 'one' }), makeAgent({ id: 'two', status: 'blocked', blockedReason: 'prior' })];
    const next = markAgentBlocked(agents, 'one', 'review gate');
    expect(next[0]).toMatchObject({ status: 'blocked', blockedReason: 'review gate' });
    expect(next[0]?.fencingGen).toBe(agents[0]?.fencingGen);
    expect(next[1]).toBe(agents[1]);
    expect(isAgentBlocked(next[0]!)).toBe(true);
  });
});

describe('synthetic routing summary', () => {
  it('separates fixture tiers and computes the documented example formula', () => {
    const agents = [
      makeAgent({ hardware: 'Local accelerator', totalTokens: 500_000 }),
      makeAgent({ hardware: 'Edge inference', totalTokens: 300_000 }),
      makeAgent({ hardware: 'Hosted model', totalTokens: 200_000 }),
    ];
    expect(computeTokenStats(agents)).toEqual({
      localGpuTokens: 500_000,
      edgeWorkersTokens: 300_000,
      meteredFrontierTokens: 200_000,
      totalTokens: 1_000_000,
      estimatedCostSpent: 3.15,
      frontierBaselineCost: 15,
      dollarsSaved: 11.85,
      efficiencyScore: 80,
    });
  });

  it('returns a zeroed summary for an empty fixture', () => {
    expect(computeTokenStats([])).toEqual({
      localGpuTokens: 0,
      edgeWorkersTokens: 0,
      meteredFrontierTokens: 0,
      totalTokens: 0,
      estimatedCostSpent: 0,
      frontierBaselineCost: 0,
      dollarsSaved: 0,
      efficiencyScore: 0,
    });
  });
});

describe('synthetic integrity fixtures', () => {
  it('builds deterministic, locally consistent leaves and roots', () => {
    const { logs, root } = createInitialScenarioLogs(NOW);
    expect(logs).toHaveLength(5);
    expect(logs.every(log => log.payloadSummary.startsWith('Synthetic'))).toBe(true);

    for (const log of logs) {
      expect(log.localDigest.leafHash).toBe(computeSha256({
        agentId: log.agentId,
        actionType: log.actionType,
        target: log.target,
        decision: log.decision,
        timestamp: log.timestamp,
      }));
    }

    const chronologicalLeaves = [...logs].reverse().map(log => log.localDigest.leafHash);
    expect(root).toBe(computeMerkleRoot(chronologicalLeaves));
  });
});
