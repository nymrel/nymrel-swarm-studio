import { 
  Agent, 
  A2UICard, 
  ActionSuretyEvent, 
  TokenEfficiencyStats, 
  WorkspaceFile, 
  DecisionBallotCard, 
  ApprovalGateCard, 
  ParameterSliderCard, 
  DiffViewerCard, 
  ProgressTrackerCard 
} from '../types';
import { computeSha256, computeMerkleRoot } from './merkle';

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent-codex-sol',
    name: 'Codex Sol',
    provider: 'openai',
    model: 'GPT-5.6 Sol (High Reasoning)',
    role: 'System Architect & Engine Lead',
    status: 'active',
    activeTask: 'Synthesizing A2UI streaming transformer for Rust kernel',
    tokenRate: 46,
    totalTokens: 148200,
    fencingGen: 4,
    memoryUsageMb: 248,
    lastPing: Date.now(),
    hardware: 'Frontier Cloud',
    costPerHour: 1.25,
    avatarColor: '#10A37F'
  },
  {
    id: 'agent-claude-opus',
    name: 'Claude Opus 5',
    provider: 'anthropic',
    model: 'claude-opus-5 (Fable 5 Head)',
    role: 'UX Orchestrator & Rendered Acceptance',
    status: 'thinking',
    activeTask: 'Constructing Decision Ballot for distributed Merkle sync',
    tokenRate: 38,
    totalTokens: 122400,
    fencingGen: 3,
    memoryUsageMb: 194,
    lastPing: Date.now(),
    hardware: 'Frontier Cloud',
    costPerHour: 1.80,
    avatarColor: '#D97706'
  },
  {
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
    lastPing: Date.now(),
    hardware: 'Frontier Cloud',
    costPerHour: 0.90,
    avatarColor: '#4285F4'
  },
  {
    id: 'agent-hermes-local',
    name: 'Hermes 3 (Local GPU)',
    provider: 'ollama',
    model: 'qwen2.5-coder:32b',
    role: 'High-Volume Sentinel & Unit Test Forge',
    status: 'active',
    activeTask: 'Generating 28 property-based security tests in sandbox',
    tokenRate: 88,
    totalTokens: 584000,
    fencingGen: 7,
    memoryUsageMb: 1840,
    lastPing: Date.now(),
    hardware: 'Local RTX 4090',
    costPerHour: 0.00,
    avatarColor: '#6B7280'
  },
  {
    id: 'agent-cloudflare-edge',
    name: 'Cloudflare Sentinel Agent',
    provider: 'cloudflare',
    model: 'Workers AI Llama 3.3',
    role: 'Edge Gateway & Interceptor Filter',
    status: 'active',
    activeTask: 'Screening live payload egress against Merkle allowlists',
    tokenRate: 72,
    totalTokens: 412000,
    fencingGen: 5,
    memoryUsageMb: 64,
    lastPing: Date.now(),
    hardware: 'Edge Workers AI',
    costPerHour: 0.08,
    avatarColor: '#F38020'
  }
];

