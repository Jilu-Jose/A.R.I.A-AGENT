import React, { useState, useEffect, useRef } from 'react';
import { Activity, Play, CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api';
import toast from 'react-hot-toast';

export default function AgentStudio() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActive = async () => {
    try {
      const { data } = await api.get('/agents/active');
      setAgents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    try {
      await api.post('/agents/simulate');
      toast.success("Simulation started");
      fetchActive();
    } catch (e) {
      toast.error("Failed to start simulation");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
       <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-3">
           <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-2xl flex items-center justify-center shadow-sm">
             <Activity size={24} />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agent Studio</h1>
             <p className="text-gray-500 text-sm mt-0.5">Live monitoring of autonomous agent workflows</p>
           </div>
         </div>
         <button onClick={handleSimulate} className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-semibold hover:scale-105 active:scale-95 transition-all shadow-md">
            <Play size={18} fill="currentColor" /> Simulate Agent Run
         </button>
       </div>

       {loading ? (
         <div className="text-center py-32 text-gray-400 flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#1a1d27] rounded-3xl border border-gray-100 dark:border-gray-800">
           <Loader2 size={32} className="animate-spin text-blue-500" />
           <span className="font-medium text-gray-500">Connecting to Agent Network...</span>
         </div>
       ) : agents.length === 0 ? (
         <div className="text-center py-32 bg-white dark:bg-[#1a1d27] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity size={32} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Active Agents</h3>
            <p className="text-gray-500 max-w-md mx-auto leading-relaxed">Trigger an agent from the Agents menu or run a simulation to see the live workflow graph.</p>
         </div>
       ) : (
         <div className="space-y-8">
            {agents.map((agent) => (
               <AgentWorkflowGraph key={agent.id} agent={agent} />
            ))}
         </div>
       )}
    </div>
  );
}

function AgentWorkflowGraph({ agent }: { agent: any }) {
    const steps = Array.from({length: agent.total_steps || 5}, (_, i) => i);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [agent.logs]);
    
    return (
        <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
           <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-md">
              <div>
                 <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-3">
                    {agent.agent_name}
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-200/50 dark:bg-gray-800 px-2 py-0.5 rounded-full uppercase tracking-widest border border-gray-300/50 dark:border-gray-700">ID: {agent.id}</span>
                 </h3>
                 <div className="text-xs text-gray-400 mt-1.5 font-medium">Last updated: {new Date(agent.updated_at).toLocaleTimeString()}</div>
              </div>
              <div className="flex items-center gap-2">
                 {agent.status === 'running' && <span className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full text-xs font-bold uppercase tracking-widest shadow-inner"><Loader2 size={14} className="animate-spin" /> Running</span>}
                 {agent.status === 'completed' && <span className="flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-widest shadow-inner"><CheckCircle2 size={14} /> Completed</span>}
                 {agent.status === 'error' && <span className="flex items-center gap-2 px-4 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-widest shadow-inner"><AlertCircle size={14} /> Error</span>}
              </div>
           </div>
           
           <div className="p-10">
              {/* Workflow Graph */}
              <div className="relative flex items-center justify-between max-w-4xl mx-auto mb-14 mt-6">
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                   <div 
                         className="h-full bg-black dark:bg-white transition-all duration-1000 ease-out"
                         style={{ width: `${(agent.current_step_index / Math.max(1, agent.total_steps - 1)) * 100}%` }}
                     />
                 </div>
                 
                 {steps.map((stepIndex) => {
                    const isCompleted = stepIndex < agent.current_step_index || agent.status === 'completed';
                    const isCurrent = stepIndex === agent.current_step_index && agent.status === 'running';
                    const isError = stepIndex === agent.current_step_index && agent.status === 'error';
                    
                    return (
                        <div key={stepIndex} className="relative z-10 flex flex-col items-center group">
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[8px] border-white dark:border-[#1a1d27] transition-all duration-500 shadow-sm ${
                                 isCompleted ? 'bg-black dark:bg-white' : 
                                 isError ? 'bg-red-500' :
                                 isCurrent ? 'bg-black dark:bg-white animate-pulse ring-4 ring-black/10 dark:ring-white/20 shadow-[0_0_20px_rgba(0,0,0,0.15)] dark:shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'bg-gray-200 dark:bg-gray-700'
                             }`}>
                                 {isCompleted ? <CheckCircle2 size={18} className="text-white dark:text-black" /> : 
                                  isError ? <AlertCircle size={18} className="text-white" /> :
                                  isCurrent ? <Loader2 size={18} className="text-white dark:text-black animate-spin" /> : 
                                  <Circle size={12} className="text-gray-400 dark:text-gray-500" fill="currentColor" />}
                            </div>
                            
                            <div className="absolute top-14 w-40 text-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 dark:bg-white/90 text-white dark:text-black text-[11px] font-bold py-1.5 px-3 rounded-lg backdrop-blur-sm pointer-events-none shadow-xl transform translate-y-2 group-hover:translate-y-0 duration-200">
                                Step {stepIndex + 1}
                            </div>
                        </div>
                    )
                 })}
              </div>
              
              <div className="text-center mb-10 bg-gray-50 dark:bg-gray-800/30 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm max-w-2xl mx-auto">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Current Phase</span>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {agent.current_step_name || "Waiting..."}
                </h4>
              </div>

              {/* Terminal / Logs */}
              <div className="bg-[#0f1117] border border-gray-800 rounded-2xl p-6 font-mono text-[13px] text-gray-300 overflow-y-auto h-72 shadow-inner relative" ref={scrollRef}>
                <div className="sticky top-0 right-0 float-right px-2 py-1 bg-white/10 rounded text-[10px] font-bold text-white/50 backdrop-blur-md mb-2">TERMINAL</div>
                {agent.logs ? agent.logs.split('\n').filter(Boolean).map((line: string, i: number) => (
                    <div key={i} className="mb-2 leading-relaxed">
                        <span className="text-gray-500 select-none mr-3 opacity-70">❯</span>
                        <span dangerouslySetInnerHTML={{
                          __html: line.replace(/\[\d{2}:\d{2}:\d{2}\]/g, '<span class="text-gray-500 mr-2">$&</span>')
                                      .replace(/Error:/g, '<span class="text-red-400 font-bold">Error:</span>')
                                      .replace(/Complete/g, '<span class="text-green-400 font-bold">Complete</span>')
                        }} />
                    </div>
                )) : (
                   <div className="text-gray-600 flex items-center gap-3 mt-4 ml-2">
                     <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 animate-pulse"></span> Waiting for agent logs...
                   </div>
                )}
              </div>
           </div>
        </div>
    )
}
