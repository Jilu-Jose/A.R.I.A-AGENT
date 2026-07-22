import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Terminal, User, Mail, Crown, Settings as SettingsIcon, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string>('');
  const navigate = useNavigate();

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/settings/logs');
      setLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ArrowLeft size={16} /> Go Back
        </button>
        <button onClick={() => navigate('/')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <Home size={16} /> Home
        </button>
      </div>

      <div className="flex items-center gap-3">
        <SettingsIcon size={28} className="text-gray-400" />
        <div>
          <h1 className="text-3xl font-bold font-serif">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Account profile and system preferences</p>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold mb-6">Account Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#1e2030] rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
              <User size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">Username</div>
              <div className="font-semibold text-black dark:text-white">{user?.username}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#1e2030] rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
              <Mail size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">Email Address</div>
              <div className="font-semibold text-black dark:text-white">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#1e2030] rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
              <Crown size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">Account Tier</div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm">
                Tier {user?.payment_tier}
              </div>
            </div>
          </div>
          {user?.role && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#1e2030] rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
                <User size={20} />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">Role</div>
                <div className="font-semibold text-black dark:text-white capitalize">{user.role}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Engine Logs */}
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center">
              <Terminal size={20} />
            </div>
            <h3 className="text-lg font-bold">System Logs</h3>
          </div>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all"
          >
            Refresh
          </button>
        </div>
        <pre className="bg-gray-900 text-green-400 p-5 rounded-xl font-mono text-sm overflow-x-auto max-h-96 whitespace-pre-wrap shadow-inner leading-relaxed">
          {logs || "No logs available."}
        </pre>
      </div>
    </div>
  );
}
