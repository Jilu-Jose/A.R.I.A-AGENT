import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Shield, CheckCircle, XCircle, DollarSign, ChevronDown, ChevronUp, FileText, User, ExternalLink, Server, Cpu } from 'lucide-react';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string | null;
  payment_tier: number;
  payment_status: boolean;
  is_approved: boolean;
  created_at: string;
  reason_for_access: string | null;
  verification_doc_path: string | null;
}

const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 — Basic',
  2: 'Tier 2 — Pro',
  3: 'Tier 3 — Enterprise',
};

export default function Admin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [systemInfo, setSystemInfo] = useState<{agents: any[], mcp_servers: any[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const { data } = await api.get('/admin/system');
      setSystemInfo(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchSystemInfo()]).finally(() => setLoading(false));
  }, []);

  const approveUser = async (id: number) => {
    try {
      await api.post(`/admin/users/${id}/approve`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to approve user.");
    }
  };

  const rejectUser = async (id: number) => {
    if (!confirm("Are you sure you want to reject and delete this user?")) return;
    try {
      await api.post(`/admin/users/${id}/reject`);
      fetchUsers();
    } catch (err) {
      alert("Failed to reject user.");
    }
  };

  const togglePayment = async (id: number) => {
    try {
      await api.post(`/admin/users/${id}/toggle_payment`);
      fetchUsers();
    } catch (err) {
      alert("Failed to toggle payment status.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin" />
          <span>Loading admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-8 flex items-center gap-3">
        <Shield size={28} className="text-gray-400" />
        <div>
          <h1 className="text-3xl font-bold font-serif">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage user registrations and platform access</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center">
          <div className="text-2xl font-bold text-black dark:text-white">{users.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total Users</div>
        </div>
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center">
          <div className="text-2xl font-bold text-black dark:text-white">{users.filter(u => u.is_approved).length}</div>
          <div className="text-sm text-gray-500 mt-1">Approved</div>
        </div>
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center">
          <div className="text-2xl font-bold text-black dark:text-white">{users.filter(u => !u.is_approved).length}</div>
          <div className="text-sm text-gray-500 mt-1">Pending</div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-[#13151f] text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Date Applied</th>
                <th className="px-6 py-4 font-medium text-center">Payment Status</th>
                <th className="px-6 py-4 font-medium text-center">Approval</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map(user => (
                <React.Fragment key={user.id}>
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-[#1e2030]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">
                          {user.username[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-black dark:text-white flex items-center gap-2">
                            {user.username}
                            {user.role && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase">
                                {user.role}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => togglePayment(user.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.payment_status
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                        }`}
                        title="Click to toggle payment status"
                      >
                        <DollarSign size={14} />
                        {user.payment_status ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.is_approved
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {user.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Expand details */}
                        <button
                          onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="View details"
                        >
                          {expandedId === user.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {!user.is_approved && (
                          <button
                            onClick={() => approveUser(user.id)}
                            className={`p-2 rounded-xl transition-colors ${user.payment_status ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-300 cursor-not-allowed'}`}
                            title={user.payment_status ? "Approve User" : "Payment verification required"}
                            disabled={!user.payment_status}
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => rejectUser(user.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          title="Reject & Delete"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable detail row */}
                  {expandedId === user.id && (
                    <tr>
                      <td colSpan={5} className="px-6 py-5 bg-gray-50/50 dark:bg-[#13151f]/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl">
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Requested Tier</div>
                            <div className="text-sm font-semibold text-black dark:text-white">
                              {TIER_LABELS[user.payment_tier] || `Tier ${user.payment_tier}`}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Reason for Access</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {user.reason_for_access || <span className="text-gray-400 italic">Not provided</span>}
                            </div>
                          </div>
                          {user.verification_doc_path && (
                            <div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Verification Document</div>
                              <a
                                href={`/api/admin/users/${user.id}/document`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all"
                              >
                                <FileText size={14} />
                                View ID Document
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <User size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No users in the system</p>
                    <p className="text-sm mt-1">New user registrations will appear here</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Status Section */}
      {systemInfo && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Agents */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Cpu size={24} className="text-gray-400" />
              <h2 className="text-xl font-bold text-black dark:text-white">Active Agents</h2>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {systemInfo.agents.map((agent: any) => (
                <div key={agent.id} className="flex items-start justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-800/20">
                  <div>
                    <div className="font-semibold text-sm text-black dark:text-white">{agent.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{agent.description}</div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-black dark:bg-gray-800 dark:text-white shrink-0">
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MCP Servers */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Server size={24} className="text-gray-400" />
              <h2 className="text-xl font-bold text-black dark:text-white">MCP Connectors</h2>
            </div>
            <div className="space-y-4">
              {systemInfo.mcp_servers.map((mcp: any) => (
                <div key={mcp.id} className="flex items-start justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-800/20">
                  <div>
                    <div className="font-semibold text-sm text-black dark:text-white">{mcp.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{mcp.type}</div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-black dark:bg-gray-800 dark:text-white shrink-0">
                    {mcp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
