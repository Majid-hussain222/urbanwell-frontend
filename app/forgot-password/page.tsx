'use client';
import { useState } from 'react';
import API from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim()) return setError('Please enter your email address');
    setError('');
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        :root {
          --void:#03050a; --panel:#0a1220; --panel2:#0f1a2e;
          --lime:#c6f135; --cyan:#00d4ff; --text:#e2ecff; --sub:#4d6b8a;
          --line:rgba(0,212,255,0.08); --rose:#f43f5e;
        }
        body { background:var(--void); color:var(--text); font-family:'Plus Jakarta Sans',sans-serif; -webkit-font-smoothing:antialiased; min-height:100vh; display:flex; align-items:center; justify-content:center; }
        body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events:none; z-index:9999; opacity:0.4; }

        /* BG MESH */
        .bg { position:fixed; inset:0; background:radial-gradient(ellipse 60% 50% at 20% 50%, rgba(198,241,53,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 80% 30%, rgba(0,212,255,0.04) 0%, transparent 60%); pointer-events:none; }
        .bg-grid { position:fixed; inset:0; background-image:radial-gradient(circle, rgba(0,212,255,0.04) 1px, transparent 1px); background-size:48px 48px; pointer-events:none; mask-image:radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 100%); }

        /* CARD */
        .card { position:relative; z-index:1; width:100%; max-width:440px; padding:20px; }
        .box { background:var(--panel); border:1px solid var(--line); border-radius:24px; padding:44px 40px; position:relative; overflow:hidden; }
        .box::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(198,241,53,0.4),transparent); }

        /* LOGO */
        .logo { display:flex; align-items:center; gap:10px; text-decoration:none; margin-bottom:36px; justify-content:center; }
        .logo-icon { width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,var(--lime),var(--cyan)); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:#000; }
        .logo-text { font-size:20px; font-weight:800; letter-spacing:-0.5px; }
        .logo-text em { font-style:normal; color:var(--lime); }

        /* HEADER */
        .icon-wrap { width:64px; height:64px; border-radius:18px; background:rgba(198,241,53,0.08); border:1px solid rgba(198,241,53,0.15); display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 20px; }
        .title { font-size:26px; font-weight:800; letter-spacing:-1.2px; text-align:center; margin-bottom:8px; }
        .subtitle { font-size:14px; color:var(--sub); font-weight:300; text-align:center; line-height:1.7; margin-bottom:32px; }
        .subtitle strong { color:var(--text); font-weight:600; }

        /* FORM */
        .field { margin-bottom:16px; }
        .field label { display:block; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--sub); margin-bottom:8px; }
        .input-wrap { position:relative; }
        .input-icon { position:absolute; left:16px; top:50%; transform:translateY(-50%); font-size:16px; pointer-events:none; opacity:0.5; }
        .field input { width:100%; padding:14px 16px 14px 46px; background:var(--panel2); border:1px solid var(--line); border-radius:12px; color:var(--text); font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:all 0.25s; }
        .field input::placeholder { color:var(--sub); opacity:0.5; }
        .field input:focus { border-color:rgba(198,241,53,0.4); box-shadow:0 0 0 3px rgba(198,241,53,0.07); }

        /* ERROR */
        .error { display:flex; align-items:center; gap:8px; padding:12px 16px; background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2); border-radius:10px; font-size:13px; color:#fb7185; margin-bottom:16px; }

        /* BUTTON */
        .btn-submit { width:100%; padding:15px; background:var(--lime); color:#000; font-size:15px; font-weight:800; border-radius:12px; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.25s; letter-spacing:-0.3px; }
        .btn-submit:hover:not(:disabled) { background:#d4ff45; box-shadow:0 0 32px rgba(198,241,53,0.4); transform:translateY(-1px); }
        .btn-submit:disabled { opacity:0.5; cursor:not-allowed; }

        /* BACK LINK */
        .back-link { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:24px; font-size:13px; color:var(--sub); text-decoration:none; transition:color 0.2s; }
        .back-link:hover { color:var(--text); }

        /* SUCCESS STATE */
        .success-box { text-align:center; padding:12px 0; }
        .success-icon { font-size:56px; margin-bottom:20px; }
        .success-title { font-size:22px; font-weight:800; letter-spacing:-1px; margin-bottom:12px; }
        .success-sub { font-size:14px; color:var(--sub); font-weight:300; line-height:1.8; margin-bottom:28px; }
        .success-sub strong { color:var(--lime); font-weight:700; }
        .success-steps { text-align:left; background:rgba(255,255,255,0.02); border:1px solid var(--line); border-radius:12px; padding:18px 20px; margin-bottom:24px; }
        .step { display:flex; align-items:flex-start; gap:10px; font-size:13px; color:var(--sub); margin-bottom:10px; line-height:1.5; }
        .step:last-child { margin-bottom:0; }
        .step-num { width:20px; height:20px; border-radius:6px; background:rgba(198,241,53,0.1); border:1px solid rgba(198,241,53,0.2); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:var(--lime); flex-shrink:0; margin-top:1px; }
        .btn-resend { width:100%; padding:13px; background:rgba(255,255,255,0.04); color:var(--text); font-size:14px; font-weight:600; border-radius:12px; border:1px solid var(--line); cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; margin-bottom:8px; }
        .btn-resend:hover { border-color:rgba(255,255,255,0.2); background:rgba(255,255,255,0.07); }

        @media(max-width:480px) { .box { padding:32px 24px; } }
      `}</style>

      <div className="bg" /><div className="bg-grid" />

      <div className="card">
        <div className="box">

          <a className="logo" href="/">
            <div className="logo-icon">U</div>
            <span className="logo-text"><em>Urban</em>Well</span>
          </a>

          {!sent ? (
            <>
              <div className="icon-wrap">🔐</div>
              <div className="title">Forgot password?</div>
              <p className="subtitle">
                No worries — enter your email and we'll send you a<br />
                <strong>secure reset link</strong> right away.
              </p>

              {error && (
                <div className="error">⚠️ {error}</div>
              )}

              <div className="field">
                <label>Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    autoFocus
                  />
                </div>
              </div>

              <button className="btn-submit" onClick={submit} disabled={loading || !email.trim()}>
                {loading ? '⏳ Sending reset link...' : '📧 Send Reset Link'}
              </button>

              <a className="back-link" href="/login">← Back to Login</a>
            </>
          ) : (
            <div className="success-box">
              <div className="success-icon">📬</div>
              <div className="success-title">Check your inbox!</div>
              <p className="success-sub">
                We sent a reset link to <strong>{email}</strong>.<br />
                It expires in 1 hour.
              </p>
              <div className="success-steps">
                <div className="step"><div className="step-num">1</div>Open the email from UrbanWell</div>
                <div className="step"><div className="step-num">2</div>Click the "Reset My Password" button</div>
                <div className="step"><div className="step-num">3</div>Choose a new password and log in</div>
              </div>
              <button className="btn-resend" onClick={() => { setSent(false); setEmail(''); }}>
                ↩ Try a different email
              </button>
              <a className="back-link" href="/login">← Back to Login</a>
            </div>
          )}

        </div>
      </div>
    </>
  );
}