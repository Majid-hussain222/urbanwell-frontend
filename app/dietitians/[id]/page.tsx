'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

const GRADIENTS = [
  'linear-gradient(135deg,#c6f135,#00d4ff)',
  'linear-gradient(135deg,#00d4ff,#8b5cf6)',
  'linear-gradient(135deg,#8b5cf6,#f43f5e)',
  'linear-gradient(135deg,#f59e0b,#c6f135)',
  'linear-gradient(135deg,#34d399,#00d4ff)',
  'linear-gradient(135deg,#f43f5e,#f59e0b)',
];
const initials = (n='') => n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

export default function DietitianProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [d,        setD]        = useState<any>(null);
  const [reviews,  setReviews]  = useState<any[]>([]);
  const [user,     setUser]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('about');
  const [showBook, setShowBook] = useState(false);
  const [showMsg,  setShowMsg]  = useState(false);
  const [booking,  setBooking]  = useState({ date:'', time:'', type:'Video Consultation', notes:'' });
  const [bookOk,   setBookOk]   = useState(false);
  const [bookL,    setBookL]    = useState(false);
  const [msg,      setMsg]      = useState('');
  const [msgSent,  setMsgSent]  = useState(false);
  const [revForm,  setRevForm]  = useState({ rating:5, comment:'' });
  const [toast,    setToast]    = useState('');

  const id = typeof params?.id === 'string' ? params.id : (params as any)?.id;
  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3000); };

  useEffect(() => {
    (async () => {
      try {
        const [dRes, uRes, rRes] = await Promise.allSettled([
          API.get(`/dietitians/${id}`),
          API.get('/users/profile'),
          API.get(`/reviews?dietitian=${id}&limit=10`),
        ]);
        if (dRes.status==='fulfilled') setD(dRes.value.data?.data || dRes.value.data?.dietitian || dRes.value.data);
        if (uRes.status==='fulfilled') setUser(uRes.value.data?.data || uRes.value.data);
        if (rRes.status==='fulfilled') setReviews(rRes.value.data?.data || []);
      } catch { router.push('/dietitians'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const submitBooking = async () => {
    if (!booking.date || !booking.time) return showToast('Please select date and time');
    if (!user) return router.push('/login');
    setBookL(true);
    try {
      await API.post('/bookings', { dietitian:d?._id, sessionType:booking.type, date:booking.date, timeSlot:booking.time, notes:booking.notes });
      setBookOk(true);
      showToast('✓ Booking confirmed!');
      setTimeout(()=>{ setShowBook(false); setBookOk(false); },3000);
    } catch(e:any) { showToast(e?.response?.data?.message||'Booking failed'); }
    setBookL(false);
  };

  const sendMessage = async () => {
    if (!msg.trim()) return;
    if (!user) return router.push('/login');
    try {
      await API.post('/chat', { dietitianId: d?._id });
      setMsgSent(true);
      setTimeout(()=>{ setShowMsg(false); setMsgSent(false); setMsg(''); },2500);
    } catch { router.push('/chat'); }
  };

  const submitReview = async () => {
    if (!revForm.comment.trim()) return showToast('Please write a review');
    if (!user) return router.push('/login');
    try {
      await API.post('/reviews', { dietitian:d?._id, rating:revForm.rating, comment:revForm.comment });
      showToast('✓ Review submitted!');
      setRevForm({rating:5,comment:''});
      const r = await API.get(`/reviews?dietitian=${id}&limit=10`);
      setReviews(r.data?.data||[]);
    } catch { showToast('Failed to submit review'); }
  };

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#03050a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:44,height:44,border:'2px solid rgba(0,212,255,0.15)',borderTop:'2px solid #00d4ff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!d) return null;

  const g        = GRADIENTS[parseInt((d._id||'').slice(-1),16)%GRADIENTS.length]||GRADIENTS[0];
  const price    = d.sessionFee||d.price||0;
  const exp      = d.experience||0;
  const rating   = d.rating||4.9;
  const revCount = reviews.length||d.reviewCount||0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;--cyan:#00d4ff;--lime:#c6f135;--text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);}
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;}
        @keyframes spin{to{transform:rotate(360deg)}} @keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}} @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}} @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,212,255,.4)}50%{box-shadow:0 0 0 8px rgba(0,212,255,0)}}

        .nav{position:sticky;top:0;z-index:100;height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(3,5,10,.9);backdrop-filter:blur(24px);border-bottom:1px solid var(--line);}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .logo-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-.5px;}.logo-text em{font-style:normal;color:var(--lime);}
        .btn-back{padding:9px 18px;font-size:13px;font-weight:600;border-radius:9px;background:transparent;color:var(--sub);border:1px solid var(--line);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;text-decoration:none;transition:all .2s;}
        .btn-back:hover{color:var(--text);}
        .page{max-width:1120px;margin:0 auto;padding:36px 40px 80px;animation:fadein .4s ease;}
        .hero-card{background:var(--panel);border:1px solid var(--line);border-radius:24px;overflow:hidden;margin-bottom:20px;}
        .hero-banner{height:210px;position:relative;}
        .banner-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 50%,rgba(10,18,32,.9));}
        .hero-av-wrap{position:absolute;bottom:-48px;left:36px;z-index:3;}
        .hero-av{width:96px;height:96px;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;color:#000;font-family:'Plus Jakarta Sans',sans-serif;border:4px solid var(--panel);box-shadow:0 8px 36px rgba(0,0,0,.5);}
        .avail-dot{position:absolute;bottom:4px;right:4px;width:16px;height:16px;border-radius:50%;background:var(--lime);border:3px solid var(--panel);animation:pulse 2s infinite;}
        .cred-pill{position:absolute;top:16px;right:16px;padding:5px 14px;border-radius:100px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);font-size:11px;font-weight:800;color:#fff;border:1px solid rgba(255,255,255,.15);letter-spacing:1px;}
        .rd-badge{position:absolute;top:16px;left:16px;padding:5px 12px;border-radius:100px;background:var(--cyan);color:#000;font-size:9px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;}
        .hero-body{padding:64px 36px 30px;}
        .hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;}
        .d-name{font-size:32px;font-weight:900;letter-spacing:-1.5px;margin-bottom:4px;}
        .d-spec{font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--cyan);margin-bottom:14px;}
        .hero-meta{display:flex;gap:18px;flex-wrap:wrap;align-items:center;}
        .hm{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--sub);}
        .hm strong{color:var(--text);font-weight:600;}
        .avail-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:100px;background:rgba(198,241,53,.08);border:1px solid rgba(198,241,53,.2);font-size:11px;font-weight:700;color:var(--lime);}
        .chip-dot{width:6px;height:6px;border-radius:50%;background:var(--lime);}
        .hero-actions{display:flex;gap:10px;flex-wrap:wrap;}
        .btn-msg-h{padding:13px 22px;background:rgba(255,255,255,.05);color:var(--text);font-size:14px;font-weight:600;border-radius:12px;border:1px solid var(--line);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .btn-msg-h:hover{border-color:rgba(255,255,255,.18);}
        .btn-book-h{padding:13px 28px;background:var(--cyan);color:#000;font-size:14px;font-weight:800;border-radius:12px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;}
        .btn-book-h:hover{background:#19e0ff;box-shadow:0 0 28px rgba(0,212,255,.35);}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:18px;overflow:hidden;margin-bottom:22px;}
        .ss{background:var(--panel);padding:22px;text-align:center;}
        .ss-val{font-size:26px;font-weight:900;letter-spacing:-1px;color:var(--cyan);margin-bottom:4px;}
        .ss-lbl{font-size:11px;color:var(--sub);font-weight:600;letter-spacing:.5px;text-transform:uppercase;}
        .layout{display:grid;grid-template-columns:1fr 308px;gap:18px;}
        .tabs{display:flex;gap:3px;background:var(--panel);border:1px solid var(--line);border-radius:13px;padding:4px;margin-bottom:16px;}
        .tab-btn{flex:1;padding:10px;font-size:13px;font-weight:600;border-radius:9px;cursor:pointer;transition:all .2s;color:var(--sub);background:transparent;border:none;font-family:'Plus Jakarta Sans',sans-serif;}
        .tab-btn.on{background:rgba(0,212,255,.1);color:var(--cyan);}
        .card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:26px;margin-bottom:16px;position:relative;overflow:hidden;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,212,255,.15),transparent);}
        .card-title{font-size:15px;font-weight:800;letter-spacing:-.3px;margin-bottom:18px;}
        .bio{font-size:14px;color:var(--sub);line-height:1.85;font-weight:300;}
        .tags{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px;}
        .tag{padding:5px 13px;border-radius:100px;font-size:12px;font-weight:600;background:rgba(0,212,255,.06);color:var(--cyan);border:1px solid rgba(0,212,255,.14);}
        .spec-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
        .spec-item{display:flex;align-items:center;gap:9px;padding:11px 14px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:10px;font-size:13px;}
        .spec-check{color:var(--cyan);font-weight:700;flex-shrink:0;}
        .cert-row{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:10px;margin-bottom:8px;}
        .cert-name{font-size:13px;font-weight:500;display:flex;align-items:center;gap:9px;}
        .cert-yr{font-size:11px;color:var(--sub);}
        .plan-card{padding:20px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:14px;margin-bottom:10px;cursor:pointer;transition:all .2s;}
        .plan-card:hover{border-color:rgba(0,212,255,.2);}
        .plan-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
        .plan-name{font-size:15px;font-weight:700;}
        .plan-price{font-size:16px;font-weight:900;color:var(--cyan);}
        .plan-desc{font-size:13px;color:var(--sub);line-height:1.65;margin-bottom:10px;}
        .plan-feats{display:flex;gap:10px;flex-wrap:wrap;}
        .plan-feat{font-size:11px;color:var(--sub);}
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
        .review-inp:focus{border-color:rgba(0,212,255,.3);}
        .price-card{background:var(--panel);border:1px solid rgba(0,212,255,.12);border-radius:18px;padding:26px;margin-bottom:16px;position:relative;overflow:hidden;}
        .price-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,212,255,.45),transparent);}
        .price-val{font-size:42px;font-weight:900;letter-spacing:-2px;color:var(--cyan);line-height:1;margin-bottom:4px;}
        .price-per{font-size:13px;color:var(--sub);margin-bottom:22px;}
        .pf-row{display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px;}
        .pf-row:last-of-type{border-bottom:none;}
        .pf-check{color:var(--cyan);font-weight:700;flex-shrink:0;}
        .pf-text{color:var(--sub);}
        .btn-full{width:100%;padding:14px;font-size:14px;font-weight:800;border-radius:12px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .btn-cyan{background:var(--cyan);color:#000;margin-bottom:9px;}
        .btn-cyan:hover{background:#19e0ff;box-shadow:0 0 22px rgba(0,212,255,.3);}
        .btn-outline{background:transparent;color:var(--text);border:1px solid var(--line);}
        .btn-outline:hover{border-color:rgba(255,255,255,.18);}
        .info-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--line);}
        .info-row:last-child{border-bottom:none;}
        .info-lbl{font-size:13px;color:var(--sub);display:flex;align-items:center;gap:7px;}
        .info-val{font-size:13px;font-weight:600;}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(14px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
        .modal{background:var(--panel);border:1px solid rgba(0,212,255,.1);border-radius:24px;padding:36px;width:100%;max-width:480px;position:relative;max-height:90vh;overflow-y:auto;}
        .modal::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,212,255,.5),transparent);}
        .modal-x{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--sub);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;}
        .modal-x:hover{color:var(--text);}
        .modal-title{font-size:22px;font-weight:800;letter-spacing:-.8px;margin-bottom:4px;}
        .modal-sub{font-size:13.5px;color:var(--sub);margin-bottom:26px;font-weight:300;}
        .field{margin-bottom:15px;}
        .field label{display:block;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--sub);margin-bottom:7px;}
        .field input,.field select,.field textarea{width:100%;padding:12px 15px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all .2s;}
        .field input:focus,.field select:focus,.field textarea:focus{border-color:rgba(0,212,255,.3);}
        .field textarea{resize:vertical;min-height:90px;}
        .btn-submit{width:100%;padding:14px;background:var(--cyan);color:#000;font-size:14px;font-weight:800;border-radius:12px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;margin-top:6px;}
        .btn-submit:hover:not(:disabled){background:#19e0ff;box-shadow:0 0 22px rgba(0,212,255,.3);}
        .btn-submit:disabled{opacity:.5;cursor:not-allowed;}
        .success-box{text-align:center;padding:24px 0;}
        .success-icon{font-size:52px;margin-bottom:14px;}
        .success-title{font-size:22px;font-weight:800;letter-spacing:-.8px;margin-bottom:8px;}
        .success-sub{font-size:13px;color:var(--sub);}
        .toast{position:fixed;bottom:24px;right:24px;z-index:2000;padding:12px 18px;border-radius:11px;font-size:12.5px;font-weight:700;background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.25);color:var(--cyan);animation:toastIn .3s ease;}
        @media(max-width:900px){.layout{grid-template-columns:1fr}.page{padding:20px 16px 60px}.nav{padding:0 20px}.stats{grid-template-columns:repeat(2,1fr)}.spec-grid{grid-template-columns:1fr}.hero-body{padding:58px 20px 22px}}
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      <nav className="nav">
        <a className="logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
        <a className="btn-back" href="/dietitians">← Back to Dietitians</a>
      </nav>

      <div className="page">
        {/* HERO */}
        <div className="hero-card">
          <div className="hero-banner" style={{background: d.avatar ? `url(${d.avatar}) center/cover` : g}}>
            <div className="banner-overlay"/>
            <div className="hero-av-wrap">
              <div className="hero-av" style={{background:g}}>
                {d.avatar ? <img src={d.avatar} alt="" style={{width:'100%',height:'100%',borderRadius:20,objectFit:'cover'}}/> : initials(d.name)}
              </div>
              <div className="avail-dot"/>
            </div>
            <div className="rd-badge">✓ Registered Dietitian</div>
            {d.credential && <div className="cred-pill">{d.credential}</div>}
          </div>
          <div className="hero-body">
            <div className="hero-top">
              <div>
                <div className="d-name">{d.name}</div>
                <div className="d-spec">{d.specialty||d.expertise}</div>
                <div className="hero-meta">
                  {d.location?.city && <div className="hm">📍 <strong>{d.location.city}</strong></div>}
                  {exp>0 && <div className="hm">⚡ <strong>{exp}+ years</strong></div>}
                  <div className="hm">★ <strong>{rating.toFixed(1)}</strong>{revCount>0&&` (${revCount})`}</div>
                  <div className="avail-chip"><span className="chip-dot"/>Available Now</div>
                </div>
              </div>
              <div className="hero-actions">
                <button className="btn-msg-h" onClick={()=>setShowMsg(true)}>💬 Message</button>
                <button className="btn-book-h" onClick={()=>setShowBook(true)}>📅 Book Session</button>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="stats">
          {[
            {v:price>0?`$${price}/hr`:'Contact',l:'Session Rate'},
            {v:`${rating.toFixed(1)}★`,         l:'Rating'},
            {v:exp>0?`${exp}+yrs`:'Expert',      l:'Experience'},
            {v:'< 48h',                           l:'Response Time'},
          ].map(s=>(
            <div className="ss" key={s.l}><div className="ss-val">{s.v}</div><div className="ss-lbl">{s.l}</div></div>
          ))}
        </div>

        <div className="layout">
          <div>
            <div className="tabs">
              {[['about','About'],['conditions','Conditions Treated'],['plans','Packages'],['reviews','Reviews']].map(([k,l])=>(
                <button key={k} className={`tab-btn ${tab===k?'on':''}`} onClick={()=>setTab(k)}>{l}</button>
              ))}
            </div>

            {tab==='about' && (
              <>
                <div className="card">
                  <div className="card-title">About</div>
                  <div className="tags">{(d.tags||d.conditions||[]).map((t:string)=><span className="tag" key={t}>{t}</span>)}</div>
                  <p className="bio">{d.bio||d.about||'Registered Dietitian with specialized clinical nutrition expertise, dedicated to evidence-based medical nutrition therapy.'}</p>
                  <div className="spec-grid" style={{marginTop:20}}>
                    {['Medical Nutrition Therapy','Lab Result Interpretation','Disease-Specific Diets','Supplement Protocols','Clinical Follow-ups','Patient Education'].map(s=>(
                      <div className="spec-item" key={s}><span className="spec-check">✓</span>{s}</div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Credentials & Registrations</div>
                  {(d.certifications||[
                    {name:'Registered Dietitian (RD)',year:'2017'},
                    {name:'Certified Diabetes Care Specialist',year:'2019'},
                    {name:'Renal Nutrition Certification',year:'2020'},
                    {name:'Oncology Nutrition Certification',year:'2022'},
                  ]).map((c:any)=>(
                    <div className="cert-row" key={c.name||c}>
                      <span className="cert-name">🎓 {c.name||c}</span>
                      {c.year && <span className="cert-yr">{c.year}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab==='conditions' && (
              <div className="card">
                <div className="card-title">Medical Conditions Treated</div>
                <div className="spec-grid">
                  {(d.conditionsTreated||['Diabetes Type 1 & 2','Chronic Kidney Disease','Heart Disease','Cancer / Oncology','Eating Disorders','IBS / Crohn\'s Disease','Celiac Disease','PCOS','Thyroid Disorders','Fatty Liver Disease','Hypertension','Obesity'].slice(0,12)).map((c:string)=>(
                    <div className="spec-item" key={c}><span className="spec-check">🩺</span>{c}</div>
                  ))}
                </div>
                <div style={{marginTop:18,padding:'14px 16px',background:'rgba(0,212,255,.04)',border:'1px solid rgba(0,212,255,.1)',borderRadius:12,fontSize:13,color:'var(--sub)',lineHeight:1.7}}>
                  💡 <strong style={{color:'var(--text)'}}>Note:</strong> Treatment requires a referral or medical history review. Bring lab reports, current medications, and your doctor's notes to the first session.
                </div>
              </div>
            )}

            {tab==='plans' && (
              <div className="card">
                <div className="card-title">Clinical Consultation Packages</div>
                {[
                  {name:'Initial Assessment',price:price?`$${price}`:'Contact',desc:'Comprehensive nutritional assessment including medical history, lab review, and personalized diet prescription.',feats:['90-min session','Lab result review','Diet prescription','Follow-up notes']},
                  {name:'4-Week Clinical Program',price:price?`$${price*3}/mo`:'Contact',desc:'Structured medical nutrition therapy with bi-weekly sessions, diet adjustments, and progress monitoring.',feats:['4 sessions','Bi-weekly plan updates','Lab tracking','WhatsApp support']},
                  {name:'3-Month Therapy Protocol',price:price?`$${price*8}/3mo`:'Contact',desc:'Full clinical nutrition protocol for chronic disease management with comprehensive monitoring.',feats:['6 sessions','Monthly lab review','Medication interaction check','Full diet prescription']},
                ].map((p,i)=>(
                  <div className="plan-card" key={p.name} onClick={()=>setShowBook(true)}>
                    <div className="plan-head"><span className="plan-name">{i===1?'⭐ ':''}{p.name}</span><span className="plan-price">{p.price}</span></div>
                    <p className="plan-desc">{p.desc}</p>
                    <div className="plan-feats">{p.feats.map(f=><span className="plan-feat" key={f}>✓ {f}</span>)}</div>
                  </div>
                ))}
              </div>
            )}

            {tab==='reviews' && (
              <div className="card">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                  <div className="card-title" style={{marginBottom:0}}>Patient Reviews</div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:22,color:'#fbbf24'}}>★</span>
                    <span style={{fontSize:20,fontWeight:800}}>{rating.toFixed(1)}</span>
                    {revCount>0&&<span style={{fontSize:13,color:'var(--sub)'}}>({revCount})</span>}
                  </div>
                </div>
                {user&&(
                  <div style={{background:'rgba(0,212,255,.04)',border:'1px solid rgba(0,212,255,.1)',borderRadius:14,padding:20,marginBottom:20}}>
                    <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Write a Review</div>
                    <div className="star-row">
                      {[1,2,3,4,5].map(s=>(
                        <button key={s} className="star-btn" onClick={()=>setRevForm(r=>({...r,rating:s}))}>
                          <span style={{color:s<=revForm.rating?'#fbbf24':'rgba(255,255,255,.1)'}}>★</span>
                        </button>
                      ))}
                    </div>
                    <textarea className="review-inp" placeholder="Share your experience…" value={revForm.comment} onChange={e=>setRevForm(r=>({...r,comment:e.target.value}))}/>
                    <button style={{padding:'10px 22px',background:'var(--cyan)',color:'#000',border:'none',borderRadius:10,fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}} onClick={submitReview}>Submit Review</button>
                  </div>
                )}
                {reviews.length===0 ? (
                  <div style={{textAlign:'center',padding:'32px 0',color:'var(--sub)',fontSize:14}}>No reviews yet. Be the first!</div>
                ) : reviews.map((r:any,i:number)=>(
                  <div className="review-item" key={r._id||i}>
                    <div className="rev-head"><span className="rev-name">{r.user?.name||'Anonymous'}</span><span className="rev-date">{r.createdAt?new Date(r.createdAt).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'}):''}</span></div>
                    <div className="rev-stars">{'★'.repeat(r.rating||5)}</div>
                    <p className="rev-text">{r.comment||r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div>
            <div className="price-card">
              <div className="price-val">{price>0?`$${price}`:'Contact'}</div>
              <div className="price-per">per clinical session</div>
              <div style={{marginBottom:20}}>
                {['Medical nutrition therapy','Lab result analysis','Disease-specific diet','Medication interaction check','Clinical follow-ups','WhatsApp support'].map(f=>(
                  <div className="pf-row" key={f}><span className="pf-check">✓</span><span className="pf-text">{f}</span></div>
                ))}
              </div>
              <button className="btn-full btn-cyan" onClick={()=>setShowBook(true)}>📅 Book Session</button>
              <button className="btn-full btn-outline" onClick={()=>setShowMsg(true)}>💬 Send Message</button>
            </div>
            <div className="card">
              <div className="card-title">Quick Info</div>
              {[
                {icon:'🏆',label:'Experience',val:exp>0?`${exp}+ years`:'Expert'},
                {icon:'👥',label:'Patients',  val:d.patientCount?`${d.patientCount}+`:'100+'},
                {icon:'📍',label:'Location',  val:d.location?.city||'Online'},
                {icon:'🌐',label:'Online',    val:'Available'},
                {icon:'📱',label:'Response',  val:'< 48 hours'},
                {icon:'📋',label:'Lab Review',val:'Included'},
              ].map(s=>(
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
      {showBook&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget){setShowBook(false);setBookOk(false);}}}>
          <div className="modal">
            <button className="modal-x" onClick={()=>{setShowBook(false);setBookOk(false);}}>✕</button>
            {bookOk?(
              <div className="success-box"><div className="success-icon">🎉</div><div className="success-title">Booking Confirmed!</div><div className="success-sub">Your session with {d.name} is confirmed. Check your email!</div></div>
            ):(
              <>
                <div className="modal-title">Book Clinical Session</div>
                <div className="modal-sub">{d.name} · {d.specialty}</div>
                <div className="field"><label>Date</label><input type="date" min={new Date().toISOString().split('T')[0]} value={booking.date} onChange={e=>setBooking(b=>({...b,date:e.target.value}))}/></div>
                <div className="field"><label>Time Slot</label>
                  <select value={booking.time} onChange={e=>setBooking(b=>({...b,time:e.target.value}))}>
                    <option value="">Select time</option>
                    {['09:00 AM','10:00 AM','11:00 AM','01:00 PM','03:00 PM','05:00 PM'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field"><label>Session Type</label>
                  <select value={booking.type} onChange={e=>setBooking(b=>({...b,type:e.target.value}))}>
                    <option>Video Consultation</option><option>In-Person Visit</option><option>Phone Call</option>
                  </select>
                </div>
                <div className="field"><label>Medical Condition & Notes</label>
                  <textarea placeholder="Describe your medical condition, medications, lab results, health concerns…" value={booking.notes} onChange={e=>setBooking(b=>({...b,notes:e.target.value}))}/>
                </div>
                <button className="btn-submit" onClick={submitBooking} disabled={bookL}>{bookL?'⏳ Confirming…':'✓ Confirm Booking'}</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MESSAGE MODAL */}
      {showMsg&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setShowMsg(false);}}>
          <div className="modal">
            <button className="modal-x" onClick={()=>setShowMsg(false)}>✕</button>
            {msgSent?(
              <div className="success-box"><div className="success-icon">✉️</div><div className="success-title">Message Sent!</div><div className="success-sub">{d.name} will reply within 48 hours.</div></div>
            ):(
              <>
                <div className="modal-title">Message {d.name}</div>
                <div className="modal-sub">Ask a question before your clinical session.</div>
                <div className="field"><label>Your Message</label>
                  <textarea style={{minHeight:130}} placeholder={`Hi ${d.name?.split(' ')[0]}, I have a question about my condition…`} value={msg} onChange={e=>setMsg(e.target.value)}/>
                </div>
                <button className="btn-submit" onClick={sendMessage}>✉️ Send Message</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}