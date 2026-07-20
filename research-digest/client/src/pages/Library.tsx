import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BookOpen, ExternalLink, Trash2 } from 'lucide-react';

interface Paper {
  id: number;
  title: string;
  url: string;
  created_at: string;
}

export default function Library() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLibrary = async () => {
    try {
      const { data } = await api.get('/dashboard/library');
      setPapers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const deletePaper = async (id: number) => {
    try {
      await api.delete(`/dashboard/paper/${id}`);
      fetchLibrary();
    } catch (err) {
      alert("Failed to delete paper.");
    }
  };

  if (loading) return <div className="flex justify-center mt-10">Loading library...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif mb-2 flex items-center gap-3">
          <BookOpen className="text-blue-500" /> Research Library
        </h1>
        <p className="text-gray-500">Your pinned research papers and articles.</p>
      </div>

      {papers.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <BookOpen size={24} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Your library is empty</h3>
          <p className="text-gray-500">Use the search bar above to pin papers from URLs or arXiv.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {papers.map((paper) => (
            <div key={paper.id} className="bg-white dark:bg-[#1a1d27] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex-1 pr-4">
                <a href={paper.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                  {paper.title}
                </a>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                  <span>Saved on {new Date(paper.created_at).toLocaleDateString()}</span>
                  <a href={paper.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                    <ExternalLink size={14} /> Open Link
                  </a>
                </div>
              </div>
              <button 
                onClick={() => deletePaper(paper.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Remove from Library"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
