'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

/* ─── CATEGORIES ─────────────────────────────────────────── */
const CATS = [
  { key:'All',          label:'All',           emoji:'💊', color:'#c6f135', bg:'rgba(198,241,53,0.08)',  border:'rgba(198,241,53,0.2)'  },
  { key:'Protein',      label:'Protein',        emoji:'🥛', color:'#00d4ff', bg:'rgba(0,212,255,0.08)',  border:'rgba(0,212,255,0.2)'   },
  { key:'Creatine',     label:'Creatine',       emoji:'⚡', color:'#fbbf24', bg:'rgba(251,191,36,0.08)', border:'rgba(251,191,36,0.2)'  },
  { key:'Pre-Workout',  label:'Pre-Workout',    emoji:'🔥', color:'#fb7185', bg:'rgba(251,113,133,0.08)',border:'rgba(251,113,133,0.2)' },
  { key:'Vitamins',     label:'Vitamins',       emoji:'🌿', color:'#34d399', bg:'rgba(52,211,153,0.08)', border:'rgba(52,211,153,0.2)'  },
  { key:'Weight Loss',  label:'Weight Loss',    emoji:'🏃', color:'#f472b6', bg:'rgba(244,114,182,0.08)',border:'rgba(244,114,182,0.2)' },
  { key:'Recovery',     label:'Recovery',       emoji:'🧘', color:'#a78bfa', bg:'rgba(167,139,250,0.08)',border:'rgba(167,139,250,0.2)' },
  { key:'Mass Gainer',  label:'Mass Gainer',    emoji:'💪', color:'#fb923c', bg:'rgba(251,146,60,0.08)', border:'rgba(251,146,60,0.2)'  },
];

const BRANDS = ['All Brands','Optimum Nutrition','MyProtein','MuscleTech','BSN','Dymatize','Now Foods','UrbanWell Pro'];

