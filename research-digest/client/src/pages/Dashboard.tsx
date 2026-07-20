import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { Layers, FileText, Activity, Calendar, Archive, ChevronRight } from 'lucide-react';
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
        <div className="mb-8 flex items-center gap-3">
          <Archive size={28} className="text-gray-400 dark:text-gray-500" />
          <div>
            <h1 className="text-3xl font-bold font-serif">Research Archives</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">All your past generated digests</p>
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

      <div className="space-y-6">
        {digest.clusters?.map((cluster, idx) => (
          <div key={cluster.id} className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </span>
              <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white">{cluster.topic_name}</h2>
            </div>

            <div className="px-6 py-5">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">
                {cluster.summary}
              </p>

              <div className="bg-gray-50 dark:bg-[#13151f] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText size={14} /> Source Papers ({cluster.articles.length})
                </h4>
                <ul className="space-y-2">
                  {cluster.articles.map((article, i) => (
                    <li key={i}>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-white dark:hover:bg-[#1a1d27] transition-colors"
                      >
                        <span className="flex-shrink-0 text-xs font-bold text-gray-400 w-5 text-right">{i + 1}.</span>
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm line-clamp-2 flex-1">
                          {article.title}
                        </span>
                        <ChevronRight size={14} className="text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
