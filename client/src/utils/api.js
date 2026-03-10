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

export const usersApi = {
  list: () => api('/auth/users'),
  create: (data) => api('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => api(`/auth/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  resetPassword: (id, newPassword) => api(`/auth/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),
  remove: (id) => api(`/auth/users/${id}`, { method: 'DELETE' }),
  reactivate: (id) => api(`/auth/users/${id}/reactivate`, { method: 'POST' }),
};

export const schedulesApi = {
  list: () => api('/auth/schedules'),
  forUser: (userId) => api(`/auth/schedules/user/${userId}`),
  create: (data) => api('/auth/schedules', { method: 'POST', body: JSON.stringify(data) }),
  bulkSet: (user_id, schedules) => api('/auth/schedules/bulk', { method: 'POST', body: JSON.stringify({ user_id, schedules }) }),
  remove: (id) => api(`/auth/schedules/${id}`, { method: 'DELETE' }),
  overrides: () => api('/auth/schedule-overrides'),
  addOverride: (data) => api('/auth/schedule-overrides', { method: 'POST', body: JSON.stringify(data) }),
  removeOverride: (id) => api(`/auth/schedule-overrides/${id}`, { method: 'DELETE' }),
};

export const leadsApi = {
  list: (params = {}) => {
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
  addFollowUp: (leadId, data) => api(`/leads/${leadId}/follow-ups`, { method: 'POST', body: JSON.stringify(data) }),
  updateFollowUp: (leadId, fuId, data) => api(`/leads/${leadId}/follow-ups/${fuId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addAttachment: (leadId, data) => api(`/leads/${leadId}/attachments`, { method: 'POST', body: JSON.stringify(data) }),
  deleteAttachment: (leadId, attId) => api(`/leads/${leadId}/attachments/${attId}`, { method: 'DELETE' }),
};

export const contactsApi = {
  list: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null));
    const qs = new URLSearchParams(clean).toString();
    return api(`/contacts${qs ? '?' + qs : ''}`);
  },
  get: (contactId) => api(`/contacts/${contactId}`),
  update: (contactId, data) => api(`/contacts/${contactId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  stats: () => api('/contacts/stats'),
  createLead: (contactId, data = {}) => api(`/contacts/${contactId}/create-lead`, { method: 'POST', body: JSON.stringify(data) }),
};

export default api;
