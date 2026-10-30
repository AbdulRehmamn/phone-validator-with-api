import React from 'react';
import {
  LayoutDashboard,
  Search,
  Layers,
  History,
  FileCode,
  Key,
  Settings,
  ShieldCheck,
  Server,
  Activity
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, systemStatus }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'single', label: 'Single Lookup', icon: Search },
    { id: 'bulk', label: 'Bulk Validator', icon: Layers },
    { id: 'history', label: 'Bulk History', icon: History },
    { id: 'docs', label: 'API Documentation', icon: FileCode },
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'admin', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div>
        {/* Logo / Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-tight">US Phone Validator</h1>
            <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">Enterprise Platform</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Menu
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-300">Engine Online</span>
            </div>
            <span className="text-[10px] font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-slate-400" /> Max Capacity
            </span>
            <span className="text-slate-200 font-semibold">1,000,000 / Job</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
