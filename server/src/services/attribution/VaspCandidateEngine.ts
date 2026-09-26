import type {
  GraphData,
  TracePath,
  VaspCandidate,
  ScoreFactor,
  AttributionBoundary,
  EvaluateAttributionRequest,
  EvaluateAttributionResponse,
  EvidenceSource,
  ConflictDetail,
  StressTestCategory,
  VaspLabelRecord,
} from '../../../../shared/types/index.js';
import { findVaspLabelByAddress, PROTOTYPE_DATASET_NAME } from '../../data/vaspLabels.js';
import { ApiError } from '../../utils/apiError.js';

export class VaspCandidateEngine {
  /**
   * Generates standard attribution stress test conditions
   */
  private generateStressTest(hasConflict: boolean): StressTestCategory {
    return {
      strengthenEvidence: [
        'Direct VASP confirmation of the address via formal legal process (e.g. 91 CrPC / MLAT / Subpoena).',
        'Recent official verification of the address in public reserve audit.',
        'Matching customer deposit record, tag, or internal account ledger reference.',
        'Independent corroboration from another trusted intelligence source or FIU register.',
      ],
      weakenEvidence: [
        'Label becomes stale or unverified without recent cluster activity.',
        'Trusted source changes or retracts the address association.',
        'Conflicting trusted evidence appears associating the address with a different VASP.',
        'Address operational role transitions (e.g., decommissioned hot wallet or third-party sweep aggregator).',
      ],
      currentReviewTrigger: hasConflict
        ? 'Conflicting attribution evidence detected. Human analyst review required before treating the candidate as a strong attribution.'
        : 'Current evidence is sufficient for candidate attribution, but additional verification is recommended.',
    };
  }

  /**
   * Detects evidence conflicts across intelligence sources for a given record
   */
  private detectConflict(record: VaspLabelRecord): ConflictDetail {
    const sources: EvidenceSource[] = record.evidenceSources || [
      {
        sourceType: record.sourceType,
        sourceName: record.sourceReference,
        reference: record.sourceReference,
        reliability: record.sourceType === 'OFFICIAL' ? 'HIGH' : 'MEDIUM',
        associatedEntity: record.entityName,
      },
    ];

    const entitySet = new Set<string>();
    sources.forEach((s) => {
      entitySet.add(s.associatedEntity || record.entityName);
    });

    const conflictingEntities = Array.from(entitySet);
    const hasConflict = conflictingEntities.length > 1;

    return {
      hasConflict,
      address: record.address,
      conflictingEntities,
      sources: sources.map((s) => ({
        vasp: s.associatedEntity || record.entityName,
        sourceType: s.sourceType,
        sourceName: s.sourceName,
        reference: s.reference,
        reliability: s.reliability,
      })),
      reviewRequired: hasConflict,
      message: hasConflict
        ? 'Conflicting attribution evidence detected across multiple intelligence sources. Human analyst review required before treating candidate as a strong attribution.'
        : `No Evidence Conflict Detected. All sources associate this address with ${record.entityName}.`,
    };
  }

  /**
   * Calculates transparent rule-based confidence score for demonstration
   * Preserves existing scoring mechanics while deducting points when conflicts exist.
   */
  private calculateConfidence(
    sourceType: 'OFFICIAL' | 'GOVERNMENT' | 'EXPLORER' | 'CURATED',
    hop: number,
    hasConflict = false
  ): { score: number; breakdown: ScoreFactor[] } {
    const breakdown: ScoreFactor[] = [];

    // 1. Exact address match base score (+60)
    breakdown.push({ factor: 'Exact address match', points: 60 });
    let total = 60;

    // 2. Source Type points (+5 to +20)
    let sourcePoints = 5;
    if (sourceType === 'OFFICIAL') sourcePoints = 20;
    else if (sourceType === 'GOVERNMENT') sourcePoints = 20;
    else if (sourceType === 'EXPLORER') sourcePoints = 10;
    else if (sourceType === 'CURATED') sourcePoints = 5;

    breakdown.push({ factor: `Source: ${sourceType}`, points: sourcePoints });
    total += sourcePoints;

    // 3. Hop Distance Proximity (+5 to +15)
    let hopPoints = 0;
    if (hop === 1) hopPoints = 15;
    else if (hop === 2) hopPoints = 10;
    else if (hop === 3) hopPoints = 5;

    if (hopPoints > 0) {
      breakdown.push({ factor: `Hop ${hop} proximity`, points: hopPoints });
      total += hopPoints;
    }

    // 4. Conflict reduction (-20)
    if (hasConflict) {
      breakdown.push({ factor: 'Evidence conflict penalty', points: -20 });
      total -= 20;
    }

    const cappedScore = Math.max(0, Math.min(total, 100));

    return {
      score: cappedScore,
      breakdown,
    };
  }

