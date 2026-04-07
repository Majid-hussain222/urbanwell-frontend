'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '../lib/api';

const fitnessGoals = [
  { id:'weight_loss', label:'Weight Loss', icon:'🔥', desc:'Burn fat, get lean' },
  { id:'muscle_gain', label:'Muscle Gain', icon:'💪', desc:'Build size & strength' },
  { id:'endurance', label:'Endurance', icon:'🏃', desc:'Improve stamina' },
  { id:'flexibility', label:'Flexibility', icon:'🧘', desc:'Mobility & recovery' },
  { id:'general', label:'General Fitness', icon:'⚡', desc:'Overall health' },
];

const genderOptions = [
  { id:'male', label:'Male', icon:'👨' },
  { id:'female', label:'Female', icon:'👩' },
  { id:'other', label:'Other', icon:'🧑' },
];

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile'|'goals'|'security'>('profile');
  const [error, setError] = useState('');

  // Profile form
  const [form, setForm] = useState({
    name: '', phone: '', age: '', gender: '',
    height: '', weight: '',
    fitnessGoal: 'general',
    calorieGoal: '', waterGoal: '', proteinGoal: '',
  });

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await API.get('/users/profile');
        const u = data.data;
        setUser(u);
        setForm({
          name: u.name || '',
          phone: u.phone || '',
          age: u.age || '',
          gender: u.gender || '',
          height: u.height || '',
          weight: u.weight || '',
          fitnessGoal: u.fitnessGoal || 'general',
          calorieGoal: u.calorieGoal || '',
          waterGoal: u.waterGoal || '',
          proteinGoal: u.proteinGoal || '',
        });
      } catch { router.push('/login'); }
      finally { setLoading(false); }
    };
    fetchUser();
  }, []);

  const saveProfile = async () => {
    setSaving(true); setError('');
    try {
      await API.put('/users/profile', {
        name: form.name,
        phone: form.phone || undefined,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        fitnessGoal: form.fitnessGoal,
        calorieGoal: form.calorieGoal ? Number(form.calorieGoal) : undefined,
        waterGoal: form.waterGoal ? Number(form.waterGoal) : undefined,
        proteinGoal: form.proteinGoal ? Number(form.proteinGoal) : undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    setPwError('');
    if (!pwForm.currentPassword || !pwForm.newPassword) return setPwError('All fields are required');
    if (pwForm.newPassword.length < 6) return setPwError('New password must be at least 6 characters');
    if (pwForm.newPassword !== pwForm.confirmPassword) return setPwError('Passwords do not match');
    setPwLoading(true);
    try {
      await API.put('/users/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setPwError(err?.response?.data?.error || 'Failed to change password.');
    } finally { setPwLoading(false); }
  };

  // BMI calculation
  const bmi = form.weight && form.height
    ? (Number(form.weight) / Math.pow(Number(form.height) / 100, 2)).toFixed(1)
    : null;
  const bmiLabel = bmi ? Number(bmi) < 18.5 ? 'Underweight' : Number(bmi) < 25 ? 'Normal' : Number(bmi) < 30 ? 'Overweight' : 'Obese' : null;
  const bmiColor = bmi ? Number(bmi) < 18.5 ? 'var(--cyan)' : Number(bmi) < 25 ? 'var(--lime)' : Number(bmi) < 30 ? 'var(--amber)' : 'var(--rose)' : null;

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

        .layout { display:flex; min-height:100vh; }

        /* SIDEBAR */
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

        /* MAIN */
        .main { margin-left:260px; flex:1; }
        .topbar { height:68px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; padding:0 36px; background:rgba(3,5,10,0.85); backdrop-filter:blur(20px); position:sticky; top:0; z-index:50; }
        .topbar-title { font-size:18px; font-weight:700; letter-spacing:-0.5px; }
        .back-btn { display:flex; align-items:center; gap:7px; padding:8px 16px; background:var(--panel); border:1px solid var(--line); border-radius:9px; color:var(--sub); font-size:13px; font-weight:600; cursor:pointer; text-decoration:none; transition:all 0.2s; }
        .back-btn:hover { color:var(--text); border-color:rgba(255,255,255,0.15); }

        /* CONTENT */
        .content { padding:40px 48px 80px; max-width:900px; }

        /* PROFILE HERO */
        .profile-hero { display:flex; align-items:center; gap:24px; margin-bottom:36px; padding:28px 32px; background:var(--panel); border:1px solid var(--line); border-radius:20px; position:relative; overflow:hidden; }
        .profile-hero::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,var(--lime),var(--cyan),transparent); }
        .profile-avatar-big { width:80px; height:80px; border-radius:20px; background:linear-gradient(135deg,rgba(198,241,53,0.25),rgba(0,212,255,0.2)); display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:900; color:var(--lime); flex-shrink:0; border:2px solid rgba(198,241,53,0.2); }
        .profile-hero-name { font-size:24px; font-weight:800; letter-spacing:-1px; margin-bottom:4px; }
        .profile-hero-email { font-size:13px; color:var(--sub); margin-bottom:12px; }
        .profile-hero-tags { display:flex; gap:8px; flex-wrap:wrap; }
        .profile-tag { padding:4px 12px; border-radius:100px; font-size:11px; font-weight:700; background:rgba(198,241,53,0.08); color:var(--lime); border:1px solid rgba(198,241,53,0.15); }
        .profile-hero-right { margin-left:auto; text-align:right; }
        .bmi-display { text-align:center; }
        .bmi-val { font-size:32px; font-weight:900; letter-spacing:-2px; }
        .bmi-lbl { font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }

        /* TABS */
        .tabs { display:flex; gap:4px; margin-bottom:28px; background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:6px; width:fit-content; }
        .tab { padding:9px 22px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.25s; color:var(--sub); background:transparent; border:none; font-family:'Plus Jakarta Sans',sans-serif; }
        .tab:hover { color:var(--text); }
        .tab.active { background:rgba(198,241,53,0.1); color:var(--lime); }

        /* FORM SECTIONS */
        .form-section { background:var(--panel); border:1px solid var(--line); border-radius:20px; padding:28px 32px; margin-bottom:16px; position:relative; overflow:hidden; animation:fadein 0.3s ease; }
        .form-section::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
        .fs-lime::before { background:linear-gradient(90deg,transparent,var(--lime),transparent); }
        .fs-cyan::before { background:linear-gradient(90deg,transparent,var(--cyan),transparent); }
        .fs-violet::before { background:linear-gradient(90deg,transparent,var(--violet),transparent); }
        .fs-rose::before { background:linear-gradient(90deg,transparent,var(--rose),transparent); }
        .section-title { font-size:15px; font-weight:700; letter-spacing:-0.3px; margin-bottom:4px; display:flex; align-items:center; gap:8px; }
        .section-sub { font-size:12px; color:var(--sub); font-weight:300; margin-bottom:22px; line-height:1.6; }

        /* INPUT GRIDS */
        .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }

        /* FIELD */
        .field { display:flex; flex-direction:column; gap:7px; }
        .field-label { font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--sub); }
        .field-wrap { position:relative; }
        .field-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:15px; pointer-events:none; }
        .field-unit { position:absolute; right:14px; top:50%; transform:translateY(-50%); font-size:11px; font-weight:700; color:var(--sub); pointer-events:none; }
        .eye-btn { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:15px; color:var(--sub); transition:color 0.2s; }
        .eye-btn:hover { color:var(--text); }
        .field input, .field select { width:100%; padding:13px 44px 13px 44px; background:var(--panel2); border:1px solid var(--line); border-radius:11px; color:var(--text); font-size:14px; font-weight:500; font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:all 0.25s; }
        .field select { padding-left:44px; cursor:pointer; }
        .field input::placeholder { color:var(--sub); opacity:0.45; font-weight:400; }
        .field input:focus, .field select:focus { border-color:rgba(198,241,53,0.4); box-shadow:0 0 0 3px rgba(198,241,53,0.07); }
        .field select option { background:var(--panel2); }

        /* GOAL GRID */
        .goal-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; }
        .goal-btn { padding:14px 8px; border-radius:12px; background:var(--panel2); border:1px solid var(--line); cursor:pointer; transition:all 0.25s; text-align:center; font-family:'Plus Jakarta Sans',sans-serif; }
        .goal-btn:hover { border-color:rgba(198,241,53,0.2); transform:translateY(-2px); }
        .goal-btn.active { background:rgba(198,241,53,0.08); border-color:rgba(198,241,53,0.35); }
        .goal-icon { font-size:24px; margin-bottom:6px; }
        .goal-label { font-size:11px; font-weight:700; color:var(--sub); margin-bottom:2px; }
        .goal-btn.active .goal-label { color:var(--lime); }
        .goal-desc { font-size:10px; color:var(--sub); font-weight:300; }

        /* GENDER GRID */
        .gender-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:0; }
        .gender-btn { padding:14px; border-radius:12px; background:var(--panel2); border:1px solid var(--line); cursor:pointer; transition:all 0.25s; text-align:center; font-family:'Plus Jakarta Sans',sans-serif; display:flex; flex-direction:column; align-items:center; gap:6px; }
        .gender-btn:hover { border-color:rgba(0,212,255,0.2); transform:translateY(-2px); }
        .gender-btn.active { background:rgba(0,212,255,0.06); border-color:rgba(0,212,255,0.3); }
        .gender-icon { font-size:24px; }
        .gender-label { font-size:12px; font-weight:700; color:var(--sub); }
        .gender-btn.active .gender-label { color:var(--cyan); }

        /* ERROR / SUCCESS */
        .alert-error { display:flex; align-items:center; gap:8px; padding:12px 16px; background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2); border-radius:10px; font-size:13px; color:#fb7185; margin-bottom:16px; }
        .alert-success { display:flex; align-items:center; gap:8px; padding:12px 16px; background:rgba(198,241,53,0.08); border:1px solid rgba(198,241,53,0.2); border-radius:10px; font-size:13px; color:var(--lime); font-weight:600; margin-bottom:16px; animation:fadein 0.3s ease; }

        /* BUTTONS */
        .btn-save { padding:14px 36px; background:var(--lime); color:#000; font-size:14px; font-weight:800; border-radius:12px; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.25s; letter-spacing:-0.3px; display:inline-flex; align-items:center; gap:7px; }
        .btn-save:hover:not(:disabled) { background:#d4ff45; box-shadow:0 0 28px rgba(198,241,53,0.4); transform:translateY(-1px); }
        .btn-save:disabled { opacity:0.5; cursor:not-allowed; }
        .btn-pw { width:100%; padding:14px; background:var(--lime); color:#000; font-size:14px; font-weight:800; border-radius:12px; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.25s; margin-top:4px; }
        .btn-pw:hover:not(:disabled) { background:#d4ff45; box-shadow:0 0 28px rgba(198,241,53,0.4); }
        .btn-pw:disabled { opacity:0.5; cursor:not-allowed; }

        /* DANGER ZONE */
        .danger-zone { background:rgba(244,63,94,0.04); border:1px solid rgba(244,63,94,0.12); border-radius:16px; padding:24px 28px; margin-top:16px; }
        .danger-title { font-size:14px; font-weight:700; color:var(--rose); margin-bottom:6px; }
        .danger-sub { font-size:13px; color:var(--sub); font-weight:300; margin-bottom:16px; }
        .btn-danger { padding:11px 24px; background:rgba(244,63,94,0.08); color:var(--rose); font-size:13px; font-weight:700; border-radius:10px; border:1px solid rgba(244,63,94,0.2); cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.2s; }
        .btn-danger:hover { background:rgba(244,63,94,0.15); }

        /* TOAST */
        .toast { position:fixed; bottom:28px; right:28px; z-index:2000; padding:14px 22px; background:rgba(198,241,53,0.12); border:1px solid rgba(198,241,53,0.3); border-radius:12px; font-size:13px; font-weight:700; color:var(--lime); display:flex; align-items:center; gap:8px; animation:fadein 0.3s ease; backdrop-filter:blur(12px); }

        @media(max-width:900px) { .sidebar{display:none} .main{margin-left:0} .content{padding:20px 20px 60px} .goal-grid{grid-template-columns:repeat(3,1fr)} .grid-3{grid-template-columns:1fr 1fr} }
        @media(max-width:600px) { .grid-2,.grid-3{grid-template-columns:1fr} .goal-grid{grid-template-columns:repeat(2,1fr)} .profile-hero{flex-direction:column;text-align:center} .profile-hero-right{margin-left:0} }
      `}</style>

      {/* TOAST */}
      {(saveSuccess || pwSuccess) && (
        <div className="toast">✓ {saveSuccess ? 'Profile saved successfully!' : 'Password changed!'}</div>
      )}

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a className="sidebar-logo" href="/">
            <div className="logo-icon">U</div>
            <span className="logo-text"><em>Urban</em>Well</span>
          </a>
          {[{icon:'⚡',label:'Dashboard',href:'/dashboard'},{icon:'🏋️',label:'Workouts',href:'/workouts/generate'},{icon:'📝',label:'Log Progress',href:'/progress/log'},{icon:'👥',label:'Trainers',href:'/trainers'},{icon:'🧬',label:'Nutritionists',href:'/nutritionists'},{icon:'📍',label:'Gyms',href:'/gym-packages'}].map(n => (
            <a key={n.label} className="nav-item" href={n.href}><span style={{fontSize:16,width:20,textAlign:'center'}}>{n.icon}</span>{n.label}</a>
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
            <button className="btn-logout" onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}>Sign out</button>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-title">Profile & Settings</div>
            <a className="back-btn" href="/dashboard">← Dashboard</a>
          </div>

          <div className="content">
            {/* PROFILE HERO */}
            <div className="profile-hero">
              <div className="profile-avatar-big">{user?.name?.[0]?.toUpperCase()||'U'}</div>
              <div>
                <div className="profile-hero-name">{user?.name||'User'}</div>
                <div className="profile-hero-email">{user?.email}</div>
                <div className="profile-hero-tags">
                  {user?.fitnessGoal && <span className="profile-tag">🎯 {fitnessGoals.find(g=>g.id===user.fitnessGoal)?.label||user.fitnessGoal}</span>}
                  {user?.height && <span className="profile-tag">📏 {user.height}cm</span>}
                  {user?.weight && <span className="profile-tag">⚖️ {user.weight}kg</span>}
                  {user?.age && <span className="profile-tag">🎂 {user.age}y</span>}
                </div>
              </div>
              {bmi && (
                <div className="profile-hero-right">
                  <div className="bmi-display">
                    <div className="bmi-val" style={{color:bmiColor||'var(--lime)'}}>{bmi}</div>
                    <div className="bmi-lbl" style={{color:bmiColor||'var(--sub)'}}>BMI · {bmiLabel}</div>
                  </div>
                </div>
              )}
            </div>

            {/* TABS */}
            <div className="tabs">
              {[{id:'profile',label:'👤 Personal Info'},{id:'goals',label:'🎯 Goals & Targets'},{id:'security',label:'🔐 Security'}].map(t => (
                <button key={t.id} className={`tab ${activeTab===t.id?'active':''}`} onClick={() => setActiveTab(t.id as any)}>{t.label}</button>
              ))}
            </div>

            {/* ── PERSONAL INFO TAB ── */}
            {activeTab === 'profile' && (
              <>
                {error && <div className="alert-error">⚠️ {error}</div>}

                {/* Basic Info */}
                <div className="form-section fs-lime">
                  <div className="section-title">👤 Basic Information</div>
                  <div className="section-sub">Your name and contact details</div>
                  <div className="grid-2" style={{marginBottom:16}}>
                    <div className="field">
                      <div className="field-label">Full Name</div>
                      <div className="field-wrap">
                        <span className="field-icon">👤</span>
                        <input placeholder="Your full name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
                      </div>
                    </div>
                    <div className="field">
                      <div className="field-label">Phone Number</div>
                      <div className="field-wrap">
                        <span className="field-icon">📱</span>
                        <input placeholder="+92 300 0000000" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
                      </div>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="field">
                      <div className="field-label">Age</div>
                      <div className="field-wrap">
                        <span className="field-icon">🎂</span>
                        <input type="number" placeholder="25" value={form.age} onChange={e => setForm(f=>({...f,age:e.target.value}))} />
                        <span className="field-unit">yrs</span>
                      </div>
                    </div>
                    <div className="field">
                      <div className="field-label">Gender</div>
                      <div className="gender-grid">
                        {genderOptions.map(g => (
                          <button key={g.id} className={`gender-btn ${form.gender===g.id?'active':''}`} onClick={() => setForm(f=>({...f,gender:g.id}))}>
                            <span className="gender-icon">{g.icon}</span>
                            <span className="gender-label">{g.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Metrics */}
                <div className="form-section fs-cyan">
                  <div className="section-title">⚖️ Body Metrics</div>
                  <div className="section-sub">Used to calculate your BMI and personalize recommendations</div>
                  <div className="grid-2">
                    <div className="field">
                      <div className="field-label">Height</div>
                      <div className="field-wrap">
                        <span className="field-icon">📏</span>
                        <input type="number" placeholder="175" value={form.height} onChange={e => setForm(f=>({...f,height:e.target.value}))} />
                        <span className="field-unit">cm</span>
                      </div>
                    </div>
                    <div className="field">
                      <div className="field-label">Weight</div>
                      <div className="field-wrap">
                        <span className="field-icon">⚖️</span>
                        <input type="number" step="0.1" placeholder="70.0" value={form.weight} onChange={e => setForm(f=>({...f,weight:e.target.value}))} />
                        <span className="field-unit">kg</span>
                      </div>
                    </div>
                  </div>
                  {bmi && (
                    <div style={{marginTop:16,padding:'14px 18px',background:'rgba(255,255,255,0.02)',border:'1px solid var(--line)',borderRadius:12,display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:22}}>📊</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700}}>Your BMI: <span style={{color:bmiColor||'var(--lime)'}}>{bmi} — {bmiLabel}</span></div>
                        <div style={{fontSize:11,color:'var(--sub)',fontWeight:300}}>Based on your height and weight above</div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{display:'flex',justifyContent:'flex-end'}}>
                  <button className="btn-save" onClick={saveProfile} disabled={saving}>
                    {saving ? '⏳ Saving...' : '✓ Save Profile'}
                  </button>
                </div>
              </>
            )}

            {/* ── GOALS TAB ── */}
            {activeTab === 'goals' && (
              <>
                {/* Fitness Goal */}
                <div className="form-section fs-lime">
                  <div className="section-title">🎯 Fitness Goal</div>
                  <div className="section-sub">What are you primarily training for?</div>
                  <div className="goal-grid">
                    {fitnessGoals.map(g => (
                      <button key={g.id} className={`goal-btn ${form.fitnessGoal===g.id?'active':''}`} onClick={() => setForm(f=>({...f,fitnessGoal:g.id}))}>
                        <div className="goal-icon">{g.icon}</div>
                        <div className="goal-label">{g.label}</div>
                        <div className="goal-desc">{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily Targets */}
                <div className="form-section fs-cyan">
                  <div className="section-title">🎯 Daily Targets</div>
                  <div className="section-sub">Set your daily goals — these appear as progress bars on your dashboard</div>
                  <div className="grid-3">
                    <div className="field">
                      <div className="field-label">Calorie Goal</div>
                      <div className="field-wrap">
                        <span className="field-icon">🔥</span>
                        <input type="number" placeholder="2000" value={form.calorieGoal} onChange={e => setForm(f=>({...f,calorieGoal:e.target.value}))} />
                        <span className="field-unit">kcal</span>
                      </div>
                    </div>
                    <div className="field">
                      <div className="field-label">Water Goal</div>
                      <div className="field-wrap">
                        <span className="field-icon">💧</span>
                        <input type="number" placeholder="2500" value={form.waterGoal} onChange={e => setForm(f=>({...f,waterGoal:e.target.value}))} />
                        <span className="field-unit">ml</span>
                      </div>
                    </div>
                    <div className="field">
                      <div className="field-label">Protein Goal</div>
                      <div className="field-wrap">
                        <span className="field-icon">🥩</span>
                        <input type="number" placeholder="150" value={form.proteinGoal} onChange={e => setForm(f=>({...f,proteinGoal:e.target.value}))} />
                        <span className="field-unit">g</span>
                      </div>
                    </div>
                  </div>

                  {/* Suggested targets */}
                  {form.weight && form.fitnessGoal && (
                    <div style={{marginTop:16,padding:'14px 18px',background:'rgba(198,241,53,0.04)',border:'1px solid rgba(198,241,53,0.12)',borderRadius:12}}>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--lime)',marginBottom:8,letterSpacing:'0.5px'}}>💡 AI SUGGESTIONS FOR YOUR GOAL</div>
                      <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
                        {[
                          { label:'Calories', val: form.fitnessGoal==='weight_loss' ? Math.round(Number(form.weight)*28) : form.fitnessGoal==='muscle_gain' ? Math.round(Number(form.weight)*35) : Math.round(Number(form.weight)*32), unit:'kcal' },
                          { label:'Protein', val: Math.round(Number(form.weight)*1.8), unit:'g' },
                          { label:'Water', val: Math.round(Number(form.weight)*35), unit:'ml' },
                        ].map(s => (
                          <div key={s.label} style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:12,color:'var(--sub)'}}>{s.label}:</span>
                            <button onClick={() => {
                              if(s.label==='Calories') setForm(f=>({...f,calorieGoal:String(s.val)}));
                              if(s.label==='Protein') setForm(f=>({...f,proteinGoal:String(s.val)}));
                              if(s.label==='Water') setForm(f=>({...f,waterGoal:String(s.val)}));
                            }} style={{background:'rgba(198,241,53,0.1)',border:'1px solid rgba(198,241,53,0.2)',borderRadius:8,padding:'4px 10px',color:'var(--lime)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                              {s.val} {s.unit}
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize:11,color:'var(--sub)',marginTop:8,fontWeight:300}}>Click any value to apply it</div>
                    </div>
                  )}
                </div>

                <div style={{display:'flex',justifyContent:'flex-end'}}>
                  <button className="btn-save" onClick={saveProfile} disabled={saving}>
                    {saving ? '⏳ Saving...' : '✓ Save Goals'}
                  </button>
                </div>
              </>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
              <>
                <div className="form-section fs-violet">
                  <div className="section-title">🔐 Change Password</div>
                  <div className="section-sub">Choose a strong password with at least 6 characters</div>

                  {pwError && <div className="alert-error">⚠️ {pwError}</div>}
                  {pwSuccess && <div className="alert-success">✓ Password changed successfully!</div>}

                  <div style={{display:'flex',flexDirection:'column',gap:14}}>
                    {[
                      {key:'currentPassword',label:'Current Password',icon:'🔑',placeholder:'Enter current password'},
                      {key:'newPassword',label:'New Password',icon:'🔒',placeholder:'Min. 6 characters'},
                      {key:'confirmPassword',label:'Confirm New Password',icon:'🔒',placeholder:'Re-enter new password'},
                    ].map(f => (
                      <div className="field" key={f.key}>
                        <div className="field-label">{f.label}</div>
                        <div className="field-wrap">
                          <span className="field-icon">{f.icon}</span>
                          <input
                            type={showPw[f.key as keyof typeof showPw] ? 'text' : 'password'}
                            placeholder={f.placeholder}
                            value={pwForm[f.key as keyof typeof pwForm]}
                            onChange={e => setPwForm(p=>({...p,[f.key]:e.target.value}))}
                          />
                          <button className="eye-btn" onClick={() => setShowPw(p=>({...p,[f.key]:!p[f.key as keyof typeof showPw]}))}>
                            {showPw[f.key as keyof typeof showPw] ? '🙈' : '👁️'}
                          </button>
                        </div>
                        {f.key==='confirmPassword' && pwForm.confirmPassword && (
                          <div style={{fontSize:11,fontWeight:700,color:pwForm.newPassword===pwForm.confirmPassword?'var(--lime)':'var(--rose)'}}>
                            {pwForm.newPassword===pwForm.confirmPassword ? '✓ Passwords match' : '⚠ Passwords do not match'}
                          </div>
                        )}
                      </div>
                    ))}
                    <button className="btn-pw" onClick={changePassword} disabled={pwLoading}>
                      {pwLoading ? '⏳ Changing...' : '🔐 Change Password'}
                    </button>
                  </div>
                </div>

                {/* Account Info */}
                <div className="form-section fs-cyan">
                  <div className="section-title">📋 Account Information</div>
                  <div className="section-sub">Your account details — email cannot be changed</div>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {[
                      {label:'Email Address',value:user?.email,icon:'✉️'},
                      {label:'Account Role',value:user?.role==='admin'?'Administrator':'Member',icon:'🛡️'},
                      {label:'Member Since',value:user?.createdAt?new Date(user.createdAt).toLocaleDateString('en-PK',{year:'numeric',month:'long',day:'numeric'}):'—',icon:'📅'},
                      {label:'Verification',value:user?.isVerified?'✓ Email Verified':'⚠ Not Verified',icon:'✅'},
                    ].map(item => (
                      <div key={item.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'rgba(255,255,255,0.02)',border:'1px solid var(--line)',borderRadius:10}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <span style={{fontSize:16}}>{item.icon}</span>
                          <span style={{fontSize:13,color:'var(--sub)',fontWeight:500}}>{item.label}</span>
                        </div>
                        <span style={{fontSize:13,fontWeight:600}}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="danger-zone">
                  <div className="danger-title">⚠️ Danger Zone</div>
                  <div className="danger-sub">Once you delete your account, all your data will be permanently removed. This cannot be undone.</div>
                  <button className="btn-danger" onClick={() => confirm('Are you sure? This cannot be undone.') && alert('Please contact support to delete your account.')}>
                    Delete My Account
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}