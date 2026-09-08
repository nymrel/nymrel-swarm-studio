import type {
  ScenarioEvent,
  Agent,
  ScenarioCard,
  TokenEfficiencyStats,
  WorkspaceFile,
} from '../types';
import { computeMerkleRoot, computeSha256 } from './merkle';

const fixtureOrigin = Date.now();

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent-architecture-example',
    name: 'Architecture worker',
    provider: 'hosted',
    model: 'Example hosted reasoning profile',
    role: 'Architecture review scenario',
    status: 'active',
    activeTask: 'Reviewing a sample event-boundary proposal',
    tokenRate: 46,
    totalTokens: 148_200,
    fencingGen: 4,
    memoryUsageMb: 248,
    lastPing: fixtureOrigin,
    hardware: 'Hosted model',
    costPerHour: 1.25,
    avatarColor: '#2F6B57',
  },
  {
    id: 'agent-experience-example',
    name: 'Experience worker',
    provider: 'hosted',
    model: 'Example hosted design profile',
    role: 'Rendered acceptance scenario',
    status: 'thinking',
    activeTask: 'Drafting a sample operator decision card',
    tokenRate: 38,
    totalTokens: 122_400,
    fencingGen: 3,
    memoryUsageMb: 194,
    lastPing: fixtureOrigin,
    hardware: 'Hosted model',
    costPerHour: 1.8,
    avatarColor: '#B65F2A',
  },
  {
    id: 'agent-verification-example',
    name: 'Verification worker',
    provider: 'hosted',
    model: 'Example hosted verification profile',
    role: 'Cross-repository review scenario',
    status: 'active',
    activeTask: 'Checking a sample serialization boundary',
    tokenRate: 64,
    totalTokens: 192_800,
    fencingGen: 2,
    memoryUsageMb: 312,
    lastPing: fixtureOrigin,
    hardware: 'Hosted model',
    costPerHour: 0.9,
    avatarColor: '#486E91',
  },
  {
    id: 'agent-local-example',
    name: 'Local test worker',
    provider: 'local',
    model: 'Example local coding profile',
    role: 'High-volume test scenario',
    status: 'active',
    activeTask: 'Generating sample property-test cases',
    tokenRate: 88,
    totalTokens: 584_000,
    fencingGen: 7,
    memoryUsageMb: 1_840,
    lastPing: fixtureOrigin,
    hardware: 'Local accelerator',
    costPerHour: 0,
    avatarColor: '#626A65',
  },
  {
    id: 'agent-edge-example',
    name: 'Edge policy worker',
    provider: 'edge',
    model: 'Example edge inference profile',
    role: 'Policy-review scenario',
    status: 'active',
    activeTask: 'Classifying sample egress decisions',
    tokenRate: 72,
    totalTokens: 412_000,
    fencingGen: 5,
    memoryUsageMb: 64,
    lastPing: fixtureOrigin,
    hardware: 'Edge inference',
    costPerHour: 0.08,
    avatarColor: '#8A5217',
  },
];

export const INITIAL_WORKSPACE_FILES: WorkspaceFile[] = [
  {
    path: 'src/review/integrity-log.ts',
    name: 'integrity-log.ts',
    status: 'modified',
    linesAdded: 18,
    linesRemoved: 4,
    lastModifiedByAgent: 'Architecture worker',
    diffPreview: `@@ -14,7 +14,12 @@ export function appendScenario(event) {
+  const leaf = computeSha256(event);
+  return { ...event, leaf, source: "fixture" };
 }`,
    lastModified: fixtureOrigin - 1000 * 60 * 3,
  },
  {
    path: 'src/ui/scenario-card.ts',
    name: 'scenario-card.ts',
    status: 'created',
    linesAdded: 32,
    linesRemoved: 0,
    lastModifiedByAgent: 'Experience worker',
    diffPreview: `+ export interface ScenarioCard {
+   source: "synthetic-fixture";
+   kind: "ballot" | "gate" | "diff";
+   payload: unknown;
+ }`,
    lastModified: fixtureOrigin - 1000 * 60 * 8,
  },
  {
    path: 'config/example-policy.json',
    name: 'example-policy.json',
    status: 'staged',
    linesAdded: 8,
    linesRemoved: 2,
    lastModifiedByAgent: 'Verification worker',
    diffPreview: `@@ -2,4 +2,8 @@
- "allowUnknownDestinations": true
+ "allowUnknownDestinations": false,
+ "source": "fixture",
+ "enforcement": false`,
    lastModified: fixtureOrigin - 1000 * 60 * 15,
  },
  {
    path: 'test/example-boundary.test.ts',
    name: 'example-boundary.test.ts',
    status: 'modified',
    linesAdded: 14,
    linesRemoved: 1,
    lastModifiedByAgent: 'Local test worker',
    diffPreview: `+ test("labels fixture-only decisions", () => {
+   expect(exampleDecision.source).toBe("synthetic-fixture");
+ });`,
    lastModified: fixtureOrigin - 1000 * 60 * 22,
  },
];

