import React, { useState } from 'react';
import { TrendingUp, BarChart2, Activity, Play } from 'lucide-react';

export default function TrendDetector() {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2000);
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
            <div className="text-sm text-gray-500 mb-1">Fastest Growing Topic</div>
            <div className="font-bold text-lg">Agents & Tool Use</div>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <TrendingUp size={20} className="text-black dark:text-white" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">Highest Volume</div>
            <div className="font-bold text-lg">Large Language Models</div>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <BarChart2 size={20} className="text-black dark:text-white" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">Declining Topic</div>
            <div className="font-bold text-lg">Symbolic AI</div>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <Activity size={20} className="text-black dark:text-white rotate-180" />
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
             {/* Mock Chart */}
             <div className="absolute top-4 left-4 text-xs font-bold text-gray-400">Publication Volume</div>
             <div className="absolute bottom-[-24px] right-4 text-xs font-bold text-gray-400">Time</div>
             
             {/* Chart lines/bars */}
             <div className="w-12 h-[30%] bg-gray-200 dark:bg-gray-800 rounded-t-sm relative group cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs px-2 py-1 rounded transition-opacity">Q1</div>
             </div>
             <div className="w-12 h-[45%] bg-gray-200 dark:bg-gray-800 rounded-t-sm relative group cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"></div>
             <div className="w-12 h-[40%] bg-gray-200 dark:bg-gray-800 rounded-t-sm relative group cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"></div>
             <div className="w-12 h-[60%] bg-gray-300 dark:bg-gray-700 rounded-t-sm relative group cursor-pointer hover:bg-black dark:hover:bg-white transition-colors"></div>
             <div className="w-12 h-[75%] bg-black dark:bg-white rounded-t-sm relative group cursor-pointer"></div>
             <div className="w-12 h-[95%] bg-black dark:bg-white rounded-t-sm relative group cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)] dark:shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black font-bold text-xs px-2 py-1 rounded">Peak</div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
