'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

/* ─── Backend note ────────────────────────────────────────
   Requires GET /api/leaderboard?type=streak|calories|workouts&period=week|month|alltime
   See leaderboardController.js delivered below.
   Falls back gracefully if endpoint doesn't exist yet.
──────────────────────────────────────────────────────── */

const TABS = [
  { key: 'streak',   icon: '🔥', label: 'Streak'   },
  { key: 'workouts', icon: '🏋️', label: 'Workouts' },
  { key: 'calories', icon: '⚡', label: 'Calories'  },
  { key: 'water',    icon: '💧', label: 'Hydration' },
];

const PERIODS = [
  { key: 'week',    label: 'This Week'  },
  { key: 'month',   label: 'This Month' },
  { key: 'alltime', label: 'All Time'   },
];

const RANK_COLORS = ['#fbbf24', '#94a3b8', '#b45309', '#4d6b8a'];
const RANK_ICONS  = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

const BADGES = [
  { id: 'streak7',    icon: '🔥', label: '7-Day Streak',   req: 'Log progress 7 days in a row',       color: '#fb923c' },
  { id: 'streak30',   icon: '💎', label: '30-Day Streak',  req: 'Log progress 30 days in a row',      color: '#60a5fa' },
  { id: 'workout10',  icon: '💪', label: '10 Workouts',    req: 'Complete 10 workout sessions',        color: '#c6f135' },
  { id: 'workout50',  icon: '🏆', label: '50 Workouts',    req: 'Complete 50 workout sessions',        color: '#fbbf24' },
  { id: 'hydration',  icon: '💧', label: 'Hydration King', req: 'Hit water goal 14 days in a row',     color: '#00d4ff' },
  { id: 'earlybird',  icon: '🌅', label: 'Early Bird',     req: 'Log before 7am 5 times',              color: '#f472b6' },
  { id: 'consistent', icon: '📊', label: 'Consistent',     req: 'Log every day for a month',           color: '#a78bfa' },
  { id: 'social',     icon: '🤝', label: 'Social',         req: 'Book 3 sessions with trainers',       color: '#34d399' },
];

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const avatarColors = ['#c6f135','#00d4ff','#a78bfa','#f472b6','#fb923c','#34d399','#fbbf24'];
function avatarColor(id = '') {
  return avatarColors[parseInt(id.slice(-3) || '0', 16) % avatarColors.length];
}

