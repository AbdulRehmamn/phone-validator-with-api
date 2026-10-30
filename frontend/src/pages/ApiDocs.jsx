import React, { useState } from 'react';
import {
  FileCode,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Code2,
  Server,
  Zap,
  ShieldCheck
} from 'lucide-react';

export default function ApiDocs() {
  const [selectedLang, setSelectedLang] = useState('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  const codeSnippets = {
    curl: `curl -X POST "http://localhost:8000/api/v1/validate" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: val_live_your_api_key_here" \\
  -d '{"phone_number": "(415) 555-2671"}'`,

    python: `import requests

url = "http://localhost:8000/api/v1/validate"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "val_live_your_api_key_here"
}
payload = {"phone_number": "(415) 555-2671"}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,

    javascript: `const response = await fetch("http://localhost:8000/api/v1/validate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "val_live_your_api_key_here"
  },
  body: JSON.stringify({ phone_number: "(415) 555-2671" })
});

const data = await response.json();
console.log(data);`,

    php: `<?php
$ch = curl_init("http://localhost:8000/api/v1/validate");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Content-Type: application/json",
  "X-API-Key: val_live_your_api_key_here"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "phone_number" => "(415) 555-2671"
]));

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippets[selectedLang]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const endpoints = [
    { method: 'POST', path: '/api/v1/validate', desc: 'Single US phone number lookup & classification' },
    { method: 'POST', path: '/api/v1/validate/bulk', desc: 'Submit bulk JSON list of numbers for background processing' },
    { method: 'POST', path: '/api/v1/bulk/upload', desc: 'Upload CSV, TXT, XLS, or XLSX file (up to 1,000,000 numbers)' },
    { method: 'POST', path: '/api/v1/bulk/{job_id}/start', desc: 'Start processing uploaded file' },
    { method: 'GET', path: '/api/v1/bulk/{job_id}', desc: 'Get live job progress, speed, remaining numbers, and ETA' },
    { method: 'GET', path: '/api/v1/bulk/{job_id}/results', desc: 'Retrieve paginated validation records (with search/filters)' },
    { method: 'POST', path: '/api/v1/bulk/{job_id}/pause', desc: 'Pause active bulk validation job' },
    { method: 'POST', path: '/api/v1/bulk/{job_id}/resume', desc: 'Resume paused bulk job' },
    { method: 'POST', path: '/api/v1/bulk/{job_id}/cancel', desc: 'Cancel bulk validation job' },
    { method: 'POST', path: '/api/v1/bulk/{job_id}/retry', desc: 'Retry failed/cancelled bulk job' },
    { method: 'DELETE', path: '/api/v1/bulk/{job_id}', desc: 'Delete bulk job and all associated records' },
    { method: 'GET', path: '/api/v1/bulk/{job_id}/export?format=xlsx', desc: 'Download professional multi-sheet Excel file' },
    { method: 'GET', path: '/api/v1/bulk/{job_id}/export?format=csv', desc: 'Download standard RFC-4180 CSV export' },
    { method: 'GET', path: '/api/v1/status', desc: 'System health, worker status, memory consumption' },
    { method: 'GET', path: '/api/v1/usage', desc: 'API usage statistics & aggregations' },
    { method: 'GET', path: '/api/docs', desc: 'Interactive OpenAPI / Swagger UI' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold mb-3">
            <Zap className="h-3 w-3" /> RESTful Architecture
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">API Reference & Integration</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Integrate high-speed US phone validation into your stack. Supports single validations, massive batch jobs, and streaming exports.
          </p>
        </div>

        <a
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start shrink-0 cursor-pointer"
        >
          <Terminal className="h-4 w-4" /> Open Swagger UI <ExternalLink className="h-3.5 w-3.5 ml-1" />
        </a>
      </div>

      {/* Code Snippets Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Example: Single Phone Lookup</h3>
          </div>

          <div className="flex items-center gap-2">
            {['curl', 'python', 'javascript', 'php'].map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                  selectedLang === lang
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
            <button
              onClick={copyCode}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 border border-slate-700 ml-2"
              title="Copy code"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-950 overflow-x-auto font-mono text-xs text-indigo-300">
          <pre>{codeSnippets[selectedLang]}</pre>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-base">API Endpoints Catalogue</h3>
          <p className="text-xs text-slate-400">All available endpoints under `/api/v1`</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 w-24">Method</th>
                <th className="px-6 py-3">Endpoint</th>
                <th className="px-6 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {endpoints.map((ep, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ep.method === 'GET'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : ep.method === 'POST'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono font-medium text-slate-200">{ep.path}</td>
                  <td className="px-6 py-3 text-slate-400">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
