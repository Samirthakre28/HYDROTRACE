import React, { useEffect, useState } from 'react';
import { checkBackendHealth } from '../services/api';
import { HealthStatus } from '../types';
import { Shield, Server, Database, Activity, FileText, ArrowRight, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadHealth() {
      setLoading(true);
      const res = await checkBackendHealth();
      setHealth(res);
      setLoading(false);
    }
    loadHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-400" />
            HydroTrace — Investigation Dashboard & System Health
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            HydroTrace — Evidence-Driven Blockchain Intelligence for VASP Attribution
          </p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded border border-blue-500 shadow-sm transition-colors"
        >
          <Search className="w-3.5 h-3.5 mr-1.5" /> Start New Investigation
        </Link>
      </div>

      {/* Backend Connection & System Status Confirmation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Backend Integration & Engine Health (GET /api/health)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            Node.js Express Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Box */}
          <div className="bg-[#0B0F19] p-3.5 rounded border border-slate-800">
            <div className="text-[11px] text-slate-400 font-mono">REST API STATUS</div>
            <div className="mt-1.5 flex items-center">
              {loading ? (
                <span className="text-xs font-mono text-amber-400">CONNECTING...</span>
              ) : health?.status === 'ok' ? (
                <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1.5" /> ONLINE (200 OK)
                </span>
              ) : (
                <span className="text-xs font-mono font-semibold text-red-400 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5" /> DISCONNECTED
                </span>
              )}
            </div>
          </div>

          {/* Service Name */}
          <div className="bg-[#0B0F19] p-3.5 rounded border border-slate-800">
            <div className="text-[11px] text-slate-400 font-mono">SERVICE IDENTIFIER</div>
            <div className="mt-1.5 text-xs font-mono text-slate-200 truncate">
              {loading ? '---' : health?.service || 'HydroTrace'}
            </div>
          </div>

          {/* Database Connection */}
          <div className="bg-[#0B0F19] p-3.5 rounded border border-slate-800">
            <div className="text-[11px] text-slate-400 font-mono">MONGODB CONNECTION</div>
            <div className="mt-1.5 text-xs font-mono flex items-center text-slate-300">
              <Database className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              {loading
                ? '---'
                : health?.database === 'connected'
                ? 'CONNECTED'
                : 'READY / CONFIGURED'}
            </div>
          </div>

          {/* Response Timestamp */}
          <div className="bg-[#0B0F19] p-3.5 rounded border border-slate-800">
            <div className="text-[11px] text-slate-400 font-mono">LAST HEARTBEAT</div>
            <div className="mt-1.5 text-[11px] font-mono text-slate-400 truncate">
              {loading ? '---' : health?.timestamp || 'N/A'}
            </div>
          </div>
        </div>

        {/* Connection Payload Verification */}
        {health && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 mb-1">Raw API JSON Payload from Express backend:</div>
            <pre className="bg-[#060810] p-3 rounded text-[11px] font-mono text-emerald-400 border border-slate-800 overflow-x-auto">
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Forensic System Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 border border-slate-800 rounded p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>CORE OBJECTIVE</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-sm font-medium text-slate-200 mb-1">VASP Path Attribution</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Traces multi-hop transaction paths from unknown target wallets to registered Virtual Asset Service Providers with deterministic evidence scoring.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>EVIDENCE SCRUTINY</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-medium text-slate-200 mb-1">Strict Proof Standard</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Differentiates verified on-chain deposit data, heuristic cluster association, and unverified speculative links.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>API ARCHITECTURE</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-medium text-slate-200 mb-1">Modular Blockchain Adapters</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pluggable provider architecture allowing seamless integration of commercial and open-source blockchain indexers.
          </p>
        </div>
      </div>

      {/* Forensic Workflow & Pages Navigation Quicklinks */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 font-mono uppercase tracking-wider">
          Forensic Workflow Navigation Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/new"
            className="p-4 bg-[#0B0F19] hover:bg-slate-800/80 border border-slate-800 rounded transition-colors group"
          >
            <div className="text-xs font-semibold text-blue-400 font-mono mb-1 group-hover:text-blue-300">
              01. NEW INVESTIGATION &rarr;
            </div>
            <div className="text-xs font-medium text-slate-200">Initialize Target Tracing</div>
            <div className="text-[11px] text-slate-400 mt-1">Input wallet address, network selection & hop depth parameters.</div>
          </Link>

          <Link
            to="/investigations"
            className="p-4 bg-[#0B0F19] hover:bg-slate-800/80 border border-slate-800 rounded transition-colors group"
          >
            <div className="text-xs font-semibold text-blue-400 font-mono mb-1 group-hover:text-blue-300">
              02. INVESTIGATION DETAILS &rarr;
            </div>
            <div className="text-xs font-medium text-slate-200">Wallet & Hop Analysis</div>
            <div className="text-[11px] text-slate-400 mt-1">Inspect target metadata, transaction flow & nearest VASP nodes.</div>
          </Link>

          <Link
            to="/attribution"
            className="p-4 bg-[#0B0F19] hover:bg-slate-800/80 border border-slate-800 rounded transition-colors group"
          >
            <div className="text-xs font-semibold text-blue-400 font-mono mb-1 group-hover:text-blue-300">
              03. EVIDENCE / ATTRIBUTION &rarr;
            </div>
            <div className="text-xs font-medium text-slate-200">VASP Evidence Scorecard</div>
            <div className="text-[11px] text-slate-400 mt-1">Review verifiable evidence vs inferred links & attribution report.</div>
          </Link>
        </div>
      </div>
    </div>
  );
};
