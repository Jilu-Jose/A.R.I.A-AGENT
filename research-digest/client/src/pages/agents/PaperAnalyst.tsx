import React, { useState } from 'react';
import { FileText, Play, Link as LinkIcon, UploadCloud, Microscope, Crosshair, AlertTriangle, Lightbulb } from 'lucide-react';
import { api } from '../../api';

export default function PaperAnalyst() {
  const [isRunning, setIsRunning] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setResult(null);
    try {
      const res = await api.post("/agents/analyze-paper", { query, url: "" });
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
            <FileText className="text-gray-500" />
            Paper Analyst
          </h2>
          <p className="text-gray-500 text-sm mt-1">Deep structural extraction of methodology, findings, and limitations.</p>
        </div>
        <button 
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {isRunning ? <FileText size={16} className="animate-spin" /> : <Play size={16} />}
          {isRunning ? 'Analyzing...' : 'Analyze Paper'}
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6 flex gap-4">
        <div className="flex-1 relative">
          <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            placeholder="Paste ArXiv URL or DOI..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#13151f] border border-gray-200 dark:border-gray-800 rounded-xl text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
          />
        </div>
        <div className="flex items-center justify-center font-bold text-gray-400 px-2">OR</div>
        <button className="px-6 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <UploadCloud size={18} />
          Upload PDF
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isRunning ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
             <FileText size={48} className="animate-pulse mb-4" />
             <p className="font-mono text-sm animate-pulse">Parsing document structure...</p>
          </div>
        ) : result ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                <Microscope size={18} /> Methodology
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.methodology}</p>
            </div>

            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                <Crosshair size={18} /> Key Findings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.results}</p>
            </div>

            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                <AlertTriangle size={18} /> Limitations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.limitations}</p>
            </div>
            
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 md:col-span-2 lg:col-span-3">
              <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                <Lightbulb size={18} /> Impact Statement
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.impact_statement}</p>
            </div>

          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Enter a paper URL or title to begin analysis.
          </div>
        )}
      </div>
    </div>
  );
}