export const INITIAL_SCENARIO_CARDS: ScenarioCard[] = [
  {
    id: 'card-ballot-1',
    type: 'decision-ballot',
    title: 'State synchronization trade-off',
    description: 'A browser-only decision fixture for comparing coordination approaches. Selecting an option has no external effect.',
    proposerAgent: 'Experience worker',
    status: 'open',
    createdAt: fixtureOrigin - 1000 * 60 * 2,
    options: [
      {
        id: 'opt-events',
        label: 'Event log with deterministic reducers',
        description: 'A sample design favoring explicit state transitions and replayable fixtures.',
        votes: 4,
        agentEndorsements: ['Experience worker', 'Architecture worker'],
        userVoted: false,
      },
      {
        id: 'opt-consensus',
        label: 'Consensus-backed coordination',
        description: 'A sample design favoring stronger coordination at higher operational cost.',
        votes: 1,
        agentEndorsements: ['Verification worker'],
        userVoted: false,
      },
      {
        id: 'opt-snapshot',
        label: 'Snapshot plus append-only changes',
        description: 'A sample design favoring low implementation complexity.',
        votes: 2,
        agentEndorsements: ['Edge policy worker'],
        userVoted: false,
      },
    ],
  },
  {
    id: 'card-gate-1',
    type: 'approval-gate',
    title: 'Review scenario: protected release action',
    agentName: 'Architecture worker',
    agentId: 'agent-architecture-example',
    operationType: 'edge_deployment',
    riskLevel: 'high',
    commandOrPayload: 'releaseExample({ environment: "protected", dryRun: true })',
    diffSnippet: `+ releaseExample({
+   environment: "protected",
+   dryRun: true,
+   requiresOperator: true
+ });`,
    timeRemainingSeconds: 160,
    status: 'pending',
    reason: 'Fixture illustrating a human review boundary. This page cannot execute or dispatch the payload.',
  },
  {
    id: 'card-slider-1',
    type: 'parameter-slider',
    title: 'Scenario concurrency budget',
    description: 'Adjusts only this page’s synthetic fixture state.',
    paramKey: 'max_concurrency',
    min: 1,
    max: 16,
    step: 1,
    value: 8,
    unit: 'example workers',
    agentRecommendation: 8,
    isLocked: false,
    affectedAgents: ['Architecture worker', 'Local test worker', 'Verification worker'],
  },
  {
    id: 'card-diff-1',
    type: 'diff-viewer',
    title: 'Sample diff review',
    filePath: 'src/review/integrity-log.ts',
    language: 'typescript',
    proposerAgent: 'Verification worker',
    hunks: [
      {
        hunkId: 'hunk-1',
        oldStart: 42,
        oldLines: ['return event;'],
        newStart: 42,
        newLines: ['return { ...event, source: "synthetic-fixture" };'],
        status: 'pending',
      },
    ],
  },
  {
    id: 'card-progress-1',
    type: 'progress-tracker',
    title: 'Sample campaign progress',
    campaignId: 'fixture-review-campaign',
    overallProgress: 76,
    etaSeconds: 48,
    milestones: [
      { id: 'm1', label: 'Parse fixture inputs', status: 'completed', agent: 'Architecture worker', durationMs: 1_420 },
      { id: 'm2', label: 'Generate sample tests', status: 'completed', agent: 'Local test worker', durationMs: 2_890 },
      { id: 'm3', label: 'Review integrity labels', status: 'in_progress', agent: 'Verification worker' },
      { id: 'm4', label: 'Await an external integration', status: 'queued', agent: 'Edge policy worker' },
    ],
  },
];

const rawScenarioEvents = [
  {
    agentId: 'agent-architecture-example',
    agentName: 'Architecture worker',
    actionType: 'file_write' as const,
    target: 'src/example/event-bus.ts',
    decision: 'ALLOW' as const,
    policyRule: 'EXAMPLE-SCOPE-01: In-scope path scenario',
    riskScore: 8,
    payloadSummary: 'Synthetic allow record; no file was written.',
  },
  {
    agentId: 'agent-experience-example',
    agentName: 'Experience worker',
    actionType: 'git_commit' as const,
    target: 'git:commit (example branch)',
    decision: 'ALLOW' as const,
    policyRule: 'EXAMPLE-GIT-04: Active-lease scenario',
    riskScore: 4,
    payloadSummary: 'Synthetic commit record; no Git command was run.',
  },
  {
    agentId: 'agent-untrusted-example',
    agentName: 'Example untrusted worker',
    actionType: 'shell_exec' as const,
    target: 'destructive-command-example',
    decision: 'BLOCK' as const,
    policyRule: 'EXAMPLE-SEC-00: Destructive-action scenario',
    riskScore: 99,
    payloadSummary: 'Synthetic blocked record; no command was run.',
  },
  {
    agentId: 'agent-local-example',
    agentName: 'Local test worker',
    actionType: 'ast_patch' as const,
    target: 'test/example-boundary.test.ts',
    decision: 'ALLOW' as const,
    policyRule: 'EXAMPLE-TEST-02: Local fixture scenario',
    riskScore: 6,
    payloadSummary: 'Synthetic patch record; no file was changed.',
  },
  {
    agentId: 'agent-verification-example',
    agentName: 'Verification worker',
    actionType: 'network_egress' as const,
    target: 'https://untrusted.example.invalid/sync',
    decision: 'SANDBOX' as const,
    policyRule: 'EXAMPLE-NET-09: Unknown-destination scenario',
    riskScore: 65,
    payloadSummary: 'Synthetic review record; no request or sandbox was created.',
  },
] as const;

