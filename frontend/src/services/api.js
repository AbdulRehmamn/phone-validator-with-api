import axios from 'axios';

const API_BASE = '/api/v1';
export const ACTIVE_API_KEY = 'val_live_4099da90f132c073e926c6fce76e2438365238a7';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': ACTIVE_API_KEY,
  },
});

export const api = {
  // Single phone validation
  validateSingle: async (phoneNumber) => {
    const res = await apiClient.post('/validate', { phone_number: phoneNumber });
    return res.data;
  },

  // Bulk paste direct submit
  submitBulkNumbers: async (numbers, removeDuplicates = false, jobName = null) => {
    const res = await apiClient.post('/validate/bulk', {
      phone_numbers: numbers,
      remove_duplicates: removeDuplicates,
      job_name: jobName,
    });
    return res.data;
  },

  // Bulk file upload
  uploadFile: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/bulk/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-API-Key': ACTIVE_API_KEY,
      },
      onUploadProgress,
    });
    return res.data;
  },

  // Start validation on uploaded file
  startBulkJob: async (jobId, selectedColumn, removeDuplicates) => {
    const res = await apiClient.post(`/bulk/${jobId}/start`, {
      selected_column: selectedColumn,
      remove_duplicates: removeDuplicates,
    });
    return res.data;
  },

  // Job status & live metrics
  getJobStatus: async (jobId) => {
    const res = await apiClient.get(`/bulk/${jobId}`);
    return res.data;
  },

  // Paginated job results
  getJobResults: async (jobId, page = 1, pageSize = 50, filterType = 'all', search = '') => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      filter_type: filterType || 'all',
    });
    if (search) params.append('search', search);
    const res = await apiClient.get(`/bulk/${jobId}/results?${params.toString()}`);
    return res.data;
  },

  // Job controls
  pauseJob: async (jobId) => {
    const res = await apiClient.post(`/bulk/${jobId}/pause`);
    return res.data;
  },

  resumeJob: async (jobId) => {
    const res = await apiClient.post(`/bulk/${jobId}/resume`);
    return res.data;
  },

  cancelJob: async (jobId) => {
    const res = await apiClient.post(`/bulk/${jobId}/cancel`);
    return res.data;
  },

  retryJob: async (jobId) => {
    const res = await apiClient.post(`/bulk/${jobId}/retry`);
    return res.data;
  },

  deleteJob: async (jobId) => {
    const res = await apiClient.delete(`/bulk/${jobId}`);
    return res.data;
  },

  // Job history
  getBulkHistory: async () => {
    const res = await apiClient.get('/bulk/history');
    return res.data;
  },

  // Export download helper URL
  getExportUrl: (jobId, format = 'xlsx', filterType = 'all') => {
    return `${API_BASE}/bulk/${jobId}/export?format=${format}&filter_type=${filterType || 'all'}`;
  },

  // API Keys
  getApiKeys: async () => {
    const res = await apiClient.get('/keys');
    return res.data;
  },

  createApiKey: async (name, rateLimit = 0) => {
    const res = await apiClient.post('/keys', { name, rate_limit_per_min: rateLimit });
    return res.data;
  },

  toggleApiKey: async (keyId) => {
    const res = await apiClient.patch(`/keys/${keyId}/toggle`);
    return res.data;
  },

  deleteApiKey: async (keyId) => {
    const res = await apiClient.delete(`/keys/${keyId}`);
    return res.data;
  },

  // Admin & Analytics
  getAdminDashboard: async () => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },

  getSystemStatus: async () => {
    const res = await apiClient.get('/status');
    return res.data;
  },

  getUsageStats: async () => {
    const res = await apiClient.get('/usage');
    return res.data;
  },
};
