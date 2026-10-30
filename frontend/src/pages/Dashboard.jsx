import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Smartphone,
  PhoneCall,
  Radio,
  HelpCircle,
  Database,
  ArrowUpRight,
  RefreshCw,
  Cpu,
  Layers,
  Search,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ setActivePage, setSelectedJobId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = data?.stats || {};
  const system = data?.system || {};
  const recentJobs = data?.recent_jobs || [];

  const validRate = stats.total_validations > 0
    ? ((stats.total_valid / stats.total_validations) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Enterprise US Validation Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            High-Volume US Phone Intelligence & Validation
          </h2>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Ultra-fast single lookups and scalable bulk processing capable of validating up to 1,000,000 numbers per job.
            Accurate line-type classification (Mobile, Landline, VoIP, Toll-free) with complete Excel and CSV reporting.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActivePage('bulk')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Layers className="h-4 w-4" /> Start Bulk Job (Up to 1M)
            </button>
            <button
              onClick={() => setActivePage('single')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm px-5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <Search className="h-4 w-4" /> Single Lookup
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Validations</span>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {stats.total_validations?.toLocaleString() || 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Across <span className="text-slate-300 font-semibold">{stats.total_bulk_jobs || 0}</span> bulk jobs & API requests
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Valid Numbers</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400 tracking-tight">
              {stats.total_valid?.toLocaleString() || 0}
            </span>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-950/60 px-2 py-0.5 rounded">
              {validRate}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Confirmed active NANPA assigned numbers
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Invalid Numbers</span>
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-400 tracking-tight">
              {stats.total_invalid?.toLocaleString() || 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Invalid prefixes, lengths, or unassigned codes
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Engine Performance</span>
            <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {system.memory_usage_mb || 0} <span className="text-base text-slate-400 font-normal">MB</span>
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Streaming zero-RAM-exhaustion mode
          </div>
        </div>
      </div>

      {/* Line Type Breakdown Cards */}
      <div>
        <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-4">
          US Line Type Classification Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Smartphone className="h-4 w-4" />
              <span className="text-xs font-semibold">Mobile / Wireless</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.mobile_count?.toLocaleString() || 0}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <PhoneCall className="h-4 w-4" />
              <span className="text-xs font-semibold">Landline / Wireline</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.landline_count?.toLocaleString() || 0}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Radio className="h-4 w-4" />
              <span className="text-xs font-semibold">VoIP (Fixed & Non-Fixed)</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.voip_count?.toLocaleString() || 0}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold">Toll-Free</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.toll_free_count?.toLocaleString() || 0}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs font-semibold">Unknown / Other</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.unknown_count?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bulk Jobs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Recent Bulk Validation Jobs</h3>
            <p className="text-xs text-slate-400">Latest files processed by the background engine</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboard}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={() => setActivePage('history')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              View All History <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Filename</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Progress</th>
                <th className="px-6 py-3 font-semibold">Total Records</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentJobs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                    No bulk jobs uploaded yet. Launch your first validation job!
                  </td>
                </tr>
              ) : (
                recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {job.filename}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          job.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : job.status === 'Processing'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : job.status === 'Paused'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : job.status === 'Cancelled'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{job.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {job.processed_records?.toLocaleString()} / {job.total_records?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setActivePage('job-detail');
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all"
                      >
                        Open Results
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
