import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BaseBlockchainProvider } from '../services/blockchain/BlockchainProvider.js';
import { TransferQueryOptions } from '../services/blockchain/types.js';
import { traverseGraph } from '../services/graph/graphTraversal.js';
import type { AddressTransfersResponse, NormalizedTransaction } from '../../../shared/types/index.js';

// Mock Blockchain Provider for deterministic unit testing
class MockBlockchainProvider extends BaseBlockchainProvider {
  readonly chainName = 'TRON';
  private transferMap: Map<string, NormalizedTransaction[]> = new Map();
  public shouldFail = false;

  constructor() {
    super();
  }

  validateAddress(address: string): boolean {
    return Boolean(address && address.startsWith('T'));
  }

  addTx(from: string, to: string, amount: string, txHash: string, asset = 'USDT') {
    const list = this.transferMap.get(from) || [];
    list.push({
      chain: 'TRON',
      txHash,
      timestamp: '2026-09-27T00:00:00.000Z',
      from,
      to,
      asset,
      amount,
      direction: 'OUT',
      status: 'CONFIRMED',
      source: { provider: 'MockProvider', endpoint: '/test' },
    });
    this.transferMap.set(from, list);
  }

  async getTransactions(
    address: string,
    options?: TransferQueryOptions
  ): Promise<AddressTransfersResponse> {
    if (this.shouldFail) {
      throw new Error('Simulated Provider Network Failure');
    }
    const transfers = this.transferMap.get(address) || [];
    const limit = options?.limit || 25;
    return {
      success: true,
      chain: 'TRON',
      address,
      transfers: transfers.slice(0, limit),
      pagination: { limit, hasMore: false },
      source: { provider: 'MockProvider', retrievedAt: '2026-09-27T00:00:00.000Z' },
    };
  }

  async getUsdtTransfers(
    address: string,
    options?: TransferQueryOptions
  ): Promise<AddressTransfersResponse> {
    return this.getTransactions(address, options);
  }
}

