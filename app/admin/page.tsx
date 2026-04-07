'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

/* ─── TABS ───────────────────────────────────────────────── */
const TABS = [
  { key:'overview',      label:'Overview',      icon:'📊' },
  { key:'users',         label:'Users',          icon:'👥' },
  { key:'bookings',      label:'Bookings',       icon:'📅' },
  { key:'trainers',      label:'Trainers',       icon:'🏋️' },
  { key:'nutritionists', label:'Nutritionists',  icon:'🧬' },
  { key:'progress',      label:'Progress Logs',  icon:'📈' },
  { key:'reviews',       label:'Reviews',        icon:'⭐' },
];

const STATUS_COLORS: any = {
  confirmed: { bg:'rgba(198,241,53,0.08)',  color:'#c6f135', border:'rgba(198,241,53,0.2)'  },
  pending:   { bg:'rgba(245,158,11,0.08)',  color:'#fbbf24', border:'rgba(245,158,11,0.2)'  },
  cancelled: { bg:'rgba(244,63,94,0.08)',   color:'#fb7185', border:'rgba(244,63,94,0.2)'   },
  completed: { bg:'rgba(0,212,255,0.08)',   color:'#00d4ff', border:'rgba(0,212,255,0.2)'   },
  active:    { bg:'rgba(52,211,153,0.08)',  color:'#34d399', border:'rgba(52,211,153,0.2)'  },
  inactive:  { bg:'rgba(77,107,138,0.08)', color:'#4d6b8a', border:'rgba(77,107,138,0.2)'  },
};

