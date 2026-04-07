'use client';
import { useEffect, useState } from 'react';
import API from '../lib/api';

const mockNutritionists = [
  { id:1, name:'Dr. Ayesha Malik', specialty:'Clinical Nutritionist', bio:'PhD-level expertise in reversing metabolic disorders through targeted dietary therapy. Helped 500+ patients manage diabetes, PCOS, and thyroid disorders using food as medicine.', tags:['Weight Loss','Diabetes','PCOS','Hormonal Health'], rating:5.0, reviews:94, clients:520, price:'$50', priceNum:50, gradient:'linear-gradient(135deg,#c6f135 0%,#00d4ff 100%)', initials:'AM', badge:'PhD', exp:'12 yrs', location:'Lahore', available:true, featured:true },
  { id:2, name:'Omar Farooq', specialty:'Sports & Performance Nutrition', bio:'CISSN-certified sports nutritionist. Works exclusively with competitive athletes on fueling protocols, body composition, and peak performance nutrition timing.', tags:['Athletic Performance','Muscle Gain','Recovery','Hydration'], rating:4.9, reviews:78, clients:200, price:'$55', priceNum:55, gradient:'linear-gradient(135deg,#00d4ff 0%,#8b5cf6 100%)', initials:'OF', badge:'CISSN', exp:'9 yrs', location:'Karachi', available:true, featured:false },
  { id:3, name:'Sara Ahmed', specialty:'Plant-Based & Gut Health', bio:'Registered Dietitian specializing in whole-food plant-based transitions and gut microbiome optimization. Helping clients thrive on plants without nutrient deficiencies.', tags:['Vegan','Gut Health','Anti-Inflammatory','Meal Prep'], rating:4.8, reviews:61, clients:180, price:'$40', priceNum:40, gradient:'linear-gradient(135deg,#8b5cf6 0%,#f43f5e 100%)', initials:'SA', badge:'RD', exp:'7 yrs', location:'Islamabad', available:false, featured:false },
  { id:4, name:'Dr. Hassan Ali', specialty:'Metabolic Health & Longevity', bio:'MD and functional nutrition specialist. Published researcher in metabolic syndrome with expertise in insulin resistance reversal, hormonal optimization, and precision nutrition.', tags:['Keto','Hormones','Fat Loss','Longevity'], rating:4.9, reviews:103, clients:340, price:'$60', priceNum:60, gradient:'linear-gradient(135deg,#f59e0b 0%,#c6f135 100%)', initials:'HA', badge:'MD', exp:'14 yrs', location:'Lahore', available:true, featured:false },
  { id:5, name:'Zara Khan', specialty:'Weight Management & Mindful Eating', bio:'Evidence-based nutritionist breaking the yo-yo dieting cycle permanently. Behavioral nutrition expert helping clients build sustainable relationships with food for lifelong results.', tags:['Weight Loss','Mindful Eating','Behavioral Nutrition','Habit Coaching'], rating:4.8, reviews:55, clients:160, price:'$38', priceNum:38, gradient:'linear-gradient(135deg,#f43f5e 0%,#f59e0b 100%)', initials:'ZK', badge:'RDN', exp:'6 yrs', location:'Peshawar', available:true, featured:false },
  { id:6, name:'Ali Raza', specialty:'Gut & Digestive Health', bio:'Functional nutrition specialist and certified gut health coach. Deep expertise in IBS, IBD, food sensitivities, and the gut-brain connection for total mind-body wellness.', tags:['Gut Health','IBS','Food Sensitivity','Probiotics','Leaky Gut'], rating:4.9, reviews:82, clients:240, price:'$48', priceNum:48, gradient:'linear-gradient(135deg,#00d4ff 0%,#c6f135 100%)', initials:'AR', badge:'CNS', exp:'8 yrs', location:'Lahore', available:true, featured:false },
  { id:7, name:'Dr. Nadia Shah', specialty:'Pediatric & Family Nutrition', bio:'Pediatric dietitian helping families build healthy eating foundations from infancy through adolescence. Allergy-aware meal planning and childhood obesity prevention specialist.', tags:['Pediatrics','Family Nutrition','Allergies','School Lunches'], rating:4.9, reviews:71, clients:290, price:'$45', priceNum:45, gradient:'linear-gradient(135deg,#f43f5e 0%,#8b5cf6 100%)', initials:'NS', badge:'PhD', exp:'10 yrs', location:'Karachi', available:true, featured:false },
  { id:8, name:'Bilal Chaudhry', specialty:'Cancer & Recovery Nutrition', bio:'Oncology nutrition specialist supporting cancer patients and survivors through treatment recovery, immune rebuilding, and evidence-based anti-cancer dietary protocols.', tags:['Oncology','Immune Support','Anti-Cancer Diet','Recovery'], rating:5.0, reviews:44, clients:95, price:'$65', priceNum:65, gradient:'linear-gradient(135deg,#1a1a2e 0%,#00d4ff 100%)', initials:'BC', badge:'MS', exp:'11 yrs', location:'Lahore', available:false, featured:false },
];