describe('Bounded BFS Transaction Graph & Tracing Engine Tests', () => {
  it('1. Root node creation', async () => {
    const mockProvider = new MockBlockchainProvider();
    const result = await traverseGraph(mockProvider, 'TRootAddress123', {
      maxHops: 3,
      maxNodes: 100,
      maxEdges: 300,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    assert.equal(result.graph.nodes.length, 1);
    assert.equal(result.graph.nodes[0].address, 'TRootAddress123');
    assert.equal(result.graph.nodes[0].hop, 0);
    assert.equal(result.statistics.terminationReason, 'NO_MORE_TRANSFERS');
  });

  it('2. One-hop traversal', async () => {
    const mockProvider = new MockBlockchainProvider();
    mockProvider.addTx('TRootAddress123', 'THop1AddressABC', '100', '0xTx1');

    const result = await traverseGraph(mockProvider, 'TRootAddress123', {
      maxHops: 1,
      maxNodes: 100,
      maxEdges: 300,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    assert.equal(result.graph.nodes.length, 2);
    assert.equal(result.graph.edges.length, 1);
    assert.equal(result.graph.edges[0].from, 'TRootAddress123');
    assert.equal(result.graph.edges[0].to, 'THop1AddressABC');
    assert.equal(result.statistics.maxHopReached, 1);
    assert.equal(result.statistics.terminationReason, 'MAX_HOPS');
  });

  it('3. Two-hop traversal', async () => {
    const mockProvider = new MockBlockchainProvider();
    mockProvider.addTx('TRootAddress123', 'THop1AddressABC', '100', '0xTx1');
    mockProvider.addTx('THop1AddressABC', 'THop2AddressDEF', '50', '0xTx2');

    const result = await traverseGraph(mockProvider, 'TRootAddress123', {
      maxHops: 2,
      maxNodes: 100,
      maxEdges: 300,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    assert.equal(result.graph.nodes.length, 3);
    assert.equal(result.graph.edges.length, 2);
    assert.equal(result.statistics.maxHopReached, 2);
  });

  it('4. Three-hop traversal', async () => {
    const mockProvider = new MockBlockchainProvider();
    mockProvider.addTx('TRootAddress123', 'THop1AddressABC', '100', '0xTx1');
    mockProvider.addTx('THop1AddressABC', 'THop2AddressDEF', '50', '0xTx2');
    mockProvider.addTx('THop2AddressDEF', 'THop3AddressGHI', '25', '0xTx3');

    const result = await traverseGraph(mockProvider, 'TRootAddress123', {
      maxHops: 3,
      maxNodes: 100,
      maxEdges: 300,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    assert.equal(result.graph.nodes.length, 4);
    assert.equal(result.graph.edges.length, 3);
    assert.equal(result.statistics.maxHopReached, 3);
    assert.equal(result.statistics.terminationReason, 'MAX_HOPS');
  });

  it('5. Duplicate address handling', async () => {
    const mockProvider = new MockBlockchainProvider();
    mockProvider.addTx('TRootAddress123', 'THop1AddressB', '100', '0xTx1');
    mockProvider.addTx('TRootAddress123', 'THop1AddressC', '200', '0xTx2');
    mockProvider.addTx('THop1AddressB', 'THop1AddressC', '50', '0xTx3');

    const result = await traverseGraph(mockProvider, 'TRootAddress123', {
      maxHops: 3,
      maxNodes: 100,
      maxEdges: 300,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    assert.equal(result.graph.nodes.length, 3);
    assert.equal(result.graph.edges.length, 3);
  });

  it('6. Multiple transactions between same addresses', async () => {
    const mockProvider = new MockBlockchainProvider();
    mockProvider.addTx('TRootAddress123', 'THop1AddressB', '100', '0xTx1');
    mockProvider.addTx('TRootAddress123', 'THop1AddressB', '200', '0xTx2');

    const result = await traverseGraph(mockProvider, 'TRootAddress123', {
      maxHops: 3,
      maxNodes: 100,
      maxEdges: 300,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    assert.equal(result.graph.nodes.length, 2);
    assert.equal(result.graph.edges.length, 2);
  });

  it('7. Max-node termination', async () => {
    const mockProvider = new MockBlockchainProvider();
    mockProvider.addTx('TRootAddress123', 'THop1AddressB', '100', '0xTx1');
    mockProvider.addTx('TRootAddress123', 'THop1AddressC', '200', '0xTx2');
    mockProvider.addTx('TRootAddress123', 'THop1AddressD', '300', '0xTx3');

    const result = await traverseGraph(mockProvider, 'TRootAddress123', {
      maxHops: 3,
      maxNodes: 2,
      maxEdges: 300,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    assert.equal(result.graph.nodes.length, 2);
    assert.equal(result.statistics.terminationReason, 'MAX_NODES');
  });

  it('8. Max-edge termination', async () => {
    const mockProvider = new MockBlockchainProvider();
    mockProvider.addTx('TRootAddress123', 'THop1AddressB', '100', '0xTx1');
    mockProvider.addTx('TRootAddress123', 'THop1AddressC', '200', '0xTx2');

    const result = await traverseGraph(mockProvider, 'TRootAddress123', {
      maxHops: 3,
      maxNodes: 100,
      maxEdges: 1,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    assert.equal(result.graph.edges.length, 1);
    assert.equal(result.statistics.terminationReason, 'MAX_EDGES');
  });

  it('9. No outgoing transfers', async () => {
    const mockProvider = new MockBlockchainProvider();
    const result = await traverseGraph(mockProvider, 'TRootAddressNoTx', {
      maxHops: 3,
      maxNodes: 100,
      maxEdges: 300,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    assert.equal(result.graph.nodes.length, 1);
    assert.equal(result.graph.edges.length, 0);
    assert.equal(result.statistics.terminationReason, 'NO_MORE_TRANSFERS');
  });

  it('10. Provider failure', async () => {
    const mockProvider = new MockBlockchainProvider();
    mockProvider.shouldFail = true;

    await assert.rejects(
      async () => {
        await traverseGraph(mockProvider, 'TRootAddressFail', {
          maxHops: 3,
          maxNodes: 100,
          maxEdges: 300,
          limitPerAddress: 25,
          asset: 'USDT',
        });
      },
      (err: any) => err.message.includes('Simulated Provider Network Failure')
    );
  });

  it('11. Path reconstruction', async () => {
    const mockProvider = new MockBlockchainProvider();
    mockProvider.addTx('TRootAddress123', 'THop1AddressB', '100', '0xTx1');
    mockProvider.addTx('THop1AddressB', 'THop2AddressC', '50', '0xTx2');

    const result = await traverseGraph(mockProvider, 'TRootAddress123', {
      maxHops: 3,
      maxNodes: 100,
      maxEdges: 300,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    const pathForC = result.paths.find((p) => p.address === 'THop2AddressC');
    assert.ok(pathForC);
    assert.equal(pathForC.hop, 2);
    assert.equal(pathForC.path.length, 3);
    assert.equal(pathForC.path[0].address, 'TRootAddress123');
    assert.equal(pathForC.path[1].address, 'THop1AddressB');
    assert.equal(pathForC.path[2].address, 'THop2AddressC');
  });

  it('12. Deterministic traversal', async () => {
    const mockProvider = new MockBlockchainProvider();
    mockProvider.addTx('TRootAddress123', 'THop1AddressB', '100', '0xTx1');
    mockProvider.addTx('TRootAddress123', 'THop1AddressC', '200', '0xTx2');

    const res1 = await traverseGraph(mockProvider, 'TRootAddress123', {
      maxHops: 3,
      maxNodes: 100,
      maxEdges: 300,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    const res2 = await traverseGraph(mockProvider, 'TRootAddress123', {
      maxHops: 3,
      maxNodes: 100,
      maxEdges: 300,
      limitPerAddress: 25,
      asset: 'USDT',
    });

    assert.deepEqual(
      res1.graph.nodes.map((n) => n.id),
      res2.graph.nodes.map((n) => n.id)
    );
    assert.deepEqual(
      res1.graph.edges.map((e) => e.id),
      res2.graph.edges.map((e) => e.id)
    );
  });
});
