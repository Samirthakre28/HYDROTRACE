import React from 'react';
import {
  EvaluateAttributionResponse,
  VaspCandidate,
  ScoreFactor,
  TracePathStep,
  EvidenceSource,
} from '../types';
import { truncateAddress, formatDate } from '../utils/formatters';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Info,
  Layers,
  Scale,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';

interface VaspCandidateScorecardProps {
  attributionData: EvaluateAttributionResponse;
}

export const VaspCandidateScorecard: React.FC<VaspCandidateScorecardProps> = ({
  attributionData,
}) => {
  const { candidates, attributionBoundary, source, hasConflict, stressTest } = attributionData;

  return (
    <div className="space-y-6">
      {/* 1. VASP CANDIDATES SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-mono uppercase tracking-wider text-slate-100 font-semibold">
                VASP Candidates
              </h3>
            </div>
            <p className="text-xs text-amber-400 font-mono mt-1 font-medium">
              Candidate Attribution — Analyst Review Required
            </p>
          </div>

          <div className="text-right text-[10px] font-mono text-slate-400">
            <div>DATASET: <span className="text-slate-200">{source.dataset}</span></div>
            <div>EVALUATED AT: {new Date(source.generatedAt).toLocaleTimeString()}</div>
          </div>
        </div>

        {candidates.length > 0 ? (
          <div className="space-y-5">
            {candidates.map((candidate: VaspCandidate, idx: number) => (
              <div
                key={`${candidate.matchedAddress}-${idx}`}
                className="bg-[#0B0F19] border border-slate-800 hover:border-slate-700 rounded-lg p-5 space-y-4 transition-colors"
              >
                {/* Top Row: Entity & Evidence Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-950/80 border border-blue-800 rounded">
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-bold text-slate-100">{candidate.entityName}</span>
                        <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 uppercase">
                          {candidate.walletRole}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          HOP {candidate.hop}
                        </span>
                        {candidate.hasConflict && (
                          <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800 uppercase font-semibold">
                            CONFLICT DETECTED
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1 break-all">
                        Matched Address: <span className="text-slate-200 font-semibold">{candidate.matchedAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Evidence Score Display */}
                  <div className="text-right bg-slate-900 px-4 py-2 rounded border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">EVIDENCE SCORE</div>
                    <div className="text-lg font-bold font-mono text-emerald-400">
                      {candidate.confidenceScore} / 100
                    </div>
                  </div>
                </div>

                {/* Score Breakdown & Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="bg-slate-900/60 p-3.5 rounded border border-slate-800 space-y-2">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Rule-Based Evidence Score Breakdown</div>
                    <div className="space-y-1 text-slate-300">
                      {candidate.scoreBreakdown.map((item: ScoreFactor, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center text-slate-300">
                            {item.points >= 0 ? (
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                            )}
                            {item.factor}
                          </span>
                          <span className={item.points >= 0 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                            {item.points >= 0 ? `+${item.points}` : item.points}
                          </span>
                        </div>
                      ))}
                      <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-xs text-slate-100">
                        <span>Evidence Score:</span>
                        <span className="text-emerald-400">{candidate.confidenceScore}/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-3.5 rounded border border-slate-800 space-y-2">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Intelligence Provenance</div>
                    <div className="text-[11px] text-slate-300 leading-relaxed">
                      <div><strong className="text-slate-400">Primary Source Type:</strong> <span className="text-blue-300">{candidate.evidence.sourceType}</span></div>
                      <div><strong className="text-slate-400">Reference:</strong> <span className="text-slate-200">{candidate.evidence.sourceReference}</span></div>
                      <div className="mt-1.5 text-slate-400 text-[10px] border-t border-slate-800/80 pt-1.5">
                        {candidate.explanation}
                      </div>
                    </div>
                  </div>
                </div>

                {/* WHY THIS CANDIDATE? (EVIDENCE CHAIN) */}
                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="text-[11px] text-blue-300 font-semibold uppercase flex items-center">
                    <ChevronRight className="w-4 h-4 mr-1 text-blue-400" />
                    WHY THIS CANDIDATE? (OBSERVED ON-CHAIN EVIDENCE CHAIN)
                  </div>

                  {candidate.evidence.path && candidate.evidence.path.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      {candidate.evidence.path.map((step: TracePathStep, stepIdx: number) => (
                        <React.Fragment key={stepIdx}>
                          <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-slate-200">
                            <div className="text-[9px] text-slate-400 font-bold">
                              {stepIdx === 0 ? 'TARGET ROOT' : `HOP ${stepIdx}`}
                            </div>
                            <div>{truncateAddress(step.address, 6)}</div>
                          </div>
                          {stepIdx < candidate.evidence.path!.length - 1 && (
                            <div className="flex items-center text-slate-500 text-[10px]">
                              <ArrowRight className="w-3.5 h-3.5 text-blue-400 mx-1" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400">
                      Direct single-hop on-chain deposit transition from target wallet address.
                    </div>
                  )}
                </div>

                {/* 2. EVIDENCE COMPARISON PER CANDIDATE */}
                <div className="border-t border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-300 font-semibold uppercase flex items-center">
                      <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                      Evidence Comparison ({candidate.evidenceSources.length} Sources Recorded)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {candidate.evidenceSources.map((sourceItem: EvidenceSource, sIdx: number) => (
                      <div
                        key={sIdx}
                        className="bg-slate-900/80 border border-slate-800 rounded p-3 text-xs font-mono space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-200">
                            Source {sIdx + 1}: {sourceItem.sourceName}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                              sourceItem.reliability === 'HIGH'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            Reliability: {sourceItem.reliability}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Attributed VASP: <strong className="text-blue-300">{sourceItem.associatedEntity || candidate.entityName}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          Ref: {sourceItem.reference}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0B0F19] p-8 rounded border border-slate-800 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-amber-500/80 mx-auto" />
            <div className="text-sm font-bold text-amber-300 font-mono uppercase tracking-wider">
              Insufficient Evidence
            </div>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Insufficient evidence to establish a VASP association. None of the on-chain addresses discovered within the search depth matched verified records in the current HydroTrace Curated VASP Intelligence Dataset.
            </p>
          </div>
        )}
      </div>

      {/* 3. EVIDENCE CONFLICT SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs uppercase tracking-wider text-slate-200 font-semibold">
              Evidence Conflict Status
            </h3>
          </div>
          <span
            className={`text-[10px] px-2.5 py-0.5 rounded font-semibold border ${
              hasConflict
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}
          >
            {hasConflict ? 'EVIDENCE CONFLICT DETECTED' : 'NO CONFLICT DETECTED'}
          </span>
        </div>

        {hasConflict ? (
          <div className="space-y-4">
            <div className="bg-amber-950/40 border border-amber-800/80 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Evidence Conflict Detected — Analyst Review Required</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                Multiple intelligence sources associate the same on-chain address with different VASP entities. A conflict penalty has been applied to the candidate evidence score. Human analyst review is required before treating attribution as reliable.
              </p>

              {/* Show conflicting details for each candidate with conflict */}
              {candidates
                .filter((c: VaspCandidate) => c.hasConflict)
                .map((conflictedCand: VaspCandidate, cIdx: number) => (
                  <div key={cIdx} className="bg-[#0B0F19] border border-amber-800/60 rounded p-4 space-y-3">
                    <div className="text-xs text-slate-300">
                      Address: <span className="text-amber-200 font-semibold break-all">{conflictedCand.matchedAddress}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {conflictedCand.conflictDetails?.sources.map((src, sIdx: number) => (
                        <div key={sIdx} className="bg-slate-900 p-3 rounded border border-slate-800 space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Source {sIdx + 1}</div>
                          <div>VASP: <strong className="text-amber-300">{src.vasp}</strong></div>
                          <div>Type: <span className="text-slate-300">{src.sourceType}</span></div>
                          <div>Reliability: <span className="text-slate-300">{src.reliability}</span></div>
                          <div className="text-[10px] text-slate-500 truncate">Ref: {src.reference}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-amber-400 font-bold uppercase tracking-wider">
                        ANALYST REVIEW REQUIRED
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#0B0F19] p-4 rounded border border-slate-800 flex items-start space-x-3 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-emerald-300 block">No Evidence Conflict Detected</strong>
              <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                All corroborating intelligence sources for the identified candidates associate the respective blockchain addresses with the same VASP entities without divergent custody claims.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. ATTRIBUTION BOUNDARY SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs uppercase tracking-wider text-slate-200 font-semibold flex items-center">
            <FileCheck className="w-4 h-4 mr-2 text-blue-400" />
            ATTRIBUTION BOUNDARY
          </h3>

          <span
            className={`text-[11px] px-2.5 py-0.5 rounded font-semibold border ${
              attributionBoundary.status === 'DIRECT_EVIDENCE'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}
          >
            {attributionBoundary.status}
          </span>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed font-sans">
          <p>{attributionBoundary.explanation}</p>
          <p className="text-slate-400 text-[11px] mt-1 font-mono">{attributionBoundary.evidenceSummary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
          <div
            className={`p-3 rounded border ${
              attributionBoundary.status === 'DIRECT_EVIDENCE'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <strong className="block text-slate-200 mb-0.5">DIRECT EVIDENCE</strong>
            Known VASP-associated address/cluster supported by strong evidence.
          </div>

          <div className="p-3 rounded border bg-slate-950/40 border-slate-800 text-slate-500">
            <strong className="block text-slate-400 mb-0.5">INFERRED ASSOCIATION</strong>
            Relationship inferred from transaction/behavioral evidence.
          </div>

          <div
            className={`p-3 rounded border ${
              attributionBoundary.status === 'INSUFFICIENT_EVIDENCE'
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <strong className="block text-slate-200 mb-0.5">UNKNOWN</strong>
            Insufficient evidence to establish a VASP association.
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2 mt-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>MANDATORY FORENSIC DISCLAIMER:</strong> On-chain attribution does not establish the real-world identity or ownership of the wallet.
          </span>
        </div>
      </div>

      {/* 5. ATTRIBUTION STRESS TEST SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs uppercase tracking-wider text-slate-200 font-semibold flex items-center">
            <Scale className="w-4 h-4 mr-2 text-blue-400" />
            ATTRIBUTION STRESS TEST
          </h3>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            EVIDENTIARY SENSITIVITY ANALYSIS
          </span>
        </div>

        {/* Current Review Trigger */}
        <div className="p-3 rounded border bg-slate-950 border-slate-800 text-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
            Current Review Trigger
          </span>
          <p className="text-slate-200 font-sans leading-relaxed">
            {stressTest.currentReviewTrigger}
          </p>
        </div>

        {/* Strengthen vs Weaken Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Strengthen */}
          <div className="bg-[#0B0F19] p-4 rounded border border-emerald-900/60 space-y-2.5">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase">
              <TrendingUp className="w-4 h-4" />
              <span>Evidence that could STRENGTHEN attribution</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-300 font-sans">
              {stressTest.strengthenEvidence.map((item: string, i: number) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold shrink-0 mt-0.5">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaken */}
          <div className="bg-[#0B0F19] p-4 rounded border border-amber-900/60 space-y-2.5">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase">
              <TrendingDown className="w-4 h-4" />
              <span>Evidence that could WEAKEN attribution</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-300 font-sans">
              {stressTest.weakenEvidence.map((item: string, i: number) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-amber-400 font-bold shrink-0 mt-0.5">&minus;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-sans">
          Stress test criteria model evidentiary volatility under dynamic multi-jurisdictional intelligence updates.
        </div>
      </div>
    </div>
  );
};
