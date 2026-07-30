import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical, RefreshCw, Trash2, ChevronDown, ChevronUp,
  Star, AlertTriangle, TrendingUp, BarChart3, Clock, Zap, Filter
} from 'lucide-react';
import { api } from '../api';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface EvalResult {
  id: number;
  agent_name: string;
  eval_type: string;
  score: number;
  reasoning: string;
  input_snapshot: string | null;
  output_snapshot: string | null;
  created_at: string | null;
  execution_id: number | null;
}

interface AgentSummary {
  agent_name: string;
  overall_avg: number;
  total_evals: number;
  metrics: Record<string, { avg_score: number; min_score: number; max_score: number; total: number }>;
  recent_scores: number[];
}

interface SummaryResponse {
  agents: AgentSummary[];
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const SCORE_COLOR = (score: number) => {
  if (score >= 4)   return 'text-emerald-500';
  if (score >= 2.5) return 'text-amber-500';
  return 'text-red-500';
};

const SCORE_BG = (score: number) => {
  if (score >= 4)   return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/60';
  if (score >= 2.5) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/60';
  return 'bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-800/60';
};

const SCORE_RING = (score: number) => {
  if (score >= 4)   return 'ring-emerald-400/30';
  if (score >= 2.5) return 'ring-amber-400/30';
  return 'ring-red-400/30';
};

const METRIC_BADGE_COLOR: Record<string, string> = {
  faithfulness:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  relevance:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completeness:   'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  coherence:      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  insightfulness: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < score ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-700'}
        />
      ))}
    </div>
  );
}

/* Mini sparkline using SVG */
function Sparkline({ scores, color }: { scores: number[]; color: string }) {
  if (!scores || scores.length < 2) {
    return <span className="text-[10px] text-gray-400">—</span>;
  }
  const max = 5;
  const w = 64;
  const h = 24;
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * w;
    const y = h - (s / max) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Summary Card
───────────────────────────────────────────── */
function AgentSummaryCard({
  agent,
  selected,
  onClick,
  onTrigger,
}: {
  agent: AgentSummary;
  selected: boolean;
  onClick: () => void;
  onTrigger: () => void;
}) {
  const avg = agent.overall_avg;
  const sparkColor = avg >= 4 ? '#10b981' : avg >= 2.5 ? '#f59e0b' : '#ef4444';

  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-2xl border p-5 transition-all duration-200
        hover:shadow-lg hover:-translate-y-0.5 group
        ${SCORE_BG(avg)}
        ${selected ? `ring-2 ${SCORE_RING(avg)} shadow-md` : ''}
      `}
    >
      {/* Agent name + score */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            {agent.agent_name.replace(/_/g, ' ')}
          </div>
          <div className={`text-3xl font-black tabular-nums ${SCORE_COLOR(avg)}`}>
            {avg.toFixed(1)}
            <span className="text-base font-normal text-gray-400 ml-1">/ 5</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Sparkline scores={agent.recent_scores} color={sparkColor} />
          <span className="text-[10px] text-gray-400">{agent.total_evals} evals</span>
        </div>
      </div>

      {/* Metric pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(agent.metrics).map(([metric, data]) => (
          <span key={metric} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${METRIC_BADGE_COLOR[metric] || 'bg-gray-100 text-gray-600'}`}>
            {metric} {data.avg_score.toFixed(1)}
          </span>
        ))}
      </div>

      {/* Trigger button */}
      <button
        onClick={(e) => { e.stopPropagation(); onTrigger(); }}
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity
          p-1.5 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:scale-110 active:scale-95"
        title="Re-run evaluation"
      >
        <RefreshCw size={13} className="text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Result Row
