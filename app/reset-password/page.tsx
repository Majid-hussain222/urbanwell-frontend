'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import API from '../lib/api';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Validate token exists in URL
  const tokenMissing = !token || !email;

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#f43f5e', '#f59e0b', '#00d4ff', '#c6f135'][strength];

  const submit = async () => {
    if (!password) return setError('Please enter a new password');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setError('');
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, email, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenMissing) {
    return (
      <div className="error-state">
        <div className="error-icon">⚠️</div>
        <div className="error-title">Invalid Reset Link</div>
        <p className="error-sub">This link is missing required information. Please request a new password reset.</p>
        <a className="btn-action" href="/forgot-password">Request New Link →</a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="success-box">
        <div className="success-anim">✅</div>
        <div className="success-title">Password Reset!</div>
        <p className="success-sub">Your password has been changed successfully. Redirecting you to login in 3 seconds...</p>
        <a className="btn-action" href="/login">Go to Login →</a>
      </div>
    );
  }

  return (
    <>
      <div className="icon-wrap">🔑</div>
      <div className="title">Create new password</div>
      <p className="subtitle">
        Resetting password for <strong>{decodeURIComponent(email)}</strong>
      </p>

      {error && <div className="error-msg">⚠️ {error}</div>}

      <div className="field">
        <label>New Password</label>
        <div className="input-wrap">
          <span className="input-icon">🔒</span>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Min. 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button className="eye-btn" onClick={() => setShowPw(!showPw)}>
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
        {password && (
          <div className="strength-row">
            <div className="strength-track">
              <div className="strength-fill" style={{ width:`${strength * 25}%`, background:strengthColor }} />
            </div>
            <span className="strength-label" style={{ color:strengthColor }}>{strengthLabel}</span>
          </div>
        )}
      </div>

      <div className="field">
        <label>Confirm New Password</label>
        <div className="input-wrap">
          <span className="input-icon">🔒</span>
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter your password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
          <button className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? '🙈' : '👁️'}
          </button>
        </div>
        {confirm && password !== confirm && (
          <div style={{ fontSize:11, color:'#fb7185', marginTop:6, fontWeight:600 }}>⚠️ Passwords don't match</div>
        )}
        {confirm && password === confirm && password.length >= 6 && (
          <div style={{ fontSize:11, color:'var(--lime)', marginTop:6, fontWeight:600 }}>✓ Passwords match</div>
        )}
      </div>

      <button
        className="btn-submit"
        onClick={submit}
        disabled={loading || !password || !confirm || password !== confirm}
      >
        {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
      </button>

      <a className="back-link" href="/login">← Back to Login</a>
    </>
  );
}

