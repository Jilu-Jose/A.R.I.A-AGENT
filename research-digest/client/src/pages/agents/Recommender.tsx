import React, { useState } from 'react';
import { Sparkles, RefreshCw, Bookmark, SlidersHorizontal, ExternalLink } from 'lucide-react';
import { api } from '../../api';
import toast from 'react-hot-toast';

export default function Recommender() {
  const [isRunning, setIsRunning] = useState(false);
  const [papers, setPapers] = useState<any[]>([]);

  const handleRun = async () => {
    setIsRunning(true);
    setPapers([]);
    try {
      const res = await api.post("/agents/recommend", { query: "recommendations" });
      setPapers(res.data || []);
      if (res.data && res.data.length === 0) {
        toast.error("No recommendations found. Save more papers to your library!");
      }
    } catch (e) {
      // api interceptor handles toast
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = async (paper: any) => {
    try {
      await api.post("/dashboard/paper", { title: paper.title, url: paper.url });
      toast.success("Saved to Library!");
    } catch (e) {
      toast.error("Failed to save paper.");
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-black dark:text-white flex items-center gap-2">
            <Sparkles className="text-gray-500" />
            O.R.A.C.L.E
          </h2>
          <p className="text-gray-500 text-sm mt-1">Discover new papers tailored to your reading history.</p>
        </div>
        <button 
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={isRunning ? 'animate-spin' : ''} />
          {isRunning ? 'Refreshing...' : 'Refresh Feed'}
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
            <span>Exploitation vs Exploration</span>
            <span className="text-black dark:text-white text-xs">Balanced (50%)</span>
          </label>
          <input type="range" min="0" max="100" defaultValue="50" className="w-full accent-black dark:accent-white" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Stay strictly on-topic</span>
            <span>Surprise me with novel domains</span>
          </div>
        </div>
        
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recency Bias</label>
          <select className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors">
             <option>All Time</option>
             <option>Past Year</option>
             <option>Past Month</option>
             <option>Past Week</option>
          </select>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {isRunning ? (
          <div className="h-48 flex flex-col items-center justify-center opacity-50">
             <Sparkles size={48} className="animate-pulse mb-4" />
             <p className="font-mono text-sm animate-pulse">Computing collaborative filtering matrices...</p>
          </div>
        ) : papers.length > 0 ? (
          papers.map((paper: any, idx: number) => (
            <div key={idx} className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex gap-6 hover:border-black dark:hover:border-white transition-colors">
               <div className="flex-1">
                 <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                   {paper.url ? (
                     <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                       {paper.title} <ExternalLink size={14} className="text-gray-400" />
                     </a>
                   ) : (
                     paper.title
                   )}
                 </h3>
                 <p className="text-sm text-gray-500 mb-4">
                   {paper.authors ? paper.authors.map((a: any) => a.name).join(", ") : "Unknown"} 
                   {paper.year ? ` (${paper.year})` : ""}
                 </p>
                 <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                   {paper.abstract || "No abstract available."}
                 </p>
               </div>
               <div className="flex flex-col items-center justify-between shrink-0">
                 <span className="text-xs font-bold px-2 py-1 bg-black dark:bg-white text-white dark:text-black rounded">{paper.match_score || 95}% Match</span>
                 <button onClick={() => handleSave(paper)} className="p-2 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800" title="Save to Library">
                   <Bookmark size={20} />
                 </button>
               </div>
            </div>
          ))
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm">
            Click "Refresh Feed" to get personalized recommendations based on your library.
          </div>
        )}
      </div>
    </div>
  );
}
