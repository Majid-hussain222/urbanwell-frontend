'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

/* ─── CATEGORIES ─────────────────────────────────────────── */
const CATEGORIES = [
  { key:'All',           label:'All',            emoji:'📚', color:'#c6f135', bg:'rgba(198,241,53,0.08)',  border:'rgba(198,241,53,0.2)'  },
  { key:'Nutrition',     label:'Nutrition',       emoji:'🥗', color:'#34d399', bg:'rgba(52,211,153,0.08)', border:'rgba(52,211,153,0.2)'  },
  { key:'Training',      label:'Training',        emoji:'🏋️', color:'#00d4ff', bg:'rgba(0,212,255,0.08)',  border:'rgba(0,212,255,0.2)'   },
  { key:'Recovery',      label:'Recovery',        emoji:'🧘', color:'#a78bfa', bg:'rgba(167,139,250,0.08)',border:'rgba(167,139,250,0.2)' },
  { key:'Mental Health', label:'Mental Health',   emoji:'🧠', color:'#f472b6', bg:'rgba(244,114,182,0.08)',border:'rgba(244,114,182,0.2)' },
  { key:'Weight Loss',   label:'Weight Loss',     emoji:'🔥', color:'#fb7185', bg:'rgba(251,113,133,0.08)',border:'rgba(251,113,133,0.2)' },
  { key:'Supplements',   label:'Supplements',     emoji:'💊', color:'#fbbf24', bg:'rgba(251,191,36,0.08)', border:'rgba(251,191,36,0.2)'  },
  { key:'Lifestyle',     label:'Lifestyle',       emoji:'✨', color:'#fb923c', bg:'rgba(251,146,60,0.08)', border:'rgba(251,146,60,0.2)'  },
];

