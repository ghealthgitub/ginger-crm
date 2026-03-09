import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { authApi, leadsApi, usersApi, schedulesApi } from './utils/api';

// ============================================================
// BRAND & DESIGN SYSTEM
// ============================================================
const C = {
  navy: '#0a1628', navyLight: '#132038', navyMid: '#1a2d4a',
  teal: '#0ea5a0', tealLight: '#14b8b3', tealDark: '#0d8f8a', tealBg: '#0ea5a008',
  orange: '#ff6b2b', orangeLight: '#ff8650', orangeBg: '#ff6b2b08',
  white: '#ffffff', offWhite: '#f7f8fb', cream: '#fafbfe',
  slate: '#64748b', slateLight: '#94a3b8', slateDark: '#475569',
  dark: '#0f172a', darkSoft: '#1e293b',
  border: '#e8ecf2', borderLight: '#f0f3f8',
  green: '#10b981', greenBg: '#ecfdf5',
  red: '#ef4444', redBg: '#fef2f2',
  amber: '#f59e0b', amberBg: '#fffbeb',
  purple: '#8b5cf6', purpleBg: '#f5f3ff',
  blue: '#3b82f6', blueBg: '#eff6ff',
  cyan: '#06b6d4', cyanBg: '#ecfeff',
};

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const LOGO_URL = '/ginger-logo.jpg';

const STATUSES = [
  { key: 'new', label: 'New', color: C.blue, bg: C.blueBg },
  { key: 'contacted', label: 'Contacted', color: C.purple, bg: C.purpleBg },
  { key: 'qualified', label: 'Qualified', color: C.amber, bg: C.amberBg },
  { key: 'in_treatment', label: 'In Treatment', color: C.cyan, bg: C.cyanBg },
  { key: 'converted', label: 'Converted', color: C.green, bg: C.greenBg },
  { key: 'follow_up', label: 'Follow-Up', color: C.orange, bg: C.orangeBg },
  { key: 'lost', label: 'Lost', color: C.red, bg: C.redBg },
];

const CATEGORIES = [
  { key: 'patient', label: 'Patients', icon: '🏥', color: C.teal, desc: 'Medical enquiries' },
  { key: 'other', label: 'Other', icon: '💼', color: C.purple, desc: 'Partnerships & jobs' },
  { key: 'spam', label: 'Non-Targeted', icon: '🚫', color: C.slateLight, desc: 'Blocked regions' },
];

const URGENCY_COLORS = { Emergency: C.red, Urgent: C.orange, 'Semi-Urgent': C.amber, Routine: C.green };
const PRIORITIES = [
  { key: 'high', label: 'High', color: C.red },
  { key: 'medium', label: 'Medium', color: C.amber },
  { key: 'low', label: 'Low', color: C.slate },
];

const ATTACHMENT_CATEGORIES = [
  'Treatment Plan', 'Passport Copy', 'Visa Invitation', 'Flight Ticket',
  'Medical Report', 'Billing / Invoice', 'Insurance Document', 'Prescription', 'Other'
];

const HOSPITAL_OPTIONS = [
  'Medanta, Gurgaon', 'Apollo Hospitals, Chennai', 'Fortis Memorial, Gurgaon',
  'Max Super Speciality, Delhi', 'BLK-Max, Delhi', 'Artemis, Gurgaon',
  'Narayana Health, Bangalore', 'Kokilaben Ambani, Mumbai', 'Manipal Hospitals, Bangalore',
  'AIIMS, Delhi', 'Tata Memorial, Mumbai', 'CMC, Vellore',
];

const DOCTOR_OPTIONS = [
  'Dr. Naresh Trehan (Cardiac)', 'Dr. Devi Prasad Shetty (Cardiac)',
  'Dr. Randeep Guleria (Pulmonology)', 'Dr. Ashok Seth (Cardiology)',
  'Dr. Subhash Gupta (Liver Transplant)', 'Dr. Arvind Kumar (Thoracic)',
  'Dr. S. Hukku (Oncology)', 'Dr. K. Srinath Reddy (Cardiology)',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', counselor: 'Counselor' };

// ============================================================
// UTILITIES
// ============================================================
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

function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ============================================================
// SHARED MICRO COMPONENTS
// ============================================================
const StatusBadge = ({ status, small }) => {
  const s = STATUSES.find(st => st.key === status) || STATUSES[0];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: small ? '2px 9px' : '4px 11px', borderRadius: 6, fontSize: small ? 10 : 10.5, fontWeight: 600, color: s.color, background: s.bg, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: FONT }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
};

const PriorityDot = ({ priority }) => {
  const p = PRIORITIES.find(pr => pr.key === priority) || PRIORITIES[2];
  return <span title={`${p.label}`} style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />;
};

const CategoryBadge = ({ category, small }) => {
  const c = CATEGORIES.find(cat => cat.key === category) || CATEGORIES[0];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: small ? '2px 8px' : '3px 10px', borderRadius: 5, fontSize: small ? 9 : 10, fontWeight: 600, color: c.color, background: c.color + '10', letterSpacing: 0.3, textTransform: 'uppercase', fontFamily: FONT }}>
      {c.icon} {c.label}
    </span>
  );
};

