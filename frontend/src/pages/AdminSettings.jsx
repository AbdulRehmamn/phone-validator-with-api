import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Sliders,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminSettings() {
  const [system, setSystem] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [sysRes, usageRes] = await Promise.all([
        api.getSystemStatus(),
        api.getUsageStats()
      ]);
      setSystem(sysRes);
      setUsage(usageRes);
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System & High-Volume Architecture</h2>
          <p className="text-sm text-slate-400 mt-1">
            Engine resource monitoring, background worker orchestration, and high-volume unlimited usage settings.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 self-start cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* System Resource Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Process Memory</span>
            <Cpu className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {system?.memory_usage_mb || 0} <span className="text-xs font-normal text-slate-400">MB</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Zero-RAM-Leak Streaming
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Worker Status</span>
            <Server className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {system?.active_background_jobs || 0} Active
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Auto-scaling threadpool
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Database Engine</span>
            <Database className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            SQLite WAL
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            High Concurrency + Postgres ready
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Avg API Latency</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {usage?.avg_response_time_ms || 0} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Sub-millisecond single checks
          </div>
        </div>
      </div>

      {/* Architecture Configuration Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-400" /> 1-Million-Record Processing Engine Settings
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Parameters configured for zero-RAM degradation and horizontal scalability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="font-semibold text-white">Application Quota Limit</div>
            <div className="text-xs text-slate-400 mt-1">
              Unlimited processing enabled. No artificial daily or monthly caps imposed at the application layer.
            </div>
            <div className="mt-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Unlimited Mode Active
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="font-semibold text-white">Chunk & Batch Insert Size</div>
            <div className="text-xs text-slate-400 mt-1">
              Files are streamed and inserted in batches of 1,000 records using bulk SQL mapping to keep RAM constant.
            </div>
            <div className="mt-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                CHUNK_SIZE = 1,000 records
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="font-semibold text-white">Streaming File Processing</div>
            <div className="text-xs text-slate-400 mt-1">
              CSV, TXT, and XLSX files are read line-by-line / read-only iterator. Never loaded all at once into browser or server RAM.
            </div>
            <div className="mt-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Constant O(1) Memory Footprint
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="font-semibold text-white">Carrier Intelligence & Licensing</div>
            <div className="text-xs text-slate-400 mt-1">
              Integrates Google libphonenumber, US NANPA database, and carrier intelligence heuristics. Unknown line types default to UNKNOWN without hallucination.
            </div>
            <div className="mt-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Deterministic Accuracy
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
