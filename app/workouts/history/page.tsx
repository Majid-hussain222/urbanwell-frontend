'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

/* ─── DEMO WORKOUT LOGS ──────────────────────────────────── */
const MUSCLE_GROUPS = ['All','Chest','Back','Legs','Shoulders','Arms','Core','Full Body','Cardio'];

const DEMO_LOGS = [
  { _id:'wl1', name:'Push Day — Chest & Shoulders', date:'2026-02-24', duration:62, caloriesBurned:480,
    muscleGroups:['Chest','Shoulders'], difficulty:'Intermediate', mood:'💪 Energized', notes:'PR on bench press today — 100kg x 5!',
    exercises:[
      { name:'Barbell Bench Press',   sets:[{reps:5,weight:100},{reps:5,weight:100},{reps:4,weight:100},{reps:4,weight:95}] },
      { name:'Incline Dumbbell Press',sets:[{reps:10,weight:32},{reps:10,weight:32},{reps:9,weight:32}] },
      { name:'Cable Fly',             sets:[{reps:12,weight:15},{reps:12,weight:15},{reps:12,weight:15}] },
      { name:'Overhead Press',        sets:[{reps:8,weight:60},{reps:8,weight:60},{reps:7,weight:60}] },
      { name:'Lateral Raise',         sets:[{reps:15,weight:10},{reps:15,weight:10},{reps:15,weight:10},{reps:12,weight:10}] },
    ]},
  { _id:'wl2', name:'Pull Day — Back & Biceps', date:'2026-02-22', duration:70, caloriesBurned:520,
    muscleGroups:['Back','Arms'], difficulty:'Intermediate', mood:'😤 Focused', notes:'Good pump. Pull-ups feeling stronger.',
    exercises:[
      { name:'Weighted Pull-ups',     sets:[{reps:8,weight:10},{reps:7,weight:10},{reps:6,weight:10}] },
      { name:'Barbell Row',           sets:[{reps:8,weight:80},{reps:8,weight:80},{reps:8,weight:75}] },
      { name:'Lat Pulldown',          sets:[{reps:10,weight:70},{reps:10,weight:70},{reps:10,weight:65}] },
      { name:'Seated Cable Row',      sets:[{reps:12,weight:65},{reps:12,weight:65},{reps:12,weight:65}] },
      { name:'Dumbbell Curl',         sets:[{reps:12,weight:16},{reps:12,weight:16},{reps:10,weight:16}] },
      { name:'Hammer Curl',           sets:[{reps:12,weight:14},{reps:12,weight:14}] },
    ]},
  { _id:'wl3', name:'Leg Day — Quads & Glutes', date:'2026-02-20', duration:80, caloriesBurned:620,
    muscleGroups:['Legs'], difficulty:'Hard', mood:'🔥 Beast Mode', notes:'Squats felt heavy but form was solid.',
    exercises:[
      { name:'Back Squat',            sets:[{reps:5,weight:120},{reps:5,weight:120},{reps:5,weight:115},{reps:4,weight:115}] },
      { name:'Romanian Deadlift',     sets:[{reps:10,weight:90},{reps:10,weight:90},{reps:10,weight:85}] },
      { name:'Leg Press',             sets:[{reps:12,weight:200},{reps:12,weight:200},{reps:10,weight:200}] },
      { name:'Walking Lunges',        sets:[{reps:20,weight:20},{reps:20,weight:20}] },
      { name:'Leg Curl',              sets:[{reps:12,weight:45},{reps:12,weight:45},{reps:12,weight:45}] },
      { name:'Calf Raise',            sets:[{reps:20,weight:60},{reps:20,weight:60},{reps:20,weight:60}] },
    ]},
  { _id:'wl4', name:'HIIT Cardio Blast', date:'2026-02-19', duration:35, caloriesBurned:410,
    muscleGroups:['Cardio','Full Body'], difficulty:'Hard', mood:'😰 Exhausted', notes:'20 min intervals + 15 min steady state.',
    exercises:[
      { name:'Burpees',               sets:[{reps:15,weight:0},{reps:15,weight:0},{reps:12,weight:0}] },
      { name:'Jump Squats',           sets:[{reps:20,weight:0},{reps:20,weight:0},{reps:18,weight:0}] },
      { name:'Mountain Climbers',     sets:[{reps:30,weight:0},{reps:30,weight:0},{reps:30,weight:0}] },
      { name:'Treadmill Intervals',   sets:[{reps:1,weight:0,note:'8 × 30s sprint / 30s rest'}] },
    ]},
  { _id:'wl5', name:'Shoulder & Arms Hypertrophy', date:'2026-02-17', duration:55, caloriesBurned:380,
    muscleGroups:['Shoulders','Arms'], difficulty:'Intermediate', mood:'💪 Energized', notes:'Volume day — high reps, short rest.',
    exercises:[
      { name:'Arnold Press',          sets:[{reps:12,weight:24},{reps:12,weight:24},{reps:10,weight:24}] },
      { name:'Lateral Raise',         sets:[{reps:15,weight:12},{reps:15,weight:12},{reps:15,weight:10},{reps:15,weight:10}] },
      { name:'Front Raise',           sets:[{reps:12,weight:10},{reps:12,weight:10},{reps:12,weight:10}] },
      { name:'EZ Bar Curl',           sets:[{reps:12,weight:40},{reps:12,weight:40},{reps:10,weight:40}] },
      { name:'Tricep Pushdown',       sets:[{reps:15,weight:30},{reps:15,weight:30},{reps:12,weight:32}] },
      { name:'Overhead Tricep Ext.',  sets:[{reps:12,weight:22},{reps:12,weight:22}] },
    ]},
  { _id:'wl6', name:'Full Body Strength', date:'2026-02-15', duration:75, caloriesBurned:560,
    muscleGroups:['Full Body'], difficulty:'Intermediate', mood:'😊 Good', notes:'Deload week — focused on technique.',
    exercises:[
      { name:'Deadlift',              sets:[{reps:5,weight:130},{reps:5,weight:130},{reps:5,weight:125}] },
      { name:'Bench Press',           sets:[{reps:8,weight:85},{reps:8,weight:85},{reps:8,weight:85}] },
      { name:'Squat',                 sets:[{reps:8,weight:95},{reps:8,weight:95},{reps:8,weight:90}] },
      { name:'Pull-ups',              sets:[{reps:8,weight:0},{reps:8,weight:0},{reps:7,weight:0}] },
    ]},
  { _id:'wl7', name:'Core & Mobility', date:'2026-02-13', duration:40, caloriesBurned:220,
    muscleGroups:['Core'], difficulty:'Easy', mood:'😌 Relaxed', notes:'Recovery session. Felt great after.',
    exercises:[
      { name:'Plank',                 sets:[{reps:1,weight:0,note:'60s hold'},{reps:1,weight:0,note:'60s hold'},{reps:1,weight:0,note:'45s hold'}] },
      { name:'Cable Crunch',          sets:[{reps:20,weight:35},{reps:20,weight:35},{reps:18,weight:35}] },
      { name:'Leg Raise',             sets:[{reps:15,weight:0},{reps:15,weight:0},{reps:15,weight:0}] },
      { name:'Russian Twist',         sets:[{reps:20,weight:10},{reps:20,weight:10}] },
      { name:'Yoga Flow',             sets:[{reps:1,weight:0,note:'20 min'}] },
    ]},
  { _id:'wl8', name:'Back & Rear Delts Volume', date:'2026-02-11', duration:68, caloriesBurned:490,
    muscleGroups:['Back','Shoulders'], difficulty:'Intermediate', mood:'😤 Focused', notes:'Focused on mind-muscle connection.',
    exercises:[
      { name:'T-Bar Row',             sets:[{reps:10,weight:60},{reps:10,weight:60},{reps:8,weight:65}] },
      { name:'Single-Arm DB Row',     sets:[{reps:12,weight:36},{reps:12,weight:36},{reps:12,weight:36}] },
      { name:'Face Pull',             sets:[{reps:20,weight:20},{reps:20,weight:20},{reps:20,weight:20}] },
      { name:'Reverse Fly',           sets:[{reps:15,weight:8},{reps:15,weight:8},{reps:15,weight:8}] },
      { name:'Pullover',              sets:[{reps:12,weight:28},{reps:12,weight:28},{reps:12,weight:28}] },
    ]},
];

