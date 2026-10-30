import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Smartphone,
  PhoneCall,
  Radio,
  Sparkles,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function BulkJobDetail({ jobId, setActivePage }) {
  const [job, setJob] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [exportFilter, setExportFilter] = useState('all');

  const fetchJobData = async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      const [jobRes, resultsRes] = await Promise.all([
        api.getJobStatus(jobId),
        api.getJobResults(jobId, page, pageSize, filterType, search)
      ]);
      setJob(jobRes);
      setResultsData(resultsRes);
    } catch (err) {
      console.error('Failed to load job details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData();
  }, [jobId, page, pageSize, filterType, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleFilterChange = (ft) => {
    setFilterType(ft);
    setPage(1);
  };

  const handleDownload = (format) => {
    if (!jobId) return;
    const url = api.getExportUrl(jobId, format, exportFilter);
    window.open(url, '_blank');
  };

  const getLineTypeBadge = (lineType) => {
    switch (lineType) {
      case 'MOBILE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Smartphone className="h-3 w-3" /> Mobile
          </span>
        );
      case 'LANDLINE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <PhoneCall className="h-3 w-3" /> Landline
          </span>
        );
      case 'VOIP':
      case 'FIXED_VOIP':
      case 'NON_FIXED_VOIP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Radio className="h-3 w-3" /> {lineType.replace('_', ' ')}
          </span>
        );
      case 'TOLL_FREE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="h-3 w-3" /> Toll-Free
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="h-3 w-3" /> {lineType}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActivePage('history')}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{job?.filename || 'Job Details'}</h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  job?.status === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}
              >
                {job?.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Job ID: {jobId}</p>
          </div>
        </div>

        {/* Download Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={exportFilter}
            onChange={(e) => setExportFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
          >
            <option value="all">Export All</option>
            <option value="valid">Valid Only</option>
            <option value="invalid">Invalid Only</option>
            <option value="mobile">Mobile Only</option>
            <option value="landline">Landline Only</option>
            <option value="voip">VOIP Only</option>
            <option value="toll_free">Toll-Free Only</option>
            <option value="unknown">Unknown Only</option>
          </select>

          <button
            onClick={() => handleDownload('xlsx')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Excel (.xlsx)
          </button>

          <button
            onClick={() => handleDownload('csv')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> CSV (.csv)
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {job && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Total</span>
            <div className="text-lg font-bold text-white">{job.total_records?.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-semibold uppercase text-emerald-400">Valid</span>
            <div className="text-lg font-bold text-emerald-400">{job.valid_count?.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-semibold uppercase text-rose-400">Invalid</span>
            <div className="text-lg font-bold text-rose-400">{job.invalid_count?.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-semibold uppercase text-blue-400">Mobile</span>
            <div className="text-lg font-bold text-blue-400">{job.mobile_count?.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-semibold uppercase text-indigo-400">Landline</span>
            <div className="text-lg font-bold text-indigo-400">{job.landline_count?.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-semibold uppercase text-purple-400">VOIP</span>
            <div className="text-lg font-bold text-purple-400">{job.voip_count?.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-semibold uppercase text-amber-400">Toll-Free</span>
            <div className="text-lg font-bold text-amber-400">{job.toll_free_count?.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Records' },
              { id: 'valid', label: 'Valid' },
              { id: 'invalid', label: 'Invalid' },
              { id: 'mobile', label: 'Mobile' },
              { id: 'landline', label: 'Landline' },
              { id: 'voip', label: 'VOIP' },
              { id: 'toll_free', label: 'Toll-Free' },
              { id: 'unknown', label: 'Unknown' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => handleFilterChange(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-72">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search number, carrier, city..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results Data Table */}
        <div className="border border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Original Input</th>
                <th className="px-4 py-3">Normalized (E.164)</th>
                <th className="px-4 py-3">Formatted National</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Line Type</th>
                <th className="px-4 py-3">Carrier</th>
                <th className="px-4 py-3">Location (City, State)</th>
                <th className="px-4 py-3">Error / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-400">
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                      Loading results...
                    </span>
                  </td>
                </tr>
              ) : resultsData?.results?.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-10 text-center text-slate-400">
                    No matching validation records found.
                  </td>
                </tr>
              ) : (
                resultsData?.results?.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-200">
                      {row.original_number}
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-300">
                      {row.normalized_number}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {row.formatted_national || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {row.is_valid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> VALID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                          <XCircle className="h-3.5 w-3.5" /> INVALID
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getLineTypeBadge(row.line_type)}</td>
                    <td className="px-4 py-3 text-slate-300 font-medium">
                      {row.carrier || <span className="text-slate-400 italic">Unknown</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.city && row.state ? `${row.city}, ${row.state}` : row.state || row.city || '-'}
                    </td>
                    <td className="px-4 py-3 text-rose-300 text-[11px]">
                      {row.error_message || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {resultsData && resultsData.total_pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-400">
            <div>
              Showing <strong className="text-slate-200">{(page - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-slate-200">
                {Math.min(page * pageSize, resultsData.total_count)}
              </strong>{' '}
              of <strong className="text-slate-200">{resultsData.total_count?.toLocaleString()}</strong> records
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="font-mono text-slate-300 px-2">
                Page {page} of {resultsData.total_pages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(resultsData.total_pages, p + 1))}
                disabled={page === resultsData.total_pages}
                className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
