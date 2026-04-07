'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

const STATUS_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  confirmed:  { bg:'rgba(198,241,53,.08)',  color:'#c6f135', border:'rgba(198,241,53,.2)'  },
  pending:    { bg:'rgba(245,158,11,.08)',  color:'#f59e0b', border:'rgba(245,158,11,.2)'  },
  cancelled:  { bg:'rgba(244,63,94,.08)',   color:'#f43f5e', border:'rgba(244,63,94,.2)'   },
  completed:  { bg:'rgba(0,212,255,.08)',   color:'#00d4ff', border:'rgba(0,212,255,.2)'   },
  rescheduled:{ bg:'rgba(139,92,246,.08)', color:'#a78bfa', border:'rgba(139,92,246,.2)'  },
};

const TYPE_ICON: Record<string, string> = {
  trainer:      '🏋️',
  nutritionist: '🥗',
  dietitian:    '🩺',
  gym:          '📍',
  default:      '📅',
};

const fmt = (d: string) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-PK', {
      weekday:'short', day:'numeric', month:'short', year:'numeric'
    });
  } catch { return d; }
};

const fmtTime = (d: string) => {
  if (!d) return '';
  try { return new Date(d).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' }); } catch { return ''; }
};

export default function BookingsPage() {
  const router = useRouter();
  const [user,     setUser]     = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [cancelling, setCancelling] = useState<string|null>(null);
  const [toast,    setToast]    = useState({ msg:'', type:'success' });
  const toastRef = useRef<any>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast({ msg:'', type:'success' }), 3500);
  };

  const fetchBookings = async () => {
    try {
      // Try /mine first, fallback to /
      let data: any;
      try {
        const res = await API.get('/bookings/mine');
        data = res.data;
      } catch {
        const res = await API.get('/bookings');
        data = res.data;
      }
      const list = data?.data || data?.bookings || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.error('Bookings fetch error:', e?.response?.data || e.message);
      showToast('Could not load bookings', 'error');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/profile');
        setUser(data?.data || data);
      } catch { router.push('/login'); return; }
      await fetchBookings();
      setLoading(false);
    })();
  }, []);

  const cancelBooking = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await API.patch(`/bookings/${id}/cancel`);
      showToast('✓ Booking cancelled');
      await fetchBookings();
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Cancel failed', 'error');
    }
    setCancelling(null);
  };

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const counts = {
    all:       bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    pending:   bookings.filter(b => b.status === 'pending').length,
  };

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#03050a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:44,height:44,border:'2px solid rgba(0,212,255,0.15)',borderTop:'2px solid #00d4ff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;--lime:#c6f135;--cyan:#00d4ff;--violet:#8b5cf6;--rose:#f43f5e;--amber:#f59e0b;--text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);}
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        @keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}

        .nav{position:sticky;top:0;z-index:100;height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(3,5,10,.92);backdrop-filter:blur(24px);border-bottom:1px solid var(--line);}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .logo-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-.5px;}.logo-text em{font-style:normal;color:var(--lime);}
        .nav-right{display:flex;gap:10px;align-items:center;}
        .nav-a{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:600;color:var(--sub);text-decoration:none;transition:all .2s;}
        .nav-a:hover{color:var(--text);}
        .nav-dash{padding:8px 18px;border-radius:9px;background:var(--lime);color:#000;font-size:13px;font-weight:700;text-decoration:none;}

        .page{max-width:1000px;margin:0 auto;padding:40px 40px 80px;animation:fadein .4s ease;}

        .ph{margin-bottom:32px;}
        .ph-title{font-size:clamp(28px,4vw,40px);font-weight:900;letter-spacing:-1.5px;margin-bottom:8px;}
        .ph-title em{font-style:normal;color:var(--cyan);}
        .ph-sub{font-size:14px;color:var(--sub);font-weight:300;}

        /* STATS ROW */
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;}
        .stat-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px;text-align:center;}
        .stat-val{font-size:28px;font-weight:900;letter-spacing:-1px;margin-bottom:4px;}
        .stat-lbl{font-size:11px;color:var(--sub);font-weight:600;letter-spacing:.5px;text-transform:uppercase;}

        /* FILTERS */
        .filters{display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap;}
        .ftab{padding:8px 18px;border-radius:100px;font-size:12.5px;font-weight:700;cursor:pointer;background:var(--panel);border:1px solid var(--line);color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;display:flex;align-items:center;gap:6px;}
        .ftab:hover{color:var(--text);}
        .ftab.on{background:rgba(0,212,255,.09);color:var(--cyan);border-color:rgba(0,212,255,.25);}
        .ftab-count{font-size:10px;background:rgba(255,255,255,.07);padding:1px 6px;border-radius:100px;}

        /* BOOKING CARD */
        .bcard{background:var(--panel);border:1px solid var(--line);border-radius:18px;overflow:hidden;margin-bottom:12px;transition:all .25s;animation:fadein .3s ease;}
        .bcard:hover{border-color:rgba(255,255,255,.07);box-shadow:0 8px 32px rgba(0,0,0,.3);}
        .bcard-top{padding:20px 22px;display:flex;align-items:flex-start;gap:16px;}
        .bcard-icon{width:48px;height:48px;border-radius:13px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
        .bcard-info{flex:1;}
        .bcard-name{font-size:17px;font-weight:800;letter-spacing:-.4px;margin-bottom:4px;}
        .bcard-spec{font-size:12px;color:var(--sub);margin-bottom:10px;}
        .bcard-meta{display:flex;gap:12px;flex-wrap:wrap;}
        .bm{display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--sub);}
        .bm strong{color:var(--text);font-weight:600;}
        .bcard-right{display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex-shrink:0;}
        .status-badge{padding:4px 12px;border-radius:100px;font-size:11px;font-weight:700;border:1px solid;letter-spacing:.5px;text-transform:uppercase;}
        .price-tag{font-size:18px;font-weight:900;letter-spacing:-.5px;color:var(--lime);}
        .price-sub{font-size:10px;color:var(--sub);}

        /* BOOKING FOOTER */
        .bcard-footer{padding:12px 22px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(255,255,255,.01);}
        .bcard-notes{font-size:12px;color:var(--sub);font-style:italic;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .bcard-actions{display:flex;gap:8px;flex-shrink:0;}
        .btn-cancel{padding:7px 16px;border-radius:8px;background:rgba(244,63,94,.07);border:1px solid rgba(244,63,94,.2);color:#fb7185;font-size:12px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .btn-cancel:hover{background:rgba(244,63,94,.14);}
        .btn-cancel:disabled{opacity:.5;cursor:not-allowed;}
        .btn-rebook{padding:7px 16px;border-radius:8px;background:rgba(0,212,255,.07);border:1px solid rgba(0,212,255,.2);color:var(--cyan);font-size:12px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;text-decoration:none;display:inline-flex;align-items:center;}
        .btn-rebook:hover{background:rgba(0,212,255,.14);}

        /* EMPTY */
        .empty{text-align:center;padding:60px 20px;background:var(--panel);border:1px solid var(--line);border-radius:20px;}
        .empty-icon{font-size:52px;margin-bottom:16px;}
        .empty-title{font-size:20px;font-weight:800;margin-bottom:8px;}
        .empty-sub{font-size:14px;color:var(--sub);margin-bottom:24px;line-height:1.65;}
        .empty-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
        .empty-btn{padding:11px 22px;border-radius:11px;font-size:13.5px;font-weight:700;text-decoration:none;transition:all .2s;}
        .eb-cyan{background:rgba(0,212,255,.09);border:1px solid rgba(0,212,255,.2);color:var(--cyan);}
        .eb-lime{background:var(--lime);color:#000;border:1px solid var(--lime);}

        /* TOAST */
        .toast{position:fixed;bottom:24px;right:24px;z-index:2000;padding:13px 20px;border-radius:12px;font-size:13px;font-weight:700;animation:toastIn .3s ease;}
        .toast-success{background:rgba(198,241,53,.12);border:1px solid rgba(198,241,53,.3);color:var(--lime);}
        .toast-error{background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.3);color:#fb7185;}

        @media(max-width:700px){.page{padding:20px 16px 60px}.stats-row{grid-template-columns:repeat(2,1fr)}.bcard-top{flex-wrap:wrap}.bcard-right{align-items:flex-start}.nav{padding:0 16px}}
      `}</style>

      {toast.msg && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* NAV */}
      <nav className="nav">
        <a className="logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
        <div className="nav-right">
          <a className="nav-a" href="/trainers">Book Trainer</a>
          <a className="nav-a" href="/nutritionists">Book Nutritionist</a>
          <a className="nav-dash" href="/dashboard">⚡ Dashboard</a>
        </div>
      </nav>

      <div className="page">
        {/* HEADER */}
        <div className="ph">
          <h1 className="ph-title">My <em>Bookings</em></h1>
          <p className="ph-sub">All your trainer, nutritionist and dietitian sessions in one place.</p>
        </div>

        {/* STATS */}
        <div className="stats-row">
          {[
            { val: counts.all,       lbl:'Total',     color:'var(--cyan)' },
            { val: counts.confirmed, lbl:'Confirmed', color:'var(--lime)' },
            { val: counts.completed, lbl:'Completed', color:'var(--cyan)' },
            { val: counts.cancelled, lbl:'Cancelled', color:'var(--rose)' },
          ].map(s => (
            <div className="stat-card" key={s.lbl}>
              <div className="stat-val" style={{color:s.color}}>{s.val}</div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="filters">
          {[
            { id:'all',       label:'All' },
            { id:'confirmed', label:'Confirmed' },
            { id:'completed', label:'Completed' },
            { id:'pending',   label:'Pending' },
            { id:'cancelled', label:'Cancelled' },
          ].map(f => (
            <button key={f.id} className={`ftab ${filter===f.id?'on':''}`} onClick={()=>setFilter(f.id)}>
              {f.label}
              <span className="ftab-count">{counts[f.id as keyof typeof counts] ?? bookings.filter(b=>b.status===f.id).length}</span>
            </button>
          ))}
        </div>

        {/* BOOKINGS LIST */}
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📅</div>
            <div className="empty-title">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </div>
            <div className="empty-sub">
              {filter === 'all'
                ? 'Book a session with a trainer, nutritionist, or dietitian to get started.'
                : `You have no ${filter} bookings right now.`}
            </div>
            <div className="empty-actions">
              <a className="empty-btn eb-cyan" href="/trainers">🏋️ Find Trainers</a>
              <a className="empty-btn eb-cyan" href="/nutritionists">🥗 Nutritionists</a>
              <a className="empty-btn eb-lime" href="/dietitians">🩺 Dietitians</a>
            </div>
          </div>
        ) : (
          filtered.map((b: any) => {
            const sc = STATUS_COLOR[b.status] || STATUS_COLOR.pending;
            const expert = b.trainer || b.nutritionist || b.dietitian;
            const expertName = expert?.name || b.package || b.sessionType || 'Session';
            const expertSpec = expert?.specialty || b.type || '';
            const typeIcon   = TYPE_ICON[b.type] || TYPE_ICON.default;
            const isActive   = b.status === 'confirmed' || b.status === 'pending';

            return (
              <div className="bcard" key={b._id}>
                <div className="bcard-top">
                  <div className="bcard-icon">{typeIcon}</div>
                  <div className="bcard-info">
                    <div className="bcard-name">{expertName}</div>
                    <div className="bcard-spec">{expertSpec} {b.sessionType && `· ${b.sessionType}`}</div>
                    <div className="bcard-meta">
                      <div className="bm">📅 <strong>{fmt(b.date)}</strong></div>
                      {b.date && <div className="bm">⏰ <strong>{fmtTime(b.date)}</strong></div>}
                      {b.timeSlot && <div className="bm">⏰ <strong>{b.timeSlot}</strong></div>}
                      {b.package && <div className="bm">📦 <strong>{b.package}</strong></div>}
                    </div>
                  </div>
                  <div className="bcard-right">
                    <div className="status-badge" style={{background:sc.bg,color:sc.color,borderColor:sc.border}}>
                      {b.status}
                    </div>
                    {b.price > 0 && (
                      <div>
                        <div className="price-tag">PKR {b.price?.toLocaleString()}</div>
                        <div className="price-sub">session fee</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bcard-footer">
                  <div className="bcard-notes">
                    {b.notes ? `📝 ${b.notes}` : 'No additional notes'}
                  </div>
                  <div className="bcard-actions">
                    {isActive && (
                      <button
                        className="btn-cancel"
                        disabled={cancelling === b._id}
                        onClick={() => cancelBooking(b._id)}
                      >
                        {cancelling === b._id ? '⏳' : '✕ Cancel'}
                      </button>
                    )}
                    {b.status === 'cancelled' && (
                      <a className="btn-rebook" href={b.type === 'trainer' ? '/trainers' : b.type === 'nutritionist' ? '/nutritionists' : '/dietitians'}>
                        🔄 Rebook
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}