/* ─── DEMO ARTICLES ──────────────────────────────────────── */
const DEMO_ARTICLES = [
  /* FEATURED */
  {
    _id:'a1', featured:true,
    title:'The Science of Progressive Overload: Why Your Muscles Need More Every Week',
    excerpt:'Progressive overload is the single most important principle in strength training. Without it, your muscles adapt and growth stalls. Here\'s the complete science-backed guide.',
    category:'Training', readTime:8, views:12400, likes:847,
    author:{name:'Dr. Bilal Akhtar', role:'Sports Scientist', avatar:'BA'},
    publishedAt:'2026-02-18',
    tags:['Strength','Hypertrophy','Beginner','Science'],
    content: `Progressive overload means consistently increasing the stress placed on your muscles during training. This can be done by adding weight, increasing reps, reducing rest time, or improving form.

Your muscles are survival machines. They only grow when forced to. Every time you lift the same weight for the same reps, your body says "I've got this handled" — and stops adapting.

**The 3 Core Methods:**
1. **Load progression** — Add 2.5–5kg when you can complete all sets with good form
2. **Volume progression** — Add 1–2 reps per set before increasing weight  
3. **Density progression** — Complete the same work in less time

Research shows that 1–3% weekly load increases produce optimal hypertrophy without overtraining. Track every session. Your future self will thank you.`,
  },
  {
    _id:'a2', featured:true,
    title:'Intermittent Fasting: What 10 Years of Research Actually Says',
    excerpt:'Beyond the hype and headlines, here\'s a clear-eyed look at what intermittent fasting does and doesn\'t do, backed by the latest meta-analyses.',
    category:'Nutrition', readTime:12, views:9800, likes:634,
    author:{name:'Dr. Sara Malik', role:'Nutritionist & Dietitian', avatar:'SM'},
    publishedAt:'2026-02-15',
    tags:['IF','Fasting','Weight Loss','Hormones'],
    content:'Intermittent fasting (IF) has been studied extensively. The evidence is nuanced...',
  },
  /* NUTRITION */
  {
    _id:'a3', featured:false,
    title:'Protein Timing: Does It Actually Matter When You Eat Protein?',
    excerpt:'The "anabolic window" myth has been debunked. But protein timing still matters — just not in the way most people think.',
    category:'Nutrition', readTime:6, views:7200, likes:412,
    author:{name:'Dr. Ayesha Khan', role:'Sports Nutritionist', avatar:'AK'},
    publishedAt:'2026-02-12',
    tags:['Protein','Muscle','Recovery','Timing'],
    content:'For decades, gym culture promoted the "anabolic window" — a 30-minute post-workout period where you must consume protein or your gains disappear...',
  },
  {
    _id:'a4', featured:false,
    title:'Creatine: The Most Researched Supplement in History',
    excerpt:'Over 500 peer-reviewed studies. Safe for kidneys. Effective for strength. Here\'s everything you need to know about creatine monohydrate.',
    category:'Supplements', readTime:7, views:15600, likes:1203,
    author:{name:'Dr. Hamid Raza', role:'Exercise Physiologist', avatar:'HR'},
    publishedAt:'2026-02-10',
    tags:['Creatine','Supplements','Strength','Evidence'],
    content:'Creatine monohydrate is the most studied sports supplement in history with over 500 peer-reviewed trials...',
  },
  {
    _id:'a5', featured:false,
    title:'The Complete Guide to Eating for Fat Loss Without Losing Muscle',
    excerpt:'Body recomposition is possible. Here\'s the macros, the meal timing, and the mindset you need to lose fat and keep every gram of hard-earned muscle.',
    category:'Weight Loss', readTime:10, views:18900, likes:1560,
    author:{name:'Dr. Sara Malik', role:'Nutritionist & Dietitian', avatar:'SM'},
    publishedAt:'2026-02-08',
    tags:['Fat Loss','Muscle','Macros','Diet'],
    content:'The fear of losing muscle during a cut is real — and valid. Here\'s how to structure your nutrition to avoid it...',
  },
  {
    _id:'a6', featured:false,
    title:'Why You\'re Not Losing Weight (Even in a Caloric Deficit)',
    excerpt:'Adaptive thermogenesis, water retention, hidden calories — the real reasons the scale isn\'t moving despite doing everything "right".',
    category:'Weight Loss', readTime:9, views:22100, likes:1890,
    author:{name:'Dr. Imran Qureshi', role:'Metabolic Specialist', avatar:'IQ'},
    publishedAt:'2026-02-05',
    tags:['Weight Loss','Metabolism','Plateau','Calories'],
    content:'You\'re eating in a deficit. You\'re exercising. But the scale won\'t budge. This is one of the most frustrating experiences in fitness...',
  },
  /* TRAINING */
  {
    _id:'a7', featured:false,
    title:'The 5 Best Compound Lifts and Why They Build the Most Muscle',
    excerpt:'Squats, deadlifts, bench press, rows, and overhead press. Here\'s the biomechanics, the programming, and the form cues for each.',
    category:'Training', readTime:11, views:14300, likes:987,
    author:{name:'Dr. Bilal Akhtar', role:'Sports Scientist', avatar:'BA'},
    publishedAt:'2026-02-03',
    tags:['Compound','Strength','Beginner','Form'],
    content:'Compound movements recruit multiple muscle groups simultaneously, creating the most anabolic hormonal response...',
  },
  {
    _id:'a8', featured:false,
    title:'Cardio vs Weights: Which Burns More Fat Long-Term?',
    excerpt:'The answer isn\'t what most people expect. We break down EPOC, muscle\'s metabolic cost, and why the combination matters.',
    category:'Training', readTime:7, views:19400, likes:1340,
    author:{name:'Dr. Farida Noor', role:'Athletic Performance Coach', avatar:'FN'},
    publishedAt:'2026-01-30',
    tags:['Cardio','Fat Loss','HIIT','Weights'],
    content:'The age-old debate: cardio or weights for fat loss. The science says both — but the mechanism matters...',
  },
  {
    _id:'a9', featured:false,
    title:'How to Build a Training Program From Scratch (The Right Way)',
    excerpt:'Volume, frequency, intensity, exercise selection — the foundational principles that turn random workouts into a real program.',
    category:'Training', readTime:14, views:11200, likes:876,
    author:{name:'Dr. Bilal Akhtar', role:'Sports Scientist', avatar:'BA'},
    publishedAt:'2026-01-27',
    tags:['Programming','Beginner','Intermediate','Periodization'],
    content:'Most people don\'t follow a program. They follow a vibe. They go to the gym, do the machines they like, and wonder why they\'re not progressing...',
  },
  /* RECOVERY */
  {
    _id:'a10', featured:false,
    title:'Sleep and Muscle Growth: Why 8 Hours is Non-Negotiable',
    excerpt:'GH is released during deep sleep. Testosterone peaks overnight. Cortisol spikes with sleep deprivation. The physiology of rest and why skimping destroys gains.',
    category:'Recovery', readTime:8, views:13700, likes:1102,
    author:{name:'Dr. Zainab Ali', role:'Sports Medicine Physician', avatar:'ZA'},
    publishedAt:'2026-01-24',
    tags:['Sleep','Recovery','Hormones','Muscle'],
    content:'During deep sleep (stages 3 & 4), your pituitary gland releases growth hormone in pulses. This is when muscle repair happens...',
  },
  {
    _id:'a11', featured:false,
    title:'Active Recovery vs Complete Rest: Which is Better After Training?',
    excerpt:'Light movement, foam rolling, cold exposure — what does the research say about optimizing recovery between sessions?',
    category:'Recovery', readTime:6, views:8900, likes:623,
    author:{name:'Dr. Omar Shaikh', role:'Functional Medicine', avatar:'OS'},
    publishedAt:'2026-01-21',
    tags:['Recovery','Rest','Foam Rolling','Cold'],
    content:'Active recovery — light movement on rest days — has been shown to improve blood flow and reduce DOMS faster than complete rest...',
  },
  {
    _id:'a12', featured:false,
    title:'The Complete Guide to Managing DOMS (Delayed Onset Muscle Soreness)',
    excerpt:'DOMS isn\'t a sign of a good workout. Here\'s what causes it, how long it lasts, and evidence-backed ways to reduce it.',
    category:'Recovery', readTime:5, views:16800, likes:1230,
    author:{name:'Dr. Zainab Ali', role:'Sports Medicine Physician', avatar:'ZA'},
    publishedAt:'2026-01-18',
    tags:['DOMS','Soreness','Recovery','Beginners'],
    content:'Delayed onset muscle soreness peaks 24–72 hours after training and is caused by micro-tears in muscle fibers and the resulting inflammatory response...',
  },
  /* MENTAL HEALTH */
  {
    _id:'a13', featured:false,
    title:'Exercise as Antidepressant: What the Neuroscience Shows',
    excerpt:'BDNF, serotonin, endorphins — exercise changes brain chemistry in measurable ways. A deep dive into the mental health benefits of movement.',
    category:'Mental Health', readTime:9, views:20400, likes:1780,
    author:{name:'Dr. Nadia Hussain', role:'Clinical Psychologist', avatar:'NH'},
    publishedAt:'2026-01-15',
    tags:['Mental Health','Depression','Anxiety','Neuroscience'],
    content:'A landmark Harvard study found that 35 minutes of exercise per day reduced depression risk by 26%...',
  },
  {
    _id:'a14', featured:false,
    title:'Gym Anxiety is Real. Here\'s How to Overcome It.',
    excerpt:'40% of beginners report avoiding the gym due to anxiety. Practical, evidence-based strategies to feel comfortable in any gym environment.',
    category:'Mental Health', readTime:6, views:25600, likes:2340,
    author:{name:'Dr. Nadia Hussain', role:'Clinical Psychologist', avatar:'NH'},
    publishedAt:'2026-01-12',
    tags:['Anxiety','Beginners','Mindset','Confidence'],
    content:'Gym anxiety — or "gymtimidation" — is an extremely common experience, especially for beginners. You\'re not alone and it\'s not weakness...',
  },
  /* LIFESTYLE */
  {
    _id:'a15', featured:false,
    title:'10,000 Steps: The Myth and the Reality',
    excerpt:'Where did 10,000 steps come from? A Japanese pedometer marketing campaign. Here\'s what research actually says about daily steps and health.',
    category:'Lifestyle', readTime:5, views:31200, likes:2560,
    author:{name:'Dr. Kamran Saleem', role:'Preventive Medicine', avatar:'KS'},
    publishedAt:'2026-01-09',
    tags:['Walking','Steps','Cardio','Lifestyle'],
    content:'The 10,000 steps goal traces back to a 1965 Japanese marketing campaign for a pedometer called "Manpo-kei" — which literally means "10,000 steps meter"...',
  },
  {
    _id:'a16', featured:false,
    title:'Dehydration and Athletic Performance: Even 2% Matters',
    excerpt:'A 2% drop in body water reduces strength by 10% and endurance by 20%. Here\'s how to stay optimally hydrated for training and recovery.',
    category:'Lifestyle', readTime:6, views:9800, likes:712,
    author:{name:'Dr. Farida Noor', role:'Athletic Performance Coach', avatar:'FN'},
    publishedAt:'2026-01-06',
    tags:['Hydration','Performance','Water','Electrolytes'],
    content:'Dehydration is one of the most underrated performance limiters. Studies show that as little as 2% dehydration impairs both physical and cognitive performance...',
  },
  {
    _id:'a17', featured:false,
    title:'How to Stay Consistent at the Gym (When Motivation Fails)',
    excerpt:'Motivation is unreliable. Systems and habits aren\'t. The psychology of consistency, identity-based habits, and how to never miss twice.',
    category:'Lifestyle', readTime:7, views:28700, likes:2180,
    author:{name:'Dr. Nadia Hussain', role:'Clinical Psychologist', avatar:'NH'},
    publishedAt:'2026-01-03',
    tags:['Habits','Consistency','Motivation','Psychology'],
    content:'The problem with relying on motivation is that motivation is an emotion — and emotions are temporary. Systems, on the other hand, are reliable...',
  },
  /* SUPPLEMENTS */
  {
    _id:'a18', featured:false,
    title:'Whey vs Plant Protein: Which is Better for Muscle Building?',
    excerpt:'Leucine content, absorption rate, amino acid profile — a head-to-head comparison of the two most popular protein supplements.',
    category:'Supplements', readTime:8, views:17300, likes:1340,
    author:{name:'Dr. Ayesha Khan', role:'Sports Nutritionist', avatar:'AK'},
    publishedAt:'2025-12-30',
    tags:['Protein','Whey','Vegan','Supplements'],
    content:'Whey protein has long been considered the gold standard. But plant proteins have come a long way — especially pea protein isolate...',
  },
  {
    _id:'a19', featured:false,
    title:'Caffeine: The Legal Performance-Enhancing Drug You\'re Not Using Correctly',
    excerpt:'Timing, dosage, tolerance cycling, and the stacking strategies used by elite athletes. The complete guide to caffeine for performance.',
    category:'Supplements', readTime:7, views:21500, likes:1670,
    author:{name:'Dr. Hamid Raza', role:'Exercise Physiologist', avatar:'HR'},
    publishedAt:'2025-12-27',
    tags:['Caffeine','Performance','Pre-workout','Science'],
    content:'Caffeine is the most widely consumed psychoactive substance in the world and one of the most evidence-backed ergogenic aids in sports science...',
  },
];

