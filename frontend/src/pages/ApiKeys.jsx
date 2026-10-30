import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Clock,
  Activity,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(0);
  const [createdKeyData, setCreatedKeyData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState(null);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const data = await api.getApiKeys();
      setKeys(data);
    } catch (err) {
      setError('Failed to fetch API keys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const data = await api.createApiKey(newKeyName.trim(), Number(newKeyRateLimit) || 0);
      setCreatedKeyData(data);
      setShowModal(false);
      setNewKeyName('');
      setNewKeyRateLimit(0);
      fetchKeys();
    } catch (err) {
      alert('Failed to create API key.');
    }
  };

  const handleToggle = async (keyId) => {
    try {
      await api.toggleApiKey(keyId);
      setKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, is_active: !k.is_active } : k))
      );
    } catch (err) {
      alert('Failed to toggle API key state.');
    }
  };

  const handleDelete = async (keyId) => {
    if (!window.confirm('Are you sure you want to permanently revoke and delete this API key?')) {
      return;
    }
    try {
      await api.deleteApiKey(keyId);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err) {
      alert('Failed to delete API key.');
    }
  };

  const copyCreatedKey = () => {
    if (!createdKeyData?.key) return;
    navigator.clipboard.writeText(createdKeyData.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">API Key Management</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage authentication keys, configure granular rate limits, and authorize high-volume API requests.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Generate New API Key
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Secret Key Alert when newly generated */}
      {createdKeyData && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldAlert className="h-5 w-5" />
            <span>Save Your New API Key Now</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            This API token will only be displayed once. Copy and store it securely in your environment variables.
          </p>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
            <code className="text-indigo-300 font-mono text-xs flex-1 break-all">
              {createdKeyData.key}
            </code>
            <button
              onClick={copyCreatedKey}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedKey ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              {copiedKey ? 'Copied!' : 'Copy Key'}
            </button>
          </div>
          <div className="text-right">
            <button
              onClick={() => setCreatedKeyData(null)}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Key Name</th>
                <th className="px-6 py-4">Key Prefix</th>
                <th className="px-6 py-4">Rate Limit</th>
                <th className="px-6 py-4">Total Requests</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                      Loading API keys...
                    </span>
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No active API keys found. Click "Generate New API Key" above to create one.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white text-sm">{k.name}</td>
                    <td className="px-6 py-4 font-mono text-indigo-300">{k.prefix}</td>
                    <td className="px-6 py-4">
                      {k.rate_limit_per_min === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Unlimited
                        </span>
                      ) : (
                        <span className="font-mono text-slate-200">
                          {k.rate_limit_per_min} req / min
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-200">
                      {k.total_requests?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4">
                      {k.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-[11px]">
                      {k.created_at ? new Date(k.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(k.id)}
                          className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
                          title={k.is_active ? 'Deactivate Key' : 'Activate Key'}
                        >
                          {k.is_active ? 'Revoke' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(k.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          title="Delete Key"
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

      {/* Generate Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-400" /> Generate New API Key
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Key Name / Purpose
                </label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Backend or CRM Webhook"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Rate Limit (Requests per minute)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newKeyRateLimit}
                  onChange={(e) => setNewKeyRateLimit(e.target.value)}
                  placeholder="0 for unlimited"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter 0 for unlimited high-volume processing without throttling.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Create Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
