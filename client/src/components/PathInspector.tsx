import React from 'react';
import { TracePath, TracePathStep } from '../types';
import { truncateAddress, formatDate } from '../utils/formatters';
import { GitCommit, ArrowDown, ExternalLink } from 'lucide-react';

interface PathInspectorProps {
  selectedAddress: string | null;
  pathData: TracePath | undefined;
  rootAddress: string;
}

export const PathInspector: React.FC<PathInspectorProps> = ({
  selectedAddress,
  pathData,
  rootAddress,
}) => {
  if (!selectedAddress) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 text-center space-y-2">
        <GitCommit className="w-8 h-8 text-slate-500 mx-auto" />
        <div className="text-xs font-semibold text-slate-200 uppercase font-mono">
          Observed Transaction Path Inspector
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Click any wallet node in the transaction graph to inspect the exact step-by-step transaction path from the target root address.
        </p>
      </div>
    );
  }

  const steps: TracePathStep[] = pathData?.path || [{ address: rootAddress, txHash: 'ROOT' }];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold flex items-center">
            <GitCommit className="w-4 h-4 mr-2 text-blue-400" />
            Observed Transaction Path Inspector
          </h3>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Target Node: <span className="text-blue-300 font-semibold">{selectedAddress}</span> (Hop {pathData?.hop ?? 0})
          </p>
        </div>
        <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
          {steps.length - 1} TRANSITIONS OBSERVED
        </span>
      </div>

      {/* Path Step-by-Step Visualization */}
      <div className="space-y-3 font-mono text-xs">
        {steps.map((step: TracePathStep, idx: number) => {
          const isRoot = idx === 0;
          const isFinalTarget = idx === steps.length - 1;

          return (
            <div key={`${step.address}-${idx}`} className="space-y-2">
              {/* Step Node Card */}
              <div
                className={`p-3 rounded border flex items-center justify-between ${
                  isRoot
                    ? 'bg-amber-950/40 border-amber-700/80 text-amber-200'
                    : isFinalTarget
                    ? 'bg-blue-950/80 border-blue-600 text-blue-100 font-semibold'
                    : 'bg-[#0B0F19] border-slate-800 text-slate-200'
                }`}
              >
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">
                    {isRoot ? 'STEP 0 (TARGET ROOT)' : `STEP ${idx} (HOP ${idx})`}
                  </div>
                  <div className="text-xs font-mono break-all mt-0.5">
                    {step.address}
                  </div>
                </div>

                {step.txHash !== 'ROOT' && (
                  <a
                    href={`https://tronscan.org/#/transaction/${step.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-slate-800 rounded text-blue-400 hover:text-blue-300 shrink-0 ml-2"
                    title="View Raw Transaction on TronScan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Arrow Transition Indicator (if not last step) */}
              {!isFinalTarget && (
                <div className="flex items-center justify-center space-x-2 py-1 bg-slate-950/60 border border-dashed border-slate-800 rounded px-3 text-[11px] text-slate-400">
                  <ArrowDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>
                    TX: <code className="text-slate-200">{truncateAddress(steps[idx + 1].txHash, 6)}</code>
                  </span>
                  {steps[idx + 1].amount && (
                    <span className="text-amber-400 font-semibold">
                      ({steps[idx + 1].amount} USDT)
                    </span>
                  )}
                  {steps[idx + 1].timestamp && (
                    <span className="text-slate-500">
                      [{formatDate(steps[idx + 1].timestamp!)}]
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
