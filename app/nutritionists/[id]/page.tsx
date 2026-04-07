'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

const GRADIENTS = [
  'linear-gradient(135deg,#c6f135,#00d4ff)',
  'linear-gradient(135deg,#00d4ff,#8b5cf6)',
  'linear-gradient(135deg,#8b5cf6,#f43f5e)',
  'linear-gradient(135deg,#f59e0b,#c6f135)',
  'linear-gradient(135deg,#f43f5e,#f59e0b)',
  'linear-gradient(135deg,#34d399,#00d4ff)',
];

function initials(name: string) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function NutritionistProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [n,         setN]         = useState<any>(null);
  const [reviews,   setReviews]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('about');
  const [showBook,  setShowBook]  = useState(false);
  const [showMsg,   setShowMsg]   = useState(false);
  const [booking,   setBooking]   = useState({ date:'', time:'', type:'Video Consultation', notes:'' });
  const [bookingOk, setBookingOk] = useState(false);
  const [bookingLoading, setBL]   = useState(false);
  const [message,   setMessage]   = useState('');
  const [msgSent,   setMsgSent]   = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [toast,     setToast]     = useState('');
  const [user,      setUser]      = useState<any>(null);

  const id = typeof params?.id === 'string' ? params.id : (params as any)?.id;

  useEffect(() => {
    (async () => {
      try {
        const [nRes, userRes, revRes] = await Promise.allSettled([
          API.get(`/nutritionists/${id}`),
          API.get('/users/profile'),
          API.get(`/reviews?nutritionist=${id}&limit=10`),
        ]);
        if (nRes.status === 'fulfilled') setN(nRes.value.data?.data || nRes.value.data?.nutritionist || nRes.value.data);
        if (userRes.status === 'fulfilled') setUser(userRes.value.data?.data || userRes.value.data);
        if (revRes.status === 'fulfilled') setReviews(revRes.value.data?.data || []);
      } catch { router.push('/nutritionists'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const submitBooking = async () => {
    if (!booking.date || !booking.time) return showToast('Please select date and time');
    if (!user) return router.push('/login');
    setBL(true);
    try {
      await API.post('/bookings', { nutritionist: n?._id, sessionType: booking.type, date: booking.date, timeSlot: booking.time, notes: booking.notes });
      setBookingOk(true);
      showToast('✓ Booking confirmed!');
      setTimeout(() => { setShowBook(false); setBookingOk(false); }, 3000);
    } catch (e: any) { showToast(e?.response?.data?.message || 'Booking failed'); }
    setBL(false);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    if (!user) return router.push('/login');
    try {
      await API.post('/chat', { nutritionistId: n?._id });
      setMsgSent(true);
      setTimeout(() => { setShowMsg(false); setMsgSent(false); setMessage(''); }, 2500);
    } catch { showToast('Redirecting to messages…'); router.push('/chat'); }
  };

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) return showToast('Please write a review');
    if (!user) return router.push('/login');
    try {
      await API.post('/reviews', { nutritionist: n?._id, rating: reviewForm.rating, comment: reviewForm.comment });
      showToast('✓ Review submitted!');
      setReviewForm({ rating: 5, comment: '' });
      const revRes = await API.get(`/reviews?nutritionist=${id}&limit=10`);
      setReviews(revRes.data?.data || []);
    } catch { showToast('Failed to submit review'); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#03050a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:44, height:44, border:'2px solid rgba(198,241,53,0.15)', borderTop:'2px solid #c6f135', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!n) return null;

  const grad     = n.avatar ? '' : GRADIENTS[parseInt((n._id || '').slice(-1), 16) % GRADIENTS.length] || GRADIENTS[0];
  const price    = n.sessionPrice || n.price || 0;
  const exp      = n.experience || 0;
  const rating   = n.rating || 4.9;
  const revCount = reviews.length || n.reviewCount || 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;--lime:#c6f135;--cyan:#00d4ff;--text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);}
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(198,241,53,.4)}50%{box-shadow:0 0 0 8px rgba(198,241,53,0)}}

        .nav{position:sticky;top:0;z-index:100;height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(3,5,10,.9);backdrop-filter:blur(24px);border-bottom:1px solid var(--line);}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .logo-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-.5px;}.logo-text em{font-style:normal;color:var(--lime);}
        .btn-back{padding:9px 18px;font-size:13px;font-weight:600;border-radius:9px;background:transparent;color:var(--sub);border:1px solid var(--line);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;text-decoration:none;transition:all .2s;display:inline-flex;align-items:center;gap:6px;}
        .btn-back:hover{color:var(--text);}

        .page{max-width:1120px;margin:0 auto;padding:36px 40px 80px;animation:fadein .4s ease;}

        /* HERO CARD */
        .hero-card{background:var(--panel);border:1px solid var(--line);border-radius:24px;overflow:hidden;margin-bottom:20px;}
        .hero-banner{height:210px;position:relative;}
        .hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 50%,rgba(10,18,32,.9));}
        .hero-av-wrap{position:absolute;bottom:-48px;left:36px;z-index:3;}
        .hero-av{width:96px;height:96px;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;color:#000;font-family:'Plus Jakarta Sans',sans-serif;border:4px solid var(--panel);box-shadow:0 8px 36px rgba(0,0,0,.5);}
        .online-dot{position:absolute;bottom:4px;right:4px;width:16px;height:16px;border-radius:50%;background:var(--lime);border:3px solid var(--panel);animation:pulse 2s infinite;}
        .badge-pill{position:absolute;top:16px;right:16px;padding:5px 14px;border-radius:100px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);font-size:11px;font-weight:800;color:#fff;border:1px solid rgba(255,255,255,.15);letter-spacing:1px;}
        .hero-body{padding:64px 36px 30px;}
        .hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;}
        .n-name{font-size:32px;font-weight:900;letter-spacing:-1.5px;margin-bottom:4px;}
        .n-spec{font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--lime);margin-bottom:14px;}
        .hero-meta{display:flex;gap:18px;flex-wrap:wrap;align-items:center;}
        .hm{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--sub);}
        .hm strong{color:var(--text);font-weight:600;}
        .avail-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:100px;background:rgba(198,241,53,.08);border:1px solid rgba(198,241,53,.2);font-size:11px;font-weight:700;color:var(--lime);}
        .avail-dot{width:6px;height:6px;border-radius:50%;background:var(--lime);animation:pulse 2s infinite;}
        .hero-actions{display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap;}
        .btn-msg{padding:13px 22px;background:rgba(255,255,255,.05);color:var(--text);font-size:14px;font-weight:600;border-radius:12px;border:1px solid var(--line);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;display:inline-flex;align-items:center;gap:8px;}
        .btn-msg:hover{border-color:rgba(255,255,255,.18);}
        .btn-book{padding:13px 28px;background:var(--lime);color:#000;font-size:14px;font-weight:800;border-radius:12px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;display:inline-flex;align-items:center;gap:8px;}
        .btn-book:hover{background:#d4ff45;box-shadow:0 0 28px rgba(198,241,53,.35);}

        /* STATS */
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:18px;overflow:hidden;margin-bottom:22px;}
        .sstat{background:var(--panel);padding:22px;text-align:center;}
        .sstat-val{font-size:26px;font-weight:900;letter-spacing:-1px;color:var(--lime);margin-bottom:4px;}
        .sstat-lbl{font-size:11px;color:var(--sub);font-weight:600;letter-spacing:.5px;text-transform:uppercase;}

        /* LAYOUT */
        .layout{display:grid;grid-template-columns:1fr 308px;gap:18px;}

        /* TABS */
        .tabs{display:flex;gap:3px;background:var(--panel);border:1px solid var(--line);border-radius:13px;padding:4px;margin-bottom:16px;}
        .tab{flex:1;padding:10px;font-size:13px;font-weight:600;border-radius:9px;cursor:pointer;transition:all .2s;color:var(--sub);background:transparent;border:none;font-family:'Plus Jakarta Sans',sans-serif;}
        .tab.on{background:rgba(198,241,53,.1);color:var(--lime);}

        /* CARD */
        .card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:26px;margin-bottom:16px;position:relative;overflow:hidden;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(198,241,53,.15),transparent);}
        .card-title{font-size:15px;font-weight:800;letter-spacing:-.3px;margin-bottom:18px;}
        .bio{font-size:14px;color:var(--sub);line-height:1.85;font-weight:300;}
        .tags{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px;}
        .tag{padding:5px 13px;border-radius:100px;font-size:12px;font-weight:600;background:rgba(198,241,53,.06);color:var(--lime);border:1px solid rgba(198,241,53,.14);}
        .spec-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
        .spec-item{display:flex;align-items:center;gap:9px;padding:11px 14px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:10px;font-size:13px;}
        .spec-check{color:var(--lime);font-weight:700;flex-shrink:0;}
        .cert-row{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:10px;margin-bottom:8px;}
        .cert-name{font-size:13px;font-weight:500;display:flex;align-items:center;gap:9px;}
        .cert-yr{font-size:11px;color:var(--sub);}
        .plan-card{padding:20px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:14px;margin-bottom:10px;cursor:pointer;transition:all .2s;}
        .plan-card:hover{border-color:rgba(198,241,53,.2);background:rgba(198,241,53,.02);}
        .plan-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
        .plan-name{font-size:15px;font-weight:700;}
        .plan-price{font-size:16px;font-weight:900;color:var(--lime);}
        .plan-desc{font-size:13px;color:var(--sub);line-height:1.65;margin-bottom:10px;}
        .plan-feats{display:flex;gap:10px;flex-wrap:wrap;}
        .plan-feat{font-size:11px;color:var(--sub);display:flex;align-items:center;gap:4px;}
        .review-item{padding:16px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:12px;margin-bottom:10px;}
        .rev-head{display:flex;justify-content:space-between;margin-bottom:5px;}
        .rev-name{font-size:13px;font-weight:700;}
        .rev-date{font-size:11px;color:var(--sub);}
        .rev-stars{color:#fbbf24;font-size:14px;margin-bottom:6px;}
        .rev-text{font-size:13px;color:var(--sub);line-height:1.7;font-weight:300;}
        .star-row{display:flex;gap:8px;margin-bottom:14px;}
        .star-btn{font-size:28px;background:none;border:none;cursor:pointer;padding:0;line-height:1;transition:transform .15s;}
        .star-btn:hover{transform:scale(1.2);}
        .review-inp{width:100%;padding:12px 15px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;resize:vertical;min-height:80px;outline:none;margin-bottom:12px;transition:all .2s;}
        .review-inp:focus{border-color:rgba(198,241,53,.3);}

        /* SIDEBAR */
        .price-card{background:var(--panel);border:1px solid rgba(198,241,53,.12);border-radius:18px;padding:26px;margin-bottom:16px;position:relative;overflow:hidden;}
        .price-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(198,241,53,.45),transparent);}
        .price-val{font-size:42px;font-weight:900;letter-spacing:-2px;color:var(--lime);line-height:1;margin-bottom:4px;}
        .price-per{font-size:13px;color:var(--sub);margin-bottom:22px;}
        .pf-row{display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px;}
        .pf-row:last-of-type{border-bottom:none;}
        .pf-check{color:var(--lime);font-weight:700;flex-shrink:0;}
        .pf-text{color:var(--sub);}
        .btn-full{width:100%;padding:14px;font-size:14px;font-weight:800;border-radius:12px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .btn-lime{background:var(--lime);color:#000;margin-bottom:9px;}
        .btn-lime:hover{background:#d4ff45;box-shadow:0 0 22px rgba(198,241,53,.3);}
        .btn-outline{background:transparent;color:var(--text);border:1px solid var(--line);}
        .btn-outline:hover{border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.04);}
        .info-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--line);}
        .info-row:last-child{border-bottom:none;}
        .info-lbl{font-size:13px;color:var(--sub);display:flex;align-items:center;gap:7px;}
        .info-val{font-size:13px;font-weight:600;}

        /* MODAL */
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(14px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
        .modal{background:var(--panel);border:1px solid rgba(0,212,255,.1);border-radius:24px;padding:36px;width:100%;max-width:480px;position:relative;max-height:90vh;overflow-y:auto;}
        .modal::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(198,241,53,.5),transparent);}
        .modal-x{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--sub);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
        .modal-x:hover{color:var(--text);}
        .modal-title{font-size:22px;font-weight:800;letter-spacing:-.8px;margin-bottom:4px;}
        .modal-sub{font-size:13.5px;color:var(--sub);margin-bottom:26px;font-weight:300;}
        .field{margin-bottom:15px;}
        .field label{display:block;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--sub);margin-bottom:7px;}
        .field input,.field select,.field textarea{width:100%;padding:12px 15px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all .2s;}
        .field input:focus,.field select:focus,.field textarea:focus{border-color:rgba(198,241,53,.3);}
        .field textarea{resize:vertical;min-height:90px;}
        .btn-submit{width:100%;padding:14px;background:var(--lime);color:#000;font-size:14px;font-weight:800;border-radius:12px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;margin-top:6px;}
        .btn-submit:hover:not(:disabled){background:#d4ff45;box-shadow:0 0 24px rgba(198,241,53,.3);}
        .btn-submit:disabled{opacity:.5;cursor:not-allowed;}
        .success-box{text-align:center;padding:24px 0;}
        .success-icon{font-size:52px;margin-bottom:14px;}
        .success-title{font-size:22px;font-weight:800;letter-spacing:-.8px;margin-bottom:8px;}
        .success-sub{font-size:13px;color:var(--sub);font-weight:300;}
        .toast{position:fixed;bottom:24px;right:24px;z-index:2000;padding:12px 18px;border-radius:11px;font-size:12.5px;font-weight:700;background:rgba(198,241,53,.12);border:1px solid rgba(198,241,53,.3);color:var(--lime);animation:toastIn .3s ease;}
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}

        @media(max-width:900px){.layout{grid-template-columns:1fr}.page{padding:20px 16px 60px}.nav{padding:0 20px}.stats{grid-template-columns:repeat(2,1fr)}.hero-body{padding:58px 20px 22px}.spec-grid{grid-template-columns:1fr}}
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      <nav className="nav">
        <a className="logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
        <a className="btn-back" href="/nutritionists">← Back to Nutritionists</a>
      </nav>

      <div className="page">
        {/* HERO */}
        <div className="hero-card">
          <div className="hero-banner" style={{ background: n.avatar ? `url(${n.avatar}) center/cover` : grad }}>
            <div className="hero-overlay" />
            <div className="hero-av-wrap">
              <div className="hero-av" style={{ background: grad }}>
                {n.avatar ? <img src={n.avatar} alt="" style={{ width:'100%', height:'100%', borderRadius:20, objectFit:'cover' }} /> : initials(n.name)}
              </div>
              <div className="online-dot" />
            </div>
            {n.badge && <div className="badge-pill">{n.badge}</div>}
          </div>
          <div className="hero-body">
            <div className="hero-top">
              <div>
                <div className="n-name">{n.name}</div>
                <div className="n-spec">{n.specialty}</div>
                <div className="hero-meta">
                  {n.location?.city && <div className="hm">📍 <strong>{n.location.city}</strong></div>}
                  {exp > 0 && <div className="hm">⚡ <strong>{exp}+ years</strong></div>}
                  <div className="hm">★ <strong>{rating.toFixed(1)}</strong> {revCount > 0 && `(${revCount} reviews)`}</div>
                  <div className="avail-chip"><span className="avail-dot" />Available Now</div>
                </div>
              </div>
              <div className="hero-actions">
                <button className="btn-msg" onClick={() => setShowMsg(true)}>💬 Message</button>
                <button className="btn-book" onClick={() => setShowBook(true)}>📅 Book Consultation</button>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="stats">
          {[
            { v: price > 0 ? `$${price}/hr` : 'Free', l:'Consultation Rate' },
            { v: `${rating.toFixed(1)}★`,              l:'Average Rating' },
            { v: exp > 0 ? `${exp}+yrs` : 'Expert',   l:'Experience' },
            { v: '< 24h',                              l:'Response Time' },
          ].map(s => (
            <div className="sstat" key={s.l}>
              <div className="sstat-val">{s.v}</div>
              <div className="sstat-lbl">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="layout">
          {/* MAIN */}
          <div>
            <div className="tabs">
              {[['about','About'],['plans','Packages'],['reviews','Reviews']].map(([key,label]) => (
                <button key={key} className={`tab ${tab===key?'on':''}`} onClick={() => setTab(key)}>{label}</button>
              ))}
            </div>

            {tab === 'about' && (
              <>
                <div className="card">
                  <div className="card-title">About</div>
                  <div className="tags">{(n.tags || []).map((t: string) => <span className="tag" key={t}>{t}</span>)}</div>
                  <p className="bio">{n.bio || n.about || 'Certified nutrition specialist dedicated to helping clients achieve lasting health transformations through evidence-based nutritional guidance.'}</p>
                  <div className="spec-grid" style={{ marginTop:20 }}>
                    {['Personalized Meal Plans','Macro & Calorie Calculation','Food Sensitivity Analysis','Supplement Guidance','Weekly Check-ins','WhatsApp Support'].map(s => (
                      <div className="spec-item" key={s}><span className="spec-check">✓</span>{s}</div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Credentials & Certifications</div>
                  {(n.certifications || [
                    { name:'Registered Dietitian (RD)', year:'2018' },
                    { name:'Precision Nutrition Level 2', year:'2020' },
                    { name:'Gut Microbiome Certification', year:'2022' },
                  ]).map((c: any) => (
                    <div className="cert-row" key={c.name || c}>
                      <span className="cert-name">🎓 {c.name || c}</span>
                      {c.year && <span className="cert-yr">{c.year}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'plans' && (
              <div className="card">
                <div className="card-title">Consultation Packages</div>
                {[
                  { name:'Single Consultation', price:price ? `$${price}` : 'Contact', desc:'One-on-one session covering your health history, goals, and a personalised nutrition blueprint.', feats:['60-min video call','Custom meal plan','3-day follow-up'] },
                  { name:'4-Week Program', price:price ? `$${price * 3}/mo` : 'Contact', desc:'Complete nutrition overhaul with weekly check-ins, meal plan updates, and ongoing WhatsApp support.', feats:['4 video sessions','Weekly meal plans','Daily support','Progress tracking'] },
                  { name:'3-Month Transformation', price:price ? `$${price * 8}/3mo` : 'Contact', desc:'Full transformation program with bi-weekly sessions and complete nutritional accountability.', feats:['6 sessions','Bi-weekly plans','Lab result analysis','Recipe library'] },
                ].map((p, i) => (
                  <div className="plan-card" key={p.name} onClick={() => setShowBook(true)}>
                    <div className="plan-head">
                      <span className="plan-name">{i === 1 ? '⭐ ' : ''}{p.name}</span>
                      <span className="plan-price">{p.price}</span>
                    </div>
                    <p className="plan-desc">{p.desc}</p>
                    <div className="plan-feats">{p.feats.map(f => <span className="plan-feat" key={f}>✓ {f}</span>)}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'reviews' && (
              <div className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <div className="card-title" style={{ marginBottom:0 }}>Client Reviews</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:22, color:'#fbbf24' }}>★</span>
                    <span style={{ fontSize:20, fontWeight:800 }}>{rating.toFixed(1)}</span>
                    {revCount > 0 && <span style={{ fontSize:13, color:'var(--sub)' }}>({revCount})</span>}
                  </div>
                </div>

                {/* Write review */}
                {user && (
                  <div style={{ background:'rgba(198,241,53,.04)', border:'1px solid rgba(198,241,53,.1)', borderRadius:14, padding:20, marginBottom:20 }}>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Write a Review</div>
                    <div className="star-row">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} className="star-btn" onClick={() => setReviewForm(r => ({ ...r, rating:s }))}>
                          <span style={{ color: s <= reviewForm.rating ? '#fbbf24' : 'rgba(255,255,255,.1)' }}>★</span>
                        </button>
                      ))}
                    </div>
                    <textarea className="review-inp" placeholder="Share your experience with this nutritionist…" value={reviewForm.comment} onChange={e => setReviewForm(r => ({ ...r, comment:e.target.value }))} />
                    <button style={{ padding:'10px 22px', background:'var(--lime)', color:'#000', border:'none', borderRadius:10, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }} onClick={submitReview}>Submit Review</button>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px 0', color:'var(--sub)', fontSize:14 }}>
                    No reviews yet. Be the first to review!
                  </div>
                ) : reviews.map((r: any, i: number) => (
                  <div className="review-item" key={r._id || i}>
                    <div className="rev-head">
                      <span className="rev-name">{r.user?.name || r.userName || 'Anonymous'}</span>
                      <span className="rev-date">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' }) : ''}</span>
                    </div>
                    <div className="rev-stars">{'★'.repeat(r.rating || 5)}</div>
                    <p className="rev-text">{r.comment || r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div>
            <div className="price-card">
              <div className="price-val">{price > 0 ? `$${price}` : 'Free'}</div>
              <div className="price-per">per consultation / hour</div>
              <div style={{ marginBottom:20 }}>
                {['Personalized meal plan','Macro targets','Food sensitivity review','Supplement advice','WhatsApp support','Monthly reassessment'].map(f => (
                  <div className="pf-row" key={f}><span className="pf-check">✓</span><span className="pf-text">{f}</span></div>
                ))}
              </div>
              <button className="btn-full btn-lime" onClick={() => setShowBook(true)}>📅 Book Consultation</button>
              <button className="btn-full btn-outline" onClick={() => setShowMsg(true)}>💬 Send Message</button>
            </div>

            <div className="card">
              <div className="card-title">Quick Info</div>
              {[
                { icon:'🏆', label:'Experience',    val: exp > 0 ? `${exp}+ years` : 'Expert' },
                { icon:'👥', label:'Clients',       val: n.clientCount ? `${n.clientCount}+` : '100+' },
                { icon:'📍', label:'Location',      val: n.location?.city || 'Online' },
                { icon:'🌐', label:'Online',        val: 'Available' },
                { icon:'📱', label:'Response',      val: '< 24 hours' },
                { icon:'🌍', label:'Languages',     val: (n.languages || ['English', 'Urdu']).join(', ') },
              ].map(s => (
                <div className="info-row" key={s.label}>
                  <span className="info-lbl">{s.icon} {s.label}</span>
                  <span className="info-val">{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {showBook && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) { setShowBook(false); setBookingOk(false); } }}>
          <div className="modal">
            <button className="modal-x" onClick={() => { setShowBook(false); setBookingOk(false); }}>✕</button>
            {bookingOk ? (
              <div className="success-box">
                <div className="success-icon">🎉</div>
                <div className="success-title">Booking Confirmed!</div>
                <div className="success-sub">Your session with {n.name} is confirmed. Check your email!</div>
              </div>
            ) : (
              <>
                <div className="modal-title">Book Consultation</div>
                <div className="modal-sub">{n.name} · {n.specialty}</div>
                <div className="field"><label>Date</label><input type="date" min={new Date().toISOString().split('T')[0]} value={booking.date} onChange={e => setBooking(b => ({ ...b, date:e.target.value }))} /></div>
                <div className="field"><label>Time Slot</label>
                  <select value={booking.time} onChange={e => setBooking(b => ({ ...b, time:e.target.value }))}>
                    <option value="">Select time</option>
                    {['09:00 AM','11:00 AM','01:00 PM','03:00 PM','05:00 PM','07:00 PM'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field"><label>Session Type</label>
                  <select value={booking.type} onChange={e => setBooking(b => ({ ...b, type:e.target.value }))}>
                    <option>Video Consultation</option><option>In-Person Visit</option><option>Phone Call</option>
                  </select>
                </div>
                <div className="field"><label>Goals & Notes</label><textarea placeholder="Describe your health goals, diet preferences, medical conditions…" value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes:e.target.value }))} /></div>
                <button className="btn-submit" onClick={submitBooking} disabled={bookingLoading}>{bookingLoading ? '⏳ Confirming…' : '✓ Confirm Booking'}</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MESSAGE MODAL */}
      {showMsg && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowMsg(false); }}>
          <div className="modal">
            <button className="modal-x" onClick={() => setShowMsg(false)}>✕</button>
            {msgSent ? (
              <div className="success-box">
                <div className="success-icon">✉️</div>
                <div className="success-title">Message Sent!</div>
                <div className="success-sub">{n.name} will reply within 24 hours.</div>
              </div>
            ) : (
              <>
                <div className="modal-title">Message {n.name}</div>
                <div className="modal-sub">Ask a question before booking your consultation.</div>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'rgba(255,255,255,.03)', border:'1px solid var(--line)', borderRadius:12, marginBottom:20 }}>
                  <div style={{ width:44, height:44, borderRadius:11, background:grad, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'#000', flexShrink:0 }}>{initials(n.name)}</div>
                  <div><div style={{ fontSize:14, fontWeight:700 }}>{n.name}</div><div style={{ fontSize:12, color:'var(--lime)', fontWeight:600 }}>● Usually replies within 24 hours</div></div>
                </div>
                <div className="field"><label>Your Message</label><textarea style={{ minHeight:130 }} placeholder={`Hi ${n.name?.split(' ')[0]}, I'm interested in your nutrition consultation…`} value={message} onChange={e => setMessage(e.target.value)} /></div>
                <button className="btn-submit" onClick={sendMessage}>✉️ Send Message</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}