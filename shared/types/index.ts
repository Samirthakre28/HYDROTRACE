export interface HealthStatus {
  status: 'ok' | 'error';
  service: string;
  timestamp?: string;
  database?: 'connected' | 'disconnected' | 'disabled';
}

export type InvestigationStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface InvestigationSummary {
  id: string;
  title: string;
  targetAddress: string;
  blockchain: string;
  status: InvestigationStatus;
  createdAt: string;
  updatedAt: string;
}

export type TransactionDirection = 'IN' | 'OUT' | 'SELF';
export type TransactionStatus = 'CONFIRMED' | 'FAILED' | 'UNKNOWN';

export interface NormalizedTransaction {
  chain: string;
  txHash: string;
  timestamp: string;
  from: string;
  to: string;
  asset: string;
  tokenContract?: string;
  amount: string;
  direction: TransactionDirection;
  status: TransactionStatus;
  source: {
    provider: string;
    endpoint: string;
    raw?: any;
  };
}

export interface AddressTransfersResponse {
  success: boolean;
  chain: string;
  address: string;
  transfers: NormalizedTransaction[];
  pagination: {
    limit: number;
    fingerprint?: string;
    hasMore: boolean;
  };
  source: {
    provider: string;
    retrievedAt: string;
  };
}

/* ================= GRAPH & TRACE ENGINE TYPES ================= */

export type NodeType = 'WALLET' | 'CONTRACT' | 'UNKNOWN';
export type TerminationReason =
  | 'MAX_HOPS'
  | 'MAX_NODES'
  | 'MAX_EDGES'
  | 'NO_MORE_TRANSFERS'
  | 'PROVIDER_ERROR';

export interface GraphNode {
  id: string;
  chain: string;
  address: string;
  nodeType: NodeType;
  hop: number;
}

export interface GraphEdge {
  id: string;
  chain: string;
  txHash: string;
  from: string;
  to: string;
  asset: string;
  amount: string;
  timestamp: string;
  direction: 'OUT' | 'IN';
  status: 'CONFIRMED' | 'FAILED' | 'UNKNOWN';
  hop: number;
  source: {
    provider: string;
    endpoint: string;
  };
}

export interface GraphData {
  rootAddress: string;
  chain: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    maxHops: number;
    maxNodes: number;
    generatedAt: string;
  };
}

export interface TracePathStep {
  address: string;
  txHash: string;
  amount?: string;
  timestamp?: string;
}

export interface TracePath {
  address: string;
  hop: number;
  path: TracePathStep[];
}

export interface TraceInvestigationRequest {
  chain?: string;
  address: string;
  asset?: string;
  maxHops?: number;
  maxNodes?: number;
  maxEdges?: number;
  limitPerAddress?: number;
}

export interface TraceInvestigationResponse {
  success: boolean;
  investigationId: string;
  investigation: {
    chain: string;
    rootAddress: string;
    asset: string;
    maxHops: number;
  };
  graph: GraphData;
  paths: TracePath[];
  statistics: {
    nodesDiscovered: number;
    edgesDiscovered: number;
    addressesTraversed: number;
    maxHopReached: number;
    terminationReason: TerminationReason;
  };
  source: {
    provider: string;
    generatedAt: string;
  };
}

/* ================= VASP CANDIDATE ENGINE TYPES ================= */

export type WalletRole = 'DEPOSIT' | 'HOT_WALLET' | 'COLD_WALLET' | 'UNKNOWN';
export type SourceType = 'OFFICIAL' | 'GOVERNMENT' | 'EXPLORER' | 'CURATED';
export type BoundaryStatus = 'DIRECT_EVIDENCE' | 'INFERRED_ASSOCIATION' | 'INSUFFICIENT_EVIDENCE';

export interface EvidenceSource {
  sourceType: SourceType;
  sourceName: string;
  reference: string;
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  associatedEntity?: string;
}

export interface VaspLabelRecord {
  address: string;
  chain: 'TRON';
  entityName: string;
  walletRole: WalletRole;
  sourceType: SourceType;
  sourceReference: string;
  firstVerified?: string;
  lastVerified?: string;
  notes?: string;
  evidenceSources?: EvidenceSource[];
}

export interface ScoreFactor {
  factor: string;
  points: number;
}

