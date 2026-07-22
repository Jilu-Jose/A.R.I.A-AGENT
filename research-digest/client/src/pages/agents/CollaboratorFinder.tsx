import React, { useState } from 'react';
import { Users, Search, Filter, Mail, ExternalLink } from 'lucide-react';

export default function CollaboratorFinder() {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 1500);
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
        {isRunning ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <Users size={48} className="animate-pulse mb-4" />
            <p className="font-mono text-sm animate-pulse">Matching research vectors...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {[
              { name: "Dr. Elena Rostova", inst: "MIT / CSAIL", score: 94, topics: ["Neural Rendering", "NeRF", "3D Vision"] },
              { name: "Prof. James Chen", inst: "Stanford University", score: 88, topics: ["Computer Vision", "Generative Models"] },
              { name: "Sarah Jenkins, PhD", inst: "DeepMind", score: 85, topics: ["Reinforcement Learning", "NeRF"] },
              { name: "Dr. Arthur Vidal", inst: "ETH Zurich", score: 79, topics: ["Robotics", "3D Reconstruction"] }
            ].map((collab, i) => (
              <div key={i} className="flex items-center justify-between p-5 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-black dark:hover:border-white transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold font-serif text-lg">
                    {collab.name.split(' ')[collab.name.split(' ').length-1][0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      {collab.name}
                      <span className="text-xs bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full">{collab.score}% Match</span>
                    </h4>
                    <p className="text-sm text-gray-500">{collab.inst}</p>
                    <div className="flex gap-2 mt-2">
                      {collab.topics.map((t, j) => (
                        <span key={j} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-400">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800" title="Contact">
                    <Mail size={18} />
                  </button>
                  <button className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800" title="View Profile">
                    <ExternalLink size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
