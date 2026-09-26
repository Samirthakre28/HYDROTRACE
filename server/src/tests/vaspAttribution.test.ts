import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VaspCandidateEngine } from '../services/attribution/VaspCandidateEngine.js';
import type { GraphData, TracePath } from '../../../shared/types/index.js';

describe('VASP Candidate Engine & Attribution Tests', () => {
  const engine = new VaspCandidateEngine();

  const mockGraphData: GraphData = {
    rootAddress: 'TRoot1234567890',
    chain: 'TRON',
    nodes: [
      { id: 'TRoot1234567890', chain: 'TRON', address: 'TRRoot1234567890', nodeType: 'WALLET', hop: 0 },
      { id: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', chain: 'TRON', address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', nodeType: 'WALLET', hop: 1 }, // Binance
      { id: 'TURTf8gN4u73y25tKLhmJi5iKodvUm3mJN', chain: 'TRON', address: 'TURTf8gN4u73y25tKLhmJi5iKodvUm3mJN', nodeType: 'WALLET', hop: 2 }, // KuCoin
    ],
    edges: [
      {
        id: 'tx1',
        chain: 'TRON',
        txHash: '0xTxHash111',
        from: 'TRoot1234567890',
        to: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn',
        asset: 'USDT',
        amount: '100',
        timestamp: '2026-09-27T00:00:00.000Z',
        direction: 'OUT',
        status: 'CONFIRMED',
        hop: 1,
        source: { provider: 'Mock', endpoint: '/test' },
      },
      {
        id: 'tx2',
        chain: 'TRON',
        txHash: '0xTxHash222',
        from: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn',
        to: 'TURTf8gN4u73y25tKLhmJi5iKodvUm3mJN',
        asset: 'USDT',
        amount: '50',
        timestamp: '2026-09-27T00:05:00.000Z',
        direction: 'OUT',
        status: 'CONFIRMED',
        hop: 2,
        source: { provider: 'Mock', endpoint: '/test' },
      },
    ],
    metadata: { maxHops: 3, maxNodes: 100, generatedAt: '2026-09-27T00:00:00.000Z' },
  };

  const mockConflictGraphData: GraphData = {
    rootAddress: 'TRoot1234567890',
    chain: 'TRON',
    nodes: [
      { id: 'TRoot1234567890', chain: 'TRON', address: 'TRoot1234567890', nodeType: 'WALLET', hop: 0 },
      // Address with conflicting intelligence records: HTX vs Poloniex
      { id: 'TT7hPkdWMPbkDzzsEDBNzuMn9gceTdgKtJ', chain: 'TRON', address: 'TT7hPkdWMPbkDzzsEDBNzuMn9gceTdgKtJ', nodeType: 'WALLET', hop: 1 },
    ],
    edges: [
      {
        id: 'txConflict',
        chain: 'TRON',
        txHash: '0xConflictTx',
        from: 'TRoot1234567890',
        to: 'TT7hPkdWMPbkDzzsEDBNzuMn9gceTdgKtJ',
        asset: 'USDT',
        amount: '300',
        timestamp: '2026-09-27T00:00:00.000Z',
        direction: 'OUT',
        status: 'CONFIRMED',
        hop: 1,
        source: { provider: 'Mock', endpoint: '/test' },
      },
    ],
    metadata: { maxHops: 3, maxNodes: 100, generatedAt: '2026-09-27T00:00:00.000Z' },
  };

  const mockPaths: TracePath[] = [
    {
      address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn',
      hop: 1,
      path: [
        { address: 'TRoot1234567890', txHash: 'ROOT' },
        { address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', txHash: '0xTxHash111', amount: '100' },
      ],
    },
    {
      address: 'TURTf8gN4u73y25tKLhmJi5iKodvUm3mJN',
      hop: 2,
      path: [
        { address: 'TRoot1234567890', txHash: 'ROOT' },
        { address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', txHash: '0xTxHash111', amount: '100' },
        { address: 'TURTf8gN4u73y25tKLhmJi5iKodvUm3mJN', txHash: '0xTxHash222', amount: '50' },
      ],
    },
  ];

  it('1. Exact VASP address match', () => {
    const res = engine.evaluateGraphAttribution({
      investigationId: 'INV-TEST-001',
      graph: mockGraphData,
      paths: mockPaths,
    });

    assert.equal(res.success, true);
    assert.equal(res.candidates.length, 2);
    const binance = res.candidates.find((c) => c.entityName === 'Binance');
    assert.ok(binance);
    assert.equal(binance.matchedAddress, 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn');
    assert.equal(binance.walletRole, 'HOT_WALLET');
  });

  it('2. No VASP match', () => {
    const emptyGraph: GraphData = {
      ...mockGraphData,
      nodes: [
        { id: 'TUnknownWallet111', chain: 'TRON', address: 'TUnknownWallet111', nodeType: 'WALLET', hop: 0 },
        { id: 'TUnknownWallet222', chain: 'TRON', address: 'TUnknownWallet222', nodeType: 'WALLET', hop: 1 },
      ],
    };

    const res = engine.evaluateGraphAttribution({
      investigationId: 'INV-TEST-002',
      graph: emptyGraph,
      paths: [],
    });

    assert.equal(res.candidates.length, 0);
    assert.equal(res.attributionBoundary.status, 'INSUFFICIENT_EVIDENCE');
  });

  it('3. Multiple candidates sorting by confidence score', () => {
    const res = engine.evaluateGraphAttribution({
      investigationId: 'INV-TEST-003',
      graph: mockGraphData,
      paths: mockPaths,
    });

    assert.equal(res.candidates.length, 2);
    assert.equal(res.candidates[0].entityName, 'Binance');
    assert.equal(res.candidates[0].confidenceScore, 95);
    assert.equal(res.candidates[1].entityName, 'KuCoin');
    assert.equal(res.candidates[1].confidenceScore, 90);
  });

  it('4. Official source scoring (+20)', () => {
    const binanceCandidate = engine['calculateConfidence']('OFFICIAL', 1);
    assert.equal(binanceCandidate.score, 95);
    const sourceFactor = binanceCandidate.breakdown.find((f) => f.factor === 'Source: OFFICIAL');
    assert.ok(sourceFactor);
    assert.equal(sourceFactor.points, 20);
  });

  it('5. Hop scoring logic', () => {
    const hop1 = engine['calculateConfidence']('OFFICIAL', 1);
    const hop2 = engine['calculateConfidence']('OFFICIAL', 2);
    const hop3 = engine['calculateConfidence']('OFFICIAL', 3);

    assert.equal(hop1.score, 95); // 60+20+15
    assert.equal(hop2.score, 90); // 60+20+10
    assert.equal(hop3.score, 85); // 60+20+5
  });

  it('6. Score cap at 100 max', () => {
    const calc = engine['calculateConfidence']('GOVERNMENT', 1);
    assert.ok(calc.score <= 100);
  });

  it('7. Candidate evidence path preservation', () => {
    const res = engine.evaluateGraphAttribution({
      investigationId: 'INV-TEST-007',
      graph: mockGraphData,
      paths: mockPaths,
    });

    const kucoin = res.candidates.find((c) => c.entityName === 'KuCoin');
    assert.ok(kucoin?.evidence.path);
    assert.equal(kucoin.evidence.path.length, 3);
    assert.equal(kucoin.evidence.transactionHash, '0xTxHash222');
  });

  it('8. Attribution boundary calculation', () => {
    const resWithMatch = engine.evaluateGraphAttribution({
      graph: mockGraphData,
      paths: mockPaths,
    });
    assert.equal(resWithMatch.attributionBoundary.status, 'DIRECT_EVIDENCE');

    const resNoMatch = engine.evaluateGraphAttribution({
      graph: { ...mockGraphData, nodes: [] },
      paths: [],
    });
    assert.equal(resNoMatch.attributionBoundary.status, 'INSUFFICIENT_EVIDENCE');
  });

  it('9. No evidence conflict on corroborated records', () => {
    const res = engine.evaluateGraphAttribution({
      graph: mockGraphData,
      paths: mockPaths,
    });

    assert.equal(res.hasConflict, false);
    assert.equal(res.reviewRequired, false);
    const binance = res.candidates.find((c) => c.entityName === 'Binance');
    assert.ok(binance);
    assert.equal(binance.hasConflict, false);
    assert.equal(binance.reviewRequired, false);
    assert.match(binance.conflictDetails?.message || '', /No Evidence Conflict Detected/);
  });

  it('10. Conflicting VASP sources detection and analyst review flag', () => {
    const res = engine.evaluateGraphAttribution({
      investigationId: 'INV-TEST-CONFLICT',
      graph: mockConflictGraphData,
      paths: [],
    });

    assert.equal(res.hasConflict, true);
    assert.equal(res.reviewRequired, true);
    assert.equal(res.candidates.length, 1);

    const candidate = res.candidates[0];
    assert.equal(candidate.hasConflict, true);
    assert.equal(candidate.reviewRequired, true);
    assert.ok(candidate.conflictDetails);
    assert.equal(candidate.conflictDetails.hasConflict, true);
    assert.deepEqual(candidate.conflictDetails.conflictingEntities, ['HTX (Huobi)', 'Poloniex']);
    assert.equal(candidate.conflictDetails.sources.length, 2);

    // Conflict reduces score (-20 penalty)
    // Hop 1 (60 + 20 [OFFICIAL] + 15 [Hop1] - 20 [Conflict] = 75)
    assert.equal(candidate.confidenceScore, 75);
    const penaltyFactor = candidate.scoreBreakdown.find((f) => f.factor === 'Evidence conflict penalty');
    assert.ok(penaltyFactor);
    assert.equal(penaltyFactor.points, -20);
  });

  it('11. Stress-test information returned with strengthen, weaken, and trigger categories', () => {
    const res = engine.evaluateGraphAttribution({
      graph: mockGraphData,
      paths: mockPaths,
    });

    assert.ok(res.stressTest);
    assert.ok(res.stressTest.strengthenEvidence.length >= 3);
    assert.ok(res.stressTest.weakenEvidence.length >= 3);
    assert.ok(res.stressTest.currentReviewTrigger.length > 0);

    const binance = res.candidates[0];
    assert.ok(binance.stressTest);
    assert.ok(binance.stressTest.strengthenEvidence.length >= 3);
    assert.ok(binance.stressTest.weakenEvidence.length >= 3);
  });
});
