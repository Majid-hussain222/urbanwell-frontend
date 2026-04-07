'use client'

import React, { useEffect, useMemo, useState } from 'react'
import api from '@/app/lib/api'

type Coords = { lat: number; lng: number }

type OsmGym = {
  source: 'osm'
  osmId: string
  name: string
  address?: string
  phone?: string | null
  website?: string | null
  location: { lat: number; lng: number }
  distanceKm?: number | null
}

type DiscoverPayload = {
  radiusKm: number
  center: Coords
  partnerGyms: any[]
  nearbyGyms: OsmGym[]
  totalNearby: number
}

function haversineKm(a: Coords, b: Coords) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s1 = Math.sin(dLat / 2) ** 2
  const s2 = Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * (Math.sin(dLng / 2) ** 2)
  const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)))
  return R * c
}

function shortName(name: string) {
  const s = String(name || '').trim()
  if (!s) return 'Gym'
  const parts = s.split(' ').filter(Boolean)
  return parts.slice(0, 2).join(' ')
}

function getBrowserLocation(timeoutMs = 9000): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'))
    const t = setTimeout(() => reject(new Error('Location timeout')), timeoutMs)
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(t); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }) },
      (err) => { clearTimeout(t); reject(err) },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    )
  })
}

function osmDirectionsUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
}

function normalizePhone(p: any) {
  const s = String(p || '').trim()
  if (!s) return ''
  return s.replace(/\s+/g, '')
}

const PARTNER_GYMS_DATA = [
  { _id: 'pg1', name: 'Iron District', location: 'Gulberg III, Lahore', city: 'Lahore', lat: 31.5204, lng: 74.3587, rating: 4.9, reviews: 312, members: '2.4K', initials: 'ID', gradient: 'linear-gradient(135deg,#c6f135,#00d4ff)', amenities: ['Olympic Pool','CrossFit Zone','Sauna & Steam','Boxing Ring','Juice Bar','Parking'], hours: '5AM – 12AM', featured: true, monthlyFee: 7999, description: 'Premium strength & recovery facility with Olympic-grade equipment and athlete coaching.' },
  { _id: 'pg2', name: 'FitHub Premium', location: 'DHA Phase 5, Lahore', city: 'Lahore', lat: 31.4697, lng: 74.4066, rating: 4.8, reviews: 248, members: '1.8K', initials: 'FH', gradient: 'linear-gradient(135deg,#00d4ff,#8b5cf6)', amenities: ['Cardio Theater','Personal Training','Yoga Studio','Smoothie Bar','Group Classes'], hours: '6AM – 11PM', featured: true, monthlyFee: 6499, description: 'Modern fitness club with group classes, personal training, and a rooftop yoga deck.' },
  { _id: 'pg3', name: 'PowerHouse Gym', location: 'Johar Town, Lahore', city: 'Lahore', lat: 31.4610, lng: 74.2710, rating: 4.7, reviews: 189, members: '1.2K', initials: 'PH', gradient: 'linear-gradient(135deg,#f43f5e,#f59e0b)', amenities: ['Heavy Weights','MMA Cage','Recovery Room','Parking','Supplements Shop'], hours: '5AM – 11PM', featured: false, monthlyFee: 4999, description: 'No-frills powerlifting gym with competition-grade bars, platforms, and coaching.' },
  { _id: 'pg4', name: 'Zenith Fitness', location: 'Model Town, Lahore', city: 'Lahore', lat: 31.4800, lng: 74.3200, rating: 4.8, reviews: 156, members: '950', initials: 'ZF', gradient: 'linear-gradient(135deg,#8b5cf6,#c6f135)', amenities: ['Pilates Studio','Spin Class','Cafe','Kids Area','Locker Rooms'], hours: '6AM – 10PM', featured: false, monthlyFee: 5499, description: 'Family-friendly fitness center with Pilates, spin, and a wellness cafe.' },
  { _id: 'pg5', name: 'Titan Strength Lab', location: 'Bahria Town, Lahore', city: 'Lahore', lat: 31.3620, lng: 74.1800, rating: 4.9, reviews: 203, members: '1.5K', initials: 'TS', gradient: 'linear-gradient(135deg,#f59e0b,#f43f5e)', amenities: ['Strongman Area','Deadlift Platforms','Cold Plunge','Coaching','24/7 Access'], hours: '24/7', featured: true, monthlyFee: 8999, description: '24/7 strongman & powerlifting facility with cold plunge recovery and elite coaching.' },
  { _id: 'pg6', name: 'Elevate Studio', location: 'Cantt, Lahore', city: 'Lahore', lat: 31.5120, lng: 74.3680, rating: 4.6, reviews: 134, members: '780', initials: 'ES', gradient: 'linear-gradient(135deg,#00d4ff,#c6f135)', amenities: ['Group Classes','TRX','Functional Zone','Locker Rooms','Parking'], hours: '6AM – 10PM', featured: false, monthlyFee: 3999, description: 'Affordable functional training studio with TRX, group HIIT, and coached sessions.' },
]

const SUBSCRIPTION_PLANS = [
  {
    id: 'starter', name: 'Starter', tagline: 'Perfect for beginners', icon: '🏋️', color: '#00d4ff', monthlyPrice: 2999,
    features: ['Access to 2 partner gyms','Basic AI workout plans','1 nutritionist consultation/mo','Community chat access','Progress tracking dashboard'],
    excluded: ['AI meal plans','Dietitian consultations','Personal trainer sessions','Premium gym access','Supplement discounts'],
    popular: false,
  },
  {
    id: 'pro', name: 'Pro', tagline: 'Most popular choice', icon: '⚡', color: '#c6f135', monthlyPrice: 5999,
    features: ['Access to 4 partner gyms','Unlimited AI workout plans','Unlimited AI meal plans','2 nutritionist consultations/mo','1 dietitian consultation/mo','Personal trainer matching','Priority chat support','Advanced progress analytics','PDF meal plan downloads'],
    excluded: ['Unlimited gym access','Home visit training'],
    popular: true,
  },
  {
    id: 'elite', name: 'Elite', tagline: 'Unlimited everything', icon: '👑', color: '#8b5cf6', monthlyPrice: 9999,
    features: ['Unlimited access to ALL gyms','Unlimited AI workout & meal plans','Unlimited nutritionist access','Unlimited dietitian access','4 personal trainer sessions/mo','Home visit training available','VIP booking & priority slots','Body composition analysis','Supplement discounts (20%)','2 guest passes per month'],
    excluded: [],
    popular: false,
  },
]