const catMap: any = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  if (days < 30) return `${Math.floor(days/7)} weeks ago`;
  return `${Math.floor(days/30)} months ago`;
}

function initials(name: string) {
  return name.split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0,2);
}

/* ══════════════════════════════════════════════════════════ */
export default function ArticlesPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>(DEMO_ARTICLES);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [category, setCategory] = useState('All');
  const [search,   setSearch]   = useState('');
  const [sort,     setSort]     = useState<'latest'|'popular'|'trending'>('latest');
  const [reading,  setReading]  = useState<any>(null);
  const [liked,    setLiked]    = useState<Set<string>>(new Set());
  const [saved,    setSaved]    = useState<Set<string>>(new Set());
  const [readProgress, setReadProgress] = useState(0);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/profile');
        setUser(data?.data || data);
      } catch { router.push('/login'); return; }
      try {
        const { data } = await API.get('/articles?limit=100');
        const raw = data?.data || data?.articles || [];
        if (Array.isArray(raw) && raw.length > 0) setArticles(raw);
      } catch {}
      setLoading(false);
    })();
  }, []);

  /* Filter + sort */
  useEffect(() => {
    let r = [...articles];
    if (category !== 'All') r = r.filter(a => a.category === category);
    if (search.trim()) r = r.filter(a =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
      a.tags?.some((t:string) => t.toLowerCase().includes(search.toLowerCase()))
    );
    if (sort === 'latest')   r.sort((a,b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    if (sort === 'popular')  r.sort((a,b) => (b.views||0) - (a.views||0));
    if (sort === 'trending') r.sort((a,b) => (b.likes||0) - (a.likes||0));
    setFiltered(r);
  }, [articles, category, search, sort]);

  /* Read progress scroll */
  useEffect(() => {
    if (!reading) return;
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      setReadProgress(Math.min(100, Math.max(0, Math.round((scrolled / total) * 100))));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reading]);

  const toggleLike = (id: string) => {
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSave = (id: string) => {
    setSaved(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const featured = filtered.filter(a => a.featured).slice(0, 2);
  const regular  = filtered.filter(a => !a.featured);

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#03050a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:44,height:44,border:'2px solid rgba(198,241,53,0.15)',borderTop:'2px solid #c6f135',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{
          --void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;
          --lime:#c6f135;--cyan:#00d4ff;--violet:#8b5cf6;--rose:#f43f5e;--amber:#f59e0b;
          --text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);
        }
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;opacity:0.4;}
        @keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideup{from{opacity:0;transform:translateY(30px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* LAYOUT */
        .layout{display:flex;min-height:100vh;}
        .sidebar{width:260px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:28px 20px;position:fixed;top:0;left:0;bottom:0;overflow-y:auto;z-index:100;}
        .sidebar-logo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-bottom:36px;}
        .logo-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-0.5px;}
        .logo-text em{font-style:normal;color:var(--lime);}
        .nav-item{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;font-size:14px;font-weight:500;color:var(--sub);transition:all 0.2s;margin-bottom:2px;border:1px solid transparent;text-decoration:none;background:transparent;width:100%;text-align:left;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;}
        .nav-item:hover{color:var(--text);background:rgba(255,255,255,0.04);}
        .nav-item.active{color:var(--lime);background:rgba(198,241,53,0.08);border-color:rgba(198,241,53,0.12);}
        .sidebar-bottom{margin-top:auto;padding-top:20px;}
        .user-card{display:flex;align-items:center;gap:12px;padding:14px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid var(--line);margin-bottom:10px;}
        .btn-logout{width:100%;padding:11px;background:rgba(244,63,94,0.06);border:1px solid rgba(244,63,94,0.15);border-radius:10px;color:#fb7185;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;}
        .btn-logout:hover{background:rgba(244,63,94,0.12);}

        /* MAIN */
        .main{margin-left:260px;flex:1;min-width:0;}
        .topbar{height:68px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 36px;background:rgba(3,5,10,0.85);backdrop-filter:blur(20px);position:sticky;top:0;z-index:50;}
        .topbar-title{font-size:18px;font-weight:700;letter-spacing:-0.5px;}
        .back-btn{display:flex;align-items:center;gap:7px;padding:8px 16px;background:var(--panel);border:1px solid var(--line);border-radius:9px;color:var(--sub);font-size:13px;font-weight:600;text-decoration:none;transition:all 0.2s;}
        .back-btn:hover{color:var(--text);}
        .content{padding:36px;animation:fadein 0.4s ease;}

        /* HERO */
        .hero{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:32px 36px;margin-bottom:28px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:24px;}
        .hero::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--lime),var(--cyan),transparent);}
        .hero::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top right,rgba(198,241,53,0.04) 0%,transparent 60%);pointer-events:none;}
        .hero-title{font-family:'Instrument Serif',serif;font-size:32px;letter-spacing:-1px;margin-bottom:6px;line-height:1.2;}
        .hero-title em{font-style:italic;color:var(--lime);}
        .hero-sub{font-size:14px;color:var(--sub);font-weight:300;max-width:520px;line-height:1.65;}
        .hero-stats{display:flex;gap:28px;flex-shrink:0;}
        .hstat{text-align:center;}
        .hstat-n{font-size:26px;font-weight:900;letter-spacing:-1.2px;color:var(--lime);}
        .hstat-l{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--sub);}

        /* CATEGORY PILLS */
        .cats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;}
        .cat-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:100px;font-size:12px;font-weight:700;cursor:pointer;background:var(--panel);border:1px solid var(--line);color:var(--sub);transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;}
        .cat-btn:hover{color:var(--text);border-color:rgba(255,255,255,0.12);}
        .cat-btn.active{font-weight:800;}

        /* CONTROLS */
        .controls{display:flex;gap:10px;margin-bottom:24px;align-items:center;flex-wrap:wrap;}
        .search-wrap{flex:1;min-width:220px;position:relative;}
        .search-wrap input{width:100%;padding:10px 16px 10px 38px;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all 0.2s;}
        .search-wrap input:focus{border-color:rgba(198,241,53,0.3);box-shadow:0 0 0 3px rgba(198,241,53,0.06);}
        .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--sub);pointer-events:none;}
        .sort-group{display:flex;gap:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;}
        .sort-btn{padding:9px 16px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:none;color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;border-right:1px solid var(--line);}
        .sort-btn:last-child{border-right:none;}
        .sort-btn:hover{color:var(--text);background:rgba(255,255,255,0.04);}
        .sort-btn.active{color:var(--lime);background:rgba(198,241,53,0.06);}

        /* FEATURED ARTICLES */
        .featured-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
        .feat-card{background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden;cursor:pointer;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);position:relative;display:flex;flex-direction:column;animation:fadein 0.4s ease;}
        .feat-card:hover{border-color:rgba(198,241,53,0.2);transform:translateY(-4px);box-shadow:0 24px 60px rgba(0,0,0,0.5);}
        .feat-banner{height:7px;}
        .feat-body{padding:24px;flex:1;display:flex;flex-direction:column;}
        .feat-label{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
        .feat-badge{padding:4px 12px;border-radius:100px;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;}
        .feat-badge-star{padding:4px 10px;border-radius:100px;font-size:10px;font-weight:800;background:rgba(198,241,53,0.08);color:var(--lime);border:1px solid rgba(198,241,53,0.2);}
        .feat-title{font-family:'Instrument Serif',serif;font-size:22px;line-height:1.3;letter-spacing:-0.3px;margin-bottom:10px;flex:1;}
        .feat-excerpt{font-size:13px;color:var(--sub);line-height:1.7;font-weight:300;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
        .feat-footer{display:flex;align-items:center;justify-content:space-between;}
        .author-row{display:flex;align-items:center;gap:8px;}
        .avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;}
        .author-name{font-size:12px;font-weight:600;}
        .author-role{font-size:10px;color:var(--sub);}
        .meta-row{display:flex;align-items:center;gap:12px;}
        .meta-item{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--sub);}

        /* ARTICLE GRID */
        .section-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--sub);margin-bottom:14px;display:flex;align-items:center;gap:10px;}
        .section-label::after{content:'';flex:1;height:1px;background:var(--line);}
        .articles-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:12px;}
        .art-card{background:var(--panel);border:1px solid var(--line);border-radius:16px;cursor:pointer;transition:all 0.25s;overflow:hidden;display:flex;flex-direction:column;animation:fadein 0.4s ease;position:relative;}
        .art-card:hover{border-color:rgba(198,241,53,0.12);transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,0.4);}
        .art-stripe{height:3px;}
        .art-body{padding:18px;flex:1;display:flex;flex-direction:column;}
        .art-cat{display:flex;align-items:center;gap:6px;margin-bottom:10px;}
        .art-title{font-size:15px;font-weight:800;letter-spacing:-0.4px;line-height:1.4;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .art-excerpt{font-size:12px;color:var(--sub);line-height:1.6;font-weight:300;margin-bottom:14px;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .art-footer{display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--line);}
        .art-author{display:flex;align-items:center;gap:7px;}
        .art-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0;}
        .art-author-name{font-size:11px;font-weight:600;}
        .art-meta{display:flex;gap:8px;}
        .art-meta-item{display:flex;align-items:center;gap:3px;font-size:10px;color:var(--sub);}

        /* ACTION BUTTONS */
        .act-btn{width:28px;height:28px;border-radius:7px;background:rgba(255,255,255,0.04);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;transition:all 0.2s;flex-shrink:0;}
        .act-btn:hover{background:rgba(255,255,255,0.08);}
        .act-btn.liked{background:rgba(244,63,94,0.12);border-color:rgba(244,63,94,0.3);}
        .act-btn.saved{background:rgba(198,241,53,0.08);border-color:rgba(198,241,53,0.2);}

        /* TAGS */
        .tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;}
        .tag{padding:3px 9px;border-radius:6px;font-size:10px;font-weight:600;background:rgba(255,255,255,0.04);border:1px solid var(--line);color:var(--sub);}

        /* READ PROGRESS BAR */
        .read-progress{position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--lime),var(--cyan));z-index:2000;transition:width 0.1s linear;}

        /* READING MODAL */
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(24px);z-index:500;overflow-y:auto;animation:fadein 0.25s ease;}
        .reading-wrap{max-width:760px;margin:0 auto;padding:40px 24px 80px;}
        .reading-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:36px;position:sticky;top:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(20px);padding:14px 0;z-index:10;}
        .reading-close{display:flex;align-items:center;gap:8px;padding:9px 18px;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--sub);font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;}
        .reading-close:hover{color:var(--text);}
        .reading-actions{display:flex;gap:8px;}
        .reading-cat{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:100px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;}
        .reading-title{font-family:'Instrument Serif',serif;font-size:38px;line-height:1.2;letter-spacing:-1.5px;margin-bottom:16px;}
        .reading-meta{display:flex;align-items:center;gap:20px;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--line);}
        .reading-author{display:flex;align-items:center;gap:10px;}
        .reading-av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;}
        .reading-body{font-size:16px;line-height:1.9;color:rgba(226,236,255,0.88);font-weight:300;}
        .reading-body p{margin-bottom:20px;}
        .reading-body strong,.reading-body b{font-weight:700;color:var(--text);}
        .reading-body h2,.reading-body h3{font-family:'Instrument Serif',serif;font-size:26px;letter-spacing:-0.5px;margin:32px 0 16px;color:var(--text);}
        .reading-body ul,.reading-body ol{margin:16px 0;padding-left:24px;}
        .reading-body li{margin-bottom:8px;}
        .reading-divider{border:none;border-top:1px solid var(--line);margin:32px 0;}

        /* EMPTY */
        .empty{text-align:center;padding:70px 20px;background:var(--panel);border:1px solid var(--line);border-radius:18px;}

        /* RESULTS */
        .results-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}

        @media(max-width:1100px){.featured-grid{grid-template-columns:1fr;}}
        @media(max-width:900px){.sidebar{display:none}.main{margin-left:0}.content{padding:20px}.hero{flex-direction:column}.articles-grid{grid-template-columns:1fr}}
      `}</style>

      {/* READ PROGRESS */}
      {reading && <div className="read-progress" style={{width:`${readProgress}%`}}/>}

      {/* ══════ READING MODAL ══════ */}
      {reading && (() => {
        const cat = catMap[reading.category] || catMap['All'];
        return (
          <div className="overlay" ref={articleRef}>
            <div className="reading-wrap">
              {/* Topbar */}
              <div className="reading-topbar">
                <button className="reading-close" onClick={()=>{setReading(null);setReadProgress(0);}}>← Back to Articles</button>
                <div className="reading-actions">
                  <button className={`act-btn ${liked.has(reading._id)?'liked':''}`} onClick={()=>toggleLike(reading._id)} title="Like">
                    {liked.has(reading._id) ? '❤️' : '🤍'}
                  </button>
                  <button className={`act-btn ${saved.has(reading._id)?'saved':''}`} onClick={()=>toggleSave(reading._id)} title="Save">
                    {saved.has(reading._id) ? '🔖' : '📌'}
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="reading-cat" style={{background:cat.bg,color:cat.color,border:`1px solid ${cat.border}`}}>
                {cat.emoji} {reading.category}
              </div>

              {/* Title */}
              <h1 className="reading-title">{reading.title}</h1>

              {/* Meta */}
              <div className="reading-meta">
                <div className="reading-author">
                  <div className="reading-av" style={{background:cat.bg,color:cat.color}}>
                    {initials(reading.author?.name||'A')}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700}}>{reading.author?.name}</div>
                    <div style={{fontSize:11,color:'var(--sub)'}}>{reading.author?.role}</div>
                  </div>
                </div>
                <div style={{width:1,height:32,background:'var(--line)'}}/>
                <div style={{fontSize:12,color:'var(--sub)',display:'flex',flexDirection:'column',gap:2}}>
                  <span>📅 {timeAgo(reading.publishedAt)}</span>
                  <span>⏱ {reading.readTime} min read</span>
                </div>
                <div style={{width:1,height:32,background:'var(--line)'}}/>
                <div style={{fontSize:12,color:'var(--sub)',display:'flex',flexDirection:'column',gap:2}}>
                  <span>👁 {reading.views?.toLocaleString()} views</span>
                  <span>❤️ {(reading.likes+(liked.has(reading._id)?1:0)).toLocaleString()} likes</span>
                </div>
              </div>

              {/* Tags */}
              {reading.tags?.length > 0 && (
                <div className="tags" style={{marginBottom:28}}>
                  {reading.tags.map((t:string) => <span key={t} className="tag">#{t}</span>)}
                </div>
              )}

              {/* Body */}
              <div className="reading-body">
                <p style={{fontSize:18,color:'var(--text)',fontWeight:400,lineHeight:1.8,marginBottom:28,fontFamily:'Instrument Serif,serif',fontStyle:'italic'}}>
                  {reading.excerpt}
                </p>
                <hr className="reading-divider"/>
                {(reading.content || reading.excerpt).split('\n\n').map((para: string, i: number) => {
                  if (para.startsWith('**') && para.endsWith('**')) {
                    return <h2 key={i}>{para.replace(/\*\*/g,'')}</h2>;
                  }
                  const formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return <p key={i} dangerouslySetInnerHTML={{__html: formatted}}/>;
                })}
                {/* Filler content for short articles */}
                {reading.content?.length < 200 && (
                  <>
                    <p>This topic has been extensively studied in sports science and nutrition research. The consensus among researchers points to several key factors that determine optimal outcomes for athletes and fitness enthusiasts alike.</p>
                    <p>When applied consistently over time, these principles produce measurable, sustainable results. The key is understanding the underlying mechanisms rather than following surface-level advice.</p>
                    <p>Individual response varies based on genetics, training history, nutrition status, and recovery capacity. Always consult with a qualified professional before making significant changes to your training or nutrition program.</p>
                    <hr className="reading-divider"/>
                    <p style={{fontSize:13,color:'var(--sub)',fontStyle:'italic'}}>This article is for educational purposes only and does not constitute medical advice. Consult a qualified healthcare provider before making changes to your health regimen.</p>
                  </>
                )}
              </div>

              {/* Related suggestions */}
              <div style={{marginTop:48,padding:'24px',background:'rgba(255,255,255,0.02)',border:'1px solid var(--line)',borderRadius:16}}>
                <div style={{fontSize:13,fontWeight:800,letterSpacing:'-0.3px',marginBottom:12}}>More in {reading.category}</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {articles.filter(a => a.category === reading.category && a._id !== reading._id).slice(0,3).map((a:any) => (
                    <div key={a._id} onClick={()=>{setReading(a);setReadProgress(0);window.scrollTo(0,0);}}
                      style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',padding:'10px 12px',borderRadius:10,background:'rgba(255,255,255,0.02)',border:'1px solid var(--line)',transition:'all 0.2s'}}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(198,241,53,0.15)')}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(0,212,255,0.08)')}>
                      <div style={{flex:1,fontSize:13,fontWeight:600,lineHeight:1.4}}>{a.title}</div>
                      <span style={{fontSize:11,color:'var(--sub)',flexShrink:0}}>⏱ {a.readTime}m</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════ MAIN LAYOUT ══════ */}
      <div className="layout">
        <aside className="sidebar">
          <a className="sidebar-logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
          {[
            {icon:'⚡',label:'Dashboard',     href:'/dashboard'},
            {icon:'📊',label:'Progress',      href:'/progress'},
            {icon:'📝',label:'Log Today',     href:'/progress/log'},
            {icon:'🏋️',label:'Workouts',      href:'/workouts/generate'},
            {icon:'📅',label:'My Bookings',   href:'/bookings'},
            {icon:'👥',label:'Trainers',      href:'/trainers'},
            {icon:'🧬',label:'Nutritionists', href:'/nutritionists'},
            {icon:'📍',label:'Gyms',          href:'/gym-packages'},
            {icon:'🥗',label:'Meal Plans',    href:'/meals'},
            {icon:'📰',label:'Articles',      href:'/articles', active:true},
            {icon:'👤',label:'Profile',       href:'/profile'},
          ].map(n => (
            <a key={n.label} className={`nav-item ${(n as any).active?'active':''}`} href={n.href}>
              <span style={{fontSize:16,width:20,textAlign:'center'}}>{n.icon}</span>{n.label}
            </a>
          ))}
          <div className="sidebar-bottom">
            <div className="user-card">
              <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,rgba(198,241,53,0.3),rgba(0,212,255,0.2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'var(--lime)'}}>
                {user?.name?.[0]?.toUpperCase()||'U'}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{user?.name}</div>
                <div style={{fontSize:10,color:'var(--sub)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:140,whiteSpace:'nowrap'}}>{user?.email}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={()=>{localStorage.removeItem('token');router.push('/login');}}>Sign out</button>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-title">Articles & Blog</div>
            <a className="back-btn" href="/dashboard">← Dashboard</a>
          </div>

          <div className="content">
            {/* HERO */}
            <div className="hero">
              <div>
                <h1 className="hero-title">Health <em>Knowledge</em> Hub</h1>
                <p className="hero-sub">Evidence-based articles written by certified nutritionists, sports scientists, and medical professionals. No fluff — just science.</p>
              </div>
              <div className="hero-stats">
                <div className="hstat"><div className="hstat-n">{articles.length}</div><div className="hstat-l">Articles</div></div>
                <div style={{width:1,background:'var(--line)'}}/>
                <div className="hstat"><div className="hstat-n">{CATEGORIES.length-1}</div><div className="hstat-l">Topics</div></div>
                <div style={{width:1,background:'var(--line)'}}/>
                <div className="hstat"><div className="hstat-n">Pro</div><div className="hstat-l">Writers</div></div>
              </div>
            </div>

            {/* CATEGORIES */}
            <div className="cats">
              {CATEGORIES.map(c => (
                <button key={c.key} className={`cat-btn ${category===c.key?'active':''}`}
                  style={category===c.key ? {background:c.bg,color:c.color,borderColor:c.border} : {}}
                  onClick={()=>setCategory(c.key)}>
                  <span>{c.emoji}</span>{c.label}
                  <span style={{fontSize:10,background:'rgba(255,255,255,0.06)',padding:'1px 6px',borderRadius:100,marginLeft:2}}>
                    {c.key==='All' ? articles.length : articles.filter(a=>a.category===c.key).length}
                  </span>
                </button>
              ))}
            </div>

            {/* CONTROLS */}
            <div className="controls">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input placeholder="Search articles, topics, tags…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div className="sort-group">
                {(['latest','popular','trending'] as const).map(s=>(
                  <button key={s} className={`sort-btn ${sort===s?'active':''}`} onClick={()=>setSort(s)}>
                    {s==='latest'?'🕐':s==='popular'?'👁':'🔥'} {s.charAt(0).toUpperCase()+s.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{fontSize:13,color:'var(--sub)',whiteSpace:'nowrap'}}>{filtered.length} article{filtered.length!==1?'s':''}</div>
            </div>

            {filtered.length===0 ? (
              <div className="empty">
                <div style={{fontSize:48,marginBottom:12}}>📰</div>
                <div style={{fontSize:18,fontWeight:800,marginBottom:6}}>No articles found</div>
                <div style={{fontSize:13,color:'var(--sub)'}}>Try a different search or category.</div>
                <button style={{marginTop:16,padding:'9px 20px',background:'var(--panel)',border:'1px solid var(--line)',borderRadius:9,color:'var(--sub)',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'Plus Jakarta Sans,sans-serif'}}
                  onClick={()=>{setCategory('All');setSearch('');}}>Clear filters</button>
              </div>
            ) : (
              <>
                {/* FEATURED */}
                {featured.length > 0 && (
                  <>
                    <div className="section-label">⭐ Featured</div>
                    <div className="featured-grid" style={{marginBottom:28}}>
                      {featured.map((art:any) => {
                        const cat = catMap[art.category] || catMap['All'];
                        return (
                          <div key={art._id} className="feat-card" onClick={()=>{setReading(art);setReadProgress(0);}}>
                            <div className="feat-banner" style={{background:`linear-gradient(90deg,${cat.color},transparent)`}}/>
                            <div className="feat-body">
                              <div className="feat-label">
                                <span className="feat-badge" style={{background:cat.bg,color:cat.color,border:`1px solid ${cat.border}`}}>{cat.emoji} {art.category}</span>
                                <span className="feat-badge-star">⭐ Featured</span>
                              </div>
                              <h2 className="feat-title">{art.title}</h2>
                              <p className="feat-excerpt">{art.excerpt}</p>
                              <div className="tags" style={{marginBottom:14}}>
                                {art.tags?.slice(0,4).map((t:string)=><span key={t} className="tag">#{t}</span>)}
                              </div>
                              <div className="feat-footer">
                                <div className="author-row">
                                  <div className="avatar" style={{background:cat.bg,color:cat.color}}>{initials(art.author?.name||'A')}</div>
                                  <div>
                                    <div className="author-name">{art.author?.name}</div>
                                    <div className="author-role">{art.author?.role}</div>
                                  </div>
                                </div>
                                <div className="meta-row">
                                  <span className="meta-item">⏱ {art.readTime}m</span>
                                  <span className="meta-item">👁 {(art.views||0).toLocaleString()}</span>
                                  <button className={`act-btn ${liked.has(art._id)?'liked':''}`}
                                    onClick={e=>{e.stopPropagation();toggleLike(art._id);}}>
                                    {liked.has(art._id)?'❤️':'🤍'}
                                  </button>
                                  <button className={`act-btn ${saved.has(art._id)?'saved':''}`}
                                    onClick={e=>{e.stopPropagation();toggleSave(art._id);}}>
                                    {saved.has(art._id)?'🔖':'📌'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* REGULAR ARTICLES */}
                {regular.length > 0 && (
                  <>
                    <div className="section-label">📚 All Articles</div>
                    <div className="articles-grid">
                      {regular.map((art:any) => {
                        const cat = catMap[art.category] || catMap['All'];
                        return (
                          <div key={art._id} className="art-card" onClick={()=>{setReading(art);setReadProgress(0);}}>
                            <div className="art-stripe" style={{background:`linear-gradient(90deg,${cat.color},transparent)`}}/>
                            <div className="art-body">
                              <div className="art-cat">
                                <span style={{padding:'3px 10px',borderRadius:100,fontSize:9,fontWeight:800,letterSpacing:'0.5px',textTransform:'uppercase',background:cat.bg,color:cat.color,border:`1px solid ${cat.border}`}}>
                                  {cat.emoji} {art.category}
                                </span>
                              </div>
                              <div className="art-title">{art.title}</div>
                              <p className="art-excerpt">{art.excerpt}</p>
                              <div className="tags">
                                {art.tags?.slice(0,3).map((t:string)=><span key={t} className="tag">#{t}</span>)}
                              </div>
                              <div className="art-footer">
                                <div className="art-author">
                                  <div className="art-av" style={{background:cat.bg,color:cat.color}}>{initials(art.author?.name||'A')}</div>
                                  <div>
                                    <div className="art-author-name">{art.author?.name}</div>
                                    <div style={{fontSize:9,color:'var(--sub)'}}>{timeAgo(art.publishedAt)}</div>
                                  </div>
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <div className="art-meta">
                                    <span className="art-meta-item">⏱{art.readTime}m</span>
                                    <span className="art-meta-item">👁{(art.views||0).toLocaleString()}</span>
                                  </div>
                                  <button className={`act-btn ${liked.has(art._id)?'liked':''}`}
                                    onClick={e=>{e.stopPropagation();toggleLike(art._id);}}>
                                    {liked.has(art._id)?'❤️':'🤍'}
                                  </button>
                                  <button className={`act-btn ${saved.has(art._id)?'saved':''}`}
                                    onClick={e=>{e.stopPropagation();toggleSave(art._id);}}>
                                    {saved.has(art._id)?'🔖':'📌'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}