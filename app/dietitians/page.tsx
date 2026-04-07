'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

/* ── helpers ── */
const GRADIENTS = [
  'linear-gradient(135deg,#c6f135,#00d4ff)',
  'linear-gradient(135deg,#00d4ff,#8b5cf6)',
  'linear-gradient(135deg,#8b5cf6,#f43f5e)',
  'linear-gradient(135deg,#f59e0b,#c6f135)',
  'linear-gradient(135deg,#34d399,#00d4ff)',
  'linear-gradient(135deg,#f43f5e,#f59e0b)',
  'linear-gradient(135deg,#f472b6,#8b5cf6)',
  'linear-gradient(135deg,#00d4ff,#34d399)',
];
const initials = (n: string) => (n||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
const grad = (id: string, i: number) => GRADIENTS[(parseInt((id||'').slice(-2)||'0',16)+i) % GRADIENTS.length];

const SPECS = [
  { id:'all',        label:'All Dietitians',     icon:'🌿' },
  { id:'clinical',   label:'Clinical',            icon:'🩺' },
  { id:'diabetes',   label:'Diabetes',            icon:'💉' },
  { id:'renal',      label:'Renal / Kidney',      icon:'🫘' },
  { id:'cardiac',    label:'Cardiac Nutrition',   icon:'❤️' },
  { id:'oncology',   label:'Oncology',            icon:'🎗️' },
  { id:'pediatric',  label:'Pediatric',           icon:'👶' },
  { id:'gastro',     label:'Gastroenterology',    icon:'🫁' },
  { id:'eating',     label:'Eating Disorders',    icon:'🧠' },
  { id:'sports',     label:'Sports Dietitian',    icon:'⚡' },
];

export default function DietitiansPage() {
  const router = useRouter();
  const [dietitians, setDietitians] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [user,       setUser]       = useState<any>(null);
  const [search,     setSearch]     = useState('');
  const [spec,       setSpec]       = useState('all');
  const [sort,       setSort]       = useState('rating');
  const [view,       setView]       = useState<'grid'|'list'>('grid');
  const [bookItem,   setBookItem]   = useState<any>(null);
  const [booking,    setBooking]    = useState({ date:'', time:'', type:'Video Consultation', notes:'' });
  const [bookOk,     setBookOk]     = useState(false);
  const [bookLoading,setBL]         = useState(false);
  const [toast,      setToast]      = useState('');
  const toastRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        const [dRes, uRes] = await Promise.allSettled([
          API.get('/dietitians?limit=60'),
          API.get('/users/profile'),
        ]);
        if (dRes.status === 'fulfilled') {
          const d = dRes.value.data?.data || dRes.value.data?.dietitians || [];
          setDietitians(d);
        }
        if (uRes.status === 'fulfilled') setUser(uRes.value.data?.data || uRes.value.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = dietitians
    .filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.name?.toLowerCase().includes(q) || d.specialty?.toLowerCase().includes(q) || d.expertise?.toLowerCase().includes(q) || (d.tags||[]).some((t:string)=>t.toLowerCase().includes(q));
      const matchSpec   = spec === 'all' || d.specialty?.toLowerCase().includes(spec) || (d.tags||[]).some((t:string)=>t.toLowerCase().includes(spec));
      return matchSearch && matchSpec;
    })
    .sort((a,b) => {
      if (sort === 'rating')     return (b.rating||0)-(a.rating||0);
      if (sort === 'price-low')  return (a.sessionFee||a.price||0)-(b.sessionFee||b.price||0);
      if (sort === 'price-high') return (b.sessionFee||b.price||0)-(a.sessionFee||a.price||0);
      if (sort === 'exp')        return (b.experience||0)-(a.experience||0);
      return 0;
    });

  const submitBooking = async () => {
    if (!booking.date || !booking.time) return showToast('Please select date and time');
    if (!user) return router.push('/login');
    setBL(true);
    try {
      await API.post('/bookings', {
        dietitian:   bookItem?._id,
        sessionType: booking.type,
        date:        booking.date,
        timeSlot:    booking.time,
        notes:       booking.notes,
      });
      setBookOk(true);
      showToast('✓ Booking confirmed!');
      setTimeout(() => { setBookItem(null); setBookOk(false); }, 3000);
    } catch (e:any) {
      showToast(e?.response?.data?.message || 'Booking failed');
    }
    setBL(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;--lime:#c6f135;--cyan:#00d4ff;--violet:#8b5cf6;--rose:#f43f5e;--amber:#f59e0b;--green:#34d399;--pink:#f472b6;--text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);}
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(198,241,53,.4)}50%{box-shadow:0 0 0 7px rgba(198,241,53,0)}}

        /* NAV */
        .nav{position:sticky;top:0;z-index:100;height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(3,5,10,.9);backdrop-filter:blur(24px);border-bottom:1px solid var(--line);}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .logo-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-.5px;}.logo-text em{font-style:normal;color:var(--lime);}
        .nav-links{display:flex;align-items:center;gap:4px;}
        .nav-a{padding:7px 13px;border-radius:8px;font-size:13px;font-weight:600;color:var(--sub);text-decoration:none;transition:all .2s;}
        .nav-a:hover{color:var(--text);background:rgba(255,255,255,.04);}
        .nav-a.on{color:var(--lime);}
        .nav-dash{padding:8px 18px;border-radius:9px;background:var(--lime);color:#000;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s;}
        .nav-dash:hover{background:#d4ff45;}

        /* HERO */
        .hero{max-width:1200px;margin:0 auto;padding:70px 40px 50px;animation:fadein .5s ease;}
        .hero-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:100px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.2);font-size:11.5px;font-weight:700;color:var(--cyan);letter-spacing:.5px;margin-bottom:22px;}
        .hero-title{font-size:clamp(36px,5vw,58px);font-weight:900;letter-spacing:-2.5px;line-height:1;margin-bottom:16px;}
        .hero-title em{font-style:normal;color:var(--cyan);}
        .hero-sub{font-size:15px;color:var(--sub);max-width:540px;line-height:1.75;font-weight:300;margin-bottom:36px;}
        .hero-stats{display:flex;gap:32px;flex-wrap:wrap;}
        .hstat-val{font-size:22px;font-weight:900;letter-spacing:-1px;color:var(--cyan);margin-bottom:3px;}
        .hstat-lbl{font-size:11px;color:var(--sub);font-weight:600;letter-spacing:.5px;text-transform:uppercase;}

        /* WHAT IS A DIETITIAN banner */
        .diff-banner{max-width:1200px;margin:0 auto 10px;padding:0 40px;}
        .diff-inner{background:rgba(0,212,255,.04);border:1px solid rgba(0,212,255,.1);border-radius:16px;padding:18px 24px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
        .diff-icon{font-size:28px;flex-shrink:0;}
        .diff-text{font-size:13.5px;color:var(--sub);line-height:1.65;flex:1;}
        .diff-text strong{color:var(--text);}
        .diff-tags{display:flex;gap:7px;flex-wrap:wrap;flex-shrink:0;}
        .diff-tag{padding:4px 12px;border-radius:100px;font-size:11px;font-weight:700;background:rgba(0,212,255,.08);color:var(--cyan);border:1px solid rgba(0,212,255,.18);}

        /* CONTROLS */
        .controls{max-width:1200px;margin:0 auto;padding:0 40px 24px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;}
        .search-wrap{position:relative;flex:1;min-width:240px;}
        .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--sub);pointer-events:none;}
        .search-inp{width:100%;padding:11px 14px 11px 38px;background:var(--panel);border:1px solid var(--line);border-radius:11px;color:var(--text);font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all .2s;}
        .search-inp:focus{border-color:rgba(0,212,255,.3);box-shadow:0 0 0 3px rgba(0,212,255,.05);}
        .search-inp::placeholder{color:var(--sub);}
        .sort-sel{padding:10px 14px;background:var(--panel);border:1px solid var(--line);border-radius:11px;color:var(--text);font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;cursor:pointer;}
        .view-toggle{display:flex;background:var(--panel);border:1px solid var(--line);border-radius:11px;overflow:hidden;}
        .vt-btn{padding:10px 14px;background:transparent;border:none;color:var(--sub);cursor:pointer;transition:all .2s;font-size:16px;}
        .vt-btn.on{background:rgba(0,212,255,.1);color:var(--cyan);}

        /* SPEC FILTERS */
        .filters{max-width:1200px;margin:0 auto;padding:0 40px 28px;display:flex;gap:7px;flex-wrap:wrap;}
        .ftab{display:flex;align-items:center;gap:5px;padding:8px 16px;border-radius:100px;font-size:12.5px;font-weight:700;cursor:pointer;background:var(--panel);border:1px solid var(--line);color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .ftab:hover{color:var(--text);}
        .ftab.on{background:rgba(0,212,255,.09);color:var(--cyan);border-color:rgba(0,212,255,.25);}

        /* GRID */
        .grid{max-width:1200px;margin:0 auto;padding:0 40px 60px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;animation:fadein .4s ease;}
        .grid.list{grid-template-columns:1fr;}
        .skel{background:linear-gradient(90deg,var(--panel) 25%,var(--panel2) 50%,var(--panel) 75%);background-size:200% 100%;animation:shimmer 1.4s ease infinite;border-radius:8px;}
        .skel-card{background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden;}
        .skel-banner{height:90px;}
        .skel-body{padding:36px 24px 24px;display:flex;flex-direction:column;gap:10px;}

        /* CARD */
        .dcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden;transition:all .25s;cursor:pointer;position:relative;}
        .dcard:hover{border-color:rgba(0,212,255,.15);transform:translateY(-4px);box-shadow:0 24px 60px rgba(0,0,0,.4);}
        .dcard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);opacity:0;transition:opacity .25s;}
        .dcard:hover::before{opacity:1;}
        .dcard-banner{height:90px;position:relative;}
        .dcard-av-wrap{position:absolute;bottom:-26px;left:24px;}
        .dcard-av{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#000;border:3px solid var(--panel);font-family:'Plus Jakarta Sans',sans-serif;}
        .avail-dot{position:absolute;bottom:2px;right:2px;width:12px;height:12px;border-radius:50%;background:var(--lime);border:2px solid var(--panel);animation:pulse 2s infinite;}
        .cred-badge{position:absolute;top:10px;right:10px;padding:4px 10px;border-radius:100px;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);font-size:10px;font-weight:800;color:#fff;border:1px solid rgba(255,255,255,.12);letter-spacing:1px;}
        .rbd-badge{position:absolute;top:10px;left:10px;padding:4px 10px;border-radius:100px;background:var(--cyan);color:#000;font-size:9px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;}
        .dcard-body{padding:36px 24px 24px;}
        .dcard-name{font-size:17px;font-weight:800;letter-spacing:-.5px;margin-bottom:3px;}
        .dcard-spec{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--cyan);margin-bottom:12px;}
        .dcard-bio{font-size:12.5px;color:var(--sub);line-height:1.7;font-weight:300;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .dcard-tags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:14px;}
        .dtag{padding:3px 10px;border-radius:100px;font-size:10.5px;font-weight:600;background:rgba(0,212,255,.05);color:var(--cyan);border:1px solid rgba(0,212,255,.1);}
        .dcard-meta{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px;}
        .dm{font-size:12px;color:var(--sub);display:flex;align-items:center;gap:4px;}
        .dm strong{color:var(--text);font-weight:600;}
        .dcard-footer{display:flex;gap:8px;}
        .btn-chat{flex:1;padding:10px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:10px;color:var(--sub);font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .btn-chat:hover{color:var(--text);}
        .btn-book-card{flex:2;padding:10px;background:var(--cyan);color:#000;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .btn-book-card:hover{background:#19e0ff;box-shadow:0 0 18px rgba(0,212,255,.3);}

        /* EMPTY */
        .empty{max-width:1200px;margin:0 auto;padding:60px 40px;text-align:center;}
        .empty-icon{font-size:48px;margin-bottom:14px;}
        .empty-title{font-size:20px;font-weight:800;margin-bottom:8px;}
        .empty-sub{font-size:14px;color:var(--sub);}
        .empty-hint{font-size:13px;color:var(--sub);margin-top:12px;padding:12px 16px;background:rgba(0,212,255,.04);border:1px solid rgba(0,212,255,.1);border-radius:10px;display:inline-block;}

        /* MODAL */
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(14px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
        .modal{background:var(--panel);border:1px solid rgba(0,212,255,.1);border-radius:24px;padding:36px;width:100%;max-width:480px;position:relative;max-height:90vh;overflow-y:auto;}
        .modal::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,212,255,.5),transparent);}
        .modal-x{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--sub);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
        .modal-x:hover{color:var(--text);}
        .modal-title{font-size:22px;font-weight:800;letter-spacing:-.8px;margin-bottom:4px;}
        .modal-sub{font-size:13.5px;color:var(--sub);margin-bottom:26px;font-weight:300;}
        .field{margin-bottom:15px;}
        .field label{display:block;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--sub);margin-bottom:7px;}
        .field input,.field select,.field textarea{width:100%;padding:12px 15px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all .2s;}
        .field input:focus,.field select:focus,.field textarea:focus{border-color:rgba(0,212,255,.3);}
        .field textarea{resize:vertical;min-height:90px;}
        .btn-submit{width:100%;padding:14px;background:var(--cyan);color:#000;font-size:14px;font-weight:800;border-radius:12px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;margin-top:6px;}
        .btn-submit:hover:not(:disabled){background:#19e0ff;box-shadow:0 0 22px rgba(0,212,255,.3);}
        .btn-submit:disabled{opacity:.5;cursor:not-allowed;}
        .success-box{text-align:center;padding:24px 0;}
        .success-icon{font-size:52px;margin-bottom:14px;}
        .success-title{font-size:22px;font-weight:800;letter-spacing:-.8px;margin-bottom:8px;}
        .success-sub{font-size:13px;color:var(--sub);}
        .toast{position:fixed;bottom:24px;right:24px;z-index:2000;padding:12px 18px;border-radius:11px;font-size:12.5px;font-weight:700;background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.25);color:var(--cyan);animation:toastIn .3s ease;}

        @media(max-width:1100px){.grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:720px){.grid{grid-template-columns:1fr}.controls,.filters,.hero,.diff-banner{padding-left:20px;padding-right:20px}.nav{padding:0 20px}}
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      {/* NAV */}
      <nav className="nav">
        <a className="logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
        <div className="nav-links">
          <a className="nav-a" href="/trainers">Trainers</a>
          <a className="nav-a" href="/nutritionists">Nutritionists</a>
          <a className="nav-a on" href="/dietitians">Dietitians</a>
          <a className="nav-a" href="/meals">Meal Plans</a>
        </div>
        {user
          ? <a className="nav-dash" href="/dashboard">⚡ Dashboard</a>
          : <a className="nav-dash" href="/login">Log in</a>}
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-badge">🩺 Registered Clinical Dietitians</div>
        <h1 className="hero-title">Find a <em>dietitian</em><br />who gets results</h1>
        <p className="hero-sub">Registered Dietitians (RDs) are clinical health professionals licensed to treat medical nutrition conditions. Book a consultation today.</p>
        <div className="hero-stats">
          {[
            { val: dietitians.length > 0 ? `${dietitians.length}+` : '30+', lbl:'Registered Dietitians' },
            { val:'4.9★', lbl:'Average Rating' },
            { val:'Medical', lbl:'Condition Specialists' },
            { val:'< 48h', lbl:'Appointment Available' },
          ].map(s => (
            <div key={s.lbl}><div className="hstat-val">{s.val}</div><div className="hstat-lbl">{s.lbl}</div></div>
          ))}
        </div>
      </div>

      {/* WHAT'S THE DIFFERENCE BANNER */}
      <div className="diff-banner">
        <div className="diff-inner">
          <div className="diff-icon">💡</div>
          <div className="diff-text">
            <strong>Dietitian vs Nutritionist?</strong> Registered Dietitians (RDs) are licensed medical professionals who treat clinical conditions — diabetes, kidney disease, cancer, eating disorders. Nutritionists focus on general wellness and healthy eating goals.
          </div>
          <div className="diff-tags">
            <span className="diff-tag">🩺 Licensed</span>
            <span className="diff-tag">💊 Medical Conditions</span>
            <span className="diff-tag">🏥 Hospital-Grade</span>
            <span className="diff-tag">📋 Lab-Result Based</span>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="controls">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-inp" placeholder="Search by name, condition, or specialty…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="sort-sel" value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="rating">Top Rated</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="exp">Most Experienced</option>
        </select>
        <div className="view-toggle">
          <button className={`vt-btn ${view==='grid'?'on':''}`} onClick={()=>setView('grid')}>⊞</button>
          <button className={`vt-btn ${view==='list'?'on':''}`} onClick={()=>setView('list')}>☰</button>
        </div>
      </div>

      {/* SPECIALTY FILTERS */}
      <div className="filters">
        {SPECS.map(s => (
          <button key={s.id} className={`ftab ${spec===s.id?'on':''}`} onClick={()=>setSpec(s.id)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* DIETITIANS GRID */}
      {loading ? (
        <div className={`grid ${view==='list'?'list':''}`}>
          {[1,2,3,4,5,6].map(i => (
            <div className="skel-card" key={i}>
              <div className="skel skel-banner"/>
              <div className="skel-body">
                <div className="skel" style={{height:14,width:'60%'}}/>
                <div className="skel" style={{height:11,width:'40%'}}/>
                <div className="skel" style={{height:11}}/>
                <div className="skel" style={{height:38,marginTop:6}}/>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🩺</div>
          <div className="empty-title">No dietitians found</div>
          <div className="empty-sub">
            {dietitians.length === 0
              ? 'No dietitians in the database yet.'
              : 'Try adjusting your search or filters.'}
          </div>
          {dietitians.length === 0 && (
            <div className="empty-hint">
              💡 Add dietitians via the Admin Panel → Dietitians tab, or seed via <code>POST /api/dietitians</code>
            </div>
          )}
        </div>
      ) : (
        <div className={`grid ${view==='list'?'list':''}`}>
          {filtered.map((d, i) => {
            const g       = grad(d._id, i);
            const price   = d.sessionFee || d.price || 0;
            const exp     = d.experience || 0;
            const rating  = d.rating || 4.8;
            const isAvail = d.available !== false;
            const isRD    = d.isRegistered !== false;

            return (
              <div key={d._id||i} className={`dcard ${view==='list'?'list-card':''}`}
                onClick={()=>router.push(`/dietitians/${d._id}`)}>
                {isRD && <div className="rbd-badge">✓ Registered</div>}
                <div className="dcard-banner" style={{ background: d.avatar ? `url(${d.avatar}) center/cover` : g }}>
                  <div className="dcard-av-wrap">
                    <div className="dcard-av" style={{ background:g }}>
                      {d.avatar ? <img src={d.avatar} alt="" style={{width:'100%',height:'100%',borderRadius:11,objectFit:'cover'}}/> : initials(d.name)}
                    </div>
                    {isAvail && <div className="avail-dot"/>}
                  </div>
                  {d.credential && <div className="cred-badge">{d.credential}</div>}
                </div>
                <div className="dcard-body">
                  <div className="dcard-name">{d.name}</div>
                  <div className="dcard-spec">{d.specialty || d.expertise}</div>
                  <p className="dcard-bio">{d.bio}</p>
                  <div className="dcard-tags">
                    {(d.tags||d.conditions||[]).slice(0,3).map((t:string) => (
                      <span className="dtag" key={t}>{t}</span>
                    ))}
                  </div>
                  <div className="dcard-meta">
                    <div className="dm">★ <strong>{rating.toFixed(1)}</strong></div>
                    {exp>0 && <div className="dm">⚡ <strong>{exp}+ yrs</strong></div>}
                    {price>0 && <div className="dm">💰 <strong>${price}/hr</strong></div>}
                    {d.location?.city && <div className="dm">📍 <strong>{d.location.city}</strong></div>}
                    <div className="dm" style={{color:isAvail?'var(--lime)':'var(--sub)'}}>● {isAvail?'Available':'Busy'}</div>
                  </div>
                  <div className="dcard-footer" onClick={e=>e.stopPropagation()}>
                    <button className="btn-chat" onClick={()=>router.push(`/chat`)}>💬</button>
                    <button className="btn-book-card" onClick={()=>setBookItem(d)}>📅 Book Session</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOOKING MODAL */}
      {bookItem && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget){setBookItem(null);setBookOk(false);}}}>
          <div className="modal">
            <button className="modal-x" onClick={()=>{setBookItem(null);setBookOk(false);}}>✕</button>
            {bookOk ? (
              <div className="success-box">
                <div className="success-icon">🎉</div>
                <div className="success-title">Booking Confirmed!</div>
                <div className="success-sub">Your session with {bookItem.name} is confirmed. Check your email!</div>
              </div>
            ) : (
              <>
                <div className="modal-title">Book a Session</div>
                <div className="modal-sub">{bookItem.name} · {bookItem.specialty}</div>
                <div className="field"><label>Date</label><input type="date" min={new Date().toISOString().split('T')[0]} value={booking.date} onChange={e=>setBooking(b=>({...b,date:e.target.value}))}/></div>
                <div className="field"><label>Time Slot</label>
                  <select value={booking.time} onChange={e=>setBooking(b=>({...b,time:e.target.value}))}>
                    <option value="">Select time</option>
                    {['09:00 AM','10:00 AM','11:00 AM','01:00 PM','03:00 PM','05:00 PM','07:00 PM'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field"><label>Session Type</label>
                  <select value={booking.type} onChange={e=>setBooking(b=>({...b,type:e.target.value}))}>
                    <option>Video Consultation</option><option>In-Person Visit</option><option>Phone Call</option>
                  </select>
                </div>
                <div className="field"><label>Medical Condition / Notes</label>
                  <textarea placeholder="Describe your medical condition, current medications, health goals…" value={booking.notes} onChange={e=>setBooking(b=>({...b,notes:e.target.value}))}/>
                </div>
                <button className="btn-submit" onClick={submitBooking} disabled={bookLoading}>
                  {bookLoading ? '⏳ Confirming…' : '✓ Confirm Booking'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}