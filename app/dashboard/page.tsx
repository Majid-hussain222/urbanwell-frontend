'use client';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '../lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [todayProgress, setTodayProgress] = useState<any>(null);
  const [weekWorkouts, setWeekWorkouts] = useState<any[]>([]);
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [recentProgress, setRecentProgress] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const [modal, setModal] = useState<'calories' | 'water' | 'weight' | null>(null);
  const [quickVal, setQuickVal] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const notifRef = useRef<any>(null);
  const toastTimer = useRef<any>(null);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingEmoji = hour < 5 ? '🌙' : hour < 12 ? '☀️' : hour < 17 ? '👋' : '🌆';

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const formatWater = (ml: number) => ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : '—';
  const timeAgo = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const modalConfig = useMemo(() => ({
    calories: { title: 'Log Calories', icon: '🔥', unit: 'kcal', placeholder: 'e.g. 2000', hint: 'Enter total calories consumed today', quickAmounts: [300, 500, 700, 1000] },
    water:    { title: 'Log Water',    icon: '💧', unit: 'ml',   placeholder: 'e.g. 2500', hint: 'Enter water intake in millilitres',  quickAmounts: [250, 500, 750, 1000] },
    weight:   { title: 'Log Weight',   icon: '⚖️', unit: 'kg',   placeholder: 'e.g. 70.5', hint: 'Enter your current weight in kg',    quickAmounts: [] },
  }), []);

  /* ── Close notif dropdown on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Init ── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/profile');
        setUser(data?.data || data);
      } catch {
        router.push('/login');
        return;
      } finally {
        setLoading(false);
      }
      fetchDashboardData();
    })();
  }, []);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setDataLoading(true);

    const today = new Date().toISOString().split('T')[0];

    const results = await Promise.allSettled([
      API.get(`/progress?date=${today}&limit=1`),          // 0 today's progress
      API.get(`/workouts?week=current&limit=10`),           // 1 week workouts
      API.get(`/meals/today`),                              // 2 today's meals
      API.get(`/bookings/mine?limit=5&status=confirmed`),   // 3 bookings
      API.get(`/progress?limit=7`),                         // 4 recent progress (7 days)
      API.get(`/notifications?limit=20&unread=true`),       // 5 notifications
      API.get(`/chat/unread-count`),                        // 6 unread messages
      API.get(`/workouts/history?limit=5`),                 // 7 workout history
    ]);

    if (results[0].status === 'fulfilled') {
      const p = results[0].value.data?.data;
      setTodayProgress(Array.isArray(p) ? p[0] || null : p || null);
    }
    if (results[1].status === 'fulfilled') {
      const w = results[1].value.data?.data || results[1].value.data?.workouts;
      setWeekWorkouts(Array.isArray(w) ? w : []);
    }
    if (results[2].status === 'fulfilled') {
      const m = results[2].value.data?.data || results[2].value.data?.meals;
      setTodayMeals(Array.isArray(m) ? m : []);
    }
    if (results[3].status === 'fulfilled') {
      const b = results[3].value.data?.data || results[3].value.data?.bookings;
      setBookings(Array.isArray(b) ? b : []);
    }
    if (results[4].status === 'fulfilled') {
      const r = results[4].value.data?.data;
      setRecentProgress(Array.isArray(r) ? r : []);
    }
    if (results[5].status === 'fulfilled') {
      const n = results[5].value.data?.data || results[5].value.data?.notifications;
      setNotifications(Array.isArray(n) ? n : []);
    }
    if (results[6].status === 'fulfilled') {
      setUnreadMessages(results[6].value.data?.count || results[6].value.data?.unread || 0);
    }
    if (results[7].status === 'fulfilled') {
      const h = results[7].value.data?.data || results[7].value.data?.workouts;
      setWorkoutHistory(Array.isArray(h) ? h : []);
    }

    setLastRefreshed(new Date());
    if (isRefresh) setRefreshing(false);
    else setDataLoading(false);
  }, []);

  const quickLog = async () => {
    if (!quickVal || isNaN(Number(quickVal))) return;
    setQuickLoading(true);
    try {
      const payload: any = { date: new Date().toISOString() };
      if (modal === 'calories') { payload.caloriesConsumed = Number(quickVal); payload.calories = Number(quickVal); }
      if (modal === 'water')    { payload.water = Number(quickVal); payload.waterIntake = Number(quickVal); }
      if (modal === 'weight')   { payload.weight = Number(quickVal); }

      if (todayProgress?._id) await API.put(`/progress/${todayProgress._id}`, payload);
      else                      await API.post('/progress', payload);

      const label = modal === 'calories' ? `${quickVal} kcal logged` : modal === 'water' ? `${formatWater(Number(quickVal))} water logged` : `${quickVal}kg saved`;
      showToast(`✓ ${label}`);
      setModal(null);
      setQuickVal('');
      await fetchDashboardData(true);
    } catch {
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setQuickLoading(false);
    }
  };

  const markNotifRead = async (id: string) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    }
  };

  const markAllNotifsRead = async () => {
    try {
      await API.put('/notifications/mark-all-read');
    } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read');
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#03050a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: '2px solid rgba(198,241,53,0.15)', borderTop: '2px solid #c6f135', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const caloriesToday       = todayProgress?.caloriesConsumed || todayProgress?.calories || null;
  const waterToday          = todayProgress?.water || todayProgress?.waterIntake || null;
  const weightCurrent       = todayProgress?.weight || user?.weight || null;
  const workoutsCompleted   = weekWorkouts.filter((w: any) => w.status === 'completed' || w.completed).length;
  const unreadNotifs        = notifications.filter(n => !n.read).length;
  const calorieGoal         = user?.calorieGoal || 2000;
  const waterGoal           = user?.waterGoal || 2500;
  const proteinGoal         = user?.proteinGoal || 150;

  /* Weekly progress bar data (last 7 days) */
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const weekData = weekDays.map((day, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + i);
    const match = recentProgress.find(p => new Date(p.date).toDateString() === d.toDateString());
    return { day, hasData: !!match, calories: match?.caloriesConsumed || match?.calories || 0, isToday: d.toDateString() === today.toDateString() };
  });
  const streak = (() => {
    let s = 0;
    for (let i = recentProgress.length - 1; i >= 0; i--) {
      const diff = Math.floor((Date.now() - new Date(recentProgress[i].date).getTime()) / 86400000);
      if (diff <= s + 1) s++; else break;
    }
    return s;
  })();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        :root {
          --void:#03050a; --panel:#0a1220; --panel2:#0f1a2e;
          --lime:#c6f135; --cyan:#00d4ff; --violet:#8b5cf6;
          --rose:#f43f5e; --amber:#f59e0b; --green:#34d399;
          --text:#e2ecff; --sub:#4d6b8a; --line:rgba(0,212,255,0.08);
        }
        body { background:var(--void); color:var(--text); font-family:'Plus Jakarta Sans',sans-serif; -webkit-font-smoothing:antialiased; }
        body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events:none; z-index:9999; opacity:0.4; }

        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadein   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slidedown{ from{opacity:0;transform:translateY(-8px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes scalein  { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        @keyframes toastIn  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ringbell { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-12deg)} 40%{transform:rotate(12deg)} 60%{transform:rotate(-8deg)} 80%{transform:rotate(6deg)} }

        /* LAYOUT */
        .layout { display:flex; min-height:100vh; }

        /* SIDEBAR */
        .sidebar { width:264px; flex-shrink:0; background:var(--panel); border-right:1px solid var(--line); display:flex; flex-direction:column; padding:26px 18px; position:fixed; top:0; left:0; bottom:0; overflow-y:auto; z-index:100; }
        .sidebar::-webkit-scrollbar { width:3px; }
        .sidebar::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:2px; }
        .sidebar-logo { display:flex; align-items:center; gap:10px; text-decoration:none; margin-bottom:32px; padding:0 4px; }
        .logo-icon { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,var(--lime),var(--cyan)); display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:900; color:#000; flex-shrink:0; }
        .logo-text { font-size:19px; font-weight:800; letter-spacing:-0.6px; }
        .logo-text em { font-style:normal; color:var(--lime); }
        .nav-section { margin-bottom:24px; }
        .nav-label { font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--sub); padding:0 10px; margin-bottom:7px; opacity:0.7; }
        .nav-item { display:flex; align-items:center; gap:11px; padding:10px 10px; border-radius:10px; font-size:13.5px; font-weight:500; color:var(--sub); cursor:pointer; transition:all 0.18s; margin-bottom:1px; border:1px solid transparent; text-decoration:none; background:transparent; width:100%; text-align:left; font-family:'Plus Jakarta Sans',sans-serif; position:relative; }
        .nav-item:hover { color:var(--text); background:rgba(255,255,255,0.04); }
        .nav-item.active { color:var(--lime); background:rgba(198,241,53,0.08); border-color:rgba(198,241,53,0.12); font-weight:600; }
        .nav-item-icon { font-size:15px; width:20px; text-align:center; flex-shrink:0; }
        .nav-badge { margin-left:auto; min-width:18px; height:18px; padding:0 5px; border-radius:100px; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; }
        .nav-badge-red  { background:rgba(244,63,94,0.15); color:#fb7185; }
        .nav-badge-lime { background:rgba(198,241,53,0.12); color:var(--lime); }
        .nav-badge-cyan { background:rgba(0,212,255,0.1); color:var(--cyan); }
        .sidebar-divider { height:1px; background:var(--line); margin:6px 0 16px; }
        .sidebar-bottom { margin-top:auto; padding-top:16px; }
        .user-card { display:flex; align-items:center; gap:11px; padding:13px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid var(--line); margin-bottom:10px; }
        .avatar { width:36px; height:36px; border-radius:9px; background:linear-gradient(135deg,rgba(198,241,53,0.3),rgba(0,212,255,0.2)); display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:800; color:var(--lime); flex-shrink:0; }
        .user-name  { font-size:13px; font-weight:700; margin-bottom:2px; }
        .user-role  { font-size:10px; color:var(--lime); font-weight:600; letter-spacing:0.5px; }
        .user-email { font-size:10px; color:var(--sub); overflow:hidden; text-overflow:ellipsis; max-width:136px; white-space:nowrap; }
        .btn-logout { width:100%; padding:10px; background:rgba(244,63,94,0.05); border:1px solid rgba(244,63,94,0.12); border-radius:10px; color:#fb7185; font-size:12.5px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; }
        .btn-logout:hover { background:rgba(244,63,94,0.12); }

        /* MAIN */
        .main { margin-left:264px; flex:1; min-width:0; }

        /* TOPBAR */
        .topbar { height:66px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; padding:0 32px; background:rgba(3,5,10,0.9); backdrop-filter:blur(24px); position:sticky; top:0; z-index:50; }
        .topbar-left { display:flex; align-items:center; gap:16px; }
        .topbar-title { font-size:17px; font-weight:700; letter-spacing:-0.5px; }
        .topbar-date { font-size:12px; color:var(--sub); font-weight:400; }
        .topbar-right { display:flex; align-items:center; gap:10px; }
        .topbar-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 13px; border-radius:100px; background:rgba(198,241,53,0.07); border:1px solid rgba(198,241,53,0.18); font-size:11px; font-weight:600; color:var(--lime); }
        .topbar-dot { width:5px; height:5px; border-radius:50%; background:var(--lime); animation:pulse 2s infinite; }

        /* NOTIFICATION BELL */
        .notif-wrap { position:relative; }
        .notif-btn { width:38px; height:38px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid var(--line); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:17px; transition:all 0.2s; position:relative; }
        .notif-btn:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.12); }
        .notif-btn.has-unread { animation:ringbell 1.5s ease 1s; }
        .notif-count { position:absolute; top:-5px; right:-5px; width:17px; height:17px; border-radius:50%; background:var(--rose); color:#fff; font-size:9px; font-weight:800; display:flex; align-items:center; justify-content:center; border:2px solid var(--void); }

        /* NOTIF DROPDOWN */
        .notif-dropdown { position:absolute; top:calc(100% + 10px); right:0; width:360px; background:var(--panel); border:1px solid var(--line); border-radius:18px; overflow:hidden; animation:slidedown 0.2s ease; box-shadow:0 20px 60px rgba(0,0,0,0.5); z-index:200; }
        .nd-head { padding:16px 18px 12px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; }
        .nd-title { font-size:14px; font-weight:800; letter-spacing:-0.3px; }
        .nd-markall { font-size:11px; color:var(--lime); font-weight:600; cursor:pointer; background:none; border:none; font-family:'Plus Jakarta Sans',sans-serif; }
        .nd-markall:hover { text-decoration:underline; }
        .nd-list { max-height:340px; overflow-y:auto; }
        .nd-list::-webkit-scrollbar { width:3px; }
        .nd-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); }
        .nd-item { display:flex; align-items:flex-start; gap:11px; padding:13px 16px; border-bottom:1px solid var(--line); cursor:pointer; transition:background 0.15s; }
        .nd-item:last-child { border-bottom:none; }
        .nd-item:hover { background:rgba(255,255,255,0.03); }
        .nd-item.unread { background:rgba(198,241,53,0.02); }
        .nd-dot-wrap { width:8px; flex-shrink:0; padding-top:5px; }
        .nd-dot { width:6px; height:6px; border-radius:50%; background:var(--lime); }
        .nd-icon { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
        .nd-body { flex:1; min-width:0; }
        .nd-notif-title { font-size:12px; font-weight:700; margin-bottom:2px; line-height:1.35; }
        .nd-notif-body { font-size:11px; color:var(--sub); font-weight:300; line-height:1.5; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .nd-time { font-size:10px; color:var(--sub); }
        .nd-footer { padding:10px 16px; border-top:1px solid var(--line); text-align:center; }
        .nd-viewall { font-size:12px; color:var(--lime); font-weight:600; text-decoration:none; }
        .nd-empty { padding:28px; text-align:center; }
        .nd-empty-icon { font-size:28px; margin-bottom:8px; }
        .nd-empty-text { font-size:13px; color:var(--sub); }

        /* REFRESH BTN */
        .refresh-btn { display:flex; align-items:center; gap:6px; padding:7px 14px; background:rgba(255,255,255,0.03); border:1px solid var(--line); border-radius:9px; color:var(--sub); font-size:11px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; }
        .refresh-btn:hover { color:var(--text); }
        .refresh-icon { display:inline-block; transition:transform 0.4s; }
        .refresh-icon.spinning { animation:spin 0.8s linear infinite; }

        /* TOAST */
        .toast { position:fixed; bottom:28px; right:28px; z-index:2000; padding:13px 20px; border-radius:12px; font-size:13px; font-weight:700; display:flex; align-items:center; gap:8px; animation:toastIn 0.3s ease; backdrop-filter:blur(12px); }
        .toast-success { background:rgba(198,241,53,0.12); border:1px solid rgba(198,241,53,0.3); color:var(--lime); }
        .toast-error   { background:rgba(244,63,94,0.12);  border:1px solid rgba(244,63,94,0.3);  color:#fb7185; }

        .content { padding:32px; animation:fadein 0.4s ease; }

        /* GREETING STRIP */
        .greeting-row { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:26px; gap:20px; flex-wrap:wrap; }
        .greeting-hi { font-size:25px; font-weight:900; letter-spacing:-1.2px; margin-bottom:5px; }
        .greeting-hi span { color:var(--lime); }
        .greeting-sub { font-size:13px; color:var(--sub); font-weight:300; line-height:1.6; }
        .greeting-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:4px; }
        .gmeta-pill { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:100px; font-size:11px; font-weight:600; background:rgba(255,255,255,0.04); border:1px solid var(--line); color:var(--sub); }

        /* AI BANNER */
        .ai-banner { background:linear-gradient(135deg,rgba(198,241,53,0.06),rgba(0,212,255,0.04)); border:1px solid rgba(198,241,53,0.12); border-radius:20px; padding:22px 28px; margin-bottom:22px; position:relative; overflow:hidden; }
        .ai-banner::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(198,241,53,0.5),rgba(0,212,255,0.3),transparent); }
        .ai-banner::after  { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at top right,rgba(198,241,53,0.04),transparent 60%); pointer-events:none; }
        .ai-tag { display:inline-flex; align-items:center; gap:6px; font-size:9px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:var(--lime); margin-bottom:7px; }
        .ai-dot { width:5px; height:5px; border-radius:50%; background:var(--lime); animation:pulse 2s infinite; }
        .ai-title { font-size:17px; font-weight:800; letter-spacing:-0.7px; margin-bottom:5px; }
        .ai-sub   { font-size:13px; color:var(--sub); font-weight:300; margin-bottom:14px; line-height:1.6; }
        .ai-actions { display:flex; gap:9px; flex-wrap:wrap; }
        .btn-lime-sm  { padding:9px 18px; background:var(--lime); color:#000; font-size:12.5px; font-weight:800; border-radius:10px; border:none; cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
        .btn-lime-sm:hover { background:#d4ff45; box-shadow:0 0 22px rgba(198,241,53,0.35); transform:translateY(-1px); }
        .btn-ghost-sm { padding:9px 18px; background:rgba(255,255,255,0.04); color:var(--text); font-size:12.5px; font-weight:600; border-radius:10px; border:1px solid var(--line); cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
        .btn-ghost-sm:hover { border-color:rgba(255,255,255,0.15); background:rgba(255,255,255,0.07); }

        /* STAT CARDS */
        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:22px; }
        .stat-card { background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:20px 22px; transition:all 0.25s; position:relative; overflow:hidden; cursor:pointer; }
        .stat-card:hover { transform:translateY(-3px); box-shadow:0 14px 40px rgba(0,0,0,0.35); }
        .stat-top-line { position:absolute; top:0; left:0; right:0; height:2px; opacity:0; transition:opacity 0.3s; }
        .stat-card:hover .stat-top-line { opacity:1; }
        .stat-icon  { font-size:20px; margin-bottom:10px; }
        .stat-val   { font-size:26px; font-weight:900; letter-spacing:-1.5px; margin-bottom:4px; min-height:34px; display:flex; align-items:center; }
        .stat-lbl   { font-size:11.5px; color:var(--sub); font-weight:500; margin-bottom:10px; }
        .stat-cta   { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; padding:4px 10px; border-radius:100px; background:rgba(198,241,53,0.08); border:none; color:var(--lime); cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; }
        .stat-cta:hover { background:rgba(198,241,53,0.15); }
        .stat-logged{ display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; padding:3px 9px; border-radius:100px; }
        .skel { background:linear-gradient(90deg,var(--panel) 25%,var(--panel2) 50%,var(--panel) 75%); background-size:200% 100%; animation:shimmer 1.4s ease-in-out infinite; border-radius:6px; }

        /* WEEK ACTIVITY BAR */
        .week-bar { display:flex; align-items:flex-end; gap:5px; height:44px; margin-top:8px; }
        .day-col { display:flex; flex-direction:column; align-items:center; gap:3px; flex:1; }
        .day-bar { width:100%; border-radius:4px; transition:height 0.6s ease; min-height:4px; }
        .day-label { font-size:9px; font-weight:600; letter-spacing:0.5px; color:var(--sub); }
        .day-label.today { color:var(--lime); font-weight:800; }

        /* MAIN GRID */
        .dash-grid    { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
        .dash-grid-3  { display:grid; grid-template-columns:2fr 1fr; gap:12px; margin-bottom:12px; }
        .card { background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:24px; transition:border-color 0.3s; position:relative; overflow:hidden; }
        .card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent); }
        .card:hover { border-color:rgba(198,241,53,0.07); }
        .card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .card-title { font-size:14px; font-weight:700; letter-spacing:-0.3px; display:flex; align-items:center; gap:7px; }
        .card-action { font-size:11.5px; color:var(--lime); font-weight:600; text-decoration:none; opacity:0.8; transition:opacity 0.2s; }
        .card-action:hover { opacity:1; }

        /* WORKOUT ITEMS */
        .workout-item { display:flex; align-items:center; justify-content:space-between; padding:11px 13px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid var(--line); margin-bottom:7px; transition:all 0.2s; }
        .workout-item:last-child { margin-bottom:0; }
        .workout-item:hover { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.08); }
        .wi-left  { display:flex; align-items:center; gap:11px; min-width:0; }
        .wi-icon  { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
        .wi-name  { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px; }
        .wi-meta  { font-size:10.5px; color:var(--sub); margin-top:1px; }
        .wi-badge { font-size:10px; font-weight:700; padding:3px 9px; border-radius:100px; white-space:nowrap; flex-shrink:0; }
        .wb-done     { background:rgba(198,241,53,0.08); color:var(--lime); }
        .wb-today    { background:rgba(0,212,255,0.08);  color:var(--cyan); }
        .wb-upcoming { background:rgba(255,255,255,0.04); color:var(--sub); }

        /* MEAL ITEMS */
        .meal-item { display:flex; justify-content:space-between; align-items:center; padding:10px 13px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid var(--line); margin-bottom:6px; transition:all 0.2s; }
        .meal-item:last-child { margin-bottom:0; }
        .meal-item:hover { background:rgba(255,255,255,0.04); }
        .meal-type { font-size:9.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--sub); min-width:64px; }
        .meal-name { font-size:12.5px; font-weight:600; flex:1; padding:0 11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .meal-cal  { font-size:12px; color:var(--lime); font-weight:700; flex-shrink:0; }

        /* PROGRESS BARS */
        .prog-item { margin-bottom:15px; }
        .prog-item:last-child { margin-bottom:0; }
        .prog-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
        .prog-name { font-size:12.5px; font-weight:600; }
        .prog-pct  { font-size:11px; font-weight:700; }
        .prog-nums { font-size:10px; color:var(--sub); margin-left:8px; }
        .prog-track { height:5px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden; }
        .prog-fill  { height:100%; border-radius:3px; transition:width 1.2s cubic-bezier(0.16,1,0.3,1); }

        /* QUICK ACTIONS */
        .quick-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .quick-btn  { display:flex; flex-direction:column; align-items:flex-start; padding:14px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid var(--line); cursor:pointer; transition:all 0.2s; text-decoration:none; width:100%; text-align:left; font-family:'Plus Jakarta Sans',sans-serif; color:inherit; }
        .quick-btn:hover { background:rgba(255,255,255,0.05); border-color:rgba(198,241,53,0.15); transform:translateY(-2px); }
        .quick-icon  { font-size:18px; margin-bottom:7px; }
        .quick-title { font-size:12.5px; font-weight:700; color:var(--text); margin-bottom:2px; }
        .quick-sub   { font-size:10.5px; color:var(--sub); font-weight:300; }

        /* BOOKINGS */
        .booking-item { display:flex; align-items:center; gap:11px; padding:11px 13px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid var(--line); margin-bottom:7px; transition:all 0.2s; }
        .booking-item:last-child { margin-bottom:0; }
        .booking-item:hover { background:rgba(255,255,255,0.04); }
        .booking-av   { width:38px; height:38px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#000; flex-shrink:0; background:linear-gradient(135deg,var(--lime),var(--cyan)); }
        .booking-name { font-size:13px; font-weight:600; margin-bottom:2px; }
        .booking-meta { font-size:10.5px; color:var(--sub); }
        .booking-date { font-size:11px; font-weight:700; color:var(--lime); margin-left:auto; text-align:right; flex-shrink:0; }

        /* EMPTY STATE */
        .empty-state { text-align:center; padding:24px 14px; }
        .empty-icon  { font-size:30px; margin-bottom:9px; }
        .empty-title { font-size:13.5px; font-weight:700; margin-bottom:4px; }
        .empty-sub   { font-size:11.5px; color:var(--sub); font-weight:300; line-height:1.65; margin-bottom:13px; }
        .btn-empty   { display:inline-flex; align-items:center; gap:5px; padding:7px 15px; background:var(--lime); color:#000; font-size:11.5px; font-weight:800; border-radius:9px; border:none; cursor:pointer; text-decoration:none; font-family:'Plus Jakarta Sans',sans-serif; }

        /* STREAK CARD */
        .streak-card { background:linear-gradient(135deg,rgba(244,114,182,0.07),rgba(139,92,246,0.05)); border:1px solid rgba(244,114,182,0.12); }
        .streak-num  { font-size:44px; font-weight:900; letter-spacing:-2px; color:#f472b6; line-height:1; }
        .streak-lbl  { font-size:12px; color:var(--sub); margin-top:4px; font-weight:300; }

        /* QUICK LOG MODAL */
        .overlay  { position:fixed; inset:0; background:rgba(0,0,0,0.88); backdrop-filter:blur(20px); z-index:500; display:flex; align-items:center; justify-content:center; padding:20px; animation:scalein 0.2s ease; }
        .qmodal   { background:var(--panel); border:1px solid rgba(198,241,53,0.15); border-radius:24px; width:100%; max-width:400px; padding:34px; position:relative; animation:scalein 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .qmodal::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(198,241,53,0.6),transparent); border-radius:24px 24px 0 0; }
        .qmodal-x { position:absolute; top:14px; right:14px; width:30px; height:30px; border-radius:8px; background:rgba(255,255,255,0.05); border:1px solid var(--line); color:var(--sub); cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
        .qmodal-x:hover { color:var(--text); background:rgba(255,255,255,0.1); }
        .qmodal-icon  { font-size:38px; margin-bottom:12px; text-align:center; }
        .qmodal-title { font-size:21px; font-weight:900; letter-spacing:-1px; text-align:center; margin-bottom:5px; }
        .qmodal-hint  { font-size:12.5px; color:var(--sub); text-align:center; font-weight:300; margin-bottom:22px; line-height:1.6; }
        .qmodal-input-wrap { position:relative; margin-bottom:11px; }
        .qmodal-input { width:100%; padding:15px 58px 15px 20px; background:var(--panel2); border:1px solid var(--line); border-radius:12px; color:var(--text); font-size:22px; font-weight:700; font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:all 0.25s; text-align:center; letter-spacing:-0.5px; }
        .qmodal-input:focus { border-color:rgba(198,241,53,0.45); box-shadow:0 0 0 3px rgba(198,241,53,0.07); }
        .qmodal-unit  { position:absolute; right:16px; top:50%; transform:translateY(-50%); font-size:12px; font-weight:700; color:var(--sub); }
        .qmodal-quick { display:flex; gap:7px; margin-bottom:18px; }
        .qmodal-qbtn  { flex:1; padding:8px 4px; background:var(--panel2); border:1px solid var(--line); border-radius:9px; color:var(--cyan); font-size:11.5px; font-weight:700; cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; }
        .qmodal-qbtn:hover { border-color:rgba(0,212,255,0.3); background:rgba(0,212,255,0.05); }
        .btn-qsave { width:100%; padding:13px; background:var(--lime); color:#000; font-size:14.5px; font-weight:900; border-radius:12px; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.25s; letter-spacing:-0.3px; }
        .btn-qsave:hover:not(:disabled) { background:#d4ff45; box-shadow:0 0 28px rgba(198,241,53,0.4); transform:translateY(-1px); }
        .btn-qsave:disabled { opacity:0.45; cursor:not-allowed; }

        @media(max-width:1100px) { .stats-row{grid-template-columns:repeat(2,1fr)} }
        @media(max-width:900px)  { .sidebar{display:none} .main{margin-left:0} .stats-row{grid-template-columns:repeat(2,1fr)} .dash-grid{grid-template-columns:1fr} .dash-grid-3{grid-template-columns:1fr} .content{padding:18px} }
      `}</style>

      {/* ── QUICK LOG MODAL ── */}
      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) { setModal(null); setQuickVal(''); } }}>
          <div className="qmodal">
            <button className="qmodal-x" onClick={() => { setModal(null); setQuickVal(''); }}>✕</button>
            <div className="qmodal-icon">{modalConfig[modal].icon}</div>
            <div className="qmodal-title">{modalConfig[modal].title}</div>
            <div className="qmodal-hint">{modalConfig[modal].hint}</div>
            <div className="qmodal-input-wrap">
              <input className="qmodal-input" type="number" placeholder={modalConfig[modal].placeholder}
                value={quickVal} onChange={e => setQuickVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && quickLog()} autoFocus />
              <span className="qmodal-unit">{modalConfig[modal].unit}</span>
            </div>
            {modalConfig[modal].quickAmounts.length > 0 && (
              <div className="qmodal-quick">
                {modalConfig[modal].quickAmounts.map(a => (
                  <button key={a} className="qmodal-qbtn"
                    onClick={() => setQuickVal(String(Number(quickVal || 0) + a))}>
                    +{a}
                  </button>
                ))}
              </div>
            )}
            <button className="btn-qsave" onClick={quickLog} disabled={quickLoading || !quickVal}>
              {quickLoading ? '⏳ Saving…' : `Save ${quickVal || '0'} ${modalConfig[modal].unit}`}
            </button>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="layout">
        {/* ════════════ SIDEBAR ════════════ */}
        <aside className="sidebar">
          <a className="sidebar-logo" href="/">
            <div className="logo-icon">U</div>
            <span className="logo-text"><em>Urban</em>Well</span>
          </a>

          <div className="nav-section">
            <div className="nav-label">Dashboard</div>
            {[
              { id: 'overview',  icon: '⚡', label: 'Overview'  },
              { id: 'workouts',  icon: '🏋️', label: 'Workouts'  },
              { id: 'nutrition', icon: '🥗', label: 'Nutrition' },
              { id: 'progress',  icon: '📊', label: 'Progress'  },
            ].map(n => (
              <button key={n.id} className={`nav-item ${activeTab === n.id ? 'active' : ''}`} onClick={() => setActiveTab(n.id)}>
                <span className="nav-item-icon">{n.icon}</span>{n.label}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-label">Track</div>
            <a className="nav-item" href="/workouts/history">
              <span className="nav-item-icon">📋</span>Workout History
              {workoutHistory.length > 0 && <span className="nav-badge nav-badge-cyan">{workoutHistory.length}</span>}
            </a>
            <a className="nav-item" href="/progress/log">
              <span className="nav-item-icon">📝</span>Log Progress
            </a>
            <a className="nav-item" href="/progress">
              <span className="nav-item-icon">📈</span>Progress Stats
            </a>
          </div>

          <div className="nav-section">
            <div className="nav-label">Discover</div>
            {[
              { icon: '📅', label: 'My Bookings',    href: '/bookings',      badge: bookings.filter((b:any) => b.status === 'confirmed').length || null },
              { icon: '👥', label: 'Trainers',        href: '/trainers',      badge: null },
              { icon: '🧬', label: 'Nutritionists',   href: '/nutritionists', badge: null },
              { icon: '📍', label: 'Gym Packages',    href: '/gym-packages',  badge: null },
              { icon: '🥗', label: 'Meal Plans',      href: '/meals',         badge: null },
              { icon: '📰', label: 'Articles',        href: '/articles',      badge: null },
              { icon: '💊', label: 'Supplements',     href: '/supplements',   badge: null },
            ].map(n => (
              <a key={n.label} className="nav-item" href={n.href}>
                <span className="nav-item-icon">{n.icon}</span>{n.label}
                {n.badge ? <span className="nav-badge nav-badge-lime">{n.badge}</span> : null}
              </a>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-label">Communication</div>
            <a className="nav-item" href="/chat">
              <span className="nav-item-icon">💬</span>Messages
              {unreadMessages > 0 && <span className="nav-badge nav-badge-red">{unreadMessages}</span>}
            </a>
            <a className="nav-item" href="/notifications">
              <span className="nav-item-icon">🔔</span>Notifications
              {unreadNotifs > 0 && <span className="nav-badge nav-badge-red">{unreadNotifs}</span>}
            </a>
          </div>

          <div className="sidebar-divider" />

          <div className="nav-section">
            <div className="nav-label">Account</div>
            <a className="nav-item" href="/profile">
              <span className="nav-item-icon">👤</span>Profile
            </a>
            {user?.role === 'admin' && (
              <a className="nav-item" href="/admin">
                <span className="nav-item-icon">🔐</span>Admin Panel
              </a>
            )}
          </div>

          <div className="sidebar-bottom">
            <div className="user-card">
              <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
              <div>
                <div className="user-name">{user?.name || 'User'}</div>
                <div className="user-role">{user?.fitnessGoal?.replace(/_/g,' ') || 'Member'}</div>
                <div className="user-email">{user?.email || ''}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={logout}>Sign out</button>
          </div>
        </aside>

        {/* ════════════ MAIN ════════════ */}
        <main className="main">
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Dashboard</div>
              <div className="topbar-date">{new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
            <div className="topbar-right">
              {/* Refresh */}
              <button className="refresh-btn" onClick={() => fetchDashboardData(true)} disabled={refreshing}>
                <span className={`refresh-icon ${refreshing ? 'spinning' : ''}`}>↻</span>
                {lastRefreshed ? `${lastRefreshed.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}` : 'Refresh'}
              </button>

              {/* AI Active badge */}
              <div className="topbar-badge">
                <span className="topbar-dot" />AI Active
              </div>

              {/* Messages button */}
              <a href="/chat" style={{ position: 'relative', textDecoration: 'none' }}>
                <div className="notif-btn">
                  💬
                  {unreadMessages > 0 && <span className="notif-count">{unreadMessages > 9 ? '9+' : unreadMessages}</span>}
                </div>
              </a>

              {/* Notification Bell */}
              <div className="notif-wrap" ref={notifRef}>
                <div className={`notif-btn ${unreadNotifs > 0 ? 'has-unread' : ''}`}
                  onClick={() => setNotifDropdown(v => !v)}>
                  🔔
                  {unreadNotifs > 0 && <span className="notif-count">{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>}
                </div>

                {notifDropdown && (
                  <div className="notif-dropdown">
                    <div className="nd-head">
                      <div className="nd-title">
                        Notifications
                        {unreadNotifs > 0 && (
                          <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 800, background: 'rgba(244,63,94,0.1)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.2)' }}>
                            {unreadNotifs} new
                          </span>
                        )}
                      </div>
                      {unreadNotifs > 0 && <button className="nd-markall" onClick={markAllNotifsRead}>Mark all read</button>}
                    </div>
                    <div className="nd-list">
                      {notifications.length === 0 ? (
                        <div className="nd-empty">
                          <div className="nd-empty-icon">🔔</div>
                          <div className="nd-empty-text">All caught up!</div>
                        </div>
                      ) : (
                        notifications.slice(0, 8).map(n => {
                          const typeMap: any = {
                            booking: { icon: '📅', bg: 'rgba(198,241,53,0.08)', color: '#c6f135' },
                            workout: { icon: '🏋️', bg: 'rgba(0,212,255,0.08)', color: '#00d4ff' },
                            message: { icon: '💬', bg: 'rgba(251,191,36,0.08)', color: '#fbbf24' },
                            nutrition:  { icon: '🥗', bg: 'rgba(52,211,153,0.08)', color: '#34d399' },
                            achievement:{ icon: '🏆', bg: 'rgba(244,114,182,0.08)', color: '#f472b6' },
                            reminder:   { icon: '⏰', bg: 'rgba(251,146,60,0.08)', color: '#fb923c' },
                            progress:   { icon: '📊', bg: 'rgba(167,139,250,0.08)', color: '#a78bfa' },
                          };
                          const t = typeMap[n.type] || typeMap.reminder;
                          return (
                            <div key={n._id} className={`nd-item ${!n.read ? 'unread' : ''}`}
                              onClick={() => { markNotifRead(n._id); if (n.action?.href) router.push(n.action.href); }}>
                              <div className="nd-dot-wrap">{!n.read && <div className="nd-dot" />}</div>
                              <div className="nd-icon" style={{ background: t.bg }}>{t.icon}</div>
                              <div className="nd-body">
                                <div className="nd-notif-title">{n.title}</div>
                                <div className="nd-notif-body">{n.body}</div>
                                <div className="nd-time">{n.createdAt ? timeAgo(n.createdAt) : n.time || ''}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="nd-footer">
                      <a href="/notifications" className="nd-viewall" onClick={() => setNotifDropdown(false)}>
                        View all notifications →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="content">
            {/* ── GREETING ── */}
            <div className="greeting-row">
              <div>
                <div className="greeting-hi">
                  {greeting}, <span>{user?.name?.split(' ')[0] || 'there'}</span> {greetingEmoji}
                </div>
                <div className="greeting-sub">
                  {caloriesToday || waterToday
                    ? "Here's your health overview for today."
                    : "Welcome back! Start by logging today's progress."}
                </div>
                <div className="greeting-meta">
                  {streak > 0 && <span className="gmeta-pill">🔥 {streak} day streak</span>}
                  {user?.fitnessGoal && <span className="gmeta-pill">🎯 {user.fitnessGoal.replace(/_/g, ' ')}</span>}
                  {bookings.length > 0 && <span className="gmeta-pill">📅 {bookings.length} upcoming session{bookings.length > 1 ? 's' : ''}</span>}
                </div>
              </div>
            </div>

            {/* ── AI BANNER ── */}
            <div className="ai-banner">
              <div className="ai-tag"><div className="ai-dot" />AI Recommendation</div>
              <div className="ai-title">Your personalised plan is ready</div>
              <div className="ai-sub">Generate a custom AI workout and nutrition plan tailored to your goals. Powered by OpenAI GPT.</div>
              <div className="ai-actions">
                <a className="btn-lime-sm" href="/workouts/generate">⚡ Generate AI Workout</a>
                <a className="btn-ghost-sm" href="/meals">🥗 AI Meal Plan</a>
                <a className="btn-ghost-sm" href="/progress/log">📝 Log Progress</a>
              </div>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="stats-row">
              {/* Calories */}
              <div className="stat-card" onClick={() => { setQuickVal(''); setModal('calories'); }}>
                <div className="stat-top-line" style={{ background: 'linear-gradient(90deg,transparent,var(--lime),transparent)' }} />
                <div className="stat-icon">🔥</div>
                {dataLoading
                  ? <div className="stat-val"><div className="skel" style={{ width: 80, height: 28 }} /></div>
                  : <div className="stat-val" style={{ color: caloriesToday ? 'var(--lime)' : 'var(--text)' }}>
                      {caloriesToday ? Number(caloriesToday).toLocaleString() : '—'}
                    </div>}
                <div className="stat-lbl">Calories Today{calorieGoal ? ` / ${calorieGoal.toLocaleString()}` : ''}</div>
                {caloriesToday
                  ? <span className="stat-logged" style={{ background: 'rgba(198,241,53,0.08)', color: 'var(--lime)' }}>
                      ✓ {Math.round((caloriesToday / calorieGoal) * 100)}% of goal
                    </span>
                  : <span className="stat-cta">+ Log calories</span>}
                {caloriesToday > 0 && (
                  <div className="week-bar" style={{ marginTop: 10 }}>
                    {weekData.map(d => (
                      <div key={d.day} className="day-col">
                        <div className="day-bar"
                          style={{ height: d.hasData ? `${Math.min(100, Math.round((d.calories / calorieGoal) * 100))}%` : '8%', background: d.isToday ? 'var(--lime)' : d.hasData ? 'rgba(198,241,53,0.3)' : 'rgba(255,255,255,0.05)' }} />
                        <div className={`day-label ${d.isToday ? 'today' : ''}`}>{d.day[0]}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Workouts */}
              <div className="stat-card" onClick={() => router.push('/workouts/generate')}>
                <div className="stat-top-line" style={{ background: 'linear-gradient(90deg,transparent,var(--cyan),transparent)' }} />
                <div className="stat-icon">⚡</div>
                {dataLoading
                  ? <div className="stat-val"><div className="skel" style={{ width: 60, height: 28 }} /></div>
                  : <div className="stat-val" style={{ color: weekWorkouts.length ? 'var(--cyan)' : 'var(--text)' }}>
                      {weekWorkouts.length ? `${workoutsCompleted}/${weekWorkouts.length}` : '—'}
                    </div>}
                <div className="stat-lbl">Workouts This Week</div>
                {weekWorkouts.length
                  ? <span className="stat-logged" style={{ background: 'rgba(0,212,255,0.08)', color: 'var(--cyan)' }}>
                      {workoutsCompleted} completed
                    </span>
                  : <a className="stat-cta" href="/workouts/generate" onClick={e => e.stopPropagation()}>⚡ Generate</a>}
              </div>

              {/* Weight */}
              <div className="stat-card" onClick={() => { setQuickVal(weightCurrent ? String(weightCurrent) : ''); setModal('weight'); }}>
                <div className="stat-top-line" style={{ background: 'linear-gradient(90deg,transparent,var(--violet),transparent)' }} />
                <div className="stat-icon">⚖️</div>
                {dataLoading
                  ? <div className="stat-val"><div className="skel" style={{ width: 90, height: 28 }} /></div>
                  : <div className="stat-val" style={{ color: weightCurrent ? 'var(--violet)' : 'var(--text)' }}>
                      {weightCurrent ? `${weightCurrent} kg` : '—'}
                    </div>}
                <div className="stat-lbl">Current Weight</div>
                {weightCurrent
                  ? <span className="stat-cta" style={{ color: 'var(--violet)', background: 'rgba(139,92,246,0.08)' }}>✏️ Update</span>
                  : <span className="stat-cta">+ Set weight</span>}
              </div>

              {/* Water */}
              <div className="stat-card" onClick={() => { setQuickVal(''); setModal('water'); }}>
                <div className="stat-top-line" style={{ background: 'linear-gradient(90deg,transparent,var(--amber),transparent)' }} />
                <div className="stat-icon">💧</div>
                {dataLoading
                  ? <div className="stat-val"><div className="skel" style={{ width: 70, height: 28 }} /></div>
                  : <div className="stat-val" style={{ color: waterToday ? 'var(--amber)' : 'var(--text)' }}>
                      {waterToday ? formatWater(waterToday) : '—'}
                    </div>}
                <div className="stat-lbl">Water Intake{waterGoal ? ` / ${formatWater(waterGoal)}` : ''}</div>
                {waterToday
                  ? <span className="stat-cta" style={{ color: 'var(--amber)', background: 'rgba(245,158,11,0.08)' }}>
                      + Add more · {Math.round((waterToday / waterGoal) * 100)}%
                    </span>
                  : <span className="stat-cta">+ Log water</span>}
              </div>
            </div>

            {/* ── ROW 2: Workouts + Meals ── */}
            <div className="dash-grid">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">🏋️ This Week's Workouts</div>
                  <a className="card-action" href="/workouts/history">View history →</a>
                </div>
                {dataLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 52, borderRadius: 10 }} />)}
                  </div>
                ) : weekWorkouts.length > 0 ? (
                  weekWorkouts.slice(0, 4).map((w: any) => {
                    const isToday = w.scheduledDate && new Date(w.scheduledDate).toDateString() === new Date().toDateString();
                    const isDone = w.status === 'completed' || w.completed;
                    return (
                      <div className="workout-item" key={w._id}>
                        <div className="wi-left">
                          <div className="wi-icon" style={{ background: isDone ? 'rgba(198,241,53,0.08)' : isToday ? 'rgba(0,212,255,0.08)' : 'rgba(139,92,246,0.06)' }}>
                            {isDone ? '✅' : isToday ? '🏋️' : '📅'}
                          </div>
                          <div>
                            <div className="wi-name">{w.title || w.name || 'Workout Session'}</div>
                            <div className="wi-meta">
                              {w.exercises?.length ? `${w.exercises.length} exercises` : ''}
                              {w.duration ? ` · ${w.duration}m` : ''}
                            </div>
                          </div>
                        </div>
                        <div className={`wi-badge ${isDone ? 'wb-done' : isToday ? 'wb-today' : 'wb-upcoming'}`}>
                          {isDone ? 'Done' : isToday ? 'Today' : 'Upcoming'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🏋️</div>
                    <div className="empty-title">No workouts scheduled</div>
                    <div className="empty-sub">Generate your first AI-powered workout plan.</div>
                    <a className="btn-empty" href="/workouts/generate">⚡ Generate Now</a>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card-head">
                  <div className="card-title">🥗 Today's Meals</div>
                  <a className="card-action" href="/meals">View plan →</a>
                </div>
                {dataLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {[1, 2, 3, 4].map(i => <div key={i} className="skel" style={{ height: 38, borderRadius: 9 }} />)}
                  </div>
                ) : todayMeals.length > 0 ? (
                  todayMeals.slice(0, 5).map((m: any) => (
                    <div className="meal-item" key={m._id || m.mealType}>
                      <div className="meal-type">{m.mealType || m.type || m.time || 'Meal'}</div>
                      <div className="meal-name">{m.name || m.description || m.food || '—'}</div>
                      <div className="meal-cal">{m.calories ? `${m.calories} kcal` : ''}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🥗</div>
                    <div className="empty-title">No meal plan yet</div>
                    <div className="empty-sub">Generate an AI meal plan based on your goals.</div>
                    <a className="btn-empty" href="/meals">🍽️ Get Meal Plan</a>
                  </div>
                )}
              </div>
            </div>

            {/* ── ROW 3: Goal Progress + Quick Actions ── */}
            <div className="dash-grid">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">📊 Today's Goal Progress</div>
                  <a className="card-action" href="/progress">7-day stats →</a>
                </div>
                {recentProgress.length > 0 ? (() => {
                  const l = recentProgress[0];
                  const items = [
                    { name: 'Calorie Intake',  val: l.caloriesConsumed || l.calories, goal: calorieGoal, color: 'var(--lime)'   },
                    { name: 'Water Intake',    val: l.water || l.waterIntake,          goal: waterGoal,   color: 'var(--amber)'  },
                    { name: 'Protein Target',  val: l.protein,                         goal: proteinGoal, color: '#a78bfa'       },
                  ].filter(p => p.val && p.goal);

                  return items.length > 0 ? items.map(p => {
                    const pct = Math.min(100, Math.round((p.val / p.goal) * 100));
                    return (
                      <div className="prog-item" key={p.name}>
                        <div className="prog-head">
                          <span className="prog-name">{p.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="prog-pct" style={{ color: p.color }}>{pct}%</span>
                            <span className="prog-nums">{p.val.toLocaleString()} / {p.goal.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="prog-track">
                          <div className="prog-fill" style={{ width: `${pct}%`, background: p.color }} />
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="empty-state">
                      <div className="empty-icon">📊</div>
                      <div className="empty-title">No data logged yet</div>
                      <a className="btn-empty" href="/progress/log">📝 Log Progress</a>
                    </div>
                  );
                })() : (
                  <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <div className="empty-title">No progress logged</div>
                    <div className="empty-sub">Start tracking to see your goals here.</div>
                    <a className="btn-empty" href="/progress/log">📝 Log Progress</a>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card-head">
                  <div className="card-title">⚡ Quick Actions</div>
                </div>
                <div className="quick-grid">
                  {[
                    { icon: '🔥', title: 'Log Calories',  sub: 'Track food intake',  action: () => { setQuickVal(''); setModal('calories'); } },
                    { icon: '💧', title: 'Log Water',     sub: 'Track hydration',    action: () => { setQuickVal(''); setModal('water'); } },
                    { icon: '⚖️', title: 'Log Weight',    sub: 'Track body weight',  action: () => { setQuickVal(''); setModal('weight'); } },
                    { icon: '⚡', title: 'AI Workout',    sub: 'Generate plan',      href: '/workouts/generate' },
                    { icon: '💬', title: 'Messages',      sub: `${unreadMessages > 0 ? `${unreadMessages} unread` : 'Chat with pros'}`, href: '/chat' },
                    { icon: '🔔', title: 'Notifications', sub: `${unreadNotifs > 0 ? `${unreadNotifs} unread` : 'All caught up'}`,     href: '/notifications' },
                  ].map(q =>
                    q.href ? (
                      <a key={q.title} className="quick-btn" href={q.href}>
                        <span className="quick-icon">{q.icon}</span>
                        <span className="quick-title">{q.title}</span>
                        <span className="quick-sub">{q.sub}</span>
                      </a>
                    ) : (
                      <button key={q.title} className="quick-btn" onClick={q.action as any}>
                        <span className="quick-icon">{q.icon}</span>
                        <span className="quick-title">{q.title}</span>
                        <span className="quick-sub">{q.sub}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* ── ROW 4: Bookings + Streak ── */}
            <div className="dash-grid-3">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">📅 Upcoming Bookings</div>
                  <a className="card-action" href="/bookings">View all →</a>
                </div>
                {dataLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2].map(i => <div key={i} className="skel" style={{ height: 52, borderRadius: 10 }} />)}
                  </div>
                ) : bookings.length > 0 ? (
                  bookings.slice(0, 4).map((b: any) => {
                    const name = b.trainer?.name || b.nutritionist?.name || b.name || 'Session';
                    const dateVal = b.bookingDate || b.date;
                    return (
                      <div className="booking-item" key={b._id}>
                        <div className="booking-av">{name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div className="booking-name">{name}</div>
                          <div className="booking-meta">{b.sessionType || b.type || 'Session'}{b.package ? ` · ${b.package}` : ''}</div>
                        </div>
                        <div className="booking-date">
                          {dateVal ? fmtDate(dateVal) : '—'}
                          {(b.timeSlot || b.time) && <div style={{ fontSize: 10, color: 'var(--sub)', marginTop: 2 }}>{b.timeSlot || b.time}</div>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <div className="empty-title">No upcoming sessions</div>
                    <div className="empty-sub">Book a session with a trainer or nutritionist to get started.</div>
                    <a className="btn-empty" href="/trainers">👥 Browse Trainers</a>
                  </div>
                )}
              </div>

              {/* Streak Card */}
              <div className="card streak-card">
                <div className="card-head">
                  <div className="card-title">🔥 Streak & Stats</div>
                </div>
                <div style={{ textAlign: 'center', paddingBottom: 8 }}>
                  <div className="streak-num">{streak}</div>
                  <div className="streak-lbl">day logging streak</div>
                </div>
                <div style={{ marginTop: 20 }}>
                  {[
                    { label: 'Total sessions',    val: workoutHistory.length || weekWorkouts.length || 0, color: 'var(--cyan)' },
                    { label: 'Days tracked',      val: recentProgress.length,                             color: 'var(--lime)' },
                    { label: 'Booked sessions',   val: bookings.length,                                   color: '#f472b6'     },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                      <span style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 500 }}>{s.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.val}</span>
                    </div>
                  ))}
                </div>
                <a className="btn-lime-sm" href="/progress" style={{ width: '100%', justifyContent: 'center', marginTop: 16, fontSize: 12 }}>
                  📈 View Full Stats
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}