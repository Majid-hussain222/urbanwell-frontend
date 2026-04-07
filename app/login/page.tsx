'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '../lib/api';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await API.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        :root {
          --void:#03050a; --panel:#0a1220; --panel2:#0f1a2e;
          --lime:#c6f135; --cyan:#00d4ff;
          --text:#e2ecff; --sub:#4d6b8a; --line:rgba(0,212,255,0.08);
          --err:#f43f5e;
        }
        body { background:var(--void); color:var(--text); font-family:'Plus Jakarta Sans',sans-serif; -webkit-font-smoothing:antialiased; }
        body::before {
          content:''; position:fixed; inset:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events:none; z-index:9999; opacity:0.4;
        }
        .page {
          min-height:100vh; display:grid; grid-template-columns:1fr 1fr;
        }
        /* Left panel */
        .left {
          background:var(--panel);
          border-right:1px solid var(--line);
          display:flex; flex-direction:column;
          justify-content:space-between; padding:48px;
          position:relative; overflow:hidden;
        }
        .left-mesh {
          position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(ellipse 80% 60% at 10% 80%, rgba(198,241,53,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 90% 20%, rgba(0,212,255,0.04) 0%, transparent 60%);
        }
        .left-dots {
          position:absolute; inset:0; pointer-events:none;
          background-image:radial-gradient(circle, rgba(0,212,255,0.08) 1px, transparent 1px);
          background-size:36px 36px;
          mask-image:radial-gradient(ellipse 80% 80% at 30% 70%, black 10%, transparent 80%);
        }
        .left-logo { display:flex; align-items:center; gap:10px; text-decoration:none; position:relative; z-index:1; }
        .left-logo-icon {
          width:36px; height:36px; border-radius:10px;
          background:linear-gradient(135deg,var(--lime),var(--cyan));
          display:flex; align-items:center; justify-content:center;
          font-size:18px; font-weight:900; color:#000;
        }
        .left-logo-text { font-size:20px; font-weight:700; letter-spacing:-0.5px; }
        .left-logo-text em { font-style:normal; color:var(--lime); }
        .left-content { position:relative; z-index:1; }
        .left-tag {
          display:inline-flex; align-items:center; gap:8px;
          padding:6px 16px; border-radius:100px;
          border:1px solid rgba(198,241,53,0.2);
          background:rgba(198,241,53,0.06);
          font-size:11px; font-weight:600; letter-spacing:2px;
          text-transform:uppercase; color:var(--lime); margin-bottom:28px;
        }
        .left-dot { width:6px; height:6px; border-radius:50%; background:var(--lime); animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(198,241,53,0.5)} 50%{box-shadow:0 0 0 6px rgba(198,241,53,0)} }
        .left-h { font-size:42px; font-weight:800; letter-spacing:-2px; line-height:1; margin-bottom:16px; }
        .left-h span { color:var(--lime); }
        .left-p { font-size:15px; font-weight:300; color:var(--sub); line-height:1.7; max-width:320px; }
        .left-stats { display:flex; gap:32px; }
        .lst-val { font-size:26px; font-weight:800; letter-spacing:-1px; color:var(--text); line-height:1; margin-bottom:4px; }
        .lst-lbl { font-size:11px; color:var(--sub); font-weight:500; }
        /* Right panel */
        .right {
          display:flex; align-items:center; justify-content:center;
          padding:48px; background:var(--void);
        }
        .form-box { width:100%; max-width:400px; }
        .form-title { font-size:28px; font-weight:800; letter-spacing:-1px; margin-bottom:6px; }
        .form-sub { font-size:14px; color:var(--sub); font-weight:300; margin-bottom:36px; }
        .form-sub a { color:var(--lime); text-decoration:none; font-weight:500; }
        .form-sub a:hover { text-decoration:underline; }
        .field { margin-bottom:18px; }
        .field label { display:block; font-size:12px; font-weight:600; letter-spacing:0.5px; color:var(--sub); margin-bottom:8px; text-transform:uppercase; }
        .field input {
          width:100%; padding:14px 18px;
          background:var(--panel); border:1px solid var(--line);
          border-radius:12px; color:var(--text);
          font-size:15px; font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:400; outline:none;
          transition:border-color 0.2s, box-shadow 0.2s;
        }
        .field input::placeholder { color:var(--sub); opacity:0.5; }
        .field input:focus { border-color:rgba(198,241,53,0.3); box-shadow:0 0 0 3px rgba(198,241,53,0.06); }
        .form-error {
          background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2);
          border-radius:10px; padding:12px 16px;
          font-size:13px; color:#fb7185; margin-bottom:18px;
          display:flex; align-items:center; gap:8px;
        }
        .btn-submit {
          width:100%; padding:16px;
          background:var(--lime); color:#000;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:15px; font-weight:800; letter-spacing:-0.3px;
          border:none; border-radius:12px; cursor:pointer;
          transition:all 0.25s; margin-top:6px;
        }
        .btn-submit:hover:not(:disabled) {
          background:#d4ff45;
          box-shadow:0 0 32px rgba(198,241,53,0.3);
          transform:translateY(-1px);
        }
        .btn-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .divider { display:flex; align-items:center; gap:12px; margin:24px 0; }
        .div-line { flex:1; height:1px; background:var(--line); }
        .div-text { font-size:12px; color:var(--sub); }
        .social-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .btn-social {
          padding:13px; background:var(--panel); border:1px solid var(--line);
          border-radius:12px; color:var(--text); font-size:13px; font-weight:500;
          text-align:center; cursor:pointer; transition:all 0.2s;
          font-family:'Plus Jakarta Sans',sans-serif;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .btn-social:hover { border-color:rgba(255,255,255,0.15); background:var(--panel2); }
        .forgot { display:block; text-align:right; font-size:12px; color:var(--sub); text-decoration:none; margin-bottom:20px; }
        .forgot:hover { color:var(--lime); }
        @media(max-width:768px) {
          .page { grid-template-columns:1fr; }
          .left { display:none; }
        }
      `}</style>

      <div className="page">
        {/* Left */}
        <div className="left">
          <div className="left-mesh" /><div className="left-dots" />
          <a className="left-logo" href="/">
            <div className="left-logo-icon">U</div>
            <span className="left-logo-text"><em>Urban</em>Well</span>
          </a>
          <div className="left-content">
            <div className="left-tag"><div className="left-dot" />AI Health Platform</div>
            <h2 className="left-h">Welcome<br /><span>back.</span></h2>
            <p className="left-p">Your AI workout plans, nutrition insights, and progress data are waiting for you.</p>
          </div>
          <div className="left-stats">
            {[{v:'47K+',l:'Members'},{v:'98.4%',l:'Goal Rate'},{v:'4.9★',l:'Rating'}].map(s=>(
              <div key={s.l}>
                <div className="lst-val">{s.v}</div>
                <div className="lst-lbl">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="right">
          <div className="form-box">
            <h1 className="form-title">Sign in</h1>
            <p className="form-sub">Don't have an account? <a href="/signup">Create one free</a></p>

            <div className="social-row">
              <button className="btn-social">🔵 Google</button>
              <button className="btn-social">⚫ Apple</button>
            </div>
            <div className="divider">
              <div className="div-line" /><span className="div-text">or continue with email</span><div className="div-line" />
            </div>

            {error && <div className="form-error">⚠ {error}</div>}

            <form onSubmit={submit}>
              <div className="field">
                <label>Email</label>
                <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
              </div>
              <div className="field">
                <label>Password</label>
                <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} required />
              </div>
              <a className="forgot" href="/forgot-password">Forgot password?</a>
              <button className="btn-submit" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}