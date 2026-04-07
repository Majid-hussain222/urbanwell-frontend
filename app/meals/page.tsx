'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

/* ── These are the pre-built professional PDFs ───────── */
const PDF_PLANS = [
  { id:'fat_loss_7day',     title:'7-Day Fat Loss Plan',         emoji:'🔥', type:'Fat Loss',     calories:1600, duration:'7 days', tags:['Weight Loss','High Protein','Calorie Deficit'], color:'#f43f5e', bg:'rgba(244,63,94,0.08)', border:'rgba(244,63,94,0.2)', desc:'Science-based 1600 kcal plan designed for 0.5kg/week fat loss. High protein to preserve muscle.', free:true, macros:{p:145,c:140,f:55}, file:'fat_loss_7day.pdf' },
  { id:'muscle_gain_7day',  title:'7-Day Muscle Building Plan',  emoji:'💪', type:'Muscle Gain',   calories:2800, duration:'7 days', tags:['Muscle Gain','High Calorie','Post-Workout'], color:'#00d4ff', bg:'rgba(0,212,255,0.08)', border:'rgba(0,212,255,0.2)', desc:'2800 kcal anabolic plan with 220g protein per day. Designed for serious muscle growth.', free:false, macros:{p:220,c:300,f:80}, file:'muscle_gain_7day.pdf' },
  { id:'keto_7day',         title:'7-Day Ketogenic Plan',        emoji:'⚡', type:'Keto',          calories:1900, duration:'7 days', tags:['Keto','Fat Burning','Low Carb'], color:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', desc:'Strict keto protocol under 30g net carbs. Full ketosis in 3-5 days. Includes shopping list.', free:false, macros:{p:140,c:25,f:145}, file:'keto_7day.pdf' },
  { id:'vegan_7day',        title:'7-Day Vegan Plan',            emoji:'🌱', type:'Vegan',          calories:1900, duration:'7 days', tags:['Vegan','Plant-Based','Complete Protein'], color:'#c6f135', bg:'rgba(198,241,53,0.08)', border:'rgba(198,241,53,0.2)', desc:'Complete plant-based nutrition with all essential amino acids, B12 guide and iron absorption tips.', free:true, macros:{p:120,c:240,f:65}, file:'vegan_7day.pdf' },
  { id:'diabetic_7day',     title:'7-Day Diabetic Plan',         emoji:'💉', type:'Diabetic',       calories:1700, duration:'7 days', tags:['Diabetes','Low GI','Blood Sugar'], color:'#34d399', bg:'rgba(52,211,153,0.08)', border:'rgba(52,211,153,0.2)', desc:'Clinical-grade low glycemic index plan. Pairs carbs with protein. Includes karela & fenugreek.', free:false, macros:{p:135,c:160,f:60}, file:'diabetic_7day.pdf' },
  { id:'cardiac_7day',      title:'7-Day Heart-Healthy Plan',    emoji:'❤️', type:'Cardiac',        calories:1800, duration:'7 days', tags:['Heart Health','Low Sodium','Omega-3'], color:'#f43f5e', bg:'rgba(244,63,94,0.06)', border:'rgba(244,63,94,0.15)', desc:'Cardiology-approved plan: olive oil, fatty fish, no fried foods, low sodium. Reduces LDL.', free:false, macros:{p:130,c:200,f:60}, file:'cardiac_7day.pdf' },
  { id:'high_protein_7day', title:'7-Day High Protein Plan',     emoji:'🍗', type:'High Protein',   calories:2100, duration:'7 days', tags:['High Protein','Lean Muscle','Body Recomposition'], color:'#8b5cf6', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.2)', desc:'35-40% protein protocol for body recomposition. 190g protein daily with complete amino acids.', free:true, macros:{p:190,c:180,f:65}, file:'high_protein_7day.pdf' },
  { id:'mediterranean_7day',title:'7-Day Mediterranean Plan',   emoji:'🫒', type:'Mediterranean', calories:2000, duration:'7 days', tags:['Mediterranean','Longevity','Anti-Inflammatory'], color:'#34d399', bg:'rgba(52,211,153,0.08)', border:'rgba(52,211,153,0.2)', desc:'UNESCO-recognized dietary pattern for longevity. Olive oil, fish, legumes, whole grains.', free:true, macros:{p:120,c:230,f:75}, file:'mediterranean_7day.pdf' },
];

const FILTERS = ['All','Fat Loss','Muscle Gain','Keto','Vegan','Diabetic','Cardiac','High Protein','Mediterranean'];

export default function MealPlansPage() {
  const router  = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('All');
  const [search,  setSearch]  = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [toast,   setToast]   = useState('');
  const [aiTab,   setAiTab]   = useState(false);

  // AI generator state
  const [aiGoal,     setAiGoal]     = useState('fat_loss');
  const [aiDiet,     setAiDiet]     = useState('balanced');
  const [aiDays,     setAiDays]     = useState(7);
  const [aiCals,     setAiCals]     = useState('');
  const [aiAllergy,  setAiAllergy]  = useState('');
  const [aiActivity, setAiActivity] = useState('moderate');
  const [aiGender,   setAiGender]   = useState('male');
  const [generating, setGenerating] = useState(false);
  const [aiPlan,     setAiPlan]     = useState<any>(null);
  const [aiError,    setAiError]    = useState('');
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
        setUser(data?.data || data);
      } catch { router.push('/login'); }
      finally { setLoading(false); }
    })();
  }, []);

  const downloadPdf = (plan: any) => {
    const link = document.createElement('a');
    link.href  = `/meal-plans/${plan.file}`;
    link.download = plan.file;
    link.click();
    showToast(`✓ Downloading ${plan.title}`);
  };

  const generateAI = async () => {
    setGenerating(true);
    setAiPlan(null);
    setAiError('');
    try {
      const { data } = await API.post('/meals/generate', {
        goal:          aiGoal,
        dietType:      aiDiet,
        days:          aiDays,
        caloriesPerDay: aiCals ? parseInt(aiCals) : undefined,
        activityLevel: aiActivity,
        gender:        aiGender,
        allergies:     aiAllergy ? aiAllergy.split(',').map(s=>s.trim()).filter(Boolean) : [],
      });
      setAiPlan(data?.data);
      showToast('✓ AI meal plan generated!');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message || 'Generation failed';
      setAiError(msg);
      if (msg.toLowerCase().includes('quota') || e?.response?.status === 503) {
        setAiError('OpenAI quota exceeded. Add credits at platform.openai.com/billing — or download a pre-built plan below.');
      }
    }
    setGenerating(false);
  };

  const filtered = PDF_PLANS.filter(p => {
    const matchFilter = filter === 'All' || p.type === filter;
    const matchSearch = !search.trim() || p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t=>t.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

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
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}

        .nav{position:sticky;top:0;z-index:100;height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(3,5,10,.9);backdrop-filter:blur(24px);border-bottom:1px solid var(--line);}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .logo-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-.5px;}.logo-text em{font-style:normal;color:var(--lime);}
        .nav-links{display:flex;align-items:center;gap:4px;}
        .nav-a{padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;color:var(--sub);text-decoration:none;transition:all .2s;}
        .nav-a:hover{color:var(--text);background:rgba(255,255,255,.04);}
        .nav-dash{padding:8px 18px;border-radius:9px;background:var(--lime);color:#000;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s;}
        .nav-dash:hover{background:#d4ff45;}

        .hero{max-width:1200px;margin:0 auto;padding:60px 40px 44px;animation:fadein .5s ease;}
        .hero-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:100px;background:rgba(198,241,53,.07);border:1px solid rgba(198,241,53,.18);font-size:11.5px;font-weight:700;color:var(--lime);margin-bottom:20px;}
        .hero-title{font-size:clamp(36px,5vw,56px);font-weight:900;letter-spacing:-2.5px;line-height:1;margin-bottom:14px;}
        .hero-title em{font-style:normal;color:var(--lime);}
        .hero-sub{font-size:15px;color:var(--sub);max-width:560px;line-height:1.75;font-weight:300;}

        /* TAB TOGGLE */
        .tab-toggle{max-width:1200px;margin:0 auto;padding:0 40px 24px;display:flex;gap:10px;}
        .ttab{display:flex;align-items:center;gap:8px;padding:11px 24px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;border:1px solid;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .ttab.on{background:rgba(198,241,53,.09);color:var(--lime);border-color:rgba(198,241,53,.25);}
        .ttab.off{background:var(--panel);color:var(--sub);border-color:var(--line);}
        .ttab.off:hover{color:var(--text);}

        /* CONTROLS */
        .controls{max-width:1200px;margin:0 auto;padding:0 40px 20px;display:flex;gap:12px;flex-wrap:wrap;}
        .search-wrap{position:relative;flex:1;min-width:240px;}
        .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--sub);pointer-events:none;}
        .search-inp{width:100%;padding:11px 14px 11px 38px;background:var(--panel);border:1px solid var(--line);border-radius:11px;color:var(--text);font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all .2s;}
        .search-inp:focus{border-color:rgba(198,241,53,.3);}
        .search-inp::placeholder{color:var(--sub);}

        /* FILTERS */
        .filters{max-width:1200px;margin:0 auto;padding:0 40px 28px;display:flex;gap:7px;flex-wrap:wrap;}
        .ftab{padding:7px 16px;border-radius:100px;font-size:12.5px;font-weight:700;cursor:pointer;background:var(--panel);border:1px solid var(--line);color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .ftab:hover{color:var(--text);}
        .ftab.on{background:rgba(198,241,53,.09);color:var(--lime);border-color:rgba(198,241,53,.22);}

        /* GRID */
        .grid{max-width:1200px;margin:0 auto;padding:0 40px 60px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px;animation:fadein .4s ease;}

        /* PLAN CARD */
        .pcard{background:var(--panel);border:1px solid var(--line);border-radius:18px;overflow:hidden;transition:all .25s;cursor:pointer;position:relative;display:flex;flex-direction:column;}
        .pcard:hover{border-color:rgba(255,255,255,.09);transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.4);}
        .pcard-top{padding:20px 18px 14px;flex:1;}
        .pcard-accent{height:3px;position:absolute;top:0;left:0;right:0;}
        .pcard-emoji{font-size:32px;margin-bottom:12px;}
        .pcard-free{position:absolute;top:12px;right:12px;padding:3px 9px;border-radius:100px;font-size:9px;font-weight:800;background:rgba(198,241,53,.12);color:var(--lime);border:1px solid rgba(198,241,53,.2);letter-spacing:.5px;text-transform:uppercase;}
        .pcard-type{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;}
        .pcard-title{font-size:15px;font-weight:800;letter-spacing:-.4px;margin-bottom:7px;line-height:1.2;}
        .pcard-desc{font-size:12px;color:var(--sub);line-height:1.65;font-weight:300;margin-bottom:12px;}
        .pcard-tags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;}
        .ptag{padding:3px 9px;border-radius:100px;font-size:10px;font-weight:600;background:rgba(255,255,255,.04);color:var(--sub);border:1px solid rgba(255,255,255,.06);}
        .pcard-macros{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:12px;background:var(--panel2);border-top:1px solid var(--line);}
        .macro-item{text-align:center;}
        .macro-val{font-size:14px;font-weight:900;letter-spacing:-.5px;}
        .macro-lbl{font-size:9px;color:var(--sub);font-weight:600;letter-spacing:.5px;text-transform:uppercase;}
        .pcard-footer{display:flex;gap:8px;padding:12px 14px;border-top:1px solid var(--line);}
        .btn-preview{flex:1;padding:9px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:9px;color:var(--sub);font-size:12px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .btn-preview:hover{color:var(--text);}
        .btn-download{flex:2;padding:9px;border:none;border-radius:9px;font-size:12.5px;font-weight:800;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;color:#000;}

        /* AI GENERATOR SECTION */
        .ai-section{max-width:1200px;margin:0 auto;padding:0 40px 60px;animation:fadein .4s ease;}
        .ai-grid{display:grid;grid-template-columns:1fr 320px;gap:20px;}
        .ai-form{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:28px;position:relative;overflow:hidden;}
        .ai-form::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--lime),transparent);}
        .ai-sidebar{background:var(--panel);border:1px solid rgba(198,241,53,.12);border-radius:20px;padding:24px;position:relative;overflow:hidden;}
        .ai-sidebar::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(198,241,53,.4),transparent);}
        .fc-title{font-size:15px;font-weight:800;margin-bottom:18px;}
        .goal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px;}
        .goal-pill{padding:10px 8px;border-radius:11px;background:rgba(255,255,255,.02);border:1px solid var(--line);cursor:pointer;transition:all .2s;text-align:center;}
        .goal-pill:hover{background:rgba(255,255,255,.04);}
        .goal-pill.on{background:rgba(198,241,53,.07);border-color:rgba(198,241,53,.25);}
        .goal-pill-icon{font-size:18px;margin-bottom:4px;}
        .goal-pill-lbl{font-size:11.5px;font-weight:700;}
        .diet-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;}
        .diet-btn{padding:7px 14px;border-radius:100px;font-size:12px;font-weight:700;cursor:pointer;background:rgba(255,255,255,.03);border:1px solid var(--line);color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .diet-btn:hover{color:var(--text);}
        .diet-btn.on{background:rgba(198,241,53,.08);color:var(--lime);border-color:rgba(198,241,53,.2);}
        .inp-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
        .field{display:flex;flex-direction:column;gap:5px;}
        .field label{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--sub);}
        .inp{padding:10px 13px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all .2s;}
        .inp:focus{border-color:rgba(198,241,53,.3);}
        .inp::placeholder{color:var(--sub);}
        .gen-btn{width:100%;padding:14px;background:linear-gradient(135deg,var(--lime),var(--cyan));color:#000;font-size:14px;font-weight:900;border-radius:13px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;display:flex;align-items:center;justify-content:center;gap:10px;margin-top:6px;}
        .gen-btn:hover:not(:disabled){box-shadow:0 0 30px rgba(198,241,53,.35);transform:translateY(-1px);}
        .gen-btn:disabled{opacity:.6;cursor:not-allowed;}
        .error-box{background:rgba(244,63,94,.06);border:1px solid rgba(244,63,94,.2);border-radius:12px;padding:16px;margin-top:14px;font-size:13px;color:#fb7185;line-height:1.65;}
        .ai-result{background:var(--panel2);border:1px solid var(--line);border-radius:14px;padding:18px;margin-top:16px;max-height:400px;overflow-y:auto;font-size:12.5px;color:var(--sub);line-height:1.75;}
        .ai-result h3{color:var(--lime);font-size:14px;font-weight:800;margin:10px 0 6px;}
        .ai-result p{margin-bottom:4px;}

        /* PREVIEW MODAL */
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);backdrop-filter:blur(16px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
        .modal{background:var(--panel);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:32px;width:100%;max-width:560px;position:relative;max-height:90vh;overflow-y:auto;}
        .modal-x{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--sub);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;}
        .modal-x:hover{color:var(--text);}
        .toast{position:fixed;bottom:24px;right:24px;z-index:2000;padding:12px 18px;border-radius:11px;font-size:12.5px;font-weight:700;background:rgba(198,241,53,.12);border:1px solid rgba(198,241,53,.3);color:var(--lime);animation:toastIn .3s ease;}

        @media(max-width:1100px){.grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:800px){.grid{grid-template-columns:repeat(2,1fr)}.ai-grid{grid-template-columns:1fr}.controls,.filters,.hero,.ai-section,.tab-toggle{padding-left:20px;padding-right:20px}.nav{padding:0 20px}}
        @media(max-width:500px){.grid{grid-template-columns:1fr}}
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      {/* NAV */}
      <nav className="nav">
        <a className="logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
        <div className="nav-links">
          <a className="nav-a" href="/nutritionists">Nutritionists</a>
          <a className="nav-a" href="/dietitians">Dietitians</a>
          <a className="nav-a" href="/workouts/generate">AI Workouts</a>
        </div>
        <a className="nav-dash" href="/dashboard">⚡ Dashboard</a>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-badge">🥗 8 Professional Meal Plans Available</div>
        <h1 className="hero-title">Expert <em>Meal Plans</em><br />Built by Nutritionists</h1>
        <p className="hero-sub">Download professional 7-day meal plans created by certified nutritionists — or generate a personalized AI plan if you have OpenAI credits. No login required for downloads.</p>
      </div>

      {/* TAB TOGGLE */}
      <div className="tab-toggle">
        <button className={`ttab ${!aiTab?'on':'off'}`} onClick={()=>setAiTab(false)}>
          📄 Download PDF Plans <span style={{fontSize:10,background:'rgba(198,241,53,.1)',padding:'2px 7px',borderRadius:100,marginLeft:6}}>8 plans</span>
        </button>
        <button className={`ttab ${aiTab?'on':'off'}`} onClick={()=>setAiTab(true)}>
          🤖 AI Generator <span style={{fontSize:10,background:'rgba(255,255,255,.05)',padding:'2px 7px',borderRadius:100,marginLeft:6,color:'var(--sub)'}}>needs OpenAI credits</span>
        </button>
      </div>

      {/* PDF PLANS TAB */}
      {!aiTab && (
        <>
          <div className="controls">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-inp" placeholder="Search plans…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
          <div className="filters">
            {FILTERS.map(f=>(
              <button key={f} className={`ftab ${filter===f?'on':''}`} onClick={()=>setFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="grid">
            {filtered.map(p=>(
              <div key={p.id} className="pcard">
                <div className="pcard-accent" style={{background:p.color}}/>
                {p.free && <div className="pcard-free">Free</div>}
                <div className="pcard-top">
                  <div className="pcard-emoji">{p.emoji}</div>
                  <div className="pcard-type" style={{color:p.color}}>{p.type}</div>
                  <div className="pcard-title">{p.title}</div>
                  <p className="pcard-desc">{p.desc}</p>
                  <div className="pcard-tags">{p.tags.map(t=><span className="ptag" key={t}>{t}</span>)}</div>
                  <div style={{display:'flex',gap:10,fontSize:12,color:'var(--sub)',marginBottom:4}}>
                    <span>📅 {p.duration}</span>
                    <span>🔥 {p.calories} kcal/day</span>
                  </div>
                </div>
                <div className="pcard-macros">
                  {[{lbl:'Protein',val:`${p.macros.p}g`,color:p.color},{lbl:'Carbs',val:`${p.macros.c}g`,color:'var(--violet)'},{lbl:'Fat',val:`${p.macros.f}g`,color:'var(--amber)'}].map(m=>(
                    <div className="macro-item" key={m.lbl}>
                      <div className="macro-val" style={{color:m.color}}>{m.val}</div>
                      <div className="macro-lbl">{m.lbl}</div>
                    </div>
                  ))}
                </div>
                <div className="pcard-footer">
                  <button className="btn-preview" onClick={()=>setPreview(p)}>👁 Preview</button>
                  <button className="btn-download" style={{background:p.color}} onClick={()=>downloadPdf(p)}>
                    ↓ Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* AI GENERATOR TAB */}
      {aiTab && (
        <div className="ai-section">
          <div className="ai-grid">
            <div className="ai-form">
              <div className="fc-title">🎯 Your Goal</div>
              <div className="goal-grid">
                {[
                  {id:'fat_loss',icon:'🔥',lbl:'Fat Loss'},
                  {id:'muscle_gain',icon:'💪',lbl:'Muscle Gain'},
                  {id:'maintenance',icon:'⚖️',lbl:'Maintain'},
                  {id:'endurance',icon:'⚡',lbl:'Athletic'},
                  {id:'general',icon:'🌿',lbl:'General'},
                  {id:'weight_loss',icon:'📉',lbl:'Weight Loss'},
                ].map(g=>(
                  <div key={g.id} className={`goal-pill ${aiGoal===g.id?'on':''}`} onClick={()=>setAiGoal(g.id)}>
                    <div className="goal-pill-icon">{g.icon}</div>
                    <div className="goal-pill-lbl" style={{color:aiGoal===g.id?'var(--lime)':'var(--text)'}}>{g.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="fc-title">🥗 Diet Type</div>
              <div className="diet-row">
                {['balanced','high_protein','keto','vegan','paleo','halal','low_carb'].map(d=>(
                  <button key={d} className={`diet-btn ${aiDiet===d?'on':''}`} onClick={()=>setAiDiet(d)}>
                    {d.replace(/_/g,' ')}
                  </button>
                ))}
              </div>
              <div className="inp-row">
                <div className="field"><label>Days</label><input className="inp" type="number" min={3} max={14} value={aiDays} onChange={e=>setAiDays(Number(e.target.value))}/></div>
                <div className="field"><label>Target Calories</label><input className="inp" type="number" placeholder="e.g. 2000" value={aiCals} onChange={e=>setAiCals(e.target.value)}/></div>
                <div className="field"><label>Gender</label><select className="inp" value={aiGender} onChange={e=>setAiGender(e.target.value)}><option value="male">Male</option><option value="female">Female</option></select></div>
                <div className="field"><label>Activity</label><select className="inp" value={aiActivity} onChange={e=>setAiActivity(e.target.value)}><option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="active">Active</option><option value="athlete">Athlete</option></select></div>
              </div>
              <div className="field" style={{marginBottom:16}}><label>Allergies / Avoid (comma separated)</label><input className="inp" placeholder="nuts, gluten, dairy…" value={aiAllergy} onChange={e=>setAiAllergy(e.target.value)}/></div>
              <button className="gen-btn" onClick={generateAI} disabled={generating}>
                {generating ? <><div style={{width:18,height:18,border:'2px solid rgba(0,0,0,.2)',borderTop:'2px solid #000',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Generating…</> : '🤖 Generate AI Meal Plan'}
              </button>
              {aiError && (
                <div className="error-box">
                  ⚠ {aiError}
                  <div style={{marginTop:10}}>
                    <strong>No credits?</strong> <a href="https://platform.openai.com/billing" target="_blank" rel="noreferrer" style={{color:'var(--cyan)'}}>Add at platform.openai.com/billing</a>
                    {' — '}or switch to <button onClick={()=>setAiTab(false)} style={{background:'none',border:'none',color:'var(--lime)',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:13}}>Download PDF Plans</button>
                  </div>
                </div>
              )}
              {aiPlan && !aiError && (
                <div className="ai-result">
                  <h3>{aiPlan.name || 'Your AI Meal Plan'}</h3>
                  <p>📅 {aiDays} days · {aiPlan.caloriesPerDay || aiCals} kcal/day · {aiDiet.replace(/_/g,' ')}</p>
                  {aiPlan.macros && <p>Protein: {aiPlan.macros.protein}g · Carbs: {aiPlan.macros.carbs}g · Fat: {aiPlan.macros.fat}g</p>}
                  {(aiPlan.days||[]).map((d:any,i:number)=>(
                    <div key={i} style={{marginTop:10,padding:'10px',background:'rgba(255,255,255,.03)',borderRadius:8}}>
                      <strong style={{color:'var(--lime)'}}>Day {d.day||i+1}</strong>
                      {d.breakfast && <p>🌅 {Array.isArray(d.breakfast)?d.breakfast.join(', '):d.breakfast}</p>}
                      {d.lunch     && <p>☀️ {Array.isArray(d.lunch)?d.lunch.join(', '):d.lunch}</p>}
                      {d.dinner    && <p>🌙 {Array.isArray(d.dinner)?d.dinner.join(', '):d.dinner}</p>}
                      {d.snacks    && <p>🍎 {Array.isArray(d.snacks)?d.snacks.join(', '):d.snacks}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="ai-sidebar">
              <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>📄 Or download instantly</div>
              <p style={{fontSize:12.5,color:'var(--sub)',marginBottom:16,lineHeight:1.65}}>No OpenAI credits? Download any of our 8 professionally built meal plans — free, no AI needed.</p>
              {PDF_PLANS.filter(p=>p.free).map(p=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'rgba(255,255,255,.03)',border:'1px solid var(--line)',borderRadius:10,marginBottom:8,cursor:'pointer'}} onClick={()=>downloadPdf(p)}>
                  <span style={{fontSize:22}}>{p.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12.5,fontWeight:700}}>{p.title}</div>
                    <div style={{fontSize:11,color:'var(--sub)'}}>{p.calories} kcal · {p.duration}</div>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--lime)'}}>↓ Free</span>
                </div>
              ))}
              <button onClick={()=>setAiTab(false)} style={{width:'100%',marginTop:12,padding:'11px',background:'rgba(198,241,53,.08)',border:'1px solid rgba(198,241,53,.2)',borderRadius:10,color:'var(--lime)',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                View All 8 Plans →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {preview && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setPreview(null);}}>
          <div className="modal">
            <button className="modal-x" onClick={()=>setPreview(null)}>✕</button>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:32,marginBottom:8}}>{preview.emoji}</div>
              <div style={{fontSize:20,fontWeight:900,letterSpacing:'-.5px',marginBottom:4}}>{preview.title}</div>
              <div style={{fontSize:12,color:'var(--sub)'}}>{preview.subtitle} · {preview.duration} · {preview.calories} kcal/day</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
              {[{l:'Protein',v:`${preview.macros.p}g`,c:preview.color},{l:'Carbs',v:`${preview.macros.c}g`,c:'var(--violet)'},{l:'Fat',v:`${preview.macros.f}g`,c:'var(--amber)'}].map(m=>(
                <div key={m.l} style={{background:'var(--panel2)',border:'1px solid var(--line)',borderRadius:10,padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:18,fontWeight:900,color:m.c}}>{m.v}</div>
                  <div style={{fontSize:10,color:'var(--sub)'}}>{m.l}</div>
                </div>
              ))}
            </div>
            <p style={{fontSize:13.5,color:'var(--sub)',lineHeight:1.75,marginBottom:18}}>{preview.desc}</p>
            <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:20}}>
              {preview.tags.map((t:string)=>(
                <span key={t} style={{padding:'4px 11px',borderRadius:100,fontSize:11,fontWeight:600,background:'rgba(255,255,255,.04)',color:'var(--sub)',border:'1px solid rgba(255,255,255,.06)'}}>{t}</span>
              ))}
            </div>
            <button style={{width:'100%',padding:'14px',background:preview.color,color:'#000',border:'none',borderRadius:12,fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit',transition:'all .2s'}} onClick={()=>{downloadPdf(preview);setPreview(null);}}>
              ↓ Download PDF — {preview.free?'Free':preview.price||'PKR 1,000'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}