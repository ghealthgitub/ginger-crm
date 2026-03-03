import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { authApi, leadsApi, usersApi } from './utils/api';

// ============================================================
// CONSTANTS
// ============================================================
const LOGO_URL = 'https://ghealth121.com/wp-content/uploads/2022/09/Ginger-Healthcare-Logo.png';

const STATUSES = [
  { key: 'new', label: 'New Lead', color: '#3b82f6', bg: '#eff6ff', icon: '🆕' },
  { key: 'contacted', label: 'Contacted', color: '#8b5cf6', bg: '#f5f3ff', icon: '📞' },
  { key: 'qualified', label: 'Qualified', color: '#f59e0b', bg: '#fffbeb', icon: '✅' },
  { key: 'in_treatment', label: 'In Treatment', color: '#06b6d4', bg: '#ecfeff', icon: '🏥' },
  { key: 'converted', label: 'Converted', color: '#10b981', bg: '#ecfdf5', icon: '🎉' },
  { key: 'follow_up', label: 'Follow-Up', color: '#f97316', bg: '#fff7ed', icon: '⏰' },
  { key: 'lost', label: 'Lost', color: '#ef4444', bg: '#fef2f2', icon: '❌' },
];

const URGENCY = { Emergency: '#ef4444', Urgent: '#f97316', 'Semi-Urgent': '#f59e0b', Routine: '#10b981' };
const PRIORITIES = [
  { key: 'high', label: 'High', color: '#ef4444' },
  { key: 'medium', label: 'Medium', color: '#f59e0b' },
  { key: 'low', label: 'Low', color: '#6b7280' },
];
const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', counselor: 'Counselor' };
const ROLE_COLORS = { admin: '#ef4444', manager: '#8b5cf6', counselor: '#3b82f6' };