/* ─── DEMO PRODUCTS ──────────────────────────────────────── */
const PRODUCTS = [
  /* PROTEIN */
  { _id:'p1', name:'Gold Standard Whey', brand:'Optimum Nutrition', category:'Protein', price:8500, originalPrice:9500,
    weight:'2.27kg (5lb)', servings:74, perServing:'24g protein', rating:4.9, reviews:2841, inStock:true, badge:'Best Seller',
    badgeColor:'#c6f135', flavor:'Double Rich Chocolate, Vanilla Ice Cream, Strawberry',
    desc:'The world\'s best-selling whey protein. 24g of protein per serving with minimal fat and sugar. Mixes instantly with no clumping.',
    facts:[{label:'Protein',val:'24g'},{label:'BCAA',val:'5.5g'},{label:'Glutamine',val:'4g'},{label:'Calories',val:'120'}],
    tags:['Whey','Isolate','Post-Workout','Muscle'] },
  { _id:'p2', name:'Iso-100 Hydrolyzed Whey', brand:'Dymatize', category:'Protein', price:11200, originalPrice:13000,
    weight:'2.3kg', servings:76, perServing:'25g protein', rating:4.8, reviews:1432, inStock:true, badge:'Premium',
    badgeColor:'#00d4ff', flavor:'Gourmet Chocolate, Birthday Cake, Fruity Pebbles',
    desc:'100% hydrolyzed whey isolate — the fastest absorbing protein available. Zero fat, zero sugar, zero lactose. Ideal for post-workout.',
    facts:[{label:'Protein',val:'25g'},{label:'Fat',val:'0g'},{label:'Sugar',val:'0g'},{label:'Calories',val:'110'}],
    tags:['Hydrolyzed','Isolate','Zero Sugar','Fast'] },
  { _id:'p3', name:'Pea Protein Isolate', brand:'MyProtein', category:'Protein', price:5500, originalPrice:6200,
    weight:'1kg', servings:33, perServing:'21g protein', rating:4.6, reviews:876, inStock:true, badge:'Vegan',
    badgeColor:'#34d399', flavor:'Unflavored, Vanilla, Chocolate',
    desc:'High-quality plant-based protein from yellow peas. Complete amino acid profile. Perfect for vegans and those with dairy sensitivities.',
    facts:[{label:'Protein',val:'21g'},{label:'BCAA',val:'4.2g'},{label:'Iron',val:'35% DV'},{label:'Calories',val:'100'}],
    tags:['Vegan','Plant','Dairy-Free','Clean'] },
  { _id:'p4', name:'Mass Tech Mass Gainer', brand:'MuscleTech', category:'Mass Gainer', price:9800, originalPrice:11500,
    weight:'3.2kg', servings:11, perServing:'63g protein + 132g carbs', rating:4.5, reviews:1203, inStock:true, badge:'High Calorie',
    badgeColor:'#fb923c', flavor:'Chocolate, Vanilla, Strawberry',
    desc:'High-calorie mass gainer with 1010 calories per serving. 63g of protein plus a multi-phase carb complex for serious size and strength gains.',
    facts:[{label:'Protein',val:'63g'},{label:'Carbs',val:'132g'},{label:'Creatine',val:'10g'},{label:'Calories',val:'1010'}],
    tags:['Bulking','High Calorie','Mass','Hardgainer'] },
  /* CREATINE */
  { _id:'c1', name:'Creatine Monohydrate', brand:'MyProtein', category:'Creatine', price:2800, originalPrice:3200,
    weight:'500g (100 servings)', servings:100, perServing:'5g creatine', rating:4.9, reviews:5621, inStock:true, badge:'Best Value',
    badgeColor:'#c6f135', flavor:'Unflavored',
    desc:'Pure micronized creatine monohydrate — the most researched supplement in sports science. 5g per serving for strength, power, and muscle growth.',
    facts:[{label:'Creatine',val:'5g'},{label:'Purity',val:'99.9%'},{label:'Calories',val:'0'},{label:'Additives',val:'None'}],
    tags:['Creatine','Strength','Power','Research-Backed'] },
  { _id:'c2', name:'Creatine HCl', brand:'MuscleTech', category:'Creatine', price:4200, originalPrice:4800,
    weight:'120 caps', servings:120, perServing:'750mg creatine HCl', rating:4.7, reviews:932, inStock:true, badge:'No Loading',
    badgeColor:'#fbbf24', flavor:'Capsules',
    desc:'Creatine Hydrochloride — more soluble than monohydrate. Smaller dose required, no loading phase needed, minimal bloating.',
    facts:[{label:'Creatine HCl',val:'750mg'},{label:'Dose',val:'1-2 caps'},{label:'Loading',val:'Not needed'},{label:'Bloat',val:'Minimal'}],
    tags:['HCl','No Bloat','Convenient','Caps'] },
  /* PRE-WORKOUT */
  { _id:'pw1', name:'C4 Original Pre-Workout', brand:'Optimum Nutrition', category:'Pre-Workout', price:5500, originalPrice:6500,
    weight:'390g (30 servings)', servings:30, perServing:'150mg caffeine + 1.6g beta-alanine', rating:4.8, reviews:3201, inStock:true, badge:'Top Rated',
    badgeColor:'#fb7185', flavor:'Watermelon, Pink Lemonade, Fruit Punch, Blue Raspberry',
    desc:'America\'s #1 pre-workout. Explosive energy, enhanced endurance, and a sharp focus that carries you through the hardest sessions.',
    facts:[{label:'Caffeine',val:'150mg'},{label:'Beta-Alanine',val:'1.6g'},{label:'Arginine',val:'1g'},{label:'Calories',val:'5'}],
    tags:['Energy','Focus','Pump','Beta-Alanine'] },
  { _id:'pw2', name:'Nitraflex Advanced Pre-Workout', brand:'BSN', category:'Pre-Workout', price:7200, originalPrice:8500,
    weight:'300g (30 servings)', servings:30, perServing:'325mg caffeine', rating:4.7, reviews:1876, inStock:false, badge:'High Stimulant',
    badgeColor:'#f43f5e', flavor:'Pineapple, Mango, Black Cherry',
    desc:'Extreme high-stimulant pre-workout for advanced users. 325mg caffeine per serving with testosterone-supporting compounds.',
    facts:[{label:'Caffeine',val:'325mg'},{label:'DMAE',val:'150mg'},{label:'L-Citrulline',val:'3g'},{label:'Niacin',val:'25mg'}],
    tags:['High Stim','Advanced','Testosterone','Extreme'] },
  { _id:'pw3', name:'Pump Stim-Free Pre-Workout', brand:'MyProtein', category:'Pre-Workout', price:4800, originalPrice:5500,
    weight:'375g (25 servings)', servings:25, perServing:'8g L-Citrulline', rating:4.6, reviews:654, inStock:true, badge:'Caffeine Free',
    badgeColor:'#a78bfa', flavor:'Blue Raspberry, Tropical, Unflavored',
    desc:'Stim-free pre-workout focused on blood flow and muscle pumps. Perfect for evening training or those sensitive to caffeine.',
    facts:[{label:'L-Citrulline',val:'8g'},{label:'Betaine',val:'2.5g'},{label:'Caffeine',val:'0mg'},{label:'Calories',val:'15'}],
    tags:['Stim-Free','Pump','Evening','Caffeine-Free'] },
  /* VITAMINS */
  { _id:'v1', name:'Omega-3 Fish Oil', brand:'Now Foods', category:'Vitamins', price:2200, originalPrice:2600,
    weight:'200 softgels', servings:100, perServing:'1000mg fish oil (300mg EPA+DHA)', rating:4.8, reviews:4302, inStock:true, badge:'Heart Health',
    badgeColor:'#34d399', flavor:'Softgels',
    desc:'High-quality molecularly distilled fish oil. Essential omega-3 fatty acids for heart health, joint support, and anti-inflammation.',
    facts:[{label:'EPA',val:'180mg'},{label:'DHA',val:'120mg'},{label:'Total Omega-3',val:'300mg'},{label:'Mercury',val:'Non-detect'}],
    tags:['Omega-3','Heart','Joints','Anti-inflammatory'] },
  { _id:'v2', name:'Vitamin D3 + K2', brand:'Now Foods', category:'Vitamins', price:1800, originalPrice:2100,
    weight:'120 caps', servings:120, perServing:'5000 IU D3 + 100mcg K2', rating:4.9, reviews:2187, inStock:true, badge:'Immune Support',
    badgeColor:'#34d399', flavor:'Capsules',
    desc:'The essential duo — D3 for calcium absorption and immune function, K2 to direct calcium to bones rather than arteries.',
    facts:[{label:'Vitamin D3',val:'5000 IU'},{label:'Vitamin K2',val:'100mcg'},{label:'Form',val:'MK-7'},{label:'Soy-Free',val:'Yes'}],
    tags:['Vitamin D','K2','Immune','Bone Health'] },
  { _id:'v3', name:'Multivitamin Sport', brand:'Optimum Nutrition', category:'Vitamins', price:3500, originalPrice:4000,
    weight:'90 tabs (30 servings)', servings:30, perServing:'23 vitamins & minerals', rating:4.7, reviews:1654, inStock:true, badge:'Complete',
    badgeColor:'#c6f135', flavor:'Tablets',
    desc:'Comprehensive multivitamin formulated specifically for active individuals. Higher doses of B-vitamins, antioxidants, and electrolytes.',
    facts:[{label:'Vitamin C',val:'250mg'},{label:'Vitamin E',val:'100 IU'},{label:'B-Complex',val:'Full'},{label:'Zinc',val:'15mg'}],
    tags:['Multivitamin','Athletes','B-Vitamins','Complete'] },
  { _id:'v4', name:'Magnesium Glycinate', brand:'Now Foods', category:'Vitamins', price:2400, originalPrice:2800,
    weight:'180 caps', servings:90, perServing:'400mg magnesium', rating:4.8, reviews:3421, inStock:true, badge:'Sleep & Recovery',
    badgeColor:'#a78bfa', flavor:'Capsules',
    desc:'Highly bioavailable magnesium glycinate for superior absorption. Supports muscle relaxation, sleep quality, and over 300 enzymatic reactions.',
    facts:[{label:'Magnesium',val:'400mg'},{label:'Form',val:'Glycinate'},{label:'Absorption',val:'High'},{label:'Laxative Effect',val:'None'}],
    tags:['Magnesium','Sleep','Recovery','Relaxation'] },
  /* WEIGHT LOSS */
  { _id:'wl1', name:'CLA 1000mg', brand:'MuscleTech', category:'Weight Loss', price:3200, originalPrice:3800,
    weight:'180 softgels', servings:90, perServing:'1000mg CLA', rating:4.5, reviews:1203, inStock:true, badge:'Fat Burner',
    badgeColor:'#f472b6', flavor:'Softgels',
    desc:'Conjugated Linoleic Acid — a naturally occurring fatty acid that supports fat loss, lean muscle retention, and metabolic rate.',
    facts:[{label:'CLA',val:'1000mg'},{label:'Safflower Oil',val:'1250mg'},{label:'Calories',val:'10'},{label:'GMO-Free',val:'Yes'}],
    tags:['CLA','Fat Loss','Lean Muscle','Natural'] },
  { _id:'wl2', name:'Thermo Burn Fat Burner', brand:'UrbanWell Pro', category:'Weight Loss', price:4500, originalPrice:5200,
    weight:'60 caps (30 servings)', servings:30, perServing:'200mg caffeine + green tea extract', rating:4.6, reviews:876, inStock:true, badge:'Thermogenic',
    badgeColor:'#fb7185', flavor:'Capsules',
    desc:'Thermogenic fat burner combining caffeine, green tea EGCG, and cayenne pepper to boost metabolism and increase calorie burn at rest.',
    facts:[{label:'Caffeine',val:'200mg'},{label:'Green Tea',val:'500mg'},{label:'Cayenne',val:'50mg'},{label:'L-Carnitine',val:'500mg'}],
    tags:['Thermogenic','Caffeine','Green Tea','Metabolism'] },
  { _id:'wl3', name:'L-Carnitine 1500', brand:'MyProtein', category:'Weight Loss', price:2800, originalPrice:3200,
    weight:'500ml liquid', servings:50, perServing:'1500mg L-Carnitine', rating:4.5, reviews:654, inStock:true, badge:'Fat Transport',
    badgeColor:'#f472b6', flavor:'Berry, Cherry, Mango',
    desc:'L-Carnitine transports fatty acids into mitochondria to be burned as fuel. Best taken pre-workout or fasted cardio for maximum effect.',
    facts:[{label:'L-Carnitine',val:'1500mg'},{label:'Form',val:'L-Tartrate'},{label:'Sugar',val:'0g'},{label:'Calories',val:'5'}],
    tags:['L-Carnitine','Fat Burning','Cardio','Liquid'] },
  /* RECOVERY */
  { _id:'r1', name:'BCAA 2:1:1', brand:'MyProtein', category:'Recovery', price:3800, originalPrice:4500,
    weight:'500g (50 servings)', servings:50, perServing:'10g BCAA (2:1:1 ratio)', rating:4.7, reviews:2109, inStock:true, badge:'Anti-Catabolic',
    badgeColor:'#a78bfa', flavor:'Watermelon, Tropical, Unflavored',
    desc:'Branch Chain Amino Acids in the scientifically validated 2:1:1 ratio. Reduces muscle breakdown, speeds recovery, and reduces soreness.',
    facts:[{label:'Leucine',val:'5g'},{label:'Isoleucine',val:'2.5g'},{label:'Valine',val:'2.5g'},{label:'Calories',val:'40'}],
    tags:['BCAA','Recovery','Anti-Catabolic','Intra-Workout'] },
  { _id:'r2', name:'Glutamine Powder', brand:'Optimum Nutrition', category:'Recovery', price:2600, originalPrice:3000,
    weight:'300g (60 servings)', servings:60, perServing:'5g glutamine', rating:4.6, reviews:1543, inStock:true, badge:'Gut Health',
    badgeColor:'#34d399', flavor:'Unflavored',
    desc:'Pure L-Glutamine — the most abundant amino acid in muscle tissue. Essential for recovery, immune function, and gut health.',
    facts:[{label:'Glutamine',val:'5g'},{label:'Purity',val:'99%'},{label:'Calories',val:'0'},{label:'Mixability',val:'Excellent'}],
    tags:['Glutamine','Recovery','Immune','Gut Health'] },
  { _id:'r3', name:'ZMA Recovery Formula', brand:'Now Foods', category:'Recovery', price:3100, originalPrice:3600,
    weight:'90 caps (30 servings)', servings:30, perServing:'Zinc 30mg + Magnesium 450mg + B6 10.5mg', rating:4.8, reviews:1876, inStock:true, badge:'Sleep Quality',
    badgeColor:'#a78bfa', flavor:'Capsules',
    desc:'ZMA (Zinc, Magnesium, B6) taken at bedtime supports natural testosterone levels, deep sleep quality, and overnight muscle recovery.',
    facts:[{label:'Zinc',val:'30mg'},{label:'Magnesium',val:'450mg'},{label:'Vitamin B6',val:'10.5mg'},{label:'Timing',val:'Bedtime'}],
    tags:['ZMA','Sleep','Testosterone','Recovery'] },
  /* MASS GAINER */
  { _id:'mg1', name:'Serious Mass Gainer', brand:'Optimum Nutrition', category:'Mass Gainer', price:12500, originalPrice:14000,
    weight:'5.44kg (16 servings)', servings:16, perServing:'50g protein + 250g carbs', rating:4.7, reviews:3241, inStock:true, badge:'Hard Gainer',
    badgeColor:'#fb923c', flavor:'Chocolate, Vanilla, Strawberry, Banana',
    desc:'The ultimate weight gain formula. 1250 calories, 50g protein, and 250g carbs per serving with 25 vitamins and minerals.',
    facts:[{label:'Protein',val:'50g'},{label:'Carbs',val:'252g'},{label:'Creatine',val:'3g'},{label:'Calories',val:'1250'}],
    tags:['Mass Gainer','Bulking','High Calorie','Hardgainer'] },
];