export default function ResetPassword() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        :root {
          --void:#03050a; --panel:#0a1220; --panel2:#0f1a2e;
          --lime:#c6f135; --cyan:#00d4ff; --text:#e2ecff; --sub:#4d6b8a;
          --line:rgba(0,212,255,0.08);
        }
        body { background:var(--void); color:var(--text); font-family:'Plus Jakarta Sans',sans-serif; -webkit-font-smoothing:antialiased; min-height:100vh; display:flex; align-items:center; justify-content:center; }
        body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events:none; z-index:9999; opacity:0.4; }

        .bg { position:fixed; inset:0; background:radial-gradient(ellipse 60% 50% at 20% 50%, rgba(198,241,53,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 80% 30%, rgba(0,212,255,0.04) 0%, transparent 60%); pointer-events:none; }
        .bg-grid { position:fixed; inset:0; background-image:radial-gradient(circle, rgba(0,212,255,0.04) 1px, transparent 1px); background-size:48px 48px; pointer-events:none; mask-image:radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 100%); }

        .card { position:relative; z-index:1; width:100%; max-width:440px; padding:20px; }
        .box { background:var(--panel); border:1px solid var(--line); border-radius:24px; padding:44px 40px; position:relative; overflow:hidden; }
        .box::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(198,241,53,0.4),transparent); }

        .logo { display:flex; align-items:center; gap:10px; text-decoration:none; margin-bottom:36px; justify-content:center; }
        .logo-icon { width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,var(--lime),var(--cyan)); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:#000; }
        .logo-text { font-size:20px; font-weight:800; letter-spacing:-0.5px; }
        .logo-text em { font-style:normal; color:var(--lime); }

        .icon-wrap { width:64px; height:64px; border-radius:18px; background:rgba(198,241,53,0.08); border:1px solid rgba(198,241,53,0.15); display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 20px; }
        .title { font-size:26px; font-weight:800; letter-spacing:-1.2px; text-align:center; margin-bottom:8px; }
        .subtitle { font-size:13px; color:var(--sub); font-weight:300; text-align:center; line-height:1.7; margin-bottom:28px; }
        .subtitle strong { color:var(--lime); font-weight:600; font-size:12px; }

        .field { margin-bottom:16px; }
        .field label { display:block; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--sub); margin-bottom:8px; }
        .input-wrap { position:relative; }
        .input-icon { position:absolute; left:16px; top:50%; transform:translateY(-50%); font-size:16px; pointer-events:none; opacity:0.5; }
        .eye-btn { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:16px; padding:2px; opacity:0.6; transition:opacity 0.2s; }
        .eye-btn:hover { opacity:1; }
        .field input { width:100%; padding:14px 46px 14px 46px; background:var(--panel2); border:1px solid var(--line); border-radius:12px; color:var(--text); font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:all 0.25s; }
        .field input::placeholder { color:var(--sub); opacity:0.5; }
        .field input:focus { border-color:rgba(198,241,53,0.4); box-shadow:0 0 0 3px rgba(198,241,53,0.07); }

        .strength-row { display:flex; align-items:center; gap:10px; margin-top:8px; }
        .strength-track { flex:1; height:4px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; }
        .strength-fill { height:100%; border-radius:2px; transition:all 0.4s ease; }
        .strength-label { font-size:11px; font-weight:700; width:44px; text-align:right; }

        .error-msg { display:flex; align-items:center; gap:8px; padding:12px 16px; background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2); border-radius:10px; font-size:13px; color:#fb7185; margin-bottom:16px; }

        .btn-submit { width:100%; padding:15px; background:var(--lime); color:#000; font-size:15px; font-weight:800; border-radius:12px; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.25s; letter-spacing:-0.3px; }
        .btn-submit:hover:not(:disabled) { background:#d4ff45; box-shadow:0 0 32px rgba(198,241,53,0.4); transform:translateY(-1px); }
        .btn-submit:disabled { opacity:0.4; cursor:not-allowed; }

        .back-link { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:20px; font-size:13px; color:var(--sub); text-decoration:none; transition:color 0.2s; }
        .back-link:hover { color:var(--text); }

        /* ERROR + SUCCESS STATES */
        .error-state, .success-box { text-align:center; padding:8px 0; }
        .error-icon, .success-anim { font-size:52px; margin-bottom:16px; }
        .error-title, .success-title { font-size:22px; font-weight:800; letter-spacing:-1px; margin-bottom:10px; }
        .error-sub, .success-sub { font-size:14px; color:var(--sub); line-height:1.7; font-weight:300; margin-bottom:24px; }
        .btn-action { display:inline-flex; align-items:center; gap:6px; padding:13px 28px; background:var(--lime); color:#000; font-size:14px; font-weight:800; border-radius:12px; text-decoration:none; transition:all 0.2s; }
        .btn-action:hover { background:#d4ff45; box-shadow:0 0 24px rgba(198,241,53,0.4); }

        @media(max-width:480px) { .box { padding:32px 24px; } }
      `}</style>

      <div className="bg" /><div className="bg-grid" />
      <div className="card">
        <div className="box">
          <a className="logo" href="/">
            <div className="logo-icon">U</div>
            <span className="logo-text"><em>Urban</em>Well</span>
          </a>
          <Suspense fallback={<div style={{ textAlign:'center', color:'var(--sub)' }}>Loading...</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}