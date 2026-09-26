import React from 'react';
import { NormalizedTransaction } from '../types';
import { truncateAddress, formatDate } from '../utils/formatters';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

interface TransactionTableProps {
  transfers: NormalizedTransaction[];
  targetAddress: string;
  chain: string;
  sourceProvider?: string;
  retrievedAt?: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transfers,
  targetAddress,
  chain,
  sourceProvider = 'TronGrid API',
  retrievedAt,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
      {/* Table Header & Provenance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">
              Confirmed Real Blockchain Transfers ({transfers.length})
            </h3>
            <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
              {chain} MAINNET
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Target Address: <span className="text-slate-200">{targetAddress}</span>
          </p>
        </div>

        <div className="text-right font-mono text-[10px] text-slate-400">
          <div>DATA SOURCE: <span className="text-emerald-400">{sourceProvider}</span></div>
          {retrievedAt && <div>RETRIEVED: {new Date(retrievedAt).toLocaleTimeString()}</div>}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="bg-[#0B0F19] text-slate-400 border-b border-slate-800 text-[11px]">
              <th className="py-2.5 px-3">Direction</th>
              <th className="py-2.5 px-3">From</th>
              <th className="py-2.5 px-3">To</th>
              <th className="py-2.5 px-3">Asset</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Tx Hash</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {transfers.map((tx, idx) => {
              const isOut = tx.direction === 'OUT';
              const isSelf = tx.direction === 'SELF';
              const isFromTarget = tx.from.toLowerCase() === targetAddress.toLowerCase();
              const isToTarget = tx.to.toLowerCase() === targetAddress.toLowerCase();

              return (
                <tr key={`${tx.txHash}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                  {/* Direction */}
                  <td className="py-3 px-3">
                    {isOut ? (
                      <span className="inline-flex items-center text-[10px] font-semibold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/60">
                        <ArrowUpRight className="w-3 h-3 mr-1" /> OUT
                      </span>
                    ) : isSelf ? (
                      <span className="inline-flex items-center text-[10px] font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                        <RefreshCw className="w-3 h-3 mr-1" /> SELF
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        <ArrowDownLeft className="w-3 h-3 mr-1" /> IN
                      </span>
                    )}
                  </td>

                  {/* From */}
                  <td className="py-3 px-3">
                    <span className={isFromTarget ? 'text-blue-300 font-semibold' : 'text-slate-300'}>
                      {truncateAddress(tx.from, 6)}
                    </span>
                  </td>

                  {/* To */}
                  <td className="py-3 px-3">
                    <span className={isToTarget ? 'text-blue-300 font-semibold' : 'text-slate-300'}>
                      {truncateAddress(tx.to, 6)}
                    </span>
                  </td>

                  {/* Asset */}
                  <td className="py-3 px-3">
                    <span className="text-amber-400 font-semibold">{tx.asset}</span>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3 text-right font-semibold text-slate-100">
                    {tx.amount}
                  </td>

                  {/* Timestamp */}
                  <td className="py-3 px-3 text-[11px] text-slate-400">
                    {formatDate(tx.timestamp)}
                  </td>

                  {/* Hash */}
                  <td className="py-3 px-3">
                    <a
                      href={`https://tronscan.org/#/transaction/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 hover:underline"
                      title="Inspect raw transaction on TronScan"
                    >
                      {truncateAddress(tx.txHash, 5)}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      <ShieldCheck className="w-3 h-3 mr-1" /> CONFIRMED
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
