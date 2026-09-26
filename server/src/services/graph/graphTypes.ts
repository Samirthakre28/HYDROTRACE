import type {
  GraphNode,
  GraphEdge,
  GraphData,
  TracePath,
  TracePathStep,
  TerminationReason,
  TraceInvestigationRequest,
  TraceInvestigationResponse,
} from '../../../../shared/types/index.js';

export interface TraversalConfig {
  maxHops: number;
  maxNodes: number;
  maxEdges: number;
  limitPerAddress: number;
  asset: string;
}

export interface TraversalQueueItem {
  address: string;
  hop: number;
  path: TracePathStep[];
}

export interface TraversalResult {
  graph: GraphData;
  paths: TracePath[];
  statistics: {
    nodesDiscovered: number;
    edgesDiscovered: number;
    addressesTraversed: number;
    maxHopReached: number;
    terminationReason: TerminationReason;
  };
}
