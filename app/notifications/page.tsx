'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

const TYPE_META: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
  booking:     { icon:'📅', color:'#c6f135', bg:'rgba(198,241,53,0.08)',  border:'rgba(198,241,53,0.2)',  label:'Booking'     },
  workout:     { icon:'🏋️', color:'#00d4ff', bg:'rgba(0,212,255,0.08)',  border:'rgba(0,212,255,0.2)',   label:'Workout'     },
  nutrition:   { icon:'🥗', color:'#34d399', bg:'rgba(52,211,153,0.08)', border:'rgba(52,211,153,0.2)',  label:'Nutrition'   },
  progress:    { icon:'📊', color:'#a78bfa', bg:'rgba(167,139,250,0.08)',border:'rgba(167,139,250,0.2)', label:'Progress'    },
  message:     { icon:'💬', color:'#fbbf24', bg:'rgba(251,191,36,0.08)', border:'rgba(251,191,36,0.2)',  label:'Message'     },
  reminder:    { icon:'⏰', color:'#fb923c', bg:'rgba(251,146,60,0.08)', border:'rgba(251,146,60,0.2)',  label:'Reminder'    },
  achievement: { icon:'🏆', color:'#f472b6', bg:'rgba(244,114,182,0.08)',border:'rgba(244,114,182,0.2)', label:'Achievement' },
  system:      { icon:'⚙️', color:'#4d6b8a', bg:'rgba(77,107,138,0.08)', border:'rgba(77,107,138,0.25)', label:'System'      },
};

const fmtDate = (d: string) => {
  if (!d) return '';
  const date = new Date(d);
  const now  = new Date();
  const today = new Date(); today.setHours(0,0,0,0);
  const yest  = new Date(today); yest.setDate(yest.getDate()-1);
  if (date >= today) return 'Today';
  if (date >= yest)  return 'Yesterday';
  return date.toLocaleDateString('en-PK', { weekday:'long', day:'numeric', month:'long' });
};

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });

