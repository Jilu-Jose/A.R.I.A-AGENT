import React, { useState } from 'react';
import { FileSearch, Copy, Check, Play, FileText } from 'lucide-react';

export default function Summarisation() {
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2000);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-black dark:text-white flex items-center gap-2">
            <FileSearch className="text-gray-500" />
            Summarisation Agent
          </h2>
          <p className="text-gray-500 text-sm mt-1">Distill lengthy papers and abstracts into concise, actionable summaries.</p>
        </div>
        <button 
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {isRunning ? <FileSearch size={18} className="animate-spin" /> : <Play size={18} />}
          {isRunning ? 'Processing...' : 'Summarize Text'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Input */}
        <div className="flex flex-col bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold flex items-center gap-2"><FileText size={18} /> Source Text</h3>
             <button className="text-xs font-semibold px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Paste Abstract</button>
           </div>
           <textarea 
             placeholder="Paste the abstract or text of the paper you wish to summarize here..."
             className="flex-1 w-full p-4 bg-gray-50 dark:bg-[#13151f] border border-gray-200 dark:border-gray-800 rounded-xl text-sm resize-none outline-none focus:border-black dark:focus:border-white transition-colors"
           ></textarea>
           
           <div className="mt-4 flex gap-4">
             <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Length</label>
                <select className="w-full bg-gray-50 dark:bg-[#13151f] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors">
                  <option>Short (1 paragraph)</option>
                  <option>Medium (Bullet points)</option>
                  <option>Long (Detailed summary)</option>
                </select>
             </div>
             <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tone</label>
                <select className="w-full bg-gray-50 dark:bg-[#13151f] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors">
                  <option>Academic / Technical</option>
                  <option>Layman / Simple</option>
                  <option>Executive Brief</option>
                </select>
             </div>
           </div>
        </div>

        {/* Output */}
        <div className="flex flex-col bg-gray-50 dark:bg-[#13151f] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 relative">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold flex items-center gap-2">Result</h3>
             <button 
               onClick={handleCopy}
               className="flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-lg hover:border-black dark:hover:border-white transition-colors"
             >
               {copied ? <Check size={14} className="text-black dark:text-white" /> : <Copy size={14} />}
               {copied ? 'Copied' : 'Copy'}
             </button>
           </div>
           
           <div className="flex-1 w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 font-serif leading-relaxed overflow-y-auto">
             {isRunning ? (
               <div className="h-full flex flex-col items-center justify-center opacity-50">
                 <div className="flex gap-1 mb-4">
                   <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-bounce" style={{animationDelay: '0ms'}}></div>
                   <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-bounce" style={{animationDelay: '150ms'}}></div>
                   <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-bounce" style={{animationDelay: '300ms'}}></div>
                 </div>
                 <p className="font-mono text-xs">Extracting key sentences...</p>
               </div>
             ) : (
               <div className="opacity-50 flex items-center justify-center h-full">
                 Enter text and click "Summarize Text" to see the output here.
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
