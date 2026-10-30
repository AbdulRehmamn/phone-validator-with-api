import React, { useState, useEffect } from 'react';
import {
  History,
  FileSpreadsheet,
  Download,
  Trash2,
  RotateCcw,
  Play,
  Pause,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function BulkHistory({ setActivePage, setSelectedJobId }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getBulkHistory();
      setJobs(data);
    } catch (err) {
      setError('Failed to fetch bulk job history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this bulk job and all its validation records?')) {
      return;
    }
    try {
      await api.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.job_id !== jobId));
    } catch (err) {
      alert('Failed to delete job.');
    }
  };

  const handleRetry = async (jobId) => {
    try {
      await api.retryJob(jobId);
      fetchHistory();
    } catch (err) {
      alert('Failed to retry job.');
    }
  };

  const handleDownload = (jobId, format) => {
    const url = api.getExportUrl(jobId, format, 'all');
    window.open(url, '_blank');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Completed
          </span>
        );
      case 'Processing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
            Processing
          </span>
        );
      case 'Paused':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Paused
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Cancelled
          </span>
        );
      case 'Failed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Bulk Validation History</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage all past bulk jobs, review validation statistics, inspect records, and download Excel/CSV files.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 self-start"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Job / Filename</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total Records</th>
                <th className="px-6 py-4">Valid / Invalid</th>
                <th className="px-6 py-4">Line Type Breakdown</th>
                <th className="px-6 py-4">Uploaded Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                      Loading bulk history...
                    </span>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No bulk jobs found. Upload a file on the Bulk Validator page to get started.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.job_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white text-sm">{job.filename}</div>
                      <div className="font-mono text-slate-400 text-[11px]">{job.job_id}</div>
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(job.status)}</td>

                    <td className="px-6 py-4 font-mono">
                      <div>{job.total_records?.toLocaleString()} records</div>
                      <div className="text-[11px] text-slate-400">{job.percentage}% processed</div>
                    </td>

                    <td className="px-6 py-4 font-mono">
                      <div className="text-emerald-400 font-semibold">{job.valid_count?.toLocaleString()} Valid</div>
                      <div className="text-rose-400">{job.invalid_count?.toLocaleString()} Invalid</div>
                    </td>

                    <td className="px-6 py-4 text-[11px] space-y-0.5">
                      <div className="text-blue-400 font-mono">📱 {job.mobile_count?.toLocaleString()} Mobile</div>
                      <div className="text-indigo-400 font-mono">☎️ {job.landline_count?.toLocaleString()} Landline</div>
                      <div className="text-purple-400 font-mono">🌐 {job.voip_count?.toLocaleString()} VOIP</div>
                      <div className="text-amber-400 font-mono">⭐ {job.toll_free_count?.toLocaleString()} Toll-Free</div>
                    </td>

                    <td className="px-6 py-4 text-slate-400 text-[11px]">
                      {job.created_at ? new Date(job.created_at).toLocaleString() : '-'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedJobId(job.job_id);
                            setActivePage('job-detail');
                          }}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-colors"
                          title="View Results"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDownload(job.job_id, 'xlsx')}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-colors"
                          title="Download Excel (.xlsx)"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDownload(job.job_id, 'csv')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          title="Download CSV (.csv)"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        {['Failed', 'Cancelled'].includes(job.status) && (
                          <button
                            onClick={() => handleRetry(job.job_id)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors"
                            title="Retry Job"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(job.job_id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
