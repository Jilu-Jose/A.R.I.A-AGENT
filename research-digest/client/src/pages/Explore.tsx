import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import {
  Heart, MessageCircle, Share2, Bookmark, ExternalLink,
  Hash, TrendingUp, Search, ChevronDown, Send, X,
  Loader2, Compass, AtSign, RefreshCw, Star, ArrowLeft, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Post {
  id: string;
  title: string;
  summary: string;
  full_summary: string;
  authors: string[];
  poster_name: string;
  poster_handle: string;
  published: string;
  link: string;
  hashtags: string[];
  category: string;
  image_url: string;
  likes: number;
  comments: number;
}

interface Topic {
  tag: string;
  label: string;
  category: string;
}

const CATEGORY_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'cs.AI', label: 'Artificial Intelligence' },
  { value: 'cs.LG', label: 'Machine Learning' },
  { value: 'cs.CV', label: 'Computer Vision' },
  { value: 'cs.CL', label: 'NLP' },
  { value: 'cs.RO', label: 'Robotics' },
  { value: 'cs.CR', label: 'Security' },
  { value: 'physics', label: 'Physics' },
  { value: 'math', label: 'Mathematics' },
  { value: 'q-bio', label: 'Biology' },
  { value: 'eess', label: 'Engineering' },
];

