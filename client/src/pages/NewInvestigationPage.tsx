import React, { useState } from 'react';
import { PlusCircle, Search, Shield, Info, ArrowRight, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { fetchTronAddressTransfers } from '../services/api';
import { AddressTransfersResponse } from '../types';
import { TransactionTable } from '../components/TransactionTable';

export const NewInvestigationPage: React.FC = () => {
  const [caseReference, setCaseReference] = useState('CR-2026-08912');
  const [targetWallet, setTargetWallet] = useState('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
  const [blockchain, setBlockchain] = useState('TRON');
  const [assetFilter, setAssetFilter] = useState<'USDT' | 'ALL'>('USDT');
  const [maxTransactions, setMaxTransactions] = useState<number>(25);

  // Real API state management
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transferData, setTransferData] = useState<AddressTransfersResponse | null>(null);

  const handleFetchData = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTransferData(null);

    if (!targetWallet.trim()) {
      setError('Please provide a target wallet address.');
      return;
    }

    if (blockchain === 'TRON') {
      setLoading(true);
      try {
        const result = await fetchTronAddressTransfers(
          targetWallet.trim(),
          maxTransactions,
          assetFilter
        );
        setTransferData(result);
      } catch (err: any) {
        console.error('TRON Fetch Error:', err);
        setError(err.message || 'Failed to retrieve TRON blockchain transactions.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center">
          <PlusCircle className="w-5 h-5 mr-2 text-blue-400" />
          Real Blockchain Data Retrieval & Investigation Setup
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Retrieve live, verified on-chain transfers directly from TRON network APIs without identity assumptions or synthetic attributions.
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleFetchData} className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-6">
        {/* Case Metadata */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center font-semibold">
            <Shield className="w-4 h-4 mr-2 text-slate-400" />
            1. Investigation Docket & Network Selection
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                CASE REFERENCE NUMBER <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={caseReference}
                onChange={(e) => setCaseReference(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                BLOCKCHAIN NETWORK <span className="text-red-400">*</span>
              </label>
              <select
                value={blockchain}
                onChange={(e) => {
                  setBlockchain(e.target.value);
                  setError(null);
                  setTransferData(null);
                }}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="TRON">TRON (TRX / TRC-20 Mainnet)</option>
                <option value="ETHEREUM">Ethereum (ETH / ERC-20) [Provider Modular Framework]</option>
                <option value="BITCOIN">Bitcoin (BTC) [Provider Modular Framework]</option>
              </select>
            </div>
          </div>
        </div>

        {/* TRON Specific Options */}
        {blockchain === 'TRON' ? (
          <div className="space-y-4 bg-slate-950/60 p-4 rounded border border-slate-800">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 border-b border-slate-800/80 pb-2 flex items-center font-semibold">
              <Search className="w-4 h-4 mr-2 text-blue-400" />
              2. TRON Target Wallet & Filter Parameters
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                TRON WALLET ADDRESS <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={targetWallet}
                onChange={(e) => setTargetWallet(e.target.value)}
                placeholder="e.g. TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t or T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb"
                className="w-full bg-[#0B0F19] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Must be a valid Base58Check TRON address starting with &apos;T&apos; (34 characters).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  ASSET SELECTION
                </label>
                <select
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value as 'USDT' | 'ALL')}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="USDT">USDT (Tether TRC-20 Only)</option>
                  <option value="ALL">All TRC-20 Tokens</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  MAXIMUM INITIAL TRANSACTIONS
                </label>
                <select
                  value={maxTransactions}
                  onChange={(e) => setMaxTransactions(Number(e.target.value))}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value={25}>25 Transactions</option>
                  <option value={50}>50 Transactions</option>
                  <option value={100}>100 Transactions</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-950/60 rounded border border-slate-800 text-xs text-slate-400 font-mono">
            Provider architecture ready. Selected blockchain provider adapter will be loaded when requested.
          </div>
        )}

        {/* Legal Reminder */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>INVESTIGATION NOTICE:</strong> Blockchain data retrieved demonstrates raw on-chain transaction flows. It does not establish real-world identity or automatically attribute VASP labels without verified reference databases.
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/50 rounded border border-blue-500 shadow-sm transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-200" />
                Fetching Blockchain Data...
              </>
            ) : (
              <>
                Fetch Blockchain Data <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message Display */}
      {error && (
        <div className="bg-red-950/50 border border-red-800/80 rounded-lg p-4 text-xs font-mono text-red-200 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-300 uppercase">Provider Error / Request Failed</div>
            <div className="mt-1 text-red-200">{error}</div>
          </div>
        </div>
      )}

      {/* Transaction Table Results */}
      {transferData && (
        <div>
          {transferData.transfers.length > 0 ? (
            <TransactionTable
              transfers={transferData.transfers}
              targetAddress={transferData.address}
              chain={transferData.chain}
              sourceProvider={transferData.source.provider}
              retrievedAt={transferData.source.retrievedAt}
            />
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-8 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-200">
                No Transactions Found For Address
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No {assetFilter === 'USDT' ? 'USDT TRC-20' : 'TRC-20'} transfer events were recorded for address <code className="text-slate-200">{transferData.address}</code> within the requested scope.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