function timeAgo(d) {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const StatusBadge = ({ status, small }) => {
  const s = STATUSES.find(st => st.key === status) || STATUSES[0];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: small ? '2px 8px' : '4px 10px', borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.color}22`, letterSpacing: 0.3, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  );
};

const PriorityDot = ({ priority }) => {
  const p = PRIORITIES.find(pr => pr.key === priority) || PRIORITIES[2];
  return <span title={`${p.label} Priority`} style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />;
};

const RoleBadge = ({ role }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, color: ROLE_COLORS[role] || '#6b7280', background: (ROLE_COLORS[role] || '#6b7280') + '15', textTransform: 'uppercase', letterSpacing: 0.5 }}>
    {ROLE_LABELS[role] || role}
  </span>
);

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authApi.login(username.toLowerCase(), password);
      localStorage.setItem('ginger_token', token);
      localStorage.setItem('ginger_user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #00315a 0%, #001a33 100%)' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', borderRadius: 16, padding: '40px 36px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={LOGO_URL} alt="Ginger Healthcare" style={{ height: 48, marginBottom: 10 }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#00315a', margin: 0 }}>Ginger Healthcare</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>CRM Dashboard</p>
        </div>
        {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</div>}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. admin" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ff6308, #e55600)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

// ============================================================
// MAIN CRM APP
// ============================================================
function CRMApp({ user, onLogout }) {
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCounselor, setFilterCounselor] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');

  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

  const fetchData = useCallback(async () => {
    try {
      const [leadsData, statsData, fuData] = await Promise.all([
        leadsApi.list({ status: filterStatus !== 'all' ? filterStatus : undefined, counselor: filterCounselor !== 'all' ? filterCounselor : undefined, urgency: filterUrgency !== 'all' ? filterUrgency : undefined, search: search || undefined, limit: 200 }),
        leadsApi.stats(),
        leadsApi.followUps(),
      ]);
      setLeads(leadsData.leads);
      setStats(statsData);
      setFollowUps(fuData);
      if (isAdminOrManager) {
        const perfData = await leadsApi.performance();
        setPerformance(perfData);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
    setLoading(false);
  }, [filterStatus, filterCounselor, filterUrgency, search, isAdminOrManager]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 30000); return () => clearInterval(iv); }, [fetchData]);

  const updateLead = async (leadId, updates) => {
    try {
      await leadsApi.update(leadId, updates);
      fetchData();
      if (selectedLead?.lead_id === leadId) {
        const updated = await leadsApi.get(leadId);
        setSelectedLead(updated);
      }
    } catch (e) { console.error('Update failed:', e); }
  };

  const addNote = async (leadId, text) => {
    try {
      await leadsApi.addNote(leadId, text);
      if (selectedLead?.lead_id === leadId) {
        const updated = await leadsApi.get(leadId);
        setSelectedLead(updated);
      }
    } catch (e) { console.error('Note failed:', e); }
  };

  const exportCSV = async () => {
    try {
      const blob = await leadsApi.exportCSV();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ginger-leads-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('Export failed:', e); }
  };

  const openDetail = async (lead) => {
    try {
      const full = await leadsApi.get(lead.lead_id);
      setSelectedLead(full);
      setView('detail');
    } catch (e) { console.error(e); }
  };

  const counselors = useMemo(() => {
    const names = new Set(leads.map(l => l.assigned_counselor).filter(Boolean));
    return Array.from(names).sort();
  }, [leads]);

  // ---- HEADER ----
  const Header = () => {
    const navItems = ['dashboard', 'leads', 'pipeline'];
    if (isAdminOrManager) navItems.push('analytics');
    if (user.role === 'admin') navItems.push('settings');

    return (
      <div style={{ background: 'linear-gradient(135deg, #00315a 0%, #001d36 100%)', color: 'white', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={LOGO_URL} alt="Ginger" style={{ height: 28, borderRadius: 4 }} />
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>Ginger CRM</span>
          {user.role !== 'admin' && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.12)', padding: '2px 8px', borderRadius: 10, marginLeft: 4 }}>{user.name} · {ROLE_LABELS[user.role]}</span>}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {navItems.map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, background: view === v || (view === 'detail' && v === 'leads') ? 'rgba(255,255,255,0.15)' : 'transparent', color: view === v ? 'white' : 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>
              {v === 'settings' ? '⚙ Settings' : v}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={exportCSV} title="Export CSV" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '5px 10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 12 }}>📥 Export</button>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '5px 10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 12 }}>Logout</button>
        </div>
      </div>
    );
  };

  // ---- DASHBOARD ----
  const Dashboard = () => {
    if (!stats) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Leads', value: stats.total, color: '#3b82f6', icon: '📊' },
            { label: 'New Today', value: stats.today, color: '#10b981', icon: '🆕' },
            { label: 'Urgent/Emergency', value: stats.urgent, color: '#ef4444', icon: '🚨' },
            { label: 'Follow-Ups Due', value: stats.followUpDue, color: '#f97316', icon: '⏰' },
            { label: 'Conversion Rate', value: `${stats.conversionRate}%`, color: '#8b5cf6', icon: '📈' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {followUps.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 10 }}>⏰ Follow-Ups Due ({followUps.length})</div>
            {followUps.slice(0, 5).map(l => (
              <div key={l.lead_id} onClick={() => openDetail(l)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #fde68a', cursor: 'pointer' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{l.first_name} {l.last_name} — {l.nationality}</span>
                <span style={{ fontSize: 11, color: '#92400e' }}>{l.follow_up_note?.substring(0, 40) || 'No note'}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Pipeline Overview</div>
            {STATUSES.map(s => {
              const count = stats.byStatus[s.key] || 0;
              const pct = stats.total > 0 ? (count / stats.total * 100) : 0;
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, width: 85, textAlign: 'right', color: '#64748b', flexShrink: 0 }}>{s.label}</span>
                  <div style={{ flex: 1, height: 20, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 4, minWidth: count > 0 ? 16 : 0, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, width: 28 }}>{count}</span>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Recent Leads</div>
            {leads.slice(0, 6).map(l => (
              <div key={l.lead_id} onClick={() => openDetail(l)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{l.first_name} {l.last_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{l.nationality} · {l.treatment_sought || l.service_type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={l.status} small />
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{timeAgo(l.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdminOrManager && performance.length > 0 && (
          <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>👥 Counselor Performance (Last 30 Days)</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${performance.length}, 1fr)`, gap: 16 }}>
              {performance.map((p, i) => {
                const colors = ['#ff6308', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
                const rate = p.total > 0 ? Math.round((parseInt(p.converted) / parseInt(p.total)) * 100) : 0;
                return (
                  <div key={p.assigned_counselor} style={{ textAlign: 'center', padding: 16, background: '#f8fafc', borderRadius: 10, border: `2px solid ${colors[i % colors.length]}22` }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: colors[i % colors.length], marginBottom: 8 }}>{p.assigned_counselor}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                      <div><div style={{ fontSize: 20, fontWeight: 800 }}>{p.total}</div><div style={{ color: '#64748b' }}>Total</div></div>
                      <div><div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{p.converted}</div><div style={{ color: '#64748b' }}>Converted</div></div>
                      <div><div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{p.active}</div><div style={{ color: '#64748b' }}>Active</div></div>
                      <div><div style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6' }}>{rate}%</div><div style={{ color: '#64748b' }}>Conv. Rate</div></div>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Avg response: {p.avg_response_hours || '—'}h</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---- TOOLBAR ----
  const Toolbar = () => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', flex: '1 1 280px', maxWidth: 360 }}>
        <span style={{ color: '#94a3b8' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone, country..." style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent' }} />
        {search && <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setSearch('')}>✕</span>}
      </div>
      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
        <option value="all">All Status</option>
        {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
      {isAdminOrManager && (
        <select value={filterCounselor} onChange={e => setFilterCounselor(e.target.value)} style={selectStyle}>
          <option value="all">All Counselors</option>
          {counselors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)} style={selectStyle}>
        <option value="all">All Urgency</option>
        <option>Emergency</option><option>Urgent</option><option>Semi-Urgent</option><option>Routine</option>
      </select>
      <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>{leads.length} leads</div>
    </div>
  );

  // ---- LEADS TABLE ----
  const LeadsList = () => (
    <div>
      <Toolbar />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Lead', 'Contact', 'Treatment', 'Status', 'Counselor', 'Added'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: '1.5px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.lead_id} onClick={() => openDetail(l)} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PriorityDot priority={l.priority} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{l.prefix} {l.first_name} {l.last_name}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>🌍 {l.nationality}</div>
                    </div>
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontSize: 12 }}>{l.contact_preference === 'whatsapp' ? '💬' : l.contact_preference === 'telegram' ? '✈️' : l.contact_preference === 'pending' ? '⏳' : '📧'} {l.contact_preference}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{l.email}</div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{l.treatment_sought || l.service_type}</div>
                  {l.urgency_level && <span style={{ fontSize: 10, fontWeight: 600, color: URGENCY[l.urgency_level] || '#6b7280' }}>{l.urgency_level}</span>}
                </td>
                <td style={tdStyle}><StatusBadge status={l.status} small /></td>
                <td style={tdStyle}><span style={{ fontSize: 12.5, fontWeight: 500 }}>{l.assigned_counselor}</span></td>
                <td style={tdStyle}><span style={{ fontSize: 11.5, color: '#64748b' }}>{timeAgo(l.created_at)}</span></td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: '#94a3b8' }}>No leads match your filters</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ---- PIPELINE VIEW ----
  const Pipeline = () => (
    <div>
      <Toolbar />
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
        {STATUSES.filter(s => s.key !== 'lost').map(status => {
          const col = leads.filter(l => l.status === status.key);
          return (
            <div key={status.key} style={{ flex: '1 1 0', minWidth: 210, background: '#f8fafc', borderRadius: 10, padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: status.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{status.icon} {status.label}</span>
                <span style={{ fontSize: 11, background: status.bg, color: status.color, padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>{col.length}</span>
              </div>
              {col.map(l => (
                <div key={l.lead_id} onClick={() => openDetail(l)} style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid #e2e8f0', cursor: 'pointer', marginBottom: 8 }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{l.first_name} {l.last_name}</span>
                    <PriorityDot priority={l.priority} />
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🌍 {l.nationality}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{l.treatment_sought || l.service_type}</div>
                  {l.urgency_level && <div style={{ fontSize: 10, fontWeight: 700, color: URGENCY[l.urgency_level], marginTop: 2 }}>{l.urgency_level}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid #f1f5f9', fontSize: 10.5, color: '#94a3b8' }}>
                    <span>{l.assigned_counselor}</span>
                    <span>{timeAgo(l.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ---- DETAIL VIEW ----
  const DetailView = () => {
    const [noteText, setNoteText] = useState('');
    const [fuDate, setFuDate] = useState(selectedLead?.follow_up_date?.split('T')[0] || '');
    const [fuNote, setFuNote] = useState(selectedLead?.follow_up_note || '');
    const lead = selectedLead;
    if (!lead) return null;

    const waUrl = lead.isd && lead.phone ? `https://wa.me/${(lead.isd + lead.phone).replace(/[^0-9]/g, '')}` : null;
    const patientName = lead.patient_relation === 'self'
      ? `${lead.prefix} ${lead.first_name} ${lead.last_name} (Self)`
      : lead.patient_first_name
        ? `${lead.patient_prefix || ''} ${lead.patient_first_name} ${lead.patient_last_name}, Age ${lead.patient_age}`
        : 'N/A';

    const saveFollowUp = () => {
      updateLead(lead.lead_id, { follow_up_date: fuDate || null, follow_up_note: fuNote || null });
    };

    return (
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #00315a, #001d36)', color: 'white', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <button onClick={() => setView('leads')} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'white', fontSize: 14 }}>← Back</button>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{lead.prefix} {lead.first_name} {lead.last_name}</h2>
              <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 2 }}>
                🌍 {lead.nationality} &nbsp; 📧 {lead.email} &nbsp; 📱 {lead.isd} {lead.phone}
              </div>
            </div>
            <StatusBadge status={lead.status} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={lead.status} onChange={e => updateLead(lead.lead_id, { status: e.target.value })} style={headerSelect}>
              {STATUSES.map(s => <option key={s.key} value={s.key} style={{ color: '#0f172a' }}>{s.label}</option>)}
            </select>
            {isAdminOrManager && (
              <select value={lead.assigned_counselor} onChange={e => updateLead(lead.lead_id, { assigned_counselor: e.target.value })} style={headerSelect}>
                {counselors.map(c => <option key={c} value={c} style={{ color: '#0f172a' }}>{c}</option>)}
              </select>
            )}
            <select value={lead.priority || 'medium'} onChange={e => updateLead(lead.lead_id, { priority: e.target.value })} style={headerSelect}>
              {PRIORITIES.map(p => <option key={p.key} value={p.key} style={{ color: '#0f172a' }}>{p.label} Priority</option>)}
            </select>
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noreferrer" style={{ padding: '5px 12px', borderRadius: 6, background: '#25D366', color: 'white', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>💬 WhatsApp</a>
            )}
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitle}>Inquiry Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
            <InfoItem label="Service Type" value={lead.service_type} />
            <InfoItem label="Treatment" value={lead.treatment_sought} />
            <InfoItem label="Patient" value={patientName} />
            <InfoItem label="Urgency" value={lead.urgency_level} color={URGENCY[lead.urgency_level]} />
            <InfoItem label="Contact Via" value={lead.contact_preference} />
            <InfoItem label="Source" value={lead.referrer} />
            {lead.is_doctor && <>
              <InfoItem label="Doctor Specialty" value={lead.doctor_specialty} />
              <InfoItem label="Hospital" value={`${lead.doctor_hospital}, ${lead.doctor_city}`} />
              <InfoItem label="Diagnosis" value={lead.primary_diagnosis} />
            </>}
            <div style={{ gridColumn: '1 / -1' }}>
              <InfoItem label="Message" value={lead.message} full />
            </div>
            {lead.clinical_notes && <div style={{ gridColumn: '1 / -1' }}>
              <InfoItem label="Clinical Notes" value={lead.clinical_notes} full highlight />
            </div>}
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitle}>⏰ Follow-Up</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 3 }}>Date</label>
              <input type="date" value={fuDate} onChange={e => setFuDate(e.target.value)} style={{ padding: '7px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 3 }}>Note</label>
              <input value={fuNote} onChange={e => setFuNote(e.target.value)} placeholder="e.g. Send treatment cost estimate" style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <button onClick={saveFollowUp} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: '#f59e0b', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitle}>Notes & Activity</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." style={{ flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 60, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <button disabled={!noteText.trim()} onClick={() => { if (noteText.trim()) { addNote(lead.lead_id, noteText.trim()); setNoteText(''); }}} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#ff6308', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: noteText.trim() ? 1 : 0.5 }}>Add Note</button>
          <div style={{ marginTop: 16 }}>
            {(lead.notes || []).map(n => (
              <div key={n.id} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', borderLeft: '3px solid #ff6308', marginBottom: 8 }}>
                <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{n.text}</div>
                <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 4 }}>{n.author} · {fmtDate(n.created_at)}</div>
              </div>
            ))}
            {(lead.activity || []).map(a => (
              <div key={a.id} style={{ fontSize: 11.5, color: '#64748b', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 600 }}>{a.user_name}</span> {a.action.replace(/_/g, ' ')} — <span style={{ fontSize: 10.5 }}>{fmtDate(a.created_at)}</span>
                {a.details && <span style={{ color: '#94a3b8' }}> · {a.details.substring(0, 60)}</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...sectionStyle, borderBottom: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
            <InfoItem label="Lead ID" value={lead.lead_id} mono />
            <InfoItem label="Created" value={fmtDate(lead.created_at)} />
            <InfoItem label="Last Updated" value={fmtDate(lead.updated_at)} />
          </div>
        </div>
      </div>
    );
  };

  // ---- ANALYTICS (Admin + Manager) ----
  const Analytics = () => {
    if (!stats) return null;
    return <div><Dashboard /></div>;
  };

  // ---- SETTINGS: User Management (Admin only) ----
  const Settings = () => {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState({ username: '', password: '', displayName: '', role: 'counselor', email: '', whatsapp: '', telegram: '' });
    const [resetPwUser, setResetPwUser] = useState(null);
    const [newPw, setNewPw] = useState('');
    const [msg, setMsg] = useState('');

    const fetchUsers = async () => {
      try {
        const data = await usersApi.list();
        setUsers(data);
      } catch (e) { console.error(e); }
      setLoadingUsers(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSubmit = async () => {
      setMsg('');
      try {
        if (editUser) {
          await usersApi.update(editUser.id, { displayName: form.displayName, role: form.role, email: form.email, whatsapp: form.whatsapp, telegram: form.telegram });
          setMsg('User updated!');
        } else {
          if (!form.username || !form.password || !form.displayName) { setMsg('Username, password, and name are required'); return; }
          await usersApi.create(form);
          setMsg('User created!');
        }
        fetchUsers();
        setShowForm(false);
        setEditUser(null);
        setForm({ username: '', password: '', displayName: '', role: 'counselor', email: '', whatsapp: '', telegram: '' });
      } catch (e) { setMsg(e.message); }
    };

    const handleDelete = async (u) => {
      if (!window.confirm(`Deactivate ${u.display_name}? They won't be able to login.`)) return;
      try {
        await usersApi.remove(u.id);
        fetchUsers();
        setMsg(`${u.display_name} deactivated`);
      } catch (e) { setMsg(e.message); }
    };

    const handleReactivate = async (u) => {
      try {
        await usersApi.reactivate(u.id);
        fetchUsers();
        setMsg(`${u.display_name} reactivated`);
      } catch (e) { setMsg(e.message); }
    };

    const handleResetPw = async () => {
      if (!newPw || newPw.length < 6) { setMsg('Password must be at least 6 characters'); return; }
      try {
        await usersApi.resetPassword(resetPwUser.id, newPw);
        setMsg(`Password reset for ${resetPwUser.display_name}`);
        setResetPwUser(null);
        setNewPw('');
      } catch (e) { setMsg(e.message); }
    };

    const startEdit = (u) => {
      setEditUser(u);
      setForm({ username: u.username, password: '', displayName: u.display_name, role: u.role, email: u.email || '', whatsapp: u.whatsapp || '', telegram: u.telegram || '' });
      setShowForm(true);
      setMsg('');
    };

    const startCreate = () => {
      setEditUser(null);
      setForm({ username: '', password: '', displayName: '', role: 'counselor', email: '', whatsapp: '', telegram: '' });
      setShowForm(true);
      setMsg('');
    };

    const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', outline: 'none' };
    const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 3 };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>⚙ User Management</h2>
          <button onClick={startCreate} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ff6308', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add User</button>
        </div>

        {msg && <div style={{ background: msg.includes('error') || msg.includes('required') ? '#fef2f2' : '#ecfdf5', color: msg.includes('error') || msg.includes('required') ? '#ef4444' : '#059669', padding: '8px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{msg}</div>}

        {/* Reset Password Modal */}
        {resetPwUser && (
          <div style={{ background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>Reset Password for {resetPwUser.display_name}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="text" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min 6 chars)" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={handleResetPw} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#f59e0b', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Reset</button>
              <button onClick={() => { setResetPwUser(null); setNewPw(''); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{editUser ? `Edit: ${editUser.display_name}` : 'Add New User'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              <div>
                <label style={labelStyle}>Username</label>
                <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} disabled={!!editUser} style={{ ...inputStyle, opacity: editUser ? 0.5 : 1 }} placeholder="e.g. john" />
              </div>
              {!editUser && <div>
                <label style={labelStyle}>Password</label>
                <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={inputStyle} placeholder="Min 6 characters" />
              </div>}
              <div>
                <label style={labelStyle}>Display Name</label>
                <input value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} style={inputStyle} placeholder="e.g. John Doe" />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={inputStyle}>
                  <option value="counselor">Counselor</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inputStyle} placeholder="email@example.com" />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp Number</label>
                <input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} style={inputStyle} placeholder="e.g. 917669773377" />
              </div>
              <div>
                <label style={labelStyle}>Telegram Username</label>
                <input value={form.telegram} onChange={e => setForm({...form, telegram: e.target.value})} style={inputStyle} placeholder="e.g. john_gh" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={handleSubmit} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#ff6308', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{editUser ? 'Save Changes' : 'Create User'}</button>
              <button onClick={() => { setShowForm(false); setEditUser(null); setMsg(''); }} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Users Table */}
        {loadingUsers ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading users...</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Name', 'Username', 'Role', 'Email', 'WhatsApp', 'Telegram', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: '1.5px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: u.is_active ? 1 : 0.5 }}>
                    <td style={tdStyle}><span style={{ fontWeight: 600, fontSize: 13 }}>{u.display_name}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 12, fontFamily: 'monospace' }}>{u.username}</span></td>
                    <td style={tdStyle}><RoleBadge role={u.role} /></td>
                    <td style={tdStyle}><span style={{ fontSize: 12 }}>{u.email || '—'}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 12 }}>{u.whatsapp || '—'}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 12 }}>{u.telegram || '—'}</span></td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, color: u.is_active ? '#059669' : '#ef4444', background: u.is_active ? '#ecfdf5' : '#fef2f2' }}>
                        {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => startEdit(u)} title="Edit" style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 11 }}>✏️</button>
                        <button onClick={() => { setResetPwUser(u); setNewPw(''); setMsg(''); }} title="Reset Password" style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 11 }}>🔑</button>
                        {u.is_active ? (
                          <button onClick={() => handleDelete(u)} title="Deactivate" style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 11 }}>🚫</button>
                        ) : (
                          <button onClick={() => handleReactivate(u)} title="Reactivate" style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #bbf7d0', background: '#ecfdf5', cursor: 'pointer', fontSize: 11 }}>✅</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 10, fontSize: 12, color: '#64748b' }}>
          <strong>Role Permissions:</strong><br />
          <strong style={{ color: '#ef4444' }}>Admin</strong> — Full access: manage users, view all leads, reassign counselors, analytics, export<br />
          <strong style={{ color: '#8b5cf6' }}>Manager</strong> — Review all leads, view analytics & counselor performance, reassign counselors. Cannot manage users.<br />
          <strong style={{ color: '#3b82f6' }}>Counselor</strong> — View and manage own assigned leads only
        </div>
      </div>
    );
  };

  if (loading) return (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><img src={LOGO_URL} alt="Loading" style={{ height: 48, marginBottom: 10 }} /><div style={{ color: '#64748b' }}>Loading CRM...</div></div></div>);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", background: '#f1f5f9', minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 20px' }}>
        {view === 'dashboard' && <Dashboard />}
        {view === 'leads' && <LeadsList />}
        {view === 'pipeline' && <Pipeline />}
        {view === 'analytics' && <Analytics />}
        {view === 'detail' && <DetailView />}
        {view === 'settings' && <Settings />}
      </div>
    </div>
  );
}

// ---- InfoItem helper ----
function InfoItem({ label, value, color, full, highlight, mono }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 13, color: color || '#0f172a', fontWeight: color ? 700 : 500, ...(full ? { lineHeight: 1.5, background: highlight ? '#fffbeb' : '#f8fafc', padding: '8px 10px', borderRadius: 6, marginTop: 2 } : {}), ...(mono ? { fontFamily: 'monospace', fontSize: 11.5 } : {}) }}>{value || '—'}</div>
    </div>
  );
}

// ---- Shared styles ----
const selectStyle = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, color: '#475569', background: 'white', cursor: 'pointer', outline: 'none' };
const tdStyle = { padding: '10px 14px', fontSize: 13, verticalAlign: 'middle' };
const headerSelect = { padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 12, cursor: 'pointer' };
const sectionStyle = { padding: '16px 24px', borderBottom: '1px solid #f1f5f9' };
const sectionTitle = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 };

// ============================================================
// ROOT APP - Auth wrapper
// ============================================================
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ginger_user')); } catch { return null; }
  });

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => {
    localStorage.removeItem('ginger_token');
    localStorage.removeItem('ginger_user');
    setUser(null);
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;
  return <CRMApp user={user} onLogout={handleLogout} />;
}