  /**
   * Evaluates a discovered transaction graph against the prototype VASP intelligence dataset
   */
  evaluateGraphAttribution(request: EvaluateAttributionRequest): EvaluateAttributionResponse {
    if (!request.graph || !Array.isArray(request.graph.nodes)) {
      throw new ApiError(400, 'Invalid request: graph object with nodes is required for VASP evaluation.');
    }

    const graph: GraphData = request.graph;
    const paths: TracePath[] = request.paths || [];
    const candidates: VaspCandidate[] = [];

    let overallHasConflict = false;
    const conflictedAddresses: string[] = [];

    for (const node of graph.nodes) {
      const labelRecord = findVaspLabelByAddress(node.address);
      if (!labelRecord) continue;

      // Detect conflicts for this address
      const conflictDetail = this.detectConflict(labelRecord);
      if (conflictDetail.hasConflict) {
        overallHasConflict = true;
        conflictedAddresses.push(node.address);
      }

      // Find path from root to this address
      const tracePath = paths.find(
        (p) => p.address.toLowerCase() === node.address.toLowerCase()
      );

      // Find the edge leading to this node
      const leadingEdge = graph.edges.find(
        (e) => e.to.toLowerCase() === node.address.toLowerCase()
      );

      const { score, breakdown } = this.calculateConfidence(
        labelRecord.sourceType,
        node.hop,
        conflictDetail.hasConflict
      );

      const stressTest = this.generateStressTest(conflictDetail.hasConflict);

      candidates.push({
        entityName: labelRecord.entityName,
        matchedAddress: node.address,
        chain: 'TRON',
        walletRole: labelRecord.walletRole,
        hop: node.hop,
        confidenceScore: score,
        scoreBreakdown: breakdown,
        explanation: conflictDetail.hasConflict
          ? `Exact address match with conflicting VASP attributions detected across intelligence sources at Hop ${node.hop}.`
          : `Exact address match with a curated ${labelRecord.sourceType.toLowerCase()} VASP intelligence record at Hop ${node.hop}.`,
        evidenceSources: labelRecord.evidenceSources || [
          {
            sourceType: labelRecord.sourceType,
            sourceName: labelRecord.sourceReference,
            reference: labelRecord.sourceReference,
            reliability: labelRecord.sourceType === 'OFFICIAL' ? 'HIGH' : 'MEDIUM',
            associatedEntity: labelRecord.entityName,
          },
        ],
        hasConflict: conflictDetail.hasConflict,
        conflictDetails: conflictDetail,
        reviewRequired: conflictDetail.reviewRequired,
        stressTest,
        evidence: {
          addressMatch: true,
          sourceType: labelRecord.sourceType,
          sourceReference: labelRecord.sourceReference,
          transactionHash: leadingEdge?.txHash,
          amount: leadingEdge?.amount,
          timestamp: leadingEdge?.timestamp,
          path: tracePath?.path,
        },
      });
    }

    // Sort candidates strictly by confidence score descending
    candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);

    // Determine Attribution Boundary
    let attributionBoundary: AttributionBoundary;
    if (candidates.length > 0) {
      attributionBoundary = {
        status: 'DIRECT_EVIDENCE',
        explanation: 'Known VASP-associated address/cluster supported by strong on-chain evidence match.',
        evidenceSummary: `Identified ${candidates.length} candidate VASP(s) via direct on-chain address matching.${
          overallHasConflict ? ' Evidence conflicts detected among candidates; human analyst review required.' : ''
        }`,
      };
    } else {
      attributionBoundary = {
        status: 'INSUFFICIENT_EVIDENCE',
        explanation: 'Insufficient evidence to establish a VASP association within the current search boundary.',
        evidenceSummary: '0 candidate VASPs identified within current search boundary.',
      };
    }

    const overallStressTest = this.generateStressTest(overallHasConflict);

    return {
      success: true,
      investigationId: request.investigationId,
      candidates,
      attributionBoundary,
      hasConflict: overallHasConflict,
      reviewRequired: overallHasConflict,
      conflictSummary: {
        totalConflicts: conflictedAddresses.length,
        conflictedAddresses,
      },
      stressTest: overallStressTest,
      source: {
        dataset: PROTOTYPE_DATASET_NAME,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
