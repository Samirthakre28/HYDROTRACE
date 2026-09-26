import React, { useEffect, useState } from 'react';
import { Shield, Server, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { checkBackendHealth } from '../services/api';
import { HealthStatus } from '../types';

export const Navbar: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshHealth = async () => {
    setLoading(true);
    const status = await checkBackendHealth();
    setHealth(status);
    setLoading(false);
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#0B0F19] border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Agency Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-950/60 rounded border border-blue-800/60 flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-semibold tracking-wider uppercase text-slate-100">
              HydroTrace
            </h1>
            <span className="bg-blue-950 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-800">
              FORENSIC INTELLIGENCE
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            HydroTrace — Evidence-Driven Blockchain Intelligence for VASP Attribution
          </p>
        </div>
      </div>

      {/* Operational Status & Backend Health Indicator */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded">
          <Server className="w-4 h-4 text-slate-400" />
          <div className="text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Engine API:</span>
              {loading && !health ? (
                <span className="text-slate-500 font-mono text-[11px]">Connecting...</span>
              ) : health?.status === 'ok' ? (
                <span className="flex items-center text-emerald-400 font-mono font-medium text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ONLINE
                </span>
              ) : (
                <span className="flex items-center text-red-400 font-mono font-medium text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> UNREACHABLE
                </span>
              )}
            </div>
          </div>
          <button
            onClick={refreshHealth}
            disabled={loading}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh backend status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        <div className="text-right hidden sm:block">
          <div className="text-xs font-medium text-slate-200">Cyber Crime & Intelligence Unit</div>
          <div className="text-[10px] font-mono text-slate-400">SESSION: LA-7829-PROTOTYPE</div>
        </div>
      </div>
    </header>
  );
};
