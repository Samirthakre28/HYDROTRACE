import type { IBlockchainProvider } from '../blockchain/types.js';
import type {
  GraphNode,
  GraphEdge,
  GraphData,
  TracePath,
  TracePathStep,
  TerminationReason,
} from '../../../../shared/types/index.js';
import { TraversalConfig, TraversalQueueItem, TraversalResult } from './graphTypes.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';

export async function traverseGraph(
  provider: IBlockchainProvider,
  rootAddress: string,
  config: TraversalConfig
): Promise<TraversalResult> {
  const cleanRoot = rootAddress.trim();

  if (!provider.validateAddress(cleanRoot)) {
    throw new ApiError(
      400,
      `Invalid ${provider.chainName} root address: "${cleanRoot}". Address validation failed.`
    );
  }

  // 1. Initialize Nodes Map & Root Node
  const nodesMap = new Map<string, GraphNode>();
  nodesMap.set(cleanRoot, {
    id: cleanRoot,
    chain: provider.chainName,
    address: cleanRoot,
    nodeType: 'WALLET',
    hop: 0,
  });

  // 2. Initialize Edges & Paths
  const edgesList: GraphEdge[] = [];
  const pathsMap = new Map<string, TracePath>();
  
  const rootInitialPath: TracePathStep[] = [{ address: cleanRoot, txHash: 'ROOT' }];
  pathsMap.set(cleanRoot, {
    address: cleanRoot,
    hop: 0,
    path: rootInitialPath,
  });

  // 3. Initialize BFS Traversal State
  const queue: TraversalQueueItem[] = [
    {
      address: cleanRoot,
      hop: 0,
      path: rootInitialPath,
    },
  ];

  const traversedAddresses = new Set<string>();
  let maxHopReached = 0;
  let terminationReason: TerminationReason = 'NO_MORE_TRANSFERS';

  while (queue.length > 0) {
    const currentItem = queue.shift()!;
    const currentAddr = currentItem.address;
    const currentHop = currentItem.hop;
    const currentPath = currentItem.path;

    // Check if max nodes or max edges limit reached before expanding next node
    if (nodesMap.size >= config.maxNodes) {
      terminationReason = 'MAX_NODES';
      break;
    }

    if (edgesList.length >= config.maxEdges) {
      terminationReason = 'MAX_EDGES';
      break;
    }

    if (currentHop >= config.maxHops) {
      terminationReason = 'MAX_HOPS';
      continue;
    }

    if (traversedAddresses.has(currentAddr.toLowerCase())) {
      continue;
    }

    traversedAddresses.add(currentAddr.toLowerCase());

    // Retrieve outgoing transfers for current address
    let response;
    try {
      response = await provider.getTransactions(currentAddr, {
        limit: config.limitPerAddress,
        onlyUsdt: config.asset === 'USDT',
      });
    } catch (err: any) {
      logger.warn(`Traversal fetch failed for address ${currentAddr}: ${err.message}`);
      if (traversedAddresses.size === 1) {
        // If the root fetch fails, rethrow or set PROVIDER_ERROR
        terminationReason = 'PROVIDER_ERROR';
        throw err;
      }
      continue;
    }

    // Filter OUTGOING transfers from current address
    const outgoingTransfers = response.transfers.filter((t) => {
      const isFrom = t.from.trim().toLowerCase() === currentAddr.toLowerCase();
      return isFrom || t.direction === 'OUT';
    });

    // Sort transfers deterministically by timestamp descending, then txHash
    outgoingTransfers.sort((a, b) => {
      const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.txHash.localeCompare(b.txHash);
    });

    for (const tx of outgoingTransfers) {
      const targetAddr = tx.to.trim();
      if (!targetAddr || targetAddr.toUpperCase() === 'UNKNOWN_RECIPIENT') continue;

      // Check max edges
      if (edgesList.length >= config.maxEdges) {
        terminationReason = 'MAX_EDGES';
        break;
      }

      const nextHop = currentHop + 1;

      // Ensure target node is registered in nodesMap
      if (!nodesMap.has(targetAddr)) {
        if (nodesMap.size >= config.maxNodes) {
          terminationReason = 'MAX_NODES';
          break;
        }

        nodesMap.set(targetAddr, {
          id: targetAddr,
          chain: provider.chainName,
          address: targetAddr,
          nodeType: 'WALLET',
          hop: nextHop,
        });

        maxHopReached = Math.max(maxHopReached, nextHop);
      }

      // Add Edge (preserving multiple transactions between same addresses)
      const edgeId = `${tx.txHash}-${currentAddr}-${targetAddr}`;
      edgesList.push({
        id: edgeId,
        chain: provider.chainName,
        txHash: tx.txHash,
        from: currentAddr,
        to: targetAddr,
        asset: tx.asset,
        amount: tx.amount,
        timestamp: tx.timestamp,
        direction: 'OUT',
        status: tx.status === 'CONFIRMED' ? 'CONFIRMED' : 'UNKNOWN',
        hop: nextHop,
        source: {
          provider: tx.source.provider,
          endpoint: tx.source.endpoint,
        },
      });

      // Construct and record Path from Root to Target Address
      const newPathStep: TracePathStep = {
        address: targetAddr,
        txHash: tx.txHash,
        amount: tx.amount,
        timestamp: tx.timestamp,
      };

      const newPath = [...currentPath, newPathStep];

      if (!pathsMap.has(targetAddr)) {
        pathsMap.set(targetAddr, {
          address: targetAddr,
          hop: nextHop,
          path: newPath,
        });
      }

      // Enqueue target address for next hop exploration if within maxHops limit and not yet traversed
      if (nextHop < config.maxHops && !traversedAddresses.has(targetAddr.toLowerCase())) {
        queue.push({
          address: targetAddr,
          hop: nextHop,
          path: newPath,
        });
      }
    }

    if (nodesMap.size >= config.maxNodes) {
      terminationReason = 'MAX_NODES';
      break;
    }
    if (edgesList.length >= config.maxEdges) {
      terminationReason = 'MAX_EDGES';
      break;
    }
  }

  // Determine final termination reason if queue emptied naturally
  if (queue.length === 0 && terminationReason === 'NO_MORE_TRANSFERS') {
    if (maxHopReached >= config.maxHops) {
      terminationReason = 'MAX_HOPS';
    } else {
      terminationReason = 'NO_MORE_TRANSFERS';
    }
  }

  const nodes = Array.from(nodesMap.values());
  const paths = Array.from(pathsMap.values());

  const graphData: GraphData = {
    rootAddress: cleanRoot,
    chain: provider.chainName,
    nodes,
    edges: edgesList,
    metadata: {
      maxHops: config.maxHops,
      maxNodes: config.maxNodes,
      generatedAt: new Date().toISOString(),
    },
  };

  return {
    graph: graphData,
    paths,
    statistics: {
      nodesDiscovered: nodes.length,
      edgesDiscovered: edgesList.length,
      addressesTraversed: traversedAddresses.size,
      maxHopReached,
      terminationReason,
    },
  };
}
