import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Shield,
  Server,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Menu,
  X,
  LayoutDashboard,
  PlusCircle,
  Search,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { checkBackendHealth } from '../services/api';
import { HealthStatus } from '../types';

export const Navbar: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      to: '/',
      label: 'Investigation Dashboard',
      icon: LayoutDashboard,
      description: 'Overview of active cases & targets',
    },
    {
      to: '/new',
      label: 'New Investigation',
      icon: PlusCircle,
      description: 'Input target wallet & trace params',
    },
    {
      to: '/investigations',
      label: 'Investigation Details',
      icon: Search,
      description: 'Wallet details & Hop analysis',
    },
    {
      to: '/attribution',
      label: 'Evidence / Attribution',
      icon: FileCheck,
      description: 'VASP evidence scorecards',
    },
  ];

  return (
    <header className="bg-[#0B0F19] border-b border-gray-800 sticky top-0 z-30 w-full">
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
        {/* Brand & Agency Title */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="p-1.5 sm:p-2 bg-blue-950/60 rounded border border-blue-800/60 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold tracking-wider uppercase text-slate-100 truncate">
                HydroTrace
              </span>
              <span className="bg-blue-950 text-blue-300 text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border border-blue-800 hidden xs:inline-block sm:inline-block shrink-0">
                FORENSIC INTELLIGENCE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block truncate">
              HydroTrace — Evidence-Driven Blockchain Intelligence for VASP Attribution
            </p>
          </div>
        </div>

        {/* Operational Status & Backend Health Indicator */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-900 border border-slate-800 rounded">
            <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
            <div className="text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400 hidden sm:inline">Engine API:</span>
                {loading && !health ? (
                  <span className="text-slate-500 font-mono text-[10px] sm:text-[11px]">Connecting...</span>
                ) : health?.status === 'ok' ? (
                  <span className="flex items-center text-emerald-400 font-mono font-medium text-[10px] sm:text-[11px]">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 shrink-0" /> ONLINE
                  </span>
                ) : (
                  <span className="flex items-center text-red-400 font-mono font-medium text-[10px] sm:text-[11px]">
                    <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 shrink-0" /> UNREACHABLE
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={refreshHealth}
              disabled={loading}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors shrink-0"
              title="Refresh backend status"
              aria-label="Refresh backend status"
            >
              <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden lg:block" />

          <div className="text-right hidden lg:block">
            <div className="text-xs font-medium text-slate-200">Cyber Crime & Intelligence Unit</div>
            <div className="text-[10px] font-mono text-slate-400">SESSION: LA-7829-PROTOTYPE</div>
          </div>

          {/* Mobile Menu Button - visible on small & medium screens (< lg) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            className="p-1.5 sm:p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 lg:hidden flex items-center justify-center shrink-0"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-blue-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="lg:hidden bg-[#0E1424] border-t border-slate-800 shadow-2xl max-h-[calc(100vh-70px)] overflow-y-auto"
        >
          <div className="p-4 space-y-4">
            <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase px-2 font-semibold flex items-center justify-between">
              <span>Navigation Menu</span>
              <span className="text-[10px] text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/80">
                CORE OPERATIONS
              </span>
            </div>

            <nav className="space-y-1.5" aria-label="Mobile Navigation Menu">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-start space-x-3 px-3 py-2.5 rounded text-xs transition-colors ${
                      isActive
                        ? 'bg-blue-950/80 text-blue-200 border border-blue-800/80 font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-medium text-slate-200">{item.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{item.description}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 mt-1 text-slate-600 shrink-0" />
                </NavLink>
              ))}
            </nav>

            {/* Operational session details in mobile drawer */}
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <div className="text-[11px] font-mono tracking-wider text-slate-500 uppercase px-2 font-semibold">
                Operational Context
              </div>
              <div className="px-3 py-2 text-xs text-slate-300 bg-slate-900/60 rounded border border-slate-800/80 space-y-1">
                <div className="font-medium text-slate-200">Cyber Crime & Intelligence Unit</div>
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>SESSION: LA-7829-PROTOTYPE</span>
                  <span className="text-emerald-400">ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Footer metadata in mobile drawer */}
            <div className="p-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1 bg-[#0B0F19] rounded">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">HydroTrace v1.0.0</span>
                <span className="text-emerald-400">READY</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Evidence-Driven Blockchain Forensics
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