export interface ConflictingSourceItem {
  vasp: string;
  sourceType: SourceType;
  sourceName: string;
  reference: string;
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ConflictDetail {
  hasConflict: boolean;
  address: string;
  conflictingEntities: string[];
  sources: ConflictingSourceItem[];
  reviewRequired: boolean;
  message: string;
}

export interface StressTestCategory {
  strengthenEvidence: string[];
  weakenEvidence: string[];
  currentReviewTrigger: string;
}

export interface VaspCandidate {
  entityName: string;
  matchedAddress: string;
  chain: string;
  walletRole: WalletRole;
  hop: number;
  confidenceScore: number;
  scoreBreakdown: ScoreFactor[];
  explanation: string;
  evidenceSources: EvidenceSource[];
  hasConflict: boolean;
  conflictDetails?: ConflictDetail;
  reviewRequired: boolean;
  stressTest: StressTestCategory;
  evidence: {
    addressMatch: boolean;
    sourceType: SourceType;
    sourceReference: string;
    transactionHash?: string;
    amount?: string;
    timestamp?: string;
    path?: TracePathStep[];
  };
}

export interface AttributionBoundary {
  status: BoundaryStatus;
  explanation: string;
  evidenceSummary: string;
}

export interface EvaluateAttributionRequest {
  investigationId?: string;
  graph: GraphData;
  paths: TracePath[];
}

export interface EvaluateAttributionResponse {
  success: boolean;
  investigationId?: string;
  candidates: VaspCandidate[];
  attributionBoundary: AttributionBoundary;
  hasConflict: boolean;
  reviewRequired: boolean;
  conflictSummary?: {
    totalConflicts: number;
    conflictedAddresses: string[];
  };
  stressTest: StressTestCategory;
  source: {
    dataset: string;
    generatedAt: string;
  };
}

/* ================= STEP 6: EVIDENCE BUNDLE & REPORT EXPORT TYPES ================= */

export interface CanonicalEvidenceContent {
  investigationId: string;
  methodologyVersion: string;
  target: {
    chain: string;
    rootAddress: string;
    asset: string;
    caseReference?: string;
  };
  trace: {
    maxHops: number;
    nodesDiscovered: number;
    edgesDiscovered: number;
    addressesTraversed: number;
    maxHopReached: number;
    terminationReason: TerminationReason;
    nodes: GraphNode[];
    edges: GraphEdge[];
    paths: TracePath[];
  };
  vaspCandidates: {
    entityName: string;
    matchedAddress: string;
    walletRole: WalletRole;
    hop: number;
    evidenceScore: number;
    scoreBreakdown: ScoreFactor[];
    hasConflict: boolean;
    evidenceSources: EvidenceSource[];
    path?: TracePathStep[];
  }[];
  evidence: {
    dataset: string;
    directMatchesCount: number;
    corroboratedCount: number;
  };
  conflicts: {
    hasConflict: boolean;
    reviewRequired: boolean;
    conflictedAddresses: string[];
    details: ConflictDetail[];
  };
  attributionBoundary: AttributionBoundary;
  stressTest: StressTestCategory;
  limitations: string[];
}

export interface EvidenceBundleExport extends CanonicalEvidenceContent {
  generatedAt: string;
  sha256: string;
}

export interface SahyogDisclosureCandidate {
  entityName: string;
  depositAddress: string;
  hopDistance: number;
  evidenceScore: number;
  walletRole: string;
  hasConflict: boolean;
  officialReference: string;
  suggestedAction: string;
}

export interface SahyogDisclosurePayload {
  caseReference: string;
  targetWallet: string;
  chain: string;
  asset: string;
  generatedAt: string;
  sha256Seal: string;
  candidateVasps: SahyogDisclosureCandidate[];
  evidenceSummary: string;
  reviewRequired: boolean;
  legalNotice: string;
}

export interface GenerateReportRequest {
  investigationId: string;
  caseReference?: string;
  trace: TraceInvestigationResponse;
  attribution: EvaluateAttributionResponse;
}

export interface GenerateReportResponse {
  success: boolean;
  investigationId: string;
  sha256: string;
  bundle: EvidenceBundleExport;
  htmlReport: string;
  sahyogPayload: SahyogDisclosurePayload;
}
