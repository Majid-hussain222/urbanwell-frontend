'use client';

import { useEffect, useMemo, useState } from 'react';
import API from '../lib/api';

const mockTrainers = [
  { id: 1, name: 'Sarah Khan', specialty: 'Strength & Conditioning', bio: '10+ years building elite athletes from the ground up. Olympic lifting specialist with a proven track record of transforming beginners into competitors.', cats: ['Strength', 'PowerLifting', 'Olympic Lifting'], rating: 4.9, reviews: 128, sessions: 340, price: '$45', priceNum: 45, gradient: 'linear-gradient(135deg,#c6f135 0%,#00d4ff 100%)', initials: 'SK', exp: '10 yrs', location: 'Lahore', available: true, badge: 'Top Rated' },
  { id: 2, name: 'James Miller', specialty: 'HIIT & Athletic Performance', bio: 'Former national sprinter turned coach. High-intensity methodology backed by sports science — fat loss and peak performance without wasted effort.', cats: ['HIIT', 'Sprint Training', 'Boxing'], rating: 4.8, reviews: 96, sessions: 210, price: '$40', priceNum: 40, gradient: 'linear-gradient(135deg,#00d4ff 0%,#8b5cf6 100%)', initials: 'JM', exp: '7 yrs', location: 'Karachi', available: true, badge: 'Popular' },
  { id: 3, name: 'Priya Sharma', specialty: 'Yoga & Mind-Body Fitness', bio: 'Certified yoga instructor and mobility specialist. Bridging the gap between mindfulness and physical peak performance through ancient and modern methods.', cats: ['Yoga', 'Mobility', 'Meditation'], rating: 5.0, reviews: 74, sessions: 180, price: '$38', priceNum: 38, gradient: 'linear-gradient(135deg,#8b5cf6 0%,#f43f5e 100%)', initials: 'PS', exp: '8 yrs', location: 'Islamabad', available: false, badge: '5 Star' },
  { id: 4, name: 'Alex Torres', specialty: 'Bodybuilding & Hypertrophy', bio: 'IFBB certified bodybuilding coach. If you want to build serious muscle with scientific precision — periodization, nutrition timing, and posing included.', cats: ['Hypertrophy', 'Competition Prep', 'Nutrition'], rating: 4.9, reviews: 112, sessions: 290, price: '$55', priceNum: 55, gradient: 'linear-gradient(135deg,#f59e0b 0%,#c6f135 100%)', initials: 'AT', exp: '12 yrs', location: 'Lahore', available: true, badge: 'Expert' },
  { id: 5, name: 'Mia Johnson', specialty: 'Functional & CrossFit', bio: 'CrossFit L3 coach focused on making you capable, not just aesthetic. Real-world strength, endurance, and resilience for life outside the gym.', cats: ['CrossFit', 'Functional', 'Endurance'], rating: 4.7, reviews: 88, sessions: 195, price: '$42', priceNum: 42, gradient: 'linear-gradient(135deg,#00d4ff 0%,#c6f135 100%)', initials: 'MJ', exp: '6 yrs', location: 'Karachi', available: true, badge: null },
  { id: 6, name: 'Omar Hassan', specialty: 'Fat Loss & Transformation', bio: 'Certified transformation coach with 400+ client success stories. Combines smart training, precise nutrition, and behavioral psychology for lasting change.', cats: ['Fat Loss', 'Body Recomp', 'Mindset'], rating: 4.9, reviews: 143, sessions: 420, price: '$50', priceNum: 50, gradient: 'linear-gradient(135deg,#f43f5e 0%,#f59e0b 100%)', initials: 'OH', exp: '9 yrs', location: 'Lahore', available: true, badge: 'Most Booked' },
  { id: 7, name: 'Zara Malik', specialty: 'Pre & Postnatal Fitness', bio: "Specialized women's health coach with expertise in pre/postnatal exercise, hormonal health, and building sustainable fitness habits for mothers.", cats: ["Women's Health", 'Prenatal', 'Core Rehab'], rating: 4.9, reviews: 67, sessions: 155, price: '$48', priceNum: 48, gradient: 'linear-gradient(135deg,#f43f5e 0%,#8b5cf6 100%)', initials: 'ZM', exp: '8 yrs', location: 'Islamabad', available: true, badge: 'Specialist' },
  { id: 8, name: 'Rayan Qureshi', specialty: 'Martial Arts & Combat Fitness', bio: 'MMA fighter and certified combat sports coach. Combines striking, grappling, and conditioning for the ultimate full-body transformation through martial arts.', cats: ['MMA', 'Boxing', 'Kickboxing'], rating: 4.8, reviews: 59, sessions: 140, price: '$52', priceNum: 52, gradient: 'linear-gradient(135deg,#1a1a2e 0%,#c6f135 100%)', initials: 'RQ', exp: '11 yrs', location: 'Lahore', available: false, badge: null },
  { id: 9, name: 'Aisha Noor', specialty: 'Dance Fitness & Zumba', bio: 'Licensed Zumba instructor and dance fitness expert. Making cardio something you actually look forward to — burn 600+ calories while having the time of your life.', cats: ['Zumba', 'Aerobics', 'Dance Cardio'], rating: 4.9, reviews: 103, sessions: 260, price: '$35', priceNum: 35, gradient: 'linear-gradient(135deg,#f59e0b 0%,#f43f5e 100%)', initials: 'AN', exp: '5 yrs', location: 'Karachi', available: true, badge: 'Fan Favorite' },
];

