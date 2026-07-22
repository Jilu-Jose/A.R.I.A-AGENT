import React, { useState } from 'react';
import { Network, Play, Search, ZoomIn, ZoomOut, Maximize, FileText } from 'lucide-react';
import { api } from '../../api';

export default function CitationNetwork() {
  const [isRunning, setIsRunning] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{nodes: any[], links: any[]} | null>(null);

  const handleRun = async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setResult(null);
    try {
      const res = await api.post("/agents/citation-network", { query, url: "" });
      setResult(res.data);
    } catch (e) {
      // handled by api interceptor
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-black dark:text-white flex items-center gap-2">
            <Network className="text-gray-500" />
            Citation Network Agent
          </h2>
          <p className="text-gray-500 text-sm mt-1">Generate and analyze citation graphs for context mapping.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Export Graph
          </button>
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {isRunning ? <Network size={16} className="animate-spin" /> : <Play size={16} />}
            {isRunning ? 'Generating...' : 'Generate Map'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold mb-4">Network Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Seed Paper ID (DOI / ArXiv)</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRun()}
                    placeholder="e.g. 10.1145/12345 or Title" 
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:border-black dark:focus:border-white transition-colors" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Traversal Depth</span>
                  <span className="text-black dark:text-white">2</span>
                </label>
                <input type="range" min="1" max="5" defaultValue="2" className="w-full accent-black dark:accent-white" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Max Nodes</span>
                  <span className="text-black dark:text-white">100</span>
                </label>
                <input type="range" min="10" max="500" defaultValue="100" className="w-full accent-black dark:accent-white" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Edge Type</label>
                <select className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors">
                  <option>Both (Citations & References)</option>
                  <option>Citations Only (Forward)</option>
                  <option>References Only (Backward)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
             <h3 className="font-bold mb-4">Node Metrics</h3>
             <div className="space-y-3">
               <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                 <span className="text-sm text-gray-500">Total Nodes</span>
                 <span className="font-semibold">{result ? result.nodes.length : 0}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                 <span className="text-sm text-gray-500">Total Edges</span>
                 <span className="font-semibold">{result ? result.links.length : 0}</span>
               </div>
               <div className="flex justify-between items-center py-2">
                 <span className="text-sm text-gray-500">Network Density</span>
                 <span className="font-semibold">{result && result.nodes.length > 1 ? (result.links.length / (result.nodes.length * (result.nodes.length - 1))).toFixed(3) : "0.00"}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="lg:col-span-3 bg-gray-100 dark:bg-[#13151f] rounded-2xl border border-gray-200 dark:border-gray-800 relative overflow-hidden min-h-[500px] flex items-center justify-center p-6">
          {isRunning ? (
            <div className="flex flex-col items-center">
              <Network size={48} className="text-gray-400 animate-pulse mb-4" />
              <p className="text-gray-500 font-mono text-sm animate-pulse">Computing graph layout...</p>
            </div>
          ) : result ? (
             <div className="absolute inset-0 overflow-y-auto p-6 flex flex-col gap-4 bg-white dark:bg-[#1a1d27]">
               <h3 className="font-bold mb-2">Network Nodes ({result.nodes.length})</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {result.nodes.map((node, i) => (
                   <div key={i} className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-black dark:hover:border-white transition-colors">
                     <div className="flex items-center gap-3 mb-2">
                       <FileText size={16} className={node.type === "saved" ? "text-blue-500" : "text-gray-400"} />
                       <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{node.type}</span>
                     </div>
                     <div className="font-bold text-sm line-clamp-2" title={node.label}>{node.label}</div>
                     {node.url && (
                       <a href={node.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
                         View Source
                       </a>
                     )}
                   </div>
                 ))}
               </div>
             </div>
          ) : (
             <div className="flex flex-col items-center text-gray-400">
               <Network size={48} className="mb-4 opacity-50" />
               <p className="text-sm">Enter a Seed DOI and click "Generate Map" to visualize citations.</p>
             </div>
          )}

          {/* Canvas Controls overlay */}
          <div className="absolute bottom-4 right-4 flex bg-white dark:bg-[#1a1d27] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-r border-gray-200 dark:border-gray-800"><ZoomIn size={18} /></button>
            <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-r border-gray-200 dark:border-gray-800"><ZoomOut size={18} /></button>
            <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Maximize size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
