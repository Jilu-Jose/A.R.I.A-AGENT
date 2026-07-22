import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { AGENTS_LIST } from '../utils/agents';
import {
  LayoutDashboard, Archive, BookOpen, Settings, LogOut,
  MessageSquare, Shield, BarChart2, Rss, Compass
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const { user, logout } = useAuth();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 overflow-hidden whitespace-nowrap ${
      isActive
        ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-black dark:hover:text-white'
    }`;

  const sectionLabel = (text: string) =>
    !collapsed && (
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 mt-4 first-of-type:mt-0 transition-all">
        {text}
      </div>
    );

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-[#111318] border-r border-gray-200 dark:border-gray-800 shrink-0 z-20 transition-all duration-300 ease-in-out overflow-hidden ${
        collapsed ? 'w-[60px]' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 shrink-0 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white dark:text-black font-bold font-serif text-base">A</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-bold text-base tracking-tight text-black dark:text-white block">A.R.I.A</span>
              <div className="text-[10px] text-gray-400 leading-none">Research Agent</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {sectionLabel('Research')}
        <NavLink to="/dashboard" end className={navClass} title={collapsed ? 'Dashboard' : undefined}>
          <LayoutDashboard size={18} className="shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>
        <NavLink to="/dashboard/archives" className={navClass} title={collapsed ? 'Archives' : undefined}>
          <Archive size={18} className="shrink-0" />
          {!collapsed && <span>Archives</span>}
        </NavLink>
        <NavLink to="/dashboard/library" className={navClass} title={collapsed ? 'Library' : undefined}>
          <BookOpen size={18} className="shrink-0" />
          {!collapsed && <span>Library</span>}
        </NavLink>
        <NavLink to="/dashboard/resources" className={navClass} title={collapsed ? 'Resources' : undefined}>
          <Rss size={18} className="shrink-0" />
          {!collapsed && <span>Resources</span>}
        </NavLink>
        <NavLink to="/dashboard/explore" className={navClass} title={collapsed ? 'Explore' : undefined}>
          <Compass size={18} className="shrink-0" />
          {!collapsed && <span>Explore</span>}
        </NavLink>

        {sectionLabel('Insights')}
        <NavLink to="/dashboard/analytics" className={navClass} title={collapsed ? 'Analytics' : undefined}>
          <BarChart2 size={18} className="shrink-0" />
          {!collapsed && <span>Analytics</span>}
        </NavLink>
        <NavLink to="/dashboard/chat" className={navClass} title={collapsed ? 'A.R.I.A Chat' : undefined}>
          <MessageSquare size={18} className="shrink-0" />
          {!collapsed && <span>A.R.I.A Chat</span>}
        </NavLink>

        {sectionLabel('Agents')}
        {AGENTS_LIST.map(agent => (
          <NavLink key={agent.id} to={`/dashboard/agents/${agent.id}`} className={navClass} title={collapsed ? agent.name : undefined}>
            <agent.icon size={18} className="shrink-0" />
            {!collapsed && <span>{agent.name}</span>}
          </NavLink>
        ))}

        {sectionLabel('System')}
        <NavLink to="/dashboard/settings" className={navClass} title={collapsed ? 'Settings' : undefined}>
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        {user?.is_admin && (
          <NavLink to="/dashboard/admin" className={navClass} title={collapsed ? 'Admin Panel' : undefined}>
            <Shield size={18} className="shrink-0" />
            {!collapsed && <span>Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-sm shrink-0">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-black dark:text-white">{user?.username}</div>
              <div className="text-[11px] text-gray-400 truncate">{user?.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
