import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import { Layers, FileText, Activity, Calendar, Archive, ChevronRight, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface Article {
  title: string;
  url: string;
}

interface Cluster {
  id: number;
  topic_name: string;
  summary: string;
  articles: Article[];
}

interface Digest {
  id: number;
  title: string;
  created_at: string;
  article_count: number;
  clusters?: Cluster[];
}

interface DashboardProps {
  archives?: boolean;
}

export default function Dashboard({ archives = false }: DashboardProps) {
  const [latestDigest, setLatestDigest] = useState<Digest | null>(null);
  const [archiveList, setArchiveList] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are allowed.");
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      await api.post("/dashboard/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("PDF uploaded and saved to Library.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to upload PDF.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (archives) {
        const response = await api.get('/dashboard/archives');
        const result = response.data;
        // Always normalize to array
        setArchiveList(Array.isArray(result) ? result : []);
      } else {
        const response = await api.get('/dashboard/latest');
        const result = response.data;
        // Empty object {} means no digest yet
        if (!result || typeof result !== 'object' || Object.keys(result).length === 0) {
          setLatestDigest(null);
        } else {
          setLatestDigest(result as Digest);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [archives]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runDigest = async () => {
    try {
      setRunning(true);
      await api.post('/dashboard/run-now');
      setStatusMsg({ text: 'Digest generation started! It will be available shortly.', type: 'success' });
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: 'Failed to start digest generation.', type: 'error' });
      setTimeout(() => setStatusMsg(null), 5000);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin" />
          <span>Loading digest...</span>
        </div>
      </div>
    );
  }

  // Archives View
  if (archives) {
    const digests = archiveList;
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Archive size={28} className="text-gray-400 dark:text-gray-500" />
            <div>
              <h1 className="text-3xl font-bold font-serif">Research Archives</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">All your past generated digests</p>
            </div>
          </div>
          <div>
            <input 
              type="file" 
              accept=".pdf,application/pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-80 transition-all disabled:opacity-50"
            >
              <Upload size={18} />
              {uploading ? "Uploading..." : "Upload PDF"}
            </button>
          </div>
        </div>

        {digests.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800">
            <Archive size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">No archives yet</h3>
            <p className="text-gray-500">Generate your first digest from the Dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {digests.map(d => (
              <div key={d.id} className="group bg-white dark:bg-[#1a1d27] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-md hover:border-black dark:hover:border-white transition-all">
                <h3 className="font-bold text-lg mb-3 line-clamp-2">{d.title || `Digest #${d.id}`}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><Calendar size={14} />{new Date(d.created_at).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium">
                    {d.article_count} Articles
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Latest Digest View
  if (!latestDigest) {
    return (
      <div className="max-w-5xl mx-auto h-full flex flex-col items-center justify-center text-center py-24">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <Layers size={36} className="text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4 font-serif">No Digest Available Yet</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-md text-lg leading-relaxed">
          Add RSS feeds in <Link to="/settings" className="underline hover:no-underline">Settings</Link> and generate your first research digest below.
        </p>
        <button
          onClick={runDigest}
          disabled={running}
          className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 text-lg disabled:opacity-60"
        >
          <Activity size={22} />
          {running ? 'Starting...' : 'Run Initial Digest'}
        </button>
      </div>
    );
  }

  const digest = latestDigest;

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">{digest!.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
            <Calendar size={15} />
            Generated on {new Date(digest!.created_at).toLocaleString()}
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium">
              {digest!.article_count} Articles
            </span>
          </p>
        </div>
        <button
          onClick={runDigest}
          disabled={running}
          className="shrink-0 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-80 transition-all flex items-center gap-2 disabled:opacity-40"
        >
          <Activity size={18} />
          {running ? 'Starting...' : 'Run New Digest'}
        </button>
        {statusMsg && (
          <div className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium ${
            statusMsg.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {statusMsg.text}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {digest.clusters?.map((cluster, idx) => (
          <div key={cluster.id} className="bg-white dark:bg-[#1a1d27] rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gradient-to-r from-gray-50/50 to-white dark:from-[#13151f]/50 dark:to-[#1a1d27]">
              <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-lg font-black shadow-inner border border-white/50 dark:border-white/5">
                {idx + 1}
              </span>
              <h2 className="text-2xl font-bold font-serif text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cluster.topic_name}</h2>
            </div>

            <div className="px-8 py-6">
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap mb-8">
                {cluster.summary}
              </p>

              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                  <FileText size={16} className="text-gray-400" /> Source Papers ({cluster.articles.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cluster.articles.map((article, i) => (
                    <a
                      key={i}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/article flex items-start gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#13151f] border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 relative">
                        <img 
                          src={`https://picsum.photos/seed/${cluster.id}-${i}/400/300`} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover group-hover/article:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/article:bg-black/10 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <h5 className="font-semibold text-gray-800 dark:text-gray-200 group-hover/article:text-blue-600 dark:group-hover/article:text-blue-400 transition-colors text-sm line-clamp-2 mb-1.5 leading-snug">
                          {article.title}
                        </h5>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          View Paper <ChevronRight size={12} className="opacity-0 -ml-1 group-hover/article:opacity-100 group-hover/article:translate-x-1 transition-all" />
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