export const INITIAL_WORKSPACE_FILES: WorkspaceFile[] = [
  {
    path: 'src/surety/merkle_interceptor.rs',
    name: 'merkle_interceptor.rs',
    status: 'modified',
    linesAdded: 84,
    linesRemoved: 12,
    lastModifiedByAgent: 'Codex Sol',
    diffPreview: `@@ -14,7 +14,19 @@ pub struct MerkleTree {
+    pub fn verify_action_receipt(&self, leaf: &[u8; 32]) -> bool {
+        let calculated_root = self.compute_root_from_leaf(leaf);
+        calculated_root == self.current_root
+    }
+    
+    #[inline(always)]
+    pub fn intercept_unsafe_syscall(op: SyscallCode) -> SuretyDecision {
+        match op {
+            SyscallCode::ForkExec | SyscallCode::RawSocket => SuretyDecision::Block,
+            _ => SuretyDecision::Allow,
+        }
+    }`,
    lastModified: Date.now() - 1000 * 60 * 3
  },
  {
    path: 'src/a2ui/streaming_protocol.ts',
    name: 'streaming_protocol.ts',
    status: 'created',
    linesAdded: 142,
    linesRemoved: 0,
    lastModifiedByAgent: 'Claude Opus 5',
    diffPreview: `+ export interface A2UIStreamFrame {
+   version: "0.8.0";
+   type: "ballot" | "gate" | "slider" | "diff";
+   deltaChunk: string;
+   signature: string;
+ }`,
    lastModified: Date.now() - 1000 * 60 * 8
  },
  {
    path: 'packages/sandboxed-runtime/src/policy.json',
    name: 'policy.json',
    status: 'staged',
    linesAdded: 28,
    linesRemoved: 6,
    lastModifiedByAgent: 'Gemini 3.6 Pro',
    diffPreview: `@@ -10,6 +10,12 @@
-   "allow_unrestricted_network": true
+   "allow_unrestricted_network": false,
+   "zero_trust_merkle_enforce": true,
+   "permitted_outbound_domains": [
+     "api.github.com",
+     "workers.cloudflare.com"
+   ]`,
    lastModified: Date.now() - 1000 * 60 * 15
  },
  {
    path: 'test/security/sandbox_escape.test.ts',
    name: 'sandbox_escape.test.ts',
    status: 'modified',
    linesAdded: 96,
    linesRemoved: 4,
    lastModifiedByAgent: 'Hermes 3 (Local GPU)',
    diffPreview: `+ test('prevents /etc/shadow inspection via symlink traverse', () => {
+   const interceptor = new SuretyInterceptor();
+   assert.throws(() => interceptor.resolvePath('/tmp/fake/../../etc/shadow'), /BlockedBySurety/);
+ });`,
    lastModified: Date.now() - 1000 * 60 * 22
  }
];

