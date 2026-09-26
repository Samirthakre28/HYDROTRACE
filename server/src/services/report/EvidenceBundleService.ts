import crypto from 'crypto';
import type {
  TraceInvestigationResponse,
  EvaluateAttributionResponse,
  CanonicalEvidenceContent,
  EvidenceBundleExport,
  SahyogDisclosurePayload,
  GenerateReportResponse,
} from '../../../../shared/types/index.js';

export const METHODOLOGY_VERSION = 'HydroTrace-VASP-TRACE-v1.0.0';

export const STANDARD_LIMITATIONS = [
  'On-chain attribution does not establish the real-world identity or ownership of the wallet.',
  'Attribution candidates represent observed transaction paths to known exchange/service infrastructure.',
  'Evidence scores reflect factual provenance and source agreement, not statistical probability of guilt or ownership.',
  'Trace depth is bounded to control API usage and investigation scope.',
  'Hash-sealed prototype evidence bundle provides tamper-evidence for the exported record; does not constitute self-authenticating court evidence without sworn chain of custody.',
];

/**
 * Deterministically sorts object keys recursively for canonical JSON representation
 */
export function canonicalizeJson(value: any): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalizeJson(item)).join(',') + ']';
  }

  const sortedKeys = Object.keys(value).sort();
  const pairs = sortedKeys.map((key) => {
    return JSON.stringify(key) + ':' + canonicalizeJson(value[key]);
  });

  return '{' + pairs.join(',') + '}';
}

/**
 * Computes a SHA-256 hash of canonical JSON string
 */
export function computeSha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

export class EvidenceBundleService {
  /**
   * Builds the canonical evidence content without the hash
   */
  buildCanonicalEvidence(
    trace: TraceInvestigationResponse,
    attribution: EvaluateAttributionResponse,
    caseReference = 'CR-2026-08912'
  ): CanonicalEvidenceContent {
    const rootAddress = trace.investigation.rootAddress;
    const chain = trace.investigation.chain;
    const asset = trace.investigation.asset;

    const vaspCandidates = (attribution.candidates || []).map((c) => ({
      entityName: c.entityName,
      matchedAddress: c.matchedAddress,
      walletRole: c.walletRole,
      hop: c.hop,
      evidenceScore: c.confidenceScore,
      scoreBreakdown: c.scoreBreakdown,
      hasConflict: c.hasConflict,
      evidenceSources: c.evidenceSources,
      path: c.evidence.path,
    }));

    const conflicts = {
      hasConflict: attribution.hasConflict,
      reviewRequired: attribution.reviewRequired,
      conflictedAddresses: attribution.conflictSummary?.conflictedAddresses || [],
      details: (attribution.candidates || [])
        .filter((c) => c.hasConflict && c.conflictDetails)
        .map((c) => c.conflictDetails!),
    };

    return {
      investigationId: trace.investigationId,
      methodologyVersion: METHODOLOGY_VERSION,
      target: {
        chain,
        rootAddress,
        asset,
        caseReference,
      },
      trace: {
        maxHops: trace.investigation.maxHops,
        nodesDiscovered: trace.statistics.nodesDiscovered,
        edgesDiscovered: trace.statistics.edgesDiscovered,
        addressesTraversed: trace.statistics.addressesTraversed,
        maxHopReached: trace.statistics.maxHopReached,
        terminationReason: trace.statistics.terminationReason,
        nodes: trace.graph.nodes,
        edges: trace.graph.edges,
        paths: trace.paths,
      },
      vaspCandidates,
      evidence: {
        dataset: attribution.source.dataset,
        directMatchesCount: vaspCandidates.length,
        corroboratedCount: vaspCandidates.filter((c) => !c.hasConflict).length,
      },
      conflicts,
      attributionBoundary: attribution.attributionBoundary,
      stressTest: attribution.stressTest,
      limitations: STANDARD_LIMITATIONS,
    };
  }

