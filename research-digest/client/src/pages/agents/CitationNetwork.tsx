import React, { useState } from 'react';
import { Network, Play, Search, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export default function CitationNetwork() {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2500);
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
                  <input type="text" placeholder="e.g. 10.1145/12345" className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:border-black dark:focus:border-white transition-colors" />
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
                 <span className="font-semibold">0</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                 <span className="text-sm text-gray-500">Total Edges</span>
                 <span className="font-semibold">0</span>
               </div>
               <div className="flex justify-between items-center py-2">
                 <span className="text-sm text-gray-500">Network Density</span>
                 <span className="font-semibold">0.00</span>
               </div>
             </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="lg:col-span-3 bg-gray-100 dark:bg-[#13151f] rounded-2xl border border-gray-200 dark:border-gray-800 relative overflow-hidden min-h-[500px] flex items-center justify-center">
          {isRunning ? (
            <div className="flex flex-col items-center">
              <Network size={48} className="text-gray-400 animate-pulse mb-4" />
              <p className="text-gray-500 font-mono text-sm animate-pulse">Computing graph layout...</p>
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