export default function LeaderboardPage() {
  const router = useRouter();

  const [user,         setUser]        = useState<any>(null);
  const [loading,      setLoading]     = useState(true);
  const [tab,          setTab]         = useState('streak');
  const [period,       setPeriod]      = useState('week');
  const [board,        setBoard]       = useState<any[]>([]);
  const [myStats,      setMyStats]     = useState<any>(null);
  const [myBadges,     setMyBadges]    = useState<string[]>([]);
  const [boardLoading, setBoardLoading]= useState(false);
  const [myRank,       setMyRank]      = useState<number | null>(null);

  /* ── Auth ── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/profile');
        setUser(data?.data || data);
        await fetchMyStats();
        await fetchBoard('streak', 'week');
      } catch { router.push('/login'); }
      finally  { setLoading(false); }
    })();
  }, []);

  const fetchBoard = useCallback(async (t: string, p: string) => {
    setBoardLoading(true);
    try {
      const { data } = await API.get(`/leaderboard?type=${t}&period=${p}`);
      const entries = data?.data || [];
      setBoard(entries);
      // Find current user's rank
      const rank = entries.findIndex((e: any) => e.userId === (user?._id || user?.id));
      setMyRank(rank >= 0 ? rank + 1 : null);
    } catch {
      // Endpoint not yet wired — show empty state gracefully
      setBoard([]);
    }
    setBoardLoading(false);
  }, [user]);

  const fetchMyStats = async () => {
    try {
      const [progRes, wkRes] = await Promise.allSettled([
        API.get('/progress?limit=90'),
        API.get('/workouts/history?limit=100'),
      ]);

      const progress = progRes.status === 'fulfilled' ? (progRes.value.data?.data || []) : [];
      const workouts = wkRes.status === 'fulfilled'   ? (wkRes.value.data?.data  || []) : [];

      // Calculate streak
      const dates = [...new Set(progress.map((p: any) => new Date(p.date).toDateString()))].sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime());
      const today = new Date(); today.setHours(0,0,0,0);
      let streak = 0;
      for (let i = 0; i < dates.length; i++) {
        const d = new Date(dates[i]); d.setHours(0,0,0,0);
        if (Math.round((today.getTime() - d.getTime()) / 86400000) <= i + 1) streak++;
        else break;
      }

      // Total calories (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      const weekCals = progress
        .filter((p: any) => new Date(p.date) >= weekAgo)
        .reduce((s: number, p: any) => s + (p.caloriesConsumed || p.calories || 0), 0);

      // Total water (last 7 days)
      const weekWater = progress
        .filter((p: any) => new Date(p.date) >= weekAgo)
        .reduce((s: number, p: any) => s + (p.water || p.waterIntake || 0), 0);

      const weekWorkouts = workouts.filter((w: any) => new Date(w.date) >= weekAgo).length;

      setMyStats({
        streak,
        totalWorkouts:  workouts.length,
        weekWorkouts,
        weekCals:       Math.round(weekCals / 7),
        weekWater:      Math.round(weekWater / 7),
        daysLogged:     progress.length,
      });

      // Award badges based on actual data
      const earned: string[] = [];
      if (streak >= 7)          earned.push('streak7');
      if (streak >= 30)         earned.push('streak30');
      if (workouts.length >= 10) earned.push('workout10');
      if (workouts.length >= 50) earned.push('workout50');
      setMyBadges(earned);

    } catch { /* silent */ }
  };

  const handleTabChange = (t: string) => {
    setTab(t);
    fetchBoard(t, period);
  };

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    fetchBoard(tab, p);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#03050a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, border: '2px solid rgba(198,241,53,0.15)', borderTop: '2px solid #c6f135', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;--lime:#c6f135;--cyan:#00d4ff;--text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);}
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes rowIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        .layout{display:flex;min-height:100vh;}
        .sidebar{width:258px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:26px 16px;position:fixed;top:0;left:0;bottom:0;overflow-y:auto;z-index:100;}
        .sidebar::-webkit-scrollbar{width:3px;}.sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.05);}
        .logo{display:flex;align-items:center;gap:9px;text-decoration:none;margin-bottom:28px;}
        .logo-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-.5px;}.logo-text em{font-style:normal;color:var(--lime);}
        .nav-lbl{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--sub);padding:0 8px;margin:14px 0 5px;opacity:.7;}
        .nav-a{display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:10px;font-size:13px;font-weight:500;color:var(--sub);transition:all .18s;margin-bottom:1px;border:1px solid transparent;text-decoration:none;}
        .nav-a:hover{color:var(--text);background:rgba(255,255,255,.04);}
        .nav-a.on{color:var(--lime);background:rgba(198,241,53,.08);border-color:rgba(198,241,53,.12);font-weight:700;}
        .sb-bot{margin-top:auto;padding-top:14px;}
        .ucard{display:flex;align-items:center;gap:10px;padding:12px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid var(--line);margin-bottom:9px;}
        .uav-sm{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,rgba(198,241,53,.3),rgba(0,212,255,.2));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--lime);flex-shrink:0;}
        .logout-btn{width:100%;padding:9px;background:rgba(244,63,94,.05);border:1px solid rgba(244,63,94,.12);border-radius:9px;color:#fb7185;font-size:12px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}

        .main{margin-left:258px;flex:1;min-width:0;}
        .topbar{height:64px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 30px;background:rgba(3,5,10,.9);backdrop-filter:blur(20px);position:sticky;top:0;z-index:50;}
        .topbar-title{font-size:17px;font-weight:700;letter-spacing:-.5px;}
        .back-btn{padding:7px 14px;background:var(--panel);border:1px solid var(--line);border-radius:9px;color:var(--sub);font-size:12px;font-weight:600;text-decoration:none;transition:all .2s;}
        .back-btn:hover{color:var(--text);}

        .content{padding:28px 30px;animation:fadein .4s ease;}
        .skel{background:linear-gradient(90deg,var(--panel) 25%,var(--panel2) 50%,var(--panel) 75%);background-size:200% 100%;animation:shimmer 1.4s ease infinite;border-radius:8px;}

        /* MY STATS */
        .my-stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:22px;}
        .ms-card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px 18px;position:relative;overflow:hidden;text-align:center;}
        .ms-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
        .ms-icon{font-size:22px;margin-bottom:8px;}
        .ms-val{font-size:26px;font-weight:900;letter-spacing:-1.2px;margin-bottom:3px;}
        .ms-lbl{font-size:11px;color:var(--sub);font-weight:600;}

        /* BADGES */
        .badges-section{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:22px;margin-bottom:22px;}
        .badges-head{font-size:15px;font-weight:800;letter-spacing:-.3px;margin-bottom:16px;}
        .badges-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
        .badge-card{padding:14px 12px;border-radius:13px;text-align:center;border:1px solid;transition:all .2s;}
        .badge-card.earned{transform:none;}
        .badge-card:not(.earned){opacity:.35;filter:grayscale(1);}
        .badge-icon{font-size:26px;margin-bottom:7px;}
        .badge-label{font-size:12px;font-weight:800;margin-bottom:4px;}
        .badge-req{font-size:10px;color:var(--sub);line-height:1.4;}
        .badge-earned-tag{display:inline-block;padding:2px 8px;border-radius:100px;font-size:9px;font-weight:800;background:rgba(198,241,53,.1);color:var(--lime);border:1px solid rgba(198,241,53,.2);margin-top:5px;}

        /* LEADERBOARD */
        .lb-section{background:var(--panel);border:1px solid var(--line);border-radius:18px;overflow:hidden;}
        .lb-head{padding:18px 22px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
        .lb-title{font-size:15px;font-weight:800;letter-spacing:-.3px;}
        .lb-controls{display:flex;gap:8px;flex-wrap:wrap;}

        /* TABS */
        .tab-row{display:flex;background:rgba(255,255,255,.03);border-radius:10px;padding:3px;gap:2px;}
        .tab-btn{padding:6px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;background:transparent;border:none;color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;display:flex;align-items:center;gap:5px;}
        .tab-btn:hover{color:var(--text);}
        .tab-btn.on{background:rgba(198,241,53,.1);color:var(--lime);}

        .period-row{display:flex;gap:6px;}
        .period-btn{padding:6px 12px;border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer;background:var(--panel2);border:1px solid var(--line);color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .period-btn:hover{color:var(--text);}
        .period-btn.on{background:rgba(0,212,255,.08);color:var(--cyan);border-color:rgba(0,212,255,.2);}

        /* BOARD ROWS */
        .board-list{padding:10px 0;}
        .board-row{display:flex;align-items:center;gap:14px;padding:13px 22px;border-bottom:1px solid var(--line);transition:all .2s;animation:rowIn .3s ease;position:relative;}
        .board-row:last-child{border-bottom:none;}
        .board-row:hover{background:rgba(255,255,255,.02);}
        .board-row.me{background:rgba(198,241,53,.03);}
        .board-row.me::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--lime);}
        .board-rank{width:36px;text-align:center;font-size:18px;flex-shrink:0;}
        .board-rank-num{font-size:15px;font-weight:900;color:var(--sub);}
        .board-av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;}
        .board-info{flex:1;min-width:0;}
        .board-name{font-size:13.5px;font-weight:700;margin-bottom:2px;display:flex;align-items:center;gap:7px;}
        .board-meta{font-size:11px;color:var(--sub);}
        .board-val{font-size:18px;font-weight:900;letter-spacing:-0.8px;flex-shrink:0;}
        .board-unit{font-size:11px;color:var(--sub);font-weight:600;margin-top:1px;text-align:right;}
        .you-tag{padding:2px 8px;border-radius:100px;font-size:9px;font-weight:800;background:rgba(198,241,53,.1);color:var(--lime);border:1px solid rgba(198,241,53,.2);}
        .top3-glow{position:absolute;inset:0;pointer-events:none;}

        /* MY RANK BANNER */
        .my-rank-banner{margin:0 22px 12px;padding:12px 16px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.15);border-radius:12px;display:flex;align-items:center;justify-content:space-between;}

        /* EMPTY */
        .lb-empty{padding:48px 22px;text-align:center;}
        .lb-empty-icon{font-size:40px;margin-bottom:10px;}
        .lb-empty-title{font-size:15px;font-weight:800;margin-bottom:5px;}
        .lb-empty-sub{font-size:12.5px;color:var(--sub);line-height:1.65;max-width:320px;margin:0 auto;}

        @media(max-width:1100px){.my-stats-grid{grid-template-columns:repeat(3,1fr)}.badges-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:900px){.sidebar{display:none}.main{margin-left:0}.my-stats-grid{grid-template-columns:repeat(2,1fr)}.badges-grid{grid-template-columns:repeat(2,1fr)}.content{padding:18px}}
      `}</style>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a className="logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
          <div className="nav-lbl">Dashboard</div>
          <a className="nav-a" href="/dashboard">⚡ Overview</a>
          <a className="nav-a" href="/progress">📊 Progress</a>
          <div className="nav-lbl">Social</div>
          <a className="nav-a on" href="/leaderboard">🏆 Leaderboard</a>
          <div className="nav-lbl">Tools</div>
          <a className="nav-a" href="/calculator">⚖️ BMI / TDEE</a>
          <a className="nav-a" href="/workouts/generate">🏋️ AI Workout</a>
          <a className="nav-a" href="/workouts/history">📋 History</a>
          <a className="nav-a" href="/progress/log">📝 Log Progress</a>
          <div className="nav-lbl">Discover</div>
          <a className="nav-a" href="/bookings">📅 Bookings</a>
          <a className="nav-a" href="/trainers">👥 Trainers</a>
          <a className="nav-a" href="/nutritionists">🧬 Nutritionists</a>
          <a className="nav-a" href="/meals">🥗 Meal Plans</a>
          <div className="nav-lbl">Communication</div>
          <a className="nav-a" href="/chat">💬 Messages</a>
          <a className="nav-a" href="/notifications">🔔 Notifications</a>
          <div className="nav-lbl">Account</div>
          <a className="nav-a" href="/profile">👤 Profile</a>
          <div className="sb-bot">
            <div className="ucard">
              <div className="uav-sm">{user?.name?.[0]?.toUpperCase()||'U'}</div>
              <div><div style={{fontSize:12.5,fontWeight:700,marginBottom:1}}>{user?.name}</div><div style={{fontSize:10,color:'var(--sub)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:130,whiteSpace:'nowrap'}}>{user?.email}</div></div>
            </div>
            <button className="logout-btn" onClick={()=>{localStorage.removeItem('token');router.push('/login');}}>Sign out</button>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-title">🏆 Leaderboard & Streaks</div>
            <a className="back-btn" href="/dashboard">← Dashboard</a>
          </div>

          <div className="content">
            {/* MY STATS */}
            {myStats && (
              <div className="my-stats-grid">
                {[
                  { icon:'🔥', val: myStats.streak,        lbl:'Day Streak',     color:'#fb923c', grad:'#fb923c' },
                  { icon:'🏋️', val: myStats.weekWorkouts,  lbl:'Workouts / Week',color:'var(--lime)', grad:'var(--lime)' },
                  { icon:'⚡', val: myStats.weekCals+'kcal',lbl:'Avg Daily Cals', color:'var(--cyan)', grad:'var(--cyan)' },
                  { icon:'💧', val: myStats.weekWater+'ml', lbl:'Avg Daily Water',color:'#38bdf8',    grad:'#38bdf8' },
                  { icon:'📊', val: myStats.daysLogged,     lbl:'Days Logged',    color:'#a78bfa',    grad:'#a78bfa' },
                ].map(s => (
                  <div key={s.lbl} className="ms-card">
                    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${s.grad},transparent)`}}/>
                    <div className="ms-icon">{s.icon}</div>
                    <div className="ms-val" style={{color:s.color}}>{s.val}</div>
                    <div className="ms-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            )}

            {/* BADGES */}
            <div className="badges-section">
              <div className="badges-head">🎖️ Achievements & Badges</div>
              <div className="badges-grid">
                {BADGES.map(b => {
                  const earned = myBadges.includes(b.id);
                  return (
                    <div key={b.id} className={`badge-card ${earned ? 'earned' : ''}`}
                      style={{ background: earned ? `${b.color}10` : 'rgba(255,255,255,.02)', borderColor: earned ? `${b.color}30` : 'var(--line)' }}>
                      <div className="badge-icon">{b.icon}</div>
                      <div className="badge-label" style={{ color: earned ? b.color : 'var(--text)' }}>{b.label}</div>
                      <div className="badge-req">{b.req}</div>
                      {earned && <div className="badge-earned-tag">✓ Earned</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LEADERBOARD */}
            <div className="lb-section">
              <div className="lb-head">
                <div className="lb-title">Community Rankings</div>
                <div className="lb-controls">
                  <div className="tab-row">
                    {TABS.map(t => (
                      <button key={t.key} className={`tab-btn ${tab===t.key?'on':''}`} onClick={() => handleTabChange(t.key)}>
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="period-row">
                    {PERIODS.map(p => (
                      <button key={p.key} className={`period-btn ${period===p.key?'on':''}`} onClick={() => handlePeriodChange(p.key)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* MY RANK BANNER */}
              {myRank && !boardLoading && board.length > 0 && (
                <div className="my-rank-banner">
                  <div style={{fontSize:13,fontWeight:700}}>Your rank: <span style={{color:'var(--lime)',fontSize:16}}>#{myRank}</span></div>
                  <div style={{fontSize:12,color:'var(--sub)'}}>
                    {myRank === 1 ? '🏆 You\'re #1!' : myRank <= 3 ? '🎯 Top 3!' : myRank <= 10 ? '🔥 Top 10' : 'Keep going!'}
                  </div>
                </div>
              )}

              {boardLoading ? (
                <div className="board-list">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 22px',borderBottom:'1px solid var(--line)'}}>
                      <div className="skel" style={{width:36,height:36,borderRadius:'50%'}}/>
                      <div className="skel" style={{width:40,height:40,borderRadius:'50%',flexShrink:0}}/>
                      <div style={{flex:1}}><div className="skel" style={{height:13,marginBottom:6,width:'50%'}}/><div className="skel" style={{height:10,width:'30%'}}/></div>
                      <div className="skel" style={{width:60,height:22}}/>
                    </div>
                  ))}
                </div>
              ) : board.length === 0 ? (
                <div className="lb-empty">
                  <div className="lb-empty-icon">🏆</div>
                  <div className="lb-empty-title">Leaderboard coming soon</div>
                  <div className="lb-empty-sub">
                    The community leaderboard will show rankings once the <code>/api/leaderboard</code> endpoint is connected.<br/><br/>
                    Keep logging your progress — your stats are being tracked!
                  </div>
                </div>
              ) : (
                <div className="board-list">
                  {board.map((entry: any, i: number) => {
                    const isMe = entry.userId === (user?._id || user?.id);
                    const rankColor = RANK_COLORS[i] || 'var(--sub)';
                    const color = avatarColor(entry.userId);
                    const val = tab === 'streak'   ? `${entry.value}d`
                              : tab === 'workouts' ? entry.value
                              : tab === 'water'    ? `${(entry.value/1000).toFixed(1)}L`
                              : `${entry.value}`;
                    const unit = tab === 'streak'   ? 'day streak'
                               : tab === 'workouts' ? 'sessions'
                               : tab === 'water'    ? 'avg daily'
                               : 'kcal avg';
                    return (
                      <div key={entry.userId} className={`board-row ${isMe ? 'me' : ''}`}>
                        <div className="board-rank">
                          {i < 3 ? <span>{RANK_ICONS[i]}</span> : <span className="board-rank-num">#{i+1}</span>}
                        </div>
                        <div className="board-av" style={{background:`${color}18`,color}}>
                          {entry.avatar
                            ? <img src={entry.avatar} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>
                            : initials(entry.name)}
                        </div>
                        <div className="board-info">
                          <div className="board-name">
                            {entry.name || 'Anonymous'}
                            {isMe && <span className="you-tag">You</span>}
                          </div>
                          <div className="board-meta">{entry.fitnessGoal?.replace(/_/g,' ') || 'UrbanWell Member'}</div>
                        </div>
                        <div>
                          <div className="board-val" style={{color: rankColor}}>{val}</div>
                          <div className="board-unit">{unit}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}