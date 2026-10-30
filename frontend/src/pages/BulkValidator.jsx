import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Ban,
  CheckCircle2,
  XCircle,
  Smartphone,
  PhoneCall,
  Radio,
  Sparkles,
  HelpCircle,
  Download,
  AlertCircle,
  Clock,
  Zap,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function BulkValidator({ setActivePage, setSelectedJobId }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  
  // Upload and Inspection state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [inspectionData, setInspectionData] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('');
  
  // Active Running Job state
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [exportFilter, setExportFilter] = useState('all');
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Poll active job status
  useEffect(() => {
    if (!activeJobId) return;

    const fetchStatus = async () => {
      try {
        const data = await api.getJobStatus(activeJobId);
        setJobStatus(data);
        if (data.status === 'Completed' || data.status === 'Failed' || data.status === 'Cancelled') {
          // stop fast polling
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    };

    fetchStatus();
    pollIntervalRef.current = setInterval(fetchStatus, 1500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeJobId]);

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['csv', 'txt', 'xls', 'xlsx'].includes(ext)) {
      setError('Unsupported file type. Please upload a .CSV, .TXT, .XLS, or .XLSX file.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const data = await api.uploadFile(selectedFile, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setUploadProgress(percent);
      });
      setInspectionData(data);
      setActiveJobId(data.job_id);
      setSelectedColumn(data.selected_column || (data.detected_columns[0] || ''));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload and inspect file.');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  // Handle Paste Submit
  const handlePasteSubmit = async (e) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    const lines = pastedText
      .split(/[\r\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (lines.length === 0) {
      setError('Please paste at least one phone number.');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const data = await api.submitBulkNumbers(lines, removeDuplicates, `pasted_${lines.length}_numbers.txt`);
      setActiveJobId(data.job_id);
      setJobStatus({
        job_id: data.job_id,
        filename: data.filename,
        status: 'Processing',
        total_records: data.total_records,
        processed_records: 0,
        percentage: 0,
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit pasted numbers.');
    } finally {
      setIsStarting(false);
    }
  };

  // Start Job
  const handleStartJob = async () => {
    if (!activeJobId) return;
    setIsStarting(true);
    setError(null);

    try {
      await api.startBulkJob(activeJobId, selectedColumn, removeDuplicates);
      const data = await api.getJobStatus(activeJobId);
      setJobStatus(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start bulk job.');
    } finally {
      setIsStarting(false);
    }
  };

  // Job Controls
  const handlePause = async () => {
    if (!activeJobId) return;
    try {
      await api.pauseJob(activeJobId);
      const st = await api.getJobStatus(activeJobId);
      setJobStatus(st);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResume = async () => {
    if (!activeJobId) return;
    try {
      await api.resumeJob(activeJobId);
      const st = await api.getJobStatus(activeJobId);
      setJobStatus(st);
      // restart polling
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(async () => {
          const updated = await api.getJobStatus(activeJobId);
          setJobStatus(updated);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async () => {
    if (!activeJobId) return;
    try {
      await api.cancelJob(activeJobId);
      const st = await api.getJobStatus(activeJobId);
      setJobStatus(st);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetry = async () => {
    if (!activeJobId) return;
    try {
      await api.retryJob(activeJobId);
      const st = await api.getJobStatus(activeJobId);
      setJobStatus(st);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (format, filter) => {
    if (!activeJobId) return;
    const url = api.getExportUrl(activeJobId, format || exportFormat, filter || exportFilter);
    window.open(url, '_blank');
  };

  const resetForm = () => {
    setActiveJobId(null);
    setJobStatus(null);
    setFile(null);
    setInspectionData(null);
    setPastedText('');
    setError(null);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Bulk Phone Validator</h2>
          <p className="text-sm text-slate-400 mt-1">
            Stream and validate large lists containing up to 1,000,000 phone numbers per job with live metrics and Excel export.
          </p>
        </div>

        {activeJobId && (
          <button
            onClick={resetForm}
            className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 self-start"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Start New Upload
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Container: If no active job or before start, show Upload / Paste options */}
      {!jobStatus || jobStatus.status === 'Uploaded' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-4 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Upload className="h-4 w-4" /> Upload File (.CSV, .TXT, .XLS, .XLSX)
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-4 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'paste'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <FileText className="h-4 w-4" /> Paste Numbers Direct
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div className="space-y-6">
              {/* Dropzone */}
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-950/40 hover:bg-slate-950/80'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                    <Upload className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Drag and drop your phone number list here
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    Supports .CSV, .TXT, .XLS, and .XLSX files containing up to 1,000,000 records.
                  </p>
                  <button
                    type="button"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
                  >
                    Select File From Computer
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File Uploaded Card */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{file.name}</h4>
                        <p className="text-xs text-slate-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • {inspectionData?.total_records?.toLocaleString() || 'Detecting...'} records
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setFile(null);
                        setInspectionData(null);
                        setActiveJobId(null);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                    >
                      Change File
                    </button>
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Uploading and inspecting streaming headers...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Configuration & Column Selector */}
                  {inspectionData && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                            Select Phone Number Column
                          </label>
                          <select
                            value={selectedColumn}
                            onChange={(e) => setSelectedColumn(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {inspectionData.detected_columns.map((col) => (
                              <option key={col} value={col}>
                                {col} {col === inspectionData.best_column ? '(Auto-Detected Phone Column)' : ''}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-slate-400 mt-1.5">
                            Our AI engine auto-detects column names and samples row formats.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                            Deduplication
                          </label>
                          <label className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3 cursor-pointer hover:border-slate-700 transition-colors">
                            <input
                              type="checkbox"
                              checked={removeDuplicates}
                              onChange={(e) => setRemoveDuplicates(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <span className="text-xs font-semibold text-slate-200">Remove duplicate numbers</span>
                              <p className="text-[11px] text-slate-400">Only validate first occurrence of identical numbers</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Preview Table */}
                      {inspectionData.preview_rows?.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold uppercase text-slate-400 mb-2 block">
                            File Data Preview (First 5 Rows)
                          </span>
                          <div className="border border-slate-800 rounded-lg overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                                <tr>
                                  {inspectionData.detected_columns.map((col) => (
                                    <th key={col} className={`px-4 py-2.5 ${col === selectedColumn ? 'text-indigo-400 font-bold bg-indigo-500/10' : ''}`}>
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60">
                                {inspectionData.preview_rows.map((row, idx) => (
                                  <tr key={idx}>
                                    {inspectionData.detected_columns.map((col) => (
                                      <td key={col} className={`px-4 py-2 font-mono ${col === selectedColumn ? 'text-indigo-300 font-semibold bg-indigo-500/5' : ''}`}>
                                        {row[col] || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Launch Button */}
                      <div className="pt-2">
                        <button
                          onClick={handleStartJob}
                          disabled={isStarting}
                          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isStarting ? (
                            'Initializing Background Workers...'
                          ) : (
                            <>
                              <Play className="h-4 w-4" /> Start Bulk Validation ({inspectionData.total_records?.toLocaleString()} records)
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Paste Numbers Tab */
            <form onSubmit={handlePasteSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                  Paste Phone Numbers (One per line or comma-separated)
                </label>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="4155552671&#10;800-432-1000&#10;+1 (212) 736-5000&#10;312-555-0143&#10;012-345-6789"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-mono text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                  <span>Supports thousands of pasted numbers</span>
                  <span>
                    Count: {pastedText ? pastedText.split(/[\r\n,]+/).filter((s) => s.trim().length > 0).length : 0} numbers
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeDuplicates}
                    onChange={(e) => setRemoveDuplicates(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  Remove duplicate numbers
                </label>

                <button
                  type="submit"
                  disabled={isStarting || !pastedText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  <Play className="h-4 w-4" /> Start Direct Validation
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Active Job Live Progress Dashboard */
        <div className="space-y-6">
          {/* Header Card with Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">{jobStatus.filename}</h3>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                      jobStatus.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : jobStatus.status === 'Processing'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse'
                        : jobStatus.status === 'Paused'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : jobStatus.status === 'Cancelled'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {jobStatus.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">Job ID: {jobStatus.job_id}</p>
              </div>

              {/* Action Buttons: Pause, Resume, Cancel, Retry, Open Details */}
              <div className="flex flex-wrap items-center gap-2">
                {jobStatus.status === 'Processing' && (
                  <button
                    onClick={handlePause}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Pause className="h-3.5 w-3.5" /> Pause Job
                  </button>
                )}

                {jobStatus.status === 'Paused' && (
                  <button
                    onClick={handleResume}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5" /> Resume Job
                  </button>
                )}

                {['Processing', 'Paused', 'Queued'].includes(jobStatus.status) && (
                  <button
                    onClick={handleCancel}
                    className="bg-slate-800 hover:bg-rose-950/60 text-rose-400 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 hover:border-rose-800 transition-colors flex items-center gap-1.5"
                  >
                    <Ban className="h-3.5 w-3.5" /> Cancel Job
                  </button>
                )}

                {['Failed', 'Cancelled'].includes(jobStatus.status) && (
                  <button
                    onClick={handleRetry}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Retry Job
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedJobId(jobStatus.job_id);
                    setActivePage('job-detail');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  View Paginated Table <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Live Progress Bar & Speed / ETA */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between text-xs font-semibold">
                <span className="text-white text-sm">
                  {jobStatus.processed_records?.toLocaleString()} of {jobStatus.total_records?.toLocaleString()} records processed
                </span>
                <span className="text-indigo-400 text-sm font-bold font-mono">
                  {jobStatus.percentage}%
                </span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-800 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${jobStatus.percentage}%` }}
                ></div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-indigo-400" />
                  Speed: <strong className="text-slate-200 font-mono">{jobStatus.speed_per_second || 0}</strong> numbers/sec
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Estimated Time Remaining:{' '}
                  <strong className="text-slate-200 font-mono">
                    {jobStatus.estimated_remaining_seconds > 60
                      ? `${(jobStatus.estimated_remaining_seconds / 60).toFixed(1)} min`
                      : `${Math.round(jobStatus.estimated_remaining_seconds || 0)}s`}
                  </strong>
                </span>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-slate-400">Total Uploaded</span>
                <div className="text-xl font-bold text-white mt-1">
                  {jobStatus.total_records?.toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-slate-400">Processed</span>
                <div className="text-xl font-bold text-indigo-400 mt-1">
                  {jobStatus.processed_records?.toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-slate-400">Remaining</span>
                <div className="text-xl font-bold text-slate-300 mt-1">
                  {jobStatus.remaining_records?.toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-emerald-400">Valid</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {jobStatus.valid_count?.toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-rose-400">Invalid</span>
                <div className="text-xl font-bold text-rose-400 mt-1">
                  {jobStatus.invalid_count?.toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-blue-400">Mobile</span>
                <div className="text-xl font-bold text-blue-400 mt-1">
                  {jobStatus.mobile_count?.toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-indigo-400">Landline</span>
                <div className="text-xl font-bold text-indigo-400 mt-1">
                  {jobStatus.landline_count?.toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-purple-400">VOIP</span>
                <div className="text-xl font-bold text-purple-400 mt-1">
                  {jobStatus.voip_count?.toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-amber-400">Toll-Free</span>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  {jobStatus.toll_free_count?.toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-slate-400">Unknown</span>
                <div className="text-xl font-bold text-slate-300 mt-1">
                  {jobStatus.unknown_count?.toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-rose-400">Failed Records</span>
                <div className="text-xl font-bold text-rose-400 mt-1">
                  {jobStatus.failed_count || 0}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] font-semibold uppercase text-slate-400">Deduplicated</span>
                <div className="text-xl font-bold text-slate-300 mt-1">
                  {jobStatus.remove_duplicates ? 'YES' : 'NO'}
                </div>
              </div>
            </div>
          </div>

          {/* Export Downloads Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-white text-base">Export & Download Validation Results</h4>
                <p className="text-xs text-slate-400">
                  Download professionally styled multi-sheet Excel (.xlsx) workbooks or RFC-4180 CSV (.csv) files.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={exportFilter}
                  onChange={(e) => setExportFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Records ({jobStatus.processed_records})</option>
                  <option value="valid">Valid Numbers Only ({jobStatus.valid_count})</option>
                  <option value="invalid">Invalid Numbers Only ({jobStatus.invalid_count})</option>
                  <option value="mobile">Mobile Numbers Only ({jobStatus.mobile_count})</option>
                  <option value="landline">Landline Numbers Only ({jobStatus.landline_count})</option>
                  <option value="voip">VOIP Numbers Only ({jobStatus.voip_count})</option>
                  <option value="toll_free">Toll-Free Numbers Only ({jobStatus.toll_free_count})</option>
                  <option value="unknown">Unknown Numbers Only ({jobStatus.unknown_count})</option>
                </select>

                <button
                  onClick={() => handleDownload('xlsx', exportFilter)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download Excel (.xlsx)
                </button>

                <button
                  onClick={() => handleDownload('csv', exportFilter)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download CSV (.csv)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