const catMap: any = Object.fromEntries(CATS.map(c => [c.key, c]));

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize:11, color: s <= Math.round(rating) ? '#fbbf24' : 'rgba(255,255,255,0.15)' }}>★</span>
      ))}
      <span style={{ fontSize:11, color:'var(--sub)', marginLeft:3 }}>{rating}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function SupplementsPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<any[]>(PRODUCTS);
  const [filtered, setFiltered] = useState<any[]>(PRODUCTS);
  const [category, setCategory] = useState('All');
  const [brand,    setBrand]    = useState('All Brands');
  const [search,   setSearch]   = useState('');
  const [sort,     setSort]     = useState<'popular'|'price-asc'|'price-desc'|'rating'>('popular');
  const [inStockOnly, setInStockOnly] = useState(false);

  const [cart,     setCart]     = useState<{[id:string]: number}>({});
  const [viewProd, setViewProd] = useState<any>(null);
  const [showCart, setShowCart] = useState(false);
  const [toast,    setToast]    = useState('');
  const [toastType,setToastType]= useState<'success'|'error'>('success');
  const toastTimer = useRef<any>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast(msg); setToastType(type);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/profile');
        setUser(data?.data || data);
      } catch { router.push('/login'); return; }
      try {
        const { data } = await API.get('/supplements?limit=100');
        const raw = data?.data || data?.supplements || [];
        if (Array.isArray(raw) && raw.length > 0) setProducts(raw);
      } catch {}
      setLoading(false);
    })();
  }, []);

  /* Filter + sort */
  useEffect(() => {
    let r = [...products];
    if (category !== 'All')        r = r.filter(p => p.category === category);
    if (brand !== 'All Brands')    r = r.filter(p => p.brand === brand);
    if (inStockOnly)               r = r.filter(p => p.inStock);
    if (search.trim())             r = r.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((t:string) => t.toLowerCase().includes(search.toLowerCase()))
    );
    if (sort === 'popular')    r.sort((a,b) => (b.reviews||0) - (a.reviews||0));
    if (sort === 'price-asc')  r.sort((a,b) => a.price - b.price);
    if (sort === 'price-desc') r.sort((a,b) => b.price - a.price);
    if (sort === 'rating')     r.sort((a,b) => (b.rating||0) - (a.rating||0));
    setFiltered(r);
  }, [products, category, brand, search, sort, inStockOnly]);

  const addToCart = (id: string, name: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    showToast(`✓ ${name} added to cart`);
  };
  const removeFromCart = (id: string) => {
    setCart(prev => { const n = {...prev}; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  };

  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    ...(products.find(p => p._id === id) || {}), qty
  })).filter(i => i._id);
  const cartTotal = cartItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const cartCount = Object.values(cart).reduce((a:any, b:any) => a + b, 0);

  const discount = (p: any) => p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#03050a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:44,height:44,border:'2px solid rgba(198,241,53,0.15)',borderTop:'2px solid #c6f135',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{
          --void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;
          --lime:#c6f135;--cyan:#00d4ff;--violet:#8b5cf6;--rose:#f43f5e;--amber:#f59e0b;
          --text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);
        }
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;opacity:0.4;}
        @keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideup{from{opacity:0;transform:translateY(28px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes cartbounce{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}

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
        .topbar-right{display:flex;align-items:center;gap:10px;}
        .back-btn{display:flex;align-items:center;gap:7px;padding:8px 16px;background:var(--panel);border:1px solid var(--line);border-radius:9px;color:var(--sub);font-size:13px;font-weight:600;text-decoration:none;transition:all 0.2s;}
        .back-btn:hover{color:var(--text);}
        .cart-btn{display:flex;align-items:center;gap:8px;padding:8px 18px;background:rgba(198,241,53,0.1);border:1px solid rgba(198,241,53,0.25);border-radius:10px;color:var(--lime);font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;position:relative;}
        .cart-btn:hover{background:rgba(198,241,53,0.18);}
        .cart-badge{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:var(--rose);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;animation:cartbounce 0.3s ease;}

        .content{padding:36px;animation:fadein 0.4s ease;}

        /* HERO STRIP */
        .hero{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:28px 34px;margin-bottom:24px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:24px;}
        .hero::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--lime),var(--cyan),transparent);}
        .hero::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top right,rgba(198,241,53,0.04),transparent 60%);pointer-events:none;}
        .hero-title{font-size:28px;font-weight:900;letter-spacing:-1.2px;margin-bottom:6px;}
        .hero-title span{color:var(--lime);}
        .hero-sub{font-size:13px;color:var(--sub);font-weight:300;line-height:1.65;}
        .hero-stats{display:flex;gap:24px;flex-shrink:0;}
        .hstat{text-align:center;}
        .hstat-n{font-size:24px;font-weight:900;letter-spacing:-1px;color:var(--lime);}
        .hstat-l{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--sub);}

        /* CATEGORY PILLS */
        .cats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;}
        .cat-btn{display:flex;align-items:center;gap:6px;padding:7px 15px;border-radius:100px;font-size:12px;font-weight:700;cursor:pointer;background:var(--panel);border:1px solid var(--line);color:var(--sub);transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;}
        .cat-btn:hover{color:var(--text);border-color:rgba(255,255,255,0.12);}
        .cat-btn.active{font-weight:800;}

        /* CONTROLS */
        .controls{display:flex;gap:10px;margin-bottom:20px;align-items:center;flex-wrap:wrap;}
        .search-wrap{flex:1;min-width:200px;position:relative;}
        .search-wrap input{width:100%;padding:10px 16px 10px 38px;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all 0.2s;}
        .search-wrap input:focus{border-color:rgba(198,241,53,0.3);box-shadow:0 0 0 3px rgba(198,241,53,0.06);}
        .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--sub);pointer-events:none;}
        .select-input{padding:9px 14px;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;}
        .sort-group{display:flex;gap:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;}
        .sort-btn{padding:9px 14px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:none;color:var(--sub);font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;border-right:1px solid var(--line);}
        .sort-btn:last-child{border-right:none;}
        .sort-btn.active{color:var(--lime);background:rgba(198,241,53,0.06);}
        .stock-toggle{display:flex;align-items:center;gap:7px;padding:9px 14px;background:var(--panel);border:1px solid var(--line);border-radius:10px;cursor:pointer;white-space:nowrap;}
        .toggle-dot{width:32px;height:18px;border-radius:100px;background:rgba(255,255,255,0.08);border:1px solid var(--line);position:relative;transition:all 0.25s;}
        .toggle-dot.on{background:rgba(198,241,53,0.2);border-color:rgba(198,241,53,0.4);}
        .toggle-knob{width:12px;height:12px;border-radius:50%;background:var(--sub);position:absolute;top:2px;left:2px;transition:all 0.25s;}
        .toggle-knob.on{background:var(--lime);left:16px;}

        /* PRODUCT GRID */
        .products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;}
        .prod-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;overflow:hidden;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);display:flex;flex-direction:column;position:relative;animation:fadein 0.4s ease;}
        .prod-card:hover{border-color:rgba(198,241,53,0.15);transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,0.45);}
        .prod-stripe{height:4px;}
        .prod-img{height:140px;display:flex;align-items:center;justify-content:center;font-size:64px;background:rgba(255,255,255,0.02);border-bottom:1px solid var(--line);position:relative;}
        .prod-badge{position:absolute;top:10px;left:10px;padding:3px 10px;border-radius:100px;font-size:9px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;}
        .prod-out{position:absolute;top:10px;right:10px;padding:3px 10px;border-radius:100px;font-size:9px;font-weight:800;background:rgba(244,63,94,0.12);color:#fb7185;border:1px solid rgba(244,63,94,0.2);}
        .prod-discount{position:absolute;bottom:10px;right:10px;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:800;background:rgba(198,241,53,0.12);color:var(--lime);border:1px solid rgba(198,241,53,0.2);}
        .prod-body{padding:16px;flex:1;display:flex;flex-direction:column;}
        .prod-brand{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--sub);margin-bottom:5px;}
        .prod-name{font-size:15px;font-weight:800;letter-spacing:-0.4px;margin-bottom:6px;line-height:1.3;}
        .prod-weight{font-size:11px;color:var(--sub);margin-bottom:8px;}
        .prod-serving{font-size:12px;font-weight:600;margin-bottom:10px;color:var(--cyan);}
        .prod-facts{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;}
        .fact-pill{padding:3px 9px;border-radius:6px;font-size:10px;font-weight:600;background:rgba(255,255,255,0.04);border:1px solid var(--line);}
        .prod-footer{display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--line);margin-top:auto;}
        .prod-price{display:flex;flex-direction:column;}
        .price-main{font-size:18px;font-weight:900;letter-spacing:-0.5px;color:var(--lime);}
        .price-orig{font-size:11px;color:var(--sub);text-decoration:line-through;}
        .btn-add{padding:9px 18px;background:var(--lime);color:#000;font-size:12px;font-weight:800;border-radius:9px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;white-space:nowrap;}
        .btn-add:hover{background:#d4ff45;box-shadow:0 0 20px rgba(198,241,53,0.35);}
        .btn-add:disabled{background:rgba(255,255,255,0.06);color:var(--sub);cursor:not-allowed;box-shadow:none;}
        .btn-view-prod{padding:9px 16px;background:rgba(255,255,255,0.04);border:1px solid var(--line);color:var(--sub);font-size:12px;font-weight:600;border-radius:9px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;}
        .btn-view-prod:hover{color:var(--text);border-color:rgba(255,255,255,0.15);}
        .cart-in-card{display:flex;align-items:center;gap:6px;}
        .qty-btn{width:28px;height:28px;border-radius:7px;background:rgba(198,241,53,0.08);border:1px solid rgba(198,241,53,0.2);color:var(--lime);font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
        .qty-btn:hover{background:rgba(198,241,53,0.16);}
        .qty-num{font-size:14px;font-weight:800;width:24px;text-align:center;color:var(--lime);}

        /* OVERLAY */
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(20px);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadein 0.2s ease;}
        .modal{background:var(--panel);border:1px solid var(--line);border-radius:24px;width:100%;max-height:90vh;overflow-y:auto;animation:slideup 0.35s cubic-bezier(0.34,1.56,0.64,1);position:relative;}
        .modal::-webkit-scrollbar{width:4px;}
        .modal::-webkit-scrollbar-thumb{background:rgba(198,241,53,0.2);border-radius:2px;}

        /* PRODUCT DETAIL MODAL */
        .prod-modal{max-width:700px;}
        .prod-modal-top{padding:28px;border-bottom:1px solid var(--line);display:flex;gap:24px;align-items:flex-start;}
        .prod-modal-img{width:140px;height:140px;border-radius:16px;background:rgba(255,255,255,0.02);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:72px;flex-shrink:0;}
        .prod-modal-info{flex:1;}
        .prod-modal-body{padding:24px 28px;}
        .modal-close{position:absolute;top:18px;right:18px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.05);border:1px solid var(--line);color:var(--sub);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
        .modal-close:hover{background:rgba(255,255,255,0.1);color:var(--text);}
        .nutrition-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;}
        .nfact{background:rgba(255,255,255,0.03);border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center;}
        .nfact-val{font-size:18px;font-weight:900;letter-spacing:-0.5px;color:var(--cyan);margin-bottom:3px;}
        .nfact-lbl{font-size:9px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:var(--sub);}
        .tags-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;}
        .tag{padding:3px 10px;border-radius:6px;font-size:10px;font-weight:600;background:rgba(255,255,255,0.04);border:1px solid var(--line);color:var(--sub);}

        /* CART PANEL */
        .cart-panel{max-width:440px;width:100%;}
        .cart-header{padding:22px 24px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;}
        .cart-items{padding:16px 24px;max-height:400px;overflow-y:auto;}
        .cart-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);}
        .cart-item:last-child{border-bottom:none;}
        .cart-item-icon{width:44px;height:44px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
        .cart-item-info{flex:1;min-width:0;}
        .cart-item-name{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .cart-item-price{font-size:12px;color:var(--lime);font-weight:600;}
        .cart-footer{padding:20px 24px;border-top:1px solid var(--line);}
        .cart-total-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
        .btn-checkout{width:100%;padding:14px;background:var(--lime);color:#000;font-size:14px;font-weight:900;border-radius:12px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.25s;}
        .btn-checkout:hover{background:#d4ff45;box-shadow:0 0 28px rgba(198,241,53,0.4);}

        /* SECTION LABEL */
        .sec-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--sub);margin-bottom:14px;display:flex;align-items:center;gap:10px;}
        .sec-label::after{content:'';flex:1;height:1px;background:var(--line);}

        /* TOAST */
        .toast{position:fixed;bottom:28px;right:28px;z-index:2000;padding:13px 20px;border-radius:12px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px;animation:fadein 0.3s ease;backdrop-filter:blur(12px);}
        .toast-success{background:rgba(198,241,53,0.12);border:1px solid rgba(198,241,53,0.3);color:var(--lime);}
        .toast-error{background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.3);color:#fb7185;}

        /* EMPTY */
        .empty{text-align:center;padding:70px 20px;background:var(--panel);border:1px solid var(--line);border-radius:18px;}

        /* RESULTS ROW */
        .results-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}

        @media(max-width:900px){.sidebar{display:none}.main{margin-left:0}.content{padding:20px}.hero{flex-direction:column}.products-grid{grid-template-columns:1fr}.nutrition-grid{grid-template-columns:repeat(2,1fr)}.prod-modal-top{flex-direction:column}}
      `}</style>

      {/* TOAST */}
      {toast && <div className={`toast toast-${toastType}`}>{toast}</div>}

      {/* ══════ PRODUCT DETAIL MODAL ══════ */}
      {viewProd && !showCart && (() => {
        const cat = catMap[viewProd.category] || catMap['All'];
        const disc = discount(viewProd);
        const inCart = cart[viewProd._id] || 0;
        return (
          <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setViewProd(null);}}>
            <div className="modal prod-modal" onClick={e=>e.stopPropagation()}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:3,borderRadius:'24px 24px 0 0',background:`linear-gradient(90deg,transparent,${cat.color},transparent)`}}/>
              <button className="modal-close" onClick={()=>setViewProd(null)}>✕</button>

              <div className="prod-modal-top">
                <div className="prod-modal-img">{cat.emoji}</div>
                <div className="prod-modal-info">
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                    {viewProd.badge && <span style={{padding:'3px 10px',borderRadius:100,fontSize:9,fontWeight:800,letterSpacing:'0.5px',textTransform:'uppercase',background:`rgba(0,0,0,0.3)`,color:viewProd.badgeColor,border:`1px solid ${viewProd.badgeColor}40`}}>{viewProd.badge}</span>}
                    {!viewProd.inStock && <span style={{padding:'3px 10px',borderRadius:100,fontSize:9,fontWeight:800,background:'rgba(244,63,94,0.1)',color:'#fb7185',border:'1px solid rgba(244,63,94,0.2)'}}>Out of Stock</span>}
                  </div>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--sub)',marginBottom:4}}>{viewProd.brand}</div>
                  <div style={{fontSize:22,fontWeight:900,letterSpacing:'-0.8px',marginBottom:6,lineHeight:1.2}}>{viewProd.name}</div>
                  <StarRating rating={viewProd.rating}/>
                  <div style={{fontSize:11,color:'var(--sub)',marginTop:3,marginBottom:10}}>{viewProd.reviews?.toLocaleString()} reviews</div>
                  <div style={{fontSize:12,color:'var(--sub)',marginBottom:4}}>📦 {viewProd.weight} · {viewProd.servings} servings</div>
                  <div style={{fontSize:12,color:'var(--cyan)',fontWeight:600,marginBottom:12}}>💪 {viewProd.perServing} per serving</div>
                  <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:14}}>
                    <span style={{fontSize:26,fontWeight:900,color:'var(--lime)',letterSpacing:'-1px'}}>PKR {viewProd.price?.toLocaleString()}</span>
                    {viewProd.originalPrice && <span style={{fontSize:14,color:'var(--sub)',textDecoration:'line-through'}}>PKR {viewProd.originalPrice?.toLocaleString()}</span>}
                    {disc > 0 && <span style={{padding:'3px 9px',borderRadius:100,fontSize:11,fontWeight:800,background:'rgba(198,241,53,0.1)',color:'var(--lime)',border:'1px solid rgba(198,241,53,0.2)'}}>{disc}% OFF</span>}
                  </div>
                  {inCart > 0
                    ? <div className="cart-in-card">
                        <button className="qty-btn" onClick={()=>removeFromCart(viewProd._id)}>−</button>
                        <span className="qty-num">{inCart}</span>
                        <button className="qty-btn" onClick={()=>addToCart(viewProd._id, viewProd.name)}>+</button>
                        <span style={{fontSize:12,color:'var(--sub)',marginLeft:4}}>in cart</span>
                      </div>
                    : <button className="btn-add" style={{padding:'11px 24px'}} disabled={!viewProd.inStock}
                        onClick={()=>addToCart(viewProd._id, viewProd.name)}>
                        {viewProd.inStock ? '🛒 Add to Cart' : 'Out of Stock'}
                      </button>}
                </div>
              </div>

              <div className="prod-modal-body">
                {/* Nutrition facts */}
                <div style={{fontSize:12,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--sub)',marginBottom:10}}>Nutrition Facts per Serving</div>
                <div className="nutrition-grid">
                  {(viewProd.facts||[]).map((f:any,i:number)=>(
                    <div className="nfact" key={i}>
                      <div className="nfact-val">{f.val}</div>
                      <div className="nfact-lbl">{f.label}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <p style={{fontSize:14,color:'var(--sub)',lineHeight:1.75,fontWeight:300,marginBottom:16,padding:'14px 16px',background:'rgba(255,255,255,0.02)',borderRadius:12,border:'1px solid var(--line)'}}>{viewProd.desc}</p>

                {/* Flavors */}
                {viewProd.flavor && (
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--sub)',marginBottom:8}}>Available Flavors</div>
                    <div style={{fontSize:13,color:'var(--text)'}}>{viewProd.flavor}</div>
                  </div>
                )}

                {/* Tags */}
                <div className="tags-row">
                  {(viewProd.tags||[]).map((t:string)=><span key={t} className="tag">#{t}</span>)}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════ CART PANEL ══════ */}
      {showCart && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setShowCart(false);}}>
          <div className="modal cart-panel" onClick={e=>e.stopPropagation()}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,borderRadius:'24px 24px 0 0',background:'linear-gradient(90deg,transparent,var(--lime),transparent)'}}/>
            <div className="cart-header">
              <div>
                <div style={{fontSize:17,fontWeight:900,letterSpacing:'-0.5px'}}>🛒 Your Cart</div>
                <div style={{fontSize:12,color:'var(--sub)',marginTop:2}}>{cartCount} item{cartCount!==1?'s':''}</div>
              </div>
              <button className="modal-close" style={{position:'relative',top:0,right:0}} onClick={()=>setShowCart(false)}>✕</button>
            </div>

            {cartItems.length === 0
              ? <div style={{padding:'48px 24px',textAlign:'center'}}>
                  <div style={{fontSize:48,marginBottom:12}}>🛒</div>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Cart is empty</div>
                  <div style={{fontSize:13,color:'var(--sub)'}}>Add supplements to get started.</div>
                  <button style={{marginTop:16,padding:'10px 22px',background:'rgba(198,241,53,0.08)',border:'1px solid rgba(198,241,53,0.2)',borderRadius:10,color:'var(--lime)',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}} onClick={()=>setShowCart(false)}>Browse Supplements</button>
                </div>
              : <>
                  <div className="cart-items">
                    {cartItems.map((item:any) => {
                      const cat = catMap[item.category] || catMap['All'];
                      return (
                        <div key={item._id} className="cart-item">
                          <div className="cart-item-icon">{cat.emoji}</div>
                          <div className="cart-item-info">
                            <div className="cart-item-name">{item.name}</div>
                            <div style={{fontSize:10,color:'var(--sub)',marginTop:2}}>{item.brand} · {item.weight}</div>
                            <div className="cart-item-price">PKR {item.price?.toLocaleString()} × {item.qty} = PKR {(item.price*item.qty).toLocaleString()}</div>
                          </div>
                          <div className="cart-in-card">
                            <button className="qty-btn" onClick={()=>removeFromCart(item._id)}>−</button>
                            <span className="qty-num">{item.qty}</span>
                            <button className="qty-btn" onClick={()=>addToCart(item._id, item.name)}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="cart-footer">
                    {/* Summary */}
                    <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid var(--line)',borderRadius:12,padding:'14px 16px',marginBottom:14}}>
                      {[
                        {l:'Subtotal',     v:`PKR ${cartTotal.toLocaleString()}`},
                        {l:'Shipping',     v:cartTotal >= 5000 ? '🎉 Free' : 'PKR 250'},
                        {l:'Discount',     v:cartTotal >= 10000 ? '-PKR 500' : '—'},
                      ].map(r=>(
                        <div key={r.l} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}>
                          <span style={{color:'var(--sub)'}}>{r.l}</span><span style={{fontWeight:600}}>{r.v}</span>
                        </div>
                      ))}
                      <div style={{display:'flex',justifyContent:'space-between',paddingTop:10,borderTop:'1px solid var(--line)'}}>
                        <span style={{fontWeight:800,fontSize:15}}>Total</span>
                        <span style={{fontWeight:900,fontSize:18,color:'var(--lime)',letterSpacing:'-0.5px'}}>
                          PKR {(cartTotal + (cartTotal >= 5000 ? 0 : 250) - (cartTotal >= 10000 ? 500 : 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {cartTotal < 5000 && <div style={{fontSize:11,color:'var(--sub)',marginBottom:10,textAlign:'center'}}>Add PKR {(5000-cartTotal).toLocaleString()} more for free shipping 🚚</div>}
                    <button className="btn-checkout" onClick={()=>{showToast('🎉 Order placed! We\'ll contact you soon.');setCart({});setShowCart(false);}}>
                      ✓ Place Order — PKR {(cartTotal + (cartTotal >= 5000 ? 0 : 250) - (cartTotal >= 10000 ? 500 : 0)).toLocaleString()}
                    </button>
                  </div>
                </>}
          </div>
        </div>
      )}

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
            {icon:'📰',label:'Articles',      href:'/articles'},
            {icon:'💊',label:'Supplements',   href:'/supplements', active:true},
            {icon:'👤',label:'Profile',       href:'/profile'},
          ].map(n=>(
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
            <div className="topbar-title">Supplements Store</div>
            <div className="topbar-right">
              <a className="back-btn" href="/dashboard">← Dashboard</a>
              <button className="cart-btn" onClick={()=>setShowCart(true)}>
                🛒 Cart
                {cartCount > 0 && <span style={{fontSize:12,fontWeight:800,background:'rgba(0,0,0,0.3)',padding:'1px 6px',borderRadius:100,marginLeft:2}}>{cartCount}</span>}
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
            </div>
          </div>

          <div className="content">
            {/* HERO */}
            <div className="hero">
              <div>
                <h1 className="hero-title">Premium <span>Supplements</span> 💊</h1>
                <p className="hero-sub">Genuine, lab-tested supplements from the world's top brands. Fast delivery. Free shipping on orders over PKR 5,000.</p>
              </div>
              <div className="hero-stats">
                <div className="hstat"><div className="hstat-n">{products.length}+</div><div className="hstat-l">Products</div></div>
                <div style={{width:1,background:'var(--line)'}}/>
                <div className="hstat"><div className="hstat-n">{BRANDS.length-1}</div><div className="hstat-l">Brands</div></div>
                <div style={{width:1,background:'var(--line)'}}/>
                <div className="hstat"><div className="hstat-n">Free</div><div className="hstat-l">Shipping 5k+</div></div>
              </div>
            </div>

            {/* CATEGORY PILLS */}
            <div className="cats">
              {CATS.map(c=>(
                <button key={c.key} className={`cat-btn ${category===c.key?'active':''}`}
                  style={category===c.key?{background:c.bg,color:c.color,borderColor:c.border}:{}}
                  onClick={()=>setCategory(c.key)}>
                  <span>{c.emoji}</span>{c.label}
                  <span style={{fontSize:10,background:'rgba(255,255,255,0.05)',padding:'1px 5px',borderRadius:100}}>
                    {c.key==='All'?products.length:products.filter(p=>p.category===c.key).length}
                  </span>
                </button>
              ))}
            </div>

            {/* CONTROLS */}
            <div className="controls">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input placeholder="Search supplements, brands, ingredients…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <select className="select-input" value={brand} onChange={e=>setBrand(e.target.value)}>
                {BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
              <div className="sort-group">
                {([['popular','🔥 Popular'],['rating','⭐ Rating'],['price-asc','💰 Low→High'],['price-desc','💰 High→Low']] as const).map(([k,l])=>(
                  <button key={k} className={`sort-btn ${sort===k?'active':''}`} onClick={()=>setSort(k as any)}>{l}</button>
                ))}
              </div>
              <div className="stock-toggle" onClick={()=>setInStockOnly(v=>!v)} style={{cursor:'pointer',userSelect:'none'}}>
                <div className={`toggle-dot ${inStockOnly?'on':''}`}><div className={`toggle-knob ${inStockOnly?'on':''}`}/></div>
                <span style={{fontSize:12,fontWeight:600,color:inStockOnly?'var(--lime)':'var(--sub)'}}>In Stock</span>
              </div>
            </div>

            {/* RESULTS */}
            <div className="results-row">
              <span style={{fontSize:13,color:'var(--sub)'}}>{filtered.length} product{filtered.length!==1?'s':''} found</span>
              {(category!=='All'||brand!=='All Brands'||search||inStockOnly) &&
                <button style={{fontSize:12,color:'var(--rose)',background:'none',border:'none',cursor:'pointer',fontWeight:600,fontFamily:'Plus Jakarta Sans,sans-serif'}}
                  onClick={()=>{setCategory('All');setBrand('All Brands');setSearch('');setInStockOnly(false);}}>✕ Clear filters</button>}
            </div>

            {/* PRODUCTS GRID */}
            {filtered.length===0
              ? <div className="empty"><div style={{fontSize:48,marginBottom:12}}>💊</div><div style={{fontSize:18,fontWeight:800,marginBottom:6}}>No products found</div><div style={{fontSize:13,color:'var(--sub)'}}>Try different filters.</div></div>
              : <>
                  <div className="sec-label">💊 Supplements</div>
                  <div className="products-grid">
                    {filtered.map((prod:any)=>{
                      const cat = catMap[prod.category] || catMap['All'];
                      const inCart = cart[prod._id] || 0;
                      const disc = discount(prod);
                      return (
                        <div key={prod._id} className="prod-card">
                          <div className="prod-stripe" style={{background:`linear-gradient(90deg,${cat.color},transparent)`}}/>
                          <div className="prod-img" onClick={()=>setViewProd(prod)} style={{cursor:'pointer'}}>
                            {cat.emoji}
                            {prod.badge && <span className="prod-badge" style={{background:`rgba(0,0,0,0.5)`,color:prod.badgeColor,border:`1px solid ${prod.badgeColor}50`}}>{prod.badge}</span>}
                            {!prod.inStock && <span className="prod-out">Out of Stock</span>}
                            {disc > 0 && prod.inStock && <span className="prod-discount">-{disc}%</span>}
                          </div>
                          <div className="prod-body">
                            <div className="prod-brand">{prod.brand}</div>
                            <div className="prod-name" onClick={()=>setViewProd(prod)} style={{cursor:'pointer'}}>{prod.name}</div>
                            <div className="prod-weight">📦 {prod.weight} · {prod.servings} servings</div>
                            <div className="prod-serving">💪 {prod.perServing}</div>
                            <StarRating rating={prod.rating}/>
                            <div style={{fontSize:10,color:'var(--sub)',marginTop:2,marginBottom:10}}>{prod.reviews?.toLocaleString()} reviews</div>
                            <div className="prod-facts">
                              {(prod.facts||[]).slice(0,3).map((f:any,i:number)=>(
                                <span key={i} className="fact-pill">{f.label}: <strong style={{color:'var(--text)'}}>{f.val}</strong></span>
                              ))}
                            </div>
                            <div className="prod-footer">
                              <div className="prod-price">
                                <span className="price-main">PKR {prod.price?.toLocaleString()}</span>
                                {prod.originalPrice && <span className="price-orig">PKR {prod.originalPrice?.toLocaleString()}</span>}
                              </div>
                              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                                <button className="btn-view-prod" onClick={()=>setViewProd(prod)}>Details</button>
                                {inCart > 0
                                  ? <div className="cart-in-card">
                                      <button className="qty-btn" onClick={()=>removeFromCart(prod._id)}>−</button>
                                      <span className="qty-num">{inCart}</span>
                                      <button className="qty-btn" onClick={()=>addToCart(prod._id, prod.name)}>+</button>
                                    </div>
                                  : <button className="btn-add" disabled={!prod.inStock} onClick={()=>addToCart(prod._id, prod.name)}>
                                      {prod.inStock ? '+ Cart' : 'N/A'}
                                    </button>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>}
          </div>
        </main>
      </div>
    </>
  );
}