export function createInitialScenarioLogs(now = Date.now()): { logs: ScenarioEvent[]; root: string } {
  const logs: ScenarioEvent[] = [];
  const hashes: string[] = [];
  let previousRoot = '0x' + '0'.repeat(64);

  rawScenarioEvents.forEach((event, index) => {
    const timestamp = now - (rawScenarioEvents.length - index) * 45_000;
    const leafHash = computeSha256({
      agentId: event.agentId,
      actionType: event.actionType,
      target: event.target,
      decision: event.decision,
      timestamp,
    });
    hashes.push(leafHash);
    const currentRoot = computeMerkleRoot(hashes);

    logs.push({
      id: `scenario-event-${index + 1}`,
      timestamp,
      ...event,
      localDigest: {
        leafHash,
        blockHeight: index + 1,
        parentRoot: previousRoot,
        currentRoot,
        locallyConsistent: true,
        timestamp,
      },
    });
    previousRoot = currentRoot;
  });

  return { logs: logs.reverse(), root: previousRoot };
}

export function isAgentBlocked(agent: Agent): boolean {
  return agent.status === 'blocked';
}

export interface AgentCycleResult {
  agents: Agent[];
  frozenAgentIds: string[];
}

export function advanceAgentCycle(
  agents: Agent[],
  nowMs: number,
  random: () => number = Math.random,
): AgentCycleResult {
  const frozenAgentIds: string[] = [];
  const nextAgents = agents.map(agent => {
    if (isAgentBlocked(agent)) {
      frozenAgentIds.push(agent.id);
      return agent;
    }

    const tokenDelta = Math.floor(random() * (agent.tokenRate * 2.5)) + 10;
    const memoryDelta = Math.floor(random() * 7) - 3;
    return {
      ...agent,
      totalTokens: agent.totalTokens + tokenDelta,
      lastPing: nowMs,
      memoryUsageMb: Math.max(48, Math.min(2_400, agent.memoryUsageMb + memoryDelta)),
    };
  });

  return { agents: nextAgents, frozenAgentIds };
}

export function markAgentBlocked(agents: Agent[], agentId: string, reason: string): Agent[] {
  return agents.map(agent =>
    agent.id === agentId && !isAgentBlocked(agent)
      ? { ...agent, status: 'blocked' as const, blockedReason: reason }
      : agent,
  );
}

export function computeTokenStats(agents: Agent[]): TokenEfficiencyStats {
  let localGpuTokens = 0;
  let edgeWorkersTokens = 0;
  let meteredFrontierTokens = 0;

  for (const agent of agents) {
    if (agent.hardware === 'Local accelerator') {
      localGpuTokens += agent.totalTokens;
    } else if (agent.hardware === 'Edge inference') {
      edgeWorkersTokens += agent.totalTokens;
    } else {
      meteredFrontierTokens += agent.totalTokens;
    }
  }

  const totalTokens = localGpuTokens + edgeWorkersTokens + meteredFrontierTokens;
  // Illustrative fixture rates only; these are not invoices or provider prices.
  const estimatedCostSpent = meteredFrontierTokens * 0.000_015 + edgeWorkersTokens * 0.000_000_5;
  const frontierBaselineCost = totalTokens * 0.000_015;
  const dollarsSaved = Math.max(0, frontierBaselineCost - estimatedCostSpent);
  const efficiencyScore = totalTokens === 0
    ? 0
    : Math.round(((localGpuTokens + edgeWorkersTokens) / totalTokens) * 100);

  return {
    localGpuTokens,
    edgeWorkersTokens,
    meteredFrontierTokens,
    totalTokens,
    estimatedCostSpent: Number(estimatedCostSpent.toFixed(2)),
    frontierBaselineCost: Number(frontierBaselineCost.toFixed(2)),
    dollarsSaved: Number(dollarsSaved.toFixed(2)),
    efficiencyScore,
  };
}
