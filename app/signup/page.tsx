'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '../lib/api';

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState<'form'|'otp'>('form');
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await API.post('/auth/signup', form);
      setStep('otp');
      setSuccess('OTP sent to your email!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await API.post('/auth/verifyOtp', { email: form.email, otp });
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
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
        }
        body { background:var(--void); color:var(--text); font-family:'Plus Jakarta Sans',sans-serif; -webkit-font-smoothing:antialiased; }
        body::before {
          content:''; position:fixed; inset:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events:none; z-index:9999; opacity:0.4;
        }
        .page { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; }
        .left {
          background:var(--panel); border-right:1px solid var(--line);
          display:flex; flex-direction:column; justify-content:space-between; padding:48px;
          position:relative; overflow:hidden;
        }
        .left-mesh {
          position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(ellipse 80% 60% at 90% 10%, rgba(198,241,53,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 10% 90%, rgba(0,212,255,0.04) 0%, transparent 60%);
        }
        .left-dots {
          position:absolute; inset:0; pointer-events:none;
          background-image:radial-gradient(circle, rgba(0,212,255,0.08) 1px, transparent 1px);
          background-size:36px 36px;
          mask-image:radial-gradient(ellipse 80% 80% at 70% 30%, black 10%, transparent 80%);
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
        .left-h { font-size:42px; font-weight:800; letter-spacing:-2px; line-height:1; margin-bottom:16px; }
        .left-h span { color:var(--lime); }
        .left-p { font-size:15px; font-weight:300; color:var(--sub); line-height:1.7; max-width:320px; margin-bottom:32px; }
        .perks { display:flex; flex-direction:column; gap:14px; }
        .perk { display:flex; align-items:center; gap:14px; }
        .perk-icon {
          width:40px; height:40px; border-radius:10px;
          background:rgba(198,241,53,0.08); border:1px solid rgba(198,241,53,0.15);
          display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;
        }
        .perk-title { font-size:14px; font-weight:600; margin-bottom:2px; }
        .perk-sub { font-size:12px; color:var(--sub); font-weight:300; }
        .left-copy { font-size:12px; color:var(--sub); position:relative; z-index:1; }
        .right { display:flex; align-items:center; justify-content:center; padding:48px; background:var(--void); }
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
          font-size:15px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:400;
          outline:none; transition:border-color 0.2s, box-shadow 0.2s;
        }
        .field input::placeholder { color:var(--sub); opacity:0.5; }
        .field input:focus { border-color:rgba(198,241,53,0.3); box-shadow:0 0 0 3px rgba(198,241,53,0.06); }
        .form-note { font-size:12px; color:var(--sub); margin-bottom:20px; line-height:1.6; }
        .form-error {
          background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2);
          border-radius:10px; padding:12px 16px;
          font-size:13px; color:#fb7185; margin-bottom:18px;
        }
        .form-success {
          background:rgba(198,241,53,0.06); border:1px solid rgba(198,241,53,0.2);
          border-radius:10px; padding:12px 16px;
          font-size:13px; color:var(--lime); margin-bottom:18px;
        }
        .btn-submit {
          width:100%; padding:16px;
          background:var(--lime); color:#000;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:15px; font-weight:800; letter-spacing:-0.3px;
          border:none; border-radius:12px; cursor:pointer;
          transition:all 0.25s; margin-top:6px;
        }
        .btn-submit:hover:not(:disabled) { background:#d4ff45; box-shadow:0 0 32px rgba(198,241,53,0.3); transform:translateY(-1px); }
        .btn-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .btn-ghost {
          width:100%; padding:14px;
          background:transparent; color:var(--sub);
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:14px; font-weight:500;
          border:1px solid var(--line); border-radius:12px; cursor:pointer;
          transition:all 0.2s; margin-top:10px;
        }
        .btn-ghost:hover { color:var(--text); border-color:rgba(255,255,255,0.12); }
        .terms { font-size:12px; color:var(--sub); text-align:center; margin-top:18px; line-height:1.6; }
        .terms a { color:var(--lime); text-decoration:none; }
        /* OTP inputs */
        .otp-info { background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:20px; margin-bottom:24px; }
        .otp-info-title { font-size:14px; font-weight:600; margin-bottom:6px; }
        .otp-info-sub { font-size:13px; color:var(--sub); font-weight:300; }
        .otp-info-email { color:var(--lime); font-weight:500; }
        @media(max-width:768px) { .page { grid-template-columns:1fr; } .left { display:none; } }
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
            <h2 className="left-h">Start your<br /><span>journey.</span></h2>
            <p className="left-p">Everything you need to transform your health — in one intelligent platform.</p>
            <div className="perks">
              {[
                { icon:'⚡', title:'AI Workout Plans', sub:'Personalized and adaptive to your progress' },
                { icon:'🥗', title:'Smart Nutrition', sub:'Macro-precise meal recommendations daily' },
                { icon:'📊', title:'Progress Analytics', sub:'Track every metric, hit every milestone' },
              ].map(p => (
                <div className="perk" key={p.title}>
                  <div className="perk-icon">{p.icon}</div>
                  <div>
                    <div className="perk-title">{p.title}</div>
                    <div className="perk-sub">{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="left-copy">© 2025 UrbanWell. Free to start, no credit card required.</p>
        </div>

        {/* Right */}
        <div className="right">
          <div className="form-box">
            {step === 'form' ? (
              <>
                <h1 className="form-title">Create account</h1>
                <p className="form-sub">Already have one? <a href="/login">Sign in</a></p>
                {error && <div className="form-error">⚠ {error}</div>}
                <form onSubmit={signup}>
                  <div className="field">
                    <label>Full Name</label>
                    <input name="name" placeholder="John Smith" value={form.name} onChange={handle} required />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <input name="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={handle} required minLength={8} />
                  </div>
                  <button className="btn-submit" type="submit" disabled={loading}>
                    {loading ? 'Creating account…' : 'Create account →'}
                  </button>
                </form>
                <p className="terms">By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a></p>
              </>
            ) : (
              <>
                <h1 className="form-title">Verify email</h1>
                <p className="form-sub">Enter the 6-digit code we sent you</p>
                <div className="otp-info">
                  <div className="otp-info-title">📧 Check your inbox</div>
                  <div className="otp-info-sub">We sent a code to <span className="otp-info-email">{form.email}</span></div>
                </div>
                {error && <div className="form-error">⚠ {error}</div>}
                {success && <div className="form-success">✓ {success}</div>}
                <form onSubmit={verify}>
                  <div className="field">
                    <label>6-Digit OTP Code</label>
                    <input
                      value={otp} onChange={e => setOtp(e.target.value)}
                      placeholder="000000" maxLength={6}
                      style={{ fontSize:24, letterSpacing:8, textAlign:'center' }}
                      required
                    />
                  </div>
                  <button className="btn-submit" type="submit" disabled={loading}>
                    {loading ? 'Verifying…' : 'Verify & Continue →'}
                  </button>
                </form>
                <button className="btn-ghost" onClick={() => { setStep('form'); setError(''); }}>
                  ← Back to signup
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}