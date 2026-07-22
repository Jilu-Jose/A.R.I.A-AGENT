import React, { useState } from 'react';
import { FolderTree, Play, SlidersHorizontal, BarChart, Search } from 'lucide-react';
import { api } from '../../api';

export default function Clustering() {
  const [isRunning, setIsRunning] = useState(false);
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<any[] | null>(null);

  const handleRun = async () => {
    if (!topic.trim()) return;
    setIsRunning(true);
    setResult(null);
    try {
      const res = await api.post("/agents/cluster", { topic });
      setResult(res.data);
    } catch (e) {
      // toast is handled by interceptor
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-black dark:text-white flex items-center gap-2">
            <FolderTree className="text-gray-500" />
            Clustering Agent
          </h2>
          <p className="text-gray-500 text-sm mt-1">Group related papers dynamically based on semantic similarity.</p>
        </div>
        <button 
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {isRunning ? <FolderTree size={16} className="animate-spin" /> : <Play size={16} />}
          {isRunning ? 'Clustering...' : 'Run Clustering'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={18} />
              <h3 className="font-bold">Algorithm Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Search Topic for Papers</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRun()}
                    placeholder="e.g. LLM Reasoning"
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Clustering Algorithm</label>
                <select className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors">
                  <option>K-Means</option>
                  <option>DBSCAN</option>
                  <option>Agglomerative</option>
                  <option>HDBSCAN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Embeddings Model</label>
                <select className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors">
                  <option>OpenAI text-embedding-3-small</option>
                  <option>Cohere embed-english-v3.0</option>
                  <option>Local (all-MiniLM-L6-v2)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Similarity Threshold</span>
                  <span className="text-black dark:text-white">0.75</span>
                </label>
                <input type="range" min="0" max="100" defaultValue="75" className="w-full accent-black dark:accent-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2">
          {isRunning ? (
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-12 flex flex-col items-center justify-center min-h-[400px]">
              <div className="flex gap-2 mb-4">
                <div className="w-4 h-4 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-gray-500 font-mono text-sm animate-pulse">Calculating semantic distances...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 {result.map((cluster, i) => (
                   <div key={i} className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:border-black dark:hover:border-white cursor-pointer transition-all">
                     <div className="flex justify-between items-start mb-3">
                       <h4 className="font-bold text-lg line-clamp-1">{cluster.topic_name}</h4>
                       <span className="bg-gray-100 dark:bg-gray-800 text-xs px-2 py-1 rounded-md font-mono">{cluster.documents?.length || 0} Papers</span>
                     </div>
                     <p className="text-sm text-gray-500 mb-4 line-clamp-2">Documents related to {cluster.topic_name}</p>
                     <div className="flex -space-x-2">
                       {cluster.documents?.slice(0, 4).map((_, j) => (
                          <div key={j} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1a1d27] bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">P{j+1}</div>
                       ))}
                       {cluster.documents?.length > 4 && (
                         <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1a1d27] bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold">+{cluster.documents.length - 4}</div>
                       )}
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          ) : (
             <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-12 flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-gray-400 text-sm">Enter a topic and run clustering to group research papers.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
