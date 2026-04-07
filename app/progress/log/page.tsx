'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '../../lib/api';

export default function ProgressTracker() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeChart, setActiveChart] = useState<'weight'|'calories'|'water'>('weight');
  const [range, setRange] = useState<7|14|30>(30);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await API.get('/users/profile');
        setUser(data.data);
      } catch { router.push('/login'); return; }
      try {
        const [progRes, statsRes] = await Promise.all([
          API.get('/progress?limit=30'),
          API.get('/progress/stats/me').catch(() => ({ data: { data: null } })),
        ]);
        const raw = progRes.data?.data || [];
        setEntries(Array.isArray(raw) ? raw.slice().reverse() : []);
        setStats(statsRes.data?.data || null);
      } catch {}
      setLoading(false);
    };
    init();
  }, []);

  const filtered = entries.slice(-range);

  // Chart helpers
  const chartData = (key: string) => filtered.map((e: any) => ({
    date: new Date(e.date || e.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
    val: e[key] || e[key === 'calories' ? 'caloriesConsumed' : key === 'water' ? 'waterIntake' : key] || null,
  })).filter(d => d.val !== null);

  const chartCfg = {
    weight:   { key:'weight',   label:'Weight (kg)',        color:'#8b5cf6', unit:'kg',  goal: user?.weight },
    calories: { key:'calories', label:'Calories (kcal)',     color:'#c6f135', unit:'kcal', goal: user?.calorieGoal || 2000 },
    water:    { key:'water',    label:'Water (ml)',          color:'#00d4ff', unit:'ml',  goal: user?.waterGoal || 2500 },
  };

  const activeData = chartData(activeChart === 'calories' ? 'caloriesConsumed' : activeChart === 'water' ? 'water' : 'weight');
  const cfg = chartCfg[activeChart];
  const maxVal = activeData.length ? Math.max(...activeData.map(d => d.val)) * 1.1 : 100;
  const minVal = activeData.length ? Math.min(...activeData.map(d => d.val)) * 0.9 : 0;

  const barHeight = (val: number) => Math.max(4, ((val - minVal) / (maxVal - minVal || 1)) * 180);

  const latest = entries[entries.length - 1] || {};
  const first = entries[0] || {};
  const weightChange = latest.weight && first.weight ? (latest.weight - first.weight).toFixed(1) : null;
  const avgCalories = entries.length ? Math.round(entries.reduce((s: number, e: any) => s + (e.caloriesConsumed || e.calories || 0), 0) / entries.filter((e:any) => e.caloriesConsumed || e.calories).length || 1) : null;
  const avgWater = entries.length ? Math.round(entries.reduce((s: number, e: any) => s + (e.water || e.waterIntake || 0), 0) / entries.filter((e:any) => e.water || e.waterIntake).length || 1) : null;
  const workoutsLogged = entries.filter((e: any) => e.workoutCompleted).length;
  const bmi = latest.weight && user?.height ? (latest.weight / Math.pow(user.height / 100, 2)).toFixed(1) : null;

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
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        :root { --void:#03050a; --panel:#0a1220; --panel2:#0f1a2e; --lime:#c6f135; --cyan:#00d4ff; --violet:#8b5cf6; --rose:#f43f5e; --amber:#f59e0b; --text:#e2ecff; --sub:#4d6b8a; --line:rgba(0,212,255,0.08); }
        body { background:var(--void); color:var(--text); font-family:'Plus Jakarta Sans',sans-serif; -webkit-font-smoothing:antialiased; min-height:100vh; }
        body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events:none; z-index:9999; opacity:0.4; }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(198,241,53,0.5)} 50%{box-shadow:0 0 0 6px rgba(198,241,53,0)} }
        @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes barrise { from{height:0} to{height:var(--h)} }

        .layout { display:flex; min-height:100vh; }
        .sidebar { width:260px; flex-shrink:0; background:var(--panel); border-right:1px solid var(--line); display:flex; flex-direction:column; padding:28px 20px; position:fixed; top:0; left:0; bottom:0; overflow-y:auto; z-index:100; }
        .sidebar-logo { display:flex; align-items:center; gap:10px; text-decoration:none; margin-bottom:36px; }
        .logo-icon { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,var(--lime),var(--cyan)); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:900; color:#000; }
        .logo-text { font-size:18px; font-weight:800; letter-spacing:-0.5px; }
        .logo-text em { font-style:normal; color:var(--lime); }
        .nav-item { display:flex; align-items:center; gap:12px; padding:11px 12px; border-radius:10px; font-size:14px; font-weight:500; color:var(--sub); cursor:pointer; transition:all 0.2s; margin-bottom:2px; border:1px solid transparent; text-decoration:none; background:transparent; width:100%; text-align:left; font-family:'Plus Jakarta Sans',sans-serif; }
        .nav-item:hover { color:var(--text); background:rgba(255,255,255,0.04); }
        .nav-item.active { color:var(--lime); background:rgba(198,241,53,0.08); border-color:rgba(198,241,53,0.12); }
        .sidebar-bottom { margin-top:auto; padding-top:20px; }
        .user-card { display:flex; align-items:center; gap:12px; padding:14px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid var(--line); margin-bottom:10px; }
        .btn-logout { width:100%; padding:11px; background:rgba(244,63,94,0.06); border:1px solid rgba(244,63,94,0.15); border-radius:10px; color:#fb7185; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-logout:hover { background:rgba(244,63,94,0.12); }

        .main { margin-left:260px; flex:1; }
        .topbar { height:68px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; padding:0 36px; background:rgba(3,5,10,0.85); backdrop-filter:blur(20px); position:sticky; top:0; z-index:50; }
        .topbar-title { font-size:18px; font-weight:700; letter-spacing:-0.5px; }
        .topbar-right { display:flex; align-items:center; gap:10px; }
        .back-btn { display:flex; align-items:center; gap:7px; padding:8px 16px; background:var(--panel); border:1px solid var(--line); border-radius:9px; color:var(--sub); font-size:13px; font-weight:600; cursor:pointer; text-decoration:none; transition:all 0.2s; }
        .back-btn:hover { color:var(--text); }
        .btn-log { padding:9px 18px; background:var(--lime); color:#000; font-size:13px; font-weight:800; border-radius:9px; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.2s; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
        .btn-log:hover { background:#d4ff45; }

        .content { padding:36px; animation:fadein 0.4s ease; }

        /* HEADER */
        .page-header { margin-bottom:28px; }
        .page-title { font-size:28px; font-weight:900; letter-spacing:-1.5px; margin-bottom:6px; }
        .page-sub { font-size:14px; color:var(--sub); font-weight:300; }

        /* STAT CARDS */
        .stats-row { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:24px; }
        .stat-card { background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:18px; position:relative; overflow:hidden; transition:all 0.3s; }
        .stat-card:hover { transform:translateY(-2px); }
        .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
        .sc-lime::before { background:linear-gradient(90deg,transparent,var(--lime),transparent); }
        .sc-cyan::before { background:linear-gradient(90deg,transparent,var(--cyan),transparent); }
        .sc-violet::before { background:linear-gradient(90deg,transparent,var(--violet),transparent); }
        .sc-amber::before { background:linear-gradient(90deg,transparent,var(--amber),transparent); }
        .sc-rose::before { background:linear-gradient(90deg,transparent,var(--rose),transparent); }
        .stat-icon { font-size:18px; margin-bottom:10px; }
        .stat-val { font-size:22px; font-weight:800; letter-spacing:-1px; margin-bottom:3px; }
        .stat-lbl { font-size:11px; color:var(--sub); font-weight:500; }
        .stat-delta { font-size:10px; font-weight:700; margin-top:5px; padding:2px 7px; border-radius:100px; display:inline-block; }
        .delta-pos { background:rgba(198,241,53,0.08); color:var(--lime); }
        .delta-neg { background:rgba(244,63,94,0.08); color:var(--rose); }
        .delta-neu { background:rgba(255,255,255,0.04); color:var(--sub); }

        /* CHART SECTION */
        .chart-section { background:var(--panel); border:1px solid var(--line); border-radius:20px; padding:28px; margin-bottom:20px; }
        .chart-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
        .chart-tabs { display:flex; gap:4px; background:var(--panel2); border-radius:12px; padding:4px; }
        .chart-tab { padding:8px 18px; border-radius:9px; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.25s; color:var(--sub); background:transparent; border:none; font-family:'Plus Jakarta Sans',sans-serif; }
        .chart-tab:hover { color:var(--text); }
        .chart-tab.active { color:#000; }
        .range-pills { display:flex; gap:6px; }
        .range-pill { padding:6px 14px; border-radius:100px; font-size:11px; font-weight:700; cursor:pointer; background:var(--panel2); border:1px solid var(--line); color:var(--sub); transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; }
        .range-pill:hover { color:var(--text); }
        .range-pill.active { background:rgba(198,241,53,0.1); border-color:rgba(198,241,53,0.3); color:var(--lime); }

        /* BAR CHART */
        .chart-wrap { overflow-x:auto; padding-bottom:8px; }
        .bar-chart { display:flex; align-items:flex-end; gap:6px; height:220px; min-width:100%; padding:0 4px; }
        .bar-col { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; min-width:28px; cursor:pointer; }
        .bar-col:hover .bar { opacity:0.85; }
        .bar { border-radius:6px 6px 0 0; transition:height 0.6s cubic-bezier(0.34,1.56,0.64,1); min-width:16px; width:100%; position:relative; }
        .bar-val { position:absolute; top:-22px; left:50%; transform:translateX(-50%); font-size:9px; font-weight:700; white-space:nowrap; opacity:0; transition:opacity 0.2s; }
        .bar-col:hover .bar-val { opacity:1; }
        .bar-label { font-size:9px; color:var(--sub); font-weight:600; white-space:nowrap; transform:rotate(-40deg); transform-origin:top center; margin-top:4px; }
        .chart-empty { height:220px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; }
        .chart-empty-icon { font-size:40px; }
        .chart-empty-text { font-size:14px; font-weight:700; }
        .chart-empty-sub { font-size:12px; color:var(--sub); font-weight:300; }

        /* GOAL LINE */
        .goal-line-wrap { position:relative; margin-top:4px; }
        .goal-line-label { font-size:10px; color:var(--sub); font-weight:600; display:flex; align-items:center; gap:6px; }
        .goal-dot { width:8px; height:8px; border-radius:50%; }

        /* HISTORY TABLE */
        .history-section { background:var(--panel); border:1px solid var(--line); border-radius:20px; overflow:hidden; }
        .history-header { padding:22px 28px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; }
        .history-title { font-size:15px; font-weight:700; }
        .table-wrap { overflow-x:auto; }
        table { width:100%; border-collapse:collapse; }
        thead tr { background:rgba(255,255,255,0.02); }
        th { padding:12px 20px; text-align:left; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--sub); white-space:nowrap; }
        td { padding:13px 20px; font-size:13px; font-weight:500; border-top:1px solid var(--line); white-space:nowrap; }
        tr:hover td { background:rgba(255,255,255,0.02); }
        .mood-badge { padding:3px 10px; border-radius:100px; font-size:10px; font-weight:700; }
        .mood-great { background:rgba(198,241,53,0.1); color:var(--lime); }
        .mood-good  { background:rgba(0,212,255,0.1); color:var(--cyan); }
        .mood-okay  { background:rgba(245,158,11,0.1); color:var(--amber); }
        .mood-bad   { background:rgba(244,63,94,0.1); color:var(--rose); }
        .workout-yes { color:var(--lime); font-weight:700; }
        .workout-no { color:var(--sub); }
        .empty-history { padding:60px 28px; text-align:center; }

        /* STREAK */
        .streak-card { background:linear-gradient(135deg,rgba(198,241,53,0.08),rgba(0,212,255,0.05)); border:1px solid rgba(198,241,53,0.15); border-radius:16px; padding:22px 24px; display:flex; align-items:center; gap:16px; margin-bottom:20px; }
        .streak-icon { font-size:36px; }
        .streak-val { font-size:28px; font-weight:900; letter-spacing:-1.5px; color:var(--lime); }
        .streak-lbl { font-size:12px; color:var(--sub); font-weight:500; }
        .streak-right { margin-left:auto; text-align:right; font-size:12px; color:var(--sub); }

        @media(max-width:900px) { .sidebar{display:none} .main{margin-left:0} .content{padding:20px} .stats-row{grid-template-columns:repeat(2,1fr)} }
      `}</style>

      <div className="layout">
        <aside className="sidebar">
          <a className="sidebar-logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
          {[{icon:'⚡',label:'Dashboard',href:'/dashboard'},{icon:'📊',label:'Progress',href:'/progress',active:true},{icon:'📝',label:'Log Today',href:'/progress/log'},{icon:'🏋️',label:'Workouts',href:'/workouts/generate'},{icon:'👥',label:'Trainers',href:'/trainers'},{icon:'🧬',label:'Nutritionists',href:'/nutritionists'},{icon:'📍',label:'Gyms',href:'/gym-packages'},{icon:'👤',label:'Profile',href:'/profile'}].map(n=>(
            <a key={n.label} className={`nav-item ${n.active?'active':''}`} href={n.href}><span style={{fontSize:16,width:20,textAlign:'center'}}>{n.icon}</span>{n.label}</a>
          ))}
          <div className="sidebar-bottom">
            <div className="user-card">
              <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,rgba(198,241,53,0.3),rgba(0,212,255,0.2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'var(--lime)'}}>
                {user?.name?.[0]?.toUpperCase()||'U'}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{user?.name||'User'}</div>
                <div style={{fontSize:10,color:'var(--sub)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:140,whiteSpace:'nowrap'}}>{user?.email||''}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={()=>{localStorage.removeItem('token');router.push('/login');}}>Sign out</button>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-title">Progress Tracker</div>
            <div className="topbar-right">
              <a className="back-btn" href="/dashboard">← Dashboard</a>
              <a className="btn-log" href="/progress/log">+ Log Today</a>
            </div>
          </div>

          <div className="content">
            <div className="page-header">
              <div className="page-title">Your Progress 📊</div>
              <div className="page-sub">{entries.length > 0 ? `${entries.length} entries logged · Last updated ${new Date(entries[entries.length-1]?.date||entries[entries.length-1]?.createdAt).toLocaleDateString('en-PK',{month:'short',day:'numeric'})}` : 'Start logging to track your progress over time'}</div>
            </div>

            {entries.length === 0 ? (
              /* EMPTY STATE */
              <div style={{textAlign:'center',padding:'80px 20px',background:'var(--panel)',border:'1px solid var(--line)',borderRadius:20}}>
                <div style={{fontSize:64,marginBottom:20}}>📊</div>
                <div style={{fontSize:24,fontWeight:800,letterSpacing:'-1px',marginBottom:10}}>No progress logged yet</div>
                <div style={{fontSize:14,color:'var(--sub)',fontWeight:300,marginBottom:28,lineHeight:1.7}}>Start tracking your daily calories, water intake,<br/>weight and workouts to see your progress here.</div>
                <a href="/progress/log" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'14px 32px',background:'var(--lime)',color:'#000',fontWeight:800,fontSize:15,borderRadius:12,textDecoration:'none',transition:'all 0.2s'}}>📝 Log Today's Progress</a>
              </div>
            ) : (
              <>
                {/* STREAK */}
                {entries.length >= 2 && (
                  <div className="streak-card">
                    <div className="streak-icon">🔥</div>
                    <div>
                      <div className="streak-val">{entries.length}</div>
                      <div className="streak-lbl">Total entries logged</div>
                    </div>
                    <div className="streak-right">
                      <div style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:3}}>Keep it up!</div>
                      <div>Consistency is key to results</div>
                    </div>
                  </div>
                )}

                {/* STAT SUMMARY CARDS */}
                <div className="stats-row">
                  <div className="stat-card sc-violet">
                    <div className="stat-icon">⚖️</div>
                    <div className="stat-val" style={{color:'var(--violet)'}}>{latest.weight ? `${latest.weight}kg` : '—'}</div>
                    <div className="stat-lbl">Current Weight</div>
                    {weightChange && <div className={`stat-delta ${Number(weightChange)<=0?'delta-pos':'delta-neg'}`}>{Number(weightChange)>0?'+':''}{weightChange}kg total</div>}
                  </div>
                  <div className="stat-card sc-lime">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-val" style={{color:'var(--lime)'}}>{avgCalories ? avgCalories.toLocaleString() : '—'}</div>
                    <div className="stat-lbl">Avg Calories/Day</div>
                    {user?.calorieGoal && avgCalories && <div className={`stat-delta ${avgCalories<=user.calorieGoal?'delta-pos':'delta-neg'}`}>{avgCalories<=user.calorieGoal?'Within goal':'Over goal'}</div>}
                  </div>
                  <div className="stat-card sc-cyan">
                    <div className="stat-icon">💧</div>
                    <div className="stat-val" style={{color:'var(--cyan)'}}>{avgWater ? (avgWater>=1000?`${(avgWater/1000).toFixed(1)}L`:avgWater+'ml') : '—'}</div>
                    <div className="stat-lbl">Avg Water/Day</div>
                    {user?.waterGoal && avgWater && <div className={`stat-delta ${avgWater>=user.waterGoal?'delta-pos':'delta-neg'}`}>{avgWater>=user.waterGoal?'Goal met!':'Below goal'}</div>}
                  </div>
                  <div className="stat-card sc-amber">
                    <div className="stat-icon">🏋️</div>
                    <div className="stat-val" style={{color:'var(--amber)'}}>{workoutsLogged}</div>
                    <div className="stat-lbl">Workouts Logged</div>
                    <div className="stat-delta delta-neu">of {entries.length} days</div>
                  </div>
                  <div className="stat-card sc-rose">
                    <div className="stat-icon">📊</div>
                    <div className="stat-val" style={{color:bmi?Number(bmi)<25?'var(--lime)':Number(bmi)<30?'var(--amber)':'var(--rose)':'var(--text)'}}>{bmi || '—'}</div>
                    <div className="stat-lbl">Current BMI</div>
                    {bmi && <div className={`stat-delta ${Number(bmi)<25?'delta-pos':Number(bmi)<30?'delta-neu':'delta-neg'}`}>{Number(bmi)<18.5?'Underweight':Number(bmi)<25?'Normal':Number(bmi)<30?'Overweight':'Obese'}</div>}
                  </div>
                </div>

                {/* BAR CHART */}
                <div className="chart-section">
                  <div className="chart-header">
                    <div>
                      <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>
                        {activeChart==='weight'?'⚖️ Weight History':activeChart==='calories'?'🔥 Calorie History':'💧 Water History'}
                      </div>
                      <div style={{fontSize:12,color:'var(--sub)',fontWeight:300}}>Last {range} entries</div>
                    </div>
                    <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
                      <div className="chart-tabs">
                        {(['weight','calories','water'] as const).map(t => (
                          <button key={t} className={`chart-tab ${activeChart===t?'active':''}`}
                            style={activeChart===t?{background:t==='weight'?'var(--violet)':t==='calories'?'var(--lime)':'var(--cyan)'}:{}}
                            onClick={()=>setActiveChart(t)}>
                            {t==='weight'?'⚖️ Weight':t==='calories'?'🔥 Calories':'💧 Water'}
                          </button>
                        ))}
                      </div>
                      <div className="range-pills">
                        {([7,14,30] as const).map(r => (
                          <button key={r} className={`range-pill ${range===r?'active':''}`} onClick={()=>setRange(r)}>{r}d</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {activeData.length > 0 ? (
                    <>
                      <div className="chart-wrap">
                        <div className="bar-chart">
                          {activeData.map((d, i) => (
                            <div key={i} className="bar-col">
                              <div className="bar" style={{
                                height: barHeight(d.val),
                                background: `linear-gradient(180deg, ${cfg.color} 0%, ${cfg.color}44 100%)`,
                                boxShadow: `0 0 12px ${cfg.color}33`,
                              }}>
                                <span className="bar-val" style={{color:cfg.color}}>{d.val}{cfg.unit}</span>
                              </div>
                              <div className="bar-label">{d.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:16,marginTop:16,flexWrap:'wrap'}}>
                        <div className="goal-line-label">
                          <div className="goal-dot" style={{background:cfg.color,opacity:0.5}}/>
                          <span>Avg: <strong style={{color:cfg.color}}>{Math.round(activeData.reduce((s,d)=>s+d.val,0)/activeData.length)}{cfg.unit}</strong></span>
                        </div>
                        {cfg.goal && (
                          <div className="goal-line-label">
                            <div className="goal-dot" style={{background:'white',opacity:0.3}}/>
                            <span>Goal: <strong style={{color:'var(--text)'}}>{cfg.goal}{cfg.unit}</strong></span>
                          </div>
                        )}
                        <div className="goal-line-label">
                          <div className="goal-dot" style={{background:cfg.color}}/>
                          <span>Latest: <strong style={{color:cfg.color}}>{activeData[activeData.length-1]?.val}{cfg.unit}</strong></span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="chart-empty">
                      <div className="chart-empty-icon">📉</div>
                      <div className="chart-empty-text">No {activeChart} data logged yet</div>
                      <div className="chart-empty-sub">Log this metric in your daily progress</div>
                    </div>
                  )}
                </div>

                {/* HISTORY TABLE */}
                <div className="history-section">
                  <div className="history-header">
                    <div className="history-title">📋 Full History</div>
                    <div style={{fontSize:12,color:'var(--sub)'}}>{entries.length} entries total</div>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Weight</th>
                          <th>Calories</th>
                          <th>Water</th>
                          <th>Protein</th>
                          <th>Workout</th>
                          <th>Sleep</th>
                          <th>Mood</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...entries].reverse().map((e: any, i: number) => (
                          <tr key={e._id || i}>
                            <td style={{fontWeight:600}}>{new Date(e.date||e.createdAt).toLocaleDateString('en-PK',{weekday:'short',month:'short',day:'numeric'})}</td>
                            <td>{e.weight ? <span style={{color:'var(--violet)',fontWeight:700}}>{e.weight}kg</span> : <span style={{color:'var(--sub)'}}>—</span>}</td>
                            <td>{(e.caloriesConsumed||e.calories) ? <span style={{color:'var(--lime)',fontWeight:700}}>{(e.caloriesConsumed||e.calories).toLocaleString()}</span> : <span style={{color:'var(--sub)'}}>—</span>}</td>
                            <td>{(e.water||e.waterIntake) ? <span style={{color:'var(--cyan)',fontWeight:700}}>{(e.water||e.waterIntake)>=1000?`${((e.water||e.waterIntake)/1000).toFixed(1)}L`:`${e.water||e.waterIntake}ml`}</span> : <span style={{color:'var(--sub)'}}>—</span>}</td>
                            <td>{e.protein ? <span style={{fontWeight:600}}>{e.protein}g</span> : <span style={{color:'var(--sub)'}}>—</span>}</td>
                            <td>{e.workoutCompleted ? <span className="workout-yes">✓ Done</span> : <span className="workout-no">—</span>}</td>
                            <td>{e.sleepHours ? `${e.sleepHours}h` : <span style={{color:'var(--sub)'}}>—</span>}</td>
                            <td>
                              {e.mood ? (
                                <span className={`mood-badge mood-${e.mood}`}>
                                  {e.mood==='great'?'😄':e.mood==='good'?'🙂':e.mood==='okay'?'😐':'😞'} {e.mood}
                                </span>
                              ) : <span style={{color:'var(--sub)'}}>—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}