const filters = [
  { id:'all', label:'All Specialists', icon:'🌿' },
  { id:'weight', label:'Weight Loss', icon:'⚖️' },
  { id:'sports', label:'Sports Nutrition', icon:'🏆' },
  { id:'gut', label:'Gut Health', icon:'🫁' },
  { id:'keto', label:'Keto / Low Carb', icon:'🥩' },
  { id:'vegan', label:'Plant-Based', icon:'🌱' },
  { id:'clinical', label:'Clinical', icon:'🩺' },
];

export default function Nutritionists() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('rating');
  const [view, setView] = useState<'grid'|'list'>('grid');
  const [bookingItem, setBookingItem] = useState<any>(null);
  const [booking, setBooking] = useState({ date:'', time:'', type:'Video Consultation', notes:'' });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    API.get('/nutritionists').then(r => setApiData(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const allData = apiData.length > 0 ? apiData : mockNutritionists;

  const filtered = allData.filter((n: any) => {
    const matchSearch = n.name?.toLowerCase().includes(search.toLowerCase()) || n.specialty?.toLowerCase().includes(search.toLowerCase()) || (n.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'all' || n.specialty?.toLowerCase().includes(filter) || (n.tags || []).some((t: string) => t.toLowerCase().includes(filter));
    return matchSearch && matchFilter;
  }).sort((a: any, b: any) => {
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sort === 'price-low') return (a.priceNum || 0) - (b.priceNum || 0);
    if (sort === 'price-high') return (b.priceNum || 0) - (a.priceNum || 0);
    if (sort === 'clients') return (b.clients || 0) - (a.clients || 0);
    return 0;
  });

  const submitBooking = async () => {
    if (!booking.date || !booking.time) return alert('Please select date and time');
    setBookingLoading(true);
    try { await API.post('/bookings', { nutritionist: bookingItem?._id || bookingItem?.id, ...booking }); } catch {}
    await new Promise(r => setTimeout(r, 900));
    setBookingSuccess(true);
    setBookingLoading(false);
    setTimeout(() => { setBookingItem(null); setBookingSuccess(false); setBooking({ date:'', time:'', type:'Video Consultation', notes:'' }); }, 2500);
  };

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

        .nav { position:sticky; top:0; z-index:200; height:68px; display:flex; align-items:center; justify-content:space-between; padding:0 48px; background:rgba(3,5,10,0.88); backdrop-filter:blur(28px) saturate(160%); border-bottom:1px solid var(--line); }
        .logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .logo-icon { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,var(--lime),var(--cyan)); display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:900; color:#000; }
        .logo-text { font-size:19px; font-weight:800; letter-spacing:-0.5px; }
        .logo-text em { font-style:normal; color:var(--lime); }
        .nav-links { display:flex; gap:4px; }
        .nav-link { padding:7px 16px; font-size:13px; font-weight:500; color:var(--sub); text-decoration:none; border-radius:8px; transition:all 0.2s; }
        .nav-link:hover { color:var(--text); background:rgba(255,255,255,0.04); }
        .nav-link.cur { color:var(--lime); }
        .nav-right { display:flex; gap:10px; }
        .btn-ghost-nav { padding:9px 18px; font-size:13px; font-weight:600; border-radius:9px; text-decoration:none; background:transparent; color:var(--sub); border:1px solid var(--line); transition:all 0.2s; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-ghost-nav:hover { color:var(--text); border-color:rgba(255,255,255,0.15); }
        .btn-lime-nav { padding:9px 20px; font-size:13px; font-weight:800; border-radius:9px; text-decoration:none; background:var(--lime); color:#000; border:none; transition:all 0.2s; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-lime-nav:hover { background:#d4ff45; box-shadow:0 0 20px rgba(198,241,53,0.35); }

        /* HERO */
        .hero { position:relative; overflow:hidden; padding:80px 48px 0; max-width:1400px; margin:0 auto; }
        .hero-mesh { position:absolute; inset:0; pointer-events:none; background: radial-gradient(ellipse 55% 50% at 10% 60%, rgba(198,241,53,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 55% at 90% 20%, rgba(0,212,255,0.04) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 50% 90%, rgba(139,92,246,0.04) 0%, transparent 60%); }
        .hero-grid { position:absolute; inset:0; pointer-events:none; background-image:radial-gradient(circle, rgba(0,212,255,0.05) 1px, transparent 1px); background-size:48px 48px; mask-image:radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%); }
        .hero-inner { position:relative; z-index:1; }
        .hero-eyebrow { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:100px; background:rgba(198,241,53,0.07); border:1px solid rgba(198,241,53,0.2); font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--lime); margin-bottom:24px; }
        .hero-dot { width:6px; height:6px; border-radius:50%; background:var(--lime); animation:gdot 2s infinite; }
        @keyframes gdot { 0%,100%{box-shadow:0 0 0 0 rgba(198,241,53,0.6)} 50%{box-shadow:0 0 0 7px rgba(198,241,53,0)} }
        .hero-title { font-size:clamp(44px,5.5vw,72px); font-weight:900; letter-spacing:-3px; line-height:0.95; margin-bottom:20px; }
        .hero-title .stroke { -webkit-text-stroke:1.5px rgba(255,255,255,0.2); color:transparent; }
        .hero-title .lime { color:var(--lime); }
        .hero-sub { font-size:17px; color:var(--sub); font-weight:300; line-height:1.7; max-width:560px; margin-bottom:40px; }
        .hero-sub strong { color:var(--text); font-weight:600; }
        .hero-stats { display:flex; gap:0; border:1px solid var(--line); border-radius:16px; overflow:hidden; background:var(--panel); width:fit-content; margin-bottom:0; }
        .hstat { padding:16px 28px; border-right:1px solid var(--line); text-align:center; }
        .hstat:last-child { border-right:none; }
        .hstat-val { font-size:24px; font-weight:900; letter-spacing:-1px; color:var(--lime); line-height:1; margin-bottom:3px; }
        .hstat-lbl { font-size:10px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:var(--sub); }

        /* SPECIALTIES GRID */
        .specs-section { max-width:1400px; margin:56px auto 0; padding:0 48px; }
        .specs-label { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--lime); margin-bottom:20px; display:flex; align-items:center; gap:8px; }
        .specs-label::before { content:''; width:20px; height:1px; background:var(--lime); }
        .specs-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; margin-bottom:0; }
        .spec-pill { display:flex; flex-direction:column; align-items:center; gap:8px; padding:18px 12px; background:var(--panel); border:1px solid var(--line); border-radius:16px; cursor:pointer; transition:all 0.25s; text-decoration:none; }
        .spec-pill:hover { border-color:rgba(198,241,53,0.2); background:rgba(198,241,53,0.04); transform:translateY(-2px); }
        .spec-pill-icon { font-size:24px; }
        .spec-pill-label { font-size:12px; font-weight:600; color:var(--sub); text-align:center; transition:color 0.2s; }
        .spec-pill:hover .spec-pill-label { color:var(--lime); }

        /* TICKER */
        .ticker-wrap { overflow:hidden; border-top:1px solid var(--line); border-bottom:1px solid var(--line); background:rgba(198,241,53,0.02); padding:12px 0; margin-top:48px; }
        .ticker-inner { display:flex; animation:tick 35s linear infinite; width:max-content; }
        @keyframes tick { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .tick-item { display:flex; align-items:center; gap:8px; padding:0 28px; white-space:nowrap; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--sub); }
        .tick-dot { width:4px; height:4px; border-radius:50%; background:var(--lime); }

        /* FEATURED NUTRITIONIST */
        .featured-section { max-width:1400px; margin:48px auto 0; padding:0 48px; }
        .section-label { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--lime); margin-bottom:20px; display:flex; align-items:center; gap:8px; }
        .section-label::before { content:''; width:20px; height:1px; background:var(--lime); }
        .featured-card { background:var(--panel); border:1px solid rgba(198,241,53,0.15); border-radius:24px; overflow:hidden; display:grid; grid-template-columns:300px 1fr; position:relative; }
        .featured-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(198,241,53,0.5),transparent); }
        .featured-banner { position:relative; overflow:hidden; }
        .featured-avatar { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:72px; font-weight:900; color:#000; font-family:'Plus Jakarta Sans',sans-serif; }
        .featured-badge-overlay { position:absolute; top:14px; right:14px; padding:5px 12px; border-radius:100px; background:rgba(0,0,0,0.5); backdrop-filter:blur(8px); font-size:11px; font-weight:800; color:#fff; border:1px solid rgba(255,255,255,0.15); letter-spacing:1px; }
        .featured-body { padding:36px; display:flex; flex-direction:column; justify-content:space-between; }
        .featured-tag { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:100px; background:rgba(198,241,53,0.08); border:1px solid rgba(198,241,53,0.2); font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:var(--lime); margin-bottom:14px; width:fit-content; }
        .featured-name { font-size:30px; font-weight:900; letter-spacing:-1.5px; margin-bottom:4px; }
        .featured-specialty { font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--lime); margin-bottom:12px; }
        .featured-bio { font-size:14px; color:var(--sub); line-height:1.8; font-weight:300; margin-bottom:16px; }
        .featured-tags { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:20px; }
        .ftag { padding:4px 12px; border-radius:100px; font-size:11px; font-weight:600; background:rgba(198,241,53,0.06); color:var(--lime); border:1px solid rgba(198,241,53,0.15); }
        .featured-meta { display:flex; gap:20px; margin-bottom:24px; flex-wrap:wrap; }
        .fmeta { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--sub); }
        .fmeta-val { font-weight:700; color:var(--text); }
        .featured-actions { display:flex; gap:10px; flex-wrap:wrap; }
        .btn-featured-book { padding:13px 28px; background:var(--lime); color:#000; font-size:14px; font-weight:800; border-radius:12px; border:none; cursor:pointer; transition:all 0.25s; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-featured-book:hover { background:#d4ff45; box-shadow:0 0 28px rgba(198,241,53,0.4); transform:translateY(-1px); }
        .btn-featured-profile { padding:13px 24px; background:rgba(255,255,255,0.05); color:var(--text); font-size:14px; font-weight:600; border-radius:12px; border:1px solid var(--line); cursor:pointer; transition:all 0.2s; text-decoration:none; display:inline-flex; align-items:center; gap:8px; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-featured-profile:hover { border-color:rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); }

        /* CONTROLS */
        .controls-section { max-width:1400px; margin:48px auto 0; padding:0 48px; }
        .controls-top { display:flex; gap:14px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
        .search-wrap { position:relative; flex:1; min-width:280px; }
        .search-icon { position:absolute; left:16px; top:50%; transform:translateY(-50%); font-size:16px; pointer-events:none; opacity:0.5; }
        .search-clear { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:rgba(255,255,255,0.06); border:none; border-radius:6px; width:22px; height:22px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--sub); font-size:12px; transition:all 0.2s; }
        .search-clear:hover { color:var(--text); }
        .search-input { width:100%; padding:13px 44px 13px 46px; background:var(--panel); border:1px solid var(--line); border-radius:12px; color:var(--text); font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:all 0.25s; }
        .search-input::placeholder { color:var(--sub); opacity:0.5; }
        .search-input:focus { border-color:rgba(198,241,53,0.35); box-shadow:0 0 0 3px rgba(198,241,53,0.07); }
        .sort-select { padding:12px 16px; background:var(--panel); border:1px solid var(--line); border-radius:10px; color:var(--text); font-size:13px; font-weight:600; font-family:'Plus Jakarta Sans',sans-serif; outline:none; cursor:pointer; }
        .sort-select option { background:var(--panel2); }
        .view-toggle { display:flex; gap:3px; background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:3px; }
        .vbtn { width:36px; height:36px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:15px; transition:all 0.2s; background:transparent; }
        .vbtn.active { background:rgba(198,241,53,0.12); }
        .filter-pills { display:flex; gap:8px; flex-wrap:wrap; padding-bottom:16px; }
        .fpill { display:flex; align-items:center; gap:6px; padding:9px 18px; border-radius:100px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.25s; border:1px solid var(--line); background:transparent; color:var(--sub); font-family:'Plus Jakarta Sans',sans-serif; }
        .fpill:hover { color:var(--text); border-color:rgba(255,255,255,0.15); }
        .fpill.active { background:rgba(198,241,53,0.08); color:var(--lime); border-color:rgba(198,241,53,0.25); }

        /* RESULTS BAR */
        .results-bar { display:flex; justify-content:space-between; align-items:center; padding:0 48px; max-width:1400px; margin:16px auto 20px; }
        .results-count { font-size:13px; color:var(--sub); }
        .results-count strong { color:var(--lime); font-weight:800; }

        /* MAIN GRID */
        .main { max-width:1400px; margin:0 auto; padding:0 48px 80px; }
        .nutr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .nutr-list { display:flex; flex-direction:column; gap:12px; }

        /* CARD */
        .nutr-card { background:var(--panel); border:1px solid var(--line); border-radius:22px; overflow:hidden; transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1); display:flex; flex-direction:column; position:relative; }
        .nutr-card:hover { border-color:rgba(198,241,53,0.22); transform:translateY(-6px) scale(1.01); box-shadow:0 24px 64px rgba(0,0,0,0.5); }
        .nutr-card::after { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(198,241,53,0),transparent); transition:background 0.35s; }
        .nutr-card:hover::after { background:linear-gradient(90deg,transparent,rgba(198,241,53,0.4),transparent); }

        .card-banner { height:110px; position:relative; overflow:hidden; }
        .card-banner-shimmer { position:absolute; inset:0; background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.08) 50%,transparent 60%); background-size:200% 100%; animation:shim 3s ease-in-out infinite; }
        @keyframes shim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .card-badge-top { position:absolute; top:12px; right:12px; padding:4px 10px; border-radius:100px; background:rgba(0,0,0,0.55); backdrop-filter:blur(8px); font-size:10px; font-weight:800; letter-spacing:1px; border:1px solid rgba(255,255,255,0.15); color:#fff; }
        .card-avail { position:absolute; top:12px; left:12px; display:flex; align-items:center; gap:5px; padding:4px 10px; border-radius:100px; font-size:10px; font-weight:700; }
        .card-avail.on { background:rgba(198,241,53,0.12); border:1px solid rgba(198,241,53,0.25); color:var(--lime); }
        .card-avail.off { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:var(--sub); }
        .avail-dot { width:5px; height:5px; border-radius:50%; }
        .avail-dot.on { background:var(--lime); animation:gdot 2s infinite; }
        .avail-dot.off { background:var(--sub); }

        .card-avatar { width:76px; height:76px; border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:30px; font-weight:900; color:#000; font-family:'Plus Jakarta Sans',sans-serif; border:4px solid var(--panel); position:absolute; bottom:-38px; left:24px; z-index:2; box-shadow:0 8px 24px rgba(0,0,0,0.4); transition:transform 0.3s; }
        .nutr-card:hover .card-avatar { transform:scale(1.05); }

        .card-body { padding:50px 24px 20px; flex:1; }
        .card-name { font-size:18px; font-weight:800; letter-spacing:-0.6px; margin-bottom:3px; }
        .card-specialty { font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--lime); margin-bottom:10px; }
        .card-bio { font-size:13px; color:var(--sub); line-height:1.7; font-weight:300; margin-bottom:14px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .card-tags { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:14px; }
        .ctag { padding:3px 9px; border-radius:100px; font-size:10px; font-weight:700; background:rgba(255,255,255,0.04); color:var(--sub); border:1px solid var(--line); }

        /* MACRO BARS — unique to nutritionist cards */
        .macro-bars { margin-bottom:14px; }
        .mbar-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
        .mbar-label { font-size:10px; font-weight:700; color:var(--sub); width:60px; flex-shrink:0; }
        .mbar-track { flex:1; height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; }
        .mbar-fill { height:100%; border-radius:2px; }
        .mbar-val { font-size:10px; font-weight:700; width:28px; text-align:right; flex-shrink:0; }

        .card-stats { display:flex; gap:0; margin-bottom:14px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid var(--line); overflow:hidden; }
        .cstat { flex:1; padding:10px; text-align:center; border-right:1px solid var(--line); }
        .cstat:last-child { border-right:none; }
        .cstat-val { font-size:14px; font-weight:800; letter-spacing:-0.5px; color:var(--text); }
        .cstat-lbl { font-size:10px; color:var(--sub); font-weight:500; }
        .card-rating { display:flex; align-items:center; gap:6px; }
        .rating-stars { color:#fbbf24; font-size:12px; }
        .rating-num { font-size:13px; font-weight:800; }
        .rating-cnt { font-size:11px; color:var(--sub); }

        .card-footer { display:flex; gap:8px; padding:0 24px 24px; }
        .btn-book-card { flex:1; padding:12px; background:var(--lime); color:#000; font-size:13px; font-weight:800; border-radius:11px; border:none; cursor:pointer; transition:all 0.25s; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-book-card:hover { background:#d4ff45; box-shadow:0 0 24px rgba(198,241,53,0.35); transform:translateY(-1px); }
        .btn-profile-card { padding:12px 16px; background:rgba(255,255,255,0.04); color:var(--text); font-size:13px; font-weight:600; border-radius:11px; border:1px solid var(--line); cursor:pointer; transition:all 0.2s; text-decoration:none; display:inline-flex; align-items:center; gap:5px; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-profile-card:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); }

        /* LIST VIEW */
        .list-card { background:var(--panel); border:1px solid var(--line); border-radius:18px; overflow:hidden; transition:all 0.3s; display:flex; align-items:stretch; }
        .list-card:hover { border-color:rgba(198,241,53,0.18); box-shadow:0 12px 40px rgba(0,0,0,0.4); }
        .list-banner { width:110px; flex-shrink:0; position:relative; }
        .list-avatar { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:38px; font-weight:900; color:#000; font-family:'Plus Jakarta Sans',sans-serif; }
        .list-body { flex:1; padding:20px 24px; display:flex; align-items:center; gap:24px; }
        .list-info { flex:1; min-width:0; }
        .list-name { font-size:17px; font-weight:800; letter-spacing:-0.5px; margin-bottom:3px; }
        .list-specialty { font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--lime); margin-bottom:6px; }
        .list-bio { font-size:13px; color:var(--sub); display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
        .list-meta { display:flex; gap:16px; align-items:center; flex-shrink:0; }
        .list-stat-val { font-size:16px; font-weight:800; letter-spacing:-0.5px; color:var(--lime); }
        .list-stat-lbl { font-size:10px; color:var(--sub); }
        .list-price { font-size:18px; font-weight:900; letter-spacing:-1px; color:var(--lime); }
        .list-actions { display:flex; flex-direction:column; gap:8px; padding:20px; flex-shrink:0; justify-content:center; }

        /* EMPTY */
        .empty { text-align:center; padding:100px 20px; }
        .empty-icon { font-size:56px; margin-bottom:16px; }
        .empty-title { font-size:22px; font-weight:800; letter-spacing:-0.8px; margin-bottom:8px; }
        .empty-sub { font-size:14px; color:var(--sub); }
        .btn-reset { margin-top:20px; padding:11px 24px; background:var(--lime); color:#000; font-size:13px; font-weight:800; border-radius:10px; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }

        /* SKELETON */
        .skel { background:linear-gradient(90deg,var(--panel) 25%,var(--panel2) 50%,var(--panel) 75%); background-size:200% 100%; animation:sk 1.4s ease-in-out infinite; border-radius:22px; height:380px; }
        @keyframes sk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* MODAL */
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.88); backdrop-filter:blur(14px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; animation:fadein 0.2s ease; }
        @keyframes fadein { from{opacity:0} to{opacity:1} }
        .modal { background:var(--panel); border:1px solid rgba(0,212,255,0.1); border-radius:26px; padding:40px; width:100%; max-width:500px; position:relative; animation:slidein 0.3s cubic-bezier(0.34,1.56,0.64,1); max-height:90vh; overflow-y:auto; }
        @keyframes slidein { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .modal::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(198,241,53,0.5),transparent); border-radius:26px 26px 0 0; }
        .modal-x { position:absolute; top:18px; right:18px; width:34px; height:34px; border-radius:9px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); color:var(--sub); cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
        .modal-x:hover { color:var(--text); }
        .modal-nutr-header { display:flex; align-items:center; gap:14px; padding:14px 18px; background:rgba(255,255,255,0.03); border:1px solid var(--line); border-radius:14px; margin-bottom:28px; }
        .modal-nutr-avatar { width:50px; height:50px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900; color:#000; font-family:'Plus Jakarta Sans',sans-serif; flex-shrink:0; }
        .modal-nutr-name { font-size:15px; font-weight:700; margin-bottom:2px; }
        .modal-nutr-specialty { font-size:12px; color:var(--lime); font-weight:600; }
        .modal-title { font-size:24px; font-weight:800; letter-spacing:-1px; margin-bottom:4px; }
        .modal-sub { font-size:14px; color:var(--sub); margin-bottom:0; font-weight:300; }
        .field { margin-bottom:16px; }
        .field label { display:block; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--sub); margin-bottom:8px; }
        .field input, .field select, .field textarea { width:100%; padding:13px 16px; background:var(--panel2); border:1px solid var(--line); border-radius:11px; color:var(--text); font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:all 0.2s; }
        .field input:focus, .field select:focus, .field textarea:focus { border-color:rgba(198,241,53,0.35); box-shadow:0 0 0 3px rgba(198,241,53,0.06); }
        .field select option { background:var(--panel2); }
        .field textarea { resize:vertical; min-height:90px; }
        .time-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .time-btn { padding:10px; border-radius:9px; background:rgba(255,255,255,0.03); border:1px solid var(--line); color:var(--sub); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; text-align:center; }
        .time-btn:hover { border-color:rgba(198,241,53,0.2); color:var(--text); }
        .time-btn.selected { background:rgba(198,241,53,0.1); border-color:rgba(198,241,53,0.3); color:var(--lime); }
        .btn-submit { width:100%; padding:15px; background:var(--lime); color:#000; font-size:15px; font-weight:800; border-radius:12px; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.25s; margin-top:8px; }
        .btn-submit:hover:not(:disabled) { background:#d4ff45; box-shadow:0 0 32px rgba(198,241,53,0.4); transform:translateY(-1px); }
        .btn-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .success-box { text-align:center; padding:28px 0; }
        .success-icon { font-size:56px; margin-bottom:14px; }
        .success-title { font-size:24px; font-weight:800; letter-spacing:-1px; margin-bottom:8px; }
        .success-sub { font-size:14px; color:var(--sub); font-weight:300; line-height:1.6; }

        @media(max-width:1100px) { .nutr-grid { grid-template-columns:repeat(2,1fr); } .featured-card { grid-template-columns:1fr; } .featured-banner { height:200px; } .specs-grid { grid-template-columns:repeat(3,1fr); } }
        @media(max-width:900px) { .hero,.controls-section,.main,.featured-section,.specs-section { padding-left:20px; padding-right:20px; } .nav { padding:0 20px; } .results-bar { padding:0 20px; } .nav-links { display:none; } }
        @media(max-width:640px) { .nutr-grid { grid-template-columns:1fr; } .specs-grid { grid-template-columns:repeat(2,1fr); } }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <a className="logo" href="/">
          <div className="logo-icon">U</div>
          <span className="logo-text"><em>Urban</em>Well</span>
        </a>
        <div className="nav-links">
          {[['Trainers','/trainers'],['Nutritionists','/nutritionists','cur'],['Gyms','/gym-packages'],['Meals','/meals']].map(([l,h,c]) => (
            <a key={l} className={`nav-link ${c||''}`} href={h}>{l}</a>
          ))}
        </div>
        <div className="nav-right">
          <a className="btn-ghost-nav" href="/dashboard">Dashboard</a>
          <a className="btn-lime-nav" href="/signup">Get Started</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-mesh" /><div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-eyebrow"><span className="hero-dot" />Nutrition Expert Network</div>
          <h1 className="hero-title">
            Eat smarter,<br />
            <span className="lime">live better,</span> <span className="stroke">feel it.</span>
          </h1>
          <p className="hero-sub">
            Work with <strong>300+ certified dietitians and nutrition specialists</strong>. Get a personalized plan built around your biology, goals, and lifestyle.
          </p>
          <div className="hero-stats">
            {[{v:'300+',l:'Certified Experts'},{v:'8K+',l:'Plans Created'},{v:'4.9★',l:'Avg Rating'},{v:'24h',l:'Response Time'},{v:'92%',l:'Goal Achievement'}].map(s => (
              <div className="hstat" key={s.l}><div className="hstat-val">{s.v}</div><div className="hstat-lbl">{s.l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIALTIES GRID */}
      <div className="specs-section" style={{ marginTop:48 }}>
        <div className="specs-label">Browse by Specialty</div>
        <div className="specs-grid">
          {[
            { icon:'⚖️', label:'Weight Loss' },
            { icon:'🏆', label:'Sports Nutrition' },
            { icon:'🌱', label:'Plant-Based' },
            { icon:'🩺', label:'Clinical Nutrition' },
            { icon:'🫁', label:'Gut Health' },
            { icon:'🧬', label:'Metabolic Health' },
          ].map(s => (
            <div className="spec-pill" key={s.label} onClick={() => { setFilter(s.label.toLowerCase().split(' ')[0]); }}>
              <div className="spec-pill-icon">{s.icon}</div>
              <div className="spec-pill-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...Array(2)].map((_,ri) => (
            ['Weight Loss','Sports Nutrition','Gut Microbiome','Keto Diet','Vegan Nutrition','Clinical Dietetics','Metabolic Health','Anti-Inflammatory','Hormonal Balance','Pediatric Nutrition','Cancer Recovery','Mindful Eating'].map((item,i) => (
              <div className="tick-item" key={`${ri}-${i}`}><div className="tick-dot"/>{item}</div>
            ))
          ))}
        </div>
      </div>

      {/* FEATURED */}
      <div className="featured-section">
        <div className="section-label">Featured Nutritionist of the Month</div>
        <div className="featured-card">
          <div className="featured-banner" style={{ background:'linear-gradient(135deg,#c6f135,#00d4ff)' }}>
            <div className="featured-avatar">AM</div>
            <div className="featured-badge-overlay">PhD</div>
          </div>
          <div className="featured-body">
            <div>
              <div className="featured-tag">⭐ Top Rated · 520 Clients Helped</div>
              <div className="featured-name">Dr. Ayesha Malik</div>
              <div className="featured-specialty">Clinical Nutritionist · PhD</div>
              <p className="featured-bio">PhD-level expertise in reversing metabolic disorders through targeted dietary therapy. Helped 500+ patients manage diabetes, PCOS, and thyroid disorders using food as medicine — no fad diets, only evidence.</p>
              <div className="featured-tags">
                {['Weight Loss','Diabetes','PCOS','Hormonal Health','Clinical Nutrition'].map(t => <span className="ftag" key={t}>{t}</span>)}
              </div>
              <div className="featured-meta">
                <div className="fmeta">⚡ <span className="fmeta-val">12+ years</span> experience</div>
                <div className="fmeta">💰 <span className="fmeta-val">$50/hr</span></div>
                <div className="fmeta">📍 <span className="fmeta-val">Lahore, PK</span></div>
                <div className="fmeta">★ <span className="fmeta-val">5.0</span> (94 reviews)</div>
              </div>
            </div>
            <div className="featured-actions">
              <button className="btn-featured-book" onClick={() => setBookingItem(mockNutritionists[0])}>📅 Book Consultation</button>
              <a className="btn-featured-profile" href="/nutritionists/1">View Full Profile →</a>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="controls-section">
        <div className="controls-top">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by name, specialty, or health goal..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="rating">Sort: Top Rated</option>
              <option value="clients">Sort: Most Clients</option>
              <option value="price-low">Sort: Price Low→High</option>
              <option value="price-high">Sort: Price High→Low</option>
            </select>
            <div className="view-toggle">
              <button className={`vbtn ${view==='grid'?'active':''}`} onClick={() => setView('grid')}>⊞</button>
              <button className={`vbtn ${view==='list'?'active':''}`} onClick={() => setView('list')}>☰</button>
            </div>
          </div>
        </div>
        <div className="filter-pills">
          {filters.map(f => (
            <button key={f.id} className={`fpill ${filter===f.id?'active':''}`} onClick={() => setFilter(f.id)}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS BAR */}
      <div className="results-bar">
        <div className="results-count">Showing <strong>{filtered.length}</strong> specialists{search && ` for "${search}"`}</div>
      </div>

      {/* GRID */}
      <main className="main">
        {loading ? (
          <div className="nutr-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="skel" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🌿</div>
            <div className="empty-title">No specialists found</div>
            <div className="empty-sub">Try a different search or filter</div>
            <button className="btn-reset" onClick={() => { setSearch(''); setFilter('all'); }}>Reset Filters</button>
          </div>
        ) : view === 'grid' ? (
          <div className="nutr-grid">
            {filtered.map((n: any, i: number) => {
              const macroColors = ['#c6f135','#00d4ff','#8b5cf6'];
              const macros = [{ l:'Protein', pct:85 }, { l:'Carbs', pct:72 }, { l:'Fat', pct:60 }];
              return (
                <div className="nutr-card" key={n.id || i}>
                  <div className="card-banner" style={{ background: n.gradient || 'linear-gradient(135deg,#c6f135,#00d4ff)' }}>
                    <div className="card-banner-shimmer" />
                    <div className={`card-avail ${n.available !== false ? 'on' : 'off'}`}>
                      <div className={`avail-dot ${n.available !== false ? 'on' : 'off'}`} />
                      {n.available !== false ? 'Available' : 'Busy'}
                    </div>
                    {n.badge && <div className="card-badge-top">{n.badge}</div>}
                    <div className="card-avatar" style={{ background: n.gradient || 'linear-gradient(135deg,#c6f135,#00d4ff)' }}>
                      {n.initials || n.name?.[0]}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="card-name">{n.name}</div>
                    <div className="card-specialty">{n.specialty}</div>
                    <p className="card-bio">{n.bio}</p>
                    <div className="card-tags">
                      {(n.tags || []).slice(0,3).map((t: string) => <span className="ctag" key={t}>{t}</span>)}
                    </div>
                    <div className="macro-bars">
                      {macros.map((m, mi) => (
                        <div className="mbar-row" key={m.l}>
                          <div className="mbar-label">{m.l}</div>
                          <div className="mbar-track"><div className="mbar-fill" style={{ width:`${m.pct}%`, background:macroColors[mi] }} /></div>
                          <div className="mbar-val" style={{ color:macroColors[mi] }}>{m.pct}%</div>
                        </div>
                      ))}
                    </div>
                    <div className="card-stats">
                      <div className="cstat"><div className="cstat-val">{n.clients}</div><div className="cstat-lbl">Clients</div></div>
                      <div className="cstat"><div className="cstat-val">{n.exp}</div><div className="cstat-lbl">Experience</div></div>
                      <div className="cstat"><div className="cstat-val">{n.price}/hr</div><div className="cstat-lbl">Rate</div></div>
                    </div>
                    <div className="card-rating">
                      <span className="rating-stars">{'★'.repeat(Math.floor(n.rating || 5))}</span>
                      <span className="rating-num">{n.rating}</span>
                      <span className="rating-cnt">({n.reviews} reviews)</span>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button className="btn-book-card" onClick={() => setBookingItem(n)}>Book Consultation</button>
                    <a className="btn-profile-card" href={`/nutritionists/${n._id || n.id}`}>Profile →</a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="nutr-list">
            {filtered.map((n: any, i: number) => (
              <div className="list-card" key={n.id || i}>
                <div className="list-banner" style={{ background: n.gradient, minHeight:120, width:110, position:'relative' }}>
                  <div className="list-avatar">{n.initials || n.name?.[0]}</div>
                </div>
                <div className="list-body">
                  <div className="list-info">
                    <div className="list-name">{n.name}</div>
                    <div className="list-specialty">{n.specialty}</div>
                    <p className="list-bio">{n.bio}</p>
                    <div className="card-tags" style={{ marginTop:8 }}>
                      {(n.tags || []).slice(0,4).map((t: string) => <span className="ctag" key={t}>{t}</span>)}
                    </div>
                  </div>
                  <div className="list-meta">
                    <div><div className="list-stat-val">{n.clients}</div><div className="list-stat-lbl">Clients</div></div>
                    <div><div className="list-stat-val">{n.rating}★</div><div className="list-stat-lbl">Rating</div></div>
                    <div><div className="list-price">{n.price}</div><div className="list-stat-lbl">per hour</div></div>
                  </div>
                </div>
                <div className="list-actions">
                  <button className="btn-book-card" style={{ padding:'10px 20px', borderRadius:10 }} onClick={() => setBookingItem(n)}>Book</button>
                  <a className="btn-profile-card" href={`/nutritionists/${n._id || n.id}`} style={{ padding:'10px 16px', borderRadius:10, justifyContent:'center' }}>Profile</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL */}
      {bookingItem && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setBookingItem(null); }}>
          <div className="modal">
            <button className="modal-x" onClick={() => setBookingItem(null)}>✕</button>
            {bookingSuccess ? (
              <div className="success-box">
                <div className="success-icon">🎉</div>
                <div className="success-title">Consultation Booked!</div>
                <div className="success-sub">Your session with <strong>{bookingItem?.name}</strong> is confirmed.<br />Check your email for details.</div>
              </div>
            ) : (
              <>
                <div className="modal-title">Book Consultation</div>
                <div className="modal-sub" style={{ marginBottom:20 }}>Schedule your nutrition session</div>
                <div className="modal-nutr-header">
                  <div className="modal-nutr-avatar" style={{ background: bookingItem?.gradient }}>{bookingItem?.initials || bookingItem?.name?.[0]}</div>
                  <div>
                    <div className="modal-nutr-name">{bookingItem?.name} {bookingItem?.badge && <span style={{ fontSize:11, color:'var(--lime)', fontWeight:800, marginLeft:4 }}>{bookingItem.badge}</span>}</div>
                    <div className="modal-nutr-specialty">{bookingItem?.specialty} · {bookingItem?.price}/hr</div>
                  </div>
                </div>
                <div className="field">
                  <label>Select Date</label>
                  <input type="date" value={booking.date} min={new Date().toISOString().split('T')[0]} onChange={e => setBooking(b => ({ ...b, date:e.target.value }))} />
                </div>
                <div className="field">
                  <label>Select Time</label>
                  <div className="time-grid">
                    {['10:00 AM','11:00 AM','12:00 PM','02:00 PM','04:00 PM','06:00 PM'].map(t => (
                      <button key={t} className={`time-btn ${booking.time===t?'selected':''}`} onClick={() => setBooking(b => ({ ...b, time:t }))}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Consultation Type</label>
                  <select value={booking.type} onChange={e => setBooking(b => ({ ...b, type:e.target.value }))}>
                    <option>Video Consultation</option>
                    <option>In-Person Visit</option>
                    <option>Phone Call</option>
                  </select>
                </div>
                <div className="field">
                  <label>Health Goals & Background</label>
                  <textarea placeholder="What are your main health goals? Any medical conditions, allergies, or dietary restrictions?" value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes:e.target.value }))} />
                </div>
                <button className="btn-submit" onClick={submitBooking} disabled={bookingLoading}>
                  {bookingLoading ? '⏳ Confirming...' : `✓ Confirm Consultation · ${bookingItem?.price}/hr`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}