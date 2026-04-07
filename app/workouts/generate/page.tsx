'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

const GOALS = [
  { id:'muscle_gain', icon:'💪', label:'Muscle Gain',    desc:'Build size & strength' },
  { id:'fat_loss',    icon:'🔥', label:'Fat Loss',       desc:'Burn fat, stay lean' },
  { id:'strength',    icon:'🏋️', label:'Strength',       desc:'Get stronger lifts' },
  { id:'endurance',   icon:'⚡', label:'Endurance',      desc:'Cardio & stamina' },
  { id:'toning',      icon:'✨', label:'Toning',         desc:'Define & sculpt' },
  { id:'general',     icon:'🌿', label:'General Fitness',desc:'Overall health' },
];

const LEVELS = [
  { id:'beginner',     label:'Beginner',     desc:'0-1 year' },
  { id:'intermediate', label:'Intermediate', desc:'1-3 years' },
  { id:'advanced',     label:'Advanced',     desc:'3+ years' },
];

const EQUIPMENT = [
  { id:'gym',       icon:'🏋️', label:'Full Gym' },
  { id:'home',      icon:'🏠', label:'Home Gym' },
  { id:'bodyweight',icon:'🤸', label:'Bodyweight' },
  { id:'minimal',   icon:'🎗️', label:'Minimal' },
];

const FOCUS_AREAS = ['Chest','Back','Shoulders','Arms','Legs','Core','Glutes','Full Body'];
const DAY_OPTIONS = [3, 4, 5, 6];
const SESSION_OPTIONS = [30, 45, 60, 75, 90];

const MUSCLE_COLORS: Record<string, string> = {
  'Chest & Triceps':     '#f43f5e',
  'Back & Biceps':       '#00d4ff',
  'Shoulders & Arms':    '#a78bfa',
  'Legs & Glutes':       '#c6f135',
  'Push':                '#f59e0b',
  'Pull':                '#34d399',
  'Legs':                '#c6f135',
  'Full Body':           '#00d4ff',
  'Chest':               '#f43f5e',
  'Back':                '#00d4ff',
  'default':             '#8b5cf6',
};

const focusColor = (focus: string) => {
  for (const [key, color] of Object.entries(MUSCLE_COLORS)) {
    if (focus?.toLowerCase().includes(key.toLowerCase().split(' ')[0])) return color;
  }
  return MUSCLE_COLORS.default;
};

