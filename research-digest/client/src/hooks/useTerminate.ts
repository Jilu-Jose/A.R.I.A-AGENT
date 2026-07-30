import { useRef, useCallback } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';

/**
 * Provides terminate + abort-controller plumbing for any agent page.
 *
 * Usage:
 *   const { abortRef, terminate } = useTerminate('paper_analyst', setIsRunning);
 *
 *   // Before fetching:
 *   abortRef.current = new AbortController();
 *   fetch('/api/...', { signal: abortRef.current.signal });
 *
 *   // Terminate button onClick:
 *   terminate();
 */
export function useTerminate(agentName: string, setIsRunning: (v: boolean) => void) {
  const abortRef = useRef<AbortController | null>(null);

  /** Call this once at the start of handleRun to get a fresh signal */
  const newSignal = useCallback((): AbortSignal => {
    abortRef.current = new AbortController();
    return abortRef.current.signal;
  }, []);

  /** Terminate: abort the in-flight fetch AND kill the server-side task */
  const terminate = useCallback(async () => {
    // 1. Abort the fetch / SSE stream immediately
    abortRef.current?.abort();
    // 2. Update UI
    setIsRunning(false);
    // 3. Signal the server to cancel the task
    try {
      await api.post(`/agents/terminate/${agentName}`);
    } catch {
      // ignore – the main goal was the client-side abort
    }
    toast(`Agent stopped.`, { icon: '🛑', style: { background: '#1a1d27', color: '#fff', border: '1px solid #333' } });
  }, [agentName, setIsRunning]);

  return { abortRef, newSignal, terminate };
}
