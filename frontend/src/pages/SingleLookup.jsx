import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Smartphone,
  PhoneCall,
  Radio,
  Sparkles,
  HelpCircle,
  Info,
  Code
} from 'lucide-react';
import { api } from '../services/api';

export default function SingleLookup() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [showJson, setShowJson] = useState(false);

  const handleValidate = async (e) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.validateSingle(phoneNumber);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to validate phone number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const setSample = (num) => {
    setPhoneNumber(num);
    setError(null);
  };

  const getLineTypeBadge = (lineType) => {
    switch (lineType) {
      case 'MOBILE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Smartphone className="h-3.5 w-3.5" /> Mobile / Cellular
          </span>
        );
      case 'LANDLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <PhoneCall className="h-3.5 w-3.5" /> Landline / Fixed Line
          </span>
        );
      case 'VOIP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Radio className="h-3.5 w-3.5" /> VOIP
          </span>
        );
      case 'FIXED_VOIP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Radio className="h-3.5 w-3.5" /> Fixed VOIP (Cable / Interconnected)
          </span>
        );
      case 'NON_FIXED_VOIP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
            <Radio className="h-3.5 w-3.5" /> Non-Fixed VOIP (Cloud / Virtual)
          </span>
        );
      case 'TOLL_FREE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="h-3.5 w-3.5" /> Toll-Free
          </span>
        );
      case 'UNKNOWN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <HelpCircle className="h-3.5 w-3.5" /> Unknown Line Type
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3.5 w-3.5" /> Invalid Number
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Search Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-2">US Phone Number Verification</h2>
        <p className="text-sm text-slate-400 mb-6">
          Enter any standard 10 or 11-digit US telephone number with or without formatting, area code, or country code.
        </p>

        <form onSubmit={handleValidate} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-indigo-300 border border-slate-700">US</span>
              <span className="text-sm font-semibold text-slate-300 ml-1.5">+1</span>
              <span className="h-4 w-px bg-slate-700 mx-2"></span>
            </div>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(415) 555-2671 or 800-432-1000"
              className="w-full pl-20 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base font-mono transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phoneNumber.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Validating...
              </span>
            ) : (
              <>
                <Search className="h-4 w-4" /> VALIDATE
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Try quick sample:</span>
          <button
            type="button"
            onClick={() => setSample('415-555-2671')}
            className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
          >
            San Francisco (415-555-2671)
          </button>
          <button
            type="button"
            onClick={() => setSample('800-432-1000')}
            className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
          >
            Toll-Free (800-432-1000)
          </button>
          <button
            type="button"
            onClick={() => setSample('212-736-5000')}
            className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
          >
            New York (212-736-5000)
          </button>
          <button
            type="button"
            onClick={() => setSample('012-345-6789')}
            className="bg-slate-800/80 hover:bg-slate-700 text-rose-300 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
          >
            Invalid NPA (012-345-6789)
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Validation Result Table / Card */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fadeIn">
          {/* Header Status Bar */}
          <div
            className={`px-8 py-5 border-b flex flex-wrap items-center justify-between gap-4 ${
              result.is_valid
                ? 'bg-emerald-950/30 border-emerald-500/20'
                : 'bg-rose-950/30 border-rose-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.is_valid ? (
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <XCircle className="h-6 w-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white font-mono">
                    {result.formatted_national || result.original_number}
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      result.is_valid
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {result.is_valid ? 'VALID US NUMBER' : 'INVALID'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Normalized E.164: <span className="font-mono text-slate-300">{result.normalized_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getLineTypeBadge(result.line_type)}
              <button
                onClick={() => setShowJson(!showJson)}
                className="text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Code className="h-3.5 w-3.5" />
                {showJson ? 'Table View' : 'Raw JSON'}
              </button>
            </div>
          </div>

          {/* Body Content */}
          {showJson ? (
            <div className="p-6 bg-slate-950 font-mono text-xs text-indigo-300 overflow-x-auto">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-slate-800/80">
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 font-semibold text-slate-400 w-1/3">Validation Status</td>
                    <td className="px-8 py-4">
                      {result.is_valid ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" /> Valid US Phone Number
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                          <XCircle className="h-4 w-4" /> {result.error_message || 'Invalid Number'}
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 font-semibold text-slate-400">Line Type</td>
                    <td className="px-8 py-4">{getLineTypeBadge(result.line_type)}</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 font-semibold text-slate-400">Carrier Name</td>
                    <td className="px-8 py-4 text-slate-200 font-medium">
                      {result.carrier || <span className="text-slate-400 italic">Unknown / Not Available</span>}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 font-semibold text-slate-400">State / Region</td>
                    <td className="px-8 py-4 text-slate-200">
                      {result.state || <span className="text-slate-400 italic">N/A (Toll-Free / National)</span>}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 font-semibold text-slate-400">City / Location</td>
                    <td className="px-8 py-4 text-slate-200">
                      {result.city || <span className="text-slate-400 italic">N/A</span>}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 font-semibold text-slate-400">Area Code (NPA)</td>
                    <td className="px-8 py-4 font-mono text-slate-200">
                      {result.area_code || <span className="text-slate-400 italic">N/A</span>}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 font-semibold text-slate-400">Formatted National</td>
                    <td className="px-8 py-4 flex items-center justify-between">
                      <span className="font-mono text-slate-200 font-semibold">{result.formatted_national || 'N/A'}</span>
                      {result.formatted_national && (
                        <button
                          onClick={() => copyToClipboard(result.formatted_national, 'national')}
                          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                          title="Copy"
                        >
                          {copiedField === 'national' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 font-semibold text-slate-400">Normalized (E.164)</td>
                    <td className="px-8 py-4 flex items-center justify-between">
                      <span className="font-mono text-slate-200 font-semibold">{result.normalized_number || 'N/A'}</span>
                      {result.normalized_number && (
                        <button
                          onClick={() => copyToClipboard(result.normalized_number, 'e164')}
                          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                          title="Copy"
                        >
                          {copiedField === 'e164' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 font-semibold text-slate-400">Country</td>
                    <td className="px-8 py-4 text-slate-200 font-medium">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-indigo-300 mr-2 border border-slate-700">USA</span>
                      {result.country} ({result.country_code})
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
