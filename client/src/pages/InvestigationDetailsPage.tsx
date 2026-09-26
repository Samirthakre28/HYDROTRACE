import React, { useState } from 'react';
import { traceInvestigationApi, evaluateAttributionApi, generateReportApi } from '../services/api';
import {
  TraceInvestigationResponse,
  EvaluateAttributionResponse,
  GenerateReportResponse,
  GraphNode,
  GraphEdge,
  TracePath,
} from '../types';
import { ForensicGraphView } from '../components/ForensicGraphView';
import { PathInspector } from '../components/PathInspector';
import { VaspCandidateScorecard } from '../components/VaspCandidateScorecard';
import {
  Search,
  Shield,
  GitCommit,
  Sliders,
  Loader2,
  AlertTriangle,
  Info,
  Database,
  ShieldCheck,
  FileText,
  Download,
  Send,
  FileCode,
  CheckCircle2,
  Copy,
  Lock,
} from 'lucide-react';

export const InvestigationDetailsPage: React.FC = () => {
  const [targetAddress, setTargetAddress] = useState('TMQUXn3nBsHspLohDi6FFVVSgHbMp3A8GE');
  const [asset, setAsset] = useState<'USDT'>('USDT');
  const [maxHops, setMaxHops] = useState<number>(3);
  const [maxNodes, setMaxNodes] = useState<number>(100);
  const [maxEdges, setMaxEdges] = useState<number>(300);

  // Api State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [traceResult, setTraceResult] = useState<TraceInvestigationResponse | null>(null);
  const [attributionResult, setAttributionResult] = useState<EvaluateAttributionResponse | null>(null);
  const [reportResult, setReportResult] = useState<GenerateReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const LOADING_STAGES = [
    'Validating wallet...',
    'Fetching blockchain data...',
    'Building transaction graph...',
    'Analyzing VASP candidates...',
    'Evaluating evidence...',
    'Preparing investigation...',
  ];
  const [loadingStage, setLoadingStage] = useState<string>(LOADING_STAGES[0]);

  // Inspector selection
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  const handleSelectScenario = (address: string) => {
    setTargetAddress(address);
    setError(null);
  };

  const handleStartTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSelectedNode(null);
    setSelectedEdge(null);
    setAttributionResult(null);

    const cleanAddr = targetAddress.trim();
    if (!cleanAddr || !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(cleanAddr)) {
      setError('Invalid TRON wallet address');
      return;
    }

    setLoading(true);
    let stageIdx = 0;
    setLoadingStage(LOADING_STAGES[0]);
    const stageTimer = setInterval(() => {
      stageIdx = (stageIdx + 1) % LOADING_STAGES.length;
      setLoadingStage(LOADING_STAGES[stageIdx]);
    }, 600);

    try {
      const traceRes = await traceInvestigationApi({
        chain: 'TRON',
        address: cleanAddr,
        asset,
        maxHops,
        maxNodes,
        maxEdges,
      });

      setTraceResult(traceRes);

      if (traceRes.graph.nodes.length > 0) {
        setSelectedNode(traceRes.graph.nodes[0]);
      }

      // Evaluate prototype VASP candidate attribution
      const attrRes = await evaluateAttributionApi({
        investigationId: traceRes.investigationId,
        graph: traceRes.graph,
        paths: traceRes.paths,
      });

      setAttributionResult(attrRes);

      // Generate Step 6 sealed evidence bundle and report
      try {
        setReportLoading(true);
        const repRes = await generateReportApi({
          investigationId: traceRes.investigationId,
          trace: traceRes,
          attribution: attrRes,
          caseReference: 'CR-2026-08912',
        });
        setReportResult(repRes);
      } catch (repErr) {
        console.warn('Report generation notice:', repErr);
      } finally {
        setReportLoading(false);
      }
    } catch (err: any) {
      console.error('Trace / Attribution API Error:', err);
      const msg = err.message || '';
      if (msg.includes('Invalid') || msg.includes('validation') || msg.includes('400')) {
        setError('Invalid TRON wallet address');
      } else if (
        msg.includes('500') ||
        msg.includes('fetch') ||
        msg.includes('network') ||
        msg.includes('unavailable') ||
        msg.includes('timeout') ||
        msg.includes('Failed to fetch')
      ) {
        setError('Blockchain data temporarily unavailable. Please retry.');
      } else {
        setError(msg || 'Blockchain data temporarily unavailable. Please retry.');
      }
    } finally {
      clearInterval(stageTimer);
      setLoading(false);
    }
  };

  const ensureReportLoaded = async (): Promise<GenerateReportResponse | null> => {
    if (reportResult) return reportResult;
    if (!traceResult || !attributionResult) return null;

    setReportLoading(true);
    try {
      const repRes = await generateReportApi({
        investigationId: traceResult.investigationId,
        trace: traceResult,
        attribution: attributionResult,
        caseReference: 'CR-2026-08912',
      });
      setReportResult(repRes);
      return repRes;
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate evidence report bundle.');
      return null;
    } finally {
      setReportLoading(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportHtmlReport = async () => {
    const report = await ensureReportLoaded();
    if (report?.htmlReport) {
      downloadFile(
        report.htmlReport,
        `investigation-report-${report.investigationId}.html`,
        'text/html;charset=utf-8'
      );
    }
  };

  const handleDownloadEvidenceJson = async () => {
    const report = await ensureReportLoaded();
    if (report?.bundle) {
      downloadFile(
        JSON.stringify(report.bundle, null, 2),
        `investigation-evidence-${report.investigationId}.json`,
        'application/json;charset=utf-8'
      );
    }
  };

  const handleExportSahyogPayload = async () => {
    const report = await ensureReportLoaded();
    if (report?.sahyogPayload) {
      downloadFile(
        JSON.stringify(report.sahyogPayload, null, 2),
        `sahyog-disclosure-payload-${report.investigationId}.json`,
        'application/json;charset=utf-8'
      );
    }
  };

  const handleCopyHash = () => {
    if (reportResult?.sha256) {
      navigator.clipboard.writeText(reportResult.sha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const getPathForAddress = (address: string): TracePath | undefined => {
    if (!traceResult) return undefined;
    return traceResult.paths.find(
      (p) => p.address.toLowerCase() === address.toLowerCase()
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
              {traceResult ? `INVESTIGATION ID: ${traceResult.investigationId}` : 'CASE: CR-2026-08912'}
            </span>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
              HYDROTRACE VASP INTELLIGENCE
            </span>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mt-2 flex items-center">
            <GitCommit className="w-5 h-5 mr-2 text-blue-400" />
            HydroTrace — 3-Hop Transaction Path & VASP Candidate Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            HydroTrace — Evidence-Driven Blockchain Intelligence for VASP Attribution
          </p>
        </div>
      </div>

      {/* Tracing Controls Card */}
      <form onSubmit={handleStartTrace} className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">
              Bounded BFS Traversal & VASP Matching Parameters
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            TRON MAINNET ADAPTER
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-slate-300 mb-1">
              TARGET ROOT WALLET ADDRESS <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              placeholder="e.g. TMQUXn3nBsHspLohDi6FFVVSgHbMp3A8GE or TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
              className="w-full bg-[#0B0F19] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
            />
            {/* DEMO SCENARIO PRESETS */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mr-1">DEMO SCENARIOS:</span>
              <button
                type="button"
                onClick={() => handleSelectScenario('TMQUXn3nBsHspLohDi6FFVVSgHbMp3A8GE')}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 transition"
              >
                Scenario A (Attribution Match)
              </button>
              <button
                type="button"
                onClick={() => handleSelectScenario('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              >
                Scenario B (Insufficient Evidence)
              </button>
              <button
                type="button"
                onClick={() => handleSelectScenario('TT7hPkdWMPbkDzzsEDBNzuMn9gceTdgKtJ')}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 transition"
              >
                Scenario C (Evidence Conflict)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">ASSET</label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value as 'USDT')}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="USDT">USDT TRC-20</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">MAXIMUM HOPS</label>
            <select
              value={maxHops}
              onChange={(e) => setMaxHops(Number(e.target.value))}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value={1}>1 Hop (Direct Transfers)</option>
              <option value={2}>2 Hops (Intermediate Transfers)</option>
              <option value={3}>3 Hops (Deep Trace Standard)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">MAXIMUM NODES LIMIT</label>
            <select
              value={maxNodes}
              onChange={(e) => setMaxNodes(Number(e.target.value))}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value={50}>50 Nodes</option>
              <option value={100}>100 Nodes (Standard)</option>
              <option value={250}>250 Nodes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">MAXIMUM EDGES LIMIT</label>
            <select
              value={maxEdges}
              onChange={(e) => setMaxEdges(Number(e.target.value))}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value={100}>100 Edges</option>
              <option value={300}>300 Edges (Standard)</option>
              <option value={500}>500 Edges</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/50 rounded border border-blue-500 shadow-sm transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-200" />
                  {loadingStage}
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 mr-1.5" /> START TRACE & ATTRIBUTE
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Real-time Staged Loading State Banner */}
      {loading && (
        <div className="bg-blue-950/40 border border-blue-800/80 rounded-lg p-4 font-mono text-xs text-blue-200 flex items-center space-x-3 shadow-sm">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
          <div className="space-y-1">
            <div className="font-semibold text-blue-300 uppercase tracking-wide">
              {loadingStage}
            </div>
            <div className="text-[11px] text-blue-400/80">
              Executing bounded blockchain traversal and evaluating VASP candidate registry...
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-950/50 border border-red-800/80 rounded-lg p-4 text-xs font-mono text-red-200 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-300 uppercase">Engine Processing Error</div>
            <div className="mt-1 text-red-200">{error}</div>
          </div>
        </div>
      )}

      {/* Mandatory Investigation Limitation Notices */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2 text-xs text-slate-300 font-mono">
        <div className="flex items-start space-x-2">
          <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>ATTRIBUTION NOTICE:</strong> On-chain evidence does not establish real-world ownership or identity. Observed transaction paths represent on-chain relationships.
          </span>
        </div>
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            <strong>TRAVERSAL SCOPE:</strong> Trace depth is bounded to control API usage and investigation scope.
          </span>
        </div>
      </div>

      {/* Trace Results & Graph View */}
      {traceResult && (
        <div className="space-y-6">
          {/* NO TRANSACTIONS ALERT */}
          {traceResult.statistics.edgesDiscovered === 0 && (
            <div className="bg-amber-950/40 border border-amber-800 rounded-lg p-4 font-mono text-xs text-amber-200 flex items-start space-x-3">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-300 uppercase">TRANSACTION SEARCH NOTICE</div>
                <div className="mt-1 text-slate-200 font-semibold">No confirmed transactions found for this address.</div>
              </div>
            </div>
          )}

          {/* TRACE SUMMARY CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold flex items-center">
                <Database className="w-4 h-4 mr-2 text-emerald-400" />
                TRACE SUMMARY & METRICS
              </h3>
              <span className="text-[11px] font-mono bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-800 uppercase font-semibold">
                TERMINATION: {traceResult.statistics.terminationReason}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-[#0B0F19] p-3 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px]">ROOT ADDRESS</span>
                <div className="text-slate-100 font-semibold truncate mt-1">
                  {traceResult.investigation.rootAddress}
                </div>
              </div>

              <div className="bg-[#0B0F19] p-3 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px]">NETWORK & ASSET</span>
                <div className="text-blue-400 font-semibold mt-1">
                  {traceResult.investigation.chain} ({traceResult.investigation.asset})
                </div>
              </div>

              <div className="bg-[#0B0F19] p-3 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px]">NODES DISCOVERED</span>
                <div className="text-slate-100 font-semibold mt-1">
                  {traceResult.statistics.nodesDiscovered} / {maxNodes} MAX
                </div>
              </div>

              <div className="bg-[#0B0F19] p-3 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px]">TRANSACTIONS / EDGES</span>
                <div className="text-amber-400 font-semibold mt-1">
                  {traceResult.statistics.edgesDiscovered} EDGES (MAX HOP: {traceResult.statistics.maxHopReached})
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL TRANSACTION GRAPH */}
          <ForensicGraphView
            graph={traceResult.graph}
            selectedNodeId={selectedNode?.id || null}
            selectedEdgeId={selectedEdge?.id || null}
            onSelectNode={(node) => {
              setSelectedNode(node);
              setSelectedEdge(null);
            }}
            onSelectEdge={(edge) => {
              setSelectedEdge(edge);
            }}
          />

          {/* PATH INSPECTOR & EDGE INSPECTOR PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <PathInspector
                selectedAddress={selectedNode?.address || null}
                pathData={selectedNode ? getPathForAddress(selectedNode.address) : undefined}
                rootAddress={traceResult.investigation.rootAddress}
              />
            </div>

            {/* Edge Detail Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
              <div className="text-xs font-mono uppercase text-slate-200 border-b border-slate-800 pb-2 mb-3 font-semibold">
                Selected Transaction Edge Detail
              </div>

              {selectedEdge ? (
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400">TRANSACTION HASH</span>
                    <div className="text-blue-300 break-all text-[11px] mt-0.5">{selectedEdge.txHash}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400">AMOUNT</span>
                      <div className="text-amber-400 font-semibold">{selectedEdge.amount} {selectedEdge.asset}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">HOP LEVEL</span>
                      <div className="text-slate-200 font-semibold">HOP {selectedEdge.hop}</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400">SENDER (FROM)</span>
                    <div className="text-slate-200 break-all text-[11px] mt-0.5">{selectedEdge.from}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400">RECIPIENT (TO)</span>
                    <div className="text-slate-200 break-all text-[11px] mt-0.5">{selectedEdge.to}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400">TIMESTAMP</span>
                    <div className="text-slate-400 text-[11px] mt-0.5">{new Date(selectedEdge.timestamp).toLocaleString()}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400">SOURCE PROVIDER</span>
                    <div className="text-emerald-400 text-[11px] mt-0.5">{selectedEdge.source.provider}</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-mono text-center py-8">
                  Click any transaction edge in the graph strip above to inspect raw edge parameters.
                </div>
              )}
            </div>
          </div>

          {/* VASP ATTRIBUTION CANDIDATE SCORECARD */}
          {attributionResult && (
            <VaspCandidateScorecard attributionData={attributionResult} />
          )}

          {/* INVESTIGATION EVIDENCE (STEP 6) */}
          {traceResult && attributionResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-mono uppercase tracking-wider text-slate-100 font-bold">
                      INVESTIGATION EVIDENCE
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Deterministic canonical evidence bundle and exportable forensic artifacts for case documentation.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono bg-blue-950 text-blue-300 px-2.5 py-1 rounded border border-blue-800 flex items-center">
                    <Lock className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                    HASH-SEALED BUNDLE
                  </span>
                </div>
              </div>

              {/* EXPORT ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleExportHtmlReport}
                  disabled={reportLoading}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase px-4 py-3 rounded-md font-semibold transition shadow-md disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>EXPORT INVESTIGATION REPORT</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadEvidenceJson}
                  disabled={reportLoading}
                  className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-mono text-xs uppercase px-4 py-3 rounded-md font-semibold border border-slate-700 transition shadow-md disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>DOWNLOAD EVIDENCE JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportSahyogPayload}
                  disabled={reportLoading}
                  className="flex items-center justify-center space-x-2 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border border-amber-800/80 font-mono text-xs uppercase px-4 py-3 rounded-md font-semibold transition shadow-md disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>EXPORT DISCLOSURE PAYLOAD</span>
                </button>
              </div>

              {/* SHA-256 SEAL CONTAINER */}
              <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center">
                    <Lock className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                    Evidence Bundle Hash
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    disabled={!reportResult}
                    className="text-[11px] font-mono text-slate-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    {copiedHash ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Hash</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="font-mono text-xs">
                  <div className="text-[10px] text-slate-500 uppercase">SHA-256:</div>
                  <div className="text-blue-400 font-mono break-all text-xs tracking-wider bg-slate-950 p-2.5 rounded border border-slate-800/80 mt-1 select-all">
                    {reportResult?.sha256 || (reportLoading ? 'Computing canonical SHA-256 seal...' : 'Ready for export')}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono pt-1">
                  Hash-sealed prototype evidence bundle. The hash provides tamper-evidence for the exported bundle.
                </div>
              </div>

              {/* SAHYOG AND LEGAL DISCLAIMER NOTICE */}
              <div className="bg-slate-950/60 border border-slate-800/60 rounded p-3 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="text-slate-300 font-semibold flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                  SAHYOG-compatible prototype payload
                </div>
                <div>
                  Structured disclosure payload for lawful VASP request workflows. Does not establish real-world identity or ownership.
                </div>
                <div className="text-[10px] text-slate-500 italic pt-1">
                  Prototype notice: Hash seal provides cryptographic integrity across exports. Does not constitute sworn court testimony without forensic custodian verification.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
