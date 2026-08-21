export type AgentProvider = 'openai' | 'anthropic' | 'google' | 'ollama' | 'cloudflare';

export type AgentStatus = 'active' | 'thinking' | 'waiting_approval' | 'idle' | 'sandboxed';

export type HardwareTier = 'Local RTX 4090' | 'Edge Workers AI' | 'Frontier Cloud';

export interface Agent {
  id: string;
  name: string;
  provider: AgentProvider;
  model: string;
  role: string;
  status: AgentStatus;
  activeTask: string;
  tokenRate: number; // t/s
  totalTokens: number;
  fencingGen: number;
  memoryUsageMb: number;
  lastPing: number;
  hardware: HardwareTier;
  costPerHour: number;
  avatarColor: string;
}

export type A2UICardType = 
  | 'decision-ballot' 
  | 'parameter-slider' 
  | 'approval-gate' 
  | 'diff-viewer' 
  | 'progress-tracker';

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  votes: number;
  agentEndorsements: string[];
  userVoted?: boolean;
}

export interface DecisionBallotCard {
  id: string;
  type: 'decision-ballot';
  title: string;
  description: string;
  proposerAgent: string;
  options: DecisionOption[];
  status: 'open' | 'closed';
  createdAt: number;
  selectedOptionId?: string;
}

export interface ParameterSliderCard {
  id: string;
  type: 'parameter-slider';
  title: string;
  description: string;
  paramKey: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  agentRecommendation: number;
  isLocked: boolean;
  affectedAgents: string[];
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ApprovalGateCard {
  id: string;
  type: 'approval-gate';
  title: string;
  agentName: string;
  agentId: string;
  operationType: 'destructive_file_write' | 'db_schema_migration' | 'edge_deployment' | 'credential_access' | 'force_push' | 'system_command';
  riskLevel: RiskLevel;
  commandOrPayload: string;
  diffSnippet?: string;
  timeRemainingSeconds: number;
  status: 'pending' | 'approved' | 'rejected' | 'sandboxed';
  reason?: string;
}

export interface DiffHunk {
  hunkId: string;
  oldStart: number;
  oldLines: string[];
  newStart: number;
  newLines: string[];
  status: 'pending' | 'accepted' | 'rejected';
}

export interface DiffViewerCard {
  id: string;
  type: 'diff-viewer';
  title: string;
  filePath: string;
  language: string;
  proposerAgent: string;
  hunks: DiffHunk[];
}

export interface Milestone {
  id: string;
  label: string;
  status: 'completed' | 'in_progress' | 'queued';
  agent: string;
  durationMs?: number;
}

export interface ProgressTrackerCard {
  id: string;
  type: 'progress-tracker';
  title: string;
  campaignId: string;
  overallProgress: number; // 0 - 100
  milestones: Milestone[];
  etaSeconds: number;
}

export type A2UICard = 
  | DecisionBallotCard 
  | ParameterSliderCard 
  | ApprovalGateCard 
  | DiffViewerCard 
  | ProgressTrackerCard;

export type SuretyActionType = 
  | 'file_write' 
  | 'shell_exec' 
  | 'network_egress' 
  | 'secret_read' 
  | 'git_commit' 
  | 'ast_patch' 
  | 'sandbox_escape_attempt';

export type SuretyDecision = 'ALLOW' | 'BLOCK' | 'SANDBOX' | 'INTERCEPT';

export interface MerkleReceipt {
  leafHash: string;
  blockHeight: number;
  parentRoot: string;
  currentRoot: string;
  verified: boolean;
  timestamp: number;
}

export interface ActionSuretyEvent {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  actionType: SuretyActionType;
  target: string;
  decision: SuretyDecision;
  policyRule: string;
  riskScore: number; // 0 - 100
  payloadSummary: string;
  merkleReceipt: MerkleReceipt;
}

export interface TokenEfficiencyStats {
  localGpuTokens: number;
  edgeWorkersTokens: number;
  meteredFrontierTokens: number;
  totalTokens: number;
  estimatedCostSpent: number;
  frontierBaselineCost: number;
  dollarsSaved: number;
  efficiencyScore: number;
}

export interface WorkspaceFile {
  path: string;
  name: string;
  status: 'modified' | 'created' | 'deleted' | 'staged' | 'sandboxed';
  linesAdded: number;
  linesRemoved: number;
  lastModifiedByAgent: string;
  diffPreview: string;
  lastModified: number;
}

export interface SwarmTopologyLink {
  source: string;
  target: string;
  protocol: 'gRPC' | 'SSE' | 'SharedMemory' | 'HTTP2';
  messagesPerSecond: number;
}
