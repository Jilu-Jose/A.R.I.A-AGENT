import React, { useState } from 'react';
import { Search, ChevronRight, Target, Lightbulb, Play } from 'lucide-react';

export default function GapFinder() {
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
            <Search className="text-gray-500" />
            Gap Finder
          </h2>
          <p className="text-gray-500 text-sm mt-1">Identify unexplored areas and novel research directions.</p>
        </div>
        <button 
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {isRunning ? <Search size={16} className="animate-spin" /> : <Play size={16} />}
          {isRunning ? 'Analyzing...' : 'Analyze Field'}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Pane: Input */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex-1">
            <h3 className="font-bold mb-4">Research Domain</h3>
            <textarea 
              placeholder="Describe the broad field or paste recent abstracts here to define the boundary of the search..."
              className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl text-sm resize-none outline-none focus:border-black dark:focus:border-white transition-colors mb-4"
            ></textarea>
            
            <h3 className="font-bold mb-4 text-sm text-gray-500 uppercase tracking-wider">Focus Constraints</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-black dark:accent-white" defaultChecked />
                <span>Exclude purely theoretical approaches</span>
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-black dark:accent-white" />
                <span>Focus on methodological gaps</span>
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-black dark:accent-white" defaultChecked />
                <span>Focus on application/empirical gaps</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Pane: Gaps */}
        <div className="w-full lg:w-2/3 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Target size={18} />
            Identified Research Gaps
          </h3>

          {isRunning ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
              <Lightbulb size={48} className="animate-pulse mb-4" />
              <p className="font-mono text-sm animate-pulse">Scanning literature density...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div className="p-5 border border-gray-200 dark:border-gray-800 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-black dark:bg-white"></span>
                    Long-term longitudinal studies in LLM adoption
                  </h4>
                  <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-black dark:text-white">High Confidence</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  While there is abundant literature on the immediate productivity impacts of LLMs, there is a distinct lack of empirical studies tracking the long-term skill degradation or enhancement over a multi-year period.
                </p>
                <button className="text-sm font-semibold flex items-center gap-1 hover:underline">
                  View literature clusters <ChevronRight size={16} />
                </button>
              </div>

              <div className="p-5 border border-gray-200 dark:border-gray-800 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-black dark:bg-white"></span>
                    Cross-lingual evaluation of visual-language models
                  </h4>
                  <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-black dark:text-white">Medium Confidence</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  Most VLM benchmarks are heavily skewed towards English prompts. The performance disparity when querying these models in low-resource languages remains under-explored.
                </p>
                <button className="text-sm font-semibold flex items-center gap-1 hover:underline">
                  View literature clusters <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