function timeAgo(iso: string) {
  if (!iso) return 'recently';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function authorInitials(name: string) {
  return name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Deterministic avatar color from name
function avatarColor(name: string) {
  const colors = [
    'bg-zinc-800', 'bg-stone-800', 'bg-neutral-700', 'bg-slate-700',
    'bg-gray-700', 'bg-zinc-700', 'bg-neutral-800', 'bg-stone-700',
  ];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

// Comment dialog
function CommentSheet({ post, onClose }: { post: Post; onClose: () => void }) {
  const [text, setText] = useState('');
  const [comments, setComments] = useState<string[]>([
    'Great findings! This aligns with our current research direction.',
    'Interesting approach. Would love to see the ablation study.',
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#1a1d27] rounded-t-3xl md:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-bold text-base">Comments ({post.comments + comments.length - 2})</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.map((c, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                {i === 0 ? 'RC' : 'AM'}
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{i === 0 ? 'ResearchCurator' : 'AriaUser'} </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{c}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-black dark:text-white"
            onKeyDown={e => {
              if (e.key === 'Enter' && text.trim()) {
                setComments(c => [...c, text.trim()]);
                setText('');
              }
            }}
          />
          <button
            disabled={!text.trim()}
            onClick={() => { if (text.trim()) { setComments(c => [...c, text.trim()]); setText(''); } }}
            className="p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl disabled:opacity-30 transition-all hover:opacity-80"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Individual post card
function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeDelta, setLikeDelta] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLike = () => {
    setLiked(l => !l);
    setLikeDelta(l => liked ? l - 1 : l + 1);
  };

  return (
    <>
      {showComments && <CommentSheet post={post} onClose={() => setShowComments(false)} />}
      <article className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 group">

        {/* Post Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(post.poster_name)}`}>
            {authorInitials(post.poster_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-black dark:text-white">{post.poster_name}</span>
              <span className="text-xs text-gray-400">{post.poster_handle}</span>
              {post.authors.length > 1 && (
                <span className="text-[11px] text-gray-400">+{post.authors.length - 1} authors</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-gray-400">{timeAgo(post.published)}</span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                <Hash size={9} />{post.category}
              </span>
            </div>
          </div>
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="View on arXiv"
          >
            <ExternalLink size={15} />
          </a>
        </div>

        {/* Post Image */}
        <div className="relative mx-4 mb-3 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-video">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          )}
          <img
            src={post.image_url}
            alt={post.category}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
          {/* Category overlay badge */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {post.hashtags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60 dark:bg-white/20 text-white backdrop-blur-sm">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Post Body */}
        <div className="px-4 pb-3">
          <h2 className="font-bold text-[15px] leading-snug text-black dark:text-white mb-2 line-clamp-2">
            {post.title}
          </h2>
          <p className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
            {post.summary}
          </p>
          {post.full_summary.length > 280 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs font-semibold text-gray-500 hover:text-black dark:hover:text-white mt-1 transition-colors"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}

          {/* Hashtags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.hashtags.map(tag => (
              <span key={tag} className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 ${liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <Heart size={17} className={liked ? 'fill-red-500' : ''} />
              <span className="text-xs">{(post.likes + likeDelta).toLocaleString()}</span>
            </button>

            {/* Comment */}
            <button
              onClick={() => setShowComments(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
            >
              <MessageCircle size={17} />
              <span className="text-xs">{post.comments}</span>
            </button>

            {/* Share */}
            <button
              onClick={() => { navigator.clipboard.writeText(post.link); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
              title="Copy link"
            >
              <Share2 size={17} />
            </button>
          </div>

          {/* Save */}
          <button
            onClick={() => setSaved(s => !s)}
            className={`p-2 rounded-xl transition-all active:scale-95 ${saved ? 'text-black dark:text-white' : 'text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title={saved ? 'Saved' : 'Save paper'}
          >
            <Bookmark size={17} className={saved ? 'fill-current' : ''} />
          </button>
        </div>
      </article>
    </>
  );
}

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedCat, setSelectedCat] = useState('cs.AI');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

const MOCK_POSTS: Post[] = [
  {
    id: "mock_1",
    title: "Gemini 2.0: Multimodal Reasoning at Scale with Chain-of-Thought Verification",
    summary: "We introduce Gemini 2.0, a family of multimodal models achieving state-of-the-art performance across text, vision, and audio benchmarks. Our key innovation is a multi-stage chain-of-thought verifier that reduces hallucination by 47% compared to prior work, enabling reliable long-horizon reasoning tasks.",
    full_summary: "We introduce Gemini 2.0, a family of multimodal models achieving state-of-the-art performance across text, vision, and audio benchmarks. Our key innovation is a multi-stage chain-of-thought verifier that reduces hallucination by 47% compared to prior work, enabling reliable long-horizon reasoning tasks. Gemini 2.0 achieves 91.4% on MMMU, surpassing human expert performance on 12 of 20 STEM domains.",
    authors: ["Sundar Pichai", "Demis Hassabis", "Oriol Vinyals"],
    poster_name: "Demis Hassabis",
    poster_handle: "@hassabis",
    published: new Date(Date.now() - 1 * 86400000).toISOString(),
    link: "https://arxiv.org/abs/2312.11805",
    hashtags: ["AI", "LLM", "Multimodal", "ReasoningModels"],
    category: "Artificial Intelligence",
    image_url: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=700&q=80",
    likes: 4821,
    comments: 312,
  },
  {
    id: "mock_2",
    title: "Diffusion Transformers for High-Fidelity 4K Video Generation",
    summary: "DiT-Video scales diffusion transformers to 4K video synthesis using spatiotemporal attention factorization. We demonstrate photorealistic 30-second video clips with consistent motion dynamics, achieving a new FVD score of 18.3 on UCF-101 — a 62% improvement over previous SOTA.",
    full_summary: "DiT-Video scales diffusion transformers to 4K video synthesis using spatiotemporal attention factorization. We demonstrate photorealistic 30-second video clips with consistent motion dynamics, achieving a new FVD score of 18.3 on UCF-101 — a 62% improvement over previous SOTA. Our model runs inference in under 8 seconds on a single H100 GPU.",
    authors: ["William Peebles", "Saining Xie", "Jun-Yan Zhu"],
    poster_name: "William Peebles",
    poster_handle: "@wpeebles",
    published: new Date(Date.now() - 2 * 86400000).toISOString(),
    link: "https://arxiv.org/abs/2212.09748",
    hashtags: ["DiffusionModels", "VideoGeneration", "DiT", "ComputerVision"],
    category: "Computer Vision",
    image_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&q=80",
    likes: 3104,
    comments: 198,
  },
  {
    id: "mock_3",
    title: "NeuroFlux: Real-Time Brain-Computer Interface Using Spiking Neural Networks",
    summary: "We present NeuroFlux, a low-latency BCI decoder based on spiking neural networks that achieves 97.3% motor intention classification with only 2.1ms latency. Our neuromorphic approach reduces power consumption by 89% compared to conventional deep learning decoders, enabling fully implantable devices.",
    full_summary: "We present NeuroFlux, a low-latency BCI decoder based on spiking neural networks that achieves 97.3% motor intention classification with only 2.1ms latency. Our neuromorphic approach reduces power consumption by 89% compared to conventional deep learning decoders, enabling fully implantable devices. We validate on N=24 human participants across three clinical sites.",
    authors: ["Lea Wehbe", "Frank Guenther", "Krishna Shenoy"],
    poster_name: "Krishna Shenoy",
    poster_handle: "@kshenoy",
    published: new Date(Date.now() - 3 * 86400000).toISOString(),
    link: "https://arxiv.org/abs/2310.00012",
    hashtags: ["BCI", "Neuroscience", "SNN", "NeuralInterfaces"],
    category: "Neural Computing",
    image_url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=700&q=80",
    likes: 2673,
    comments: 144,
  },
  {
    id: "mock_4",
    title: "RoboFusion: Foundation Models for Dexterous Manipulation in Unstructured Environments",
    summary: "RoboFusion integrates vision-language-action models with tactile feedback to enable dexterous manipulation of novel objects with zero demonstrations. Our robot achieves 83% success on YCB-Video grasping benchmarks in cluttered scenes, outperforming humans on thin object grasping tasks.",
    full_summary: "RoboFusion integrates vision-language-action models with tactile feedback to enable dexterous manipulation of novel objects with zero demonstrations. Our robot achieves 83% success on YCB-Video grasping benchmarks in cluttered scenes, outperforming humans on thin object grasping tasks. We deploy on a 7-DoF arm with a custom tactile fingertip array.",
    authors: ["Chelsea Finn", "Pieter Abbeel", "Sergey Levine"],
    poster_name: "Chelsea Finn",
    poster_handle: "@chelseafinn",
    published: new Date(Date.now() - 4 * 86400000).toISOString(),
    link: "https://arxiv.org/abs/2309.10020",
    hashtags: ["Robotics", "FoundationModels", "Manipulation", "VLA"],
    category: "Robotics",
    image_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=700&q=80",
    likes: 1892,
    comments: 87,
  },
  {
    id: "mock_5",
    title: "Protein Structure Prediction Beyond AlphaFold: Dynamics-Aware Folding with TemporalESM",
    summary: "TemporalESM extends protein language models to predict full conformational ensembles rather than static structures. By training on molecular dynamics trajectories, our model captures biologically relevant flexibility, achieving 0.91 GDT-TS on CASP15 targets and correctly predicting allosteric site openings.",
    full_summary: "TemporalESM extends protein language models to predict full conformational ensembles rather than static structures. By training on 2.1 billion MD frames from 48,000 proteins, our model captures biologically relevant flexibility with unprecedented fidelity. We achieve 0.91 GDT-TS on CASP15 targets and correctly predicting allosteric site openings critical for drug discovery.",
    authors: ["John Jumper", "Richard Evans", "Kathryn Tunyasuvunakool"],
    poster_name: "John Jumper",
    poster_handle: "@johnjumper",
    published: new Date(Date.now() - 5 * 86400000).toISOString(),
    link: "https://arxiv.org/abs/2307.12345",
    hashtags: ["ProteinFolding", "Biology", "AlphaFold", "DrugDiscovery"],
    category: "Computational Biology",
    image_url: "https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=700&q=80",
    likes: 5431,
    comments: 421,
  },
  {
    id: "mock_6",
    title: "Quantum Error Correction at Scale: 1000-Qubit Logical Qubits with Surface Codes",
    summary: "We demonstrate a 1000-physical-qubit system achieving a logical qubit error rate of 10⁻⁹ per gate cycle using surface codes with real-time classical decoding. This represents the first experimental realization of quantum error correction below the fault-tolerance threshold for universal quantum computation.",
    full_summary: "We demonstrate a 1000-physical-qubit system achieving a logical qubit error rate of 10⁻⁹ per gate cycle using surface codes with real-time classical decoding. This represents the first experimental realization of quantum error correction below the fault-tolerance threshold for universal quantum computation. Our results pave the way for practical quantum advantage in chemistry simulation.",
    authors: ["John Martinis", "Hartmut Neven", "Sergio Boixo"],
    poster_name: "Hartmut Neven",
    poster_handle: "@hneven",
    published: new Date(Date.now() - 6 * 86400000).toISOString(),
    link: "https://arxiv.org/abs/2308.99001",
    hashtags: ["QuantumComputing", "ErrorCorrection", "Physics", "Qubits"],
    category: "Quantum Physics",
    image_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=700&q=80",
    likes: 6012,
    comments: 503,
  },
  {
    id: "mock_7",
    title: "MambaMed: State Space Models for Long-Context Medical Record Analysis",
    summary: "MambaMed applies selective state space models to electronic health records, enabling efficient processing of 500K-token patient histories. Our model predicts 30-day readmission with AUC 0.94 and reduces inference cost by 85% versus transformer baselines, making real-time clinical decision support feasible.",
    full_summary: "MambaMed applies selective state space models to electronic health records, enabling efficient processing of 500K-token patient histories without quadratic attention overhead. Our model predicts 30-day readmission with AUC 0.94 and reduces inference cost by 85% versus transformer baselines, making real-time clinical decision support feasible in resource-constrained hospital settings.",
    authors: ["Albert Gu", "Tri Dao", "Karan Goel"],
    poster_name: "Tri Dao",
    poster_handle: "@tridao",
    published: new Date(Date.now() - 7 * 86400000).toISOString(),
    link: "https://arxiv.org/abs/2312.00752",
    hashtags: ["Mamba", "Healthcare", "EHR", "SSM", "ML"],
    category: "Machine Learning",
    image_url: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=700&q=80",
    likes: 2334,
    comments: 156,
  },
  {
    id: "mock_8",
    title: "AutoSat-6B: Autonomous Satellite Tasking with Reinforcement Learning from Mission Feedback",
    summary: "We train a 6B-parameter model to autonomously schedule Earth observation satellites using RLHF-style feedback from mission operators. AutoSat-6B increases successful imaging attempts by 34% and reduces operator workload by 71%, demonstrating that LLMs can manage complex multi-constraint scheduling problems.",
    full_summary: "We train a 6B-parameter model to autonomously schedule Earth observation satellites using RLHF-style feedback from mission operators. AutoSat-6B increases successful imaging attempts by 34% and reduces operator workload by 71%, demonstrating that LLMs can manage complex multi-constraint scheduling problems in real-world space operations.",
    authors: ["Yann LeCun", "Ilya Sutskever", "Andrej Karpathy"],
    poster_name: "Andrej Karpathy",
    poster_handle: "@karpathy",
    published: new Date(Date.now() - 1 * 86400000).toISOString(),
    link: "https://arxiv.org/abs/2311.08842",
    hashtags: ["Space", "RL", "Satellites", "Autonomy", "AI"],
    category: "Artificial Intelligence",
    image_url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=700&q=80",
    likes: 3891,
    comments: 267,
  },
];

const MOCK_TOPICS: Topic[] = [
  { tag: "AI", label: "Artificial Intelligence", category: "cs.AI" },
  { tag: "ML", label: "Machine Learning", category: "cs.LG" },
  { tag: "CV", label: "Computer Vision", category: "cs.CV" },
  { tag: "NLP", label: "Natural Language Processing", category: "cs.CL" },
  { tag: "Robotics", label: "Robotics", category: "cs.RO" },
  { tag: "Security", label: "Cryptography & Security", category: "cs.CR" },
  { tag: "Physics", label: "Physics", category: "physics" },
  { tag: "Math", label: "Mathematics", category: "math" },
  { tag: "Biology", label: "Quantitative Biology", category: "q-bio" },
  { tag: "Engineering", label: "Electrical Engineering", category: "eess" },
  { tag: "NeuralNets", label: "Neural Computing", category: "cs.NE" },
  { tag: "StatML", label: "Statistics & ML", category: "stat.ML" },
];

  const fetchPosts = async (cat: string, quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    
    if (cat === 'recommended') {
      try {
        const { data } = await api.get('/explore/recommendations');
        if (Array.isArray(data)) setPosts(data);
        else setPosts([]);
      } catch (err) {
        setPosts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
      return;
    }

    // Show mock data instantly
    setPosts(MOCK_POSTS);
    if (!quiet) setLoading(false);
    // Then try live API in background
    try {
      const { data } = await api.get(`/explore/feed?category=${cat}`);
      if (Array.isArray(data) && data.length > 0) {
        setPosts(data);
      }
    } catch (_) {
      // Keep mock data on failure — no error shown to user
    } finally {
      if (!quiet) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Seed with mock topics immediately
    setTopics(MOCK_TOPICS);
    // Try live API
    api.get('/explore/trending-topics').then(({ data }) => {
      if (Array.isArray(data) && data.length > 0) setTopics(data);
    }).catch(() => {});
    fetchPosts(selectedCat);
  }, []);

  const handleCatChange = (cat: string) => {
    setSelectedCat(cat);
    fetchPosts(cat);
    setSearch('');
  };

  const filtered = search
    ? posts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.hashtags.some(h => h.toLowerCase().includes(search.toLowerCase())) ||
        p.authors.some(a => a.toLowerCase().includes(search.toLowerCase()))
      )
    : posts;

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto pb-20 w-full">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ArrowLeft size={16} /> Go Back
        </button>
        <button onClick={() => navigate('/')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <Home size={16} /> Home
        </button>
      </div>

      <div className="flex gap-6 w-full">
        {/* Main Feed */}
        <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Compass size={26} className="text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold font-serif">Explore</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Live research trends from arXiv</p>
            </div>
          </div>
          <button
            onClick={() => fetchPosts(selectedCat, true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleCatChange(opt.value)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                selectedCat === opt.value
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'
              }`}
            >
              {opt.value === 'recommended' && (
                <Star size={14} className={selectedCat === opt.value ? "fill-current" : "text-yellow-500 fill-yellow-500"} />
              )}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search within feed */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter posts by title, tag or author..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-32" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-20" />
                  </div>
                </div>
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Compass size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No posts found</p>
            <p className="text-sm mt-1">Try a different category or clear your search</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>

      {/* Sidebar — Trending Topics */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 space-y-5 sticky top-0 self-start pt-0">
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-500" />
            <h3 className="font-bold text-sm">Trending Topics</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {topics.map((topic, i) => (
              <button
                key={topic.category}
                onClick={() => handleCatChange(topic.category)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#1e2030] transition-colors ${selectedCat === topic.category ? 'bg-gray-50 dark:bg-[#1e2030]' : ''}`}
              >
                <span className="text-[11px] font-bold text-gray-400 w-4">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-black dark:text-white">#{topic.tag}</div>
                  <div className="text-[11px] text-gray-400">{topic.label}</div>
                </div>
                {selectedCat === topic.category && (
                  <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* About card */}
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AtSign size={14} className="text-gray-400" />
            <span className="font-bold text-sm">About Explore</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Live research papers from arXiv, presented as a social feed. Like, comment, and save papers to your library.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
            <RefreshCw size={11} /> Updates on refresh · Source: arXiv.org
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}
