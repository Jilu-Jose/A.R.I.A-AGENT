import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Trash2, Power, ExternalLink, Rss, Tag, Search, CheckCircle2, XCircle, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Feed {
  id: number;
  name: string;
  url: string;
  tags: string | null;
  is_active: boolean;
  created_at: string;
}

const SUGGESTED_FEEDS = [
  { name: 'arXiv — AI & Machine Learning', url: 'https://rss.arxiv.org/rss/cs.AI', tags: 'AI, ML' },
  { name: 'arXiv — Computer Vision', url: 'https://rss.arxiv.org/rss/cs.CV', tags: 'CV, Imaging' },
  { name: 'arXiv — NLP', url: 'https://rss.arxiv.org/rss/cs.CL', tags: 'NLP, LLM' },
  { name: 'arXiv — Robotics', url: 'https://rss.arxiv.org/rss/cs.RO', tags: 'Robotics' },
  { name: 'Nature — Latest Research', url: 'https://www.nature.com/nature.rss', tags: 'Science' },
  { name: 'PubMed — Biomedical', url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1E93UiVdRLNSGg0HN4D0zPsAyoKp7fF7a2LzFX1yRMAtIxcUfH/?limit=20&utm_campaign=pubmed-2&fc=20210404010840', tags: 'Biology, Medicine' },
  { name: 'MIT News — Research', url: 'https://news.mit.edu/rss/research', tags: 'Research' },
  { name: 'DeepMind Blog', url: 'https://www.deepmind.com/blog/rss.xml', tags: 'AI, DeepMind' },
];

export default function Resources() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingUrl, setAddingUrl] = useState('');
  const [addingName, setAddingName] = useState('');
  const [addingTags, setAddingTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const navigate = useNavigate();

  const fetchFeeds = async () => {
    try {
      const { data } = await api.get('/settings/feeds');
      setFeeds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeeds(); }, []);

  const addFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingUrl.trim()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('url', addingUrl.trim());
      formData.append('name', addingName.trim());
      formData.append('tags', addingTags.trim());
      await api.post('/settings/feeds', formData);
      setAddingUrl('');
      setAddingName('');
      setAddingTags('');
      fetchFeeds();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add feed.');
    } finally {
      setSubmitting(false);
    }
  };

  const addSuggested = async (feed: typeof SUGGESTED_FEEDS[0]) => {
    const already = feeds.find(f => f.url === feed.url);
    if (already) { alert('This feed is already in your list.'); return; }
    try {
      const formData = new FormData();
      formData.append('url', feed.url);
      formData.append('name', feed.name);
      formData.append('tags', feed.tags);
      await api.post('/settings/feeds', formData);
      fetchFeeds();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add feed.');
    }
  };

  const deleteFeed = async (id: number) => {
    if (!confirm('Remove this feed?')) return;
    try {
      await api.delete(`/settings/feeds/${id}`);
      fetchFeeds();
    } catch { alert('Failed to remove feed.'); }
  };

  const toggleFeed = async (id: number) => {
    try {
      await api.put(`/settings/feeds/${id}/toggle`);
      fetchFeeds();
    } catch { alert('Failed to toggle feed.'); }
  };

  const filtered = feeds.filter(f =>
    f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.url.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (f.tags || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 space-y-8">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ArrowLeft size={16} /> Go Back
        </button>
        <button onClick={() => navigate('/')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <Home size={16} /> Home
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Rss size={28} className="text-gray-400" />
        <div>
          <h1 className="text-3xl font-bold font-serif">Digest Resources</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage RSS feeds that power your research digests</p>
        </div>
      </div>

      {/* Add Feed Form */}
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-bold mb-5 flex items-center gap-2"><Plus size={18} /> Add a New Source</h2>
        <form onSubmit={addFeed} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="url"
            value={addingUrl}
            onChange={e => setAddingUrl(e.target.value)}
            placeholder="RSS feed URL (https://...)"
            required
            className="md:col-span-3 px-4 py-3 bg-gray-50 dark:bg-[#1e2030] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black dark:focus:border-white transition-all"
          />
          <input
            type="text"
            value={addingName}
            onChange={e => setAddingName(e.target.value)}
            placeholder="Display name (optional)"
            className="px-4 py-3 bg-gray-50 dark:bg-[#1e2030] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black dark:focus:border-white transition-all"
          />
          <input
            type="text"
            value={addingTags}
            onChange={e => setAddingTags(e.target.value)}
            placeholder="Tags (e.g. AI, Biology)"
            className="px-4 py-3 bg-gray-50 dark:bg-[#1e2030] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black dark:focus:border-white transition-all"
          />
          <button
            type="submit"
            disabled={submitting || !addingUrl.trim()}
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-80 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            {submitting ? 'Adding...' : 'Add Feed'}
          </button>
        </form>
      </div>

      {/* Suggested Feeds */}
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-bold mb-4">Suggested Sources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUGGESTED_FEEDS.map(feed => {
            const added = feeds.some(f => f.url === feed.url);
            return (
              <div key={feed.url} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${added ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1e2030] opacity-60' : 'border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e2030]'}`}>
                <div className="flex-1 min-w-0 pr-3">
                  <div className="text-sm font-semibold text-black dark:text-white truncate">{feed.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Tag size={10} /> {feed.tags}
                  </div>
                </div>
                {added ? (
                  <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0"><CheckCircle2 size={14} /> Added</span>
                ) : (
                  <button
                    onClick={() => addSuggested(feed)}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all"
                  >
                    + Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Feeds List */}
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold">Your Feeds ({feeds.length})</h2>
          <div className="relative w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Filter feeds..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#1e2030] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading feeds...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Rss size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">{feeds.length === 0 ? 'No feeds yet' : 'No feeds match your search'}</p>
            <p className="text-sm mt-1">{feeds.length === 0 ? 'Add one above or pick from the suggestions.' : 'Try a different keyword.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(feed => (
              <div key={feed.id} className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-[#1e2030]/30 ${!feed.is_active ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-black dark:text-white truncate">{feed.name}</span>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${feed.is_active ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                      {feed.is_active ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                      {feed.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <a href={feed.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-1 truncate max-w-xs transition-colors">
                      <ExternalLink size={10} /> {feed.url}
                    </a>
                    {feed.tags && (
                      <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                        <Tag size={10} /> {feed.tags}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleFeed(feed.id)}
                    className={`p-2 rounded-xl transition-colors ${feed.is_active ? 'text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                    title={feed.is_active ? 'Pause feed' : 'Activate feed'}
                  >
                    <Power size={16} />
                  </button>
                  <button
                    onClick={() => deleteFeed(feed.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
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
