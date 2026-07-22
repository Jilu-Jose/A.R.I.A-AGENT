import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Database, Zap, Shield, Sparkles, Moon, Sun } from 'lucide-react';

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-[#fafcff] dark:bg-[#0f1117] text-gray-900 dark:text-gray-100 font-sans selection:bg-gray-200 dark:selection:bg-gray-800 selection:text-black dark:selection:text-white overflow-x-hidden transition-colors duration-300">
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
          }
          .delay-100 { animation-delay: 100ms; }
          .delay-200 { animation-delay: 200ms; }
          .delay-300 { animation-delay: 300ms; }
          .delay-400 { animation-delay: 400ms; }
          
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          
          @keyframes float {
            0% { transform: translate(-50%, -50%) translateY(0px); }
            50% { transform: translate(-50%, -50%) translateY(-15px); }
            100% { transform: translate(-50%, -50%) translateY(0px); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .shimmer-effect {
            position: relative;
            overflow: hidden;
          }
          .shimmer-effect::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            background-image: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0,
              rgba(255, 255, 255, 0.2) 20%,
              rgba(255, 255, 255, 0.5) 60%,
              rgba(255, 255, 255, 0)
            );
            animation: shimmer 2.5s infinite;
          }
          .dark .shimmer-effect::after {
            background-image: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0,
              rgba(255, 255, 255, 0.05) 20%,
              rgba(255, 255, 255, 0.1) 60%,
              rgba(255, 255, 255, 0)
            );
          }
        `}
      </style>

      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/70 dark:bg-[#0f1117]/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white dark:text-black font-bold font-serif text-xl">A</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-black dark:text-white">A.R.I.A</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/register" className="text-sm font-semibold bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2">
              Request Access
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 lg:pt-48 lg:pb-32 flex flex-col items-center text-center">
        {/* Background Gradients & Animations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none flex items-center justify-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 blur-[100px] rounded-full opacity-50 dark:opacity-30 transition-colors duration-300 animate-blob"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-200 dark:bg-gray-800 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gray-300 dark:bg-gray-700 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 text-black dark:text-white text-sm font-semibold mb-8 shadow-sm transition-colors duration-300">
          <Sparkles size={16} />
          <span>The Future of Research is Autonomous</span>
        </div>
        
        <h1 className="animate-fade-in-up delay-100 text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white max-w-4xl leading-[1.1] mb-8 transition-colors duration-300">
          Turn Information Overload into <span className="text-black dark:text-white">Structured Intelligence</span>
        </h1>
        
        <p className="animate-fade-in-up delay-200 text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mb-10 transition-colors duration-300">
          A.R.I.A is a self-operating research pipeline that ingests RSS feeds, deduplicates articles semantically, clusters them by topic, and synthesizes AI-generated research digests.
        </p>
        
        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center gap-4">
          <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-all hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
            Start Your Engine
            <ArrowRight size={20} />
          </Link>
          <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-[#1a1d27] text-gray-900 dark:text-gray-100 font-semibold rounded-full border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-lg flex items-center justify-center gap-2 shadow-sm">
            Explore Features
          </a>
        </div>
      </section>

      {/* Visual Break / Dashboard Preview Mockup */}
      <section className="animate-fade-in-up delay-400 px-6 pb-24 max-w-7xl mx-auto">
        <div className="relative rounded-[2rem] overflow-hidden bg-white dark:bg-[#0d0f15] border border-gray-200 dark:border-gray-800 shadow-2xl aspect-[16/9] md:aspect-[21/9] flex items-center justify-center transition-colors duration-300 group">
            <div className={`relative z-10 grid grid-cols-12 gap-3 md:gap-5 w-full h-full p-3 md:p-5 transition-all duration-1000 transform group-hover:scale-[1.01] ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
               
               {/* Sidebar */}
               <div className="hidden md:flex col-span-3 bg-gray-50 dark:bg-[#111318] rounded-xl border border-gray-100 dark:border-gray-800 flex-col p-4 gap-1 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-7 h-7 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                      <span className="text-white dark:text-black font-bold text-[10px]">A</span>
                    </div>
                    <span className="text-[11px] font-bold text-black dark:text-white tracking-tight">A.R.I.A</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-black/5 dark:bg-white/5">
                      <div className="w-4 h-4 rounded bg-black dark:bg-white shrink-0" />
                      <span className="text-[10px] font-semibold text-black dark:text-white">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-700 shrink-0" />
                      <span className="text-[10px] text-gray-500 dark:text-gray-500">Explore</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-700 shrink-0" />
                      <span className="text-[10px] text-gray-500 dark:text-gray-500">Agents</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-700 shrink-0" />
                      <span className="text-[10px] text-gray-500 dark:text-gray-500">Analytics</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-700 shrink-0" />
                      <span className="text-[10px] text-gray-500 dark:text-gray-500">Settings</span>
                    </div>
                  </div>
                  <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center">
                        <span className="text-white dark:text-black text-[8px] font-bold">JD</span>
                      </div>
                      <span className="text-[9px] text-gray-500 dark:text-gray-500">researcher@lab.io</span>
                    </div>
                  </div>
               </div>
               
               {/* Main Content Area */}
               <div className="col-span-12 md:col-span-9 flex flex-col gap-3 md:gap-4 h-full">
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-gray-50 dark:bg-[#111318] rounded-xl border border-gray-100 dark:border-gray-800 p-3 md:p-4 shimmer-effect">
                      <div className="text-[9px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-1">Articles</div>
                      <div className="text-lg md:text-2xl font-black text-black dark:text-white leading-none">1,204</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#111318] rounded-xl border border-gray-100 dark:border-gray-800 p-3 md:p-4 shimmer-effect">
                      <div className="text-[9px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-1">Clusters</div>
                      <div className="text-lg md:text-2xl font-black text-black dark:text-white leading-none">48</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#111318] rounded-xl border border-gray-100 dark:border-gray-800 p-3 md:p-4 shimmer-effect">
                      <div className="text-[9px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-1">Digests</div>
                      <div className="text-lg md:text-2xl font-black text-black dark:text-white leading-none">12</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#111318] rounded-xl border border-gray-100 dark:border-gray-800 p-3 md:p-4 shimmer-effect">
                      <div className="text-[9px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-1">Feeds</div>
                      <div className="text-lg md:text-2xl font-black text-black dark:text-white leading-none">8</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 md:gap-4 flex-1 min-h-0">
                     {/* Center — Activity Feed */}
                     <div className="flex-1 bg-gray-50 dark:bg-[#111318] rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-3 overflow-hidden">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-black dark:text-white">Recent Activity</span>
                          <span className="text-[9px] text-gray-400 dark:text-gray-600 font-medium">Today</span>
                        </div>
                        
                        {/* Activity Items */}
                        <div className="flex items-start gap-3 p-3 bg-white dark:bg-[#0d0f15] rounded-lg border border-gray-100 dark:border-gray-800 shimmer-effect">
                          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white shrink-0 flex items-center justify-center mt-0.5">
                            <span className="text-white dark:text-black text-[8px] font-bold">AI</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-black dark:text-white">Digest Generated</div>
                            <div className="text-[9px] text-gray-400 dark:text-gray-600 mt-0.5 leading-relaxed">Clustered 347 articles into 12 topic groups. Synthesis complete.</div>
                          </div>
                          <span className="text-[8px] text-gray-400 dark:text-gray-600 shrink-0 mt-1">2m ago</span>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white dark:bg-[#0d0f15] rounded-lg border border-gray-100 dark:border-gray-800 shimmer-effect">
                          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 shrink-0 flex items-center justify-center mt-0.5">
                            <span className="text-gray-600 dark:text-gray-400 text-[8px] font-bold">RS</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-black dark:text-white">RSS Feeds Synced</div>
                            <div className="text-[9px] text-gray-400 dark:text-gray-600 mt-0.5 leading-relaxed">8 feeds refreshed. 89 new articles ingested from arXiv, Nature.</div>
                          </div>
                          <span className="text-[8px] text-gray-400 dark:text-gray-600 shrink-0 mt-1">14m ago</span>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white dark:bg-[#0d0f15] rounded-lg border border-gray-100 dark:border-gray-800 shimmer-effect">
                          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 shrink-0 flex items-center justify-center mt-0.5">
                            <span className="text-gray-600 dark:text-gray-400 text-[8px] font-bold">DD</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-black dark:text-white">Deduplication Complete</div>
                            <div className="text-[9px] text-gray-400 dark:text-gray-600 mt-0.5 leading-relaxed">Removed 42 near-duplicate articles via FAISS similarity.</div>
                          </div>
                          <span className="text-[8px] text-gray-400 dark:text-gray-600 shrink-0 mt-1">1h ago</span>
                        </div>
                     </div>
                     
                     {/* Right Panel — Chart + Stats */}
                     <div className="hidden lg:flex w-[38%] flex-col gap-3 md:gap-4">
                        {/* Mini Bar Chart */}
                        <div className="bg-gray-50 dark:bg-[#111318] rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold text-black dark:text-white">Weekly Ingestion</span>
                            <span className="text-[9px] text-gray-400 dark:text-gray-600 font-medium">Last 7d</span>
                          </div>
                          <div className="flex items-end gap-[6px] flex-1 pb-1">
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-sm h-[35%] shimmer-effect" />
                              <span className="text-[7px] text-gray-400 dark:text-gray-600">M</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-gray-400 dark:bg-gray-600 rounded-sm h-[60%] shimmer-effect" />
                              <span className="text-[7px] text-gray-400 dark:text-gray-600">T</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-gray-500 dark:bg-gray-500 rounded-sm h-[45%] shimmer-effect" />
                              <span className="text-[7px] text-gray-400 dark:text-gray-600">W</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-black dark:bg-white rounded-sm h-[90%] shimmer-effect" />
                              <span className="text-[7px] text-gray-400 dark:text-gray-600">T</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-gray-400 dark:bg-gray-600 rounded-sm h-[55%] shimmer-effect" />
                              <span className="text-[7px] text-gray-400 dark:text-gray-600">F</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-sm h-[30%] shimmer-effect" />
                              <span className="text-[7px] text-gray-400 dark:text-gray-600">S</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-sm h-[20%] shimmer-effect" />
                              <span className="text-[7px] text-gray-400 dark:text-gray-600">S</span>
                            </div>
                          </div>
                        </div>

                        {/* Top Topics */}
                        <div className="bg-gray-50 dark:bg-[#111318] rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-2.5">
                          <span className="text-[11px] font-bold text-black dark:text-white mb-1">Top Clusters</span>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-gray-500 dark:text-gray-500">LLM Reasoning</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full w-[85%] bg-black dark:bg-white rounded-full" /></div>
                              <span className="text-[8px] font-bold text-black dark:text-white">85%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-gray-500 dark:text-gray-500">Protein Folding</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full w-[62%] bg-gray-500 dark:bg-gray-500 rounded-full" /></div>
                              <span className="text-[8px] font-bold text-black dark:text-white">62%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-gray-500 dark:text-gray-500">Quantum Computing</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full w-[41%] bg-gray-400 dark:bg-gray-600 rounded-full" /></div>
                              <span className="text-[8px] font-bold text-black dark:text-white">41%</span>
                            </div>
                          </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-gray-800 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Pipeline Automation</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto transition-colors duration-300">
              A robust architecture designed to process vast amounts of unstructured data and deliver cohesive insights autonomously.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Database />}
              title="Semantic Deduplication"
              description="Uses FAISS embeddings to compute semantic similarity and filter out near-identical articles across all configured feeds."
            />
            <FeatureCard 
              icon={<Zap />}
              title="K-Means Clustering"
              description="Groups unique articles into coherent topic clusters automatically, eliminating manual tagging and sorting."
            />
            <FeatureCard 
              icon={<Shield />}
              title="LLM Synthesis"
              description="LangChain-driven pipelines synthesise each cluster into a single, cohesive human-readable briefing."
            />
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-[#111318] border-t border-gray-100 dark:border-gray-800 py-12 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-black dark:bg-white rounded flex items-center justify-center">
              <span className="text-white dark:text-black font-bold font-serif text-[10px]">A</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white transition-colors duration-300">A.R.I.A</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
            © {new Date().getFullYear()} A.R.I.A Research Intelligence. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white dark:bg-[#1a1d27] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-14 h-14 bg-gray-100 dark:bg-[#0f1117] text-black dark:text-white rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 leading-relaxed transition-colors duration-300">
        {description}
      </p>
    </div>
  );
}
