import { TronProvider } from '../blockchain/TronProvider.js';
import type { IBlockchainProvider } from '../blockchain/types.js';
import type {
  TraceInvestigationRequest,
  TraceInvestigationResponse,
} from '../../../../shared/types/index.js';
import { traverseGraph } from './graphTraversal.js';
import { ApiError } from '../../utils/apiError.js';
import crypto from 'crypto';

export class GraphEngine {
  private providers: Map<string, IBlockchainProvider>;

  constructor() {
    this.providers = new Map();
    // Register TRON provider by default
    const tronProvider = new TronProvider();
    this.providers.set('TRON', tronProvider);
  }

  /**
   * Generates a unique investigation ID in format INV-YYYYMMDD-XXXXXX
   */
  private generateInvestigationId(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `INV-${dateStr}-${randomHex}`;
  }

  /**
   * Main entry point to trace transactions and construct a bounded directed graph
   */
  async traceInvestigation(
    request: TraceInvestigationRequest
  ): Promise<TraceInvestigationResponse> {
    const chain = (request.chain || 'TRON').toUpperCase();
    const provider = this.providers.get(chain);

    if (!provider) {
      throw new ApiError(
        400,
        `Unsupported blockchain network "${chain}". Currently supported networks: ${Array.from(
          this.providers.keys()
        ).join(', ')}`
      );
    }

    if (!request.address || typeof request.address !== 'string' || !request.address.trim()) {
      throw new ApiError(400, 'A valid target wallet address is required for tracing.');
    }

    const maxHops = Math.min(Math.max(request.maxHops || 3, 1), 6);
    const maxNodes = Math.min(Math.max(request.maxNodes || 100, 5), 500);
    const maxEdges = Math.min(Math.max(request.maxEdges || 300, 10), 1000);
    const limitPerAddress = Math.min(Math.max(request.limitPerAddress || 25, 1), 100);
    const asset = (request.asset || 'USDT').toUpperCase();

    const traversalResult = await traverseGraph(provider, request.address.trim(), {
      maxHops,
      maxNodes,
      maxEdges,
      limitPerAddress,
      asset,
    });

    const investigationId = this.generateInvestigationId();

    return {
      success: true,
      investigationId,
      investigation: {
        chain,
        rootAddress: request.address.trim(),
        asset,
        maxHops,
      },
      graph: traversalResult.graph,
      paths: traversalResult.paths,
      statistics: traversalResult.statistics,
      source: {
        provider: `${provider.chainName} Provider Engine (TronGrid)`,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
