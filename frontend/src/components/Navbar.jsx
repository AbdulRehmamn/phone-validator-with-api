import React from 'react';
import { ExternalLink, Terminal, Shield, Zap } from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Operations Dashboard';
      case 'single': return 'Single Phone Lookup';
      case 'bulk': return 'Bulk Phone Validator';
      case 'history': return 'Bulk Validation History';
      case 'job-detail': return 'Job Results & Analytics';
      case 'docs': return 'Developer API Reference';
      case 'keys': return 'API Keys & Access Tokens';
      case 'admin': return 'Platform Architecture & Settings';
      default: return 'US Phone Number Validation Platform';
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white tracking-tight">{getPageTitle()}</h2>
        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
          <Zap className="h-3 w-3 text-indigo-400" /> High-Throughput
        </span>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
        >
          <Terminal className="h-3.5 w-3.5 text-indigo-400" />
          Interactive Swagger Docs
          <ExternalLink className="h-3 w-3 text-slate-400 ml-0.5" />
        </a>

        <div className="h-4 w-px bg-slate-800"></div>

        <div className="flex items-center gap-2 pl-2">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
            US
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">Admin Account</div>
            <div className="text-[10px] text-emerald-400 font-medium">Full Access</div>
          </div>
        </div>
      </div>
    </header>
  );
}
