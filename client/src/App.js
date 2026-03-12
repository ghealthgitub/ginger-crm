import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { authApi, leadsApi, usersApi, schedulesApi, contactsApi } from './utils/api';

// ============================================================
// BRAND & DESIGN SYSTEM
// ============================================================
const C = {
  // Ginger brand — navy + orange + warm palette
  navy: '#00315a', navyLight: '#0a4175', navyMid: '#0d4e8a',
  teal: '#ff6308', tealLight: '#ff7b30', tealDark: '#e55600', tealBg: '#ff630806',
  orange: '#ff6308', orangeLight: '#ff8a40', orangeBg: '#fff4ed',
  white: '#ffffff', offWhite: '#f8f9fc', cream: '#fdfaf7',
  slate: '#5a6a7e', slateLight: '#8896a7', slateDark: '#3d4f63',
  dark: '#0f1c2e', darkSoft: '#1a2b40',
  border: '#e6e9f0', borderLight: '#f2f3f7',
  green: '#22c55e', greenBg: '#f0fdf4',
  red: '#ef4444', redBg: '#fef2f2',
  amber: '#f59e0b', amberBg: '#fffbeb',
  purple: '#7c3aed', purpleBg: '#f5f3ff',
  blue: '#2563eb', blueBg: '#eff6ff',
  cyan: '#0891b2', cyanBg: '#ecfeff',
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
  { key: 'patient', label: 'Leads', icon: '📋', color: C.orange, desc: 'Medical enquiries' },
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

const STAGES = [
  { key: 'new', label: 'New Cases', color: C.blue },
  { key: 'arrived', label: 'Arrived Patients', color: C.green },
  { key: 'hot', label: 'Hot Cases', color: C.red },
  { key: 'p1', label: 'Priority 1 (P1)', color: C.orange },
  { key: 'p2', label: 'Priority 2 (P2)', color: C.amber },
  { key: 'p3', label: 'Priority 3 (P3)', color: C.purple },
  { key: 'cold', label: 'Cold Cases', color: C.slateLight },
  { key: 'drop', label: 'Dropped Cases', color: C.slate },
  { key: 'follow_up', label: 'Follow-Up Pending', color: C.cyan },
  { key: 'closed_won', label: 'Closed Won', color: '#10b981' },
  { key: 'post_treatment', label: 'Post-Treatment Care', color: '#6366f1' },
];

const SERVICES_OPTIONS = [
  'Initial Chat', 'Detailed Chat', 'Call Done', 'TP Given', 'VIL Given',
  'Visa Assisted', 'Pickup Arranged', 'Hotel Booked', 'Pickup Done', 'Hospital Assistance',
];

const COUNTRY_LIST = [
  'Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Benin','Bhutan','Bolivia',
  'Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
  'Cambodia','Cameroon','Canada','Chad','Chile','China','Colombia','Congo (DRC)','Congo (Republic)',
  'Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Dominican Republic','Ecuador',
  'Egypt','El Salvador','Eritrea','Estonia','Ethiopia','Fiji','Finland','France','Gabon','Gambia',
  'Georgia','Germany','Ghana','Greece','Guatemala','Guinea','Guyana','Haiti','Honduras','Hungary',
  'Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica',
  'Japan','Jordan','Kazakhstan','Kenya','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon',
  'Liberia','Libya','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali',
  'Malta','Mauritania','Mauritius','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique',
  'Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria',
  'North Korea','North Macedonia','Norway','Oman','Pakistan','Palestine','Panama','Papua New Guinea',
  'Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda',
  'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia',
  'Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname',
  'Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Togo',
  'Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Uganda','Ukraine','UAE','UK','USA',
  'Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', counselor: 'Counselor' };

// Counselor images — update URLs after uploading photos
const COUNSELOR_IMAGES = {
  'Dolma': 'https://ghealth121.com/wp-content/uploads/2025/12/Dolma.jpg',
  'Riyashree': 'https://ghealth121.com/wp-content/uploads/2025/12/Riashree-Das.jpg',
  'Anushka': 'https://ghealth121.com/wp-content/uploads/2025/12/Anushka-Nasrin.jpg',
};
const CounselorAvatar = ({ name, size = 26 }) => {
  const img = COUNSELOR_IMAGES[name];
  if (img) return <img src={img} alt={name} style={{ width: size, height: size, borderRadius: size/3, objectFit: 'cover', border: `2px solid ${C.orange}20`, flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />;
  return <div style={{ width: size, height: size, borderRadius: size/3, background: `${C.orange}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, color: C.orange, flexShrink: 0 }}>{name?.charAt(0)}</div>;
};

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


// Country to flag emoji
const COUNTRY_FLAGS = {'Afghanistan':'🇦🇫','Albania':'🇦🇱','Algeria':'🇩🇿','Angola':'🇦🇴','Argentina':'🇦🇷','Armenia':'🇦🇲','Australia':'🇦🇺','Austria':'🇦🇹','Azerbaijan':'🇦🇿','Bahamas':'🇧🇸','Bahrain':'🇧🇭','Bangladesh':'🇧🇩','Barbados':'🇧🇧','Belarus':'🇧🇾','Belgium':'🇧🇪','Benin':'🇧🇯','Bhutan':'🇧🇹','Bolivia':'🇧🇴','Bosnia and Herzegovina':'🇧🇦','Botswana':'🇧🇼','Brazil':'🇧🇷','Brunei':'🇧🇳','Bulgaria':'🇧🇬','Burkina Faso':'🇧🇫','Burundi':'🇧🇮','Cambodia':'🇰🇭','Cameroon':'🇨🇲','Canada':'🇨🇦','Chad':'🇹🇩','Chile':'🇨🇱','China':'🇨🇳','Colombia':'🇨🇴','Congo (DRC)':'🇨🇩','Congo (Republic)':'🇨🇬','Costa Rica':'🇨🇷','Croatia':'🇭🇷','Cuba':'🇨🇺','Cyprus':'🇨🇾','Czech Republic':'🇨🇿','Denmark':'🇩🇰','Dominican Republic':'🇩🇴','Ecuador':'🇪🇨','Egypt':'🇪🇬','El Salvador':'🇸🇻','Eritrea':'🇪🇷','Estonia':'🇪🇪','Ethiopia':'🇪🇹','Fiji':'🇫🇯','Finland':'🇫🇮','France':'🇫🇷','Gabon':'🇬🇦','Gambia':'🇬🇲','Georgia':'🇬🇪','Germany':'🇩🇪','Ghana':'🇬🇭','Greece':'🇬🇷','Guatemala':'🇬🇹','Guinea':'🇬🇳','Guyana':'🇬🇾','Haiti':'🇭🇹','Honduras':'🇭🇳','Hungary':'🇭🇺','Iceland':'🇮🇸','India':'🇮🇳','Indonesia':'🇮🇩','Iran':'🇮🇷','Iraq':'🇮🇶','Ireland':'🇮🇪','Israel':'🇮🇱','Italy':'🇮🇹','Ivory Coast':'🇨🇮','Jamaica':'🇯🇲','Japan':'🇯🇵','Jordan':'🇯🇴','Kazakhstan':'🇰🇿','Kenya':'🇰🇪','Kosovo':'🇽🇰','Kuwait':'🇰🇼','Kyrgyzstan':'🇰🇬','Laos':'🇱🇦','Latvia':'🇱🇻','Lebanon':'🇱🇧','Liberia':'🇱🇷','Libya':'🇱🇾','Lithuania':'🇱🇹','Luxembourg':'🇱🇺','Madagascar':'🇲🇬','Malawi':'🇲🇼','Malaysia':'🇲🇾','Maldives':'🇲🇻','Mali':'🇲🇱','Malta':'🇲🇹','Mauritania':'🇲🇷','Mauritius':'🇲🇺','Mexico':'🇲🇽','Moldova':'🇲🇩','Mongolia':'🇲🇳','Montenegro':'🇲🇪','Morocco':'🇲🇦','Mozambique':'🇲🇿','Myanmar':'🇲🇲','Namibia':'🇳🇦','Nepal':'🇳🇵','Netherlands':'🇳🇱','New Zealand':'🇳🇿','Nicaragua':'🇳🇮','Niger':'🇳🇪','Nigeria':'🇳🇬','North Korea':'🇰🇵','North Macedonia':'🇲🇰','Norway':'🇳🇴','Oman':'🇴🇲','Pakistan':'🇵🇰','Palestine':'🇵🇸','Panama':'🇵🇦','Papua New Guinea':'🇵🇬','Paraguay':'🇵🇾','Peru':'🇵🇪','Philippines':'🇵🇭','Poland':'🇵🇱','Portugal':'🇵🇹','Qatar':'🇶🇦','Romania':'🇷🇴','Russia':'🇷🇺','Rwanda':'🇷🇼','Saudi Arabia':'🇸🇦','Senegal':'🇸🇳','Serbia':'🇷🇸','Seychelles':'🇸🇨','Sierra Leone':'🇸🇱','Singapore':'🇸🇬','Slovakia':'🇸🇰','Slovenia':'🇸🇮','Somalia':'🇸🇴','South Africa':'🇿🇦','South Korea':'🇰🇷','South Sudan':'🇸🇸','Spain':'🇪🇸','Sri Lanka':'🇱🇰','Sudan':'🇸🇩','Suriname':'🇸🇷','Sweden':'🇸🇪','Switzerland':'🇨🇭','Syria':'🇸🇾','Taiwan':'🇹🇼','Tajikistan':'🇹🇯','Tanzania':'🇹🇿','Thailand':'🇹🇭','Togo':'🇹🇬','Trinidad and Tobago':'🇹🇹','Tunisia':'🇹🇳','Turkey':'🇹🇷','Turkmenistan':'🇹🇲','Uganda':'🇺🇬','Ukraine':'🇺🇦','UAE':'🇦🇪','UK':'🇬🇧','USA':'🇺🇸','Uruguay':'🇺🇾','Uzbekistan':'🇺🇿','Venezuela':'🇻🇪','Vietnam':'🇻🇳','Yemen':'🇾🇪','Zambia':'🇿🇲','Zimbabwe':'🇿🇼'};
function getFlag(country) { return COUNTRY_FLAGS[country] || '🌍'; }

// Strip Google Ads tracking params from URL to get clean page URL
function cleanUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    // Remove Google Ads params
    ['gad_source','gad_campaignid','gclid','gbraid','wbraid','utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','msclkid'].forEach(p => u.searchParams.delete(p));
    return u.origin + u.pathname;
  } catch { return url.split('?')[0]; }
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

const EF = ({ label, value, field, onSave, type = 'text', options, multiOptions, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const [sm, setSm] = useState(() => { try { return JSON.parse(value || '[]'); } catch { return []; } });
  const editingRef = React.useRef(false);
  editingRef.current = editing;
  useEffect(() => { if (!editingRef.current) { setVal(value || ''); try { setSm(JSON.parse(value || '[]')); } catch { setSm([]); } } }, [value]);
  const save = () => { onSave(field, multiOptions ? JSON.stringify(sm) : val); setEditing(false); };
  const cancel = () => { setEditing(false); setVal(value || ''); };
  const iFull = { width: '100%', padding: '9px 12px', borderRadius: 6, border: `2px solid ${C.orange}50`, fontSize: 14, outline: 'none', fontFamily: FONT, color: C.dark, boxSizing: 'border-box', background: '#fffaf6' };
  let dv = value || '\u2014';
  if (multiOptions) { try { const a = JSON.parse(value || '[]'); dv = a.length > 0 ? a.join(', ') : '\u2014'; } catch { dv = value || '\u2014'; } }
  const empty = dv === '\u2014';
  if (editing) return (
    <div style={{ padding: '8px 12px', background: `${C.orange}04`, borderRadius: 6, border: `1px solid ${C.orange}20` }}>
      <div style={{ fontSize: 10, color: C.orange, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5, fontFamily: FONT }}>{label}</div>
      {multiOptions ? <div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>{multiOptions.map(o => <button key={o} onClick={() => setSm(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o])} style={{ padding: '5px 10px', borderRadius: 5, border: `1.5px solid ${sm.includes(o) ? C.orange : C.border}`, background: sm.includes(o) ? `${C.orange}10` : C.white, fontSize: 12, cursor: 'pointer', color: sm.includes(o) ? C.orange : C.slateDark, fontWeight: sm.includes(o) ? 600 : 400, fontFamily: FONT }}>{o}</button>)}</div></div>
      : options ? <select value={val} onChange={e => setVal(e.target.value)} style={iFull} autoFocus><option value="">Select</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>
      : type === 'textarea' ? <textarea value={val} onChange={e => setVal(e.target.value)} style={{ ...iFull, minHeight: 80, resize: 'vertical' }} autoFocus placeholder={placeholder} />
      : <input type={type} value={val} onChange={e => setVal(e.target.value)} style={iFull} autoFocus placeholder={placeholder} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }} />}
      <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
        <button onClick={save} style={{ padding: '6px 16px', borderRadius: 5, border: 'none', background: C.orange, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Save</button>
        <button onClick={cancel} style={{ padding: '6px 12px', borderRadius: 5, border: `1px solid ${C.border}`, background: C.white, color: C.slate, fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
      </div>
    </div>
  );
  return (
    <div onClick={() => setEditing(true)} style={{ padding: '8px 14px', cursor: 'pointer', borderRadius: 4, transition: 'background 0.1s', minHeight: 36 }}
      onMouseEnter={e => e.currentTarget.style.background = `${C.orange}06`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ fontSize: 10.5, color: C.slate, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONT, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: type === 'textarea' ? 13.5 : 14.5, color: empty ? '#b0b8c4' : '#1a1a2e', fontWeight: empty ? 400 : 600, fontFamily: FONT, lineHeight: 1.5, wordBreak: 'break-word' }}>{dv}</div>
    </div>
  );
};
const EditableField = EF;

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
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${C.orange}, ${C.tealDark})`, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, letterSpacing: 0.3, fontFamily: FONT, boxShadow: `0 4px 16px ${C.orange}35`, transition: 'transform 0.15s, box-shadow 0.15s' }} onMouseDown={e => e.target.style.transform = 'scale(0.98)'} onMouseUp={e => e.target.style.transform = 'scale(1)'}>
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
  const [contacts, setContacts] = useState([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactSearch, setContactSearch] = useState('');
  const [contactSort, setContactSort] = useState('created_at');
  const [contactOrder, setContactOrder] = useState('desc');
  const [leadSort, setLeadSort] = useState('created_at');
  const [leadOrder, setLeadOrder] = useState('desc');

  const isAdmin = user.role === 'admin';
  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

  const fetchData = useCallback(async () => {
    try {
      const [leadsData, statsData, fuData] = await Promise.all([
        leadsApi.list({ category: activeCategory, status: filterStatus !== 'all' ? filterStatus : undefined, counselor: filterCounselor !== 'all' ? filterCounselor : undefined, urgency: filterUrgency !== 'all' ? filterUrgency : undefined, search: search || undefined, sort: leadSort, order: leadOrder, limit: 200 }),
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
  }, [filterStatus, filterCounselor, filterUrgency, search, isAdminOrManager, activeCategory, leadSort, leadOrder]);

  const fetchContacts = useCallback(async () => {
    try {
      const data = await contactsApi.list({ search: contactSearch || undefined, sort: contactSort, order: contactOrder, limit: 200 });
      setContacts(data.contacts);
      setContactsTotal(data.total);
    } catch (e) { console.error('Contacts fetch error:', e); }
  }, [contactSearch, contactSort, contactOrder]);

  useEffect(() => {
    fetchData();
    // Only auto-refresh on dashboard and list views, not detail/editing pages
    if (view !== 'dashboard' && view !== 'leads' && view !== 'pipeline') return;
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
  }, [fetchData, view]);

  useEffect(() => {
    if (view === 'contacts' || view === 'contact_detail') fetchContacts();
  }, [fetchContacts, view]);

  // Browser back button — keep user inside CRM
  const viewRef = React.useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => {
    // Replace current entry and push a guard state
    window.history.replaceState({ crm: true, view: 'dashboard' }, '');
    window.history.pushState({ crm: true, view: 'dashboard' }, '');
    const handlePop = (e) => {
      const v = viewRef.current;
      if (v === 'detail') { setView('leads'); }
      else if (v === 'contact_detail') { setView('contacts'); }
      else if (v !== 'dashboard') { setView('dashboard'); }
      // Re-push so back button always stays in CRM
      window.history.pushState({ crm: true, view: v }, '');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);
  // Push state on every view change
  useEffect(() => {
    window.history.pushState({ crm: true, view }, '');
  }, [view]);

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

    const sideBtn = (key, label, icon, isView) => {
      const active = isView ? view === key || (view === 'detail' && key === 'leads') || (view === 'contact_detail' && key === 'contacts') : false;
      return (
        <button key={key} onClick={() => setView(key)}
          style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, width: '100%', padding: collapsed ? '9px 0' : '9px 12px', borderRadius: 8, border: 'none', background: active ? `${C.orange}18` : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 500, textAlign: collapsed ? 'center' : 'left', justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: 2, transition: 'all 0.15s', fontFamily: FONT }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.background = active ? `${C.orange}18` : 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = active ? `${C.orange}18` : 'transparent'; }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
          {!collapsed && <span>{label}</span>}
        </button>
      );
    };

    const catBtn = (cat) => {
      const isActive = activeCategory === cat.key && (view === 'leads' || view === 'detail');
      return (
        <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setFilterStatus('all'); setFilterUrgency('all'); setFilterCounselor('all'); setSearch(''); setView('leads'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: isActive ? `${cat.color}18` : 'transparent', color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 600 : 500, textAlign: 'left', marginBottom: 2, transition: 'all 0.15s', fontFamily: FONT }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.background = isActive ? `${cat.color}18` : 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.background = isActive ? `${cat.color}18` : 'transparent'; }}>
          <span style={{ fontSize: 14 }}>{cat.icon}</span><span>{cat.label}</span>
        </button>
      );
    };

    return (
      <div style={{ width: collapsed ? 56 : 220, background: C.navy, color: C.white, display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', flexShrink: 0, fontFamily: FONT, borderRight: `1px solid ${C.navyMid}` }}>
        <div style={{ padding: collapsed ? '16px 8px' : '16px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.navyMid}` }}>
          <img src={LOGO_URL} alt="G" style={{ height: 30, borderRadius: 6, flexShrink: 0 }} />
          {!collapsed && <div><div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2 }}>Ginger CRM</div></div>}
        </div>

        <div style={{ padding: '8px 10px 0', flex: 1, overflowY: 'auto' }}>
          {/* Dashboard */}
          {sideBtn('dashboard', 'Dashboard', '◻', true)}

          {/* Primary: Leads & Pipeline */}
          {!collapsed && <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.2, margin: '12px 0 5px', paddingLeft: 8, fontSize: 9.5 }}>Leads</div>}
          {catBtn(CATEGORIES[0])}
          {sideBtn('pipeline', 'Pipeline', '▥', true)}

          {/* Contacts */}
          {!collapsed && <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.2, margin: '12px 0 5px', paddingLeft: 8, fontSize: 9.5 }}>People</div>}
          {sideBtn('contacts', 'Contacts', '⊕', true)}

          {/* Secondary: Other & Non-Targeted */}
          {!collapsed && <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.2, margin: '12px 0 5px', paddingLeft: 8, fontSize: 9.5 }}>Other</div>}
          {catBtn(CATEGORIES[1])}
          {catBtn(CATEGORIES[2])}

          {/* Tools */}
          {!collapsed && <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.2, margin: '12px 0 5px', paddingLeft: 8, fontSize: 9.5 }}>Tools</div>}
          {isAdminOrManager && sideBtn('analytics', 'Analytics', '◈', true)}
          {isAdminOrManager && sideBtn('scheduling', 'Scheduling', '◷', true)}
          {isAdmin && sideBtn('settings', 'Settings', '⚙', true)}
        </div>

        <div style={{ padding: collapsed ? '10px 4px' : '10px 14px', borderTop: `1px solid ${C.navyMid}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${C.orange}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.orange, flexShrink: 0 }}>{user.name?.charAt(0)}</div>
          {!collapsed && <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{ROLE_LABELS[user.role]}</div>
          </div>}
        </div>
      </div>
    );
  };

  const TopBar = () => {
    const crumbs = [{ label: 'Dashboard', view: 'dashboard' }];
    if (view === 'leads' || view === 'detail') crumbs.push({ label: activeCategory === 'patient' ? 'Leads' : activeCategory === 'other' ? 'Other' : 'Non-Targeted', view: 'leads' });
    if (view === 'detail' && selectedLead) crumbs.push({ label: `${selectedLead.first_name} ${selectedLead.last_name}`, view: 'detail' });
    if (view === 'pipeline') crumbs.push({ label: 'Pipeline', view: 'pipeline' });
    if (view === 'contacts' || view === 'contact_detail') crumbs.push({ label: 'Contacts', view: 'contacts' });
    if (view === 'contact_detail' && selectedContact) crumbs.push({ label: `${selectedContact.first_name} ${selectedContact.last_name}`, view: 'contact_detail' });
    if (view === 'analytics') crumbs.push({ label: 'Analytics', view: 'analytics' });
    if (view === 'scheduling') crumbs.push({ label: 'Scheduling', view: 'scheduling' });
    if (view === 'settings') crumbs.push({ label: 'Settings', view: 'settings' });

    return (
    <div style={{ background: C.white, padding: '0 22px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, flexShrink: 0, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.slate, padding: '2px' }}>☰</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {crumbs.map((cr, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <span style={{ color: C.slateLight, fontSize: 11 }}>›</span>}
              <span onClick={() => { if (cr.view !== view) setView(cr.view); }} style={{ fontSize: i === crumbs.length - 1 ? 14 : 12, fontWeight: i === crumbs.length - 1 ? 700 : 500, color: i === crumbs.length - 1 ? C.dark : C.slate, cursor: i === crumbs.length - 1 ? 'default' : 'pointer', transition: 'color 0.15s' }} onMouseEnter={e => { if (i < crumbs.length - 1) e.target.style.color = C.orange; }} onMouseLeave={e => { if (i < crumbs.length - 1) e.target.style.color = C.slate; }}>{cr.label}</span>
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {followUps.length > 0 && <span onClick={() => setView('leads')} style={{ padding: '3px 9px', borderRadius: 6, background: C.amberBg, color: '#92400e', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>⏰ {followUps.length} due</span>}
        <button onClick={exportCSV} style={btnTopbar}>Export</button>
        <button onClick={onLogout} style={btnTopbar}>Logout</button>
      </div>
    </div>
    );
  };

  // ---- DASHBOARD (role-based) ----
  const Dashboard = () => {
    if (!stats) return <Loader />;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
      <div>
        <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 60%, #1a3a5c 100%)`, borderRadius: 14, padding: '22px 26px', marginBottom: 20, color: C.white, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: `${C.orange}12` }} />
          <div style={{ position: 'absolute', bottom: -30, right: 60, width: 80, height: 80, borderRadius: '50%', background: `${C.orange}08` }} />
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: FONT, position: 'relative' }}>{greeting}, {user.name}!</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{ROLE_LABELS[user.role]} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 18 }}>
          {[
            { label: isAdminOrManager ? 'Total Patients' : 'My Patients', value: stats.total, color: C.teal, icon: '🏥' },
            { label: 'New Today', value: stats.today, color: C.green, icon: '🆕' },
            { label: 'Urgent', value: stats.urgent, color: C.red, icon: '🚨' },
            { label: 'Follow-Ups Due', value: stats.followUpDue, color: C.orange, icon: '⏰' },
            { label: 'Conv. Rate', value: `${stats.conversionRate}%`, color: C.purple, icon: '📈' },
          ].map((s, i) => (
            <div key={i} style={{ background: `linear-gradient(135deg, ${C.white}, ${s.color}04)`, borderRadius: 14, padding: '16px 18px', border: `1px solid ${s.color}18`, position: 'relative', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: `linear-gradient(180deg, ${s.color}, ${s.color}80)`, borderRadius: '14px 0 0 14px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 9.5, color: C.slate, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4, fontFamily: FONT }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.dark, fontFamily: FONT }}>{s.value}</div>
                </div>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {isAdminOrManager && stats.byCategory && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.key} onClick={() => { setActiveCategory(cat.key); setView('leads'); }} style={{ background: `linear-gradient(135deg, ${C.white}, ${cat.color}05)`, borderRadius: 12, padding: '14px 16px', border: `1.5px solid ${cat.color}15`, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${cat.color}12`; e.currentTarget.style.borderColor = cat.color + '30'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = cat.color + '15'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontSize: 15 }}>{cat.icon}</div><div style={{ fontSize: 11, fontWeight: 600, color: C.dark, marginTop: 2, fontFamily: FONT }}>{cat.label}</div><div style={{ fontSize: 9, color: C.slateLight }}>{cat.desc}</div></div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: cat.color, fontFamily: FONT }}>{stats.byCategory[cat.key] || 0}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {followUps.length > 0 && (
          <div style={{ background: `linear-gradient(135deg, ${C.amberBg}, #fef3c7)`, border: `1px solid #fbbf24`, borderRadius: 10, padding: 14, marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6, fontFamily: FONT }}>⏰ Follow-Ups Due ({followUps.length})</div>
            {followUps.slice(0, 5).map(l => (
              <div key={l.lead_id} onClick={() => openDetail(l)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #fde68a', cursor: 'pointer' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.dark, fontFamily: FONT }}>{l.first_name} {l.last_name} <span style={{ fontSize: 10, color: C.slate, fontWeight: 400 }}>· {getFlag(l.nationality)} {l.nationality}</span></span>
                <span style={{ fontSize: 10, color: '#92400e' }}>{l.follow_up_note?.substring(0, 30) || 'Follow up'}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: C.white, borderRadius: 10, padding: 16, border: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 10, fontFamily: FONT }}>{isAdminOrManager ? 'Pipeline Overview' : 'My Pipeline'}</div>
            {STATUSES.map(s => {
              const count = stats.byStatus[s.key] || 0;
              const pct = stats.total > 0 ? (count / stats.total * 100) : 0;
              return (
                <div key={s.key} onClick={() => { setFilterUrgency('all'); setFilterCounselor('all'); setSearch(''); setFilterStatus(s.key); setActiveCategory('patient'); setView('leads'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, cursor: 'pointer', padding: '2px 0', borderRadius: 4, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = C.cream} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: 10, width: 70, textAlign: 'right', color: C.slate, fontFamily: FONT }}>{s.label}</span>
                  <div style={{ flex: 1, height: 16, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 4, minWidth: count > 0 ? 16 : 0, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, width: 22, color: s.color, fontFamily: FONT }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: C.white, borderRadius: 10, padding: 16, border: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 10, fontFamily: FONT }}>{isAdminOrManager ? 'Recent Leads' : 'My Recent Leads'}</div>
            {leads.filter(l => l.lead_category === 'patient' || !l.lead_category).slice(0, 6).map(l => (
              <div key={l.lead_id} onClick={() => openDetail(l)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}>
                <div><div style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{l.first_name} {l.last_name}</div><div style={{ fontSize: 10, color: C.slateLight }}>{getFlag(l.nationality)} {l.nationality} · {l.treatment_sought || l.service_type || '—'}</div></div>
                <div style={{ textAlign: 'right' }}><StatusBadge status={l.status} small /><div style={{ fontSize: 9, color: C.slateLight, marginTop: 1 }}>{timeAgo(l.created_at)}</div></div>
              </div>
            ))}
            {leads.length === 0 && <div style={{ fontSize: 11, color: C.slateLight, textAlign: 'center', padding: 20 }}>No leads yet</div>}
          </div>
        </div>

        {isAdminOrManager && performance.length > 0 && (
          <div style={{ background: C.white, borderRadius: 10, padding: 16, border: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 12, fontFamily: FONT }}>Team Performance (30 Days)</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(performance.length, 4)}, 1fr)`, gap: 10 }}>
              {performance.map((p, i) => {
                const colors = [C.teal, C.blue, C.green, C.purple];
                const rate = p.total > 0 ? Math.round((parseInt(p.converted) / parseInt(p.total)) * 100) : 0;
                const c = colors[i % colors.length];
                return (
                  <div key={p.assigned_counselor} onClick={() => { setFilterStatus('all'); setFilterUrgency('all'); setSearch(''); setFilterCounselor(p.assigned_counselor); setActiveCategory('patient'); setView('leads'); }} style={{ padding: 14, background: `linear-gradient(145deg, ${C.white}, ${c}06)`, borderRadius: 12, border: `1px solid ${c}15`, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${c}12`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      <CounselorAvatar name={p.assigned_counselor} size={30} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{p.assigned_counselor}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div><div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>{p.total}</div><div style={{ fontSize: 8, color: C.slateLight }}>Total</div></div>
                      <div><div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>{p.converted}</div><div style={{ fontSize: 8, color: C.slateLight }}>Converted</div></div>
                      <div><div style={{ fontSize: 18, fontWeight: 800, color: c }}>{rate}%</div><div style={{ fontSize: 8, color: C.slateLight }}>Conv Rate</div></div>
                      <div><div style={{ fontSize: 18, fontWeight: 800, color: C.amber }}>{p.overdue_followups || 0}</div><div style={{ fontSize: 8, color: C.slateLight }}>Overdue</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isAdminOrManager && (
          <div style={{ background: C.white, borderRadius: 10, padding: 16, border: `1px solid ${C.borderLight}`, marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 10, fontFamily: FONT }}>Quick Actions</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setView('leads')} style={{ ...btnSmallTeal, padding: '10px 18px', fontSize: 12 }}>View My Leads</button>
              <button onClick={() => setView('pipeline')} style={{ ...btnSmallGhost, padding: '10px 18px', fontSize: 12 }}>Pipeline View</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Column options for customization
  const ALL_COLUMNS = [
    { key: 'lead', label: 'Lead', default: true },
    { key: 'contact', label: 'Contact', default: true },
    { key: 'treatment', label: 'Treatment', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'counselor', label: 'Counselor', default: true },
    { key: 'added', label: 'Added', default: true },
    { key: 'urgency', label: 'Urgency', default: false },
    { key: 'nationality', label: 'Country', default: false },
    { key: 'phone', label: 'Phone', default: false },
    { key: 'source', label: 'Source', default: false },
    { key: 'followup', label: 'Follow-up Date', default: false },
    { key: 'updated', label: 'Last Updated', default: false },
  ];
  const [visibleCols, setVisibleCols] = useState(() => ALL_COLUMNS.filter(c => c.default).map(c => c.key));
  const [showColPicker, setShowColPicker] = useState(false);

  // ---- TOOLBAR ----
  const Toolbar = () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', flex: '1 1 280px', maxWidth: 380 }}>
        <span style={{ color: C.slateLight, fontSize: 14 }}>⌕</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent', color: C.dark, fontFamily: FONT }} />
        {search && <span style={{ cursor: 'pointer', color: C.slateLight, fontSize: 12 }} onClick={() => setSearch('')}>✕</span>}
      </div>
      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selStyle}><option value="all">All Status</option>{STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
      {isAdminOrManager && <select value={filterCounselor} onChange={e => setFilterCounselor(e.target.value)} style={selStyle}><option value="all">All Counselors</option>{counselors.map(c => <option key={c} value={c}>{c}</option>)}</select>}
      <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)} style={selStyle}><option value="all">All Urgency</option><option>Emergency</option><option>Urgent</option><option>Semi-Urgent</option><option>Routine</option></select>
      <select value={`${leadSort}|${leadOrder}`} onChange={e => { const parts = e.target.value.split('|'); setLeadSort(parts[0]); setLeadOrder(parts[1]); }} style={selStyle}>
        <option value="created_at|desc">Newest First</option>
        <option value="created_at|asc">Oldest First</option>
        <option value="first_name|asc">Name A–Z</option>
        <option value="first_name|desc">Name Z–A</option>
        <option value="updated_at|desc">Recently Updated</option>
        <option value="nationality|asc">Country A–Z</option>
      </select>
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowColPicker(!showColPicker)} style={{ ...btnTopbar, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>⚙ Columns</button>
        {showColPicker && <div style={{ position: 'absolute', top: 36, right: 0, background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 12, zIndex: 50, width: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Show Columns</div>
          {ALL_COLUMNS.map(col => (
            <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', cursor: 'pointer', fontSize: 12, color: C.slateDark }}>
              <input type="checkbox" checked={visibleCols.includes(col.key)} onChange={e => {
                if (e.target.checked) setVisibleCols([...visibleCols, col.key]);
                else setVisibleCols(visibleCols.filter(k => k !== col.key));
              }} />
              {col.label}
            </label>
          ))}
          <button onClick={() => setShowColPicker(false)} style={{ ...btnSmallTeal, marginTop: 8, width: '100%', fontSize: 11 }}>Done</button>
        </div>}
      </div>
      <div style={{ marginLeft: 'auto', fontSize: 12, color: C.slate, fontWeight: 500 }}>{leads.length} leads</div>
    </div>
  );

  // ---- LEADS TABLE (vibrant, engaging) ----
  const deleteLead = async (leadId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this lead permanently?')) return;
    try {
      await leadsApi.update(leadId, { lead_category: 'deleted' });
      fetchData();
    } catch (err) { console.error('Delete failed:', err); }
  };

  const LeadsList = () => (
    <div>
      <Toolbar />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', background: C.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.border}`, borderCollapse: 'collapse', fontFamily: FONT, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <thead><tr style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})` }}>
            {ALL_COLUMNS.filter(c => visibleCols.includes(c.key)).map(h => (
              <th key={h.key} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{h.label}</th>
            ))}
            
          </tr></thead>
          <tbody>
            {leads.map((l, idx) => (
              <tr key={l.lead_id} onClick={() => openDetail(l)} style={{ cursor: 'pointer', borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? C.white : `${C.cream}80`, transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = `${C.orange}06`; e.currentTarget.style.transform = 'scale(1.002)'; }} onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? C.white : `${C.cream}80`; e.currentTarget.style.transform = 'scale(1)'; }}>
                {visibleCols.includes('lead') && <td style={tdV}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PriorityDot priority={l.priority} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: C.dark, letterSpacing: -0.2 }}>{l.prefix} {l.first_name} {l.last_name}</div>
                      <div style={{ fontSize: 12, color: C.slate, marginTop: 1 }}>{getFlag(l.nationality)} {l.nationality}</div>
                    </div>
                  </div>
                </td>}
                {visibleCols.includes('contact') && <td style={tdV}>
                  <div style={{ fontSize: 12, color: C.slateDark, fontWeight: 500 }}>{l.contact_preference || '—'}</div>
                  <div style={{ fontSize: 11, color: C.blue, marginTop: 1, textDecoration: 'underline', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); window.open('mailto:' + l.email); }}>{l.email}</div>
                </td>}
                {visibleCols.includes('treatment') && <td style={tdV}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.dark }}>{l.treatment_sought || l.service_type || '—'}</div>
                  {l.urgency_level && <span style={{ fontSize: 10, fontWeight: 700, color: URGENCY_COLORS[l.urgency_level] || C.slate, background: `${URGENCY_COLORS[l.urgency_level] || C.slate}10`, padding: '1px 6px', borderRadius: 4, marginTop: 2, display: 'inline-block' }}>{l.urgency_level}</span>}
                </td>}
                {visibleCols.includes('status') && <td style={tdV}><StatusBadge status={l.status} /></td>}
                {visibleCols.includes('counselor') && <td style={tdV}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CounselorAvatar name={l.assigned_counselor} size={26} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.slateDark }}>{l.assigned_counselor}</span>
                  </div>
                </td>}
                {visibleCols.includes('added') && <td style={tdV}><span style={{ fontSize: 11, color: C.slateLight }}>{timeAgo(l.created_at)}</span></td>}
                {visibleCols.includes('urgency') && <td style={tdV}><span style={{ fontSize: 11, fontWeight: 600, color: URGENCY_COLORS[l.urgency_level] || C.slateLight }}>{l.urgency_level || '—'}</span></td>}
                {visibleCols.includes('nationality') && <td style={tdV}><span style={{ fontSize: 12 }}>{getFlag(l.nationality)} {l.nationality}</span></td>}
                {visibleCols.includes('phone') && <td style={tdV}><span style={{ fontSize: 11, color: C.slateDark }}>{l.isd} {l.phone}</span></td>}
                {visibleCols.includes('source') && <td style={tdV}><span style={{ fontSize: 10, color: C.slateLight }}>{l.referrer?.substring(0, 25) || '—'}</span></td>}
                {visibleCols.includes('followup') && <td style={tdV}><span style={{ fontSize: 11, color: l.follow_up_date ? C.orange : C.slateLight, fontWeight: l.follow_up_date ? 600 : 400 }}>{l.follow_up_date ? fmtDateShort(l.follow_up_date) : '—'}</span></td>}
                {visibleCols.includes('updated') && <td style={tdV}><span style={{ fontSize: 10, color: C.slateLight }}>{timeAgo(l.updated_at)}</span></td>}

              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={visibleCols.length} style={{ textAlign: 'center', padding: 50, color: C.slateLight, fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              No leads found — try adjusting your filters
            </td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ---- PIPELINE ----
  const Pipeline = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Toolbar />
      <style>{`
        .pipeline-scroll::-webkit-scrollbar { height: 16px; }
        .pipeline-scroll::-webkit-scrollbar-track { background: #cbd5e1; border-radius: 8px; }
        .pipeline-scroll::-webkit-scrollbar-thumb { background: #64748b; border-radius: 8px; border: 3px solid #cbd5e1; min-width: 60px; }
        .pipeline-scroll::-webkit-scrollbar-thumb:hover { background: #475569; }
        .pipeline-scroll { scrollbar-width: auto; scrollbar-color: #64748b #cbd5e1; }
      `}</style>
      <div className="pipeline-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', overflowY: 'auto', flex: 1, minHeight: 0, paddingBottom: 4, alignItems: 'flex-start' }}>
        {STAGES.map(stage => {
          const col = leads.filter(l => (l.stage || 'new') === stage.key);
          return (
            <div key={stage.key} style={{ flex: '1 1 0', minWidth: 180, background: C.white, borderRadius: 12, padding: 10, fontFamily: FONT, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 4px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: stage.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stage.label}</span>
                <span style={{ fontSize: 10, background: `${stage.color}15`, color: stage.color, padding: '1px 7px', borderRadius: 8, fontWeight: 700 }}>{col.length}</span>
              </div>
              {col.map(l => (
                <div key={l.lead_id} onClick={() => openDetail(l)} style={{ background: '#f3f4f6', borderRadius: 10, padding: '11px 13px', border: `1px solid ${C.border}`, cursor: 'pointer', marginBottom: 8, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, fontWeight: 700, color: C.dark, letterSpacing: -0.2 }}>{l.first_name} {l.last_name}</span><PriorityDot priority={l.priority} /></div>
                  <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>{getFlag(l.nationality)} {l.nationality}</div>
                  <div style={{ fontSize: 11, color: C.dark, marginTop: 2, fontWeight: 500 }}>{l.treatment_sought || l.service_type}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 5, borderTop: `1px solid ${C.border}`, fontSize: 9, color: C.slate }}><span>{l.assigned_counselor}</span><span>{timeAgo(l.created_at)}</span></div>
                </div>
              ))}
              {col.length === 0 && <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: C.slateLight }}>—</div>}
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
            <button onClick={(e) => { e.preventDefault(); setView('leads'); }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: C.white, fontSize: 12, fontFamily: FONT }}>← Back</button>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>{lead.prefix} {lead.first_name} {lead.last_name}</h2>
                <CategoryBadge category={lead.lead_category} small />
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{getFlag(lead.nationality)} {lead.nationality} · {lead.email} · {lead.isd} {lead.phone} · {lead.lead_id}</div>
            </div>
            <StatusBadge status={lead.status} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={lead.status} onChange={e => updateLead(lead.lead_id, { status: e.target.value })} style={hdrSel}>{STATUSES.map(s => <option key={s.key} value={s.key} style={{ color: C.dark }}>{s.label}</option>)}</select>
            {isAdminOrManager && <select value={lead.assigned_counselor} onChange={e => updateLead(lead.lead_id, { assigned_counselor: e.target.value })} style={hdrSel}>{counselors.map(c => <option key={c} value={c} style={{ color: C.dark }}>{c}</option>)}</select>}
            <select value={lead.priority || 'medium'} onChange={e => updateLead(lead.lead_id, { priority: e.target.value })} style={hdrSel}>{PRIORITIES.map(p => <option key={p.key} value={p.key} style={{ color: C.dark }}>{p.label}</option>)}</select>
            <select value={lead.lead_category || 'patient'} onChange={e => updateLead(lead.lead_id, { lead_category: e.target.value })} style={hdrSel}>{CATEGORIES.map(c => <option key={c.key} value={c.key} style={{ color: C.dark }}>{c.label}</option>)}</select>
            {waUrl && <a href={waUrl} target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 8, background: '#25D366', color: C.white, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>WhatsApp</a>}
            {isAdminOrManager && <button onClick={() => { if (window.confirm('Delete this lead permanently? This cannot be undone.')) { deleteLead(lead.lead_id, { stopPropagation: () => {} }); setView('leads'); } }} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Delete Lead</button>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: C.cream }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '10px 18px', fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? C.orange : C.slate, background: activeTab === tab.key ? `${C.orange}06` : 'none', border: 'none', borderBottom: activeTab === tab.key ? `2.5px solid ${C.orange}` : '2.5px solid transparent', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', borderRadius: '8px 8px 0 0' }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ padding: '18px 22px' }}>
          {activeTab === 'overview' && (<>
            {/* Lead Source */}
            <div style={{ background: C.white, borderRadius: 10, border: '1.5px solid #d0d5dd', marginBottom: 16, overflow: 'hidden', transition: 'all 0.25s' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1.5px solid #d0d5dd', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>🔗</span><span style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontFamily: FONT }}>Lead Source</span></div>
              <div style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 14px' }}><div style={{ fontSize: 10, color: C.slateLight, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Source URL</div><div style={{ fontSize: 12, color: C.blue, wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: 1.4, userSelect: 'all' }}>{lead.page_url || lead.referrer || '—'}</div></div>
              <div style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 14px' }}><div style={{ fontSize: 10, color: C.slateLight, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Page Title</div><div style={{ fontSize: 13, fontWeight: 600 }}>{lead.page_url ? <a href={cleanUrl(lead.page_url)} target="_blank" rel="noreferrer" style={{ color: C.blue, textDecoration: 'none', borderBottom: `1px dashed ${C.blue}40` }}>{lead.page_title || 'View Page'}</a> : <span style={{ color: C.dark }}>{lead.page_title || '—'}</span>}</div></div>
              <div style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 14px' }}><div style={{ fontSize: 10, color: C.slateLight, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Referrer</div><div style={{ fontSize: 12, color: C.slateDark, wordBreak: 'break-all' }}>{lead.referrer || 'Direct'}</div></div>
              <div style={{ padding: '6px 14px', background: `${C.blue}03`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.slateLight }}><span>Enquiry: {fmtDate(lead.created_at)}</span><span style={{ fontFamily: 'monospace', fontSize: 10 }}>ID: {lead.lead_id}</span></div>
              {lead.contact_id && <div style={{ padding: '8px 14px', borderTop: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: 10, color: C.slateLight, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Linked Contact</div><span style={{ fontSize: 12, fontFamily: 'monospace', color: C.cyan }}>{lead.contact_id}</span></div>
                <button onClick={async () => { try { const full = await contactsApi.get(lead.contact_id); setSelectedContact(full); setView('contact_detail'); } catch(e) { console.error(e); }}} style={{ ...btnSmallGhost, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>⊕ View Contact</button>
              </div>}
            </div>

            {/* Enquirer */}
            <div style={{ background: C.white, borderRadius: 10, border: '1.5px solid #d0d5dd', marginBottom: 16, overflow: 'hidden', transition: 'all 0.25s' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1.5px solid #d0d5dd', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>👤</span><span style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontFamily: FONT }}>Enquirer</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #e5e7eb' }}><EF label="Title" value={lead.prefix} field="prefix" onSave={saveField} options={['Mr.', 'Mrs.', 'Ms.', 'Dr.']} /><EF label="First Name" value={lead.first_name} field="first_name" onSave={saveField} /><EF label="Last Name" value={lead.last_name} field="last_name" onSave={saveField} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #e5e7eb' }}><EF label="Email" value={lead.email} field="email" onSave={saveField} type="email" /><EF label="ISD" value={lead.isd} field="isd" onSave={saveField} /><EF label="Phone" value={lead.phone} field="phone" onSave={saveField} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}><EF label="Nationality" value={lead.nationality} field="nationality" onSave={saveField} /><EF label="Contact Via" value={lead.contact_preference} field="contact_preference" onSave={saveField} options={['whatsapp', 'telegram', 'email', 'phone', 'pending']} /><EF label="Relationship" value={lead.relationship_type} field="relationship_type" onSave={saveField} options={['Self','Spouse','Parent','Child','Sibling','Friend','Doctor','Agent','Other']} /></div>
            </div>

            {/* Initial Message */}
            {lead.message && <div style={{ background: C.white, borderRadius: 10, border: '1.5px solid #d0d5dd', marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1.5px solid #d0d5dd', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>💬</span><span style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontFamily: FONT }}>Initial Message</span></div>
              <div style={{ padding: '16px 20px', fontSize: 15, color: C.slateDark, fontWeight: 500, lineHeight: 1.7, fontStyle: 'italic', borderLeft: `4px solid ${C.orange}`, background: '#f3f4f6' }}>"{lead.message}"</div>
            </div>}

            {/* Patient Details */}
            <div style={{ background: C.white, borderRadius: 10, border: '1.5px solid #d0d5dd', marginBottom: 16, overflow: 'hidden', transition: 'all 0.25s' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1.5px solid #d0d5dd', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>🏥</span><span style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontFamily: FONT }}>Patient Details</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #e5e7eb' }}><EF label="Patient Name" value={lead.patient_name || ((lead.patient_first_name || '') + ' ' + (lead.patient_last_name || '')).trim() || null} field="patient_name" onSave={saveField} /><EF label="Age" value={lead.patient_age} field="patient_age" onSave={saveField} /><EF label="Gender" value={lead.patient_gender} field="patient_gender" onSave={saveField} options={['Male','Female','Other']} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}><EF label="Nationality" value={lead.patient_nationality} field="patient_nationality" onSave={saveField} options={COUNTRY_LIST} /><EF label="Primary Diagnosis" value={lead.primary_diagnosis} field="primary_diagnosis" onSave={saveField} /></div>
              <div style={{ borderBottom: '1px solid #e5e7eb' }}><EF label="Medical History" value={lead.medical_history} field="medical_history" onSave={saveField} type="textarea" placeholder="Previous treatments, allergies, conditions..." /></div>
              <div><EF label="Treatment Needed" value={lead.treatment_sought} field="treatment_sought" onSave={saveField} /></div>
            </div>

            {/* Counselor Notes */}
            <div style={{ background: C.white, borderRadius: 10, border: '1.5px solid #d0d5dd', marginBottom: 16, overflow: 'hidden', transition: 'all 0.25s' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1.5px solid #d0d5dd', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>📝</span><span style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontFamily: FONT }}>Counselor Notes</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}><EF label="Recommended Hospitals" value={lead.recommended_hospitals_text} field="recommended_hospitals_text" onSave={saveField} /><EF label="Recommended Doctors" value={lead.recommended_doctors_text} field="recommended_doctors_text" onSave={saveField} /></div>
              <div style={{ borderBottom: '1px solid #e5e7eb' }}><EF label="Services Given" value={lead.services_given} field="services_given" onSave={saveField} multiOptions={SERVICES_OPTIONS} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}><EF label="Opportunity Size" value={lead.opportunity_size} field="opportunity_size" onSave={saveField} options={['Small','Medium','Large']} /><EF label="Clinical Notes" value={lead.clinical_notes} field="clinical_notes" onSave={saveField} type="textarea" placeholder="Add observations..." /></div>
              <div><EF label="Latest Status" value={lead.latest_status} field="latest_status" onSave={saveField} type="textarea" placeholder="Current status update..." /></div>
            </div>

            {/* Stage (Pipeline) */}
            <div style={{ background: C.white, borderRadius: 10, border: '1.5px solid #d0d5dd', marginBottom: 16, overflow: 'hidden', transition: 'all 0.25s' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1.5px solid #d0d5dd', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>📊</span><span style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontFamily: FONT }}>Pipeline Stage</span></div>
              <div style={{ padding: '10px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STAGES.map(st => {
                  const active = (lead.stage || 'new') === st.key;
                  return <button key={st.key} onClick={() => saveField('stage', st.key)} style={{ padding: '7px 16px', borderRadius: 20, border: `2px solid ${active ? st.color : C.border}`, background: active ? `${st.color}18` : C.white, color: active ? st.color : C.slate, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: FONT, transition: 'all 0.2s' }} onMouseEnter={e => { if (!active) { e.target.style.borderColor = st.color; e.target.style.color = st.color; }}} onMouseLeave={e => { if (!active) { e.target.style.borderColor = C.border; e.target.style.color = C.slate; }}}>{st.label}</button>;
                })}
              </div>
            </div>

            {/* Mapping Details */}
            <div style={{ background: C.white, borderRadius: 10, border: '1.5px solid #d0d5dd', marginBottom: 16, overflow: 'hidden', transition: 'all 0.25s' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1.5px solid #d0d5dd', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>🗂️</span><span style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontFamily: FONT }}>Mapping Details</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #e5e7eb' }}><EF label="Passport Number" value={lead.passport_number} field="passport_number" onSave={saveField} /><EF label="Visa Number" value={lead.visa_number} field="visa_number" onSave={saveField} /><EF label="Hospital Reg No." value={lead.hospital_reg_number} field="hospital_reg_number" onSave={saveField} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #e5e7eb' }}><EF label="Date of Arrival" value={lead.estimated_arrival?.split('T')[0]} field="estimated_arrival" onSave={saveField} type="date" /><EF label="Date of First Consultation" value={lead.date_first_consultation?.split('T')[0]} field="date_first_consultation" onSave={saveField} type="date" /><EF label="Admitting Doctor" value={lead.admitting_doctor} field="admitting_doctor" onSave={saveField} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}><EF label="Date of Admission" value={lead.date_admission?.split('T')[0]} field="date_admission" onSave={saveField} type="date" /><EF label="Date of Discharge" value={lead.date_discharge?.split('T')[0]} field="date_discharge" onSave={saveField} type="date" /><EF label="Final Bill" value={lead.final_bill} field="final_bill" onSave={saveField} type="number" /></div>
            </div>
          </>)}

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
                  <div key={a.id} style={{ fontSize: 10, color: C.slate, padding: '4px 0', borderBottom: '1px solid #e5e7eb' }}>
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
              <div style={{ fontSize: 30, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: C.white, borderRadius: 10, padding: 18, border: `1px solid ${C.borderLight}`, marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 14 }}>Counselor Comparison</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: `2px solid ${C.borderLight}` }}>
              {['Counselor', 'Total', 'Converted', 'Active', 'Lost', 'Conv %', 'Overdue', 'Avg Resp', 'Week'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{performance.map(p => {
              const rate = p.total > 0 ? Math.round((parseInt(p.converted) / parseInt(p.total)) * 100) : 0;
              return (
                <tr key={p.assigned_counselor} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, fontSize: 13 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CounselorAvatar name={p.assigned_counselor} size={24} />{p.assigned_counselor}</div></td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{p.total}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, color: C.green, fontWeight: 700 }}>{p.converted}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, color: C.amber }}>{p.active}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, color: C.red }}>{p.lost}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 40, height: 5, background: '#f3f4f6', borderRadius: 3 }}><div style={{ height: '100%', width: `${rate}%`, background: rate > 30 ? C.green : rate > 15 ? C.amber : C.red, borderRadius: 3 }} /></div>
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
    const [saving, setSaving] = useState(null); // userId being saved
    const [newOverride, setNewOverride] = useState({ user_id: '', override_date: '', is_off: true, reason: '' });
    const [msg, setMsg] = useState('');

    // Local editable state: { [userId]: { [day]: 'HH:MM-HH:MM' or '' } }
    const [grid, setGrid] = useState({});

    const fetchSchedules = async () => {
      try {
        const [usersData, schedData, overData] = await Promise.all([
          usersApi.list(), schedulesApi.list(), schedulesApi.overrides()
        ]);
        const activeUsers = usersData.filter(u => u.is_active);
        setUsers(activeUsers);
        setSchedules(schedData);
        setOverrides(overData);

        // Build grid from schedule data
        const g = {};
        activeUsers.forEach(u => {
          g[u.id] = {};
          for (let d = 0; d < 7; d++) {
            const slot = schedData.find(s => s.user_id === u.id && s.day_of_week === d);
            g[u.id][d] = slot ? `${slot.slot_start?.substring(0,5)}-${slot.slot_end?.substring(0,5)}` : '';
          }
        });
        setGrid(g);
      } catch (e) { console.error(e); }
      setLoadingSched(false);
    };

    useEffect(() => { fetchSchedules(); }, []);

    const handleSlotChange = (userId, day, value) => {
      setGrid(prev => ({ ...prev, [userId]: { ...prev[userId], [day]: value } }));
    };

    const saveUserSchedule = async (u) => {
      setSaving(u.id);
      const entries = [];
      for (let d = 0; d < 7; d++) {
        const val = grid[u.id]?.[d];
        if (val) {
          const [start, end] = val.split('-');
          entries.push({ day_of_week: d, slot_start: start, slot_end: end });
        }
      }
      try {
        await schedulesApi.bulkSet(u.id, entries);
        setMsg(`✓ ${u.display_name}: ${entries.length > 0 ? entries.length + ' days saved' : 'all slots cleared'}`);
        fetchSchedules();
      } catch (e) { setMsg(e.message); }
      setSaving(null);
      setTimeout(() => setMsg(''), 3000);
    };

    const saveAllSchedules = async () => {
      setSaving('all');
      let saved = 0;
      try {
        for (const u of users) {
          const entries = [];
          for (let d = 0; d < 7; d++) {
            const val = grid[u.id]?.[d];
            if (val) {
              const [start, end] = val.split('-');
              entries.push({ day_of_week: d, slot_start: start, slot_end: end });
            }
          }
          await schedulesApi.bulkSet(u.id, entries);
          saved++;
        }
        setMsg(`✓ All schedules saved (${saved} users)`);
        fetchSchedules();
      } catch (e) { setMsg('Error: ' + e.message); }
      setSaving(null);
      setTimeout(() => setMsg(''), 4000);
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

    const SLOT_OPTIONS = [
      { value: '', label: '— Off —', color: C.slateLight },
      { value: '02:00-14:00', label: '02–14', color: '#2563eb' },
      { value: '14:00-20:00', label: '14–20', color: '#d97706' },
      { value: '20:00-02:00', label: '20–02', color: '#7c3aed' },
    ];

    const getSlotStyle = (val) => {
      if (!val) return { background: C.cream, color: C.slateLight, borderColor: C.border };
      if (val === '02:00-14:00') return { background: '#eff6ff', color: '#2563eb', borderColor: '#93c5fd' };
      if (val === '14:00-20:00') return { background: '#fffbeb', color: '#d97706', borderColor: '#fcd34d' };
      if (val === '20:00-02:00') return { background: '#f5f3ff', color: '#7c3aed', borderColor: '#c4b5fd' };
      return { background: C.cream, color: C.slate, borderColor: C.border };
    };

    return (
      <div style={{ fontFamily: FONT }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: 0 }}>Counselor Scheduling</h2>
            <p style={{ fontSize: 11, color: C.slateLight, margin: 0 }}>Select shifts directly in the grid. Save per row or Save All at once.</p>
          </div>
          <button onClick={saveAllSchedules} disabled={saving === 'all'} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.teal, color: C.white, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, opacity: saving === 'all' ? 0.5 : 1 }}>
            {saving === 'all' ? 'Saving...' : '💾 Save All Schedules'}
          </button>
        </div>

        {msg && <div style={{ background: msg.includes('error') || msg.includes('Select') ? C.redBg : C.greenBg, color: msg.includes('error') || msg.includes('Select') ? C.red : C.green, padding: '7px 12px', borderRadius: 8, fontSize: 12, marginBottom: 10, transition: 'all 0.3s' }}>{msg}</div>}

        {/* Slot Legend */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 11 }}>
          {SLOT_OPTIONS.filter(s => s.value).map(s => {
            const st = getSlotStyle(s.value);
            return <div key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: st.background, border: `1.5px solid ${st.borderColor}` }} />
              <span style={{ color: st.color, fontWeight: 600 }}>{s.value.replace('-', ' – ')}</span>
            </div>;
          })}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: C.cream, border: `1.5px solid ${C.border}` }} />
            <span style={{ color: C.slateLight }}>Off</span>
          </div>
        </div>

        {/* Inline Editable Grid */}
        <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.borderLight}`, overflow: 'hidden', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.navy }}>
                <th style={{ ...thSched, color: 'rgba(255,255,255,0.8)', background: C.navy, padding: '10px 12px', textAlign: 'left', minWidth: 140 }}>Counselor</th>
                {DAY_SHORT.map(d => <th key={d} style={{ ...thSched, color: 'rgba(255,255,255,0.8)', background: C.navy, padding: '10px 6px' }}>{d}</th>)}
                <th style={{ ...thSched, color: 'rgba(255,255,255,0.8)', background: C.navy, padding: '10px 8px', width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? C.white : C.cream + '80' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: `${C.teal}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.teal, flexShrink: 0 }}>{u.display_name?.charAt(0)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{u.display_name}</div>
                        <div style={{ fontSize: 9, color: C.slateLight }}>{u.role}</div>
                      </div>
                    </div>
                  </td>
                  {[0,1,2,3,4,5,6].map(d => {
                    const val = grid[u.id]?.[d] || '';
                    const st = getSlotStyle(val);
                    return (
                      <td key={d} style={{ padding: '5px 3px', textAlign: 'center' }}>
                        <select value={val} onChange={e => handleSlotChange(u.id, d, e.target.value)}
                          style={{ width: '100%', padding: '6px 2px', borderRadius: 5, border: `1.5px solid ${st.borderColor}`, fontSize: 10, fontWeight: val ? 700 : 400, color: st.color, background: st.background, cursor: 'pointer', fontFamily: FONT, textAlign: 'center', outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}>
                          <option value="" style={{ color: C.slateLight }}>Off</option>
                          <option value="02:00-14:00" style={{ color: '#2563eb' }}>02–14</option>
                          <option value="14:00-20:00" style={{ color: '#d97706' }}>14–20</option>
                          <option value="20:00-02:00" style={{ color: '#7c3aed' }}>20–02</option>
                        </select>
                      </td>
                    );
                  })}
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    <button onClick={() => saveUserSchedule(u)} disabled={saving === u.id}
                      style={{ ...btnSmallTeal, padding: '5px 12px', fontSize: 10, opacity: saving === u.id ? 0.5 : 1 }}>
                      {saving === u.id ? '...' : 'Save'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 9.5, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: '2px solid #d0d5dd' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb', opacity: u.is_active ? 1 : 0.5 }}>
                <td style={td}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CounselorAvatar name={u.display_name} size={28} /><span style={{ fontWeight: 700, fontSize: 13 }}>{u.display_name}</span></div></td>
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

  // ---- CONTACTS LIST ----
  const openContact = async (contact) => {
    try { const full = await contactsApi.get(contact.contact_id); setSelectedContact(full); setView('contact_detail'); } catch (e) { console.error(e); }
  };

  const ContactsList = () => {
    const [showAdd, setShowAdd] = useState(false);
    const [newContact, setNewContact] = useState({ prefix: '', first_name: '', last_name: '', email: '', isd: '', phone: '', nationality: '', contact_preference: '', notes: '' });
    const [saving, setSaving] = useState(false);

    const handleAddContact = async () => {
      if (!newContact.first_name || !newContact.last_name) return;
      setSaving(true);
      try {
        await contactsApi.create(newContact);
        setShowAdd(false);
        setNewContact({ prefix: '', first_name: '', last_name: '', email: '', isd: '', phone: '', nationality: '', contact_preference: '', notes: '' });
        fetchContacts();
      } catch (e) { console.error('Create contact failed:', e); }
      setSaving(false);
    };

    return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', flex: '1 1 280px', maxWidth: 380 }}>
          <span style={{ color: C.slateLight, fontSize: 14 }}>⌕</span>
          <input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder="Search contacts..." style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent', color: C.dark, fontFamily: FONT }} />
          {contactSearch && <span style={{ cursor: 'pointer', color: C.slateLight, fontSize: 12 }} onClick={() => setContactSearch('')}>✕</span>}
        </div>
        <select value={`${contactSort}|${contactOrder}`} onChange={e => { const parts = e.target.value.split('|'); setContactSort(parts[0]); setContactOrder(parts[1]); }} style={selStyle}>
          <option value="created_at|desc">Newest First</option>
          <option value="created_at|asc">Oldest First</option>
          <option value="first_name|asc">Name A–Z</option>
          <option value="first_name|desc">Name Z–A</option>
          <option value="updated_at|desc">Recently Updated</option>
        </select>
        <button onClick={() => setShowAdd(!showAdd)} style={btnSmallTeal}>+ Add Contact</button>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: C.slate, fontWeight: 500 }}>{contactsTotal} contacts</div>
      </div>

      {showAdd && (
        <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '16px 20px', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 12, fontFamily: FONT }}>Add New Contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><label style={lblSm}>Title</label><select value={newContact.prefix} onChange={e => setNewContact({...newContact, prefix: e.target.value})} style={inputSmall}><option value="">—</option><option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Dr.</option></select></div>
            <div><label style={lblSm}>First Name *</label><input value={newContact.first_name} onChange={e => setNewContact({...newContact, first_name: e.target.value})} placeholder="First name" style={inputSmall} /></div>
            <div><label style={lblSm}>Last Name *</label><input value={newContact.last_name} onChange={e => setNewContact({...newContact, last_name: e.target.value})} placeholder="Last name" style={inputSmall} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 8, marginBottom: 8 }}>
            <div><label style={lblSm}>Email</label><input value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} placeholder="email@example.com" style={inputSmall} type="email" /></div>
            <div><label style={lblSm}>ISD</label><input value={newContact.isd} onChange={e => setNewContact({...newContact, isd: e.target.value})} placeholder="+1" style={inputSmall} /></div>
            <div><label style={lblSm}>Phone</label><input value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} placeholder="Phone number" style={inputSmall} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><label style={lblSm}>Nationality</label><select value={newContact.nationality} onChange={e => setNewContact({...newContact, nationality: e.target.value})} style={inputSmall}><option value="">Select country</option>{COUNTRY_LIST.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label style={lblSm}>Contact Via</label><select value={newContact.contact_preference} onChange={e => setNewContact({...newContact, contact_preference: e.target.value})} style={inputSmall}><option value="">—</option><option value="whatsapp">WhatsApp</option><option value="phone">Phone</option><option value="email">Email</option><option value="telegram">Telegram</option></select></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={lblSm}>Notes</label><textarea value={newContact.notes} onChange={e => setNewContact({...newContact, notes: e.target.value})} placeholder="How did they reach out? Any context..." style={{ ...inputSmall, minHeight: 50, resize: 'vertical' }} /></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleAddContact} disabled={saving || !newContact.first_name || !newContact.last_name} style={{ ...btnSmallTeal, opacity: (saving || !newContact.first_name || !newContact.last_name) ? 0.5 : 1 }}>{saving ? 'Saving...' : 'Save Contact'}</button>
            <button onClick={() => setShowAdd(false)} style={btnSmallGhost}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.borderLight}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
          <thead><tr style={{ background: '#f3f4f6' }}>
            <th style={{ ...td, textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #d0d5dd' }}>Contact</th>
            <th style={{ ...td, textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #d0d5dd' }}>Email / Phone</th>
            <th style={{ ...td, textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #d0d5dd' }}>Country</th>
            <th style={{ ...td, textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #d0d5dd' }}>Type</th>
            <th style={{ ...td, textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #d0d5dd' }}>Leads</th>
            <th style={{ ...td, textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #d0d5dd' }}>Counselor</th>
            <th style={{ ...td, textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #d0d5dd' }}>Added</th>
          </tr></thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.contact_id} onClick={() => openContact(c)} style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = C.cream} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.cyan}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.cyan, flexShrink: 0 }}>{(c.first_name || '?')[0]}{(c.last_name || '?')[0]}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{c.prefix} {c.first_name} {c.last_name}</div>
                      <div style={{ fontSize: 10, color: C.slateLight, fontFamily: 'monospace' }}>{c.contact_id}</div>
                    </div>
                  </div>
                </td>
                <td style={td}>
                  <div style={{ fontSize: 12, color: C.slateDark }}>{c.email || '—'}</div>
                  <div style={{ fontSize: 11, color: C.slateLight }}>{c.isd} {c.phone || '—'}</div>
                </td>
                <td style={td}><span style={{ fontSize: 12 }}>{getFlag(c.nationality)} {c.nationality || '—'}</span></td>
                <td style={td}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, color: c.contact_type === 'patient' ? C.orange : C.purple, background: c.contact_type === 'patient' ? C.orangeBg : C.purpleBg, textTransform: 'uppercase' }}>{c.contact_type || 'patient'}</span>
                </td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: parseInt(c.lead_count) > 0 ? C.teal : C.slateLight }}>{c.lead_count || 0}</span>
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CounselorAvatar name={c.assigned_counselor} size={22} />
                    <span style={{ fontSize: 12, color: C.slateDark }}>{c.assigned_counselor || '—'}</span>
                  </div>
                </td>
                <td style={td}><span style={{ fontSize: 11, color: C.slateLight }}>{timeAgo(c.created_at)}</span></td>
              </tr>
            ))}
            {contacts.length === 0 && <tr><td colSpan="7" style={{ padding: 40, textAlign: 'center', color: C.slateLight, fontSize: 12 }}>No contacts found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
  };

  // ---- CONTACT DETAIL ----
  const ContactDetail = () => {
    const [showCreateLead, setShowCreateLead] = useState(false);
    const [newLeadData, setNewLeadData] = useState({ service_type: '', treatment_sought: '', message: '', priority: 'medium' });
    const [creating, setCreating] = useState(false);
    const contact = selectedContact;
    if (!contact) return null;

    const saveContactField = async (field, value) => {
      try {
        await contactsApi.update(contact.contact_id, { [field]: value });
        const updated = await contactsApi.get(contact.contact_id);
        setSelectedContact(updated);
      } catch (e) { console.error('Update contact failed:', e); }
    };

    const handleCreateLead = async () => {
      setCreating(true);
      try {
        const result = await contactsApi.createLead(contact.contact_id, newLeadData);
        if (result.success) {
          const updated = await contactsApi.get(contact.contact_id);
          setSelectedContact(updated);
          setShowCreateLead(false);
          setNewLeadData({ service_type: '', treatment_sought: '', message: '', priority: 'medium' });
          fetchData(); // Refresh leads list too
        }
      } catch (e) { console.error('Create lead failed:', e); }
      setCreating(false);
    };

    const waUrl = contact.isd && contact.phone ? `https://wa.me/${(contact.isd + contact.phone).replace(/[^0-9]/g, '')}` : null;

    return (
      <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.borderLight}`, overflow: 'hidden', fontFamily: FONT }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, color: C.white, padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <button onClick={() => setView('contacts')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: C.white, fontSize: 12, fontFamily: FONT }}>← Back</button>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>{contact.prefix} {contact.first_name} {contact.last_name}</h2>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, color: C.cyan, background: 'rgba(8,145,178,0.15)', textTransform: 'uppercase' }}>{contact.contact_type || 'patient'}</span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{getFlag(contact.nationality)} {contact.nationality} · {contact.email} · {contact.isd} {contact.phone} · {contact.contact_id}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {waUrl && <a href={waUrl} target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 8, background: '#25D366', color: C.white, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>WhatsApp</a>}
              <button onClick={() => setShowCreateLead(true)} style={{ padding: '6px 14px', borderRadius: 8, background: C.orange, border: 'none', color: C.white, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>+ New Lead</button>
              {isAdminOrManager && <button onClick={async () => { if (window.confirm(`Delete contact ${contact.first_name} ${contact.last_name}? Their leads will be unlinked but not deleted.`)) { try { await contactsApi.remove(contact.contact_id); fetchContacts(); setView('contacts'); } catch(e) { console.error(e); } }}} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Delete Contact</button>}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Left: Contact Info */}
          <div style={{ padding: '16px 20px', borderRight: `1px solid ${C.borderLight}` }}>
            {/* Contact Details Card */}
            <div style={{ background: C.white, borderRadius: 10, border: '1.5px solid #d0d5dd', marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1.5px solid #d0d5dd', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15 }}>👤</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontFamily: FONT }}>Contact Details</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
                <EF label="Title" value={contact.prefix} field="prefix" onSave={saveContactField} options={['Mr.', 'Mrs.', 'Ms.', 'Dr.']} />
                <EF label="First Name" value={contact.first_name} field="first_name" onSave={saveContactField} />
                <EF label="Last Name" value={contact.last_name} field="last_name" onSave={saveContactField} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
                <EF label="Email" value={contact.email} field="email" onSave={saveContactField} type="email" />
                <EF label="ISD" value={contact.isd} field="isd" onSave={saveContactField} />
                <EF label="Phone" value={contact.phone} field="phone" onSave={saveContactField} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                <EF label="Nationality" value={contact.nationality} field="nationality" onSave={saveContactField} options={COUNTRY_LIST} />
                <EF label="Contact Via" value={contact.contact_preference} field="contact_preference" onSave={saveContactField} options={['whatsapp', 'telegram', 'email', 'phone']} />
                <EF label="Relationship" value={contact.relationship_type} field="relationship_type" onSave={saveContactField} options={['Self','Spouse','Parent','Child','Sibling','Friend','Doctor','Agent','Other']} />
              </div>
            </div>

            {/* Source */}
            <div style={{ background: C.white, borderRadius: 10, border: '1.5px solid #d0d5dd', marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1.5px solid #d0d5dd', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🔗</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontFamily: FONT }}>Source</span>
              </div>
              <div style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 14px' }}>
                <div style={{ fontSize: 10, color: C.slateLight, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Page URL</div>
                <div style={{ fontSize: 12, color: C.blue, wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: 1.4 }}>{contact.page_url ? <a href={cleanUrl(contact.page_url)} target="_blank" rel="noreferrer" style={{ color: C.blue, textDecoration: 'none' }}>{contact.page_title || cleanUrl(contact.page_url)}</a> : '—'}</div>
              </div>
              <div style={{ padding: '8px 14px' }}>
                <div style={{ fontSize: 10, color: C.slateLight, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Referrer</div>
                <div style={{ fontSize: 12, color: C.slateDark }}>{contact.referrer || 'Direct'}</div>
              </div>
            </div>

            {/* Counselor & Notes */}
            <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1.5px solid #d0d5dd', background: '#f8f9fb', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📝</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontFamily: FONT }}>Assignment & Notes</span>
              </div>
              <div style={{ borderBottom: '1px solid #e5e7eb' }}>
                <EF label="Assigned Counselor" value={contact.assigned_counselor} field="assigned_counselor" onSave={saveContactField} options={counselors.length > 0 ? counselors : ['Admin']} />
              </div>
              <div>
                <EF label="Notes" value={contact.notes} field="notes" onSave={saveContactField} type="textarea" placeholder="Contact notes..." />
              </div>
            </div>

            <div style={{ padding: '10px 0', fontSize: 10, color: C.slateLight }}>
              Created: {fmtDate(contact.created_at)} · Updated: {fmtDate(contact.updated_at)}
            </div>
          </div>

          {/* Right: Leads from this contact */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.dark, fontFamily: FONT }}>Leads ({(contact.leads || []).length})</div>
              <button onClick={() => setShowCreateLead(true)} style={{ ...btnSmallTeal, fontSize: 11 }}>+ New Lead</button>
            </div>

            {/* Create Lead Form */}
            {showCreateLead && (
              <div style={{ background: C.orangeBg, border: `1.5px solid ${C.orange}30`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.orange, marginBottom: 10, fontFamily: FONT }}>Create New Lead for {contact.first_name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div><label style={lblSm}>Service Type</label><input value={newLeadData.service_type} onChange={e => setNewLeadData({...newLeadData, service_type: e.target.value})} placeholder="e.g. Medical Tourism" style={inputSmall} /></div>
                  <div><label style={lblSm}>Treatment Sought</label><input value={newLeadData.treatment_sought} onChange={e => setNewLeadData({...newLeadData, treatment_sought: e.target.value})} placeholder="e.g. Cardiac Surgery" style={inputSmall} /></div>
                </div>
                <div style={{ marginBottom: 8 }}><label style={lblSm}>Message / Notes</label><textarea value={newLeadData.message} onChange={e => setNewLeadData({...newLeadData, message: e.target.value})} placeholder="Initial enquiry details..." style={{ ...inputSmall, minHeight: 60, resize: 'vertical' }} /></div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <label style={lblSm}>Priority:</label>
                  {PRIORITIES.map(p => (
                    <button key={p.key} onClick={() => setNewLeadData({...newLeadData, priority: p.key})} style={{ padding: '3px 10px', borderRadius: 5, border: `1.5px solid ${newLeadData.priority === p.key ? p.color : C.border}`, background: newLeadData.priority === p.key ? `${p.color}15` : C.white, color: newLeadData.priority === p.key ? p.color : C.slate, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{p.label}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={handleCreateLead} disabled={creating} style={{ ...btnSmallTeal, opacity: creating ? 0.6 : 1 }}>{creating ? 'Creating...' : 'Create Lead'}</button>
                  <button onClick={() => setShowCreateLead(false)} style={btnSmallGhost}>Cancel</button>
                </div>
              </div>
            )}

            {/* Leads list */}
            {(contact.leads || []).length === 0 && !showCreateLead && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: C.slateLight }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No leads yet</div>
                <div style={{ fontSize: 11, marginBottom: 12 }}>Create a lead to start tracking this contact's enquiries.</div>
                <button onClick={() => setShowCreateLead(true)} style={btnSmallTeal}>+ Create First Lead</button>
              </div>
            )}

            {(contact.leads || []).map(lead => (
              <div key={lead.lead_id} onClick={() => { openDetail(lead); }} style={{ background: `linear-gradient(135deg, ${C.white}, ${C.offWhite})`, borderRadius: 10, border: `1px solid ${C.borderLight}`, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange + '40'; e.currentTarget.style.boxShadow = `0 2px 8px ${C.orange}10`; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{lead.treatment_sought || lead.service_type || 'Enquiry'}</div>
                    <div style={{ fontSize: 10, color: C.slateLight, fontFamily: 'monospace' }}>{lead.lead_id}</div>
                  </div>
                  <StatusBadge status={lead.status} small />
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: C.slate }}>
                  <span><PriorityDot priority={lead.priority} /> {lead.priority || 'medium'}</span>
                  {lead.urgency_level && <span style={{ color: URGENCY_COLORS[lead.urgency_level] || C.slate }}>⚡ {lead.urgency_level}</span>}
                  <span>👤 {lead.assigned_counselor || '—'}</span>
                  <span style={{ marginLeft: 'auto', color: C.slateLight }}>{timeAgo(lead.created_at)}</span>
                </div>
                {lead.message && <div style={{ fontSize: 11, color: C.slateDark, marginTop: 6, padding: '6px 8px', background: '#fffbf5', borderRadius: 6, borderLeft: `3px solid ${C.amber}`, lineHeight: 1.4 }}>{lead.message.substring(0, 120)}{lead.message.length > 120 ? '...' : ''}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ---- LOADING / LAYOUT ----
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}><div style={{ textAlign: 'center' }}><img src={LOGO_URL} alt="Loading" style={{ height: 40, borderRadius: 8, marginBottom: 8 }} /><div style={{ color: C.slateLight, fontSize: 12, fontFamily: FONT }}>Loading...</div></div></div>;

  return (
    <div style={{ fontFamily: FONT, display: 'flex', height: '100vh', overflow: 'hidden', background: '#f3f4f6' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, overflow: view === 'pipeline' ? 'hidden' : 'auto', padding: '18px 22px', ...(view === 'pipeline' ? { display: 'flex', flexDirection: 'column' } : {}) }}>
          {view === 'dashboard' && <Dashboard />}
          {view === 'leads' && <LeadsList />}
          {view === 'pipeline' && <Pipeline />}
          {view === 'analytics' && <Analytics />}
          {view === 'scheduling' && <Scheduling />}
          {view === 'detail' && <DetailView />}
          {view === 'contacts' && <ContactsList />}
          {view === 'contact_detail' && <ContactDetail />}
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
const inputSmall = { padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', fontFamily: FONT, color: C.dark, boxSizing: 'border-box', width: '100%' };
const labelStyle = { display: 'block', fontSize: 10, fontWeight: 700, color: C.slateDark, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONT };
const lblSm = { display: 'block', fontSize: 9, fontWeight: 600, color: C.slate, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONT };
const selStyle = { padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 11, color: C.slateDark, background: C.white, cursor: 'pointer', outline: 'none', fontFamily: FONT };
const td = { padding: '9px 12px', fontSize: 12, verticalAlign: 'middle' };
const tdV = { padding: '12px 14px', verticalAlign: 'middle' };
const hdrSel = { padding: '5px 9px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: C.white, fontSize: 11, cursor: 'pointer', fontFamily: FONT };
const btnTopbar = { background: C.cream, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 11px', color: C.slate, cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: FONT };
const btnSmallTeal = { padding: '5px 13px', borderRadius: 6, border: 'none', background: C.teal, color: C.white, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT };
const btnSmallGhost = { padding: '5px 11px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, fontSize: 11, cursor: 'pointer', fontFamily: FONT, color: C.slateDark };
const btnMicro = { padding: '3px 7px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 10, fontFamily: FONT };
const thSched = { padding: '8px 6px', textAlign: 'center', fontSize: 9, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '2px solid #d0d5dd', fontFamily: FONT };

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
