const API_BASE = process.env.REACT_APP_API_URL || '';

async function api(path, options = {}) {
  const token = localStorage.getItem('ginger_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}/api${path}`, config);

  if (res.status === 401) {
    localStorage.removeItem('ginger_token');
    localStorage.removeItem('ginger_user');
    window.location.reload();
    return null;
  }

  if (options.raw) return res;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const authApi = {
  login: (username, password) => api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => api('/auth/me'),
  changePassword: (currentPassword, newPassword) => api('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
};

export const leadsApi = {
  list: (params = {}) => {
    // Filter out undefined/null values to avoid sending ?status=undefined
    const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null));
    const qs = new URLSearchParams(clean).toString();
    return api(`/leads${qs ? '?' + qs : ''}`);
  },
  get: (leadId) => api(`/leads/${leadId}`),
  update: (leadId, data) => api(`/leads/${leadId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addNote: (leadId, text) => api(`/leads/${leadId}/notes`, { method: 'POST', body: JSON.stringify({ text }) }),
  stats: () => api('/leads/stats/dashboard'),
  performance: () => api('/leads/stats/performance'),
  followUps: () => api('/leads/follow-ups/due'),
  exportCSV: () => api('/leads/export/csv', { raw: true }).then(r => r?.blob()),
};

export default api;
