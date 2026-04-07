'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Mock trainer data — works without backend
const mockTrainers: Record<string, any> = {
  '1': { id:1, name:'Sarah Khan', specialty:'Strength & Conditioning', bio:'10+ years helping clients build functional strength and confidence. I specialize in progressive overload programming, Olympic lifting fundamentals, and building a bulletproof foundation for long-term athletic development.', experience:10, price:45, gradient:'linear-gradient(135deg,#c6f135,#00d4ff)', initials:'SK', location:{ city:'Lahore, PK' } },
  '2': { id:2, name:'James Miller', specialty:'HIIT & Cardio', bio:'High-intensity specialist focused on fat loss and athletic performance. My training systems combine metabolic conditioning, sprint intervals, and functional movement patterns.', experience:7, price:40, gradient:'linear-gradient(135deg,#00d4ff,#8b5cf6)', initials:'JM', location:{ city:'Karachi, PK' } },
  '3': { id:3, name:'Priya Sharma', specialty:'Yoga & Flexibility', bio:'Certified yoga instructor bringing mindfulness and mobility to your practice. I blend traditional Hatha yoga with modern mobility science to help you move without pain.', experience:8, price:38, gradient:'linear-gradient(135deg,#8b5cf6,#f43f5e)', initials:'PS', location:{ city:'Islamabad, PK' } },
  '4': { id:4, name:'Alex Torres', specialty:'Bodybuilding', bio:'IFBB certified coach specializing in hypertrophy and competition prep. Science-based training with precise nutrition protocols to maximize muscle gain.', experience:12, price:55, gradient:'linear-gradient(135deg,#f59e0b,#c6f135)', initials:'AT', location:{ city:'Lahore, PK' } },
  '5': { id:5, name:'Mia Johnson', specialty:'Functional Fitness', bio:'Movement specialist helping everyday athletes move better and feel stronger. CrossFit certified with a focus on sustainable, injury-free training.', experience:6, price:42, gradient:'linear-gradient(135deg,#00d4ff,#c6f135)', initials:'MJ', location:{ city:'Karachi, PK' } },
  '6': { id:6, name:'Omar Hassan', specialty:'Nutrition & Weight Loss', bio:'Certified nutritionist and PT helping clients transform their body composition. Evidence-based fat loss coaching with sustainable lifestyle changes.', experience:9, price:50, gradient:'linear-gradient(135deg,#f43f5e,#f59e0b)', initials:'OH', location:{ city:'Lahore, PK' } },
};

