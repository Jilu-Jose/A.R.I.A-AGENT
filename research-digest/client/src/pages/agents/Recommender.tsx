import React, { useState } from 'react';
import { Sparkles, RefreshCw, Bookmark, SlidersHorizontal } from 'lucide-react';

export default function Recommender() {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2000);
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-black dark:text-white flex items-center gap-2">
            <Sparkles className="text-gray-500" />
            Recommender Agent
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
        ) : (
          <>
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex gap-6 hover:border-black dark:hover:border-white transition-colors">
               <div className="flex-1">
                 <h3 className="font-bold text-lg mb-2">Direct Preference Optimization: Your Language Model is Secretly a Reward Model</h3>
                 <p className="text-sm text-gray-500 mb-4">Rafailov et al. (2023)</p>
                 <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                   While reinforcement learning from human feedback (RLHF) has become the standard for aligning large language models, we propose Direct Preference Optimization (DPO), which solves the same task without reinforcement learning.
                 </p>
               </div>
               <div className="flex flex-col items-center justify-between">
                 <span className="text-xs font-bold px-2 py-1 bg-black dark:bg-white text-white dark:text-black rounded">98% Match</span>
                 <button className="p-2 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800" title="Save to Library">
                   <Bookmark size={20} />
                 </button>
               </div>
            </div>

            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex gap-6 hover:border-black dark:hover:border-white transition-colors">
               <div className="flex-1">
                 <h3 className="font-bold text-lg mb-2">Q-LoRA: Efficient Finetuning of Quantized LLMs</h3>
                 <p className="text-sm text-gray-500 mb-4">Dettmers et al. (2023)</p>
                 <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                   We present QLoRA, an efficient finetuning approach that reduces memory usage enough to finetune a 65B parameter model on a single 48GB GPU while preserving full 16-bit finetuning task performance.
                 </p>
               </div>
               <div className="flex flex-col items-center justify-between">
                 <span className="text-xs font-bold px-2 py-1 bg-black dark:bg-white text-white dark:text-black rounded">92% Match</span>
                 <button className="p-2 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800" title="Save to Library">
                   <Bookmark size={20} />
                 </button>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
