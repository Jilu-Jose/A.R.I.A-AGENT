import React from 'react';
import { Square } from 'lucide-react';

interface Props {
  show: boolean;
  onTerminate: () => void;
}

/**
 * A red "Stop" button shown only when an agent is running.
 * Uses `show` (= isRunning) to mount/unmount.
 */
export default function TerminateButton({ show, onTerminate }: Props) {
  if (!show) return null;
  return (
    <button
      onClick={onTerminate}
      title="Terminate execution"
      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold rounded-xl transition-all duration-150 shadow-sm"
    >
      <Square size={14} fill="currentColor" />
      Stop
    </button>
  );
}
