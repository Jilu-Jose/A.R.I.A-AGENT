import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`absolute top-full left-0 right-0 mt-1 px-3 py-2 rounded-xl text-xs font-medium shadow-lg z-50 animate-fade-in ${
      type === 'success'
        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
    }`}>
      {message}
    </div>
  );
}

export default function Topbar({ onToggleSidebar, sidebarOpen }: TopbarProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearching(true);
    try {
      const formData = new FormData();
      formData.append('query', query);
      const { data } = await api.post('/dashboard/search', formData);
      setSearchQuery('');
      showToast(data.message || 'Paper pinned!', 'success');
      navigate('/library');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to pin paper.', 'error');
    } finally {
      setSearching(false);
    }
  };

  return (
    <header className="h-14 flex items-center gap-3 pr-4 pl-2 bg-white dark:bg-[#0f1117] border-b border-gray-200 dark:border-gray-800 z-10 shrink-0 transition-colors duration-200">
      {/* Sidebar toggle button */}
      <button
        onClick={onToggleSidebar}
        className="p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white transition-colors shrink-0"
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen
          ? <PanelLeftClose size={19} />
          : <PanelLeftOpen size={19} />
        }
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-sm hidden md:block">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={14} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Paste URL or search arXiv to pin a paper..."
          disabled={searching}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1a1d27] text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-white transition-all disabled:opacity-60"
        />
        {toast && <Toast message={toast.message} type={toast.type} />}
      </form>

      {/* Right controls */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white transition-colors"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
