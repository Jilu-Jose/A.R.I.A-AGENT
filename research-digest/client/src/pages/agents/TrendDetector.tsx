import React, { useState } from 'react';
import { TrendingUp, BarChart2, Activity, Play, Hash } from 'lucide-react';
import { api } from '../../api';

export default function TrendDetector() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any[] | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await api.post("/agents/trend-detect", { query: "trending" });
      setResult(res.data);
    } catch (e) {
      // api.ts interceptor will trigger toast
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-black dark:text-white flex items-center gap-2">
            <TrendingUp className="text-gray-500" />
            Trend Detector
          </h2>
          <p className="text-gray-500 text-sm mt-1">Identify exploding research topics and dying fads over time.</p>
        </div>
        <div className="flex gap-4 items-center">
          <select className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors">
            <option>Last 12 Months</option>
            <option>Last 3 Years</option>
            <option>Last 5 Years</option>
          </select>
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {isRunning ? <TrendingUp size={16} className="animate-spin" /> : <Play size={16} />}
            {isRunning ? 'Analyzing...' : 'Detect Trends'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">Top Trend 1</div>
            <div className="font-bold text-lg">{result ? result[0]?.label : "..."}</div>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <TrendingUp size={20} className="text-black dark:text-white" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">Top Trend 2</div>
            <div className="font-bold text-lg">{result && result.length > 1 ? result[1]?.label : "..."}</div>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <BarChart2 size={20} className="text-black dark:text-white" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">Top Trend 3</div>
            <div className="font-bold text-lg">{result && result.length > 2 ? result[2]?.label : "..."}</div>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <Activity size={20} className="text-black dark:text-white" />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col">
        <h3 className="font-bold text-lg mb-6">Topic Momentum Over Time</h3>
        
        {isRunning ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <BarChart2 size={48} className="animate-pulse mb-4" />
            <p className="font-mono text-sm animate-pulse">Aggregating publication metadata...</p>
          </div>
        ) : (
          <div className="flex-1 relative flex items-end justify-between px-8 pb-8 pt-20 border-b border-l border-gray-200 dark:border-gray-800">
             <div className="flex flex-col gap-4 w-full h-full overflow-y-auto">
               {result?.map((topic, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                   <div className="p-2 bg-gray-100 dark:bg-black rounded-lg">
                     <Hash size={16} className="text-gray-500" />
                   </div>
                   <div className="flex-1">
                     <div className="font-bold">{topic.label}</div>
                     <div className="text-sm text-gray-500">#{topic.tag} &bull; {topic.category}</div>
                   </div>
                 </div>
               ))}
               {!result && (
                 <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                   Click "Detect Trends" to analyze current research patterns.
                 </div>
               )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
