import React, { useState } from 'react';
import { Search, ChevronRight, Target, Lightbulb, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GapFinder() {
  const [isRunning, setIsRunning] = useState(false);
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState("");

  const handleRun = async () => {
    if (!domain.trim()) return;
    setIsRunning(true);
    setResult("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ messages: [{ role: "user", content: `/gap ${domain}` }] })
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let text = "";
      
      while (reader && !done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\\n");
        for (const line of lines) {
            if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                    done = true;
                    break;
                }
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.token) {
                        text += parsed.token;
                        setResult(text);
                    } else if (parsed.error) {
                        toast.error(parsed.error);
                    }
                } catch (e) {}
            }
        }
      }
    } catch (e: any) {
        toast.error("Failed to fetch research gaps.");
    } finally {
      setIsRunning(false);
    }
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
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
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

          {isRunning && !result ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
              <Lightbulb size={48} className="animate-pulse mb-4" />
              <p className="font-mono text-sm animate-pulse">Scanning literature density...</p>
            </div>
          ) : result ? (
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div className="p-5 border border-gray-200 dark:border-gray-800 rounded-xl whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {result}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Enter a research domain to discover gaps.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
