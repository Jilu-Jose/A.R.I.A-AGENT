import React, { useState } from 'react';
import { Users, Search, Filter, Mail, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CollaboratorFinder() {
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
        body: JSON.stringify({ messages: [{ role: "user", content: `/collaborators ${domain}` }] })
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
        toast.error("Failed to fetch collaborators.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-black dark:text-white flex items-center gap-2">
            <Users className="text-gray-500" />
            Collaborator Finder
          </h2>
          <p className="text-gray-500 text-sm mt-1">Discover potential co-authors based on research overlap.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              placeholder="Enter your research topic, abstract, or a target DOI..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#13151f] border border-gray-200 dark:border-gray-800 rounded-xl text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>
          <button className="px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Filter size={18} />
            Filters
          </button>
          <button 
            onClick={handleRun}
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
          >
            {isRunning ? 'Searching...' : 'Find Matches'}
          </button>
        </div>

        {/* Results */}
        {isRunning && !result ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <Users size={48} className="animate-pulse mb-4" />
            <p className="font-mono text-sm animate-pulse">Matching research vectors...</p>
          </div>
        ) : result ? (
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div className="p-5 border border-gray-200 dark:border-gray-800 rounded-xl whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {result}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Enter a research topic to find potential collaborators.
          </div>
        )}
      </div>
    </div>
  );
}
