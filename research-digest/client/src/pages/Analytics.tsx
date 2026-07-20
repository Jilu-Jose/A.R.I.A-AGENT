import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { TrendingUp, FileText, BookOpen, Rss, BarChart2, Calendar } from 'lucide-react';

interface Overview {
  total_digests: number;
  total_articles_processed: number;
  total_papers_saved: number;
  total_feeds: number;
  active_feeds: number;
  last_digest_date: string | null;
}

interface MonthlyData {
  month: string;
  digests: number;
  articles: number;
}

interface TopicData {
  topic: string;
  count: number;
}

interface FeedActivity {
  label: string;
  value: number;
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl text-sm">
        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-black dark:text-white">{value}</div>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [feedActivity, setFeedActivity] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/digests-over-time'),
      api.get('/analytics/top-topics'),
      api.get('/analytics/feed-activity'),
    ]).then(([ov, mo, to, fa]) => {
      setOverview(ov.data);
      setMonthly(mo.data);
      setTopics(to.data);
      setFeedActivity(fa.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Detect dark mode for chart colors
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  const PIE_COLORS = isDark ? ['#ffffff', '#374151'] : ['#000000', '#9ca3af'];

  const chartStroke = isDark ? '#ffffff' : '#000000';
  const chartStrokeSecondary = isDark ? '#9ca3af' : '#6b7280';

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart2 size={28} className="text-gray-400" />
        <div>
          <h1 className="text-3xl font-bold font-serif">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Your research activity at a glance</p>
        </div>
      </div>

      {/* Stat Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={<FileText size={22} />} label="Digests Generated" value={overview.total_digests} />
          <StatCard icon={<TrendingUp size={22} />} label="Articles Processed" value={overview.total_articles_processed} />
          <StatCard icon={<BookOpen size={22} />} label="Papers Saved" value={overview.total_papers_saved} />
          <StatCard icon={<Rss size={22} />} label="RSS Feeds" value={overview.total_feeds} sub={`${overview.active_feeds} active`} />
          <StatCard
            icon={<Calendar size={22} />}
            label="Last Digest"
            value={overview.last_digest_date ? new Date(overview.last_digest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
          />
        </div>
      )}

      {/* Monthly Activity Chart */}
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-bold mb-6">Research Activity — Last 12 Months</h2>
        {monthly.length === 0 || monthly.every(m => m.digests === 0 && m.articles === 0) ? (
          <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
            No activity data yet. Generate your first digest to see trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="articlesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartStroke} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={chartStroke} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="digestsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartStrokeSecondary} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={chartStrokeSecondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
              <Area type="monotone" dataKey="articles" name="Articles" stroke={chartStroke} strokeWidth={2} fill="url(#articlesGrad)" dot={false} />
              <Area type="monotone" dataKey="digests" name="Digests" stroke={chartStrokeSecondary} strokeWidth={2} fill="url(#digestsGrad)" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Topics */}
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold mb-6">Top Research Topics</h2>
          {topics.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No topic data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topics} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="topic" type="category" width={120} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Appearances" radius={[0, 4, 4, 0]}>
                  {topics.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? chartStroke : i === 1 ? (isDark ? '#9ca3af' : '#374151') : chartStrokeSecondary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Feed Activity Pie */}
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold mb-6">Feed Status</h2>
          {feedActivity.every(f => f.value === 0) ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No feeds configured yet.
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={feedActivity}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {feedActivity.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-8 text-center mt-2">
                {feedActivity.map((f, i) => (
                  <div key={i}>
                    <div className="text-2xl font-bold text-black dark:text-white">{f.value}</div>
                    <div className="text-sm text-gray-500">{f.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