const OFFERS = [
  { id: 'o1', title: 'Free 7-Day Dietitian Meal Plan', desc: 'Get a fully personalized 7-day meal plan from a certified clinical dietitian — absolutely free with Pro or Elite.', badge: 'FREE', color: '#c6f135', icon: '🩺', plans: ['Pro','Elite'] },
  { id: 'o2', title: 'Free Nutritionist Session', desc: 'Your first nutritionist consultation at zero cost. Full diet assessment, macro breakdown, and supplement advice included.', badge: 'FREE', color: '#00d4ff', icon: '🥗', plans: ['Pro','Elite'] },
  { id: 'o3', title: '50% Off Gym Joining Fee', desc: 'All UrbanWell subscribers skip the standard joining fee at any partner gym. Walk in and start training immediately.', badge: '50% OFF', color: '#f59e0b', icon: '📍', plans: ['Starter','Pro','Elite'] },
  { id: 'o4', title: 'Unlimited AI Meal + Workout Plans', desc: 'AI-generated personalized meal plans and workout routines updated weekly — powered by advanced LLM technology.', badge: 'UNLIMITED', color: '#8b5cf6', icon: '🤖', plans: ['Pro','Elite'] },
  { id: 'o5', title: '20% Off All Supplements', desc: 'Exclusive discount on our full supplement range — whey protein, creatine, multivitamins, omega-3, and pre-workout.', badge: '20% OFF', color: '#f43f5e', icon: '💊', plans: ['Elite'] },
  { id: 'o6', title: 'Free Guest Passes (2/month)', desc: 'Bring a friend or family member to any partner gym — 2 free guest passes every month with your Elite membership.', badge: 'FREE', color: '#00d4ff', icon: '🎟️', plans: ['Elite'] },
  { id: 'o7', title: 'VIP Priority Booking', desc: 'Skip the queue. Elite members get priority time slots for trainers, nutritionists, and dietitians before anyone else.', badge: 'VIP', color: '#c6f135', icon: '⚡', plans: ['Elite'] },
  { id: 'o8', title: 'First Month 30% Off', desc: 'New subscribers get 30% off their first month on any plan. Limited time offer — start your wellness journey now.', badge: '30% OFF', color: '#f59e0b', icon: '🎉', plans: ['Starter','Pro','Elite'] },
]

const mockPackages: any[] = [
  { _id: 'gp_hm_fitness', name: 'HM Fitness — Jahanzeb Block', type: 'Strength', location: 'Jahanzeb Block, Lahore', city: 'Lahore', price: 4999, currency: 'PKR', rating: 4.6, reviewsCount: 122, amenities: ['Free Weights', 'Strength Machines', 'Personal Training', 'Parking'], description: 'A focused strength gym with clean equipment, coached sessions, and a serious training vibe.', coords: { lat: 31.5204, lng: 74.3587 } },
  { _id: 'gp_bar_brothers', name: 'Signature by Bar Brothers', type: 'HIIT', location: 'Lahore (Signature Studio)', city: 'Lahore', price: 6999, currency: 'PKR', rating: 4.8, reviewsCount: 210, amenities: ['Coach-led HIIT', 'Calisthenics', 'Functional Zone', 'Recovery'], description: 'High-intensity functional workouts inspired by calisthenics and performance training.', coords: { lat: 31.535, lng: 74.325 } },
  { _id: 'gp_1', name: 'UrbanWell Prime — Downtown Hub', type: 'Strength', location: 'Gulberg, Lahore', city: 'Lahore', price: 6999, currency: 'PKR', rating: 4.8, reviewsCount: 312, amenities: ['24/7 Access', 'Power Racks', 'Free Weights', 'Sauna', 'Locker Room'], description: 'A premium strength-first gym with modern equipment, spacious racks, and recovery add-ons.', coords: { lat: 31.5204, lng: 74.3587 } },
  { _id: 'gp_2', name: 'Cardio+ Riverside Studio', type: 'Cardio', location: 'DHA Phase 6, Lahore', city: 'Lahore', price: 5499, currency: 'PKR', rating: 4.6, reviewsCount: 198, amenities: ['Treadmills', 'Spin Studio', 'HIIT Zone', 'Showers', 'Parking'], description: 'Cardio-focused studio built for consistency: spin, HIIT, and performance tracking.', coords: { lat: 31.4697, lng: 74.4116 } },
  { _id: 'gp_3', name: 'ZenFlow Yoga & Mobility', type: 'Yoga', location: 'F-11, Islamabad', city: 'Islamabad', price: 4999, currency: 'PKR', rating: 4.9, reviewsCount: 144, amenities: ['Heated Yoga', 'Mobility Classes', 'Meditation', 'Tea Bar'], description: 'Yoga, breathwork, and mobility sessions designed for stress relief and posture.', coords: { lat: 33.6844, lng: 73.0479 } },
  { _id: 'gp_4', name: 'IronWorks Athlete Lab', type: 'HIIT', location: 'Clifton, Karachi', city: 'Karachi', price: 7999, currency: 'PKR', rating: 4.7, reviewsCount: 265, amenities: ['Sled Track', 'Assault Bikes', 'Coach-led HIIT', 'Body Scan'], description: 'Performance training with structured HIIT blocks and athlete-grade conditioning.', coords: { lat: 24.8138, lng: 67.0299 } },
  { _id: 'gp_5', name: 'FlexFit Family Club', type: 'Mixed', location: 'Johar Town, Lahore', city: 'Lahore', price: 3999, currency: 'PKR', rating: 4.4, reviewsCount: 121, amenities: ['Group Classes', 'Basic Strength', 'Cardio', 'Kids Zone'], description: 'Affordable memberships with group sessions, friendly coaches, and wellness add-ons.', coords: { lat: 31.468, lng: 74.272 } },
  { _id: 'gp_6', name: 'AquaPulse Swim & Recovery', type: 'Recovery', location: 'Bahria Town, Rawalpindi', city: 'Rawalpindi', price: 8999, currency: 'PKR', rating: 4.8, reviewsCount: 89, amenities: ['Pool', 'Steam Room', 'Physio Corner', 'Stretch Zone'], description: 'Swim lanes + recovery protocols. Perfect for low-impact conditioning and rehab.', coords: { lat: 33.5651, lng: 73.1471 } },
]