export const INITIAL_A2UI_CARDS: A2UICard[] = [
  {
    id: 'card-ballot-1',
    type: 'decision-ballot',
    title: 'Distributed State Synchronization Strategy',
    description: 'Swarm agents request operator selection on CRDT vs Raft consensus for the multi-worktree live file syncer.',
    proposerAgent: 'Claude Opus 5',
    status: 'open',
    createdAt: Date.now() - 1000 * 60 * 2,
    options: [
      {
        id: 'opt-crdt',
        label: 'Event-Sourced CRDT + Vector Clocks (Recommended)',
        description: 'Zero lock contention across parallel Codex/Hermes agents with deterministic merge resolution.',
        votes: 4,
        agentEndorsements: ['Claude Opus 5', 'Codex Sol', 'Hermes 3'],
        userVoted: false
      },
      {
        id: 'opt-raft',
        label: 'Strict Raft Consensus Ledger',
        description: 'Linearizable consistency guarantees with higher latency overhead on agent coordination.',
        votes: 1,
        agentEndorsements: ['Gemini 3.6 Pro'],
        userVoted: false
      },
      {
        id: 'opt-ephemeral',
        label: 'Ephemeral SSE Broadcast with Disk Snapshotting',
        description: 'Lowest CPU footprint, relies on local snapshot rollback points.',
        votes: 2,
        agentEndorsements: ['Cloudflare Sentinel Agent'],
        userVoted: false
      }
    ]
  } as DecisionBallotCard,
  {
    id: 'card-gate-1',
    type: 'approval-gate',
    title: 'CRITICAL: Edge Gateway Hot-Patch Deployment',
    agentName: 'Codex Sol',
    agentId: 'agent-codex-sol',
    operationType: 'edge_deployment',
    riskLevel: 'high',
    commandOrPayload: 'cloudflare.deployWorker("nymrel-edge-surety", { minReplicas: 3, isolationMode: "strict-zero-trust" })',
    diffSnippet: `+ deployWorker("nymrel-edge-surety", {
+   route: "api.nymrel.internal/v1/swarm/*",
+   wasm_sandbox: true,
+   rate_limit_rpm: 60000
+ });`,
    timeRemainingSeconds: 160,
    status: 'pending',
    reason: 'Requires operator signature before publishing edge gateway Wasm binary to production nodes.'
  } as ApprovalGateCard,
  {
    id: 'card-slider-1',
    type: 'parameter-slider',
    title: 'Swarm Concurrency & Reasoning Budget',
    description: 'Dynamic tuning of parallel agent workers and maximum reasoning effort ceiling.',
    paramKey: 'max_concurrency',
    min: 1,
    max: 16,
    step: 1,
    value: 8,
    unit: 'concurrent workers',
    agentRecommendation: 8,
    isLocked: false,
    affectedAgents: ['Codex Sol', 'Hermes 3 (Local GPU)', 'Gemini 3.6 Pro']
  } as ParameterSliderCard,
  {
    id: 'card-diff-1',
    type: 'diff-viewer',
    title: 'AST Optimization in src/surety/merkle_interceptor.rs',
    filePath: 'src/surety/merkle_interceptor.rs',
    language: 'rust',
    proposerAgent: 'Gemini 3.6 Pro',
    hunks: [
      {
        hunkId: 'hunk-1',
        oldStart: 42,
        oldLines: [
          'let leaf = hash_sha256(raw_bytes);',
          'self.leaves.push(leaf);'
        ],
        newStart: 42,
        newLines: [
          'let leaf = blake3::hash(raw_bytes); // 4x speedup on SIMD AVX-512',
          'self.leaves.push(leaf.into());',
          'self.mark_dirty();'
        ],
        status: 'pending'
      }
    ]
  } as DiffViewerCard,
  {
    id: 'card-progress-1',
    type: 'progress-tracker',
    title: 'Autonomous Swarm Campaign: AST Hardening & Formal Proofs',
    campaignId: 'cmp-ast-proofs-2026',
    overallProgress: 76,
    etaSeconds: 48,
    milestones: [
      { id: 'm1', label: 'Parse AST grammar & build syntax tokens', status: 'completed', agent: 'Codex Sol', durationMs: 1420 },
      { id: 'm2', label: 'Generate 28 property-based sandbox tests', status: 'completed', agent: 'Hermes 3 (Local GPU)', durationMs: 2890 },
      { id: 'm3', label: 'Synthesize Merkle root verification proof', status: 'in_progress', agent: 'Gemini 3.6 Pro' },
      { id: 'm4', label: 'Deploy signed Wasm bundle to Cloudflare edge', status: 'queued', agent: 'Cloudflare Sentinel Agent' }
    ]
  } as ProgressTrackerCard
];