export default function TrainerProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const t = mockTrainers[params.id] || mockTrainers['1'];

  const [activeTab, setActiveTab] = useState('about');
  const [showBooking, setShowBooking] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [booking, setBooking] = useState({ date:'', time:'', type:'In-Person Session', notes:'' });
  const [message, setMessage] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating:5, comment:'' });

  const submitBooking = async () => {
    if (!booking.date || !booking.time) return alert('Please select date and time');
    setBookingLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setBookingSuccess(true);
    setBookingLoading(false);
    setTimeout(() => { setShowBooking(false); setBookingSuccess(false); }, 2500);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    await new Promise(r => setTimeout(r, 600));
    setMessageSent(true);
    setTimeout(() => { setShowMessage(false); setMessageSent(false); setMessage(''); }, 2000);
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
        body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events:none; z-index:9999; opacity:0.4; }

        .nav { position:sticky; top:0; z-index:100; height:68px; display:flex; align-items:center; justify-content:space-between; padding:0 48px; background:rgba(3,5,10,0.9); backdrop-filter:blur(24px); border-bottom:1px solid var(--line); }
        .logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .logo-icon { width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg,var(--lime),var(--cyan)); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:900; color:#000; }
        .logo-text { font-size:18px; font-weight:700; letter-spacing:-0.5px; }
        .logo-text em { font-style:normal; color:var(--lime); }
        .btn-back { padding:9px 18px; font-size:13px; font-weight:600; border-radius:8px; background:transparent; color:var(--sub); border:1px solid var(--line); cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-back:hover { color:var(--text); border-color:rgba(255,255,255,0.15); }

        .page { max-width:1100px; margin:0 auto; padding:40px 48px; }

        /* HERO CARD */
        .hero-card { border-radius:24px; overflow:hidden; border:1px solid var(--line); margin-bottom:20px; }
        .hero-banner { height:200px; position:relative; }
        .hero-banner-overlay { position:absolute; inset:0; background:linear-gradient(to bottom, transparent 40%, rgba(10,18,32,0.8) 100%); }

        /* Avatar circle */
        .hero-avatar-wrap { position:absolute; bottom:-44px; left:36px; z-index:3; }
        .hero-avatar {
          width:88px; height:88px; border-radius:22px;
          display:flex; align-items:center; justify-content:center;
          font-size:34px; font-weight:900; color:#000;
          font-family:'Plus Jakarta Sans',sans-serif;
          border:4px solid #0a1220;
          box-shadow:0 8px 32px rgba(0,0,0,0.4);
        }
        .online-dot {
          position:absolute; bottom:4px; right:4px;
          width:14px; height:14px; border-radius:50%;
          background:var(--lime); border:2px solid #0a1220;
          animation:pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(198,241,53,0.5)} 50%{box-shadow:0 0 0 6px rgba(198,241,53,0)} }

        .hero-body { background:var(--panel); padding:60px 36px 32px; }
        .hero-top { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; flex-wrap:wrap; }
        .hero-info { flex:1; }
        .trainer-name { font-size:30px; font-weight:800; letter-spacing:-1.2px; margin-bottom:4px; }
        .trainer-specialty { font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--lime); margin-bottom:14px; }
        .hero-meta { display:flex; gap:18px; flex-wrap:wrap; align-items:center; }
        .hm { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--sub); }
        .hm strong { color:var(--text); font-weight:600; }
        .chip-avail { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:100px; background:rgba(198,241,53,0.08); border:1px solid rgba(198,241,53,0.2); font-size:11px; font-weight:700; color:var(--lime); letter-spacing:0.5px; }
        .chip-dot { width:6px; height:6px; border-radius:50%; background:var(--lime); animation:pulse 2s infinite; }

        .hero-actions { display:flex; gap:10px; flex-shrink:0; }
        .btn-msg { padding:13px 22px; background:rgba(255,255,255,0.05); color:var(--text); font-size:14px; font-weight:600; border-radius:12px; border:1px solid var(--line); cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; display:inline-flex; align-items:center; gap:8px; }
        .btn-msg:hover { border-color:rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); }
        .btn-book-hero { padding:13px 28px; background:var(--lime); color:#000; font-size:14px; font-weight:800; border-radius:12px; border:none; cursor:pointer; transition:all 0.25s; font-family:'Plus Jakarta Sans',sans-serif; display:inline-flex; align-items:center; gap:8px; }
        .btn-book-hero:hover { background:#d4ff45; box-shadow:0 0 28px rgba(198,241,53,0.35); transform:translateY(-1px); }

        /* STATS */
        .stats-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:18px; overflow:hidden; margin-bottom:24px; }
        .ss { background:var(--panel); padding:22px; text-align:center; }
        .ss-val { font-size:26px; font-weight:800; letter-spacing:-1px; color:var(--lime); margin-bottom:4px; }
        .ss-lbl { font-size:11px; color:var(--sub); font-weight:500; }

        /* LAYOUT */
        .layout { display:grid; grid-template-columns:1fr 320px; gap:20px; }

        /* TABS */
        .tabs { display:flex; gap:4px; background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:4px; margin-bottom:16px; }
        .tab { flex:1; padding:10px; font-size:13px; font-weight:600; border-radius:9px; cursor:pointer; transition:all 0.2s; color:var(--sub); background:transparent; border:none; font-family:'Plus Jakarta Sans',sans-serif; }
        .tab.active { background:rgba(198,241,53,0.1); color:var(--lime); }
        .tab:hover:not(.active) { color:var(--text); }

        .card { background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:28px; margin-bottom:16px; }
        .card-title { font-size:15px; font-weight:700; letter-spacing:-0.3px; margin-bottom:18px; }
        .bio-text { font-size:14px; color:var(--sub); line-height:1.8; font-weight:300; }

        .spec-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:18px; }
        .spec-item { display:flex; align-items:center; gap:10px; padding:12px; background:rgba(255,255,255,0.02); border:1px solid var(--line); border-radius:10px; font-size:13px; }
        .spec-check { color:var(--lime); font-weight:700; }

        .cert-item { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:rgba(255,255,255,0.02); border:1px solid var(--line); border-radius:10px; margin-bottom:8px; }
        .cert-name { font-size:13px; font-weight:500; display:flex; align-items:center; gap:10px; }
        .cert-year { font-size:11px; color:var(--sub); }

        .schedule-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; margin-bottom:20px; }
        .day { text-align:center; padding:12px 6px; border-radius:10px; border:1px solid var(--line); background:rgba(255,255,255,0.01); }
        .day.on { border-color:rgba(198,241,53,0.2); background:rgba(198,241,53,0.05); }
        .day-name { font-size:10px; font-weight:700; color:var(--sub); text-transform:uppercase; margin-bottom:5px; }
        .day-status { font-size:11px; font-weight:600; }
        .day.on .day-status { color:var(--lime); }
        .day:not(.on) .day-status { color:var(--sub); }

        .slot { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:rgba(255,255,255,0.02); border:1px solid var(--line); border-radius:10px; margin-bottom:8px; }
        .slot-time { font-size:13px; font-weight:600; }
        .btn-slot { padding:6px 16px; background:rgba(198,241,53,0.08); color:var(--lime); border:1px solid rgba(198,241,53,0.2); border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.2s; }
        .btn-slot:hover { background:rgba(198,241,53,0.15); }

        .review-item { padding:16px; background:rgba(255,255,255,0.02); border:1px solid var(--line); border-radius:12px; margin-bottom:10px; }
        .review-header { display:flex; justify-content:space-between; margin-bottom:6px; }
        .review-name { font-size:13px; font-weight:700; }
        .review-date { font-size:11px; color:var(--sub); }
        .review-stars { color:#fbbf24; font-size:14px; margin-bottom:6px; }
        .review-text { font-size:13px; color:var(--sub); line-height:1.7; font-weight:300; }

        .star-row { display:flex; gap:8px; margin-bottom:14px; }
        .star-btn { font-size:26px; background:none; border:none; cursor:pointer; padding:0; line-height:1; transition:transform 0.15s; }
        .star-btn:hover { transform:scale(1.2); }
        .review-ta { width:100%; padding:12px 16px; background:var(--panel2); border:1px solid var(--line); border-radius:10px; color:var(--text); font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:300; resize:vertical; min-height:80px; outline:none; margin-bottom:12px; transition:border-color 0.2s; }
        .review-ta:focus { border-color:rgba(198,241,53,0.3); }
        .review-ta::placeholder { color:var(--sub); opacity:0.5; }

        /* SIDEBAR */
        .price-card { background:var(--panel); border:1px solid rgba(198,241,53,0.12); border-radius:18px; padding:28px; margin-bottom:16px; position:relative; overflow:hidden; }
        .price-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(198,241,53,0.4),transparent); }
        .price-val { font-size:40px; font-weight:800; letter-spacing:-2px; color:var(--lime); line-height:1; margin-bottom:4px; }
        .price-per { font-size:13px; color:var(--sub); margin-bottom:22px; }
        .pf-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--line); font-size:13px; }
        .pf-row:last-of-type { border-bottom:none; }
        .pf-check { color:var(--lime); font-weight:700; font-size:14px; }
        .pf-text { color:var(--sub); }
        .btn-full { width:100%; padding:14px; font-size:14px; font-weight:800; border-radius:12px; border:none; cursor:pointer; transition:all 0.25s; font-family:'Plus Jakarta Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:8px; }
        .btn-full-lime { background:var(--lime); color:#000; margin-bottom:10px; }
        .btn-full-lime:hover { background:#d4ff45; box-shadow:0 0 24px rgba(198,241,53,0.3); transform:translateY(-1px); }
        .btn-full-outline { background:transparent; color:var(--text); border:1px solid var(--line); }
        .btn-full-outline:hover { border-color:rgba(255,255,255,0.2); background:rgba(255,255,255,0.04); }

        .info-row { display:flex; justify-content:space-between; align-items:center; padding:11px 0; border-bottom:1px solid var(--line); }
        .info-row:last-child { border-bottom:none; }
        .info-label { font-size:13px; color:var(--sub); display:flex; align-items:center; gap:8px; }
        .info-val { font-size:13px; font-weight:600; }

        /* MODAL */
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(12px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .modal { background:#0a1220; border:1px solid rgba(0,212,255,0.1); border-radius:24px; padding:36px; width:100%; max-width:480px; position:relative; }
        .modal::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(198,241,53,0.5),transparent); border-radius:24px 24px 0 0; }
        .modal-x { position:absolute; top:18px; right:18px; width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); color:#4d6b8a; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
        .modal-x:hover { color:var(--text); background:rgba(255,255,255,0.1); }
        .modal-title { font-size:22px; font-weight:800; letter-spacing:-0.8px; margin-bottom:4px; }
        .modal-sub { font-size:14px; color:var(--sub); margin-bottom:26px; font-weight:300; }
        .field { margin-bottom:16px; }
        .field label { display:block; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--sub); margin-bottom:8px; }
        .field input, .field select, .field textarea { width:100%; padding:13px 16px; background:#0f1a2e; border:1px solid rgba(0,212,255,0.08); border-radius:10px; color:#e2ecff; font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:all 0.2s; }
        .field input:focus, .field select:focus, .field textarea:focus { border-color:rgba(198,241,53,0.35); box-shadow:0 0 0 3px rgba(198,241,53,0.06); }
        .field select option { background:#0f1a2e; }
        .field textarea { resize:vertical; min-height:90px; }
        .btn-submit { width:100%; padding:15px; background:var(--lime); color:#000; font-size:14px; font-weight:800; border-radius:12px; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.25s; margin-top:6px; }
        .btn-submit:hover:not(:disabled) { background:#d4ff45; box-shadow:0 0 28px rgba(198,241,53,0.35); }
        .btn-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .success-box { text-align:center; padding:24px 0; }
        .success-icon { font-size:52px; margin-bottom:14px; }
        .success-title { font-size:22px; font-weight:800; letter-spacing:-0.8px; margin-bottom:8px; }
        .success-sub { font-size:14px; color:var(--sub); font-weight:300; }

        @media(max-width:900px) { .layout { grid-template-columns:1fr; } .page { padding:20px; } .nav { padding:0 20px; } .stats-strip { grid-template-columns:repeat(2,1fr); } .hero-body { padding:60px 20px 24px; } .hero-actions { flex-wrap:wrap; } }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <a className="logo" href="/">
          <div className="logo-icon">U</div>
          <span className="logo-text"><em>Urban</em>Well</span>
        </a>
        <button className="btn-back" onClick={() => router.back()}>← Back to Trainers</button>
      </nav>

      <div className="page">
        {/* HERO */}
        <div className="hero-card">
          <div className="hero-banner" style={{ background: t.gradient }}>
            <div className="hero-banner-overlay" />
            <div className="hero-avatar-wrap">
              <div className="hero-avatar" style={{ background: t.gradient }}>
                {t.initials}
              </div>
              <div className="online-dot" />
            </div>
          </div>
          <div className="hero-body">
            <div className="hero-top">
              <div className="hero-info">
                <div className="trainer-name">{t.name}</div>
                <div className="trainer-specialty">{t.specialty}</div>
                <div className="hero-meta">
                  <div className="hm">📍 <strong>{t.location?.city}</strong></div>
                  <div className="hm">⚡ <strong>{t.experience}+ years</strong> experience</div>
                  <div className="hm">★ <strong>4.9</strong> (128 reviews)</div>
                  <div className="chip-avail"><span className="chip-dot" />Available Now</div>
                </div>
              </div>
              <div className="hero-actions">
                <button className="btn-msg" onClick={() => setShowMessage(true)}>
                  💬 Message
                </button>
                <button className="btn-book-hero" onClick={() => setShowBooking(true)}>
                  📅 Book Session
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-strip">
          {[
            { v:'340', l:'Sessions Completed' },
            { v:'4.9★', l:'Average Rating' },
            { v:`$${t.price}/hr`, l:'Session Rate' },
            { v:'< 2h', l:'Response Time' },
          ].map(s => (
            <div className="ss" key={s.l}>
              <div className="ss-val">{s.v}</div>
              <div className="ss-lbl">{s.l}</div>
            </div>
          ))}
        </div>

        {/* LAYOUT */}
        <div className="layout">
          <div>
            <div className="tabs">
              {['about','schedule','reviews'].map(tab => (
                <button key={tab} className={`tab ${activeTab===tab?'active':''}`} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase()+tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'about' && (
              <>
                <div className="card">
                  <div className="card-title">About</div>
                  <p className="bio-text">{t.bio}</p>
                  <div className="spec-grid">
                    {['Personal Training','Online Coaching','Nutrition Guidance','Progress Tracking','Video Sessions','WhatsApp Support'].map(s => (
                      <div className="spec-item" key={s}>
                        <span className="spec-check">✓</span>{s}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Certifications</div>
                  {[
                    { cert:'NASM Certified Personal Trainer', year:'2019' },
                    { cert:'ACE Fitness Nutrition Specialist', year:'2020' },
                    { cert:'CrossFit Level 2 Trainer', year:'2021' },
                    { cert:'CPR / AED Certified', year:'2023' },
                  ].map(c => (
                    <div className="cert-item" key={c.cert}>
                      <span className="cert-name">🏆 {c.cert}</span>
                      <span className="cert-year">{c.year}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'schedule' && (
              <div className="card">
                <div className="card-title">Weekly Availability</div>
                <div className="schedule-grid">
                  {[
                    { day:'Mon', on:true },{ day:'Tue', on:true },{ day:'Wed', on:false },
                    { day:'Thu', on:true },{ day:'Fri', on:true },{ day:'Sat', on:true },{ day:'Sun', on:false },
                  ].map(d => (
                    <div key={d.day} className={`day ${d.on?'on':''}`}>
                      <div className="day-name">{d.day}</div>
                      <div className="day-status">{d.on?'✓':'✗'}</div>
                    </div>
                  ))}
                </div>
                <div className="card-title">Available Time Slots</div>
                {['09:00 AM','11:00 AM','02:00 PM','04:00 PM','06:00 PM'].map(time => (
                  <div className="slot" key={time}>
                    <span className="slot-time">⏰ {time}</span>
                    <button className="btn-slot" onClick={() => { setBooking(b => ({ ...b, time })); setShowBooking(true); }}>
                      Book This Slot
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <div className="card-title" style={{ marginBottom:0 }}>Reviews</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:22, color:'#fbbf24' }}>★</span>
                    <span style={{ fontSize:20, fontWeight:800 }}>4.9</span>
                    <span style={{ fontSize:13, color:'var(--sub)' }}>(128 reviews)</span>
                  </div>
                </div>

                {/* Write review */}
                <div style={{ background:'rgba(198,241,53,0.04)', border:'1px solid rgba(198,241,53,0.1)', borderRadius:14, padding:20, marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Write a Review</div>
                  <div className="star-row">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} className="star-btn" onClick={() => setReviewForm(r => ({ ...r, rating:s }))}>
                        <span style={{ color: s <= reviewForm.rating ? '#fbbf24' : 'rgba(255,255,255,0.1)' }}>★</span>
                      </button>
                    ))}
                  </div>
                  <textarea className="review-ta" placeholder="Share your experience with this trainer..." value={reviewForm.comment} onChange={e => setReviewForm(r => ({ ...r, comment:e.target.value }))} />
                  <button style={{ padding:'10px 24px', background:'var(--lime)', color:'#000', border:'none', borderRadius:10, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Submit Review
                  </button>
                </div>

                {/* Mock reviews */}
                {[
                  { name:'Ahmed K.', rating:5, text:'Absolutely transformed my fitness. Professional, knowledgeable, and genuinely cares about your progress. Highly recommend!', date:'2 days ago' },
                  { name:'Sara M.', rating:5, text:'Best trainer I have worked with. Hit my goal in 8 weeks with a fully personalized plan. Worth every penny!', date:'1 week ago' },
                  { name:'James T.', rating:4, text:'Very professional and responsive. Sessions are intense but perfectly structured. Great communicator.', date:'2 weeks ago' },
                  { name:'Priya R.', rating:5, text:'The nutrition guidance alone was a game changer. Combined with the workouts I lost 8kg in 10 weeks!', date:'3 weeks ago' },
                ].map((r, i) => (
                  <div className="review-item" key={i}>
                    <div className="review-header">
                      <span className="review-name">{r.name}</span>
                      <span className="review-date">{r.date}</span>
                    </div>
                    <div className="review-stars">{'★'.repeat(r.rating)}</div>
                    <p className="review-text">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div>
            <div className="price-card">
              <div className="price-val">${t.price}</div>
              <div className="price-per">per session / hour</div>
              <div style={{ marginBottom:20 }}>
                {['Personalized workout plan','Progress tracking included','Nutrition guidance','WhatsApp support 24/7','Video session available','Monthly check-ins'].map(f => (
                  <div className="pf-row" key={f}>
                    <span className="pf-check">✓</span>
                    <span className="pf-text">{f}</span>
                  </div>
                ))}
              </div>
              <button className="btn-full btn-full-lime" onClick={() => setShowBooking(true)}>
                📅 Book Session
              </button>
              <button className="btn-full btn-full-outline" onClick={() => setShowMessage(true)}>
                💬 Message Trainer
              </button>
            </div>

            <div className="card">
              <div className="card-title">Quick Info</div>
              {[
                { icon:'🏆', label:'Experience', val:`${t.experience}+ years` },
                { icon:'👥', label:'Clients Trained', val:'200+' },
                { icon:'📍', label:'Location', val:t.location?.city },
                { icon:'🌐', label:'Online Sessions', val:'Available' },
                { icon:'📱', label:'Response Time', val:'< 2 hours' },
                { icon:'🌍', label:'Language', val:'English, Urdu' },
              ].map(s => (
                <div className="info-row" key={s.label}>
                  <span className="info-label">{s.icon} {s.label}</span>
                  <span className="info-val">{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {showBooking && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowBooking(false); }}>
          <div className="modal">
            <button className="modal-x" onClick={() => setShowBooking(false)}>✕</button>
            {bookingSuccess ? (
              <div className="success-box">
                <div className="success-icon">🎉</div>
                <div className="success-title">Booking Confirmed!</div>
                <div className="success-sub">Your session with {t.name} has been booked. Check your email!</div>
              </div>
            ) : (
              <>
                <div className="modal-title">Book a Session</div>
                <div className="modal-sub">Schedule with {t.name} · ${t.price}/hr</div>
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={booking.date} min={new Date().toISOString().split('T')[0]} onChange={e => setBooking(b => ({ ...b, date:e.target.value }))} />
                </div>
                <div className="field">
                  <label>Time Slot</label>
                  <select value={booking.time} onChange={e => setBooking(b => ({ ...b, time:e.target.value }))}>
                    <option value="">Select a time</option>
                    {['09:00 AM','11:00 AM','02:00 PM','04:00 PM','06:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Session Type</label>
                  <select value={booking.type} onChange={e => setBooking(b => ({ ...b, type:e.target.value }))}>
                    <option>In-Person Session</option>
                    <option>Video Call Session</option>
                    <option>Outdoor Training</option>
                  </select>
                </div>
                <div className="field">
                  <label>Notes (optional)</label>
                  <textarea placeholder="Goals, injuries, or special requests..." value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes:e.target.value }))} />
                </div>
                <button className="btn-submit" onClick={submitBooking} disabled={bookingLoading}>
                  {bookingLoading ? 'Confirming...' : '✓ Confirm Booking'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MESSAGE MODAL */}
      {showMessage && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowMessage(false); }}>
          <div className="modal">
            <button className="modal-x" onClick={() => setShowMessage(false)}>✕</button>
            {messageSent ? (
              <div className="success-box">
                <div className="success-icon">✉️</div>
                <div className="success-title">Message Sent!</div>
                <div className="success-sub">{t.name} will reply within 2 hours.</div>
              </div>
            ) : (
              <>
                <div className="modal-title">Message {t.name}</div>
                <div className="modal-sub">Introduce yourself or ask a question before booking.</div>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--line)', borderRadius:12, marginBottom:20 }}>
                  <div style={{ width:44, height:44, borderRadius:11, background:t.gradient, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'#000', flexShrink:0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700 }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'var(--lime)', fontWeight:600 }}>● Usually replies in &lt; 2 hours</div>
                  </div>
                </div>
                <div className="field">
                  <label>Your Message</label>
                  <textarea placeholder={`Hi ${t.name}, I'm interested in your ${t.specialty} training. I'd love to know more about your program...`} value={message} onChange={e => setMessage(e.target.value)} style={{ minHeight:120 }} />
                </div>
                <button className="btn-submit" onClick={sendMessage}>
                  ✉️ Send Message
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}