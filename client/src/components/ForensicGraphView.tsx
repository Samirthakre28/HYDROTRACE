import React from 'react';
import { GraphNode, GraphEdge, GraphData } from '../types';
import { truncateAddress, formatDate } from '../utils/formatters';
import { GitCommit, ArrowRight } from 'lucide-react';

interface ForensicGraphViewProps {
  graph: GraphData;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (node: GraphNode) => void;
  onSelectEdge: (edge: GraphEdge) => void;
}

export const ForensicGraphView: React.FC<ForensicGraphViewProps> = ({
  graph,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
}) => {
  const maxHop = Math.max(...graph.nodes.map((n: GraphNode) => n.hop), 0);
  const hopLevels = Array.from({ length: maxHop + 1 }, (_, i) => i);

  const getNodesForHop = (hop: number): GraphNode[] => {
    return graph.nodes.filter((n: GraphNode) => n.hop === hop);
  };

  const getIncomingEdgeCount = (address: string): number => {
    return graph.edges.filter((e: GraphEdge) => e.to.toLowerCase() === address.toLowerCase()).length;
  };

  const getOutgoingEdgeCount = (address: string): number => {
    return graph.edges.filter((e: GraphEdge) => e.from.toLowerCase() === address.toLowerCase()).length;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <GitCommit className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">
            Bounded Directed Transaction Graph ({graph.nodes.length} Nodes, {graph.edges.length} Edges)
          </h3>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" /> ROOT WALLET
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-400 mr-1.5" /> HOP NODE
          </span>
        </div>
      </div>

      {/* Columns per Hop Level */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto min-h-[300px]">
        {hopLevels.map((hop) => {
          const nodesInHop = getNodesForHop(hop);
          const isRootHop = hop === 0;

          return (
            <div
              key={hop}
              className={`p-3 rounded border flex flex-col space-y-3 ${
                isRootHop
                  ? 'bg-amber-950/20 border-amber-800/50'
                  : 'bg-[#0B0F19]/80 border-slate-800'
              }`}
            >
              {/* Hop Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] font-mono">
                <span className={`font-semibold ${isRootHop ? 'text-amber-300' : 'text-slate-300'}`}>
                  {isRootHop ? 'HOP 0 (ROOT)' : `HOP ${hop}`}
                </span>
                <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
                  {nodesInHop.length} {nodesInHop.length === 1 ? 'node' : 'nodes'}
                </span>
              </div>

              {/* Node Cards */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
                {nodesInHop.map((node: GraphNode) => {
                  const isSelected = selectedNodeId === node.id;
                  const isRoot = node.hop === 0;
                  const inCount = getIncomingEdgeCount(node.address);
                  const outCount = getOutgoingEdgeCount(node.address);

                  return (
                    <div
                      key={node.id}
                      onClick={() => onSelectNode(node)}
                      className={`p-3 rounded border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-950/90 border-blue-500 shadow-md ring-1 ring-blue-500'
                          : isRoot
                          ? 'bg-amber-950/40 border-amber-700/80 hover:border-amber-500'
                          : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                            isRoot
                              ? 'bg-amber-900 text-amber-200 border border-amber-700'
                              : 'bg-slate-800 text-blue-300 border border-slate-700'
                          }`}
                        >
                          {isRoot ? 'TARGET ROOT' : `HOP ${node.hop}`}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {inCount} IN / {outCount} OUT
                        </span>
                      </div>

                      <div className="font-mono text-xs text-slate-100 font-semibold break-all">
                        {truncateAddress(node.address, 7)}
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                        {node.address}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Edges Inspector Strip */}
      <div className="border-t border-slate-800 pt-3">
        <div className="text-[11px] font-mono text-slate-400 mb-2 font-semibold uppercase">
          Observed Graph Edges / Transactions ({graph.edges.length})
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
          {graph.edges.map((edge: GraphEdge) => {
            const isSelected = selectedEdgeId === edge.id;
            return (
              <button
                key={edge.id}
                onClick={() => onSelectEdge(edge)}
                className={`p-2.5 rounded border text-left font-mono shrink-0 w-64 transition-colors ${
                  isSelected
                    ? 'bg-blue-950 border-blue-500 text-blue-100'
                    : 'bg-[#0B0F19] hover:bg-slate-800/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-amber-400 font-semibold">{edge.amount} {edge.asset}</span>
                  <span className="text-slate-500">HOP {edge.hop}</span>
                </div>
                <div className="text-[11px] text-slate-200 font-semibold flex items-center truncate">
                  {truncateAddress(edge.from, 4)} <ArrowRight className="w-3 h-3 mx-1 shrink-0 text-slate-500" /> {truncateAddress(edge.to, 4)}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-1">
                  TX: {truncateAddress(edge.txHash, 6)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
