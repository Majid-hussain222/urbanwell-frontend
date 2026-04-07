'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

/* ─── Formula helpers ────────────────────────────────────── */
function calcBMI(weight: number, height: number) {
  // height in cm, weight in kg
  const h = height / 100;
  return weight / (h * h);
}

function getBMICategory(bmi: number) {
  if (bmi < 16)   return { label: 'Severely Underweight', color: '#60a5fa', emoji: '⚠️' };
  if (bmi < 18.5) return { label: 'Underweight',          color: '#93c5fd', emoji: '📉' };
  if (bmi < 25)   return { label: 'Normal Weight',         color: '#c6f135', emoji: '✅' };
  if (bmi < 30)   return { label: 'Overweight',            color: '#fbbf24', emoji: '📈' };
  if (bmi < 35)   return { label: 'Obese Class I',         color: '#fb923c', emoji: '⚠️' };
  if (bmi < 40)   return { label: 'Obese Class II',        color: '#f87171', emoji: '⚠️' };
  return               { label: 'Obese Class III',         color: '#ef4444', emoji: '🚨' };
}

function calcBMR(weight: number, height: number, age: number, gender: string) {
  // Mifflin-St Jeor equation (most accurate)
  if (gender === 'male')
    return 10 * weight + 6.25 * height - 5 * age + 5;
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

const ACTIVITY_LEVELS = [
  { key: 'sedentary',    label: 'Sedentary',       sub: 'Little/no exercise',           mult: 1.2   },
  { key: 'light',        label: 'Lightly Active',  sub: '1–3 days/week',                mult: 1.375 },
  { key: 'moderate',     label: 'Moderately Active',sub: '3–5 days/week',               mult: 1.55  },
  { key: 'very',         label: 'Very Active',      sub: '6–7 days/week',               mult: 1.725 },
  { key: 'extra',        label: 'Extra Active',     sub: 'Athlete / physical job',       mult: 1.9   },
];

const GOALS = [
  { key: 'extreme_loss', label: 'Extreme Loss',  adj: -1000, desc: '-1kg/week' },
  { key: 'loss',         label: 'Weight Loss',   adj: -500,  desc: '-0.5kg/week' },
  { key: 'mild_loss',    label: 'Mild Loss',     adj: -250,  desc: '-0.25kg/week' },
  { key: 'maintain',     label: 'Maintain',      adj: 0,     desc: 'No change' },
  { key: 'mild_gain',    label: 'Mild Gain',     adj: +250,  desc: '+0.25kg/week' },
  { key: 'gain',         label: 'Muscle Gain',   adj: +500,  desc: '+0.5kg/week' },
  { key: 'extreme_gain', label: 'Fast Gain',     adj: +1000, desc: '+1kg/week' },
];

/* ════════════════════════════════════════════════════════════ */
export default function CalculatorPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');
  const toastRef = useRef<any>(null);

  // Inputs
  const [age,      setAge]      = useState('');
  const [gender,   setGender]   = useState('male');
  const [weight,   setWeight]   = useState('');
  const [height,   setHeight]   = useState('');
  const [activity, setActivity] = useState('moderate');
  const [goal,     setGoal]     = useState('maintain');
  const [unit,     setUnit]     = useState<'metric'|'imperial'>('metric');

  // Converted inputs (always metric internally)
  const [weightLbs, setWeightLbs] = useState('');
  const [heightFt,  setHeightFt]  = useState('');
  const [heightIn,  setHeightIn]  = useState('');

  // Results
  const [results,   setResults]   = useState<any>(null);
  const [calculated,setCalculated]= useState(false);

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
        // Pre-fill from profile
        if (u?.age)    setAge(String(u.age));
        if (u?.gender) setGender(u.gender);
        if (u?.weight) setWeight(String(u.weight));
        if (u?.height) setHeight(String(u.height));
      } catch { router.push('/login'); }
      finally  { setLoading(false); }
    })();
  }, []);

  // Unit conversion sync
  const handleWeightLbs = (v: string) => {
    setWeightLbs(v);
    if (v) setWeight(String(Math.round(Number(v) * 0.453592 * 10) / 10));
  };
  const handleWeightKg = (v: string) => {
    setWeight(v);
    if (v) setWeightLbs(String(Math.round(Number(v) * 2.20462 * 10) / 10));
  };
  const handleHeightImperial = (ft: string, inch: string) => {
    setHeightFt(ft); setHeightIn(inch);
    const total = (Number(ft || 0) * 12 + Number(inch || 0)) * 2.54;
    if (total > 0) setHeight(String(Math.round(total)));
  };
  const handleHeightCm = (v: string) => {
    setHeight(v);
    if (v) {
      const totalIn = Number(v) / 2.54;
      setHeightFt(String(Math.floor(totalIn / 12)));
      setHeightIn(String(Math.round(totalIn % 12)));
    }
  };

  const calculate = () => {
    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);
    if (!w || !h || !a || w < 20 || h < 100 || a < 10) return;

    const bmi     = calcBMI(w, h);
    const bmr     = calcBMR(w, h, a, gender);
    const actMult = ACTIVITY_LEVELS.find(x => x.key === activity)?.mult || 1.55;
    const tdee    = bmr * actMult;
    const goalAdj = GOALS.find(x => x.key === goal)?.adj || 0;
    const target  = tdee + goalAdj;

    // Macros based on goal
    let proteinPct = 0.30, carbPct = 0.40, fatPct = 0.30;
    if (goal === 'loss' || goal === 'extreme_loss' || goal === 'mild_loss') {
      proteinPct = 0.35; carbPct = 0.35; fatPct = 0.30;
    } else if (goal === 'gain' || goal === 'extreme_gain' || goal === 'mild_gain') {
      proteinPct = 0.25; carbPct = 0.50; fatPct = 0.25;
    }

    const protein = Math.round((target * proteinPct) / 4);
    const carbs   = Math.round((target * carbPct) / 4);
    const fat     = Math.round((target * fatPct) / 9);

    // Ideal weight range (BMI 18.5–24.9)
    const hM = h / 100;
    const idealMin = Math.round(18.5 * hM * hM);
    const idealMax = Math.round(24.9 * hM * hM);

    // Water intake recommendation (ml)
    const water = Math.round(w * 35);

    setResults({ bmi, bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.round(target), protein, carbs, fat, idealMin, idealMax, water, bmiCat: getBMICategory(bmi) });
    setCalculated(true);
  };

  const saveToProfile = async () => {
    if (!results) return;
    setSaving(true);
    try {
      await API.put('/users/profile', {
        weight: Number(weight),
        height: Number(height),
        age:    Number(age),
        gender,
        calorieGoal:  results.target,
        proteinGoal:  results.protein,
        waterGoal:    results.water,
        fitnessGoal:  goal === 'loss' || goal === 'extreme_loss' ? 'weight_loss'
                    : goal === 'gain' ? 'muscle_gain'
                    : 'general',
      });
      showToast('✓ Saved to your profile! Goals updated.');
    } catch {
      showToast('⚠ Could not save — profile updated locally.');
    }
    setSaving(false);
  };

  const bmiPct = results ? Math.min(100, Math.max(0, ((results.bmi - 10) / 30) * 100)) : 0;

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
        :root{--void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;--lime:#c6f135;--cyan:#00d4ff;--violet:#8b5cf6;--rose:#f43f5e;--amber:#f59e0b;--text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);}
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes fillbar{from{width:0}to{width:var(--w)}}
        @keyframes countup{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}

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
        .uav{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,rgba(198,241,53,.3),rgba(0,212,255,.2));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--lime);flex-shrink:0;}
        .logout-btn{width:100%;padding:9px;background:rgba(244,63,94,.05);border:1px solid rgba(244,63,94,.12);border-radius:9px;color:#fb7185;font-size:12px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}

        .main{margin-left:258px;flex:1;min-width:0;}
        .topbar{height:64px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 30px;background:rgba(3,5,10,.9);backdrop-filter:blur(20px);position:sticky;top:0;z-index:50;}
        .topbar-title{font-size:17px;font-weight:700;letter-spacing:-.5px;}
        .back-btn{padding:7px 14px;background:var(--panel);border:1px solid var(--line);border-radius:9px;color:var(--sub);font-size:12px;font-weight:600;text-decoration:none;transition:all .2s;}
        .back-btn:hover{color:var(--text);}
        .content{padding:30px;max-width:900px;margin:0 auto;animation:fadein .4s ease;}

        /* UNIT TOGGLE */
        .unit-toggle{display:flex;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:24px;width:fit-content;}
        .ut-btn{padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;background:transparent;border:none;color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .ut-btn.on{background:rgba(198,241,53,.1);color:var(--lime);}

        /* FORM CARD */
        .form-card{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:26px;margin-bottom:18px;position:relative;overflow:hidden;}
        .form-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--lime),transparent);}
        .card-title{font-size:15px;font-weight:800;letter-spacing:-.4px;margin-bottom:18px;display:flex;align-items:center;gap:8px;}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
        .field{display:flex;flex-direction:column;gap:6px;}
        .field-lbl{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--sub);}
        .inp{padding:11px 14px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all .2s;width:100%;}
        .inp:focus{border-color:rgba(198,241,53,.35);box-shadow:0 0 0 3px rgba(198,241,53,.06);}
        .inp-row{display:flex;gap:8px;}
        .inp-suffix{font-size:12px;color:var(--sub);align-self:center;padding:0 4px;white-space:nowrap;}

        /* RADIO PILLS */
        .pill-group{display:flex;gap:7px;flex-wrap:wrap;}
        .pill{padding:7px 15px;border-radius:100px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid var(--line);background:rgba(255,255,255,.03);color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .pill:hover{color:var(--text);}
        .pill.on{border-color:rgba(198,241,53,.35);background:rgba(198,241,53,.1);color:var(--lime);}

        /* ACTIVITY CARDS */
        .activity-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}
        .act-card{padding:11px 8px;border-radius:11px;background:rgba(255,255,255,.02);border:1px solid var(--line);cursor:pointer;transition:all .2s;text-align:center;}
        .act-card:hover{background:rgba(255,255,255,.05);}
        .act-card.on{background:rgba(198,241,53,.07);border-color:rgba(198,241,53,.25);}
        .act-label{font-size:12px;font-weight:700;margin-bottom:3px;}
        .act-sub{font-size:10px;color:var(--sub);line-height:1.4;}

        /* GOAL GRID */
        .goal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:7px;}
        .goal-card{padding:10px 6px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid var(--line);cursor:pointer;transition:all .2s;text-align:center;}
        .goal-card:hover{background:rgba(255,255,255,.05);}
        .goal-card.on{background:rgba(198,241,53,.07);border-color:rgba(198,241,53,.25);}
        .goal-label{font-size:11px;font-weight:700;margin-bottom:2px;}
        .goal-desc{font-size:9.5px;color:var(--sub);}

        /* CALCULATE BTN */
        .calc-btn{width:100%;padding:15px;background:var(--lime);color:#000;font-size:15px;font-weight:900;border-radius:13px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;letter-spacing:-.3px;margin-top:4px;}
        .calc-btn:hover{background:#d4ff45;box-shadow:0 0 32px rgba(198,241,53,.4);transform:translateY(-1px);}

        /* RESULTS */
        .results{animation:fadein .5s ease;}
        .result-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;}
        .rcard{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:20px;position:relative;overflow:hidden;animation:countup .4s ease;}
        .rcard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
        .rcard-icon{font-size:22px;margin-bottom:10px;}
        .rcard-val{font-size:28px;font-weight:900;letter-spacing:-1.5px;margin-bottom:4px;}
        .rcard-lbl{font-size:11px;font-weight:600;color:var(--sub);}
        .rcard-sub{font-size:11px;margin-top:6px;}

        /* BMI GAUGE */
        .bmi-track{height:12px;border-radius:100px;background:linear-gradient(90deg,#60a5fa,#93c5fd,#c6f135 40%,#fbbf24 60%,#fb923c 75%,#f87171 88%,#ef4444);position:relative;margin:12px 0 6px;overflow:visible;}
        .bmi-cursor{position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid var(--void);box-shadow:0 2px 10px rgba(0,0,0,.5);transition:left 1s cubic-bezier(.34,1.56,.64,1);}

        /* MACRO BAR */
        .macro-bar{display:flex;height:10px;border-radius:100px;overflow:hidden;gap:2px;margin:10px 0;}
        .macro-seg{height:100%;border-radius:3px;transition:flex .8s ease;}

        /* SAVE BTN */
        .save-btn{padding:12px 24px;background:var(--lime);color:#000;font-size:13px;font-weight:900;border-radius:11px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .save-btn:hover{background:#d4ff45;box-shadow:0 0 20px rgba(198,241,53,.35);}
        .save-btn:disabled{opacity:.5;cursor:not-allowed;}

        .toast{position:fixed;bottom:24px;right:24px;z-index:2000;padding:12px 18px;border-radius:11px;font-size:12.5px;font-weight:700;background:rgba(198,241,53,.12);border:1px solid rgba(198,241,53,.3);color:var(--lime);animation:toastIn .3s ease;}

        @media(max-width:900px){.sidebar{display:none}.main{margin-left:0}.result-grid{grid-template-columns:repeat(2,1fr)}.activity-grid{grid-template-columns:repeat(3,1fr)}.goal-grid{grid-template-columns:repeat(4,1fr)}.grid-2,.grid-3{grid-template-columns:1fr}.content{padding:18px}}
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a className="logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
          <div className="nav-lbl">Dashboard</div>
          <a className="nav-a" href="/dashboard">⚡ Overview</a>
          <a className="nav-a" href="/progress">📊 Progress</a>
          <div className="nav-lbl">Tools</div>
          <a className="nav-a on" href="/calculator">⚖️ BMI / TDEE</a>
          <a className="nav-a" href="/workouts/generate">🏋️ AI Workout</a>
          <a className="nav-a" href="/workouts/history">📋 History</a>
          <a className="nav-a" href="/progress/log">📝 Log Progress</a>
          <div className="nav-lbl">Discover</div>
          <a className="nav-a" href="/bookings">📅 Bookings</a>
          <a className="nav-a" href="/trainers">👥 Trainers</a>
          <a className="nav-a" href="/nutritionists">🧬 Nutritionists</a>
          <a className="nav-a" href="/meals">🥗 Meal Plans</a>
          <a className="nav-a" href="/supplements">💊 Supplements</a>
          <a className="nav-a" href="/articles">📰 Articles</a>
          <div className="nav-lbl">Communication</div>
          <a className="nav-a" href="/chat">💬 Messages</a>
          <a className="nav-a" href="/notifications">🔔 Notifications</a>
          <div className="nav-lbl">Account</div>
          <a className="nav-a" href="/profile">👤 Profile</a>
          <div className="sb-bot">
            <div className="ucard">
              <div className="uav">{user?.name?.[0]?.toUpperCase()||'U'}</div>
              <div><div style={{fontSize:12.5,fontWeight:700,marginBottom:1}}>{user?.name}</div><div style={{fontSize:10,color:'var(--sub)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:130,whiteSpace:'nowrap'}}>{user?.email}</div></div>
            </div>
            <button className="logout-btn" onClick={()=>{localStorage.removeItem('token');router.push('/login');}}>Sign out</button>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-title">⚖️ BMI & TDEE Calculator</div>
            <a className="back-btn" href="/dashboard">← Dashboard</a>
          </div>

          <div className="content">
            {/* UNIT TOGGLE */}
            <div className="unit-toggle">
              <button className={`ut-btn ${unit==='metric'?'on':''}`} onClick={()=>setUnit('metric')}>Metric (kg/cm)</button>
              <button className={`ut-btn ${unit==='imperial'?'on':''}`} onClick={()=>setUnit('imperial')}>Imperial (lbs/ft)</button>
            </div>

            {/* PERSONAL INFO */}
            <div className="form-card">
              <div className="card-title">👤 Personal Info</div>
              <div className="grid-3">
                <div className="field">
                  <div className="field-lbl">Age</div>
                  <div className="inp-row">
                    <input className="inp" type="number" placeholder="25" value={age} onChange={e=>setAge(e.target.value)} min="10" max="100"/>
                    <span className="inp-suffix">yrs</span>
                  </div>
                </div>
                <div className="field">
                  <div className="field-lbl">Gender</div>
                  <div className="pill-group">
                    <button className={`pill ${gender==='male'?'on':''}`} onClick={()=>setGender('male')}>♂ Male</button>
                    <button className={`pill ${gender==='female'?'on':''}`} onClick={()=>setGender('female')}>♀ Female</button>
                  </div>
                </div>
                <div className="field">
                  {unit === 'metric' ? (
                    <>
                      <div className="field-lbl">Weight</div>
                      <div className="inp-row">
                        <input className="inp" type="number" placeholder="70" value={weight} onChange={e=>handleWeightKg(e.target.value)}/>
                        <span className="inp-suffix">kg</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="field-lbl">Weight</div>
                      <div className="inp-row">
                        <input className="inp" type="number" placeholder="154" value={weightLbs} onChange={e=>handleWeightLbs(e.target.value)}/>
                        <span className="inp-suffix">lbs</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{marginTop:14}}>
                <div className="field-lbl" style={{marginBottom:8}}>Height</div>
                {unit === 'metric' ? (
                  <div className="inp-row" style={{maxWidth:200}}>
                    <input className="inp" type="number" placeholder="175" value={height} onChange={e=>handleHeightCm(e.target.value)}/>
                    <span className="inp-suffix">cm</span>
                  </div>
                ) : (
                  <div className="inp-row" style={{maxWidth:260}}>
                    <input className="inp" type="number" placeholder="5" value={heightFt} onChange={e=>handleHeightImperial(e.target.value, heightIn)}/>
                    <span className="inp-suffix">ft</span>
                    <input className="inp" type="number" placeholder="9" value={heightIn} onChange={e=>handleHeightImperial(heightFt, e.target.value)}/>
                    <span className="inp-suffix">in</span>
                  </div>
                )}
              </div>
            </div>

            {/* ACTIVITY LEVEL */}
            <div className="form-card">
              <div className="card-title">🏃 Activity Level</div>
              <div className="activity-grid">
                {ACTIVITY_LEVELS.map(a => (
                  <div key={a.key} className={`act-card ${activity===a.key?'on':''}`} onClick={()=>setActivity(a.key)}>
                    <div className="act-label" style={{color:activity===a.key?'var(--lime)':'var(--text)'}}>{a.label}</div>
                    <div className="act-sub">{a.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* GOAL */}
            <div className="form-card">
              <div className="card-title">🎯 Your Goal</div>
              <div className="goal-grid">
                {GOALS.map(g => (
                  <div key={g.key} className={`goal-card ${goal===g.key?'on':''}`} onClick={()=>setGoal(g.key)}>
                    <div className="goal-label" style={{color:goal===g.key?'var(--lime)':'var(--text)'}}>{g.label}</div>
                    <div className="goal-desc">{g.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <button className="calc-btn" onClick={calculate}>Calculate My BMI & TDEE →</button>

            {/* RESULTS */}
            {calculated && results && (
              <div className="results" style={{marginTop:28}}>
                <div style={{fontSize:13,fontWeight:700,color:'var(--sub)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:14}}>Your Results</div>

                {/* 4 KEY NUMBERS */}
                <div className="result-grid">
                  {[
                    { icon:'⚖️', val:results.bmi.toFixed(1), lbl:'BMI', sub:results.bmiCat.label, color:results.bmiCat.color, grad:results.bmiCat.color },
                    { icon:'🔥', val:results.bmr.toLocaleString(), lbl:'BMR', sub:'Calories at rest', color:'var(--rose)', grad:'var(--rose)' },
                    { icon:'⚡', val:results.tdee.toLocaleString(), lbl:'TDEE', sub:'Maintenance calories', color:'var(--cyan)', grad:'var(--cyan)' },
                    { icon:'🎯', val:results.target.toLocaleString(), lbl:'Daily Target', sub:GOALS.find(g=>g.key===goal)?.desc||'', color:'var(--lime)', grad:'var(--lime)' },
                  ].map(r => (
                    <div key={r.lbl} className="rcard">
                      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${r.grad},transparent)`}}/>
                      <div className="rcard-icon">{r.icon}</div>
                      <div className="rcard-val" style={{color:r.color}}>{r.val}</div>
                      <div className="rcard-lbl">{r.lbl}</div>
                      <div className="rcard-sub" style={{color:r.color,fontWeight:700,fontSize:11}}>{r.sub}</div>
                    </div>
                  ))}
                </div>

                {/* BMI GAUGE */}
                <div className="form-card" style={{marginBottom:14}}>
                  <div className="card-title">⚖️ BMI Scale</div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--sub)',marginBottom:4}}>
                    <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
                  </div>
                  <div className="bmi-track">
                    <div className="bmi-cursor" style={{left:`${bmiPct}%`}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--sub)'}}>
                    <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                  </div>
                  <div style={{marginTop:14,padding:'12px 16px',background:`${results.bmiCat.color}10`,border:`1px solid ${results.bmiCat.color}30`,borderRadius:10,display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:22}}>{results.bmiCat.emoji}</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,color:results.bmiCat.color}}>{results.bmiCat.label}</div>
                      <div style={{fontSize:12,color:'var(--sub)'}}>Ideal weight range: {results.idealMin}–{results.idealMax} kg for your height</div>
                    </div>
                  </div>
                </div>

                {/* MACROS + WATER */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                  <div className="form-card" style={{margin:0}}>
                    <div className="card-title">🍽️ Daily Macros</div>
                    <div className="macro-bar">
                      <div className="macro-seg" style={{flex:results.protein,background:'var(--cyan)'}}/>
                      <div className="macro-seg" style={{flex:results.carbs,background:'var(--lime)'}}/>
                      <div className="macro-seg" style={{flex:results.fat,background:'var(--amber)'}}/>
                    </div>
                    {[
                      {label:'Protein', val:`${results.protein}g`, cal:`${results.protein*4} kcal`, color:'var(--cyan)'},
                      {label:'Carbs',   val:`${results.carbs}g`,   cal:`${results.carbs*4} kcal`,   color:'var(--lime)'},
                      {label:'Fat',     val:`${results.fat}g`,     cal:`${results.fat*9} kcal`,     color:'var(--amber)'},
                    ].map(m => (
                      <div key={m.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid var(--line)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:m.color}}/>
                          <span style={{fontSize:13,fontWeight:600}}>{m.label}</span>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:14,fontWeight:800,color:m.color}}>{m.val}</div>
                          <div style={{fontSize:10,color:'var(--sub)'}}>{m.cal}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{fontSize:11,color:'var(--sub)',marginTop:10,fontStyle:'italic'}}>Based on {goal.replace('_',' ')} goal</div>
                  </div>

                  <div className="form-card" style={{margin:0}}>
                    <div className="card-title">💧 Daily Water Goal</div>
                    <div style={{fontSize:42,fontWeight:900,letterSpacing:'-2px',color:'var(--cyan)',margin:'10px 0 4px'}}>{(results.water/1000).toFixed(1)}L</div>
                    <div style={{fontSize:13,color:'var(--sub)',marginBottom:18}}>{results.water}ml per day</div>
                    <div style={{fontSize:12,color:'var(--sub)',lineHeight:1.7}}>
                      Based on <strong style={{color:'var(--text)'}}>{weight}kg × 35ml/kg</strong><br/>
                      Spread across 8–10 glasses throughout the day.
                    </div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:14}}>
                      {[250,500,750,1000].map(ml=>(
                        <div key={ml} style={{padding:'4px 11px',borderRadius:100,background:'rgba(0,212,255,.08)',border:'1px solid rgba(0,212,255,.2)',color:'var(--cyan)',fontSize:11,fontWeight:700}}>
                          {ml/1000}L = {Math.round(results.water/ml)} glasses
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SAVE TO PROFILE */}
                <div className="form-card" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>Save to your profile</div>
                    <div style={{fontSize:13,color:'var(--sub)'}}>Update your calorie goal ({results.target} kcal), protein ({results.protein}g) and water ({results.water}ml) targets.</div>
                  </div>
                  <button className="save-btn" onClick={saveToProfile} disabled={saving}>
                    {saving ? '⏳ Saving…' : '✓ Save Goals to Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}