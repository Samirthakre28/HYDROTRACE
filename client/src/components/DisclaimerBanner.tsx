import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-950/40 border-b border-amber-800/60 px-4 py-2 text-xs text-amber-200/90 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="font-semibold text-amber-300">LAW ENFORCEMENT INVESTIGATION NOTICE:</strong> This system provides evidence-backed VASP attribution assistance only. Blockchain wallet addresses, transaction clusters, or exchange deposits do not constitute proof of real-world individual identity.
        </span>
      </div>
      <span className="font-mono text-[10px] bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50 hidden md:inline-block">
        RESTRICTED FORENSIC USE
      </span>
    </div>
  );
};