export default function WorkoutGeneratorPage() {
  const router = useRouter();
  const [user,        setUser]        = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [goal,        setGoal]        = useState('muscle_gain');
  const [level,       setLevel]       = useState('intermediate');
  const [equipment,   setEquipment]   = useState('gym');
  const [daysPerWeek, setDays]        = useState(4);
  const [sessionLen,  setSessionLen]  = useState(60);
  const [focusAreas,  setFocusAreas]  = useState<string[]>([]);
  const [injuries,    setInjuries]    = useState('');
  const [gender,      setGender]      = useState('male');
  const [generating,  setGenerating]  = useState(false);
  const [workout,     setWorkout]     = useState<any>(null);
  const [error,       setError]       = useState('');
  const [activeWeek,  setActiveWeek]  = useState(0);
  const [activeDay,   setActiveDay]   = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [toast,       setToast]       = useState('');
  const toastRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/profile');
        const u = data?.data || data;
        setUser(u);
        if (u?.gender) setGender(u.gender);
        if (u?.fitnessGoal) setGoal(u.fitnessGoal);
      } catch { router.push('/login'); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggleFocus = (area: string) => {
    setFocusAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const generate = async () => {
    setGenerating(true);
    setWorkout(null);
    setError('');
    setActiveWeek(0);
    setActiveDay(0);
    try {
      const { data } = await API.post('/workouts/generate', {
        goal, fitnessLevel: level, daysPerWeek,
        sessionLength: sessionLen, equipment,
        focus: focusAreas, injuries, gender,
      });
      setWorkout(data?.data);
      showToast('✓ Workout plan generated!');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message || 'Generation failed';
      setError(msg);
    }
    setGenerating(false);
  };

  const saveWorkout = async () => {
    if (!workout) return;
    setSaving(true);
    try {
      await API.post('/workouts/history', {
        name:     workout.name,
        notes:    workout.description,
        date:     new Date().toISOString(),
      });
      setSaved(true);
      showToast('✓ Workout saved to your history!');
    } catch { showToast('⚠ Could not save workout'); }
    setSaving(false);
  };

  const selectedGoal   = GOALS.find(g => g.id === goal);
  const currentWeek    = workout?.weeks?.[activeWeek];
  const currentDay     = currentWeek?.days?.[activeDay];
  const totalWeeks     = workout?.weeks?.length || 0;
  const totalDays      = currentWeek?.days?.length || 0;

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
        :root{--void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;--lime:#c6f135;--cyan:#00d4ff;--violet:#8b5cf6;--rose:#f43f5e;--amber:#f59e0b;--green:#34d399;--text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);}
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes loadbar{0%{width:0}50%{width:75%}100%{width:95%}}

        .nav{position:sticky;top:0;z-index:100;height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(3,5,10,.9);backdrop-filter:blur(24px);border-bottom:1px solid var(--line);}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .logo-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-.5px;}.logo-text em{font-style:normal;color:var(--lime);}
        .nav-right{display:flex;align-items:center;gap:10px;}
        .nav-a{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:600;color:var(--sub);text-decoration:none;transition:all .2s;}
        .nav-a:hover{color:var(--text);}
        .nav-dash{padding:8px 18px;border-radius:9px;background:var(--lime);color:#000;font-size:13px;font-weight:700;text-decoration:none;}

        .container{max-width:1100px;margin:0 auto;padding:36px 40px 80px;}

        /* PAGE HEADER */
        .ph{margin-bottom:36px;animation:fadein .5s ease;}
        .ph-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:100px;background:rgba(198,241,53,.07);border:1px solid rgba(198,241,53,.18);font-size:11.5px;font-weight:700;color:var(--lime);letter-spacing:.5px;margin-bottom:16px;}
        .ph-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--lime);animation:pulse 2s infinite;}
        .ph-title{font-size:clamp(30px,4vw,48px);font-weight:900;letter-spacing:-2px;line-height:1;margin-bottom:10px;}
        .ph-title em{font-style:normal;color:var(--lime);}
        .ph-sub{font-size:14px;color:var(--sub);font-weight:300;line-height:1.7;}

        /* TWO COL */
        .two-col{display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start;}

        /* FORM CARD */
        .fc{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:26px;margin-bottom:16px;position:relative;overflow:hidden;}
        .fc::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--lime),transparent);}
        .fc-title{font-size:14px;font-weight:800;letter-spacing:-.3px;margin-bottom:18px;}

        /* GOAL GRID */
        .goal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
        .goal-card{padding:13px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid var(--line);cursor:pointer;transition:all .2s;text-align:center;}
        .goal-card:hover{border-color:rgba(255,255,255,.08);}
        .goal-card.on{background:rgba(198,241,53,.07);border-color:rgba(198,241,53,.25);}
        .goal-icon{font-size:20px;margin-bottom:5px;}
        .goal-label{font-size:12.5px;font-weight:700;margin-bottom:2px;}
        .goal-desc{font-size:10px;color:var(--sub);}

        /* LEVEL */
        .level-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
        .level-card{padding:12px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid var(--line);cursor:pointer;transition:all .2s;text-align:center;}
        .level-card.on{background:rgba(198,241,53,.07);border-color:rgba(198,241,53,.25);}
        .level-label{font-size:13px;font-weight:700;margin-bottom:2px;}
        .level-desc{font-size:10px;color:var(--sub);}

        /* EQUIPMENT */
        .equip-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
        .equip-card{padding:11px 8px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid var(--line);cursor:pointer;transition:all .2s;text-align:center;}
        .equip-card.on{background:rgba(198,241,53,.07);border-color:rgba(198,241,53,.25);}
        .equip-icon{font-size:18px;margin-bottom:5px;}
        .equip-label{font-size:11px;font-weight:700;}

        /* FOCUS AREAS */
        .focus-grid{display:flex;gap:7px;flex-wrap:wrap;}
        .focus-tag{padding:7px 14px;border-radius:100px;font-size:12px;font-weight:700;cursor:pointer;background:rgba(255,255,255,.03);border:1px solid var(--line);color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .focus-tag:hover{color:var(--text);}
        .focus-tag.on{background:rgba(198,241,53,.09);color:var(--lime);border-color:rgba(198,241,53,.22);}

        /* SLIDERS */
        .slider-row{display:flex;gap:12px;flex-wrap:wrap;}
        .slider-group{flex:1;min-width:180px;}
        .slider-label{font-size:10.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--sub);margin-bottom:8px;display:flex;justify-content:space-between;}
        .slider-val{color:var(--lime);font-weight:800;}
        .slider-btns{display:flex;gap:6px;flex-wrap:wrap;}
        .s-btn{padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer;background:rgba(255,255,255,.03);border:1px solid var(--line);color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .s-btn.on{background:rgba(198,241,53,.09);color:var(--lime);border-color:rgba(198,241,53,.22);}

        /* GENDER */
        .gender-row{display:flex;gap:8px;}
        .g-btn{flex:1;padding:10px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid var(--line);cursor:pointer;text-align:center;font-size:12.5px;font-weight:700;color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .g-btn.on{background:rgba(198,241,53,.07);color:var(--lime);border-color:rgba(198,241,53,.25);}

        /* INPUT */
        .inp{width:100%;padding:11px 14px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all .2s;}
        .inp:focus{border-color:rgba(198,241,53,.3);}
        .inp::placeholder{color:var(--sub);}

        /* GENERATE BTN */
        .gen-btn{width:100%;padding:15px;background:linear-gradient(135deg,var(--lime),var(--cyan));color:#000;font-size:15px;font-weight:900;border-radius:13px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;display:flex;align-items:center;justify-content:center;gap:10px;}
        .gen-btn:hover:not(:disabled){box-shadow:0 0 36px rgba(198,241,53,.4);transform:translateY(-2px);}
        .gen-btn:disabled{opacity:.6;cursor:not-allowed;}

        /* SIDEBAR */
        .sidebar-card{background:var(--panel);border:1px solid rgba(198,241,53,.12);border-radius:18px;padding:22px;margin-bottom:16px;position:relative;overflow:hidden;}
        .sidebar-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(198,241,53,.4),transparent);}
        .sum-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px;}
        .sum-row:last-child{border-bottom:none;}
        .sum-lbl{color:var(--sub);}
        .sum-val{font-weight:700;}

        /* GENERATING */
        .gen-box{background:var(--panel);border:1px solid rgba(198,241,53,.15);border-radius:20px;padding:40px;text-align:center;margin-top:20px;animation:fadein .4s ease;}
        .gen-icon{font-size:48px;margin-bottom:14px;animation:pulse 1.5s infinite;}
        .gen-title{font-size:20px;font-weight:800;letter-spacing:-.5px;margin-bottom:8px;}
        .gen-sub{font-size:13px;color:var(--sub);margin-bottom:24px;}
        .gen-bar-wrap{height:3px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden;width:280px;margin:0 auto;}
        .gen-bar{height:100%;background:linear-gradient(90deg,var(--lime),var(--cyan));border-radius:2px;animation:loadbar 3s ease infinite;}

        /* ERROR */
        .error-box{background:rgba(244,63,94,.06);border:1px solid rgba(244,63,94,.2);border-radius:14px;padding:20px;margin-top:16px;font-size:13px;color:#fb7185;line-height:1.65;}

        /* WORKOUT RESULT */
        .result{margin-top:28px;animation:fadein .5s ease;}
        .result-header{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:24px;margin-bottom:16px;position:relative;overflow:hidden;}
        .result-header::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--lime),var(--cyan),var(--violet));}
        .result-name{font-size:22px;font-weight:900;letter-spacing:-.8px;margin-bottom:6px;}
        .result-desc{font-size:13.5px;color:var(--sub);line-height:1.65;margin-bottom:18px;}
        .result-meta{display:flex;gap:10px;flex-wrap:wrap;}
        .r-meta-pill{padding:5px 13px;border-radius:100px;font-size:11.5px;font-weight:700;background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--sub);}
        .result-actions{display:flex;gap:10px;margin-top:18px;}
        .action-btn{padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;border:1px solid;}
        .action-lime{background:var(--lime);color:#000;border-color:var(--lime);}
        .action-lime:hover{background:#d4ff45;}
        .action-outline{background:transparent;color:var(--sub);border-color:var(--line);}
        .action-outline:hover{color:var(--text);}

        /* WEEK / DAY TABS */
        .week-tabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;}
        .wtab{padding:7px 16px;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer;background:var(--panel);border:1px solid var(--line);color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .wtab.on{background:rgba(198,241,53,.09);color:var(--lime);border-color:rgba(198,241,53,.22);}
        .day-tabs{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;}
        .dtab{padding:6px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;background:var(--panel2);border:1px solid var(--line);color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .dtab.on{background:rgba(0,212,255,.09);color:var(--cyan);border-color:rgba(0,212,255,.25);}

        /* SESSION CARD */
        .session-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;overflow:hidden;animation:slideIn .3s ease;}
        .session-head{padding:18px 22px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;}
        .session-focus{font-size:16px;font-weight:800;letter-spacing:-.4px;}
        .session-meta{font-size:12px;color:var(--sub);}
        .session-badge{padding:4px 12px;border-radius:100px;font-size:11px;font-weight:700;}

        /* PHASE SECTIONS */
        .phase{padding:14px 22px;border-bottom:1px solid var(--line);}
        .phase:last-child{border-bottom:none;}
        .phase-label{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--sub);margin-bottom:10px;}

        /* EXERCISE ROW */
        .ex-row{display:flex;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid rgba(0,212,255,.04);}
        .ex-row:last-child{border-bottom:none;}
        .ex-num{width:28px;height:28px;border-radius:7px;background:rgba(198,241,53,.08);border:1px solid rgba(198,241,53,.15);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--lime);flex-shrink:0;margin-top:2px;}
        .ex-info{flex:1;}
        .ex-name{font-size:14px;font-weight:700;margin-bottom:4px;}
        .ex-details{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:4px;}
        .ex-detail{font-size:11px;font-weight:600;padding:2px 8px;border-radius:5px;background:rgba(255,255,255,.04);color:var(--sub);}
        .ex-tip{font-size:12px;color:var(--sub);font-style:italic;line-height:1.5;}

        /* NUTRITION CARD */
        .nutr-card{background:var(--panel);border:1px solid rgba(0,212,255,.1);border-radius:16px;padding:20px;margin-top:14px;}
        .nutr-title{font-size:14px;font-weight:800;margin-bottom:12px;color:var(--cyan);}
        .nutr-row{display:flex;justify-content:space-between;font-size:13px;padding:7px 0;border-bottom:1px solid var(--line);}
        .nutr-row:last-child{border-bottom:none;}
        .nutr-lbl{color:var(--sub);}
        .nutr-val{font-weight:600;color:var(--text);}

        /* TIPS */
        .tips-card{background:rgba(198,241,53,.03);border:1px solid rgba(198,241,53,.1);border-radius:14px;padding:18px;margin-top:14px;}
        .tip-item{display:flex;gap:8px;font-size:13px;color:var(--sub);line-height:1.65;margin-bottom:8px;}
        .tip-item:last-child{margin-bottom:0;}
        .tip-check{color:var(--lime);flex-shrink:0;font-weight:700;}

        /* TOAST */
        .toast{position:fixed;bottom:24px;right:24px;z-index:2000;padding:12px 18px;border-radius:11px;font-size:12.5px;font-weight:700;background:rgba(198,241,53,.12);border:1px solid rgba(198,241,53,.3);color:var(--lime);animation:toastIn .3s ease;}

        @media(max-width:900px){.two-col{grid-template-columns:1fr}.goal-grid{grid-template-columns:repeat(2,1fr)}.equip-row{grid-template-columns:repeat(2,1fr)}.container{padding:20px 16px 60px}.nav{padding:0 20px}}
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      {/* NAV */}
      <nav className="nav">
        <a className="logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
        <div className="nav-right">
          <a className="nav-a" href="/dashboard">← Dashboard</a>
          <a className="nav-a" href="/workouts/history">📋 History</a>
          <a className="nav-dash" href="/meals">🥗 Meals</a>
        </div>
      </nav>

      <div className="container">
        {/* HEADER */}
        <div className="ph">
          <div className="ph-badge"><span className="ph-badge-dot"/>🤖 Powered by Groq · Llama3 · Free</div>
          <h1 className="ph-title">AI <em>Workout</em><br />Generator</h1>
          <p className="ph-sub">Tell us your goals and the AI builds a complete multi-week program with exercises, sets, reps, and technique tips — free, no API credits needed.</p>
        </div>

        <div className="two-col">
          {/* FORM */}
          <div>
            {/* GOAL */}
            <div className="fc">
              <div className="fc-title">🎯 Your Goal</div>
              <div className="goal-grid">
                {GOALS.map(g => (
                  <div key={g.id} className={`goal-card ${goal===g.id?'on':''}`} onClick={()=>setGoal(g.id)}>
                    <div className="goal-icon">{g.icon}</div>
                    <div className="goal-label" style={{color:goal===g.id?'var(--lime)':'var(--text)'}}>{g.label}</div>
                    <div className="goal-desc">{g.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* LEVEL + GENDER */}
            <div className="fc">
              <div className="fc-title">💪 Fitness Level & Gender</div>
              <div className="level-row" style={{marginBottom:14}}>
                {LEVELS.map(l => (
                  <div key={l.id} className={`level-card ${level===l.id?'on':''}`} onClick={()=>setLevel(l.id)}>
                    <div className="level-label" style={{color:level===l.id?'var(--lime)':'var(--text)'}}>{l.label}</div>
                    <div className="level-desc">{l.desc}</div>
                  </div>
                ))}
              </div>
              <div className="gender-row">
                <button className={`g-btn ${gender==='male'?'on':''}`} onClick={()=>setGender('male')}>♂ Male</button>
                <button className={`g-btn ${gender==='female'?'on':''}`} onClick={()=>setGender('female')}>♀ Female</button>
              </div>
            </div>

            {/* EQUIPMENT */}
            <div className="fc">
              <div className="fc-title">🏋️ Equipment Available</div>
              <div className="equip-row">
                {EQUIPMENT.map(e => (
                  <div key={e.id} className={`equip-card ${equipment===e.id?'on':''}`} onClick={()=>setEquipment(e.id)}>
                    <div className="equip-icon">{e.icon}</div>
                    <div className="equip-label" style={{color:equipment===e.id?'var(--lime)':'var(--text)'}}>{e.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SCHEDULE */}
            <div className="fc">
              <div className="fc-title">📅 Schedule</div>
              <div className="slider-row">
                <div className="slider-group">
                  <div className="slider-label">Days per week <span className="slider-val">{daysPerWeek} days</span></div>
                  <div className="slider-btns">
                    {DAY_OPTIONS.map(d => (
                      <button key={d} className={`s-btn ${daysPerWeek===d?'on':''}`} onClick={()=>setDays(d)}>{d} days</button>
                    ))}
                  </div>
                </div>
                <div className="slider-group">
                  <div className="slider-label">Session length <span className="slider-val">{sessionLen} min</span></div>
                  <div className="slider-btns">
                    {SESSION_OPTIONS.map(s => (
                      <button key={s} className={`s-btn ${sessionLen===s?'on':''}`} onClick={()=>setSessionLen(s)}>{s}m</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FOCUS + INJURIES */}
            <div className="fc">
              <div className="fc-title">🎯 Focus Areas (optional)</div>
              <div className="focus-grid" style={{marginBottom:16}}>
                {FOCUS_AREAS.map(a => (
                  <button key={a} className={`focus-tag ${focusAreas.includes(a)?'on':''}`} onClick={()=>toggleFocus(a)}>{a}</button>
                ))}
              </div>
              <div style={{fontSize:10.5,fontWeight:700,letterSpacing:'.5px',textTransform:'uppercase',color:'var(--sub)',marginBottom:8}}>Injuries / Limitations</div>
              <input className="inp" placeholder="e.g. bad knees, shoulder injury, lower back pain…" value={injuries} onChange={e=>setInjuries(e.target.value)}/>
            </div>

            <button className="gen-btn" onClick={generate} disabled={generating}>
              {generating
                ? <><div style={{width:18,height:18,border:'2px solid rgba(0,0,0,.2)',borderTop:'2px solid #000',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Generating your program…</>
                : '🤖 Generate AI Workout Program'}
            </button>

            {/* GENERATING STATE */}
            {generating && (
              <div className="gen-box">
                <div className="gen-icon">🏋️</div>
                <div className="gen-title">Building your program…</div>
                <div className="gen-sub">Groq AI is creating a {daysPerWeek}-day {selectedGoal?.label} program for you</div>
                <div className="gen-bar-wrap"><div className="gen-bar"/></div>
              </div>
            )}

            {/* ERROR */}
            {error && !generating && (
              <div className="error-box">
                ⚠ {error}
                <div style={{marginTop:10,fontSize:12}}>
                  Make sure <code>GROQ_API_KEY</code> is in your <code>.env</code> file and you ran <code>npm install groq-sdk</code>
                </div>
              </div>
            )}

            {/* WORKOUT RESULT */}
            {workout && !generating && (
              <div className="result">
                {/* HEADER */}
                <div className="result-header">
                  <div className="result-name">{workout.name}</div>
                  <p className="result-desc">{workout.description}</p>
                  <div className="result-meta">
                    {workout.daysPerWeek && <span className="r-meta-pill">📅 {workout.daysPerWeek} days/week</span>}
                    {workout.sessionLength && <span className="r-meta-pill">⏱ {workout.sessionLength} min/session</span>}
                    {workout.fitnessLevel && <span className="r-meta-pill">💪 {workout.fitnessLevel}</span>}
                    {workout.equipment && <span className="r-meta-pill">🏋️ {workout.equipment}</span>}
                    <span className="r-meta-pill" style={{color:'var(--lime)',borderColor:'rgba(198,241,53,.2)',background:'rgba(198,241,53,.05)'}}>🤖 AI Generated</span>
                  </div>
                  <div className="result-actions">
                    <button className="action-btn action-lime" onClick={generate}>↻ Regenerate</button>
                    <button className="action-btn action-outline" onClick={saveWorkout} disabled={saving||saved}>
                      {saved ? '✓ Saved!' : saving ? '⏳ Saving…' : '💾 Save to History'}
                    </button>
                  </div>
                </div>

                {/* WEEK TABS */}
                {totalWeeks > 1 && (
                  <div className="week-tabs">
                    {workout.weeks.map((_:any, i:number) => (
                      <button key={i} className={`wtab ${activeWeek===i?'on':''}`} onClick={()=>{setActiveWeek(i);setActiveDay(0);}}>
                        Week {i+1}
                      </button>
                    ))}
                  </div>
                )}

                {/* DAY TABS */}
                {currentWeek?.days && (
                  <div className="day-tabs">
                    {currentWeek.days.map((d:any, i:number) => (
                      <button key={i} className={`dtab ${activeDay===i?'on':''}`} onClick={()=>setActiveDay(i)}>
                        {d.day || `Day ${i+1}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* SESSION */}
                {currentDay && (
                  <div className="session-card">
                    <div className="session-head">
                      <div>
                        <div className="session-focus" style={{color:focusColor(currentDay.focus)}}>{currentDay.focus}</div>
                        <div className="session-meta">{currentDay.estimatedCalories && `~${currentDay.estimatedCalories} kcal burned`}</div>
                      </div>
                      <div className="session-badge" style={{background:`${focusColor(currentDay.focus)}18`,color:focusColor(currentDay.focus),border:`1px solid ${focusColor(currentDay.focus)}30`}}>
                        {currentDay.day}
                      </div>
                    </div>

                    {/* WARM UP */}
                    {currentDay.warmup && (
                      <div className="phase">
                        <div className="phase-label">🌅 Warm Up</div>
                        <div style={{fontSize:13,color:'var(--sub)'}}>{currentDay.warmup}</div>
                      </div>
                    )}

                    {/* EXERCISES */}
                    {currentDay.exercises?.length > 0 && (
                      <div className="phase">
                        <div className="phase-label">🏋️ Exercises</div>
                        {currentDay.exercises.map((ex:any, i:number) => (
                          <div className="ex-row" key={i}>
                            <div className="ex-num">{i+1}</div>
                            <div className="ex-info">
                              <div className="ex-name">{ex.name}</div>
                              <div className="ex-details">
                                {ex.sets && <span className="ex-detail">📊 {ex.sets} sets</span>}
                                {ex.reps && <span className="ex-detail">🔁 {ex.reps} reps</span>}
                                {ex.rest && <span className="ex-detail">⏱ {ex.rest} rest</span>}
                                {ex.duration && <span className="ex-detail">⏱ {ex.duration}</span>}
                              </div>
                              {ex.tip && <div className="ex-tip">💡 {ex.tip}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* COOLDOWN */}
                    {currentDay.cooldown && (
                      <div className="phase">
                        <div className="phase-label">🧘 Cooldown</div>
                        <div style={{fontSize:13,color:'var(--sub)'}}>{currentDay.cooldown}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* NUTRITION */}
                {workout.nutrition && (
                  <div className="nutr-card">
                    <div className="nutr-title">🥗 Nutrition Guidance</div>
                    {Object.entries(workout.nutrition).map(([k,v]:any) => (
                      <div className="nutr-row" key={k}>
                        <span className="nutr-lbl">{k.replace(/([A-Z])/g,' $1').replace(/^./,(s:string)=>s.toUpperCase())}</span>
                        <span className="nutr-val">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* TIPS */}
                {workout.tips?.length > 0 && (
                  <div className="tips-card">
                    <div style={{fontSize:13,fontWeight:800,marginBottom:10}}>💡 Program Tips</div>
                    {workout.tips.map((t:string, i:number) => (
                      <div className="tip-item" key={i}><span className="tip-check">✓</span>{t}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div>
            <div className="sidebar-card">
              <div style={{fontWeight:800,fontSize:14,marginBottom:14}}>📋 Program Summary</div>
              <div className="sum-row"><span className="sum-lbl">Goal</span><span className="sum-val" style={{color:'var(--lime)'}}>{selectedGoal?.icon} {selectedGoal?.label}</span></div>
              <div className="sum-row"><span className="sum-lbl">Level</span><span className="sum-val">{LEVELS.find(l=>l.id===level)?.label}</span></div>
              <div className="sum-row"><span className="sum-lbl">Equipment</span><span className="sum-val">{EQUIPMENT.find(e=>e.id===equipment)?.label}</span></div>
              <div className="sum-row"><span className="sum-lbl">Days/week</span><span className="sum-val">{daysPerWeek}</span></div>
              <div className="sum-row"><span className="sum-lbl">Per session</span><span className="sum-val">{sessionLen} min</span></div>
              <div className="sum-row"><span className="sum-lbl">Gender</span><span className="sum-val">{gender === 'male' ? '♂ Male' : '♀ Female'}</span></div>
              {focusAreas.length > 0 && <div className="sum-row"><span className="sum-lbl">Focus</span><span className="sum-val" style={{fontSize:11,textAlign:'right',maxWidth:140,lineHeight:1.4}}>{focusAreas.join(', ')}</span></div>}
            </div>

            <div className="fc" style={{background:'rgba(198,241,53,.03)',borderColor:'rgba(198,241,53,.1)'}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>🤖 Powered by Groq</div>
              {[
                'Completely FREE — no API credits needed',
                'Llama3 AI — Meta\'s most capable model',
                '10x faster than ChatGPT',
                'Saves your plan to workout history',
                'Regenerate unlimited times',
              ].map(t => (
                <div key={t} style={{display:'flex',gap:8,marginBottom:8,fontSize:12.5,color:'var(--sub)',lineHeight:1.6}}>
                  <span style={{color:'var(--lime)',flexShrink:0}}>✓</span>{t}
                </div>
              ))}
            </div>

            {workout && (
              <div className="fc">
                <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>🔗 Next Steps</div>
                <a href="/meals" style={{display:'block',padding:'10px 14px',background:'rgba(198,241,53,.06)',border:'1px solid rgba(198,241,53,.15)',borderRadius:10,fontSize:13,fontWeight:700,color:'var(--lime)',textDecoration:'none',marginBottom:8}}>
                  🥗 Generate Meal Plan →
                </a>
                <a href="/trainers" style={{display:'block',padding:'10px 14px',background:'rgba(0,212,255,.06)',border:'1px solid rgba(0,212,255,.15)',borderRadius:10,fontSize:13,fontWeight:700,color:'var(--cyan)',textDecoration:'none',marginBottom:8}}>
                  👥 Book a Trainer →
                </a>
                <a href="/progress/log" style={{display:'block',padding:'10px 14px',background:'rgba(255,255,255,.03)',border:'1px solid var(--line)',borderRadius:10,fontSize:13,fontWeight:700,color:'var(--sub)',textDecoration:'none'}}>
                  📊 Log Progress →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}