function LoadingSpinner() {
  return (
    <div style={{minHeight:'100vh',background:'#03050a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:44,height:44,border:'2px solid rgba(198,241,53,0.15)',borderTop:'2px solid #c6f135',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.inactive;
  return (
    <span style={{padding:'3px 10px',borderRadius:100,fontSize:10,fontWeight:800,letterSpacing:'0.5px',textTransform:'uppercase',background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>
      {status}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color }: any) {
  return (
    <div style={{background:'var(--panel)',border:'1px solid var(--line)',borderRadius:18,padding:'22px 24px',position:'relative',overflow:'hidden',flex:1,minWidth:160}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color},transparent)`}}/>
      <div style={{fontSize:28,marginBottom:10}}>{icon}</div>
      <div style={{fontSize:28,fontWeight:900,letterSpacing:'-1.2px',color,marginBottom:4}}>{value}</div>
      <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{label}</div>
      {sub && <div style={{fontSize:11,color:'var(--sub)',fontWeight:400}}>{sub}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function AdminPanel() {
  const router = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('overview');

  /* Data */
  const [users,         setUsers]         = useState<any[]>([]);
  const [bookings,      setBookings]      = useState<any[]>([]);
  const [trainers,      setTrainers]      = useState<any[]>([]);
  const [nutritionists, setNutritionists] = useState<any[]>([]);
  const [progressLogs,  setProgressLogs]  = useState<any[]>([]);
  const [reviews,       setReviews]       = useState<any[]>([]);

  /* UI */
  const [search,       setSearch]       = useState('');
  const [toast,        setToast]        = useState('');
  const [toastType,    setToastType]    = useState<'success'|'error'>('success');
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [editModal,    setEditModal]    = useState<any>(null);
  const [dataLoading,  setDataLoading]  = useState(false);
  const toastTimer = useRef<any>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast(msg); setToastType(type);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  };

  /* ── Init: verify admin ── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/profile');
        const u = data?.data || data;
        if (u?.role !== 'admin') { router.push('/dashboard'); return; }
        setUser(u);
      } catch { router.push('/login'); return; }
      await loadAll();
      setLoading(false);
    })();
  }, []);

  const loadAll = async () => {
    setDataLoading(true);
    try {
      const [u, b, t, n] = await Promise.allSettled([
        API.get('/users?limit=200'),
        API.get('/bookings?limit=200'),
        API.get('/trainers?limit=200'),
        API.get('/nutritionists?limit=200'),
      ]);
      if (u.status==='fulfilled') setUsers(u.value.data?.data || u.value.data?.users || []);
      if (b.status==='fulfilled') setBookings(b.value.data?.data || b.value.data?.bookings || []);
      if (t.status==='fulfilled') setTrainers(t.value.data?.data || t.value.data?.trainers || []);
      if (n.status==='fulfilled') setNutritionists(n.value.data?.data || n.value.data?.nutritionists || []);
    } catch {}
    setDataLoading(false);
  };

  /* ── Actions ── */
  const deleteUser = async (id: string) => {
    try {
      await API.delete(`/users/${id}`);
      setUsers(p => p.filter(u => u._id !== id));
      showToast('User deleted.');
    } catch { showToast('Delete failed.', 'error'); }
    setConfirmModal(null);
  };

  const toggleUserRole = async (u: any) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await API.put(`/users/${u._id}`, { role: newRole });
      setUsers(p => p.map(x => x._id === u._id ? { ...x, role: newRole } : x));
      showToast(`${u.name} is now ${newRole}.`);
    } catch { showToast('Update failed.', 'error'); }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      await API.put(`/bookings/${id}`, { status });
      setBookings(p => p.map(b => b._id === id ? { ...b, status } : b));
      showToast(`Booking marked as ${status}.`);
    } catch { showToast('Update failed.', 'error'); }
  };

  const deleteTrainer = async (id: string) => {
    try {
      await API.delete(`/trainers/${id}`);
      setTrainers(p => p.filter(t => t._id !== id));
      showToast('Trainer removed.');
    } catch { showToast('Delete failed.', 'error'); }
    setConfirmModal(null);
  };

  const deleteNutritionist = async (id: string) => {
    try {
      await API.delete(`/nutritionists/${id}`);
      setNutritionists(p => p.filter(n => n._id !== id));
      showToast('Nutritionist removed.');
    } catch { showToast('Delete failed.', 'error'); }
    setConfirmModal(null);
  };

  /* ── Stats ── */
  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.price || 0), 0);
  const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
  const verifiedUsers = users.filter(u => u.isVerified).length;
  const avgRating = reviews.length ? (reviews.reduce((s,r) => s + (r.rating||0), 0) / reviews.length).toFixed(1) : '—';

  /* ── Filter helpers ── */
  const q = search.toLowerCase();
  const fUsers   = users.filter(u => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  const fBookings= bookings.filter(b => !q || b.user?.name?.toLowerCase().includes(q) || b.sessionType?.toLowerCase().includes(q) || b.status?.toLowerCase().includes(q));
  const fTrainers= trainers.filter(t => !q || t.name?.toLowerCase().includes(q) || t.specialty?.toLowerCase().includes(q));
  const fNutris  = nutritionists.filter(n => !q || n.name?.toLowerCase().includes(q) || n.specialty?.toLowerCase().includes(q));

  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' }) : '—';

  if (loading) return <LoadingSpinner />;

  /* ════════════════════ RENDER ═══════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{
          --void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;
          --lime:#c6f135;--cyan:#00d4ff;--violet:#8b5cf6;--rose:#f43f5e;--amber:#f59e0b;
          --text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);
        }
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;opacity:0.4;}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideup{from{opacity:0;transform:translateY(24px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* LAYOUT */
        .layout{display:flex;min-height:100vh;}
        .sidebar{width:260px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:28px 20px;position:fixed;top:0;left:0;bottom:0;overflow-y:auto;z-index:100;}
        .sidebar-logo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-bottom:36px;}
        .logo-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-0.5px;}
        .logo-text em{font-style:normal;color:var(--lime);}
        .nav-item{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;font-size:14px;font-weight:500;color:var(--sub);transition:all 0.2s;margin-bottom:2px;border:1px solid transparent;text-decoration:none;background:transparent;width:100%;text-align:left;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;}
        .nav-item:hover{color:var(--text);background:rgba(255,255,255,0.04);}
        .nav-item.active{color:var(--lime);background:rgba(198,241,53,0.08);border-color:rgba(198,241,53,0.12);}
        .sidebar-bottom{margin-top:auto;padding-top:20px;}
        .user-card{display:flex;align-items:center;gap:12px;padding:14px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid var(--line);margin-bottom:10px;}
        .btn-logout{width:100%;padding:11px;background:rgba(244,63,94,0.06);border:1px solid rgba(244,63,94,0.15);border-radius:10px;color:#fb7185;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;}
        .btn-logout:hover{background:rgba(244,63,94,0.12);}

        /* MAIN */
        .main{margin-left:260px;flex:1;min-width:0;}
        .topbar{height:68px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 36px;background:rgba(3,5,10,0.85);backdrop-filter:blur(20px);position:sticky;top:0;z-index:50;}
        .topbar-title{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:700;letter-spacing:-0.5px;}
        .admin-badge{padding:4px 12px;border-radius:100px;font-size:10px;font-weight:800;letter-spacing:'1px';text-transform:uppercase;background:rgba(244,63,94,0.1);color:#fb7185;border:1px solid rgba(244,63,94,0.2);}
        .back-btn{display:flex;align-items:center;gap:7px;padding:8px 16px;background:var(--panel);border:1px solid var(--line);border-radius:9px;color:var(--sub);font-size:13px;font-weight:600;text-decoration:none;transition:all 0.2s;}
        .back-btn:hover{color:var(--text);}

        .content{padding:36px;animation:fadein 0.4s ease;}

        /* TABS */
        .tabs-scroll{display:flex;gap:4px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:5px;margin-bottom:28px;overflow-x:auto;}
        .tab-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;border:1px solid transparent;background:transparent;color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;}
        .tab-btn:hover{color:var(--text);background:rgba(255,255,255,0.04);}
        .tab-btn.active{background:rgba(198,241,53,0.1);color:var(--lime);border-color:rgba(198,241,53,0.2);}

        /* STATS ROW */
        .stats-row{display:flex;gap:14px;margin-bottom:24px;flex-wrap:wrap;}

        /* SECTION CARD */
        .section-card{background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden;margin-bottom:20px;}
        .section-head{padding:18px 24px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
        .section-title{font-size:15px;font-weight:800;letter-spacing:-0.4px;display:flex;align-items:center;gap:8px;}
        .count-badge{padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700;background:rgba(198,241,53,0.08);color:var(--lime);border:1px solid rgba(198,241,53,0.15);}

        /* SEARCH */
        .search-wrap{position:relative;}
        .search-wrap input{padding:9px 14px 9px 36px;background:var(--panel2);border:1px solid var(--line);border-radius:9px;color:var(--text);font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;width:240px;transition:all 0.2s;}
        .search-wrap input:focus{border-color:rgba(198,241,53,0.3);box-shadow:0 0 0 3px rgba(198,241,53,0.06);}
        .search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--sub);pointer-events:none;}

        /* TABLE */
        .table-wrap{overflow-x:auto;}
        table{width:100%;border-collapse:collapse;}
        th{padding:11px 18px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--sub);border-bottom:1px solid var(--line);white-space:nowrap;}
        td{padding:13px 18px;font-size:13px;border-bottom:1px solid var(--line);vertical-align:middle;}
        tr:last-child td{border-bottom:none;}
        tr:hover td{background:rgba(255,255,255,0.015);}
        .td-name{font-weight:700;}
        .td-sub{font-size:11px;color:var(--sub);margin-top:2px;}

        /* AVATAR */
        .avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;background:linear-gradient(135deg,rgba(198,241,53,0.2),rgba(0,212,255,0.15));color:var(--lime);}

        /* ACTION BUTTONS */
        .btn-sm{padding:5px 12px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;}
        .btn-danger{background:rgba(244,63,94,0.06);color:#fb7185;border-color:rgba(244,63,94,0.2);}
        .btn-danger:hover{background:rgba(244,63,94,0.14);}
        .btn-primary-sm{background:rgba(198,241,53,0.08);color:var(--lime);border-color:rgba(198,241,53,0.2);}
        .btn-primary-sm:hover{background:rgba(198,241,53,0.16);}
        .btn-ghost-sm{background:rgba(255,255,255,0.04);color:var(--sub);border-color:var(--line);}
        .btn-ghost-sm:hover{color:var(--text);}
        .actions{display:flex;gap:6px;align-items:center;}

        /* SELECT */
        .status-select{padding:4px 10px;background:var(--panel2);border:1px solid var(--line);border-radius:7px;color:var(--text);font-size:11px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;cursor:pointer;}

        /* EMPTY */
        .empty-row td{text-align:center;padding:48px;color:var(--sub);font-size:13px;}

        /* OVERVIEW CHARTS */
        .overview-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px;}
        .ov-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:22px;position:relative;overflow:hidden;}
        .ov-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
        .ov-title{font-size:13px;font-weight:800;letter-spacing:-0.3px;margin-bottom:16px;}
        .ov-list-item{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line);}
        .ov-list-item:last-child{border-bottom:none;}
        .ov-bar-wrap{flex:1;height:4px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;margin:0 12px;}
        .ov-bar{height:100%;border-radius:3px;}

        /* CONFIRM MODAL */
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(20px);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadein 0.2s ease;}
        .modal{background:var(--panel);border:1px solid var(--line);border-radius:22px;width:100%;max-width:420px;padding:28px;animation:slideup 0.3s cubic-bezier(0.34,1.56,0.64,1);position:relative;}
        .modal-title{font-size:18px;font-weight:900;letter-spacing:-0.6px;margin-bottom:8px;}
        .modal-sub{font-size:13px;color:var(--sub);line-height:1.65;margin-bottom:22px;}
        .modal-actions{display:flex;gap:10px;}
        .btn-cancel-modal{flex:1;padding:12px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--sub);font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .btn-confirm-modal{flex:1;padding:12px;background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.25);border-radius:10px;color:#fb7185;font-size:13px;font-weight:800;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;}
        .btn-confirm-modal:hover{background:rgba(244,63,94,0.2);}

        /* TOAST */
        .toast{position:fixed;bottom:28px;right:28px;z-index:2000;padding:13px 20px;border-radius:12px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px;animation:fadein 0.3s ease;backdrop-filter:blur(12px);}
        .toast-success{background:rgba(198,241,53,0.12);border:1px solid rgba(198,241,53,0.3);color:var(--lime);}
        .toast-error{background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.3);color:#fb7185;}

        /* REFRESH BTN */
        .btn-refresh{display:flex;align-items:center;gap:6px;padding:8px 16px;background:var(--panel2);border:1px solid var(--line);border-radius:9px;color:var(--sub);font-size:12px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;}
        .btn-refresh:hover{color:var(--text);}

        @media(max-width:900px){.sidebar{display:none}.main{margin-left:0}.content{padding:20px}.stats-row{flex-direction:column}.overview-grid{grid-template-columns:1fr}}
      `}</style>

      {/* TOAST */}
      {toast && <div className={`toast toast-${toastType}`}>{toast}</div>}

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setConfirmModal(null);}}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,borderRadius:'22px 22px 0 0',background:'linear-gradient(90deg,transparent,var(--rose),transparent)'}}/>
            <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
            <div className="modal-title">{confirmModal.title}</div>
            <div className="modal-sub">{confirmModal.message}</div>
            <div className="modal-actions">
              <button className="btn-cancel-modal" onClick={()=>setConfirmModal(null)}>Cancel</button>
              <button className="btn-confirm-modal" onClick={()=>confirmModal.onConfirm()}>
                {confirmModal.confirmLabel || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a className="sidebar-logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
          {[
            {icon:'⚡',label:'Dashboard',     href:'/dashboard'},
            {icon:'📊',label:'Progress',      href:'/progress'},
            {icon:'📝',label:'Log Today',     href:'/progress/log'},
            {icon:'🏋️',label:'Workouts',      href:'/workouts/generate'},
            {icon:'📅',label:'My Bookings',   href:'/bookings'},
            {icon:'👥',label:'Trainers',      href:'/trainers'},
            {icon:'🧬',label:'Nutritionists', href:'/nutritionists'},
            {icon:'📍',label:'Gyms',          href:'/gym-packages'},
            {icon:'🥗',label:'Meal Plans',    href:'/meals'},
            {icon:'📰',label:'Articles',      href:'/articles'},
            {icon:'💊',label:'Supplements',   href:'/supplements'},
            {icon:'👤',label:'Profile',       href:'/profile'},
            {icon:'🔐',label:'Admin Panel',   href:'/admin', active:true},
          ].map(n=>(
            <a key={n.label} className={`nav-item ${(n as any).active?'active':''}`} href={n.href}>
              <span style={{fontSize:16,width:20,textAlign:'center'}}>{n.icon}</span>{n.label}
            </a>
          ))}
          <div className="sidebar-bottom">
            <div className="user-card">
              <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,rgba(198,241,53,0.3),rgba(0,212,255,0.2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'var(--lime)'}}>
                {user?.name?.[0]?.toUpperCase()||'A'}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{user?.name}</div>
                <div style={{fontSize:10,color:'#fb7185',fontWeight:600}}>Administrator</div>
              </div>
            </div>
            <button className="btn-logout" onClick={()=>{localStorage.removeItem('token');router.push('/login');}}>Sign out</button>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-title">
              🔐 Admin Panel
              <span className="admin-badge">Admin Only</span>
            </div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <button className="btn-refresh" onClick={loadAll} disabled={dataLoading}>
                {dataLoading ? '⏳' : '🔄'} Refresh
              </button>
              <a className="back-btn" href="/dashboard">← Dashboard</a>
            </div>
          </div>

          <div className="content">

            {/* TABS */}
            <div className="tabs-scroll">
              {TABS.map(t=>(
                <button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`} onClick={()=>{setTab(t.key);setSearch('');}}>
                  <span>{t.icon}</span>{t.label}
                  {t.key==='users'     && <span className="count-badge">{users.length}</span>}
                  {t.key==='bookings'  && <span className="count-badge">{bookings.length}</span>}
                  {t.key==='trainers'  && <span className="count-badge">{trainers.length}</span>}
                  {t.key==='nutritionists' && <span className="count-badge">{nutritionists.length}</span>}
                </button>
              ))}
            </div>

            {/* ══ OVERVIEW TAB ══ */}
            {tab==='overview' && (
              <>
                <div className="stats-row">
                  <StatCard icon="👥" label="Total Users"     value={fmt(users.length)}        sub={`${verifiedUsers} verified`}          color="var(--cyan)"   />
                  <StatCard icon="📅" label="Total Bookings"  value={fmt(bookings.length)}      sub={`${activeBookings} confirmed`}        color="var(--lime)"   />
                  <StatCard icon="💰" label="Total Revenue"   value={`PKR ${fmt(totalRevenue)}`} sub="from bookings"                       color="var(--violet)" />
                  <StatCard icon="🏋️" label="Trainers"        value={fmt(trainers.length)}      sub={`${nutritionists.length} nutritionists`} color="var(--amber)"  />
                </div>

                <div className="overview-grid">
                  {/* Recent bookings */}
                  <div className="ov-card" style={{'--top-color':'var(--lime)'} as any}>
                    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,var(--lime),transparent)'}}/>
                    <div className="ov-title">📅 Recent Bookings</div>
                    {bookings.slice(0,6).map((b:any,i:number)=>(
                      <div key={i} className="ov-list-item">
                        <div>
                          <div style={{fontSize:13,fontWeight:600}}>{b.user?.name || 'User'}</div>
                          <div style={{fontSize:11,color:'var(--sub)'}}>{b.sessionType || 'Session'} · {fmtDate(b.date)}</div>
                        </div>
                        <StatusPill status={b.status || 'confirmed'}/>
                      </div>
                    ))}
                    {bookings.length===0 && <div style={{fontSize:13,color:'var(--sub)',textAlign:'center',padding:'20px 0'}}>No bookings yet</div>}
                  </div>

                  {/* Recent users */}
                  <div className="ov-card">
                    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,var(--cyan),transparent)'}}/>
                    <div className="ov-title">👥 Recent Users</div>
                    {users.slice(0,6).map((u:any,i:number)=>(
                      <div key={i} className="ov-list-item">
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div className="avatar">{u.name?.[0]?.toUpperCase()||'U'}</div>
                          <div>
                            <div style={{fontSize:13,fontWeight:600}}>{u.name}</div>
                            <div style={{fontSize:11,color:'var(--sub)'}}>{u.email}</div>
                          </div>
                        </div>
                        <StatusPill status={u.isVerified ? 'active' : 'pending'}/>
                      </div>
                    ))}
                    {users.length===0 && <div style={{fontSize:13,color:'var(--sub)',textAlign:'center',padding:'20px 0'}}>No users yet</div>}
                  </div>

                  {/* Booking status breakdown */}
                  <div className="ov-card">
                    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,var(--violet),transparent)'}}/>
                    <div className="ov-title">📊 Booking Breakdown</div>
                    {[
                      {label:'Confirmed', count:bookings.filter(b=>b.status==='confirmed').length, color:'var(--lime)'},
                      {label:'Completed', count:bookings.filter(b=>b.status==='completed').length, color:'var(--cyan)'},
                      {label:'Pending',   count:bookings.filter(b=>b.status==='pending').length,   color:'var(--amber)'},
                      {label:'Cancelled', count:bookings.filter(b=>b.status==='cancelled').length, color:'var(--rose)'},
                    ].map(item=>(
                      <div key={item.label} className="ov-list-item">
                        <span style={{fontSize:13,fontWeight:600,width:80}}>{item.label}</span>
                        <div className="ov-bar-wrap">
                          <div className="ov-bar" style={{width:`${bookings.length ? (item.count/bookings.length)*100 : 0}%`,background:item.color}}/>
                        </div>
                        <span style={{fontSize:13,fontWeight:800,color:item.color,width:24,textAlign:'right'}}>{item.count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Fitness goals breakdown */}
                  <div className="ov-card">
                    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,var(--amber),transparent)'}}/>
                    <div className="ov-title">🎯 User Fitness Goals</div>
                    {[
                      {label:'Weight Loss',   key:'weight_loss',  color:'#fb7185'},
                      {label:'Muscle Gain',   key:'muscle_gain',  color:'var(--cyan)'},
                      {label:'Endurance',     key:'endurance',    color:'var(--lime)'},
                      {label:'Flexibility',   key:'flexibility',  color:'#a78bfa'},
                      {label:'General',       key:'general',      color:'var(--amber)'},
                    ].map(g=>{
                      const count = users.filter(u=>u.fitnessGoal===g.key).length;
                      return (
                        <div key={g.key} className="ov-list-item">
                          <span style={{fontSize:13,fontWeight:600,width:100}}>{g.label}</span>
                          <div className="ov-bar-wrap">
                            <div className="ov-bar" style={{width:`${users.length ? (count/users.length)*100 : 0}%`,background:g.color}}/>
                          </div>
                          <span style={{fontSize:13,fontWeight:800,color:g.color,width:24,textAlign:'right'}}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ══ USERS TAB ══ */}
            {tab==='users' && (
              <div className="section-card">
                <div className="section-head">
                  <div className="section-title">👥 All Users <span className="count-badge">{fUsers.length}</span></div>
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)}/>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Goal</th>
                        <th>Verified</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fUsers.length===0
                        ? <tr className="empty-row"><td colSpan={6}>No users found</td></tr>
                        : fUsers.map((u:any)=>(
                          <tr key={u._id}>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <div className="avatar">{u.name?.[0]?.toUpperCase()||'U'}</div>
                                <div>
                                  <div className="td-name">{u.name}</div>
                                  <div className="td-sub">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <StatusPill status={u.role==='admin' ? 'active' : 'inactive'}/>
                              <div className="td-sub" style={{marginTop:4}}>{u.role}</div>
                            </td>
                            <td><span style={{fontSize:12,color:'var(--sub)'}}>{u.fitnessGoal?.replace(/_/g,' ') || '—'}</span></td>
                            <td><StatusPill status={u.isVerified ? 'active' : 'pending'}/></td>
                            <td><span style={{fontSize:12,color:'var(--sub)'}}>{fmtDate(u.createdAt)}</span></td>
                            <td>
                              <div className="actions">
                                <button className="btn-sm btn-ghost-sm"
                                  onClick={()=>toggleUserRole(u)}
                                  title={u.role==='admin'?'Demote to user':'Promote to admin'}>
                                  {u.role==='admin' ? '⬇️ Demote' : '⬆️ Promote'}
                                </button>
                                {u._id !== user?._id && (
                                  <button className="btn-sm btn-danger"
                                    onClick={()=>setConfirmModal({
                                      title:'Delete User',
                                      message:`Are you sure you want to delete "${u.name}"? This action cannot be undone.`,
                                      confirmLabel:'Delete User',
                                      onConfirm:()=>deleteUser(u._id),
                                    })}>
                                    🗑 Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ BOOKINGS TAB ══ */}
            {tab==='bookings' && (
              <div className="section-card">
                <div className="section-head">
                  <div className="section-title">📅 All Bookings <span className="count-badge">{fBookings.length}</span></div>
                  <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                    <div style={{fontSize:12,color:'var(--sub)'}}>
                      Revenue: <strong style={{color:'var(--lime)'}}>PKR {totalRevenue.toLocaleString()}</strong>
                    </div>
                    <div className="search-wrap">
                      <span className="search-icon">🔍</span>
                      <input placeholder="Search user or session…" value={search} onChange={e=>setSearch(e.target.value)}/>
                    </div>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Session Type</th>
                        <th>Date</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Change Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fBookings.length===0
                        ? <tr className="empty-row"><td colSpan={6}>No bookings found</td></tr>
                        : fBookings.map((b:any)=>(
                          <tr key={b._id}>
                            <td>
                              <div className="td-name">{b.user?.name || 'Unknown'}</div>
                              <div className="td-sub">{b.user?.email || '—'}</div>
                            </td>
                            <td>
                              <div style={{fontSize:13}}>{b.sessionType || 'General'}</div>
                              {b.package && <div className="td-sub">{b.package}</div>}
                            </td>
                            <td><span style={{fontSize:12,color:'var(--sub)'}}>{fmtDate(b.date)}</span></td>
                            <td><span style={{fontSize:13,fontWeight:700,color:'var(--lime)'}}>PKR {(b.price||0).toLocaleString()}</span></td>
                            <td><StatusPill status={b.status || 'confirmed'}/></td>
                            <td>
                              <select className="status-select"
                                value={b.status || 'confirmed'}
                                onChange={e=>updateBookingStatus(b._id, e.target.value)}>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ TRAINERS TAB ══ */}
            {tab==='trainers' && (
              <div className="section-card">
                <div className="section-head">
                  <div className="section-title">🏋️ All Trainers <span className="count-badge">{fTrainers.length}</span></div>
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input placeholder="Search name or specialty…" value={search} onChange={e=>setSearch(e.target.value)}/>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Trainer</th>
                        <th>Specialty</th>
                        <th>Experience</th>
                        <th>Price/hr</th>
                        <th>Rating</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fTrainers.length===0
                        ? <tr className="empty-row"><td colSpan={6}>No trainers found</td></tr>
                        : fTrainers.map((t:any)=>(
                          <tr key={t._id}>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <div className="avatar" style={{background:'linear-gradient(135deg,rgba(0,212,255,0.2),rgba(0,212,255,0.1))',color:'var(--cyan)'}}>
                                  {t.name?.[0]?.toUpperCase()||'T'}
                                </div>
                                <div>
                                  <div className="td-name">{t.name}</div>
                                  <div className="td-sub">{t.email || '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td><span style={{fontSize:12}}>{t.specialty || '—'}</span></td>
                            <td><span style={{fontSize:12,color:'var(--sub)'}}>{t.experience ? `${t.experience} yrs` : '—'}</span></td>
                            <td><span style={{fontSize:13,fontWeight:700,color:'var(--lime)'}}>PKR {(t.hourlyRate||t.price||0).toLocaleString()}</span></td>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:4}}>
                                <span style={{color:'#fbbf24'}}>★</span>
                                <span style={{fontSize:13,fontWeight:700}}>{t.rating || '—'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="actions">
                                <a href={`/trainers/${t._id}`} className="btn-sm btn-ghost-sm" style={{textDecoration:'none'}}>👁 View</a>
                                <button className="btn-sm btn-danger"
                                  onClick={()=>setConfirmModal({
                                    title:'Remove Trainer',
                                    message:`Remove "${t.name}" from the platform? All their bookings will be affected.`,
                                    confirmLabel:'Remove Trainer',
                                    onConfirm:()=>deleteTrainer(t._id),
                                  })}>
                                  🗑 Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ NUTRITIONISTS TAB ══ */}
            {tab==='nutritionists' && (
              <div className="section-card">
                <div className="section-head">
                  <div className="section-title">🧬 All Nutritionists <span className="count-badge">{fNutris.length}</span></div>
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input placeholder="Search name or specialty…" value={search} onChange={e=>setSearch(e.target.value)}/>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nutritionist</th>
                        <th>Specialty</th>
                        <th>Experience</th>
                        <th>Price/session</th>
                        <th>Rating</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fNutris.length===0
                        ? <tr className="empty-row"><td colSpan={6}>No nutritionists found</td></tr>
                        : fNutris.map((n:any)=>(
                          <tr key={n._id}>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <div className="avatar" style={{background:'linear-gradient(135deg,rgba(52,211,153,0.2),rgba(52,211,153,0.1))',color:'#34d399'}}>
                                  {n.name?.[0]?.toUpperCase()||'N'}
                                </div>
                                <div>
                                  <div className="td-name">{n.name}</div>
                                  <div className="td-sub">{n.email || '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td><span style={{fontSize:12}}>{n.specialty || '—'}</span></td>
                            <td><span style={{fontSize:12,color:'var(--sub)'}}>{n.experience ? `${n.experience} yrs` : '—'}</span></td>
                            <td><span style={{fontSize:13,fontWeight:700,color:'var(--lime)'}}>PKR {(n.sessionPrice||n.price||0).toLocaleString()}</span></td>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:4}}>
                                <span style={{color:'#fbbf24'}}>★</span>
                                <span style={{fontSize:13,fontWeight:700}}>{n.rating || '—'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="actions">
                                <a href={`/nutritionists/${n._id}`} className="btn-sm btn-ghost-sm" style={{textDecoration:'none'}}>👁 View</a>
                                <button className="btn-sm btn-danger"
                                  onClick={()=>setConfirmModal({
                                    title:'Remove Nutritionist',
                                    message:`Remove "${n.name}" from the platform?`,
                                    confirmLabel:'Remove',
                                    onConfirm:()=>deleteNutritionist(n._id),
                                  })}>
                                  🗑 Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ PROGRESS LOGS TAB ══ */}
            {tab==='progress' && (
              <div className="section-card">
                <div className="section-head">
                  <div className="section-title">📈 Progress Logs</div>
                  <div style={{fontSize:12,color:'var(--sub)'}}>Users' daily health data entries</div>
                </div>
                <div style={{padding:'48px',textAlign:'center'}}>
                  <div style={{fontSize:48,marginBottom:12}}>📈</div>
                  <div style={{fontSize:16,fontWeight:800,marginBottom:8}}>Progress Logs</div>
                  <div style={{fontSize:13,color:'var(--sub)',maxWidth:380,margin:'0 auto',lineHeight:1.7}}>
                    Progress logs are tied to individual users. Use the Users tab to find a user, then view their individual progress from their profile page.
                  </div>
                  <button className="btn-refresh" style={{margin:'20px auto 0',display:'inline-flex'}} onClick={()=>setTab('users')}>
                    → Go to Users
                  </button>
                </div>
              </div>
            )}

            {/* ══ REVIEWS TAB ══ */}
            {tab==='reviews' && (
              <div className="section-card">
                <div className="section-head">
                  <div className="section-title">⭐ Reviews & Ratings</div>
                  <div style={{fontSize:12,color:'var(--sub)'}}>Platform average: <strong style={{color:'var(--lime)'}}>{avgRating} ★</strong></div>
                </div>
                <div style={{padding:'48px',textAlign:'center'}}>
                  <div style={{fontSize:48,marginBottom:12}}>⭐</div>
                  <div style={{fontSize:16,fontWeight:800,marginBottom:8}}>Reviews Module</div>
                  <div style={{fontSize:13,color:'var(--sub)',maxWidth:380,margin:'0 auto',lineHeight:1.7}}>
                    Reviews are linked to trainers and nutritionists. Navigate to their individual profiles to see all reviews and ratings.
                  </div>
                  <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:20}}>
                    <a href="/trainers" style={{textDecoration:'none'}} className="btn-sm btn-primary-sm" style={{padding:'9px 20px',borderRadius:9,fontSize:13}}>🏋️ View Trainers</a>
                    <a href="/nutritionists" style={{textDecoration:'none'}} className="btn-sm btn-ghost-sm" style={{padding:'9px 20px',borderRadius:9,fontSize:13}}>🧬 View Nutritionists</a>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}