function groupByDate(notifs: any[]) {
  const groups: { label: string; items: any[] }[] = [];
  notifs.forEach(n => {
    const label = fmtDate(n.createdAt || n.time);
    const last  = groups[groups.length-1];
    if (!last || last.label !== label) groups.push({ label, items: [n] });
    else last.items.push(n);
  });
  return groups;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifs,  setNotifs]  = useState<any[]>([]);
  const [nLoading,setNLoading]= useState(true);
  const [filter,  setFilter]  = useState('All');
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLMore] = useState(false);
  const [unreadCount, setUnread]= useState(0);
  const [toast,   setToast]   = useState('');
  const toastRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/profile');
        setUser(data?.data || data);
        await loadNotifs(1, 'All');
      } catch { router.push('/login'); }
      finally  { setLoading(false); }
    })();
  }, []);

  const loadNotifs = useCallback(async (pg: number, f: string) => {
    if (pg === 1) setNLoading(true);
    try {
      const typeQ = f !== 'All' ? `&type=${f.toLowerCase()}` : '';
      const { data } = await API.get(`/notifications?limit=20&page=${pg}${typeQ}`);
      const items = data?.data || [];
      if (pg === 1) setNotifs(items);
      else setNotifs(prev => [...prev, ...items]);
      setUnread(data?.unreadCount || 0);
      setHasMore(pg < (data?.pagination?.pages || 1));
      setPage(pg);
    } finally { setNLoading(false); }
  }, []);

  const changeFilter = (f: string) => {
    setFilter(f);
    loadNotifs(1, f);
  };

  const markRead = async (id: string) => {
    try { await API.put(`/notifications/${id}/read`); } catch {}
    setNotifs(p => p.map(n => n._id === id ? { ...n, read: true } : n));
    setUnread(p => Math.max(0, p-1));
  };

  const markAllRead = async () => {
    try { await API.put('/notifications/mark-all-read'); } catch {}
    setNotifs(p => p.map(n => ({ ...n, read: true })));
    setUnread(0);
    showToast('All notifications marked as read');
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await API.delete(`/notifications/${id}`); } catch {}
    setNotifs(p => p.filter(n => n._id !== id));
  };

  const clearAll = async () => {
    try { await API.delete('/notifications/clear-all'); } catch {}
    setNotifs([]);
    setUnread(0);
    showToast('All notifications cleared');
  };

  const loadMore = async () => {
    setLMore(true);
    await loadNotifs(page+1, filter);
    setLMore(false);
  };

  const handleClick = (n: any) => {
    if (!n.read) markRead(n._id);
    if (n.action?.href) router.push(n.action.href);
  };

  const ALL_TYPES = ['All', ...Object.values(TYPE_META).map(t => t.label)];
  const typeCounts: Record<string, number> = { All: notifs.length };
  notifs.forEach(n => {
    const lbl = TYPE_META[n.type]?.label;
    if (lbl) typeCounts[lbl] = (typeCounts[lbl] || 0) + 1;
  });
  const groups = groupByDate(notifs);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#03050a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:44, height:44, border:'2px solid rgba(198,241,53,0.15)', borderTop:'2px solid #c6f135', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;--lime:#c6f135;--cyan:#00d4ff;--rose:#f43f5e;--text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);}
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;}
        @keyframes spin{to{transform:rotate(360deg)}} @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}

        .layout{display:flex;min-height:100vh;}
        .sidebar{width:258px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:26px 16px;position:fixed;top:0;left:0;bottom:0;overflow-y:auto;z-index:100;}
        .sidebar::-webkit-scrollbar{width:3px;} .sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.05);}
        .logo{display:flex;align-items:center;gap:9px;text-decoration:none;margin-bottom:30px;}
        .logo-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-.5px;} .logo-text em{font-style:normal;color:var(--lime);}
        .nav-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--sub);padding:0 8px;margin:14px 0 5px;opacity:.7;}
        .nav-a{display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:10px;font-size:13px;font-weight:500;color:var(--sub);transition:all .18s;margin-bottom:1px;border:1px solid transparent;text-decoration:none;}
        .nav-a:hover{color:var(--text);background:rgba(255,255,255,.04);}
        .nav-a.on{color:var(--lime);background:rgba(198,241,53,.08);border-color:rgba(198,241,53,.12);font-weight:700;}
        .nbadge{margin-left:auto;min-width:17px;height:17px;padding:0 4px;border-radius:100px;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;background:rgba(244,63,94,.15);color:#fb7185;}
        .sb-bottom{margin-top:auto;padding-top:14px;}
        .ucard{display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--line);margin-bottom:9px;}
        .uav{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,rgba(198,241,53,.3),rgba(0,212,255,.2));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--lime);flex-shrink:0;}
        .logout-btn{width:100%;padding:9px;background:rgba(244,63,94,.05);border:1px solid rgba(244,63,94,.12);border-radius:9px;color:#fb7185;font-size:12px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .logout-btn:hover{background:rgba(244,63,94,.12);}

        .main{margin-left:258px;flex:1;min-width:0;}
        .topbar{height:64px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 30px;background:rgba(3,5,10,.9);backdrop-filter:blur(20px);position:sticky;top:0;z-index:50;}
        .topbar-left{font-size:17px;font-weight:700;letter-spacing:-.5px;display:flex;align-items:center;gap:10px;}
        .topbar-right{display:flex;gap:8px;align-items:center;}
        .tbtn{padding:7px 14px;border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;border:1px solid;}
        .tbtn-lime{background:rgba(198,241,53,.08);color:var(--lime);border-color:rgba(198,241,53,.2);}
        .tbtn-lime:hover{background:rgba(198,241,53,.15);}
        .tbtn-ghost{background:rgba(255,255,255,.03);color:var(--sub);border-color:var(--line);text-decoration:none;}
        .tbtn-ghost:hover{color:var(--text);}

        .content{padding:28px 30px;animation:fadein .4s ease;}
        .skel{background:linear-gradient(90deg,var(--panel) 25%,var(--panel2) 50%,var(--panel) 75%);background-size:200% 100%;animation:shimmer 1.4s ease infinite;border-radius:6px;}

        /* STATS ROW */
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px;}
        .scard{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px 20px;position:relative;overflow:hidden;}
        .scard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
        .scard-val{font-size:24px;font-weight:900;letter-spacing:-1px;margin-bottom:3px;}
        .scard-lbl{font-size:11px;font-weight:600;color:var(--sub);}

        /* FILTER TABS */
        .filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;}
        .ftab{padding:6px 13px;border-radius:100px;font-size:11.5px;font-weight:700;cursor:pointer;background:var(--panel);border:1px solid var(--line);color:var(--sub);transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif;}
        .ftab:hover{color:var(--text);}
        .ftab.on{background:rgba(198,241,53,.09);color:var(--lime);border-color:rgba(198,241,53,.22);}

        /* DATE GROUP */
        .date-lbl{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--sub);margin:18px 0 8px;display:flex;align-items:center;gap:9px;}
        .date-lbl:first-child{margin-top:0;}
        .date-lbl::after{content:'';flex:1;height:1px;background:var(--line);}

        /* NOTIFICATION CARD */
        .ncard{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:7px;display:flex;align-items:flex-start;gap:12px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;animation:slideIn .25s ease;}
        .ncard:hover{border-color:rgba(255,255,255,.08);transform:translateX(2px);}
        .ncard.unread{background:rgba(198,241,53,.015);}
        .ncard-strip{position:absolute;left:0;top:0;bottom:0;width:3px;}
        .ncard-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
        .ncard-body{flex:1;min-width:0;}
        .ncard-title{font-size:13.5px;font-weight:800;letter-spacing:-.3px;margin-bottom:3px;display:flex;align-items:center;gap:7px;}
        .ncard-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
        .ncard-text{font-size:12.5px;color:var(--sub);line-height:1.6;margin-bottom:9px;font-weight:300;}
        .ncard-footer{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .ncard-time{font-size:10.5px;color:var(--sub);}
        .ncard-type{padding:3px 9px;border-radius:100px;font-size:9px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;}
        .ncard-action{padding:4px 12px;border-radius:7px;font-size:11px;font-weight:700;text-decoration:none;transition:all .2s;border:1px solid;}
        .ncard-del{position:absolute;top:10px;right:10px;width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;opacity:0;transition:all .2s;background:rgba(244,63,94,.06);border:1px solid rgba(244,63,94,.1);color:#fb7185;}
        .ncard:hover .ncard-del{opacity:1;}
        .ncard-del:hover{background:rgba(244,63,94,.14);}

        /* EMPTY */
        .empty{text-align:center;padding:60px 20px;background:var(--panel);border:1px solid var(--line);border-radius:18px;}
        .empty-icon{font-size:44px;margin-bottom:10px;}
        .empty-title{font-size:17px;font-weight:800;margin-bottom:5px;}
        .empty-sub{font-size:12.5px;color:var(--sub);}

        /* LOAD MORE */
        .load-more-btn{width:100%;padding:11px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:10px;color:var(--sub);font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;margin-top:8px;}
        .load-more-btn:hover{color:var(--text);}

        /* TOAST */
        .toast{position:fixed;bottom:24px;right:24px;z-index:2000;padding:12px 18px;border-radius:11px;font-size:12.5px;font-weight:700;background:rgba(198,241,53,.12);border:1px solid rgba(198,241,53,.3);color:var(--lime);animation:toastIn .3s ease;}

        @media(max-width:900px){.sidebar{display:none}.main{margin-left:0}.content{padding:18px}.stats-row{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a className="logo" href="/">
            <div className="logo-icon">U</div>
            <span className="logo-text"><em>Urban</em>Well</span>
          </a>
          <div className="nav-label">Dashboard</div>
          <a className="nav-a" href="/dashboard">⚡ Overview</a>
          <a className="nav-a" href="/progress">📊 Progress</a>
          <div className="nav-label">Track</div>
          <a className="nav-a" href="/workouts/generate">🏋️ Workouts</a>
          <a className="nav-a" href="/workouts/history">📋 Workout History</a>
          <a className="nav-a" href="/progress/log">📝 Log Progress</a>
          <div className="nav-label">Discover</div>
          <a className="nav-a" href="/bookings">📅 Bookings</a>
          <a className="nav-a" href="/trainers">👥 Trainers</a>
          <a className="nav-a" href="/nutritionists">🧬 Nutritionists</a>
          <a className="nav-a" href="/meals">🥗 Meal Plans</a>
          <a className="nav-a" href="/gym-packages">📍 Gym Packages</a>
          <a className="nav-a" href="/supplements">💊 Supplements</a>
          <a className="nav-a" href="/articles">📰 Articles</a>
          <div className="nav-label">Communication</div>
          <a className="nav-a" href="/chat">💬 Messages</a>
          <a className="nav-a on" href="/notifications">
            🔔 Notifications
            {unreadCount > 0 && <span className="nbadge">{unreadCount}</span>}
          </a>
          <div className="nav-label">Account</div>
          <a className="nav-a" href="/profile">👤 Profile</a>
          <div className="sb-bottom">
            <div className="ucard">
              <div className="uav">{user?.name?.[0]?.toUpperCase()||'U'}</div>
              <div>
                <div style={{ fontSize:12.5, fontWeight:700, marginBottom:1 }}>{user?.name}</div>
                <div style={{ fontSize:10, color:'var(--sub)', overflow:'hidden', textOverflow:'ellipsis', maxWidth:130, whiteSpace:'nowrap' }}>{user?.email}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}>Sign out</button>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-left">
              🔔 Notifications
              {unreadCount > 0 && (
                <span style={{ padding:'3px 9px', borderRadius:100, fontSize:11, fontWeight:800, background:'rgba(244,63,94,.1)', color:'#fb7185', border:'1px solid rgba(244,63,94,.2)' }}>
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="topbar-right">
              {unreadCount > 0 && <button className="tbtn tbtn-lime" onClick={markAllRead}>✓ Mark all read</button>}
              {notifs.length > 0 && <button className="tbtn tbtn-ghost" onClick={clearAll} style={{ cursor:'pointer' }}>🗑 Clear all</button>}
              <a className="tbtn tbtn-ghost" href="/dashboard">← Dashboard</a>
            </div>
          </div>

          <div className="content">
            {/* STATS */}
            <div className="stats-row">
              {[
                { val: notifs.length,                                          lbl:'Total',        color:'var(--cyan)', grad:'var(--cyan)' },
                { val: unreadCount,                                            lbl:'Unread',       color:'#fb7185',     grad:'var(--rose)' },
                { val: notifs.filter(n=>n.type==='achievement').length,        lbl:'Achievements', color:'#f472b6',     grad:'#f472b6'     },
                { val: notifs.filter(n=>['booking','message'].includes(n.type)).length, lbl:'Important', color:'var(--lime)', grad:'var(--lime)' },
              ].map(s => (
                <div key={s.lbl} className="scard">
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${s.grad},transparent)` }} />
                  <div className="scard-val" style={{ color:s.color }}>{s.val}</div>
                  <div className="scard-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* FILTER TABS */}
            <div className="filters">
              {ALL_TYPES.map(f => (
                <button key={f} className={`ftab ${filter===f?'on':''}`} onClick={() => changeFilter(f)}>
                  {f !== 'All' && <span style={{ marginRight:4 }}>{Object.values(TYPE_META).find(t=>t.label===f)?.icon}</span>}
                  {f}
                  <span style={{ marginLeft:5, fontSize:9.5, background:'rgba(255,255,255,.05)', padding:'1px 5px', borderRadius:100 }}>
                    {typeCounts[f] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* CONTENT */}
            {nLoading ? (
              [1,2,3,4].map(i => (
                <div key={i} style={{ display:'flex', gap:12, padding:'16px 18px', background:'var(--panel)', border:'1px solid var(--line)', borderRadius:14, marginBottom:7 }}>
                  <div className="skel" style={{ width:40, height:40, borderRadius:10, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div className="skel" style={{ height:13, marginBottom:8, width:'60%' }} />
                    <div className="skel" style={{ height:11, marginBottom:6 }} />
                    <div className="skel" style={{ height:10, width:'40%' }} />
                  </div>
                </div>
              ))
            ) : notifs.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🔔</div>
                <div className="empty-title">All caught up!</div>
                <div className="empty-sub">You have no notifications{filter !== 'All' ? ` for "${filter}"` : ''}.</div>
              </div>
            ) : (
              <>
                {groups.map(group => (
                  <div key={group.label}>
                    <div className="date-lbl">{group.label}</div>
                    {group.items.map(n => {
                      const t = TYPE_META[n.type] || TYPE_META.system;
                      return (
                        <div key={n._id} className={`ncard ${!n.read ? 'unread' : ''}`} onClick={() => handleClick(n)}>
                          <div className="ncard-strip" style={{ background: !n.read ? t.color : 'transparent' }} />
                          <div className="ncard-icon" style={{ background:t.bg, border:`1px solid ${t.border}` }}>{t.icon}</div>
                          <div className="ncard-body">
                            <div className="ncard-title">
                              {n.title}
                              {!n.read && <span className="ncard-dot" style={{ background:t.color }} />}
                            </div>
                            <div className="ncard-text">{n.body}</div>
                            <div className="ncard-footer">
                              <span className="ncard-time">{fmtTime(n.createdAt)}</span>
                              <span className="ncard-type" style={{ background:t.bg, color:t.color, border:`1px solid ${t.border}` }}>{t.label}</span>
                              {n.action?.href && (
                                <a href={n.action.href} className="ncard-action"
                                  style={{ background:t.bg, color:t.color, borderColor:t.border }}
                                  onClick={e => e.stopPropagation()}>
                                  {n.action.label || 'View'} →
                                </a>
                              )}
                            </div>
                          </div>
                          <button className="ncard-del" onClick={e => deleteNotif(n._id, e)}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {hasMore && (
                  <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Loading…' : 'Load more notifications'}
                  </button>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}