const filters = [
  { id: 'all', label: 'All Trainers', icon: '⚡' },
  { id: 'strength', label: 'Strength', icon: '🏋️' },
  { id: 'cardio', label: 'Cardio', icon: '🏃' },
  { id: 'yoga', label: 'Yoga', icon: '🧘' },
  { id: 'hiit', label: 'HIIT', icon: '🔥' },
  { id: 'martial', label: 'Martial Arts', icon: '🥊' },
  { id: 'dance', label: 'Dance', icon: '💃' },
];

function safeId(t: any) {
  const v = t?._id ?? t?.id;
  return v == null ? '' : String(v);
}

function isMongoId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}

function getErrorMessage(err: any) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

export default function Trainers() {
  const [apiTrainers, setApiTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('rating');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const [bookingTrainer, setBookingTrainer] = useState<any>(null);
  const [booking, setBooking] = useState({
    date: '',
    time: '',
    type: 'In-Person Session',
    notes: '',
  });

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (t: { type: 'success' | 'error'; text: string }) => {
    setToast(t);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    API.get('/trainers')
      .then((r) => setApiTrainers(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allTrainers = apiTrainers.length > 0 ? apiTrainers : mockTrainers;

  const filtered = useMemo(() => {
    return allTrainers
      .filter((t: any) => {
        const cats = (t.cats || t.categories || []) as string[];
        const matchSearch =
          t.name?.toLowerCase().includes(search.toLowerCase()) ||
          t.specialty?.toLowerCase().includes(search.toLowerCase()) ||
          cats.some((c: string) => String(c).toLowerCase().includes(search.toLowerCase()));

        const matchFilter =
          filter === 'all' ||
          t.specialty?.toLowerCase().includes(filter) ||
          cats.some((c: string) => String(c).toLowerCase().includes(filter));

        return matchSearch && matchFilter;
      })
      .sort((a: any, b: any) => {
        if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sort === 'price-low') return (a.priceNum || a.price || 0) - (b.priceNum || b.price || 0);
        if (sort === 'price-high') return (b.priceNum || b.price || 0) - (a.priceNum || a.price || 0);
        if (sort === 'sessions') return (b.sessions || 0) - (a.sessions || 0);
        return 0;
      });
  }, [allTrainers, search, filter, sort]);

  const openBooking = (t: any) => {
    if (t?.available === false) {
      showToast({ type: 'error', text: 'This trainer is currently busy. Please choose another.' });
      return;
    }
    setBookingTrainer(t);
    setBooking({ date: '', time: '', type: 'In-Person Session', notes: '' });
    setBookingSuccess(false);
  };
const convertTo24Hour = (time12h: string): string => {
  try {
    const parts = time12h.trim().split(' ');
    if (parts.length !== 2) return '09:00';
    const modifier = parts[1].toUpperCase();
    const timeParts = parts[0].split(':');
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1] || '00';
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  } catch {
    return '09:00';
  }
};

  const submitBooking = async () => {
    if (!bookingTrainer) return;

    if (!booking.date || !booking.time) {
      showToast({ type: 'error', text: 'Please select date and time.' });
      return;
    }

    setBookingLoading(true);

    try {
      const trainerId = safeId(bookingTrainer);
      if (!trainerId) throw new Error('Trainer ID missing');

      const time24 = convertTo24Hour(booking.time);
      const isoDateTime = new Date(`${booking.date}T${time24}:00`).toISOString();

      const payload: any = {
        type: 'trainer',
        date: isoDateTime,
        sessionType: booking.type,
        notes: booking.notes || '',
        price: bookingTrainer?.priceNum || 0,
      };

      if (isMongoId(trainerId)) {
        payload.trainer = trainerId;
      }

      console.log('Booking payload:', payload);

      const res = await API.post('/bookings', payload);

      if (res?.data?.success === false) {
        throw new Error(res?.data?.message || 'Booking failed');
      }

      setBookingSuccess(true);
      showToast({
        type: 'success',
        text: `Booked: ${booking.date} · ${booking.time}`,
      });

      setTimeout(() => {
        setBookingTrainer(null);
        setBookingSuccess(false);
      }, 1200);
    } catch (err: any) {
      console.error('Booking error:', err?.response?.data || err);
      showToast({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBookingLoading(false);
    }
  };

  const featured = mockTrainers.find((t) => t.id === 6) || mockTrainers[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        :root {
          --void:#03050a; --panel:#0a1220; --panel2:#0f1a2e;
          --lime:#c6f135; --cyan:#00d4ff; --violet:#8b5cf6;
          --rose:#f43f5e; --amber:#f59e0b;
          --text:#e2ecff; --sub:#4d6b8a; --line:rgba(0,212,255,0.08);
        }
        html { scroll-behavior:smooth; }
        body { background:var(--void); color:var(--text); font-family:'Plus Jakarta Sans',sans-serif; -webkit-font-smoothing:antialiased; min-height:100vh; }
        body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events:none; z-index:9999; opacity:0.4; }

        .toast { position:fixed; bottom:26px; right:26px; z-index:3000; padding:12px 16px; border-radius:12px; border:1px solid var(--line); background:rgba(10,18,32,0.92); backdrop-filter:blur(14px); display:flex; gap:10px; align-items:center; box-shadow:0 20px 60px rgba(0,0,0,0.55); animation:fadein 0.2s ease; }
        .toast .dot { width:8px; height:8px; border-radius:999px; }
        .toast.success .dot { background:var(--lime); box-shadow:0 0 0 6px rgba(198,241,53,0.08); }
        .toast.error .dot { background:var(--rose); box-shadow:0 0 0 6px rgba(244,63,94,0.08); }
        .toast .txt { font-size:13px; font-weight:700; color:var(--text); }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .nav { position:sticky; top:0; z-index:200; height:68px; display:flex; align-items:center; justify-content:space-between; padding:0 48px; background:rgba(3,5,10,0.88); backdrop-filter:blur(28px) saturate(160%); border-bottom:1px solid var(--line); }
        .logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .logo-icon { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,var(--lime),var(--cyan)); display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:900; color:#000; }
        .logo-text { font-size:19px; font-weight:800; letter-spacing:-0.5px; }
        .logo-text em { font-style:normal; color:var(--lime); }
        .nav-links { display:flex; gap:4px; }
        .nav-link { padding:7px 16px; font-size:13px; font-weight:500; color:var(--sub); text-decoration:none; border-radius:8px; transition:all 0.2s; }
        .nav-link:hover { color:var(--text); background:rgba(255,255,255,0.04); }
        .nav-right { display:flex; gap:10px; align-items:center; }
        .btn-ghost-nav { padding:9px 18px; font-size:13px; font-weight:700; border-radius:9px; text-decoration:none; background:transparent; color:var(--sub); border:1px solid var(--line); transition:all 0.2s; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-ghost-nav:hover { color:var(--text); border-color:rgba(255,255,255,0.15); }
        .btn-lime-nav { padding:9px 20px; font-size:13px; font-weight:900; border-radius:9px; text-decoration:none; background:var(--lime); color:#000; border:none; transition:all 0.2s; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-lime-nav:hover { background:#d4ff45; box-shadow:0 0 20px rgba(198,241,53,0.35); }

        .hero { position:relative; overflow:hidden; padding:80px 48px 0; max-width:1400px; margin:0 auto; }
        .hero-mesh { position:absolute; inset:0; pointer-events:none; background: radial-gradient(ellipse 60% 50% at 15% 50%, rgba(198,241,53,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 85% 30%, rgba(0,212,255,0.05) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 50% 80%, rgba(139,92,246,0.04) 0%, transparent 60%); }
        .hero-grid { position:absolute; inset:0; pointer-events:none; background-image:radial-gradient(circle, rgba(0,212,255,0.06) 1px, transparent 1px); background-size:48px 48px; mask-image:radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%); }
        .hero-inner { position:relative; z-index:1; }
        .hero-eyebrow { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:100px; background:rgba(198,241,53,0.07); border:1px solid rgba(198,241,53,0.2); font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:var(--lime); margin-bottom:24px; }
        .hero-dot { width:6px; height:6px; border-radius:50%; background:var(--lime); animation:gdot 2s infinite; }
        @keyframes gdot { 0%,100%{box-shadow:0 0 0 0 rgba(198,241,53,0.6)} 50%{box-shadow:0 0 0 7px rgba(198,241,53,0)} }
        .hero-title { font-size:clamp(44px,5.5vw,72px); font-weight:900; letter-spacing:-3px; line-height:0.95; margin-bottom:20px; }
        .hero-title .stroke { -webkit-text-stroke:1.5px rgba(255,255,255,0.2); color:transparent; }
        .hero-title .lime { color:var(--lime); }
        .hero-sub { font-size:17px; color:var(--sub); font-weight:300; line-height:1.7; max-width:560px; margin-bottom:40px; }
        .hero-sub strong { color:var(--text); font-weight:600; }
        .hero-stats { display:flex; gap:0; border:1px solid var(--line); border-radius:16px; overflow:hidden; background:var(--panel); width:fit-content; margin-bottom:56px; }
        .hstat { padding:16px 28px; border-right:1px solid var(--line); text-align:center; }
        .hstat:last-child { border-right:none; }
        .hstat-val { font-size:24px; font-weight:900; letter-spacing:-1px; color:var(--lime); line-height:1; margin-bottom:3px; }
        .hstat-lbl { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--sub); }

        .ticker-wrap { overflow:hidden; border-top:1px solid var(--line); border-bottom:1px solid var(--line); background:rgba(198,241,53,0.03); padding:12px 0; }
        .ticker-inner { display:flex; animation:tick 30s linear infinite; width:max-content; }
        .ticker-inner:hover { animation-play-state:paused; }
        @keyframes tick { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .tick-item { display:flex; align-items:center; gap:8px; padding:0 28px; white-space:nowrap; font-size:12px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:var(--sub); }
        .tick-dot { width:4px; height:4px; border-radius:50%; background:var(--lime); }

        .featured-section { max-width:1400px; margin:0 auto 0; padding:0 48px; }
        .section-label { font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:var(--lime); margin:48px 0 20px; display:flex; align-items:center; gap:8px; }
        .section-label::before { content:''; width:20px; height:1px; background:var(--lime); }
        .featured-card { background:var(--panel); border:1px solid rgba(198,241,53,0.15); border-radius:24px; overflow:hidden; display:grid; grid-template-columns:320px 1fr; margin-bottom:40px; position:relative; }
        .featured-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(198,241,53,0.5),transparent); }
        .featured-banner { position:relative; overflow:hidden; }
        .featured-avatar { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:80px; font-weight:900; color:#000; font-family:'Plus Jakarta Sans',sans-serif; }
        .featured-body { padding:36px; display:flex; flex-direction:column; justify-content:space-between; }
        .featured-tag { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:100px; background:rgba(198,241,53,0.08); border:1px solid rgba(198,241,53,0.2); font-size:10px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; color:var(--lime); margin-bottom:14px; width:fit-content; }
        .featured-name { font-size:32px; font-weight:900; letter-spacing:-1.5px; margin-bottom:4px; }
        .featured-specialty { font-size:12px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:var(--lime); margin-bottom:14px; }
        .featured-bio { font-size:14px; color:var(--sub); line-height:1.8; font-weight:300; margin-bottom:20px; }
        .featured-meta { display:flex; gap:20px; margin-bottom:24px; flex-wrap:wrap; }
        .fmeta { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--sub); }
        .fmeta-val { font-weight:800; color:var(--text); }
        .featured-actions { display:flex; gap:10px; flex-wrap:wrap; }
        .btn-featured-book { padding:13px 28px; background:var(--lime); color:#000; font-size:14px; font-weight:900; border-radius:12px; border:none; cursor:pointer; transition:all 0.25s; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-featured-book:hover { background:#d4ff45; box-shadow:0 0 28px rgba(198,241,53,0.4); transform:translateY(-1px); }
        .btn-featured-profile { padding:13px 24px; background:rgba(255,255,255,0.05); color:var(--text); font-size:14px; font-weight:800; border-radius:12px; border:1px solid var(--line); cursor:pointer; transition:all 0.2s; text-decoration:none; display:inline-flex; align-items:center; gap:8px; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-featured-profile:hover { border-color:rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); }

        .controls-section { max-width:1400px; margin:0 auto; padding:36px 48px 0; }
        .controls-top { display:flex; gap:14px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
        .search-wrap { position:relative; flex:1; min-width:280px; }
        .search-icon { position:absolute; left:16px; top:50%; transform:translateY(-50%); font-size:16px; pointer-events:none; opacity:0.5; }
        .search-clear { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:rgba(255,255,255,0.06); border:none; border-radius:6px; width:22px; height:22px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--sub); font-size:12px; transition:all 0.2s; }
        .search-clear:hover { color:var(--text); background:rgba(255,255,255,0.12); }
        .search-input { width:100%; padding:13px 44px 13px 46px; background:var(--panel); border:1px solid var(--line); border-radius:12px; color:var(--text); font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:all 0.25s; }
        .search-input::placeholder { color:var(--sub); opacity:0.5; }
        .search-input:focus { border-color:rgba(198,241,53,0.35); box-shadow:0 0 0 3px rgba(198,241,53,0.07); }
        .controls-right { display:flex; gap:10px; align-items:center; }
        .sort-select { padding:12px 16px; background:var(--panel); border:1px solid var(--line); border-radius:10px; color:var(--text); font-size:13px; font-weight:800; font-family:'Plus Jakarta Sans',sans-serif; outline:none; cursor:pointer; transition:all 0.2s; }
        .sort-select option { background:var(--panel2); }
        .view-toggle { display:flex; gap:3px; background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:3px; }
        .vbtn { width:36px; height:36px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:15px; transition:all 0.2s; background:transparent; color:var(--text); }
        .vbtn.active { background:rgba(198,241,53,0.12); }

        .filter-pills { display:flex; gap:8px; flex-wrap:wrap; padding-bottom:20px; }
        .fpill { display:flex; align-items:center; gap:6px; padding:9px 18px; border-radius:100px; font-size:13px; font-weight:800; cursor:pointer; transition:all 0.25s; border:1px solid var(--line); background:transparent; color:var(--sub); font-family:'Plus Jakarta Sans',sans-serif; }
        .fpill.active { background:rgba(198,241,53,0.08); color:var(--lime); border-color:rgba(198,241,53,0.25); box-shadow:0 0 16px rgba(198,241,53,0.08); }
        .fpill-count { background:rgba(198,241,53,0.15); color:var(--lime); border-radius:100px; padding:1px 7px; font-size:10px; font-weight:900; }

        .results-bar { display:flex; justify-content:space-between; align-items:center; padding:0 48px; max-width:1400px; margin:0 auto 24px; }
        .results-count { font-size:13px; color:var(--sub); }
        .results-count strong { color:var(--lime); font-weight:900; }
        .btn-mini { padding:9px 14px; border-radius:10px; border:1px solid var(--line); background:rgba(255,255,255,0.03); color:var(--text); font-size:12px; font-weight:900; cursor:pointer; text-decoration:none; }
        .btn-mini:hover { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.16); }

        .main { max-width:1400px; margin:0 auto; padding:0 48px 80px; }
        .trainers-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .trainers-list { display:flex; flex-direction:column; gap:12px; }

        .trainer-card { background:var(--panel); border:1px solid var(--line); border-radius:22px; overflow:hidden; transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1); display:flex; flex-direction:column; position:relative; }
        .trainer-card:hover { border-color:rgba(198,241,53,0.22); transform:translateY(-6px) scale(1.01); box-shadow:0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(198,241,53,0.08); }
        .card-banner { height:110px; position:relative; overflow:hidden; flex-shrink:0; }
        .card-banner-shimmer { position:absolute; inset:0; background:linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%); background-size:200% 100%; animation:shim 3s ease-in-out infinite; }
        @keyframes shim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .card-badge-top { position:absolute; top:12px; right:12px; padding:4px 10px; border-radius:100px; background:rgba(0,0,0,0.55); backdrop-filter:blur(8px); font-size:10px; font-weight:900; border:1px solid rgba(255,255,255,0.12); color:#fff; }
        .card-avail { position:absolute; top:12px; left:12px; display:flex; align-items:center; gap:5px; padding:4px 10px; border-radius:100px; font-size:10px; font-weight:900; }
        .card-avail.on { background:rgba(198,241,53,0.12); border:1px solid rgba(198,241,53,0.25); color:var(--lime); }
        .card-avail.off { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:var(--sub); }
        .avail-dot { width:5px; height:5px; border-radius:50%; }
        .avail-dot.on { background:var(--lime); animation:gdot 2s infinite; }
        .avail-dot.off { background:var(--sub); }

        .card-avatar { width:76px; height:76px; border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:30px; font-weight:900; color:#000; border:4px solid var(--panel); position:absolute; bottom:-38px; left:24px; z-index:2; box-shadow:0 8px 24px rgba(0,0,0,0.4); }
        .card-body { padding:50px 24px 20px; flex:1; }
        .card-name { font-size:18px; font-weight:900; letter-spacing:-0.6px; margin-bottom:3px; }
        .card-specialty { font-size:11px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; color:var(--lime); margin-bottom:10px; }
        .card-bio { font-size:13px; color:var(--sub); line-height:1.7; font-weight:300; margin-bottom:14px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .card-tags { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:14px; }
        .ctag { padding:3px 9px; border-radius:100px; font-size:10px; font-weight:900; background:rgba(255,255,255,0.04); color:var(--sub); border:1px solid var(--line); }
        .card-stats { display:flex; gap:14px; margin-bottom:14px; padding:12px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid var(--line); }
        .cstat { flex:1; text-align:center; }
        .cstat-val { font-size:14px; font-weight:900; color:var(--text); }
        .cstat-lbl { font-size:10px; color:var(--sub); font-weight:800; }
        .card-rating { display:flex; align-items:center; gap:6px; }
        .rating-stars { color:#fbbf24; font-size:12px; letter-spacing:-1px; }
        .rating-num { font-size:13px; font-weight:900; }
        .rating-cnt { font-size:11px; color:var(--sub); font-weight:700; }

        .card-footer { display:flex; gap:8px; padding:0 24px 24px; }
        .btn-book-card { flex:1; padding:12px; background:var(--lime); color:#000; font-size:13px; font-weight:900; border-radius:11px; border:none; cursor:pointer; transition:all 0.25s; }
        .btn-book-card:hover { background:#d4ff45; box-shadow:0 0 24px rgba(198,241,53,0.35); transform:translateY(-1px); }
        .btn-book-card:disabled { opacity:0.55; cursor:not-allowed; }
        .btn-profile-card { padding:12px 16px; background:rgba(255,255,255,0.04); color:var(--text); font-size:13px; font-weight:800; border-radius:11px; border:1px solid var(--line); cursor:pointer; transition:all 0.2s; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; }
        .btn-profile-card:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); }

        .list-card { background:var(--panel); border:1px solid var(--line); border-radius:18px; overflow:hidden; transition:all 0.3s; display:flex; }
        .list-card:hover { border-color:rgba(198,241,53,0.18); box-shadow:0 12px 40px rgba(0,0,0,0.4); }
        .list-card-banner { width:120px; position:relative; }
        .list-avatar { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:40px; font-weight:900; color:#000; }
        .list-card-body { flex:1; padding:20px 24px; display:flex; align-items:center; gap:24px; }
        .list-info { flex:1; min-width:0; }
        .list-name { font-size:17px; font-weight:900; margin-bottom:3px; }
        .list-specialty { font-size:11px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; color:var(--lime); margin-bottom:8px; }
        .list-bio { font-size:13px; color:var(--sub); line-height:1.6; font-weight:300; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
        .list-meta { display:flex; gap:16px; align-items:center; flex-shrink:0; }
        .list-stat { text-align:center; }
        .list-stat-val { font-size:16px; font-weight:900; color:var(--lime); }
        .list-stat-lbl { font-size:10px; color:var(--sub); font-weight:800; }
        .list-price { font-size:18px; font-weight:900; color:var(--lime); }
        .list-price-lbl { font-size:10px; color:var(--sub); font-weight:800; }
        .list-actions { display:flex; flex-direction:column; gap:8px; padding:20px; justify-content:center; }

        .empty { text-align:center; padding:100px 20px; }
        .empty-icon { font-size:56px; margin-bottom:16px; }
        .empty-title { font-size:22px; font-weight:900; margin-bottom:8px; }
        .empty-sub { font-size:14px; color:var(--sub); font-weight:300; }
        .btn-reset { margin-top:20px; padding:11px 24px; background:var(--lime); color:#000; font-size:13px; font-weight:900; border-radius:10px; border:none; cursor:pointer; }
        .btn-reset:hover { background:#d4ff45; }

        .skel { background:linear-gradient(90deg,var(--panel) 25%,var(--panel2) 50%,var(--panel) 75%); background-size:200% 100%; animation:sk 1.4s ease-in-out infinite; border-radius:22px; height:360px; }
        @keyframes sk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.88); backdrop-filter:blur(14px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .modal { background:var(--panel); border:1px solid rgba(0,212,255,0.1); border-radius:26px; padding:40px; width:100%; max-width:520px; position:relative; max-height:90vh; overflow-y:auto; }
        .modal::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(198,241,53,0.5),transparent); border-radius:26px 26px 0 0; }
        .modal-x { position:absolute; top:18px; right:18px; width:34px; height:34px; border-radius:9px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); color:var(--sub); cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; }
        .modal-x:hover { color:var(--text); background:rgba(255,255,255,0.1); }
        .modal-title { font-size:24px; font-weight:900; letter-spacing:-1px; margin-bottom:4px; }
        .modal-sub { font-size:14px; color:var(--sub); font-weight:300; margin-bottom:18px; }
        .modal-trainer-header { display:flex; align-items:center; gap:14px; padding:14px 18px; background:rgba(255,255,255,0.03); border:1px solid var(--line); border-radius:14px; margin-bottom:18px; }
        .modal-trainer-avatar { width:50px; height:50px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900; color:#000; flex-shrink:0; }
        .modal-trainer-name { font-size:15px; font-weight:900; margin-bottom:2px; }
        .modal-trainer-specialty { font-size:12px; color:var(--lime); font-weight:800; letter-spacing:0.5px; }
        .field { margin-bottom:16px; }
        .field label { display:block; font-size:11px; font-weight:900; letter-spacing:1px; text-transform:uppercase; color:var(--sub); margin-bottom:8px; }
        .field input, .field select, .field textarea { width:100%; padding:13px 16px; background:var(--panel2); border:1px solid var(--line); border-radius:11px; color:var(--text); font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; }
        .field textarea { resize:vertical; min-height:90px; }
        .time-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .time-btn { padding:10px; border-radius:9px; background:rgba(255,255,255,0.03); border:1px solid var(--line); color:var(--sub); font-size:12px; font-weight:900; cursor:pointer; text-align:center; }
        .time-btn.selected { background:rgba(198,241,53,0.1); border-color:rgba(198,241,53,0.3); color:var(--lime); }
        .btn-submit { width:100%; padding:15px; background:var(--lime); color:#000; font-size:15px; font-weight:900; border-radius:12px; border:none; cursor:pointer; margin-top:8px; }
        .btn-submit:hover:not(:disabled) { background:#d4ff45; box-shadow:0 0 32px rgba(198,241,53,0.4); transform:translateY(-1px); }
        .btn-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .success-box { text-align:center; padding:22px 0; }
        .success-icon { font-size:56px; margin-bottom:14px; }
        .success-title { font-size:24px; font-weight:900; margin-bottom:8px; }
        .success-sub { font-size:14px; color:var(--sub); font-weight:300; line-height:1.6; }
        .success-actions { display:flex; gap:10px; justify-content:center; margin-top:16px; flex-wrap:wrap; }
        .btn-success { padding:10px 14px; border-radius:10px; border:1px solid var(--line); background:rgba(255,255,255,0.04); color:var(--text); font-weight:900; cursor:pointer; text-decoration:none; }
        .btn-success.primary { background:var(--lime); border:none; color:#000; }

        @media(max-width:1100px) { .trainers-grid { grid-template-columns:repeat(2,1fr); } .featured-card { grid-template-columns:1fr; } .featured-banner { height:200px; } }
        @media(max-width:900px) { .hero,.controls-section,.main,.featured-section { padding-left:20px; padding-right:20px; } .nav { padding:0 20px; } .results-bar { padding:0 20px; } }
        @media(max-width:640px) { .trainers-grid { grid-template-columns:1fr; } .time-grid { grid-template-columns:repeat(2,1fr); } }
      `}</style>

      {toast && (
        <div className={`toast ${toast.type}`}>
          <div className="dot" />
          <div className="txt">{toast.text}</div>
        </div>
      )}

      <nav className="nav">
        <a className="logo" href="/">
          <div className="logo-icon">U</div>
          <span className="logo-text"><em>Urban</em>Well</span>
        </a>
        <div className="nav-links">
          {[
            ['Trainers', '/trainers'],
            ['Nutritionists', '/nutritionists'],
            ['Gyms', '/gym-packages'],
            ['Meals', '/meals'],
          ].map(([l, h]) => (
            <a key={l} className="nav-link" href={h}>
              {l}
            </a>
          ))}
        </div>
        <div className="nav-right">
          <a className="btn-ghost-nav" href="/bookings">My Bookings</a>
          <a className="btn-ghost-nav" href="/dashboard">Dashboard</a>
          <a className="btn-lime-nav" href="/signup">Get Started</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-mesh" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span className="hero-dot" />
            Expert Trainer Network
          </div>
          <h1 className="hero-title">
            Find a trainer
            <br />
            <span className="lime">who gets</span> <span className="stroke">results.</span>
          </h1>
          <p className="hero-sub">
            Browse <strong>500+ certified fitness professionals</strong> across Pakistan. Book sessions,
            video calls, or full coaching programs — all in one place.
          </p>
          <div className="hero-stats">
            {[
              { v: '500+', l: 'Certified Trainers' },
              { v: '12K+', l: 'Sessions Booked' },
              { v: '4.9★', l: 'Avg Rating' },
              { v: '48h', l: 'Response Time' },
              { v: '98%', l: 'Satisfaction' },
            ].map((s) => (
              <div className="hstat" key={s.l}>
                <div className="hstat-val">{s.v}</div>
                <div className="hstat-lbl">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...Array(2)].map((_, ri) =>
            [
              'Strength Training',
              'HIIT Cardio',
              'Yoga & Flexibility',
              'Bodybuilding',
              'CrossFit',
              'Martial Arts',
              'Dance Fitness',
              'Prenatal Fitness',
              'Sports Nutrition',
              'Fat Loss',
              'Muscle Gain',
              'Functional Fitness',
            ].map((item, i) => (
              <div className="tick-item" key={`${ri}-${i}`}>
                <div className="tick-dot" />
                {item}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="featured-section">
        <div className="section-label">Featured Trainer of the Month</div>
        <div className="featured-card">
          <div className="featured-banner" style={{ background: featured.gradient }}>
            <div className="featured-avatar">{featured.initials}</div>
          </div>
          <div className="featured-body">
            <div>
              <div className="featured-tag">⭐ {featured.badge || 'Featured'} · {featured.sessions} Sessions</div>
              <div className="featured-name">{featured.name}</div>
              <div className="featured-specialty">{featured.specialty}</div>
              <p className="featured-bio">{featured.bio}</p>
              <div className="featured-meta">
                <div className="fmeta">⚡ <span className="fmeta-val">{featured.exp}</span> experience</div>
                <div className="fmeta">💰 <span className="fmeta-val">{featured.price}/hr</span></div>
                <div className="fmeta">📍 <span className="fmeta-val">{featured.location}</span></div>
                <div className="fmeta">★ <span className="fmeta-val">{featured.rating}</span> ({featured.reviews} reviews)</div>
              </div>
            </div>
            <div className="featured-actions">
              <button className="btn-featured-book" onClick={() => openBooking(featured)}>📅 Book Session</button>
              <a className="btn-featured-profile" href={`/trainers/${safeId(featured)}`}>View Full Profile →</a>
            </div>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="controls-top">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search by name, specialty, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                ✕
              </button>
            )}
          </div>
          <div className="controls-right">
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="rating">Sort: Top Rated</option>
              <option value="sessions">Sort: Most Sessions</option>
              <option value="price-low">Sort: Price Low→High</option>
              <option value="price-high">Sort: Price High→Low</option>
            </select>
            <div className="view-toggle">
              <button className={`vbtn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>
                ⊞
              </button>
              <button className={`vbtn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
                ☰
              </button>
            </div>
          </div>
        </div>

        <div className="filter-pills">
          {filters.map((f) => (
            <button
              key={f.id}
              className={`fpill ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.icon} {f.label}
              {f.id === 'all' && <span className="fpill-count">{allTrainers.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="results-bar">
        <div className="results-count">
          Showing <strong>{filtered.length}</strong> trainers{search && ` for "${search}"`}
        </div>
        <a className="btn-mini" href="/bookings">📅 View My Bookings</a>
      </div>

      <main className="main">
        {loading ? (
          <div className="trainers-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skel" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No trainers found</div>
            <div className="empty-sub">Try a different search term or filter</div>
            <button className="btn-reset" onClick={() => { setSearch(''); setFilter('all'); }}>
              Reset Filters
            </button>
          </div>
        ) : view === 'grid' ? (
          <div className="trainers-grid">
            {filtered.map((t: any, i: number) => (
              <div className="trainer-card" key={safeId(t) || i}>
                <div className="card-banner" style={{ background: t.gradient || 'linear-gradient(135deg,#c6f135,#00d4ff)' }}>
                  <div className="card-banner-shimmer" />
                  <div className={`card-avail ${t.available !== false ? 'on' : 'off'}`}>
                    <div className={`avail-dot ${t.available !== false ? 'on' : 'off'}`} />
                    {t.available !== false ? 'Available' : 'Busy'}
                  </div>
                  {t.badge && <div className="card-badge-top">{t.badge}</div>}
                  <div className="card-avatar" style={{ background: t.gradient || 'linear-gradient(135deg,#c6f135,#00d4ff)' }}>
                    {t.initials || t.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="card-body">
                  <div className="card-name">{t.name}</div>
                  <div className="card-specialty">{t.specialty}</div>
                  <p className="card-bio">{t.bio}</p>

                  <div className="card-tags">
                    {(t.cats || t.categories || []).slice(0, 3).map((c: string) => (
                      <span className="ctag" key={c}>
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="card-stats">
                    <div className="cstat">
                      <div className="cstat-val">{t.sessions || 0}</div>
                      <div className="cstat-lbl">Sessions</div>
                    </div>
                    <div className="cstat">
                      <div className="cstat-val">{t.exp || '—'}</div>
                      <div className="cstat-lbl">Experience</div>
                    </div>
                    <div className="cstat">
                      <div className="cstat-val">{t.price || '—'}/hr</div>
                      <div className="cstat-lbl">Rate</div>
                    </div>
                  </div>

                  <div className="card-rating">
                    <span className="rating-stars">{'★'.repeat(Math.max(1, Math.floor(t.rating || 5)))}</span>
                    <span className="rating-num">{t.rating ?? '—'}</span>
                    <span className="rating-cnt">({t.reviews ?? 0} reviews)</span>
                  </div>
                </div>

                <div className="card-footer">
                  <button className="btn-book-card" onClick={() => openBooking(t)} disabled={t.available === false}>
                    {t.available === false ? 'Busy' : 'Book Session'}
                  </button>
                  <a className="btn-profile-card" href={`/trainers/${safeId(t)}`}>
                    Profile →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="trainers-list">
            {filtered.map((t: any, i: number) => (
              <div className="list-card" key={safeId(t) || i}>
                <div className="list-card-banner" style={{ background: t.gradient || 'linear-gradient(135deg,#c6f135,#00d4ff)' }}>
                  <div className="list-avatar">
                    {t.initials || t.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="list-card-body">
                  <div className="list-info">
                    <div className="list-name">{t.name}</div>
                    <div className="list-specialty">{t.specialty}</div>
                    <p className="list-bio">{t.bio}</p>
                    <div className="card-tags" style={{ marginTop: 8 }}>
                      {(t.cats || t.categories || []).slice(0, 4).map((c: string) => (
                        <span className="ctag" key={c}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="list-meta">
                    <div className="list-stat">
                      <div className="list-stat-val">{t.sessions || 0}</div>
                      <div className="list-stat-lbl">Sessions</div>
                    </div>
                    <div className="list-stat">
                      <div className="list-stat-val">{t.rating ?? '—'}★</div>
                      <div className="list-stat-lbl">Rating</div>
                    </div>
                    <div>
                      <div className="list-price">{t.price || '—'}</div>
                      <div className="list-price-lbl">per hour</div>
                    </div>
                  </div>
                </div>

                <div className="list-actions">
                  <button
                    className="btn-book-card"
                    style={{ padding: '10px 20px', borderRadius: 10 }}
                    onClick={() => openBooking(t)}
                    disabled={t.available === false}
                  >
                    {t.available === false ? 'Busy' : 'Book'}
                  </button>
                  <a
                    className="btn-profile-card"
                    href={`/trainers/${safeId(t)}`}
                    style={{ padding: '10px 16px', borderRadius: 10 }}
                  >
                    Profile
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {bookingTrainer && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setBookingTrainer(null); }}>
          <div className="modal">
            <button className="modal-x" onClick={() => setBookingTrainer(null)}>✕</button>

            {bookingSuccess ? (
              <div className="success-box">
                <div className="success-icon">🎉</div>
                <div className="success-title">Booking Created!</div>
                <div className="success-sub">
                  Your booking is saved as <strong>Pending</strong>.
                  <br />
                  Go to <strong>My Bookings</strong> to track status.
                </div>
                <div className="success-actions">
                  <a className="btn-success primary" href="/bookings">📅 My Bookings</a>
                  <button className="btn-success" onClick={() => setBookingTrainer(null)}>Close</button>
                </div>
              </div>
            ) : (
              <>
                <div className="modal-title">Book a Session</div>
                <div className="modal-sub">Complete your booking below</div>

                <div className="modal-trainer-header">
                  <div className="modal-trainer-avatar" style={{ background: bookingTrainer?.gradient || 'linear-gradient(135deg,#c6f135,#00d4ff)' }}>
                    {bookingTrainer?.initials || bookingTrainer?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="modal-trainer-name">{bookingTrainer?.name}</div>
                    <div className="modal-trainer-specialty">
                      {bookingTrainer?.specialty} · {bookingTrainer?.price}/hr
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label>Select Date</label>
                  <input
                    type="date"
                    value={booking.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBooking((b) => ({ ...b, date: e.target.value }))}
                  />
                </div>

                <div className="field">
                  <label>Select Time</label>
                  <div className="time-grid">
                    {['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM'].map((t) => (
                      <button
                        key={t}
                        className={`time-btn ${booking.time === t ? 'selected' : ''}`}
                        onClick={() => setBooking((b) => ({ ...b, time: t }))}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>Session Type</label>
                  <select value={booking.type} onChange={(e) => setBooking((b) => ({ ...b, type: e.target.value }))}>
                    <option>In-Person Session</option>
                    <option>Video Call Session</option>
                    <option>Outdoor Training</option>
                    <option>Home Visit (+$10)</option>
                  </select>
                </div>

                <div className="field">
                  <label>Goals & Notes (optional)</label>
                  <textarea
                    placeholder="What do you want to achieve? Any injuries or limitations?"
                    value={booking.notes}
                    onChange={(e) => setBooking((b) => ({ ...b, notes: e.target.value }))}
                  />
                </div>

                <button className="btn-submit" onClick={submitBooking} disabled={bookingLoading}>
                  {bookingLoading ? '⏳ Confirming...' : `✓ Confirm Booking · ${bookingTrainer?.price}/hr`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}