const EditableField = ({ label, value, field, onSave, type = 'text', options, multiOptions, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const [selectedMulti, setSelectedMulti] = useState(() => {
    try { return JSON.parse(value || '[]'); } catch { return []; }
  });

  useEffect(() => {
    setVal(value || '');
    try { setSelectedMulti(JSON.parse(value || '[]')); } catch { setSelectedMulti([]); }
  }, [value]);

  const save = () => {
    onSave(field, multiOptions ? JSON.stringify(selectedMulti) : val);
    setEditing(false);
  };

  if (!editing) {
    let displayVal = value || '—';
    if (multiOptions) {
      try { const arr = JSON.parse(value || '[]'); displayVal = arr.length > 0 ? arr.join(', ') : '—'; } catch { displayVal = value || '—'; }
    }
    return (
      <div style={{ marginBottom: 2 }}>
        <div style={{ fontSize: 10, color: C.slateLight, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
          {label}
          <span onClick={() => setEditing(true)} style={{ cursor: 'pointer', fontSize: 9, color: C.teal, opacity: 0.6 }} title="Edit">✎</span>
        </div>
        <div style={{ fontSize: 13, color: C.dark, fontWeight: 500, lineHeight: 1.5, wordBreak: 'break-word', fontFamily: FONT }}>{displayVal}</div>
      </div>
    );
  }

  if (multiOptions) {
    return (
      <div style={{ marginBottom: 2 }}>
        <div style={{ fontSize: 10, color: C.teal, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: FONT }}>{label}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '4px 0' }}>
          {multiOptions.map(opt => (
            <button key={opt} onClick={() => setSelectedMulti(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
              style={{ padding: '4px 9px', borderRadius: 5, border: `1.5px solid ${selectedMulti.includes(opt) ? C.teal : C.border}`, background: selectedMulti.includes(opt) ? C.tealBg : C.white, fontSize: 11, cursor: 'pointer', color: selectedMulti.includes(opt) ? C.teal : C.slateDark, fontWeight: selectedMulti.includes(opt) ? 600 : 400, fontFamily: FONT }}>
              {opt}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <button onClick={save} style={btnSmallTeal}>Save</button>
          <button onClick={() => setEditing(false)} style={btnSmallGhost}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 2 }}>
      <div style={{ fontSize: 10, color: C.teal, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: FONT }}>{label}</div>
      {options ? (
        <select value={val} onChange={e => setVal(e.target.value)} style={inputSmall} autoFocus>
          <option value="">— Select —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={val} onChange={e => setVal(e.target.value)} style={{ ...inputSmall, minHeight: 56, resize: 'vertical' }} autoFocus placeholder={placeholder} />
      ) : (
        <input type={type} value={val} onChange={e => setVal(e.target.value)} style={inputSmall} autoFocus placeholder={placeholder} />
      )}
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        <button onClick={save} style={btnSmallTeal}>Save</button>
        <button onClick={() => { setEditing(false); setVal(value || ''); }} style={btnSmallGhost}>Cancel</button>
      </div>
    </div>
  );
};

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
    } catch (err) { setError(err.message || 'Login failed'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(160deg, ${C.navy} 0%, #0d1f35 50%, ${C.navyMid} 100%)`, fontFamily: FONT, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', right: '15%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${C.teal}08 0%, transparent 70%)` }} />
      <div style={{ position: 'absolute', bottom: '5%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${C.orange}06 0%, transparent 70%)` }} />
      <form onSubmit={handleLogin} style={{ background: C.white, borderRadius: 16, padding: '44px 38px', width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.teal}, ${C.orange})`, borderRadius: '16px 16px 0 0' }} />
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img src={LOGO_URL} alt="Ginger" style={{ height: 48, marginBottom: 10, borderRadius: 10 }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: 0, letterSpacing: -0.3 }}>Ginger Healthcare</h1>
          <p style={{ fontSize: 12, color: C.slateLight, marginTop: 3, letterSpacing: 0.5 }}>CRM · crm.ginger.healthcare</p>
        </div>
        {error && <div style={{ background: C.redBg, color: C.red, padding: '9px 12px', borderRadius: 8, fontSize: 12, marginBottom: 14, textAlign: 'center' }}>{error}</div>}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. admin" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={inputStyle} />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`, color: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, letterSpacing: 0.3, fontFamily: FONT }}>
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
  const [activeCategory, setActiveCategory] = useState('patient');
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user.role === 'admin';
  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

  const fetchData = useCallback(async () => {
    try {
      const [leadsData, statsData, fuData] = await Promise.all([
        leadsApi.list({ category: activeCategory, status: filterStatus !== 'all' ? filterStatus : undefined, counselor: filterCounselor !== 'all' ? filterCounselor : undefined, urgency: filterUrgency !== 'all' ? filterUrgency : undefined, search: search || undefined, limit: 200 }),
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
    } catch (e) { console.error('Fetch error:', e); }
    setLoading(false);
  }, [filterStatus, filterCounselor, filterUrgency, search, isAdminOrManager, activeCategory]);

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
      const a = document.createElement('a'); a.href = url;
      a.download = `ginger-leads-${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { console.error('Export failed:', e); }
  };

  const openDetail = async (lead) => {
    try { const full = await leadsApi.get(lead.lead_id); setSelectedLead(full); setView('detail'); } catch (e) { console.error(e); }
  };

  const counselors = useMemo(() => {
    const names = new Set(leads.map(l => l.assigned_counselor).filter(Boolean));
    return Array.from(names).sort();
  }, [leads]);

  // ---- SIDEBAR ----
  const Sidebar = () => {
    const nav = [
      { key: 'dashboard', label: 'Dashboard', icon: '◻' },
      { key: 'leads', label: 'Leads', icon: '☰' },
      { key: 'pipeline', label: 'Pipeline', icon: '▥' },
    ];
    if (isAdminOrManager) nav.push({ key: 'analytics', label: 'Analytics', icon: '◈' });
    if (isAdminOrManager) nav.push({ key: 'scheduling', label: 'Scheduling', icon: '◷' });
    if (isAdmin) nav.push({ key: 'settings', label: 'Settings', icon: '⚙' });

    return (
      <div style={{ width: collapsed ? 56 : 210, background: C.navy, color: C.white, display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', flexShrink: 0, fontFamily: FONT, borderRight: `1px solid ${C.navyMid}` }}>
        <div style={{ padding: collapsed ? '16px 8px' : '16px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.navyMid}` }}>
          <img src={LOGO_URL} alt="G" style={{ height: 28, borderRadius: 6, flexShrink: 0 }} />
          {!collapsed && <div><div style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2 }}>Ginger CRM</div></div>}
        </div>

        {!collapsed && (
          <div style={{ padding: '10px 10px 4px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5, paddingLeft: 6 }}>Inbox</div>
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => { setActiveCategory(cat.key); if (view === 'detail') setView('leads'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '7px 8px', borderRadius: 6, border: 'none', background: activeCategory === cat.key ? 'rgba(14,165,160,0.12)' : 'transparent', color: activeCategory === cat.key ? C.tealLight : 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 12, fontWeight: activeCategory === cat.key ? 600 : 400, textAlign: 'left', marginBottom: 1, transition: 'all 0.15s', fontFamily: FONT }}>
                <span style={{ fontSize: 13 }}>{cat.icon}</span><span>{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: '6px 10px', flex: 1 }}>
          {!collapsed && <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5, paddingLeft: 6 }}>Navigate</div>}
          {nav.map(item => (
            <button key={item.key} onClick={() => setView(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 8, width: '100%', padding: collapsed ? '8px 0' : '7px 8px', borderRadius: 6, border: 'none', background: (view === item.key || (view === 'detail' && item.key === 'leads')) ? `${C.teal}18` : 'transparent', color: (view === item.key || (view === 'detail' && item.key === 'leads')) ? C.tealLight : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12, fontWeight: 500, textAlign: collapsed ? 'center' : 'left', justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: 1, transition: 'all 0.15s', fontFamily: FONT }}>
              <span style={{ fontSize: 13, flexShrink: 0, opacity: 0.8 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        <div style={{ padding: collapsed ? '10px 4px' : '10px 14px', borderTop: `1px solid ${C.navyMid}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: `${C.teal}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.teal, flexShrink: 0 }}>{user.name?.charAt(0)}</div>
          {!collapsed && <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{ROLE_LABELS[user.role]}</div>
          </div>}
        </div>
      </div>
    );
  };

  const TopBar = () => (
    <div style={{ background: C.white, padding: '0 22px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, flexShrink: 0, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.slate, padding: '2px' }}>☰</button>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0, textTransform: 'capitalize' }}>
          {view === 'detail' ? `${selectedLead?.first_name || ''} ${selectedLead?.last_name || ''}` : view}
        </h2>
        {view !== 'detail' && <CategoryBadge category={activeCategory} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {followUps.length > 0 && <span onClick={() => setView('leads')} style={{ padding: '3px 9px', borderRadius: 6, background: C.amberBg, color: '#92400e', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>⏰ {followUps.length} due</span>}
        <button onClick={exportCSV} style={btnTopbar}>Export</button>
        <button onClick={onLogout} style={btnTopbar}>Logout</button>
      </div>
    </div>
  );

  // ---- DASHBOARD ----
  const Dashboard = () => {
    if (!stats) return <Loader />;
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Patients', value: stats.total, color: C.teal },
            { label: 'New Today', value: stats.today, color: C.green },
            { label: 'Urgent', value: stats.urgent, color: C.red },
            { label: 'Follow-Ups', value: stats.followUpDue, color: C.orange },
            { label: 'Conv. Rate', value: `${stats.conversionRate}%`, color: C.purple },
          ].map((s, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 10, padding: '16px 18px', border: `1px solid ${C.borderLight}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: s.color }} />
              <div style={{ fontSize: 10, color: C.slate, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4, fontFamily: FONT }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.dark, fontFamily: FONT }}>{s.value}</div>
            </div>
          ))}
        </div>

        {isAdminOrManager && stats.byCategory && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.key} onClick={() => { setActiveCategory(cat.key); setView('leads'); }} style={{ background: C.white, borderRadius: 10, padding: '14px 16px', border: `1px solid ${activeCategory === cat.key ? cat.color + '40' : C.borderLight}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16 }}>{cat.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.dark, marginTop: 3, fontFamily: FONT }}>{cat.label}</div>
                    <div style={{ fontSize: 10, color: C.slateLight }}>{cat.desc}</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: cat.color, fontFamily: FONT }}>{stats.byCategory[cat.key] || 0}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {followUps.length > 0 && (
          <div style={{ background: `linear-gradient(135deg, ${C.amberBg}, #fef3c7)`, border: `1px solid #fbbf24`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 8, fontFamily: FONT }}>⏰ Follow-Ups Due ({followUps.length})</div>
            {followUps.slice(0, 4).map(l => (
              <div key={l.lead_id} onClick={() => openDetail(l)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #fde68a', cursor: 'pointer' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.dark, fontFamily: FONT }}>{l.first_name} {l.last_name} <span style={{ fontSize: 11, color: C.slate, fontWeight: 400 }}>· {l.nationality}</span></span>
                <span style={{ fontSize: 10, color: '#92400e' }}>{l.follow_up_note?.substring(0, 30) || 'Follow up'}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: C.white, borderRadius: 10, padding: 18, border: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 12, fontFamily: FONT }}>Pipeline</div>
            {STATUSES.map(s => {
              const count = stats.byStatus[s.key] || 0;
              const pct = stats.total > 0 ? (count / stats.total * 100) : 0;
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, width: 75, textAlign: 'right', color: C.slate, fontFamily: FONT }}>{s.label}</span>
                  <div style={{ flex: 1, height: 18, background: C.offWhite, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 4, minWidth: count > 0 ? 18 : 0, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, width: 24, color: s.color, fontFamily: FONT }}>{count}</span>
                </div>
              );
            })}
          </div>

          <div style={{ background: C.white, borderRadius: 10, padding: 18, border: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 12, fontFamily: FONT }}>Recent Leads</div>
            {leads.filter(l => l.lead_category === 'patient' || !l.lead_category).slice(0, 6).map(l => (
              <div key={l.lead_id} onClick={() => openDetail(l)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer' }}>
                <div><div style={{ fontSize: 12, fontWeight: 600, color: C.dark, fontFamily: FONT }}>{l.first_name} {l.last_name}</div><div style={{ fontSize: 10, color: C.slateLight }}>{l.nationality} · {l.treatment_sought || l.service_type}</div></div>
                <div style={{ textAlign: 'right' }}><StatusBadge status={l.status} small /><div style={{ fontSize: 9, color: C.slateLight, marginTop: 2 }}>{timeAgo(l.created_at)}</div></div>
              </div>
            ))}
          </div>
        </div>

        {isAdminOrManager && performance.length > 0 && (
          <div style={{ background: C.white, borderRadius: 10, padding: 18, border: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 14, fontFamily: FONT }}>Team Performance (30 Days)</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(performance.length, 4)}, 1fr)`, gap: 12 }}>
              {performance.map((p, i) => {
                const colors = [C.teal, C.blue, C.green, C.purple];
                const rate = p.total > 0 ? Math.round((parseInt(p.converted) / parseInt(p.total)) * 100) : 0;
                const c = colors[i % colors.length];
                return (
                  <div key={p.assigned_counselor} style={{ padding: 14, background: `${c}06`, borderRadius: 8, border: `1px solid ${c}12` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: c }}>{p.assigned_counselor?.charAt(0)}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, fontFamily: FONT }}>{p.assigned_counselor}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><div style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>{p.total}</div><div style={{ fontSize: 9, color: C.slateLight }}>Total</div></div>
                      <div><div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>{p.converted}</div><div style={{ fontSize: 9, color: C.slateLight }}>Converted</div></div>
                      <div><div style={{ fontSize: 20, fontWeight: 800, color: c }}>{rate}%</div><div style={{ fontSize: 9, color: C.slateLight }}>Conv Rate</div></div>
                      <div><div style={{ fontSize: 20, fontWeight: 800, color: C.amber }}>{p.overdue_followups || 0}</div><div style={{ fontSize: 9, color: C.slateLight }}>Overdue</div></div>
                    </div>
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
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '7px 12px', flex: '1 1 280px', maxWidth: 360 }}>
        <span style={{ color: C.slateLight, fontSize: 13 }}>⌕</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ border: 'none', outline: 'none', fontSize: 12, flex: 1, background: 'transparent', color: C.dark, fontFamily: FONT }} />
        {search && <span style={{ cursor: 'pointer', color: C.slateLight, fontSize: 11 }} onClick={() => setSearch('')}>✕</span>}
      </div>
      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selStyle}><option value="all">All Status</option>{STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
      {isAdminOrManager && <select value={filterCounselor} onChange={e => setFilterCounselor(e.target.value)} style={selStyle}><option value="all">All Counselors</option>{counselors.map(c => <option key={c} value={c}>{c}</option>)}</select>}
      <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)} style={selStyle}><option value="all">All Urgency</option><option>Emergency</option><option>Urgent</option><option>Semi-Urgent</option><option>Routine</option></select>
      <div style={{ marginLeft: 'auto', fontSize: 11, color: C.slate }}>{leads.length} leads</div>
    </div>
  );

  // ---- LEADS TABLE ----
  const LeadsList = () => (
    <div>
      <Toolbar />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', background: C.white, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.borderLight}`, borderCollapse: 'collapse', fontFamily: FONT }}>
          <thead><tr style={{ background: C.cream }}>
            {['Lead', 'Contact', 'Treatment', 'Status', 'Counselor', 'Added'].map(h => (
              <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 9.5, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1.5px solid ${C.border}` }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.lead_id} onClick={() => openDetail(l)} style={{ cursor: 'pointer', borderBottom: `1px solid ${C.borderLight}`, transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = C.cream} onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={td}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><PriorityDot priority={l.priority} /><div><div style={{ fontWeight: 600, fontSize: 12, color: C.dark }}>{l.prefix} {l.first_name} {l.last_name}</div><div style={{ fontSize: 10, color: C.slateLight }}>🌍 {l.nationality}</div></div></div></td>
                <td style={td}><div style={{ fontSize: 11, color: C.slateDark }}>{l.contact_preference || '—'}</div><div style={{ fontSize: 10, color: C.slateLight }}>{l.email}</div></td>
                <td style={td}><div style={{ fontSize: 12, fontWeight: 500, color: C.dark }}>{l.treatment_sought || l.service_type || '—'}</div>{l.urgency_level && <span style={{ fontSize: 9, fontWeight: 600, color: URGENCY_COLORS[l.urgency_level] || C.slate }}>{l.urgency_level}</span>}</td>
                <td style={td}><StatusBadge status={l.status} small /></td>
                <td style={td}><span style={{ fontSize: 12, color: C.slateDark }}>{l.assigned_counselor}</span></td>
                <td style={td}><span style={{ fontSize: 10, color: C.slateLight }}>{timeAgo(l.created_at)}</span></td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={6} style={{ ...td, textAlign: 'center', padding: 40, color: C.slateLight }}>No leads found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ---- PIPELINE ----
  const Pipeline = () => (
    <div>
      <Toolbar />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10 }}>
        {STATUSES.filter(s => s.key !== 'lost').map(status => {
          const col = leads.filter(l => l.status === status.key);
          return (
            <div key={status.key} style={{ flex: '1 1 0', minWidth: 190, background: C.cream, borderRadius: 10, padding: 8, fontFamily: FONT }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 4px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: status.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{status.label}</span>
                <span style={{ fontSize: 10, background: status.bg, color: status.color, padding: '1px 7px', borderRadius: 8, fontWeight: 700 }}>{col.length}</span>
              </div>
              {col.map(l => (
                <div key={l.lead_id} onClick={() => openDetail(l)} style={{ background: C.white, borderRadius: 8, padding: '9px 11px', border: `1px solid ${C.borderLight}`, cursor: 'pointer', marginBottom: 6, transition: 'box-shadow 0.15s' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{l.first_name} {l.last_name}</span><PriorityDot priority={l.priority} /></div>
                  <div style={{ fontSize: 10, color: C.slateLight, marginTop: 2 }}>{l.nationality}</div>
                  <div style={{ fontSize: 10, color: C.slateDark, marginTop: 1 }}>{l.treatment_sought || l.service_type}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 5, borderTop: `1px solid ${C.borderLight}`, fontSize: 9, color: C.slateLight }}><span>{l.assigned_counselor}</span><span>{timeAgo(l.created_at)}</span></div>
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
    const [fuDate, setFuDate] = useState('');
    const [fuNote, setFuNote] = useState('');
    const [fuMethod, setFuMethod] = useState('whatsapp');
    const [activeTab, setActiveTab] = useState('overview');
    const lead = selectedLead;
    if (!lead) return null;

    const waUrl = lead.isd && lead.phone ? `https://wa.me/${(lead.isd + lead.phone).replace(/[^0-9]/g, '')}` : null;
    const saveField = async (field, value) => { await updateLead(lead.lead_id, { [field]: value }); };

    const handleAddFollowUp = async () => {
      if (!fuDate) return;
      try { await leadsApi.addFollowUp(lead.lead_id, { scheduled_date: fuDate, note: fuNote, method: fuMethod }); const updated = await leadsApi.get(lead.lead_id); setSelectedLead(updated); setFuDate(''); setFuNote(''); } catch (e) { console.error(e); }
    };

    const completeFollowUp = async (fuId, outcome) => {
      try { await leadsApi.updateFollowUp(lead.lead_id, fuId, { status: 'completed', outcome }); const updated = await leadsApi.get(lead.lead_id); setSelectedLead(updated); } catch (e) { console.error(e); }
    };

    const tabs = [
      { key: 'overview', label: 'Overview' },
      { key: 'medical', label: 'Medical' },
      { key: 'followups', label: `Follow-ups${(lead.follow_ups||[]).length ? ` (${(lead.follow_ups||[]).length})` : ''}` },
      { key: 'attachments', label: `Docs${(lead.attachments||[]).length ? ` (${(lead.attachments||[]).length})` : ''}` },
      { key: 'timeline', label: 'Timeline' },
      { key: 'notes', label: `Notes${(lead.notes||[]).length ? ` (${(lead.notes||[]).length})` : ''}` },
    ];

    return (
      <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.borderLight}`, overflow: 'hidden', fontFamily: FONT }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, color: C.white, padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button onClick={() => setView('leads')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', color: C.white, fontSize: 12, fontFamily: FONT }}>← Back</button>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{lead.prefix} {lead.first_name} {lead.last_name}</h2>
                <CategoryBadge category={lead.lead_category} small />
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>🌍 {lead.nationality} · {lead.email} · {lead.isd} {lead.phone} · {lead.lead_id}</div>
            </div>
            <StatusBadge status={lead.status} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={lead.status} onChange={e => updateLead(lead.lead_id, { status: e.target.value })} style={hdrSel}>{STATUSES.map(s => <option key={s.key} value={s.key} style={{ color: C.dark }}>{s.label}</option>)}</select>
            {isAdminOrManager && <select value={lead.assigned_counselor} onChange={e => updateLead(lead.lead_id, { assigned_counselor: e.target.value })} style={hdrSel}>{counselors.map(c => <option key={c} value={c} style={{ color: C.dark }}>{c}</option>)}</select>}
            <select value={lead.priority || 'medium'} onChange={e => updateLead(lead.lead_id, { priority: e.target.value })} style={hdrSel}>{PRIORITIES.map(p => <option key={p.key} value={p.key} style={{ color: C.dark }}>{p.label}</option>)}</select>
            <select value={lead.lead_category || 'patient'} onChange={e => updateLead(lead.lead_id, { lead_category: e.target.value })} style={hdrSel}>{CATEGORIES.map(c => <option key={c.key} value={c.key} style={{ color: C.dark }}>{c.label}</option>)}</select>
            {waUrl && <a href={waUrl} target="_blank" rel="noreferrer" style={{ padding: '5px 12px', borderRadius: 6, background: '#25D366', color: C.white, textDecoration: 'none', fontSize: 11, fontWeight: 600 }}>WhatsApp</a>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.borderLight}`, background: C.cream }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '9px 16px', fontSize: 11, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? C.teal : C.slate, background: 'none', border: 'none', borderBottom: activeTab === tab.key ? `2px solid ${C.teal}` : '2px solid transparent', cursor: 'pointer', fontFamily: FONT }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ padding: '18px 22px' }}>
          {activeTab === 'overview' && (
            <div>
              <SectionLabel>Enquirer</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 20px', marginBottom: 22 }}>
                <EditableField label="Prefix" value={lead.prefix} field="prefix" onSave={saveField} options={['Mr.', 'Mrs.', 'Ms.', 'Dr.']} />
                <EditableField label="First Name" value={lead.first_name} field="first_name" onSave={saveField} />
                <EditableField label="Last Name" value={lead.last_name} field="last_name" onSave={saveField} />
                <EditableField label="Email" value={lead.email} field="email" onSave={saveField} type="email" />
                <EditableField label="ISD" value={lead.isd} field="isd" onSave={saveField} />
                <EditableField label="Phone" value={lead.phone} field="phone" onSave={saveField} />
                <EditableField label="Nationality" value={lead.nationality} field="nationality" onSave={saveField} />
                <EditableField label="Contact Via" value={lead.contact_preference} field="contact_preference" onSave={saveField} options={['whatsapp', 'telegram', 'email', 'phone', 'pending']} />
                <EditableField label="Patient Relation" value={lead.patient_relation} field="patient_relation" onSave={saveField} options={['self', 'family_member', 'friend', 'doctor_referral', 'agent']} />
              </div>

              {lead.patient_relation !== 'self' && (<><SectionLabel>Patient Details</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 20px', marginBottom: 22 }}>
                  <EditableField label="Relationship" value={lead.relationship_type} field="relationship_type" onSave={saveField} options={['Spouse','Parent','Child','Sibling','Friend','Doctor','Agent','Other']} />
                  <EditableField label="Patient Name" value={lead.patient_first_name} field="patient_first_name" onSave={saveField} />
                  <EditableField label="Patient Last Name" value={lead.patient_last_name} field="patient_last_name" onSave={saveField} />
                  <EditableField label="Age" value={lead.patient_age} field="patient_age" onSave={saveField} />
                  <EditableField label="Patient Email" value={lead.patient_email} field="patient_email" onSave={saveField} type="email" />
                  <EditableField label="Patient Phone" value={lead.patient_phone} field="patient_phone" onSave={saveField} />
                </div></>)}

              <SectionLabel>Inquiry</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 20px', marginBottom: 22 }}>
                <EditableField label="Service Type" value={lead.service_type} field="service_type" onSave={saveField} options={['Medical Treatment','Second Opinion','Wellness & Checkup','Dental','IVF / Fertility','Cosmetic Surgery','Organ Transplant','Cardiac','Orthopedic','Oncology','Neurology','Other']} />
                <EditableField label="Treatment" value={lead.treatment_sought} field="treatment_sought" onSave={saveField} />
                <EditableField label="Urgency" value={lead.urgency_level} field="urgency_level" onSave={saveField} options={['Emergency','Urgent','Semi-Urgent','Routine']} />
              </div>
              <EditableField label="Message" value={lead.message} field="message" onSave={saveField} type="textarea" />
              <div style={{ marginTop: 10 }}><EditableField label="Clinical Notes" value={lead.clinical_notes} field="clinical_notes" onSave={saveField} type="textarea" /></div>

              <SectionLabel style={{ marginTop: 20 }}>Travel & Billing</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 20px' }}>
                <EditableField label="Est. Arrival" value={lead.estimated_arrival?.split('T')[0]} field="estimated_arrival" onSave={saveField} type="date" />
                <EditableField label="Est. Departure" value={lead.estimated_departure?.split('T')[0]} field="estimated_departure" onSave={saveField} type="date" />
                <EditableField label="Billing Amount" value={lead.billing_amount} field="billing_amount" onSave={saveField} type="number" />
                <EditableField label="Currency" value={lead.billing_currency} field="billing_currency" onSave={saveField} options={['USD','INR','AED','EUR','GBP']} />
                <EditableField label="Billing Status" value={lead.billing_status} field="billing_status" onSave={saveField} options={['Pending','Estimate Sent','Deposit Received','Fully Paid','Refund Processed']} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 10, color: C.slateLight, background: C.cream, padding: 12, borderRadius: 8, marginTop: 18 }}>
                <div><b>ID:</b> {lead.lead_id}</div>
                <div><b>Source:</b> {lead.referrer || '—'}</div>
                <div><b>Created:</b> {fmtDate(lead.created_at)}</div>
              </div>
            </div>
          )}

          {activeTab === 'medical' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <EditableField label="Medical History" value={lead.medical_history} field="medical_history" onSave={saveField} type="textarea" placeholder="Previous treatments, allergies, conditions..." />
              <EditableField label="Primary Diagnosis" value={lead.primary_diagnosis} field="primary_diagnosis" onSave={saveField} type="textarea" />
              <EditableField label="Referred Hospitals" value={lead.referred_hospitals} field="referred_hospitals" onSave={saveField} multiOptions={HOSPITAL_OPTIONS} />
              <EditableField label="Recommended Doctors" value={lead.recommended_doctors} field="recommended_doctors" onSave={saveField} multiOptions={DOCTOR_OPTIONS} />
              <div style={{ padding: 14, background: C.cream, borderRadius: 8 }}>
                <SectionLabel>Patient Review</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14 }}>
                  <EditableField label="Rating (1-5)" value={lead.review_rating} field="review_rating" onSave={saveField} options={['1','2','3','4','5']} />
                  <EditableField label="Review" value={lead.review_text} field="review_text" onSave={saveField} type="textarea" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'followups' && (
            <div>
              <div style={{ background: C.cream, borderRadius: 8, padding: 14, marginBottom: 16, border: `1px solid ${C.borderLight}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.dark, marginBottom: 8, fontFamily: FONT }}>Schedule Follow-up</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
                  <div><label style={lblSm}>Date & Time</label><input type="datetime-local" value={fuDate} onChange={e => setFuDate(e.target.value)} style={inputSmall} /></div>
                  <div><label style={lblSm}>Via</label><select value={fuMethod} onChange={e => setFuMethod(e.target.value)} style={inputSmall}><option value="whatsapp">WhatsApp</option><option value="phone">Phone</option><option value="email">Email</option><option value="telegram">Telegram</option></select></div>
                  <div style={{ flex: 1 }}><label style={lblSm}>Note</label><input value={fuNote} onChange={e => setFuNote(e.target.value)} placeholder="e.g. Send estimate" style={{ ...inputSmall, width: '100%' }} /></div>
                  <button onClick={handleAddFollowUp} disabled={!fuDate} style={{ ...btnSmallTeal, opacity: fuDate ? 1 : 0.5, padding: '7px 16px' }}>Schedule</button>
                </div>
              </div>
              {(lead.follow_ups || []).map(fu => {
                const isOverdue = new Date(fu.scheduled_date) < new Date() && fu.status === 'pending';
                return (
                  <div key={fu.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: isOverdue ? C.redBg : fu.status === 'completed' ? C.greenBg : C.white, borderRadius: 8, border: `1px solid ${isOverdue ? '#fecaca' : fu.status === 'completed' ? '#bbf7d0' : C.borderLight}`, marginBottom: 6 }}>
                    <div style={{ fontSize: 16 }}>{fu.method === 'whatsapp' ? '💬' : fu.method === 'phone' ? '📞' : '📧'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{fu.note || 'Follow up'}</div>
                      <div style={{ fontSize: 10, color: C.slateLight }}>{fmtDate(fu.scheduled_date)} · {fu.method}{isOverdue ? ' · OVERDUE' : ''}{fu.status === 'completed' ? ' · ✓ Done' : ''}</div>
                    </div>
                    {fu.status === 'pending' && <button onClick={() => { const o = window.prompt('Outcome?', 'Contacted'); if (o !== null) completeFollowUp(fu.id, o); }} style={btnSmallTeal}>Done</button>}
                  </div>
                );
              })}
              {(lead.follow_ups || []).length === 0 && <div style={{ textAlign: 'center', padding: 30, color: C.slateLight, fontSize: 12 }}>No follow-ups scheduled</div>}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {ATTACHMENT_CATEGORIES.map(cat => {
                  const count = (lead.attachments || []).filter(a => a.category === cat).length;
                  return <span key={cat} style={{ padding: '4px 10px', borderRadius: 6, background: count > 0 ? `${C.teal}10` : C.white, border: `1px solid ${count > 0 ? C.teal + '30' : C.border}`, fontSize: 10, color: count > 0 ? C.teal : C.slate, fontWeight: count > 0 ? 600 : 400, fontFamily: FONT }}>{cat}{count > 0 && ` (${count})`}</span>;
                })}
              </div>
              <div style={{ fontSize: 10, color: C.slateLight, padding: '8px 10px', background: C.cream, borderRadius: 6, marginBottom: 12 }}>Upload files to cloud storage, then paste the URL here.</div>
              {(lead.attachments || []).map(att => (
                <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: C.white, borderRadius: 8, border: `1px solid ${C.borderLight}`, marginBottom: 5 }}>
                  <span>📎</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{att.file_name}</div><div style={{ fontSize: 9, color: C.slateLight }}>{att.category} · {att.uploaded_by} · {fmtDateShort(att.created_at)}</div></div>
                  <a href={att.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: C.teal, fontWeight: 600, textDecoration: 'none' }}>Open</a>
                </div>
              ))}
              {(lead.attachments || []).length === 0 && <div style={{ textAlign: 'center', padding: 30, color: C.slateLight, fontSize: 12 }}>No attachments</div>}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{ position: 'relative', paddingLeft: 22 }}>
              <div style={{ position: 'absolute', left: 6, top: 8, bottom: 8, width: 2, background: C.border }} />
              {(lead.timeline || []).map((t, idx) => {
                const s = STATUSES.find(st => st.key === t.status) || STATUSES[0];
                return (
                  <div key={t.id || idx} style={{ position: 'relative', marginBottom: 14, paddingLeft: 14 }}>
                    <div style={{ position: 'absolute', left: -19, top: 3, width: 12, height: 12, borderRadius: '50%', background: s.color, border: `2px solid ${C.white}`, boxShadow: `0 0 0 2px ${s.color}25` }} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: C.slateLight }}>{t.changed_by} · {fmtDate(t.created_at)}</div>
                    {t.note && <div style={{ fontSize: 11, color: C.slateDark, marginTop: 3, background: C.cream, padding: '5px 8px', borderRadius: 5 }}>{t.note}</div>}
                  </div>
                );
              })}
              {(lead.timeline || []).length === 0 && <div style={{ textAlign: 'center', padding: 30, color: C.slateLight, fontSize: 12 }}>No status changes</div>}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." style={{ flex: 1, padding: 10, borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 12, resize: 'vertical', minHeight: 60, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <button disabled={!noteText.trim()} onClick={() => { if (noteText.trim()) { addNote(lead.lead_id, noteText.trim()); setNoteText(''); } }} style={{ ...btnSmallTeal, opacity: noteText.trim() ? 1 : 0.5 }}>Add Note</button>
              <div style={{ marginTop: 16 }}>
                {(lead.notes || []).map(n => (
                  <div key={n.id} style={{ background: C.cream, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${C.teal}`, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, lineHeight: 1.6, color: C.dark }}>{n.text}</div>
                    <div style={{ fontSize: 10, color: C.slateLight, marginTop: 4 }}>{n.author} · {fmtDate(n.created_at)}</div>
                  </div>
                ))}
              </div>
              {(lead.activity || []).length > 0 && (<div style={{ marginTop: 20 }}>
                <SectionLabel>Activity Log</SectionLabel>
                {(lead.activity || []).map(a => (
                  <div key={a.id} style={{ fontSize: 10, color: C.slate, padding: '4px 0', borderBottom: `1px solid ${C.borderLight}` }}>
                    <b>{a.user_name}</b> {a.action.replace(/_/g, ' ')} — {fmtDate(a.created_at)}
                  </div>
                ))}
              </div>)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---- ANALYTICS ----
  const Analytics = () => {
    if (!stats || !performance.length) return <Loader />;
    const totalConverted = performance.reduce((a, p) => a + parseInt(p.converted || 0), 0);
    const totalLeads = performance.reduce((a, p) => a + parseInt(p.total || 0), 0);
    const totalLost = performance.reduce((a, p) => a + parseInt(p.lost || 0), 0);
    const avgConvRate = totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0;

    return (
      <div style={{ fontFamily: FONT }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[{ label: 'Total (30d)', value: totalLeads, color: C.teal }, { label: 'Converted', value: totalConverted, color: C.green }, { label: 'Lost', value: totalLost, color: C.red }, { label: 'Conv Rate', value: `${avgConvRate}%`, color: C.purple }].map((s, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 10, padding: '16px 18px', border: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 9, color: C.slate, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: C.white, borderRadius: 10, padding: 18, border: `1px solid ${C.borderLight}`, marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 14 }}>Counselor Comparison</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: `2px solid ${C.borderLight}` }}>
              {['Counselor', 'Total', 'Converted', 'Active', 'Lost', 'Conv %', 'Overdue', 'Avg Resp', 'Week'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: C.slate, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{performance.map(p => {
              const rate = p.total > 0 ? Math.round((parseInt(p.converted) / parseInt(p.total)) * 100) : 0;
              return (
                <tr key={p.assigned_counselor} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600, fontSize: 12 }}>{p.assigned_counselor}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{p.total}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, color: C.green, fontWeight: 700 }}>{p.converted}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, color: C.amber }}>{p.active}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, color: C.red }}>{p.lost}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 40, height: 5, background: C.offWhite, borderRadius: 3 }}><div style={{ height: '100%', width: `${rate}%`, background: rate > 30 ? C.green : rate > 15 ? C.amber : C.red, borderRadius: 3 }} /></div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: rate > 30 ? C.green : rate > 15 ? C.amber : C.red }}>{rate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 12, color: parseInt(p.overdue_followups) > 0 ? C.red : C.slateLight, fontWeight: parseInt(p.overdue_followups) > 0 ? 700 : 400 }}>{p.overdue_followups || 0}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, color: C.slate }}>{p.avg_response_hours || '—'}h</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{p.this_week || 0}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>

        {stats.weekly && stats.weekly.length > 0 && (
          <div style={{ background: C.white, borderRadius: 10, padding: 18, border: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 14 }}>Lead Volume (30 Days)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 100, padding: '0 4px' }}>
              {stats.weekly.map((w, i) => {
                const max = Math.max(...stats.weekly.map(x => parseInt(x.count)), 1);
                const h = (parseInt(w.count) / max) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 8, fontWeight: 600, color: C.slate }}>{parseInt(w.count)}</span>
                    <div style={{ width: '100%', height: `${h}%`, minHeight: 3, background: `linear-gradient(180deg, ${C.teal}, ${C.teal}80)`, borderRadius: '3px 3px 0 0' }} />
                    <span style={{ fontSize: 7, color: C.slateLight }}>{new Date(w.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---- SCHEDULING ----
  const Scheduling = () => {
    const [users, setUsers] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [loadingSched, setLoadingSched] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [weekSlots, setWeekSlots] = useState({});
    const [newOverride, setNewOverride] = useState({ user_id: '', override_date: '', is_off: true, reason: '' });
    const [msg, setMsg] = useState('');

    const fetchSchedules = async () => {
      try {
        const [usersData, schedData, overData] = await Promise.all([
          usersApi.list(), schedulesApi.list(), schedulesApi.overrides()
        ]);
        setUsers(usersData.filter(u => u.is_active));
        setSchedules(schedData);
        setOverrides(overData);
      } catch (e) { console.error(e); }
      setLoadingSched(false);
    };

    useEffect(() => { fetchSchedules(); }, []);

    const startEdit = (u) => {
      setEditingUser(u);
      const userScheds = schedules.filter(s => s.user_id === u.id);
      const slots = {};
      for (let d = 0; d < 7; d++) {
        const ds = userScheds.find(s => s.day_of_week === d);
        slots[d] = ds ? { start: ds.slot_start?.substring(0,5), end: ds.slot_end?.substring(0,5), active: true } : { start: '', end: '', active: false };
      }
      setWeekSlots(slots);
      setMsg('');
    };

    const saveSchedule = async () => {
      if (!editingUser) return;
      const entries = [];
      for (let d = 0; d < 7; d++) {
        if (weekSlots[d]?.active && weekSlots[d]?.start && weekSlots[d]?.end) {
          entries.push({ day_of_week: d, slot_start: weekSlots[d].start, slot_end: weekSlots[d].end });
        }
      }
      try {
        await schedulesApi.bulkSet(editingUser.id, entries);
        setMsg(entries.length > 0 ? `Schedule saved for ${editingUser.display_name} (${entries.length} days)` : `Schedule cleared for ${editingUser.display_name} — no slots assigned`);
        setEditingUser(null);
        fetchSchedules();
      } catch (e) { setMsg(e.message); }
    };

    const handleOverride = async () => {
      if (!newOverride.user_id || !newOverride.override_date) { setMsg('Select counselor and date'); return; }
      try {
        await schedulesApi.addOverride(newOverride);
        setMsg('Override added');
        setNewOverride({ user_id: '', override_date: '', is_off: true, reason: '' });
        fetchSchedules();
      } catch (e) { setMsg(e.message); }
    };

    if (loadingSched) return <Loader />;

    const getUserScheduleDisplay = (u) => {
      const userScheds = schedules.filter(s => s.user_id === u.id);
      if (userScheds.length === 0) return { text: 'No slots assigned', color: C.slateLight };
      const days = userScheds.map(s => `${DAY_SHORT[s.day_of_week]} ${s.slot_start?.substring(0,5)}–${s.slot_end?.substring(0,5)}`).join(' · ');
      return { text: days, color: C.slateDark };
    };

    return (
      <div style={{ fontFamily: FONT }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div><h2 style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: 0 }}>Counselor Scheduling</h2><p style={{ fontSize: 11, color: C.slateLight, margin: 0 }}>Set weekly shift slots per counselor. Leave unset for no assignment.</p></div>
        </div>

        {msg && <div style={{ background: msg.includes('error') || msg.includes('Select') ? C.redBg : C.greenBg, color: msg.includes('error') || msg.includes('Select') ? C.red : C.green, padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{msg}</div>}

        {/* Schedule Grid */}
        <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.borderLight}`, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>Weekly Schedules</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: C.cream }}>
              <th style={thSched}>Counselor</th>
              {DAY_SHORT.map(d => <th key={d} style={thSched}>{d}</th>)}
              <th style={thSched}>Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u => {
                const userScheds = schedules.filter(s => s.user_id === u.id);
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${C.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.teal }}>{u.display_name?.charAt(0)}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{u.display_name}</div>
                          <div style={{ fontSize: 9, color: C.slateLight }}>{u.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    {[0,1,2,3,4,5,6].map(d => {
                      const slot = userScheds.find(s => s.day_of_week === d);
                      return (
                        <td key={d} style={{ padding: '6px 4px', textAlign: 'center', fontSize: 9 }}>
                          {slot ? (
                            <div style={{ background: `${C.teal}10`, borderRadius: 4, padding: '3px 4px', color: C.teal, fontWeight: 600, fontFamily: 'monospace' }}>
                              {slot.slot_start?.substring(0,5)}<br/>{slot.slot_end?.substring(0,5)}
                            </div>
                          ) : (
                            <span style={{ color: C.slateLight }}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                      <button onClick={() => startEdit(u)} style={{ ...btnSmallTeal, padding: '4px 10px', fontSize: 10 }}>Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {editingUser && (
          <div style={{ background: C.white, borderRadius: 10, border: `2px solid ${C.teal}30`, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 14 }}>Edit Schedule: {editingUser.display_name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 16 }}>
              {[0,1,2,3,4,5,6].map(d => (
                <div key={d} style={{ padding: 10, background: weekSlots[d]?.active ? `${C.teal}06` : C.cream, borderRadius: 8, border: `1px solid ${weekSlots[d]?.active ? C.teal + '25' : C.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.dark, marginBottom: 6 }}>{DAY_NAMES[d]}</div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, color: C.slate, marginBottom: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={weekSlots[d]?.active || false} onChange={e => setWeekSlots({ ...weekSlots, [d]: { ...weekSlots[d], active: e.target.checked } })} />
                    Active
                  </label>
                  {weekSlots[d]?.active && (
                    <div>
                      <input type="time" value={weekSlots[d]?.start || ''} onChange={e => setWeekSlots({ ...weekSlots, [d]: { ...weekSlots[d], start: e.target.value } })} style={{ width: '100%', padding: '4px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 11, marginBottom: 4, boxSizing: 'border-box' }} />
                      <input type="time" value={weekSlots[d]?.end || ''} onChange={e => setWeekSlots({ ...weekSlots, [d]: { ...weekSlots[d], end: e.target.value } })} style={{ width: '100%', padding: '4px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 11, boxSizing: 'border-box' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={saveSchedule} style={{ ...btnSmallTeal, padding: '8px 20px' }}>Save Schedule</button>
              <button onClick={() => setEditingUser(null)} style={btnSmallGhost}>Cancel</button>
              <button onClick={() => { setWeekSlots(Object.fromEntries([0,1,2,3,4,5,6].map(d => [d, { start: '', end: '', active: false }]))); }} style={{ ...btnSmallGhost, color: C.red, borderColor: '#fecaca' }}>Clear All</button>
            </div>
          </div>
        )}

        {/* Date Overrides */}
        <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.borderLight}`, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Date Overrides (Holidays, Sick Days, Special Shifts)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'end', marginBottom: 12, flexWrap: 'wrap' }}>
            <div><label style={lblSm}>Counselor</label><select value={newOverride.user_id} onChange={e => setNewOverride({...newOverride, user_id: parseInt(e.target.value)})} style={inputSmall}><option value="">Select</option>{users.map(u => <option key={u.id} value={u.id}>{u.display_name}</option>)}</select></div>
            <div><label style={lblSm}>Date</label><input type="date" value={newOverride.override_date} onChange={e => setNewOverride({...newOverride, override_date: e.target.value})} style={inputSmall} /></div>
            <div><label style={lblSm}>Type</label><select value={newOverride.is_off ? 'off' : 'custom'} onChange={e => setNewOverride({...newOverride, is_off: e.target.value === 'off'})} style={inputSmall}><option value="off">Day Off</option><option value="custom">Custom Shift</option></select></div>
            <div style={{ flex: 1 }}><label style={lblSm}>Reason</label><input value={newOverride.reason} onChange={e => setNewOverride({...newOverride, reason: e.target.value})} placeholder="e.g. Public holiday" style={{ ...inputSmall, width: '100%' }} /></div>
            <button onClick={handleOverride} style={btnSmallTeal}>Add</button>
          </div>
          {overrides.length > 0 ? overrides.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: C.cream, borderRadius: 6, marginBottom: 4, fontSize: 11 }}>
              <span style={{ fontWeight: 600, color: C.dark }}>{o.display_name}</span>
              <span style={{ color: C.slate }}>{fmtDateShort(o.override_date)}</span>
              <span style={{ background: o.is_off ? C.redBg : C.greenBg, color: o.is_off ? C.red : C.green, padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600 }}>{o.is_off ? 'OFF' : 'CUSTOM'}</span>
              {o.reason && <span style={{ color: C.slateLight }}>{o.reason}</span>}
              <button onClick={async () => { await schedulesApi.removeOverride(o.id); fetchSchedules(); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 10 }}>✕</button>
            </div>
          )) : <div style={{ fontSize: 11, color: C.slateLight, padding: 10, textAlign: 'center' }}>No upcoming overrides</div>}
        </div>
      </div>
    );
  };

  // ---- SETTINGS ----
  const Settings = () => {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState({ username: '', password: '', displayName: '', role: 'counselor', email: '', whatsapp: '', telegram: '' });
    const [resetPwUser, setResetPwUser] = useState(null);
    const [newPw, setNewPw] = useState('');
    const [msg, setMsg] = useState('');

    const fetchUsers = async () => { try { setUsers(await usersApi.list()); } catch (e) { console.error(e); } setLoadingUsers(false); };
    useEffect(() => { fetchUsers(); }, []);

    const handleSubmit = async () => {
      setMsg('');
      try {
        if (editUser) { await usersApi.update(editUser.id, { displayName: form.displayName, role: form.role, email: form.email, whatsapp: form.whatsapp, telegram: form.telegram }); setMsg('Updated!'); }
        else { if (!form.username || !form.password || !form.displayName) { setMsg('All fields required'); return; } await usersApi.create(form); setMsg('Created!'); }
        fetchUsers(); setShowForm(false); setEditUser(null);
      } catch (e) { setMsg(e.message); }
    };

    return (
      <div style={{ fontFamily: FONT }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: 0 }}>User Management</h2>
          <button onClick={() => { setEditUser(null); setForm({ username: '', password: '', displayName: '', role: 'counselor', email: '', whatsapp: '', telegram: '' }); setShowForm(true); setMsg(''); }} style={btnSmallTeal}>+ Add User</button>
        </div>
        {msg && <div style={{ background: msg.includes('error') || msg.includes('required') ? C.redBg : C.greenBg, color: msg.includes('error') || msg.includes('required') ? C.red : C.green, padding: '7px 12px', borderRadius: 8, fontSize: 12, marginBottom: 10 }}>{msg}</div>}

        {resetPwUser && (
          <div style={{ background: C.amberBg, border: `1px solid #fbbf24`, borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Reset Password: {resetPwUser.display_name}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min 6)" style={{ ...inputSmall, flex: 1 }} />
              <button onClick={async () => { if (newPw.length < 6) { setMsg('Min 6 chars'); return; } await usersApi.resetPassword(resetPwUser.id, newPw); setMsg('Reset!'); setResetPwUser(null); setNewPw(''); }} style={btnSmallTeal}>Reset</button>
              <button onClick={() => { setResetPwUser(null); setNewPw(''); }} style={btnSmallGhost}>Cancel</button>
            </div>
          </div>
        )}

        {showForm && (
          <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.borderLight}`, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>{editUser ? `Edit: ${editUser.display_name}` : 'Add User'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 14px' }}>
              <div><label style={lblSm}>Username</label><input value={form.username} onChange={e => setForm({...form, username: e.target.value})} disabled={!!editUser} style={{ ...inputSmall, opacity: editUser ? 0.5 : 1 }} /></div>
              {!editUser && <div><label style={lblSm}>Password</label><input value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={inputSmall} /></div>}
              <div><label style={lblSm}>Name</label><input value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} style={inputSmall} /></div>
              <div><label style={lblSm}>Role</label><select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={inputSmall}><option value="counselor">Counselor</option><option value="manager">Manager</option><option value="admin">Admin</option></select></div>
              <div><label style={lblSm}>Email</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inputSmall} /></div>
              <div><label style={lblSm}>WhatsApp</label><input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} style={inputSmall} /></div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              <button onClick={handleSubmit} style={btnSmallTeal}>{editUser ? 'Save' : 'Create'}</button>
              <button onClick={() => { setShowForm(false); setEditUser(null); }} style={btnSmallGhost}>Cancel</button>
            </div>
          </div>
        )}

        {loadingUsers ? <Loader /> : (
          <table style={{ width: '100%', background: C.white, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.borderLight}`, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: C.cream }}>
              {['Name', 'Username', 'Role', 'Email', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 9.5, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1.5px solid ${C.border}` }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{users.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${C.borderLight}`, opacity: u.is_active ? 1 : 0.5 }}>
                <td style={td}><span style={{ fontWeight: 600, fontSize: 12 }}>{u.display_name}</span></td>
                <td style={td}><span style={{ fontSize: 11, fontFamily: 'monospace', color: C.slate }}>{u.username}</span></td>
                <td style={td}><span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, color: u.role === 'admin' ? C.red : u.role === 'manager' ? C.purple : C.teal, background: u.role === 'admin' ? C.redBg : u.role === 'manager' ? C.purpleBg : C.tealBg, textTransform: 'uppercase' }}>{u.role}</span></td>
                <td style={td}><span style={{ fontSize: 11, color: C.slateDark }}>{u.email || '—'}</span></td>
                <td style={td}><span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, color: u.is_active ? C.green : C.red, background: u.is_active ? C.greenBg : C.redBg }}>{u.is_active ? 'ACTIVE' : 'OFF'}</span></td>
                <td style={td}><div style={{ display: 'flex', gap: 3 }}>
                  <button onClick={() => { setEditUser(u); setForm({ username: u.username, password: '', displayName: u.display_name, role: u.role, email: u.email || '', whatsapp: u.whatsapp || '', telegram: u.telegram || '' }); setShowForm(true); setMsg(''); }} style={btnMicro}>✏</button>
                  <button onClick={() => { setResetPwUser(u); setNewPw(''); setMsg(''); }} style={btnMicro}>🔑</button>
                  {u.is_active ? <button onClick={async () => { if (window.confirm(`Deactivate ${u.display_name}?`)) { await usersApi.remove(u.id); fetchUsers(); }}} style={{ ...btnMicro, color: C.red }}>✕</button>
                  : <button onClick={async () => { await usersApi.reactivate(u.id); fetchUsers(); }} style={{ ...btnMicro, color: C.green }}>✓</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    );
  };

  // ---- LOADING / LAYOUT ----
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.offWhite }}><div style={{ textAlign: 'center' }}><img src={LOGO_URL} alt="Loading" style={{ height: 40, borderRadius: 8, marginBottom: 8 }} /><div style={{ color: C.slateLight, fontSize: 12, fontFamily: FONT }}>Loading...</div></div></div>;

  return (
    <div style={{ fontFamily: FONT, display: 'flex', height: '100vh', overflow: 'hidden', background: C.offWhite }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 22px' }}>
          {view === 'dashboard' && <Dashboard />}
          {view === 'leads' && <LeadsList />}
          {view === 'pipeline' && <Pipeline />}
          {view === 'analytics' && <Analytics />}
          {view === 'scheduling' && <Scheduling />}
          {view === 'detail' && <DetailView />}
          {view === 'settings' && <Settings />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS & STYLES
// ============================================================
const Loader = () => <div style={{ padding: 40, textAlign: 'center', color: C.slateLight, fontSize: 12, fontFamily: FONT }}>Loading...</div>;
const SectionLabel = ({ children, style: s }) => <div style={{ fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontFamily: FONT, ...s }}>{children}</div>;

const inputStyle = { width: '100%', padding: '11px 13px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: FONT, color: C.dark, transition: 'border-color 0.15s' };
const inputSmall = { padding: '6px 8px', borderRadius: 6, border: `1.5px solid ${C.border}`, fontSize: 12, outline: 'none', fontFamily: FONT, color: C.dark, boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 10, fontWeight: 700, color: C.slateDark, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONT };
const lblSm = { display: 'block', fontSize: 9, fontWeight: 600, color: C.slate, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONT };
const selStyle = { padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 11, color: C.slateDark, background: C.white, cursor: 'pointer', outline: 'none', fontFamily: FONT };
const td = { padding: '9px 12px', fontSize: 12, verticalAlign: 'middle' };
const hdrSel = { padding: '5px 9px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: C.white, fontSize: 11, cursor: 'pointer', fontFamily: FONT };
const btnTopbar = { background: C.cream, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 11px', color: C.slate, cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: FONT };
const btnSmallTeal = { padding: '5px 13px', borderRadius: 6, border: 'none', background: C.teal, color: C.white, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT };
const btnSmallGhost = { padding: '5px 11px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, fontSize: 11, cursor: 'pointer', fontFamily: FONT, color: C.slateDark };
const btnMicro = { padding: '3px 7px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 10, fontFamily: FONT };
const thSched = { padding: '8px 6px', textAlign: 'center', fontSize: 9, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: `1.5px solid ${C.border}`, fontFamily: FONT };

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('ginger_user')); } catch { return null; } });
  const handleLogin = (u) => setUser(u);
  const handleLogout = () => { localStorage.removeItem('ginger_token'); localStorage.removeItem('ginger_user'); setUser(null); };
  if (!user) return <LoginScreen onLogin={handleLogin} />;
  return <CRMApp user={user} onLogout={handleLogout} />;
}
