import React, { useState } from 'react';
import { BookOpen, FileText, Download, List, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LiteratureReviewer() {
  const [isRunning, setIsRunning] = useState(false);
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");

  const handleRun = async () => {
    if (!topic.trim()) {
        toast.error("Please enter a topic for the literature review.");
        return;
    }
    setIsRunning(true);
    setResult("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ messages: [{ role: "user", content: `/review ${topic}` }] })
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
        toast.error("Failed to generate literature review.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-black dark:text-white flex items-center gap-2">
            <BookOpen className="text-gray-500" />
            Literature Reviewer
          </h2>
          <p className="text-gray-500 text-sm mt-1">Generate comprehensive literature reviews from curated collections.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download size={16} /> Export Markdown
          </button>
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {isRunning ? <FileText size={16} className="animate-spin" /> : <Play size={16} />}
            {isRunning ? 'Drafting...' : 'Generate Review'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Outline Sidebar */}
        <div className="w-full lg:w-1/4 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <List size={18} /> Review Topic
          </h3>
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            placeholder="e.g. LLM Agents..." 
            className="w-full p-3 mb-6 bg-gray-50 dark:bg-[#13151f] border border-gray-200 dark:border-gray-800 rounded-xl text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
          />
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <List size={18} /> Outline Structure
          </h3>
          <div className="space-y-1">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded font-semibold text-sm cursor-pointer">1. Introduction</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded font-semibold text-sm cursor-pointer transition-colors">2. Background & Motivation</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded text-sm cursor-pointer transition-colors pl-6 text-gray-600 dark:text-gray-400">2.1 Historical Context</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded text-sm cursor-pointer transition-colors pl-6 text-gray-600 dark:text-gray-400">2.2 Theoretical Foundations</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded font-semibold text-sm cursor-pointer transition-colors">3. Current Methodologies</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded font-semibold text-sm cursor-pointer transition-colors">4. Limitations & Challenges</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded font-semibold text-sm cursor-pointer transition-colors">5. Conclusion</div>
          </div>
        </div>

        {/* Editor/Preview */}
        <div className="w-full lg:w-3/4 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 overflow-y-auto">
          {isRunning && !result ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <BookOpen size={48} className="animate-pulse mb-4" />
              <p className="font-mono text-sm animate-pulse">Synthesizing papers...</p>
            </div>
          ) : result ? (
            <div className="prose dark:prose-invert max-w-none font-serif whitespace-pre-wrap">
                {result}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Enter a topic and click "Generate Review" to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
