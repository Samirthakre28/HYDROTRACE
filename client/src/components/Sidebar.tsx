import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Search, FileCheck, Layers, BookOpen } from 'lucide-react';

export const Sidebar: React.FC = () => {
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
    <aside className="hidden lg:flex w-64 bg-[#0E1424] border-r border-slate-800 flex-col justify-between shrink-0 min-h-[calc(100vh-65px)]">
      <div className="p-4 space-y-6">
        <div className="text-[11px] font-mono tracking-wider text-slate-500 uppercase px-2 font-semibold">
          Core Operations
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-start space-x-3 px-3 py-2.5 rounded text-xs transition-colors ${
                  isActive
                    ? 'bg-blue-950/80 text-blue-200 border border-blue-800/80 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
              <div>
                <div className="font-sans font-medium text-slate-200">{item.label}</div>
                <div className="text-[10px] text-slate-400 font-normal">{item.description}</div>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 pt-4 space-y-2">
          <div className="text-[11px] font-mono tracking-wider text-slate-500 uppercase px-2 font-semibold">
            System Modules
          </div>
          <div className="px-3 py-2 text-xs text-slate-400 flex items-center justify-between bg-slate-900/40 rounded border border-slate-800/60">
            <span className="flex items-center">
              <Layers className="w-3.5 h-3.5 mr-2 text-slate-400" /> API Providers
            </span>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
              MODULAR
            </span>
          </div>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1 bg-[#0B0F19]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300">HydroTrace v1.0.0</span>
          <span className="text-emerald-400">READY</span>
        </div>
        <div className="text-[10px] text-slate-400">
          Evidence-Driven Blockchain Forensics
        </div>
      </div>
    </aside>
  );
};