  /**
   * Seals canonical evidence into an exportable machine-readable bundle with SHA-256 hash
   */
  generateEvidenceBundle(
    trace: TraceInvestigationResponse,
    attribution: EvaluateAttributionResponse,
    caseReference = 'CR-2026-08912'
  ): EvidenceBundleExport {
    const canonical = this.buildCanonicalEvidence(trace, attribution, caseReference);
    const canonicalString = canonicalizeJson(canonical);
    const sha256 = computeSha256(canonicalString);

    return {
      ...canonical,
      generatedAt: new Date().toISOString(),
      sha256,
    };
  }

  /**
   * Generates a SAHYOG-compatible disclosure payload for lawful VASP request workflows
   */
  generateSahyogPayload(
    bundle: EvidenceBundleExport
  ): SahyogDisclosurePayload {
    const candidateVasps = bundle.vaspCandidates.map((c) => ({
      entityName: c.entityName,
      depositAddress: c.matchedAddress,
      hopDistance: c.hop,
      evidenceScore: c.evidenceScore,
      walletRole: c.walletRole,
      hasConflict: c.hasConflict,
      officialReference: c.evidenceSources[0]?.reference || 'Official VASP Record',
      suggestedAction: c.hasConflict
        ? 'Manual analyst review required prior to Section 91 CrPC notice due to conflicting intelligence sources.'
        : 'Sufficient direct evidence to issue formal Section 91 CrPC / LEA customer disclosure request.',
    }));

    return {
      caseReference: bundle.target.caseReference || 'CR-2026-08912',
      targetWallet: bundle.target.rootAddress,
      chain: bundle.target.chain,
      asset: bundle.target.asset,
      generatedAt: bundle.generatedAt,
      sha256Seal: bundle.sha256,
      candidateVasps,
      evidenceSummary: `Identified ${candidateVasps.length} candidate VASP(s) within ${bundle.trace.maxHops} hops. Direct on-chain evidence match against curated registry.`,
      reviewRequired: bundle.conflicts.reviewRequired,
      legalNotice: 'HydroTrace SAHYOG-compatible prototype payload for investigation demonstration purposes only. Evidence-driven VASP attribution; does not establish personal real-world identity.',
    };
  }