const DIFFICULTY_COLORS: any = {
  Easy:         { bg:'rgba(52,211,153,0.08)',  color:'#34d399', border:'rgba(52,211,153,0.2)'  },
  Intermediate: { bg:'rgba(0,212,255,0.08)',   color:'#00d4ff', border:'rgba(0,212,255,0.2)'   },
  Hard:         { bg:'rgba(251,113,133,0.08)', color:'#fb7185', border:'rgba(251,113,133,0.2)' },
};

const MUSCLE_COLORS: any = {
  Chest: '#fb7185', Back: '#00d4ff', Legs: '#c6f135', Shoulders: '#fbbf24',
  Arms: '#a78bfa', Core: '#34d399', 'Full Body': '#fb923c', Cardio: '#f472b6',
};

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff} days ago`;
  return new Date(d).toLocaleDateString('en-PK',{day:'numeric',month:'short'});
}

function totalVolume(log: any) {
  return (log.exercises || []).reduce((sum: number, ex: any) =>
    sum + (ex.sets || []).reduce((s: number, set: any) => s + (set.reps || 0) * (set.weight || 0), 0), 0
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function WorkoutHistoryPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs,    setLogs]    = useState<any[]>(DEMO_LOGS);
  const [filtered,setFiltered]= useState<any[]>(DEMO_LOGS);
  const [muscle,  setMuscle]  = useState('All');
  const [search,  setSearch]  = useState('');
  const [sort,    setSort]    = useState<'recent'|'duration'|'calories'|'volume'>('recent');
  const [viewing, setViewing] = useState<any>(null);
  const [logModal,setLogModal]= useState(false);
  const [newLog,  setNewLog]  = useState({ name:'', duration:'', caloriesBurned:'', difficulty:'Intermediate', muscleGroups:[] as string[], notes:'' });
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');
  const toastRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2800);
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/profile');
        setUser(data?.data || data);
      } catch { router.push('/login'); return; }
      try {
        const { data } = await API.get('/workouts/history?limit=100');
        const raw = data?.data || data?.workouts || [];
        if (Array.isArray(raw) && raw.length > 0) setLogs(raw);
      } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    let r = [...logs];
    if (muscle !== 'All') r = r.filter(l => l.muscleGroups?.includes(muscle));
    if (search.trim())    r = r.filter(l => l.name?.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'recent')   r.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sort === 'duration') r.sort((a,b) => (b.duration||0) - (a.duration||0));
    if (sort === 'calories') r.sort((a,b) => (b.caloriesBurned||0) - (a.caloriesBurned||0));
    if (sort === 'volume')   r.sort((a,b) => totalVolume(b) - totalVolume(a));
    setFiltered(r);
  }, [logs, muscle, search, sort]);

  /* Stats */
  const totalWorkouts  = logs.length;
  const totalMins      = logs.reduce((s,l) => s + (l.duration||0), 0);
  const totalCals      = logs.reduce((s,l) => s + (l.caloriesBurned||0), 0);
  const avgDuration    = totalWorkouts ? Math.round(totalMins / totalWorkouts) : 0;

  /* Streak calc */
  const sortedDates = [...new Set(logs.map(l => l.date))].sort((a,b) => b.localeCompare(a));
  let streak = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < sortedDates.length; i++) {
    const d = new Date(sortedDates[i]); d.setHours(0,0,0,0);
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (diff === i || diff === i + 1) streak++; else break;
  }

  const saveLog = async () => {
    if (!newLog.name || !newLog.duration) return;
    setSaving(true);
    const payload = { ...newLog, duration: Number(newLog.duration), caloriesBurned: Number(newLog.caloriesBurned), date: new Date().toISOString().split('T')[0], exercises: [] };
    try {
      const { data } = await API.post('/workouts/history', payload);
      const saved = data?.data || { ...payload, _id: `local_${Date.now()}` };
      setLogs(prev => [saved, ...prev]);
      showToast('✓ Workout logged!');
      setLogModal(false);
      setNewLog({ name:'', duration:'', caloriesBurned:'', difficulty:'Intermediate', muscleGroups:[], notes:'' });
    } catch {
      const local = { ...payload, _id: `local_${Date.now()}` };
      setLogs(prev => [local, ...prev]);
      showToast('✓ Workout saved locally!');
      setLogModal(false);
    }
    setSaving(false);
  };

  const toggleMuscle = (m: string) => {
    setNewLog(p => ({ ...p, muscleGroups: p.muscleGroups.includes(m) ? p.muscleGroups.filter(x=>x!==m) : [...p.muscleGroups, m] }));
  };

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#03050a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:44,height:44,border:'2px solid rgba(198,241,53,0.15)',borderTop:'2px solid #c6f135',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
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
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;opacity:0.4;}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideup{from{opacity:0;transform:translateY(24px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}

        .layout{display:flex;min-height:100vh;}
        .sidebar{width:260px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:28px 20px;position:fixed;top:0;left:0;bottom:0;overflow-y:auto;z-index:100;}
        .sidebar-logo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-bottom:36px;}
        .logo-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-0.5px;} .logo-text em{font-style:normal;color:var(--lime);}
        .nav-item{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;font-size:14px;font-weight:500;color:var(--sub);transition:all 0.2s;margin-bottom:2px;border:1px solid transparent;text-decoration:none;background:transparent;width:100%;text-align:left;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;}
        .nav-item:hover{color:var(--text);background:rgba(255,255,255,0.04);}
        .nav-item.active{color:var(--lime);background:rgba(198,241,53,0.08);border-color:rgba(198,241,53,0.12);}
        .sidebar-bottom{margin-top:auto;padding-top:20px;}
        .user-card{display:flex;align-items:center;gap:12px;padding:14px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid var(--line);margin-bottom:10px;}
        .btn-logout{width:100%;padding:11px;background:rgba(244,63,94,0.06);border:1px solid rgba(244,63,94,0.15);border-radius:10px;color:#fb7185;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;}
        .btn-logout:hover{background:rgba(244,63,94,0.12);}
        .main{margin-left:260px;flex:1;min-width:0;}
        .topbar{height:68px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 36px;background:rgba(3,5,10,0.85);backdrop-filter:blur(20px);position:sticky;top:0;z-index:50;}
        .topbar-title{font-size:18px;font-weight:700;letter-spacing:-0.5px;}
        .topbar-right{display:flex;gap:10px;align-items:center;}
        .back-btn{display:flex;align-items:center;gap:7px;padding:8px 16px;background:var(--panel);border:1px solid var(--line);border-radius:9px;color:var(--sub);font-size:13px;font-weight:600;text-decoration:none;transition:all 0.2s;}
        .back-btn:hover{color:var(--text);}
        .btn-log{padding:9px 20px;background:var(--lime);color:#000;font-size:13px;font-weight:800;border-radius:10px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;}
        .btn-log:hover{background:#d4ff45;box-shadow:0 0 20px rgba(198,241,53,0.35);}
        .content{padding:36px;animation:fadein 0.4s ease;}

        /* STATS */
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
        .stat-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;}
        .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
        .stat-val{font-size:26px;font-weight:900;letter-spacing:-1px;margin-bottom:3px;}
        .stat-lbl{font-size:11px;font-weight:700;color:var(--sub);letter-spacing:'0.5px';}
        .stat-sub{font-size:10px;color:var(--sub);margin-top:3px;}

        /* FILTERS */
        .filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;}
        .muscle-btn{padding:7px 14px;border-radius:100px;font-size:12px;font-weight:700;cursor:pointer;background:var(--panel);border:1px solid var(--line);color:var(--sub);transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;}
        .muscle-btn:hover{color:var(--text);}
        .muscle-btn.active{color:#000;}
        .controls{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
        .search-wrap{flex:1;min-width:200px;position:relative;}
        .search-wrap input{width:100%;padding:10px 16px 10px 38px;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all 0.2s;}
        .search-wrap input:focus{border-color:rgba(198,241,53,0.3);}
        .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--sub);pointer-events:none;}
        .sort-group{display:flex;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;}
        .sort-btn{padding:9px 14px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:none;color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;border-right:1px solid var(--line);}
        .sort-btn:last-child{border-right:none;}
        .sort-btn.active{color:var(--lime);background:rgba(198,241,53,0.06);}

        /* LOG CARDS */
        .logs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;}
        .log-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;overflow:hidden;cursor:pointer;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);animation:fadein 0.4s ease;}
        .log-card:hover{border-color:rgba(198,241,53,0.2);transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,0.4);}
        .log-stripe{height:4px;}
        .log-body{padding:18px;}
        .log-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;gap:8px;}
        .log-name{font-size:15px;font-weight:800;letter-spacing:-0.4px;line-height:1.3;}
        .log-date{font-size:11px;color:var(--sub);margin-top:3px;}
        .log-muscles{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;}
        .muscle-tag{padding:3px 9px;border-radius:6px;font-size:10px;font-weight:700;}
        .log-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;}
        .log-stat{background:rgba(255,255,255,0.02);border:1px solid var(--line);border-radius:9px;padding:9px;text-align:center;}
        .log-stat-val{font-size:16px;font-weight:900;letter-spacing:-0.5px;}
        .log-stat-lbl{font-size:9px;font-weight:600;color:var(--sub);letter-spacing:'0.5px';text-transform:uppercase;margin-top:2px;}
        .log-footer{display:flex;align-items:center;justify-content:space-between;}
        .log-mood{font-size:12px;color:var(--sub);}
        .log-exercises-count{font-size:11px;color:var(--sub);}

        /* DETAIL MODAL */
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.9);backdrop-filter:blur(24px);z-index:500;overflow-y:auto;animation:fadein 0.2s ease;}
        .modal-wrap{max-width:680px;margin:0 auto;padding:32px 20px 80px;}
        .modal-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;position:sticky;top:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(20px);padding:12px 0;z-index:10;}
        .modal-close-btn{display:flex;align-items:center;gap:7px;padding:8px 18px;background:var(--panel);border:1px solid var(--line);border-radius:9px;color:var(--sub);font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .detail-card{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:24px;margin-bottom:14px;position:relative;overflow:hidden;}
        .detail-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
        .exercise-row{padding:14px 0;border-bottom:1px solid var(--line);}
        .exercise-row:last-child{border-bottom:none;}
        .exercise-name{font-size:14px;font-weight:700;margin-bottom:8px;}
        .sets-row{display:flex;gap:8px;flex-wrap:wrap;}
        .set-pill{padding:4px 11px;border-radius:8px;font-size:11px;font-weight:600;background:rgba(255,255,255,0.04);border:1px solid var(--line);}
        .set-pill span{color:var(--cyan);}

        /* LOG MODAL */
        .log-modal{background:var(--panel);border:1px solid var(--line);border-radius:24px;width:100%;max-width:520px;padding:28px;animation:slideup 0.35s cubic-bezier(0.34,1.56,0.64,1);position:relative;max-height:90vh;overflow-y:auto;}
        .log-modal::-webkit-scrollbar{width:4px;}
        .log-modal::-webkit-scrollbar-thumb{background:rgba(198,241,53,0.2);border-radius:2px;}
        .field{margin-bottom:14px;}
        .field-label{font-size:11px;font-weight:700;letter-spacing:'1px';text-transform:uppercase;color:var(--sub);margin-bottom:7px;}
        .input{width:100%;padding:11px 14px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all 0.2s;}
        .input:focus{border-color:rgba(198,241,53,0.35);box-shadow:0 0 0 3px rgba(198,241,53,0.07);}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .muscle-picker{display:flex;gap:7px;flex-wrap:wrap;}
        .muscle-pick-btn{padding:6px 13px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid var(--line);background:rgba(255,255,255,0.03);color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;}
        .muscle-pick-btn.sel{color:#000;}
        .btn-save{width:100%;padding:13px;background:var(--lime);color:#000;font-size:14px;font-weight:900;border-radius:12px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;margin-top:6px;transition:all 0.2s;}
        .btn-save:hover{background:#d4ff45;}
        .btn-save:disabled{opacity:0.5;cursor:not-allowed;}
        .btn-cancel{width:100%;padding:11px;background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:12px;color:var(--sub);font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;margin-top:8px;}

        /* TOAST */
        .toast{position:fixed;bottom:28px;right:28px;z-index:2000;padding:13px 20px;border-radius:12px;font-size:13px;font-weight:700;background:rgba(198,241,53,0.12);border:1px solid rgba(198,241,53,0.3);color:var(--lime);animation:fadein 0.3s ease;}

        /* EMPTY */
        .empty{text-align:center;padding:60px 20px;background:var(--panel);border:1px solid var(--line);border-radius:18px;}
        .sec-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--sub);margin-bottom:14px;display:flex;align-items:center;gap:10px;}
        .sec-label::after{content:'';flex:1;height:1px;background:var(--line);}

        @media(max-width:900px){.sidebar{display:none}.main{margin-left:0}.content{padding:20px}.stats-row{grid-template-columns:repeat(2,1fr)}.logs-grid{grid-template-columns:1fr}}
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      {/* ══ LOG NEW WORKOUT MODAL ══ */}
      {logModal && (
        <div className="overlay" style={{display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={e=>{if(e.target===e.currentTarget)setLogModal(false);}}>
          <div className="log-modal" onClick={e=>e.stopPropagation()}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,borderRadius:'24px 24px 0 0',background:'linear-gradient(90deg,transparent,var(--lime),transparent)'}}/>
            <div style={{fontSize:18,fontWeight:900,letterSpacing:'-0.6px',marginBottom:4}}>📝 Log Workout</div>
            <div style={{fontSize:13,color:'var(--sub)',marginBottom:20}}>Record today's training session.</div>

            <div className="field">
              <div className="field-label">Workout Name</div>
              <input className="input" placeholder="e.g. Push Day — Chest & Shoulders" value={newLog.name} onChange={e=>setNewLog(p=>({...p,name:e.target.value}))}/>
            </div>
            <div className="two-col">
              <div className="field">
                <div className="field-label">Duration (mins)</div>
                <input className="input" type="number" placeholder="60" value={newLog.duration} onChange={e=>setNewLog(p=>({...p,duration:e.target.value}))}/>
              </div>
              <div className="field">
                <div className="field-label">Calories Burned</div>
                <input className="input" type="number" placeholder="450" value={newLog.caloriesBurned} onChange={e=>setNewLog(p=>({...p,caloriesBurned:e.target.value}))}/>
              </div>
            </div>
            <div className="field">
              <div className="field-label">Difficulty</div>
              <div style={{display:'flex',gap:8}}>
                {['Easy','Intermediate','Hard'].map(d=>{
                  const dc = DIFFICULTY_COLORS[d];
                  return <button key={d} className="muscle-pick-btn" style={newLog.difficulty===d?{background:dc.bg,color:dc.color,borderColor:dc.border}:{}} onClick={()=>setNewLog(p=>({...p,difficulty:d}))}>{d}</button>;
                })}
              </div>
            </div>
            <div className="field">
              <div className="field-label">Muscle Groups Worked</div>
              <div className="muscle-picker">
                {MUSCLE_GROUPS.filter(m=>m!=='All').map(m=>{
                  const c = MUSCLE_COLORS[m] || '#c6f135';
                  const sel = newLog.muscleGroups.includes(m);
                  return <button key={m} className={`muscle-pick-btn ${sel?'sel':''}`} style={sel?{background:`${c}18`,color:c,borderColor:`${c}40`}:{}} onClick={()=>toggleMuscle(m)}>{m}</button>;
                })}
              </div>
            </div>
            <div className="field">
              <div className="field-label">Notes (optional)</div>
              <textarea className="input" rows={3} placeholder="How did it go? Any PRs?" value={newLog.notes} onChange={e=>setNewLog(p=>({...p,notes:e.target.value}))} style={{resize:'vertical'}}/>
            </div>
            <button className="btn-save" disabled={!newLog.name || !newLog.duration || saving} onClick={saveLog}>
              {saving ? 'Saving…' : '✓ Save Workout'}
            </button>
            <button className="btn-cancel" onClick={()=>setLogModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ══ WORKOUT DETAIL MODAL ══ */}
      {viewing && !logModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setViewing(null);}}>
          <div className="modal-wrap">
            <div className="modal-topbar">
              <button className="modal-close-btn" onClick={()=>setViewing(null)}>← Back to History</button>
              <div style={{fontSize:12,color:'var(--sub)'}}>{timeAgo(viewing.date)}</div>
            </div>

            {/* Header card */}
            <div className="detail-card" style={{'--dc':'var(--lime)'} as any}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,transparent,var(--lime),transparent)'}}/>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14,gap:12}}>
                <div>
                  <div style={{fontSize:22,fontWeight:900,letterSpacing:'-0.8px',marginBottom:4}}>{viewing.name}</div>
                  <div style={{fontSize:12,color:'var(--sub)'}}>{new Date(viewing.date).toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
                </div>
                {(() => { const dc = DIFFICULTY_COLORS[viewing.difficulty] || DIFFICULTY_COLORS.Intermediate; return <span style={{padding:'4px 12px',borderRadius:100,fontSize:10,fontWeight:800,letterSpacing:'0.5px',textTransform:'uppercase',background:dc.bg,color:dc.color,border:`1px solid ${dc.border}`,flexShrink:0}}>{viewing.difficulty}</span>; })()}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
                {[
                  {icon:'⏱', val:`${viewing.duration}m`, lbl:'Duration'},
                  {icon:'🔥', val:`${viewing.caloriesBurned}`, lbl:'Calories'},
                  {icon:'💪', val:`${viewing.exercises?.length||0}`, lbl:'Exercises'},
                  {icon:'📦', val:`${(totalVolume(viewing)/1000).toFixed(1)}t`, lbl:'Volume'},
                ].map(s=>(
                  <div key={s.lbl} style={{background:'rgba(255,255,255,0.02)',border:'1px solid var(--line)',borderRadius:10,padding:'10px',textAlign:'center'}}>
                    <div style={{fontSize:16,marginBottom:3}}>{s.icon}</div>
                    <div style={{fontSize:18,fontWeight:900,letterSpacing:'-0.5px',color:'var(--lime)'}}>{s.val}</div>
                    <div style={{fontSize:9,fontWeight:600,color:'var(--sub)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:viewing.notes?12:0}}>
                {(viewing.muscleGroups||[]).map((m:string)=>{
                  const c = MUSCLE_COLORS[m]||'#c6f135';
                  return <span key={m} style={{padding:'4px 11px',borderRadius:8,fontSize:11,fontWeight:700,background:`${c}18`,color:c,border:`1px solid ${c}35`}}>{m}</span>;
                })}
              </div>
              {viewing.notes && <div style={{fontSize:13,color:'var(--sub)',fontStyle:'italic',marginTop:8,padding:'10px 12px',background:'rgba(255,255,255,0.02)',borderRadius:9,border:'1px solid var(--line)'}}> "{viewing.notes}"</div>}
            </div>

            {/* Exercises */}
            {(viewing.exercises||[]).length > 0 && (
              <div className="detail-card">
                <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,var(--cyan),transparent)'}}/>
                <div style={{fontSize:14,fontWeight:800,marginBottom:14}}>🏋️ Exercises</div>
                {viewing.exercises.map((ex:any, i:number)=>(
                  <div key={i} className="exercise-row">
                    <div className="exercise-name">{i+1}. {ex.name}</div>
                    <div className="sets-row">
                      {(ex.sets||[]).map((set:any,j:number)=>(
                        <div key={j} className="set-pill">
                          Set {j+1}: {set.note ? <span>{set.note}</span> : <><span>{set.reps} reps</span>{set.weight > 0 && <> @ <span>{set.weight}kg</span></>}</>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mood */}
            {viewing.mood && (
              <div style={{background:'var(--panel)',border:'1px solid var(--line)',borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20}}>{viewing.mood.split(' ')[0]}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700}}>Mood after workout</div>
                  <div style={{fontSize:13,color:'var(--sub)'}}>{viewing.mood}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="layout">
        <aside className="sidebar">
          <a className="sidebar-logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
          {[
            {icon:'⚡',label:'Dashboard',      href:'/dashboard'},
            {icon:'📊',label:'Progress',       href:'/progress'},
            {icon:'📝',label:'Log Today',      href:'/progress/log'},
            {icon:'🏋️',label:'Workouts',       href:'/workouts/generate'},
            {icon:'📋',label:'Workout History',href:'/workouts/history',active:true},
            {icon:'📅',label:'My Bookings',    href:'/bookings'},
            {icon:'👥',label:'Trainers',       href:'/trainers'},
            {icon:'🧬',label:'Nutritionists',  href:'/nutritionists'},
            {icon:'📍',label:'Gyms',           href:'/gym-packages'},
            {icon:'🥗',label:'Meal Plans',     href:'/meals'},
            {icon:'📰',label:'Articles',       href:'/articles'},
            {icon:'💊',label:'Supplements',    href:'/supplements'},
            {icon:'👤',label:'Profile',        href:'/profile'},
          ].map(n=>(
            <a key={n.label} className={`nav-item ${(n as any).active?'active':''}`} href={n.href}>
              <span style={{fontSize:16,width:20,textAlign:'center'}}>{n.icon}</span>{n.label}
            </a>
          ))}
          <div className="sidebar-bottom">
            <div className="user-card">
              <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,rgba(198,241,53,0.3),rgba(0,212,255,0.2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'var(--lime)'}}>{user?.name?.[0]?.toUpperCase()||'U'}</div>
              <div><div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{user?.name}</div><div style={{fontSize:10,color:'var(--sub)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:140,whiteSpace:'nowrap'}}>{user?.email}</div></div>
            </div>
            <button className="btn-logout" onClick={()=>{localStorage.removeItem('token');router.push('/login');}}>Sign out</button>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-title">📋 Workout History</div>
            <div className="topbar-right">
              <a className="back-btn" href="/dashboard">← Dashboard</a>
              <button className="btn-log" onClick={()=>setLogModal(true)}>+ Log Workout</button>
            </div>
          </div>

          <div className="content">
            {/* STATS */}
            <div className="stats-row">
              {[
                {icon:'🏋️', val:totalWorkouts, lbl:'Total Workouts',   sub:'all time',              color:'var(--lime)',   grad:'var(--lime)'},
                {icon:'🔥', val:`${streak}d`,  lbl:'Current Streak',   sub:'consecutive days',      color:'#fb7185',      grad:'var(--rose)'},
                {icon:'⏱',  val:`${totalMins}m`,lbl:'Total Time',      sub:`avg ${avgDuration}m/session`, color:'var(--cyan)',  grad:'var(--cyan)'},
                {icon:'💪', val:`${(totalCals/1000).toFixed(1)}k`,lbl:'Calories Burned',sub:'all sessions',color:'var(--amber)',grad:'var(--amber)'},
              ].map(s=>(
                <div key={s.lbl} className="stat-card">
                  <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${s.grad},transparent)`}}/>
                  <div style={{fontSize:24,marginBottom:8}}>{s.icon}</div>
                  <div className="stat-val" style={{color:s.color}}>{s.val}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* FILTERS */}
            <div className="filters">
              {MUSCLE_GROUPS.map(m=>(
                <button key={m} className={`muscle-btn ${muscle===m?'active':''}`}
                  style={muscle===m && m!=='All' ? {background:`${MUSCLE_COLORS[m]||'var(--lime)'}18`,color:MUSCLE_COLORS[m]||'var(--lime)',borderColor:`${MUSCLE_COLORS[m]||'var(--lime)'}40`} : muscle===m ? {background:'rgba(198,241,53,0.1)',color:'var(--lime)',borderColor:'rgba(198,241,53,0.3)'} : {}}
                  onClick={()=>setMuscle(m)}>
                  {m}
                  <span style={{fontSize:10,background:'rgba(255,255,255,0.05)',padding:'1px 5px',borderRadius:100,marginLeft:4}}>
                    {m==='All'?logs.length:logs.filter(l=>l.muscleGroups?.includes(m)).length}
                  </span>
                </button>
              ))}
            </div>

            {/* CONTROLS */}
            <div className="controls">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input placeholder="Search workouts…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div className="sort-group">
                {([['recent','🕐 Recent'],['duration','⏱ Duration'],['calories','🔥 Calories'],['volume','💪 Volume']] as const).map(([k,l])=>(
                  <button key={k} className={`sort-btn ${sort===k?'active':''}`} onClick={()=>setSort(k)}>{l}</button>
                ))}
              </div>
              <div style={{fontSize:13,color:'var(--sub)',whiteSpace:'nowrap',alignSelf:'center'}}>{filtered.length} session{filtered.length!==1?'s':''}</div>
            </div>

            {/* GRID */}
            {filtered.length===0
              ? <div className="empty">
                  <div style={{fontSize:48,marginBottom:12}}>🏋️</div>
                  <div style={{fontSize:18,fontWeight:800,marginBottom:6}}>No workouts found</div>
                  <div style={{fontSize:13,color:'var(--sub)',marginBottom:16}}>Start logging your sessions to track progress.</div>
                  <button className="btn-log" onClick={()=>setLogModal(true)}>+ Log Your First Workout</button>
                </div>
              : <>
                  <div className="sec-label">🏋️ Sessions</div>
                  <div className="logs-grid">
                    {filtered.map((log:any)=>{
                      const firstMuscle = log.muscleGroups?.[0];
                      const stripeColor = MUSCLE_COLORS[firstMuscle] || '#c6f135';
                      const dc = DIFFICULTY_COLORS[log.difficulty] || DIFFICULTY_COLORS.Intermediate;
                      return (
                        <div key={log._id} className="log-card" onClick={()=>setViewing(log)}>
                          <div className="log-stripe" style={{background:`linear-gradient(90deg,${stripeColor},transparent)`}}/>
                          <div className="log-body">
                            <div className="log-header">
                              <div>
                                <div className="log-name">{log.name}</div>
                                <div className="log-date">{timeAgo(log.date)} · {new Date(log.date).toLocaleDateString('en-PK',{weekday:'short',day:'numeric',month:'short'})}</div>
                              </div>
                              <span style={{padding:'3px 9px',borderRadius:100,fontSize:9,fontWeight:800,letterSpacing:'0.5px',textTransform:'uppercase',background:dc.bg,color:dc.color,border:`1px solid ${dc.border}`,flexShrink:0,whiteSpace:'nowrap'}}>{log.difficulty}</span>
                            </div>
                            <div className="log-muscles">
                              {(log.muscleGroups||[]).map((m:string)=>{
                                const c = MUSCLE_COLORS[m]||'#c6f135';
                                return <span key={m} className="muscle-tag" style={{background:`${c}18`,color:c,border:`1px solid ${c}30`}}>{m}</span>;
                              })}
                            </div>
                            <div className="log-stats">
                              <div className="log-stat"><div className="log-stat-val" style={{color:'var(--cyan)'}}>{log.duration}m</div><div className="log-stat-lbl">Duration</div></div>
                              <div className="log-stat"><div className="log-stat-val" style={{color:'#fb7185'}}>{log.caloriesBurned}</div><div className="log-stat-lbl">Calories</div></div>
                              <div className="log-stat"><div className="log-stat-val" style={{color:'#a78bfa'}}>{log.exercises?.length||0}</div><div className="log-stat-lbl">Exercises</div></div>
                            </div>
                            <div className="log-footer">
                              <span className="log-mood">{log.mood || '—'}</span>
                              <span className="log-exercises-count">Tap to view →</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>}
          </div>
        </main>
      </div>
    </>
  );
}