───────────────────────────────────────────── */
function ResultRow({ row, onDelete }: { row: EvalResult; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden transition-all hover:border-gray-200 dark:hover:border-gray-700">
      {/* Header row */}
      <div
        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Agent */}
        <div className="w-36 shrink-0">
          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
            {row.agent_name.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Metric badge */}
        <div className="w-32 shrink-0">
          <span className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold ${METRIC_BADGE_COLOR[row.eval_type] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
            {row.eval_type}
          </span>
        </div>

        {/* Score */}
        <div className="w-24 shrink-0 flex items-center gap-2">
          <span className={`text-xl font-black tabular-nums ${SCORE_COLOR(row.score)}`}>{row.score}</span>
          <StarRating score={row.score} />
        </div>

        {/* Reasoning preview */}
        <div className="flex-1 text-sm text-gray-500 dark:text-gray-400 truncate min-w-0">
          {row.reasoning}
        </div>

        {/* Timestamp */}
        <div className="w-28 shrink-0 text-right">
          <span className="text-[11px] text-gray-400">
            {row.created_at ? new Date(row.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Full Reasoning</div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{row.reasoning || '—'}</p>
          </div>
          <div className="space-y-3">
            {row.input_snapshot && (
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Input Snapshot</div>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-3 text-xs text-gray-600 dark:text-gray-400 font-mono line-clamp-3">
                  {row.input_snapshot}
                </div>
              </div>
            )}
            {row.output_snapshot && (
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Output Snapshot</div>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-3 text-xs text-gray-600 dark:text-gray-400 font-mono line-clamp-3">
                  {row.output_snapshot}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function EvalDashboard() {
  const [summary, setSummary]         = useState<AgentSummary[]>([]);
  const [results, setResults]         = useState<EvalResult[]>([]);
  const [total, setTotal]             = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [evalTypeFilter, setEvalTypeFilter] = useState<string>('');
  const [loading, setLoading]         = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [page, setPage]               = useState(0);
  const PAGE_SIZE = 20;

  /* ── Fetch summary ── */
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const { data } = await api.get<SummaryResponse>('/evals/summary');
      setSummary(data.agents.sort((a, b) => b.overall_avg - a.overall_avg));
    } catch {
      toast.error('Failed to load eval summary');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  /* ── Fetch results ── */
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      };
      if (selectedAgent)  params.agent_name = selectedAgent;
      if (evalTypeFilter) params.eval_type  = evalTypeFilter;

      const { data } = await api.get('/evals/results', { params });
      setResults(data.results);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load eval results');
    } finally {
      setLoading(false);
    }
  }, [selectedAgent, evalTypeFilter, page]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchResults(); }, [fetchResults]);

  /* ── Trigger manual eval ── */
  const handleTrigger = async (agentName: string) => {
    try {
      await api.post(`/evals/run/${agentName}`);
      toast.success(`Evaluation started for ${agentName.replace(/_/g, ' ')}`);
      setTimeout(fetchSummary, 3000);
      setTimeout(fetchResults, 3000);
    } catch {
      toast.error('Failed to trigger evaluation');
    }
  };

  /* ── Delete result ── */
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/evals/results/${id}`);
      toast.success('Result deleted');
      fetchResults();
      fetchSummary();
    } catch {
      toast.error('Failed to delete result');
    }
  };

  /* ── Select agent filter ── */
  const handleAgentSelect = (name: string) => {
    setSelectedAgent(prev => prev === name ? null : name);
    setPage(0);
  };

  const METRIC_TYPES = ['faithfulness', 'relevance', 'completeness', 'coherence', 'insightfulness'];
  const totalPages   = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <FlaskConical size={22} className="text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agent Evaluations</h1>
            <p className="text-gray-500 text-sm mt-0.5">LLM-as-a-Judge quality scores across all agents</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchSummary(); fetchResults(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Per-Agent Score Summary
          {selectedAgent && (
            <button onClick={() => setSelectedAgent(null)} className="ml-3 text-violet-500 normal-case tracking-normal font-semibold">
              ✕ Clear filter
            </button>
          )}
        </h2>

        {summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
            ))}
          </div>
        ) : summary.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#1a1d27] rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <FlaskConical size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            <p className="text-sm text-gray-400">No evaluation data yet. Run an agent to generate scores.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {summary.map(agent => (
              <AgentSummaryCard
                key={agent.agent_name}
                agent={agent}
                selected={selectedAgent === agent.agent_name}
                onClick={() => handleAgentSelect(agent.agent_name)}
                onTrigger={() => handleTrigger(agent.agent_name)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Results Table ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={13} /> Evaluation Results
            <span className="text-violet-500 font-bold text-xs normal-case tracking-normal">{total}</span>
          </h2>

          {/* Metric type filter */}
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-gray-400" />
            <select
              value={evalTypeFilter}
              onChange={e => { setEvalTypeFilter(e.target.value); setPage(0); }}
              className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              <option value="">All metrics</option>
              {METRIC_TYPES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="w-36 shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Agent</div>
            <div className="w-32 shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Metric</div>
            <div className="w-24 shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</div>
            <div className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reasoning</div>
            <div className="w-28 shrink-0 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</div>
            <div className="w-12 shrink-0" />
          </div>

          {/* Rows */}
          <div className="p-4 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-2xl bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
              ))
            ) : results.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <AlertTriangle size={28} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No results match the current filters.</p>
              </div>
            ) : (
              results.map(row => (
                <ResultRow
                  key={row.id}
                  row={row}
                  onDelete={() => handleDelete(row.id)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