export default function GymPackagesPage() {
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<any[]>([])
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<'packages' | 'gyms' | 'offers' | 'subscriptions'>('packages')
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('All')
  const [activeCity, setActiveCity] = useState('All')
  const [maxPrice, setMaxPrice] = useState(10000)

  const [selected, setSelected] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitOk, setSubmitOk] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')
  const [submitErr, setSubmitErr] = useState('')
  const [membership, setMembership] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly')
  const [startDate, setStartDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('18:00')
  const [notes, setNotes] = useState('')

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const [mapOpen, setMapOpen] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoErr, setGeoErr] = useState('')
  const [userLoc, setUserLoc] = useState<Coords | null>(null)
  const [radiusKm, setRadiusKm] = useState(10)

  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoverErr, setDiscoverErr] = useState('')
  const [partnerGyms, setPartnerGyms] = useState<any[]>([])
  const [osmGyms, setOsmGyms] = useState<any[]>([])

  const [leaf, setLeaf] = useState<any>(null)

  const fallbackLoc: Coords = { lat: 31.5204, lng: 74.3587 }
  const mapCenter = userLoc || fallbackLoc

  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await api.get('/gym-packages')
        const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : []
        const normalized = (arr || []).map((p: any, i: number) => ({
          _id: p?._id || p?.id || `api_gp_${i}`,
          name: p?.name || p?.title || 'Gym Package',
          type: p?.type || p?.category || 'Mixed',
          location: p?.location || p?.address || p?.area || '—',
          city: p?.city || '—',
          price: Number(p?.price ?? 0) || 0,
          currency: p?.currency || 'PKR',
          rating: Number(p?.rating ?? 4.7),
          reviewsCount: Number(p?.reviewsCount ?? p?.reviews ?? 120),
          amenities: Array.isArray(p?.amenities) ? p.amenities : ['Modern Equipment', 'Trainers', 'Locker Room'],
          description: p?.description || 'A modern gym package.',
          coords: p?.coords || null,
        }))
        if (mounted) setPackages(normalized?.length ? normalized : mockPackages)
      } catch {
        if (mounted) { setError('Showing featured packages.'); setPackages(mockPackages) }
      } finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const types = useMemo(() => {
    const set = new Set<string>(['All'])
    packages.forEach((p: any) => set.add(p?.type || 'Mixed'))
    return Array.from(set)
  }, [packages])

  const cities = useMemo(() => {
    const set = new Set<string>(['All'])
    packages.forEach((p: any) => set.add(p?.city || '—'))
    return Array.from(set)
  }, [packages])

  const priceCeil = useMemo(() => {
    const all = packages.map((p: any) => Number(p?.price || 0))
    return Math.max(Math.ceil((all.length ? Math.max(...all) : 10000) / 1000) * 1000, 3000)
  }, [packages])

  useEffect(() => { setMaxPrice(priceCeil) }, [priceCeil])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return packages.filter((p: any) => {
      const s = !q || [p?.name, p?.location, p?.type, p?.city].some(v => String(v || '').toLowerCase().includes(q))
      return s && (activeType === 'All' || p?.type === activeType) && (activeCity === 'All' || p?.city === activeCity) && Number(p?.price || 0) <= maxPrice
    })
  }, [packages, search, activeType, activeCity, maxPrice])

  async function fetchDiscover(center: Coords, rKm: number) {
    setDiscoverErr(''); setDiscoverLoading(true)
    try {
      const res = await api.get('/discover/gyms', { params: { lat: center.lat, lng: center.lng, radiusKm: rKm } })
      const data: any = res?.data
      setPartnerGyms(Array.isArray(data?.partnerGyms) ? data.partnerGyms : [])
      setOsmGyms(Array.isArray(data?.nearbyGyms) ? data.nearbyGyms : [])
    } catch (e: any) {
      setDiscoverErr(e?.response?.data?.message || 'Failed to load nearby gyms.')
    } finally { setDiscoverLoading(false) }
  }

  useEffect(() => { if (mapOpen) fetchDiscover(userLoc || fallbackLoc, radiusKm) }, [radiusKm, mapOpen])

  const nearbyGyms = useMemo(() => {
    const partner = (partnerGyms || []).map((g: any) => {
      const lat = g?.location?.coordinates?.[1]; const lng = g?.location?.coordinates?.[0]
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return { __kind: 'partner', _id: String(g._id), name: g?.name || 'Partner Gym', locationText: g?.address || '—', phone: g?.phone, website: g?.website, distanceKm: typeof g?.distanceKm === 'number' ? g.distanceKm : Number(haversineKm(mapCenter, { lat, lng }).toFixed(2)), coords: { lat, lng }, packages: Array.isArray(g?.packages) ? g.packages : [], raw: g }
    }).filter(Boolean) as any[]
    const osm = (osmGyms || []).map((g: any) => {
      const lat = g?.location?.lat; const lng = g?.location?.lng
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return { __kind: 'osm', _id: String(g?.osmId || `${lat}_${lng}`), name: g?.name || 'Gym', locationText: g?.address || '—', phone: g?.phone, website: g?.website, distanceKm: typeof g?.distanceKm === 'number' ? g.distanceKm : Number(haversineKm(mapCenter, { lat, lng }).toFixed(2)), coords: { lat, lng }, raw: g }
    }).filter(Boolean) as any[]
    return [...partner, ...osm].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
  }, [partnerGyms, osmGyms, mapCenter])

  function openEnroll(p: any) {
    setSelected(p); setModalOpen(true); setSubmitting(false); setSubmitOk(false); setSubmitMsg(''); setSubmitErr('')
    setMembership('Monthly'); setStartDate(''); setPreferredTime('18:00'); setNotes('')
  }
  function closeEnroll() { setModalOpen(false); setSelected(null) }

  async function handleEnroll() {
    if (!selected) return
    setSubmitting(true); setSubmitErr('')
    try {
      await new Promise(r => setTimeout(r, 900))
      setSubmitOk(true); setSubmitMsg(`Enrolled in ${membership} plan starting ${startDate || 'soon'}!`)
      showToast('🎉 Enrollment successful!')
    } catch { setSubmitErr('Something went wrong.') }
    finally { setSubmitting(false) }
  }

  async function openMap() {
    setMapOpen(true); setGeoErr('')
    if (!leaf) {
      try {
        const RL = await import('react-leaflet'); const L = await import('leaflet')
        const icon = new L.Icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] })
        setLeaf({ MapContainer: RL.MapContainer, TileLayer: RL.TileLayer, Marker: RL.Marker, Popup: RL.Popup, Circle: RL.Circle, icon })
      } catch { setGeoErr('Map failed to load.') }
    }
    if (!userLoc) {
      setGeoLoading(true)
      try { const loc = await getBrowserLocation(9000); setUserLoc(loc); await fetchDiscover(loc, radiusKm) }
      catch { setGeoErr('Location denied. Using Lahore.'); await fetchDiscover(fallbackLoc, radiusKm) }
      finally { setGeoLoading(false) }
    } else { await fetchDiscover(userLoc, radiusKm) }
  }

  async function useMyLocation() {
    setGeoErr(''); setGeoLoading(true)
    try { const loc = await getBrowserLocation(9000); setUserLoc(loc); await fetchDiscover(loc, radiusKm) }
    catch { setGeoErr('Could not access location.') }
    finally { setGeoLoading(false) }
  }

  const getSubPrice = (monthly: number) => billingCycle === 'yearly' ? Math.round(monthly * 12 * 0.8) : monthly

  return (
    <div className="uw-root">
      <Noise />
      <style>{leafletCss}</style>
      <div className="uw-page">
        <header className="uw-nav">
          <div className="uw-navInner">
            <a className="brand" href="/" style={{textDecoration:'none',color:'inherit'}}>
              <div className="brandMark">U</div>
              <div className="brandText"><div className="brandName"><em style={{fontStyle:'normal',color:'var(--lime)'}}>Urban</em>Well</div></div>
            </a>
            <div className="navActions">
              <a className="navLink" href="/trainers">Trainers</a>
              <a className="navLink" href="/nutritionists">Nutritionists</a>
              <a className="navLink" href="/dietitians">Dietitians</a>
              <a className="navLink" href="/bookings">My Bookings</a>
              <a className="navCta" href="/dashboard">⚡ Dashboard</a>
            </div>
          </div>
        </header>

        <main className="uw-main">
          {toast && <div className="toastFloat">{toast}</div>}

          <section className="heroSection">
            <div className="heroMesh" />
            <div className="heroContent">
              <div className="heroEyebrow"><span className="heroDot" />Gym Packages & Subscriptions</div>
              <h1 className="heroTitle">One membership.<br/><span className="lime">Every gym.</span> <span className="heroStroke">Zero limits.</span></h1>
              <p className="heroSub">Access <strong>{PARTNER_GYMS_DATA.length} premium partner gyms</strong> across Lahore. Get free dietitian & nutritionist consultations, AI-powered plans, and exclusive member discounts.</p>
            </div>
          </section>

          <div className="tabsWrap">
            <div className="tabs">
              {([
                { id: 'packages' as const, label: 'Gym Packages', icon: '🏋️' },
                { id: 'subscriptions' as const, label: 'Subscriptions', icon: '💎' },
                { id: 'gyms' as const, label: 'Partner Gyms', icon: '📍', badge: String(PARTNER_GYMS_DATA.length) },
                { id: 'offers' as const, label: 'Offers & Perks', icon: '🎁', badge: String(OFFERS.length) },
              ] as const).map(t => (
                <button key={t.id} className={`tab ${activeTab === t.id ? 'tabActive' : ''}`} onClick={() => setActiveTab(t.id)}>
                  {t.icon} {t.label}
                  {'badge' in t && t.badge && <span className="tabBadge">{t.badge}</span>}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'packages' && (
            <>
              <section className="uw-toolbar">
                <div className="searchWrap">
                  <span className="searchIcon">🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search gyms, locations, types…" className="searchInput" />
                  {search && <button className="searchClear" onClick={() => setSearch('')}>✕</button>}
                </div>
                <div className="filters">
                  <div className="chipRow">
                    {types.slice(0, 8).map(t => (
                      <button key={t} onClick={() => setActiveType(t)} className={`chip ${activeType === t ? 'chipActive' : ''}`}>{t}</button>
                    ))}
                  </div>
                  <div className="selectRow">
                    <div className="selectWrap">
                      <div className="selectLabel">City</div>
                      <select value={activeCity} onChange={e => setActiveCity(e.target.value)} className="select">
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="selectWrap">
                      <div className="selectLabel">Max Price (PKR)</div>
                      <div className="rangeWrap">
                        <input type="range" min={0} max={priceCeil} step={500} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="range" />
                        <div className="rangeValue">{maxPrice.toLocaleString()}</div>
                      </div>
                    </div>
                    <button className="ghostBtn" onClick={() => { setSearch(''); setActiveType('All'); setActiveCity('All'); setMaxPrice(priceCeil) }}>Reset</button>
                  </div>
                </div>
              </section>

              <div className="resultBar">
                <span>Showing <strong className="lime">{filtered.length}</strong> packages</span>
                <button className="mapOpenBtn" onClick={openMap}>📍 Open Live Map</button>
              </div>

              {loading ? (
                <section className="uw-loading"><div className="spinner" /><div className="loadingText">Loading gym packages…</div></section>
              ) : (
                <section className="uw-grid">
                  {filtered.map((p: any) => (
                    <article key={p._id} className="card">
                      <div className="cardTop">
                        <div className="cardBadge">{p.type}</div>
                        <div className="cardRating">{Number(p.rating).toFixed(1)} <span className="star">★</span> <span className="rc">({p.reviewsCount})</span></div>
                      </div>
                      <h3 className="cardTitle">{p.name}</h3>
                      <div className="cardMeta">📍 {p.location}</div>
                      <p className="cardDesc">{p.description}</p>
                      <div className="cardAmenities">
                        {(p.amenities || []).slice(0, 4).map((a: string, i: number) => <span key={i} className="amenityTag">{a}</span>)}
                      </div>
                      <div className="cardBottom">
                        <div><div className="priceLabel">Starting</div><div className="priceValue">{Number(p.price).toLocaleString()} <span className="cur">PKR</span></div></div>
                        <button className="primaryBtn" onClick={() => openEnroll(p)}>Enroll →</button>
                      </div>
                    </article>
                  ))}
                  {!filtered.length && <div className="empty"><div className="emptyIcon">🧭</div><div className="emptyTitle">No matches found</div><div className="emptySub">Try changing filters.</div></div>}
                </section>
              )}
            </>
          )}

          {activeTab === 'subscriptions' && (
            <>
              <div className="billingToggle">
                <span className={`billingLabel ${billingCycle === 'monthly' ? 'active' : ''}`} onClick={() => setBillingCycle('monthly')}>Monthly</span>
                <div className={`toggleTrack ${billingCycle === 'yearly' ? 'on' : ''}`} onClick={() => setBillingCycle(b => b === 'monthly' ? 'yearly' : 'monthly')}>
                  <div className="toggleThumb" />
                </div>
                <span className={`billingLabel ${billingCycle === 'yearly' ? 'active' : ''}`} onClick={() => setBillingCycle('yearly')}>Yearly</span>
                {billingCycle === 'yearly' && <span className="saveBadge">Save 20%</span>}
              </div>

              <div className="pricingGrid">
                {SUBSCRIPTION_PLANS.map((pkg, i) => (
                  <div className={`priceCard ${pkg.popular ? 'popular' : ''}`} key={pkg.id}>
                    {pkg.popular && <div className="popularTag">⚡ Most Popular</div>}
                    <div className="pkgIcon">{pkg.icon}</div>
                    <div className="pkgName" style={{ color: pkg.color }}>{pkg.name}</div>
                    <div className="pkgTagline">{pkg.tagline}</div>
                    <div className="pkgPriceRow">
                      <span className="pkgCurrency">PKR</span>
                      <span className="pkgAmount" style={{ color: pkg.color }}>{getSubPrice(pkg.monthlyPrice).toLocaleString()}</span>
                    </div>
                    <div className="pkgPeriod">{billingCycle === 'yearly' ? 'per year' : 'per month'}</div>
                    <div className="pkgDivider" />
                    <ul className="pkgFeatures">
                      {pkg.features.map(f => <li key={f}><span className="fCheck">✓</span> {f}</li>)}
                      {pkg.excluded.map(f => <li key={f} className="fExcluded"><span className="fCross">✕</span> {f}</li>)}
                    </ul>
                    <button className={`subBtn ${pkg.popular ? 'subBtnPrimary' : 'subBtnSecondary'}`} onClick={() => showToast(`🎉 ${pkg.name} plan selected!`)}>
                      {pkg.popular ? '⚡ Get Pro Now' : `Choose ${pkg.name}`}
                    </button>
                  </div>
                ))}
              </div>

              <div className="subCta">
                <div className="subCtaInner">
                  <div className="subCtaTitle">All plans include</div>
                  <div className="subCtaGrid">
                    {['Progress Tracking','Community Chat','Workout Logging','Water & Calorie Tracker','Leaderboard Access','PDF Exports'].map(f => (
                      <div key={f} className="subCtaItem"><span className="lime">✓</span> {f}</div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'gyms' && (
            <>
              <div className="gymHeader">
                <div><div className="sectionLabel">Partner Gym Network</div><p className="gymHeaderSub">{PARTNER_GYMS_DATA.length} premium gyms across Lahore — all accessible with your UrbanWell subscription.</p></div>
                <button className="mapOpenBtn" onClick={openMap}>📍 Open Live Map</button>
              </div>

              <div className="partnerGrid">
                {PARTNER_GYMS_DATA.map(g => (
                  <div className={`partnerCard ${g.featured ? 'partnerFeatured' : ''}`} key={g._id}>
                    <div className="partnerBanner" style={{ background: g.gradient }}>
                      <div className="partnerInitials">{g.initials}</div>
                      {g.featured && <div className="partnerFeaturedTag">⭐ Featured</div>}
                      <div className="partnerMembers">{g.members} members</div>
                    </div>
                    <div className="partnerBody">
                      <div className="partnerName">{g.name}</div>
                      <div className="partnerLoc">📍 {g.location}</div>
                      <p className="partnerDesc">{g.description}</p>
                      <div className="partnerMeta">
                        <span>⭐ <strong>{g.rating}</strong> ({g.reviews})</span>
                        <span>🕐 {g.hours}</span>
                      </div>
                      <div className="partnerAmenities">
                        {g.amenities.slice(0, 5).map(a => <span key={a} className="amenityTag">{a}</span>)}
                      </div>
                      <div className="partnerFooter">
                        <div><div className="priceLabel">From</div><div className="priceValue">{g.monthlyFee.toLocaleString()} <span className="cur">PKR/mo</span></div></div>
                        <div className="partnerActions">
                          <a className="ghostBtn" href={osmDirectionsUrl(g.lat, g.lng)} target="_blank" rel="noreferrer">📍 Directions</a>
                          <button className="primaryBtn" onClick={() => openEnroll({ _id: g._id, name: g.name, type: 'Partner Gym', location: g.location, city: g.city, price: g.monthlyFee, currency: 'PKR', rating: g.rating, reviewsCount: g.reviews, amenities: g.amenities, description: g.description })}>Join Gym</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'offers' && (
            <>
              <div className="sectionLabel" style={{ marginBottom: 8 }}>Exclusive Member Offers & Perks</div>
              <p className="offersIntro">Subscribe to any UrbanWell plan and unlock these exclusive benefits. Higher plans = more perks.</p>

              <div className="offersGrid">
                {OFFERS.map(o => (
                  <div className="offerCard" key={o.id}>
                    <div className="offerIconWrap" style={{ background: `${o.color}12`, border: `1px solid ${o.color}30` }}>
                      <span style={{ fontSize: 26 }}>{o.icon}</span>
                    </div>
                    <div className="offerContent">
                      <div className="offerHeader">
                        <div className="offerTitle">{o.title}</div>
                        <span className="offerBadge" style={{ background: `${o.color}18`, color: o.color, border: `1px solid ${o.color}35` }}>{o.badge}</span>
                      </div>
                      <p className="offerDesc">{o.desc}</p>
                      <div className="offerPlans">
                        {o.plans.map(p => <span key={p} className="offerPlanTag">{p}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="offerCta">
                <div className="offerCtaTitle">Ready to unlock all perks?</div>
                <div className="offerCtaSub">Choose a subscription plan and start saving today.</div>
                <button className="primaryBtn" style={{ padding: '14px 32px', fontSize: 15 }} onClick={() => setActiveTab('subscriptions')}>View Subscription Plans →</button>
              </div>
            </>
          )}
        </main>
      </div>

      {modalOpen && selected && (
        <div className="modalOverlay" onMouseDown={closeEnroll}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <div className="modalHead"><div className="modalTitle">Enroll in Package</div><button className="xBtn" onClick={closeEnroll}>✕</button></div>
            <div className="modalBody">
              <div className="modalCard">
                <div className="modalName">{selected.name}</div>
                <div className="modalMeta2">📍 {selected.location} · {selected.type}</div>
                <div className="modalPrice">{Number(selected.price || 0).toLocaleString()} <span className="cur">PKR</span><span className="per"> / month</span></div>
              </div>
              <div className="formGrid">
                <div className="field"><label className="label">Membership</label><select value={membership} onChange={e => setMembership(e.target.value as any)} className="input"><option>Monthly</option><option>Quarterly</option><option>Yearly</option></select></div>
                <div className="field"><label className="label">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" /></div>
                <div className="field"><label className="label">Preferred Time</label><input type="time" value={preferredTime} onChange={e => setPreferredTime(e.target.value)} className="input" /></div>
                <div className="field fieldFull"><label className="label">Notes (optional)</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className="textarea" placeholder="Preferences, injuries, timing…" /></div>
              </div>
              {submitErr && <div className="inlineAlert bad">❌ {submitErr}</div>}
              {submitOk && <div className="inlineAlert ok">🎉 {submitMsg}</div>}
            </div>
            <div className="modalFoot">
              <button className="ghostBtn" onClick={closeEnroll} disabled={submitting}>Cancel</button>
              <button className="primaryBtn" onClick={handleEnroll} disabled={submitting || submitOk}>{submitting ? '⏳ Processing…' : submitOk ? 'Done ✅' : 'Confirm Enrollment'}</button>
            </div>
          </div>
        </div>
      )}

      {mapOpen && (
        <div className="modalOverlay" onMouseDown={() => setMapOpen(false)}>
          <div className="mapModal" onMouseDown={e => e.stopPropagation()}>
            <div className="modalHead"><div className="modalTitle">📍 Gyms Near You</div><button className="xBtn" onClick={() => setMapOpen(false)}>✕</button></div>
            <div className="mapTools">
              <div className="toolLeft">
                <div className="toolLabel">Radius</div>
                <div className="toolRow"><input className="range" type="range" min={1} max={50} step={1} value={radiusKm} onChange={e => setRadiusKm(Number(e.target.value))} /><div className="rangePill"><span className="lime">{radiusKm}</span> km</div></div>
              </div>
              <div className="toolRight">
                <button className="ghostBtn" onClick={useMyLocation} disabled={geoLoading}>{geoLoading ? 'Locating…' : '📍 My Location'}</button>
              </div>
            </div>
            {geoErr && <div className="mapAlert">⚠️ {geoErr}</div>}
            {discoverErr && <div className="mapAlert">⚠️ {discoverErr}</div>}
            <div className="mapWrap">
              {!leaf ? <div style={{height:'100%',display:'grid',placeItems:'center'}}><div className="spinner" /></div> : (
                <leaf.MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={12} scrollWheelZoom style={{height:'100%',width:'100%'}}>
                  <leaf.TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <leaf.Circle center={[mapCenter.lat, mapCenter.lng]} radius={radiusKm * 1000} pathOptions={{color:'#c6f135',fillColor:'#c6f135',fillOpacity:0.08}} />
                  <leaf.Marker position={[mapCenter.lat, mapCenter.lng]} icon={leaf.icon}><leaf.Popup><strong>Your Location</strong></leaf.Popup></leaf.Marker>
                  {nearbyGyms.map((g: any) => (
                    <leaf.Marker key={g._id} position={[g.coords.lat, g.coords.lng]} icon={leaf.icon}>
                      <leaf.Popup><strong>{g.name}</strong><br/>{g.locationText}<br/><strong style={{color:'#c6f135'}}>{Number(g.distanceKm ?? 0).toFixed(1)} km</strong><br/><a href={osmDirectionsUrl(g.coords.lat, g.coords.lng)} target="_blank" rel="noreferrer" style={{color:'#c6f135',fontWeight:900}}>Directions →</a></leaf.Popup>
                    </leaf.Marker>
                  ))}
                </leaf.MapContainer>
              )}
            </div>
            <div className="mapList">
              <div className="listTitle"><span className="lime">{nearbyGyms.length}</span> gyms within {radiusKm}km</div>
              <div className="listGrid">
                {nearbyGyms.slice(0, 10).map((g: any) => (
                  <a key={g._id} className="listItem" href={osmDirectionsUrl(g.coords.lat, g.coords.lng)} target="_blank" rel="noreferrer">
                    <div className="liTop"><div className="liName">{g.name}</div><div className="liDist">{Number(g.distanceKm ?? 0).toFixed(1)}km</div></div>
                    <div className="liSub">{g.locationText}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{css}</style>
    </div>
  )
}

function Noise() {
  return <div className="noise" aria-hidden="true"><svg width="0" height="0"><filter id="uw-noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.35 0" /></filter></svg></div>
}

const leafletCss = `@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');`

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
:root{--void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;--lime:#c6f135;--cyan:#00d4ff;--violet:#8b5cf6;--rose:#f43f5e;--amber:#f59e0b;--text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08)}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse-glow{0%,100%{box-shadow:0 0 20px rgba(198,241,53,.15)}50%{box-shadow:0 0 40px rgba(198,241,53,.3)}}
.uw-root{min-height:100vh;background:radial-gradient(1200px 700px at 20% 0%,rgba(139,92,246,.08),transparent 55%),radial-gradient(900px 600px at 80% 10%,rgba(0,212,255,.06),transparent 55%),var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif}
.noise{position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.1;filter:url(#uw-noise);background:rgba(255,255,255,.06);mix-blend-mode:overlay}
.lime{color:var(--lime);font-weight:900}

.toastFloat{position:fixed;bottom:24px;right:24px;z-index:3000;padding:14px 22px;border-radius:14px;font-size:14px;font-weight:700;animation:fadein .3s ease;background:rgba(198,241,53,.12);border:1px solid rgba(198,241,53,.3);color:var(--lime);backdrop-filter:blur(12px)}

.uw-nav{position:sticky;top:0;z-index:50;height:68px;backdrop-filter:blur(14px);background:rgba(3,5,10,.88);border-bottom:1px solid var(--line)}
.uw-navInner{max-width:1300px;height:68px;margin:0 auto;padding:0 40px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:10px}
.brandMark{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:900;color:#000}
.brandName{font-size:19px;font-weight:800;letter-spacing:-.5px}
.navActions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.navLink{color:var(--sub);text-decoration:none;font-size:13px;font-weight:500;padding:7px 14px;border-radius:8px;transition:all .2s}
.navLink:hover{color:var(--text);background:rgba(255,255,255,.04)}
.navCta{color:#000;background:var(--lime);text-decoration:none;font-weight:900;font-size:13px;padding:9px 18px;border-radius:9px;transition:all .2s}
.navCta:hover{background:#d4ff45;box-shadow:0 0 20px rgba(198,241,53,.35)}

.uw-main{max-width:1300px;margin:0 auto;padding:0 40px 80px}

.heroSection{position:relative;overflow:hidden;padding:60px 0 40px;text-align:center}
.heroMesh{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 50% at 50% 0%,rgba(198,241,53,.05) 0%,transparent 60%)}
.heroContent{position:relative;z-index:1}
.heroEyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;background:rgba(198,241,53,.07);border:1px solid rgba(198,241,53,.2);font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--lime);margin-bottom:20px}
.heroDot{width:6px;height:6px;border-radius:50%;background:var(--lime);animation:pulse-glow 2s infinite}
.heroTitle{font-size:clamp(36px,5vw,60px);font-weight:900;letter-spacing:-2.5px;line-height:.95;margin-bottom:16px}
.heroStroke{-webkit-text-stroke:1.5px rgba(255,255,255,.15);color:transparent}
.heroSub{font-size:16px;color:var(--sub);font-weight:300;line-height:1.7;max-width:580px;margin:0 auto}
.heroSub strong{color:var(--text);font-weight:600}

.tabsWrap{display:flex;justify-content:center;margin-bottom:36px}
.tabs{display:flex;gap:4px;padding:4px;background:var(--panel);border:1px solid var(--line);border-radius:14px}
.tab{padding:11px 22px;border-radius:11px;font-size:13px;font-weight:800;cursor:pointer;transition:all .25s;background:transparent;color:var(--sub);border:none;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;gap:7px}
.tabActive{background:rgba(198,241,53,.1);color:var(--lime);box-shadow:0 0 20px rgba(198,241,53,.06)}
.tab:hover:not(.tabActive){color:var(--text)}
.tabBadge{font-size:10px;padding:2px 7px;border-radius:100px;background:rgba(198,241,53,.15);color:var(--lime);font-weight:900}

.uw-toolbar{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;margin-bottom:16px}
.searchWrap{position:relative;display:flex;align-items:center}
.searchIcon{position:absolute;left:16px;font-size:15px;opacity:.5}
.searchInput{width:100%;padding:13px 44px 13px 44px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;color:var(--text);font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;outline:none}
.searchInput::placeholder{color:var(--sub);opacity:.5}
.searchInput:focus{border-color:rgba(198,241,53,.3)}
.searchClear{position:absolute;right:14px;background:rgba(255,255,255,.06);border:none;border-radius:6px;width:22px;height:22px;cursor:pointer;color:var(--sub);font-size:12px}
.filters{margin-top:12px;display:flex;flex-direction:column;gap:12px}
.chipRow{display:flex;gap:8px;flex-wrap:wrap}
.chip{border:1px solid var(--line);background:transparent;color:var(--sub);padding:8px 16px;border-radius:100px;font-size:12px;font-weight:800;cursor:pointer;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
.chip:hover{color:var(--text)}
.chipActive{background:rgba(198,241,53,.08);color:var(--lime);border-color:rgba(198,241,53,.25)}
.selectRow{display:grid;grid-template-columns:1fr 1.4fr auto;gap:12px;align-items:end}
.selectWrap{display:flex;flex-direction:column;gap:6px}
.selectLabel{font-size:11px;color:var(--sub);font-weight:800}
.select{width:100%;padding:11px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);outline:none;font-family:'Plus Jakarta Sans',sans-serif}
.rangeWrap{display:flex;align-items:center;gap:12px;padding:9px 12px;background:var(--panel2);border:1px solid var(--line);border-radius:10px}
.range{width:100%;accent-color:var(--lime)}
.rangeValue{min-width:70px;text-align:right;font-weight:900;font-size:13px}

.resultBar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;font-size:13px;color:var(--sub)}
.mapOpenBtn{padding:9px 18px;border-radius:10px;background:rgba(0,212,255,.07);border:1px solid rgba(0,212,255,.2);color:var(--cyan);font-size:12px;font-weight:800;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
.mapOpenBtn:hover{background:rgba(0,212,255,.14)}

.ghostBtn{border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--text);padding:10px 16px;border-radius:10px;cursor:pointer;font-weight:800;font-size:12px;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.ghostBtn:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15)}
.primaryBtn{border:none;background:var(--lime);color:#000;padding:10px 18px;border-radius:10px;cursor:pointer;font-weight:900;font-size:13px;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
.primaryBtn:hover{background:#d4ff45;box-shadow:0 0 20px rgba(198,241,53,.35);transform:translateY(-1px)}
.primaryBtn:disabled{opacity:.5;cursor:not-allowed;transform:none}

.uw-loading{text-align:center;padding:60px 20px}
.spinner{width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,.15);border-top-color:var(--cyan);animation:spin .8s linear infinite;margin:0 auto}
.loadingText{margin-top:14px;color:var(--sub);font-weight:700}

.uw-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;animation:fadein .4s ease}
.card{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:20px;transition:all .3s;display:flex;flex-direction:column}
.card:hover{border-color:rgba(198,241,53,.18);transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.4)}
.cardTop{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.cardBadge{padding:5px 12px;border-radius:100px;background:rgba(0,212,255,.07);border:1px solid rgba(0,212,255,.15);font-size:11px;font-weight:900;color:var(--cyan)}
.cardRating{font-size:12px;font-weight:800}.star{color:#fbbf24}.rc{color:var(--sub);font-weight:700}
.cardTitle{font-size:16px;font-weight:900;letter-spacing:-.3px;margin-bottom:4px}
.cardMeta{font-size:12px;color:var(--sub);margin-bottom:8px}
.cardDesc{font-size:13px;color:var(--sub);line-height:1.6;margin-bottom:12px;flex:1}
.cardAmenities{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px}
.amenityTag{padding:4px 10px;border-radius:100px;font-size:10px;font-weight:800;background:rgba(255,255,255,.03);color:var(--sub);border:1px solid var(--line)}
.cardBottom{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--line)}
.priceLabel{font-size:10px;color:var(--sub);font-weight:700}
.priceValue{font-size:17px;font-weight:900}.cur{font-size:11px;color:var(--sub)}
.per{font-size:11px;color:var(--sub);margin-left:4px}
.empty{grid-column:1/-1;text-align:center;padding:50px 20px;border:1px dashed var(--line);border-radius:20px;background:var(--panel)}
.emptyIcon{font-size:40px;margin-bottom:12px}.emptyTitle{font-size:18px;font-weight:900;margin-bottom:6px}.emptySub{font-size:13px;color:var(--sub)}

/* SUBSCRIPTIONS */
.billingToggle{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:32px}
.billingLabel{font-size:13px;font-weight:700;color:var(--sub);cursor:pointer;transition:color .2s}.billingLabel.active{color:var(--text)}
.toggleTrack{width:52px;height:28px;border-radius:100px;background:var(--panel2);border:1px solid var(--line);cursor:pointer;position:relative;transition:all .3s}
.toggleTrack.on{background:rgba(198,241,53,.15);border-color:rgba(198,241,53,.3)}
.toggleThumb{width:22px;height:22px;border-radius:50%;background:var(--lime);position:absolute;top:2px;left:2px;transition:all .3s;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.toggleTrack.on .toggleThumb{left:26px}
.saveBadge{padding:4px 10px;border-radius:100px;background:rgba(198,241,53,.1);border:1px solid rgba(198,241,53,.2);font-size:11px;font-weight:900;color:var(--lime)}

.pricingGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:36px}
.priceCard{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:32px 24px;position:relative;transition:all .3s;display:flex;flex-direction:column;animation:fadein .4s ease}
.priceCard:hover{border-color:rgba(255,255,255,.08);transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.35)}
.priceCard.popular{border-color:rgba(198,241,53,.2);box-shadow:0 0 30px rgba(198,241,53,.06)}
.priceCard.popular::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--lime),transparent);border-radius:22px 22px 0 0}
.popularTag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);padding:5px 16px;border-radius:100px;background:var(--lime);color:#000;font-size:11px;font-weight:900;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
.pkgIcon{font-size:32px;margin-bottom:14px}
.pkgName{font-size:22px;font-weight:900;letter-spacing:-.8px;margin-bottom:4px}
.pkgTagline{font-size:13px;color:var(--sub);margin-bottom:18px}
.pkgPriceRow{display:flex;align-items:baseline;gap:4px}
.pkgCurrency{font-size:14px;font-weight:800;color:var(--sub)}
.pkgAmount{font-size:38px;font-weight:900;letter-spacing:-2px}
.pkgPeriod{font-size:13px;color:var(--sub);margin-bottom:20px}
.pkgDivider{height:1px;background:var(--line);margin-bottom:18px}
.pkgFeatures{list-style:none;margin-bottom:22px;flex:1}
.pkgFeatures li{display:flex;align-items:flex-start;gap:9px;font-size:12.5px;margin-bottom:9px;line-height:1.5}
.fCheck{color:var(--lime);font-weight:900;flex-shrink:0}
.fCross{color:var(--sub);font-weight:900;flex-shrink:0;opacity:.4}
.fExcluded{color:var(--sub);opacity:.45;text-decoration:line-through}
.subBtn{width:100%;padding:13px;border-radius:12px;font-size:14px;font-weight:900;border:none;cursor:pointer;transition:all .25s;font-family:'Plus Jakarta Sans',sans-serif}
.subBtnPrimary{background:var(--lime);color:#000}.subBtnPrimary:hover{box-shadow:0 0 28px rgba(198,241,53,.4);transform:translateY(-1px)}
.subBtnSecondary{background:rgba(255,255,255,.04);color:var(--text);border:1px solid var(--line)}.subBtnSecondary:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15)}

.subCta{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:28px;text-align:center}
.subCtaInner{max-width:600px;margin:0 auto}
.subCtaTitle{font-size:18px;font-weight:900;margin-bottom:16px}
.subCtaGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.subCtaItem{padding:10px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:10px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:8px}

/* PARTNER GYMS */
.gymHeader{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:24px;flex-wrap:wrap}
.gymHeaderSub{font-size:14px;color:var(--sub);margin-top:6px;max-width:500px;line-height:1.6}
.sectionLabel{font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--lime);display:flex;align-items:center;gap:8px}
.sectionLabel::before{content:'';width:20px;height:1px;background:var(--lime)}

.partnerGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.partnerCard{background:var(--panel);border:1px solid var(--line);border-radius:22px;overflow:hidden;transition:all .3s;animation:fadein .4s ease}
.partnerCard:hover{border-color:rgba(198,241,53,.18);transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.35)}
.partnerFeatured{border-color:rgba(198,241,53,.12)}
.partnerBanner{height:100px;position:relative;display:flex;align-items:center;justify-content:center}
.partnerInitials{font-size:40px;font-weight:900;color:#000}
.partnerFeaturedTag{position:absolute;top:10px;left:10px;padding:3px 10px;border-radius:100px;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);font-size:10px;font-weight:900;color:var(--lime);border:1px solid rgba(198,241,53,.2)}
.partnerMembers{position:absolute;top:10px;right:10px;padding:3px 10px;border-radius:100px;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);font-size:10px;font-weight:900;color:#fff;border:1px solid rgba(255,255,255,.1)}
.partnerBody{padding:20px}
.partnerName{font-size:18px;font-weight:900;letter-spacing:-.4px;margin-bottom:4px}
.partnerLoc{font-size:12px;color:var(--sub);margin-bottom:8px}
.partnerDesc{font-size:13px;color:var(--sub);line-height:1.6;margin-bottom:10px}
.partnerMeta{display:flex;gap:16px;font-size:12px;color:var(--sub);margin-bottom:10px}
.partnerMeta strong{color:var(--text)}
.partnerAmenities{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px}
.partnerFooter{display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid var(--line);flex-wrap:wrap;gap:10px}
.partnerActions{display:flex;gap:8px}

/* OFFERS */
.offersIntro{font-size:14px;color:var(--sub);margin-bottom:24px;line-height:1.6}
.offersGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:36px}
.offerCard{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:22px;display:flex;gap:16px;align-items:flex-start;transition:all .3s;animation:fadein .4s ease}
.offerCard:hover{border-color:rgba(255,255,255,.07);transform:translateY(-2px);box-shadow:0 10px 32px rgba(0,0,0,.3)}
.offerIconWrap{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.offerContent{flex:1}
.offerHeader{display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap}
.offerTitle{font-size:15px;font-weight:900;letter-spacing:-.2px}
.offerBadge{padding:3px 10px;border-radius:100px;font-size:10px;font-weight:900;letter-spacing:.5px}
.offerDesc{font-size:12.5px;color:var(--sub);line-height:1.6;margin-bottom:10px}
.offerPlans{display:flex;gap:5px}
.offerPlanTag{padding:3px 10px;border-radius:100px;font-size:10px;font-weight:800;background:rgba(255,255,255,.04);color:var(--sub);border:1px solid var(--line)}
.offerCta{text-align:center;padding:36px;background:var(--panel);border:1px solid rgba(198,241,53,.12);border-radius:20px}
.offerCtaTitle{font-size:22px;font-weight:900;letter-spacing:-.8px;margin-bottom:8px}
.offerCtaSub{font-size:14px;color:var(--sub);margin-bottom:20px}

/* MODAL */
.modalOverlay{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{width:min(660px,100%);border-radius:22px;border:1px solid rgba(0,212,255,.12);background:var(--panel);box-shadow:0 40px 100px rgba(0,0,0,.5);overflow:hidden}
.modalHead{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--line)}
.modalTitle{font-weight:900;font-size:16px}
.xBtn{width:34px;height:34px;border-radius:9px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--sub);cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;transition:all .2s}
.xBtn:hover{color:var(--text);background:rgba(255,255,255,.1)}
.modalBody{padding:20px}
.modalCard{border:1px solid var(--line);background:var(--panel2);border-radius:14px;padding:16px;margin-bottom:16px}
.modalName{font-weight:900;font-size:16px;margin-bottom:4px}
.modalMeta2{font-size:12px;color:var(--sub);margin-bottom:8px}
.modalPrice{font-weight:900;font-size:18px}
.formGrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.field{display:flex;flex-direction:column;gap:6px}
.fieldFull{grid-column:1/-1}
.label{font-size:11px;color:var(--sub);font-weight:800;text-transform:uppercase;letter-spacing:.5px}
.input{padding:11px 14px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;outline:none}
.textarea{min-height:80px;padding:11px 14px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;resize:vertical}
.inlineAlert{margin-top:12px;padding:12px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);font-size:13px;font-weight:700}
.inlineAlert.ok{border-color:rgba(198,241,53,.2);color:var(--lime)}
.inlineAlert.bad{border-color:rgba(244,63,94,.2);color:#fb7185}
.modalFoot{padding:14px 20px;border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:10px}

/* MAP MODAL */
.mapModal{width:min(1100px,100%);height:min(82vh,820px);border-radius:22px;border:1px solid rgba(0,212,255,.12);background:var(--panel);box-shadow:0 40px 100px rgba(0,0,0,.5);overflow:hidden;display:flex;flex-direction:column}
.mapTools{padding:12px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.toolLeft{flex:1;min-width:280px}
.toolRight{display:flex;gap:10px}
.toolLabel{font-size:11px;color:var(--sub);font-weight:800}
.toolRow{margin-top:8px;display:flex;gap:12px;align-items:center}
.rangePill{padding:6px 12px;border-radius:100px;background:var(--panel2);border:1px solid var(--line);font-weight:900;font-size:13px}
.mapAlert{margin:8px 20px;padding:10px 14px;border-radius:10px;background:var(--panel2);border:1px solid var(--line);font-size:12px;color:var(--sub)}
.mapWrap{flex:1;min-height:300px;border-bottom:1px solid var(--line)}
.mapList{padding:14px 20px}
.listTitle{font-weight:900;margin-bottom:10px;font-size:14px}
.listGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.listItem{border-radius:12px;border:1px solid var(--line);background:var(--panel2);padding:12px;text-decoration:none;color:var(--text);display:block;transition:all .2s}
.listItem:hover{border-color:rgba(198,241,53,.2);transform:translateY(-2px)}
.liTop{display:flex;justify-content:space-between;gap:8px}
.liName{font-weight:900;font-size:13px}
.liDist{font-weight:900;color:var(--lime);font-size:12px}
.liSub{margin-top:4px;color:var(--sub);font-size:11px}

@media(max-width:1000px){.uw-grid,.pricingGrid{grid-template-columns:repeat(2,1fr)}.partnerGrid{grid-template-columns:1fr}.offersGrid{grid-template-columns:1fr}}
@media(max-width:700px){.uw-main{padding:0 16px 60px}.uw-navInner{padding:0 16px}.uw-grid,.pricingGrid{grid-template-columns:1fr}.selectRow{grid-template-columns:1fr}.formGrid{grid-template-columns:1fr}.tabs{flex-wrap:wrap}.subCtaGrid{grid-template-columns:repeat(2,1fr)}.listGrid{grid-template-columns:1fr}}
`