export function createInitialSuretyLogs(): { logs: ActionSuretyEvent[], root: string } {
  const rawEvents = [
    {
      agentId: 'agent-codex-sol',
      agentName: 'Codex Sol',
      actionType: 'file_write' as const,
      target: 'src/kernel/bus.ts',
      decision: 'ALLOW' as const,
      policyRule: 'RULE-AST-01: Validated in-scope repo file edit',
      riskScore: 8,
      payloadSummary: 'Updated event dispatcher signature for A2UI streaming packets.'
    },
    {
      agentId: 'agent-claude-opus',
      agentName: 'Claude Opus 5',
      actionType: 'git_commit' as const,
      target: 'git:commit (branch: feat/a2ui-v08)',
      decision: 'ALLOW' as const,
      policyRule: 'RULE-GIT-04: Signed commit under active task lease',
      riskScore: 4,
      payloadSummary: 'Commit: feat(a2ui): integrate Google A2UI v0.8 streaming card schema'
    },
    {
      agentId: 'agent-rogue-sim',
      agentName: 'Untrusted Plugin / Sandbox Sandbox',
      actionType: 'shell_exec' as const,
      target: 'rm -rf /var/run/secrets',
      decision: 'BLOCK' as const,
      policyRule: 'RULE-SEC-00: Intercepted destructive root filesystem deletion attempt',
      riskScore: 99,
      payloadSummary: 'Destructive command blocked by Nymrel Action Surety Interceptor.'
    },
    {
      agentId: 'agent-hermes-local',
      agentName: 'Hermes 3 (Local GPU)',
      actionType: 'ast_patch' as const,
      target: 'test/security/sandbox_escape.test.ts',
      decision: 'ALLOW' as const,
      policyRule: 'RULE-TEST-02: Sandboxed local test generation on RTX 4090',
      riskScore: 6,
      payloadSummary: 'Inserted 4 new assertions testing symlink traversal guards.'
    },
    {
      agentId: 'agent-gemini-pro',
      agentName: 'Gemini 3.6 Pro',
      actionType: 'network_egress' as const,
      target: 'https://untrusted-external-domain.dev/sync',
      decision: 'SANDBOX' as const,
      policyRule: 'RULE-NET-09: Unverified external domain routed into ephemeral mock proxy',
      riskScore: 65,
      payloadSummary: 'Outbound request isolated; payload recorded into audit ledger.'
    },
    {
      agentId: 'agent-rogue-sim-2',
      agentName: 'Helper Subagent Worker #3',
      actionType: 'secret_read' as const,
      target: 'process.env["AWS_SECRET_ACCESS_KEY"]',
      decision: 'BLOCK' as const,
      policyRule: 'RULE-VAULT-01: Zero-trust environment credential access denial',
      riskScore: 96,
      payloadSummary: 'Attempt to read protected root credentials blocked.'
    }
  ];

  const logs: ActionSuretyEvent[] = [];
  const hashes: string[] = [];
  let prevRoot = '0x0000000000000000000000000000000000000000000000000000000000000000';

  rawEvents.forEach((ev, idx) => {
    const timestamp = Date.now() - (rawEvents.length - idx) * 1000 * 45;
    const leafHash = computeSha256({
      agentId: ev.agentId,
      actionType: ev.actionType,
      target: ev.target,
      decision: ev.decision,
      timestamp
    });
    hashes.push(leafHash);
    const currentRoot = computeMerkleRoot(hashes);

    const log: ActionSuretyEvent = {
      id: `surety-event-${idx + 1}`,
      timestamp,
      agentId: ev.agentId,
      agentName: ev.agentName,
      actionType: ev.actionType,
      target: ev.target,
      decision: ev.decision,
      policyRule: ev.policyRule,
      riskScore: ev.riskScore,
      payloadSummary: ev.payloadSummary,
      merkleReceipt: {
        leafHash,
        blockHeight: 14200 + idx,
        parentRoot: prevRoot,
        currentRoot,
        verified: true,
        timestamp
      }
    };
    logs.push(log);
    prevRoot = currentRoot;
  });

  return { logs: logs.reverse(), root: prevRoot };
}

export function computeTokenStats(agents: Agent[]): TokenEfficiencyStats {
  let localGpuTokens = 0;
  let edgeWorkersTokens = 0;
  let meteredFrontierTokens = 0;

  agents.forEach(a => {
    if (a.hardware === 'Local RTX 4090') {
      localGpuTokens += a.totalTokens;
    } else if (a.hardware === 'Edge Workers AI') {
      edgeWorkersTokens += a.totalTokens;
    } else {
      meteredFrontierTokens += a.totalTokens;
    }
  });

  const totalTokens = localGpuTokens + edgeWorkersTokens + meteredFrontierTokens;
  
  // Cost models: Frontier = $0.015 / 1k tokens, Edge = $0.0005 / 1k, Local = $0.00
  const estimatedCostSpent = (meteredFrontierTokens * 0.000015) + (edgeWorkersTokens * 0.0000005);
  const frontierBaselineCost = totalTokens * 0.000015;
  const dollarsSaved = Math.max(0, frontierBaselineCost - estimatedCostSpent);
  const efficiencyScore = totalTokens > 0 ? Math.round(((localGpuTokens + edgeWorkersTokens) / totalTokens) * 100) : 0;

  return {
    localGpuTokens,
    edgeWorkersTokens,
    meteredFrontierTokens,
    totalTokens,
    estimatedCostSpent: parseFloat(estimatedCostSpent.toFixed(2)),
    frontierBaselineCost: parseFloat(frontierBaselineCost.toFixed(2)),
    dollarsSaved: parseFloat(dollarsSaved.toFixed(2)),
    efficiencyScore
  };
}
