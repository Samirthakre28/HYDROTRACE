import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  EvidenceBundleService,
  canonicalizeJson,
  computeSha256,
} from '../services/report/EvidenceBundleService.js';
import { VaspCandidateEngine } from '../services/attribution/VaspCandidateEngine.js';
import type {
  TraceInvestigationResponse,
  EvaluateAttributionResponse,
  GraphData,
  TracePath,
} from '../../../shared/types/index.js';

describe('Evidence Bundle & Report Export Tests (Step 6)', () => {
  const service = new EvidenceBundleService();
  const vaspEngine = new VaspCandidateEngine();

  // Mock graph and paths
  const mockGraph: GraphData = {
    rootAddress: 'TRootAddress1234567890',
    chain: 'TRON',
    nodes: [
      { id: 'TRootAddress1234567890', chain: 'TRON', address: 'TRootAddress1234567890', nodeType: 'WALLET', hop: 0 },
      { id: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', chain: 'TRON', address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', nodeType: 'WALLET', hop: 1 },
    ],
    edges: [
      {
        id: 'tx1',
        chain: 'TRON',
        txHash: '0xHash1111111111111111111111111111111111111111111111111111111111111111',
        from: 'TRootAddress1234567890',
        to: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn',
        asset: 'USDT',
        amount: '1500.00',
        timestamp: '2026-09-27T00:00:00.000Z',
        direction: 'OUT',
        status: 'CONFIRMED',
        hop: 1,
        source: { provider: 'TronGrid-Provider', endpoint: '/v1/accounts/transfers' },
      },
    ],
    metadata: { maxHops: 3, maxNodes: 100, generatedAt: '2026-09-27T00:00:00.000Z' },
  };

  const mockPaths: TracePath[] = [
    {
      address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn',
      hop: 1,
      path: [
        { address: 'TRootAddress1234567890', txHash: '' },
        { address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', txHash: '0xHash1111111111111111111111111111111111111111111111111111111111111111', amount: '1500.00' },
      ],
    },
  ];

  const mockTraceResponse: TraceInvestigationResponse = {
    success: true,
    investigationId: 'INV-TEST-001',
    investigation: {
      chain: 'TRON',
      rootAddress: 'TRootAddress1234567890',
      asset: 'USDT',
      maxHops: 3,
    },
    graph: mockGraph,
    paths: mockPaths,
    statistics: {
      nodesDiscovered: 2,
      edgesDiscovered: 1,
      addressesTraversed: 1,
      maxHopReached: 1,
      terminationReason: 'MAX_HOPS',
    },
    source: {
      provider: 'TRON-PROVIDER',
      generatedAt: '2026-09-27T00:00:00.000Z',
    },
  };

  const mockAttributionResponse: EvaluateAttributionResponse = vaspEngine.evaluateGraphAttribution({
    investigationId: 'INV-TEST-001',
    graph: mockGraph,
    paths: mockPaths,
  });

  // Graph with conflicting intelligence record
  const mockConflictGraph: GraphData = {
    rootAddress: 'TRootAddress1234567890',
    chain: 'TRON',
    nodes: [
      { id: 'TRootAddress1234567890', chain: 'TRON', address: 'TRootAddress1234567890', nodeType: 'WALLET', hop: 0 },
      { id: 'TT7hPkdWMPbkDzzsEDBNzuMn9gceTdgKtJ', chain: 'TRON', address: 'TT7hPkdWMPbkDzzsEDBNzuMn9gceTdgKtJ', nodeType: 'WALLET', hop: 1 },
    ],
    edges: [
      {
        id: 'txConflict',
        chain: 'TRON',
        txHash: '0xHashConflict999',
        from: 'TRootAddress1234567890',
        to: 'TT7hPkdWMPbkDzzsEDBNzuMn9gceTdgKtJ',
        asset: 'USDT',
        amount: '500.00',
        timestamp: '2026-09-27T00:00:00.000Z',
        direction: 'OUT',
        status: 'CONFIRMED',
        hop: 1,
        source: { provider: 'TronGrid-Provider', endpoint: '/v1/accounts/transfers' },
      },
    ],
    metadata: { maxHops: 3, maxNodes: 100, generatedAt: '2026-09-27T00:00:00.000Z' },
  };

  const mockConflictPaths: TracePath[] = [
    {
      address: 'TT7hPkdWMPbkDzzsEDBNzuMn9gceTdgKtJ',
      hop: 1,
      path: [
        { address: 'TRootAddress1234567890', txHash: '' },
        { address: 'TT7hPkdWMPbkDzzsEDBNzuMn9gceTdgKtJ', txHash: '0xHashConflict999', amount: '500.00' },
      ],
    },
  ];

  const mockConflictTraceResponse: TraceInvestigationResponse = {
    ...mockTraceResponse,
    investigationId: 'INV-CONFLICT-002',
    graph: mockConflictGraph,
    paths: mockConflictPaths,
  };

  const mockConflictAttributionResponse: EvaluateAttributionResponse = vaspEngine.evaluateGraphAttribution({
    investigationId: 'INV-CONFLICT-002',
    graph: mockConflictGraph,
    paths: mockConflictPaths,
  });

  // 1. Report generation
  it('1. Report generation: generates complete report with HTML, JSON bundle, and SAHYOG payload', () => {
    const report = service.generateReport(mockTraceResponse, mockAttributionResponse, 'CR-TEST-999');

    assert.equal(report.success, true);
    assert.equal(report.investigationId, 'INV-TEST-001');
    assert.ok(report.sha256, 'SHA-256 seal must be present');
    assert.ok(report.htmlReport, 'HTML report must be generated');
    assert.ok(report.bundle, 'Machine-readable evidence bundle must be generated');
    assert.ok(report.sahyogPayload, 'SAHYOG payload must be generated');

    // Human-readable HTML checks
    assert.ok(report.htmlReport.includes('<!DOCTYPE html>'));
    assert.ok(report.htmlReport.includes('HydroTrace'));
    assert.ok(report.htmlReport.includes('Evidence-Driven Blockchain Intelligence for VASP Attribution'));
    assert.ok(report.htmlReport.includes('INV-TEST-001'));
    assert.ok(report.htmlReport.includes('Binance'));
    assert.ok(report.htmlReport.includes('Evidence Score: 95/100'));
    assert.ok(report.htmlReport.includes('Hash-sealed prototype evidence bundle'));
    assert.ok(report.bundle.methodologyVersion.includes('HydroTrace'));
  });

  // 2. JSON evidence bundle generation
  it('2. JSON evidence bundle generation: produces structured canonical fields', () => {
    const bundle = service.generateEvidenceBundle(mockTraceResponse, mockAttributionResponse, 'CR-TEST-999');

    assert.equal(bundle.investigationId, 'INV-TEST-001');
    assert.equal(bundle.target.chain, 'TRON');
    assert.equal(bundle.target.rootAddress, 'TRootAddress1234567890');
    assert.equal(bundle.target.caseReference, 'CR-TEST-999');
    assert.ok(bundle.trace.nodes.length >= 2);
    assert.ok(bundle.vaspCandidates.length > 0);
    assert.ok(bundle.evidence.dataset);
    assert.ok(bundle.attributionBoundary);
    assert.ok(bundle.stressTest);
    assert.ok(Array.isArray(bundle.limitations));
    assert.ok(bundle.sha256.length === 64);
  });

  // 3. Deterministic canonical serialization
  it('3. Deterministic canonical serialization: object key order does not affect canonical representation', () => {
    const objA = {
      z: 'last',
      a: 'first',
      m: { y: 2, b: 1 },
      list: [{ d: 4, c: 3 }],
    };

    const objB = {
      a: 'first',
      list: [{ c: 3, d: 4 }],
      m: { b: 1, y: 2 },
      z: 'last',
    };

    const canonicalA = canonicalizeJson(objA);
    const canonicalB = canonicalizeJson(objB);

    assert.equal(canonicalA, canonicalB, 'Canonical JSON strings must be identical regardless of insertion order');
    assert.equal(canonicalA, '{"a":"first","list":[{"c":3,"d":4}],"m":{"b":1,"y":2},"z":"last"}');
  });

  // 4. SHA-256 generation
  it('4. SHA-256 generation: generates valid 64-character lowercase hex string', () => {
    const sample = 'test-canonical-data-string';
    const hash = computeSha256(sample);

    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64, 'SHA-256 must be exactly 64 hex characters');
    assert.match(hash, /^[0-9a-f]{64}$/, 'SHA-256 must match lowercase hexadecimal pattern');
  });

  // 5. Same evidence -> same hash
  it('5. Same evidence -> same hash: multiple evaluations of identical evidence yield identical SHA-256', () => {
    const bundleA = service.generateEvidenceBundle(mockTraceResponse, mockAttributionResponse, 'CASE-101');
    const bundleB = service.generateEvidenceBundle(mockTraceResponse, mockAttributionResponse, 'CASE-101');

    assert.equal(bundleA.sha256, bundleB.sha256, 'Identical investigation evidence must produce the exact same SHA-256 hash');
  });

  // 6. Changed evidence -> different hash
  it('6. Changed evidence -> different hash: altering any field changes the SHA-256 seal', () => {
    const bundleOriginal = service.generateEvidenceBundle(mockTraceResponse, mockAttributionResponse, 'CASE-101');

    // Create a modified trace response with a different root wallet
    const modifiedTrace: TraceInvestigationResponse = {
      ...mockTraceResponse,
      investigation: {
        ...mockTraceResponse.investigation,
        rootAddress: 'TDifferentAddress9999999999',
      },
    };

    const bundleModified = service.generateEvidenceBundle(modifiedTrace, mockAttributionResponse, 'CASE-101');

    assert.notEqual(
      bundleOriginal.sha256,
      bundleModified.sha256,
      'Altering evidence data must produce a different SHA-256 hash'
    );
  });

  // 7. Conflict information included
  it('7. Conflict information included: handles both NONE and DETECTED conflict states with review requirement', () => {
    // Non-conflicting evidence
    const cleanBundle = service.generateEvidenceBundle(mockTraceResponse, mockAttributionResponse);
    assert.equal(cleanBundle.conflicts.hasConflict, false);
    assert.equal(cleanBundle.conflicts.reviewRequired, false);

    const cleanHtml = service.generateHtmlReport(cleanBundle);
    assert.ok(cleanHtml.includes('Evidence Conflict: NONE'));

    // Conflicting evidence
    const conflictBundle = service.generateEvidenceBundle(mockConflictTraceResponse, mockConflictAttributionResponse);
    assert.equal(conflictBundle.conflicts.hasConflict, true);
    assert.equal(conflictBundle.conflicts.reviewRequired, true);
    assert.ok(conflictBundle.conflicts.details.length > 0);

    const conflictHtml = service.generateHtmlReport(conflictBundle);
    assert.ok(conflictHtml.includes('Evidence Conflict: DETECTED'));
    assert.ok(conflictHtml.includes('Status: ANALYST REVIEW REQUIRED'));
    assert.ok(conflictHtml.includes('HTX'));
    assert.ok(conflictHtml.includes('Poloniex'));
  });

  // 8. Attribution boundary included
  it('8. Attribution boundary included: contains status, classification tiers, and real-world identity notice', () => {
    const bundle = service.generateEvidenceBundle(mockTraceResponse, mockAttributionResponse);

    assert.ok(bundle.attributionBoundary);
    assert.ok(
      ['DIRECT_EVIDENCE', 'INFERRED_ASSOCIATION', 'INSUFFICIENT_EVIDENCE', 'DIRECT EVIDENCE', 'INFERRED ASSOCIATION', 'UNKNOWN'].includes(bundle.attributionBoundary.status)
    );
    assert.ok(bundle.attributionBoundary.explanation);

    const html = service.generateHtmlReport(bundle);
    assert.ok(html.includes('DIRECT EVIDENCE:'));
    assert.ok(html.includes('INFERRED ASSOCIATION:'));
    assert.ok(html.includes('UNKNOWN:'));
    assert.ok(
      html.includes('On-chain attribution does not establish the real-world identity or ownership of the wallet.')
    );
  });

  // 9. Stress-test information included
  it('9. Stress-test information included: contains strengthening/weakening evidence criteria and real review trigger', () => {
    const bundle = service.generateEvidenceBundle(mockTraceResponse, mockAttributionResponse);

    assert.ok(bundle.stressTest);
    assert.ok(Array.isArray(bundle.stressTest.strengthenEvidence));
    assert.ok(bundle.stressTest.strengthenEvidence.length > 0);
    assert.ok(Array.isArray(bundle.stressTest.weakenEvidence));
    assert.ok(bundle.stressTest.weakenEvidence.length > 0);
    assert.ok(bundle.stressTest.currentReviewTrigger);

    const html = service.generateHtmlReport(bundle);
    assert.ok(html.includes('Could strengthen attribution:'));
    assert.ok(html.includes('Could weaken attribution:'));
    assert.ok(html.includes('Current Review Trigger:'));
    assert.ok(html.includes(bundle.stressTest.currentReviewTrigger));
  });

  // 10. Disclosure payload generated without external API calls
  it('10. Disclosure payload generated without external API calls: synchronous in-memory payload with SAHYOG disclaimer', () => {
    const bundle = service.generateEvidenceBundle(mockTraceResponse, mockAttributionResponse, 'CR-2026-08912');

    // Measure execution time to verify purely synchronous in-memory execution (no external network request)
    const startTime = performance.now();
    const sahyog = service.generateSahyogPayload(bundle);
    const durationMs = performance.now() - startTime;

    assert.ok(durationMs < 50, 'Payload generation must execute in milliseconds without external HTTP requests');
    assert.equal(sahyog.caseReference, 'CR-2026-08912');
    assert.equal(sahyog.targetWallet, 'TRootAddress1234567890');
    assert.equal(sahyog.chain, 'TRON');
    assert.equal(sahyog.asset, 'USDT');
    assert.ok(sahyog.candidateVasps.length > 0);
    assert.equal(sahyog.candidateVasps[0].entityName, 'Binance');
    assert.equal(sahyog.candidateVasps[0].evidenceScore, 95);
    assert.ok(sahyog.sha256Seal === bundle.sha256);
    assert.ok(
      sahyog.legalNotice.includes('SAHYOG-compatible prototype payload for investigation demonstration purposes only')
    );
  });
});