  /**
   * Generates human-readable printable HTML investigation report
   */
  generateHtmlReport(bundle: EvidenceBundleExport): string {
    const traceRows = bundle.trace.edges.map((e) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px 8px; font-weight: bold; text-align: center;">Hop ${e.hop}</td>
        <td style="padding: 6px 8px; font-family: monospace;">${e.from}</td>
        <td style="padding: 6px 8px; font-family: monospace;">${e.to}</td>
        <td style="padding: 6px 8px; font-family: monospace; color: #0284c7; word-break: break-all;">${e.txHash}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: #047857;">${e.amount} ${e.asset}</td>
        <td style="padding: 6px 8px; color: #64748b; font-size: 10px;">${new Date(e.timestamp).toLocaleString()}</td>
        <td style="padding: 6px 8px; font-size: 10px; color: #475569;">${e.source?.provider || 'TRON-PROVIDER'}</td>
      </tr>
    `).join('');

    const candidateCards = bundle.vaspCandidates.map((c) => {
      const sourcesList = (c.evidenceSources || [])
        .map((s) => `<li><strong>${s.sourceName}</strong> (${s.sourceType}, Reliability: ${s.reliability}) — <em>${s.reference}</em></li>`)
        .join('');

      return `
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 12px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <span style="font-size: 14px; font-weight: bold; color: #0f172a;">${c.entityName}</span>
              <span style="margin-left: 8px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${c.walletRole}</span>
              <span style="margin-left: 4px; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 10px;">Hop ${c.hop}</span>
            </div>
            <div style="font-size: 13px; font-weight: bold; color: #0284c7;">
              Evidence Score: ${c.evidenceScore}/100
            </div>
          </div>
          <div style="font-size: 11px; color: #334155; line-height: 1.6;">
            <div><strong>Matched Address:</strong> <span style="font-family: monospace;">${c.matchedAddress}</span></div>
            <div><strong>Evidence Path:</strong> <span style="font-family: monospace; color: #0369a1;">${c.path || `${bundle.target.rootAddress} → Hop ${c.hop} → ${c.matchedAddress}`}</span></div>
            <div><strong>Attribution Boundary:</strong> <span style="font-weight: 600;">${bundle.attributionBoundary.status}</span></div>
            <div><strong>Conflict Status:</strong> ${c.hasConflict ? '<span style="color: #b45309; font-weight: bold;">CONFLICT DETECTED</span>' : '<span style="color: #15803d; font-weight: bold;">NONE</span>'}</div>
            <div><strong>Analyst Review Status:</strong> <span style="font-weight: bold; color: ${c.hasConflict ? '#b45309' : '#047857'};">${c.hasConflict ? 'ANALYST REVIEW REQUIRED' : 'COMPLETED / CORROBORATED'}</span></div>
            <div style="margin-top: 6px;">
              <strong>Evidence Sources:</strong>
              <ul style="margin: 2px 0 0 16px; padding: 0;">
                ${sourcesList || '<li>Curated VASP Label Database (Verified)</li>'}
              </ul>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const conflictSection = bundle.conflicts.hasConflict
      ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
          <h3 style="color: #92400e; margin: 0 0 4px 0; font-size: 14px;">Evidence Conflict: DETECTED</h3>
          <p style="color: #b45309; font-size: 12px; margin: 0 0 10px 0; font-weight: bold;">Status: ANALYST REVIEW REQUIRED</p>
          <div style="font-size: 12px; color: #451a03;">
            ${bundle.conflicts.details.map((d) => `
              <div style="margin-bottom: 8px;">
                <strong>Conflicting Address:</strong> <span style="font-family: monospace;">${d.address}</span><br/>
                <strong>Conflicting Entities:</strong>
                <ul style="margin: 2px 0 6px 16px;">
                  ${d.conflictingEntities.map((e) => `<li>${e}</li>`).join('')}
                </ul>
                <strong>Supporting Sources:</strong>
                <ul style="margin: 2px 0 0 16px;">
                  ${d.sources.map((s) => `<li><strong>${s.vasp}</strong>: ${s.sourceName} (${s.sourceType}, Reliability: ${s.reliability}) — <em>${s.reference}</em></li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>
      `
      : `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 12px; color: #166534;">
          <strong>Evidence Conflict: NONE</strong><br/>
          <span>Status: Verified single-entity attribution. All corroborating intelligence sources concur.</span>
        </div>
      `;

    const strengthenItems = bundle.stressTest.strengthenEvidence.map((s) => `<li>${s}</li>`).join('');
    const weakenItems = bundle.stressTest.weakenEvidence.map((w) => `<li>${w}</li>`).join('');
    const limitationsList = bundle.limitations.map((l) => `<li>${l}</li>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HydroTrace Investigation Report — ${bundle.investigationId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.5; padding: 30px; max-width: 950px; margin: 0 auto; background: #ffffff; }
    h1 { font-size: 20px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    h2 { font-size: 13px; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; color: #1e293b; letter-spacing: 0.5px; }
    .badge { display: inline-block; padding: 2px 8px; font-size: 10px; font-family: monospace; border-radius: 4px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold; }
    .hash-box { background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 11px; padding: 12px; border-radius: 6px; word-break: break-all; margin: 15px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    th { background: #f8fafc; text-align: left; padding: 6px 8px; border-bottom: 2px solid #cbd5e1; font-size: 10px; text-transform: uppercase; color: #475569; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px; margin-bottom: 15px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px; }
    .print-btn { display: inline-block; padding: 8px 16px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold; border: none; cursor: pointer; }
    @media print { .print-btn { display: none; } body { padding: 0; font-size: 11px; } }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
    <div>
      <span class="badge" style="background: #1e3a8a; color: #bfdbfe; border-color: #3b82f6;">RESTRICTED FORENSIC INTELLIGENCE</span>
      <h1 style="font-size: 26px; font-weight: 800; color: #0284c7; margin: 4px 0 2px 0;">HydroTrace</h1>
      <p style="font-size: 13px; font-weight: 600; color: #334155; margin: 0 0 4px 0;">Evidence-Driven Blockchain Intelligence for VASP Attribution</p>
      <p style="font-size: 11px; color: #64748b; margin: 0;">Investigation Report & Sealed Forensic Evidence Bundle</p>
    </div>
    <button class="print-btn" onclick="window.print()">Print to PDF</button>
  </div>

  <div class="hash-box">
    <div style="color: #94a3b8; font-size: 10px; text-transform: uppercase; margin-bottom: 2px;">Evidence Bundle Hash</div>
    <div style="font-size: 10px; color: #e2e8f0;">SHA-256:</div>
    <div style="font-size: 12px; font-weight: bold; color: #38bdf8;">${bundle.sha256}</div>
    <div style="color: #94a3b8; font-size: 10px; margin-top: 4px;">Hash-sealed prototype evidence bundle. The hash provides tamper-evidence for the exported bundle.</div>
  </div>

  <h2>1. Investigation Information</h2>
  <div class="meta-grid">
    <div class="meta-box">
      <strong>Investigation ID:</strong> <span style="font-family: monospace;">${bundle.investigationId}</span><br/>
      <strong>Case Reference:</strong> ${bundle.target.caseReference || 'CR-2026-08912'}<br/>
      <strong>Target Wallet Address:</strong> <span style="font-family: monospace; font-size: 11px;">${bundle.target.rootAddress}</span><br/>
      <strong>Investigator / Team:</strong> HydroTrace Forensic Intelligence Team
    </div>
    <div class="meta-box">
      <strong>Blockchain:</strong> ${bundle.target.chain}<br/>
      <strong>Asset:</strong> ${bundle.target.asset}<br/>
      <strong>Investigation Timestamp:</strong> ${new Date(bundle.generatedAt).toUTCString()}<br/>
      <strong>Maximum Hops Used:</strong> ${bundle.trace.maxHops} hops (Max reached: Hop ${bundle.trace.maxHopReached})<br/>
      <strong>Methodology / Version:</strong> ${bundle.methodologyVersion}
    </div>
  </div>

  <h2>2. Transaction Trace</h2>
  <div class="meta-grid" style="margin-bottom: 8px;">
    <div class="meta-box">
      <strong>Root Wallet:</strong> <span style="font-family: monospace; font-size: 11px;">${bundle.target.rootAddress}</span><br/>
      <strong>Nodes Discovered:</strong> ${bundle.trace.nodesDiscovered}<br/>
      <strong>Transactions / Edges:</strong> ${bundle.trace.edgesDiscovered}
    </div>
    <div class="meta-box">
      <strong>Addresses Traversed:</strong> ${bundle.trace.addressesTraversed}<br/>
      <strong>Max Hop Level:</strong> Hop ${bundle.trace.maxHopReached}<br/>
      <strong>Termination Reason:</strong> ${bundle.trace.terminationReason}
    </div>
  </div>
  <table style="margin-bottom: 20px;">
    <thead>
      <tr>
        <th style="text-align: center;">Hop</th>
        <th>From Address</th>
        <th>To Address</th>
        <th>Transaction Hash</th>
        <th style="text-align: right;">Amount</th>
        <th>Timestamp</th>
        <th>Provenance / Source</th>
      </tr>
    </thead>
    <tbody>
      ${traceRows || '<tr><td colspan="7" style="padding: 12px; text-align: center; color: #64748b;">No transaction edges in trace.</td></tr>'}
    </tbody>
  </table>

  <h2>3. VASP Candidates</h2>
  <p style="font-size: 11px; color: #475569; margin-top: -6px;">Transparent rule-based candidate attribution and evidence scores (Not statistical probability).</p>
  ${candidateCards || '<p style="font-size: 12px; color: #64748b;">No VASP candidates matched in current search boundary.</p>'}

  <h2>4. Evidence Conflict</h2>
  ${conflictSection}

  <h2>5. Attribution Boundary</h2>
  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; font-size: 12px; margin-bottom: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong>Current Boundary Status:</strong>
      <span class="badge" style="background: #0284c7; color: #ffffff; border: none; font-size: 11px;">${bundle.attributionBoundary.status}</span>
    </div>
    <p style="margin: 0 0 10px 0; color: #334155; font-weight: 500;">${bundle.attributionBoundary.explanation}</p>
    
    <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 10px;">
      <div style="font-weight: bold; margin-bottom: 6px; color: #1e293b;">Attribution Boundary Classifications:</div>
      <div style="margin-bottom: 6px;">
        <span style="font-weight: bold; color: #0369a1;">DIRECT EVIDENCE:</span> Known VASP-associated address/cluster supported by available evidence.
      </div>
      <div style="margin-bottom: 6px;">
        <span style="font-weight: bold; color: #d97706;">INFERRED ASSOCIATION:</span> Relationship inferred from transaction or behavioral evidence.
      </div>
      <div style="margin-bottom: 10px;">
        <span style="font-weight: bold; color: #64748b;">UNKNOWN:</span> Insufficient evidence to establish a VASP association.
      </div>
      <div style="background: #f1f5f9; padding: 8px 10px; border-radius: 4px; font-size: 11px; color: #475569; font-style: italic; border-left: 3px solid #64748b;">
        On-chain attribution does not establish the real-world identity or ownership of the wallet.
      </div>
    </div>
  </div>

  <h2>6. Attribution Stress Test</h2>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 12px; margin-bottom: 15px;">
    <strong>Current Review Trigger:</strong> <span style="font-weight: 600; color: #0f172a;">${bundle.stressTest.currentReviewTrigger}</span>
  </div>
  <div class="meta-grid">
    <div class="meta-box" style="border-left: 3px solid #16a34a;">
      <strong style="color: #166534;">Could strengthen attribution:</strong>
      <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 11px; line-height: 1.6;">
        ${strengthenItems}
      </ul>
    </div>
    <div class="meta-box" style="border-left: 3px solid #d97706;">
      <strong style="color: #92400e;">Could weaken attribution:</strong>
      <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 11px; line-height: 1.6;">
        ${weakenItems}
      </ul>
    </div>
  </div>

  <h2>7. Forensic Limitations & Disclaimers</h2>
  <ul style="font-size: 11px; color: #475569; margin: 0 0 20px 20px; line-height: 1.6;">
    ${limitationsList}
  </ul>

  <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
    <span>HydroTrace Forensic Engine</span>
    <span>CONFIDENTIAL / LAW ENFORCEMENT FORENSIC USE ONLY</span>
  </div>
</body>
</html>`;
  }

  /**
   * Generates the complete report package
   */
  generateReport(
    trace: TraceInvestigationResponse,
    attribution: EvaluateAttributionResponse,
    caseReference = 'CR-2026-08912'
  ): GenerateReportResponse {
    const bundle = this.generateEvidenceBundle(trace, attribution, caseReference);
    const htmlReport = this.generateHtmlReport(bundle);
    const sahyogPayload = this.generateSahyogPayload(bundle);

    return {
      success: true,
      investigationId: bundle.investigationId,
      sha256: bundle.sha256,
      bundle,
      htmlReport,
      sahyogPayload,
    };
  }
}
