'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import API from '@/app/lib/api';

/* ─── Socket.io client loaded dynamically ───────────────── */
let socket: any = null;

function getSocket(token: string) {
  if (socket?.connected) return socket;
  // Dynamic import avoids SSR issues
  const { io } = require('socket.io-client');
  socket = io(
    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', ''),
    {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    }
  );
  return socket;
}

/* ─── Helpers ───────────────────────────────────────────── */
const timeAgo = (d: string) => {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)    return 'Just now';
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  if (m < 2880) return 'Yesterday';
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
};

const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const COLORS = ['#00d4ff','#34d399','#a78bfa','#fb923c','#fbbf24','#f472b6','#fb7185'];
const proColor = (id = '') =>
  COLORS[parseInt(id.slice(-4) || '0', 16) % COLORS.length];

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

const groupByDate = (messages: any[]) => {
  const groups: { label: string; messages: any[] }[] = [];
  messages.forEach(msg => {
    const d  = new Date(msg.createdAt);
    const td = new Date(); td.setHours(0,0,0,0);
    const yd = new Date(td); yd.setDate(yd.getDate() - 1);
    const label = d >= td ? 'Today'
      : d >= yd ? 'Yesterday'
      : d.toLocaleDateString('en-PK', { weekday:'long', day:'numeric', month:'short' });
    const last = groups[groups.length - 1];
    if (!last || last.label !== label) groups.push({ label, messages: [msg] });
    else last.messages.push(msg);
  });
  return groups;
};

/* ════════════════════════════════════════════════════════ */
export default function ChatPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [user,          setUser]       = useState<any>(null);
  const [loading,       setLoading]    = useState(true);
  const [convs,         setConvs]      = useState<any[]>([]);
  const [convsLoading,  setCLoading]   = useState(true);
  const [active,        setActive]     = useState<any>(null);
  const [messages,      setMessages]   = useState<any[]>([]);
  const [msgLoading,    setMLoading]   = useState(false);
  const [hasMore,       setHasMore]    = useState(false);
  const [mPage,         setMPage]      = useState(1);
  const [input,         setInput]      = useState('');
  const [sending,       setSending]    = useState(false);
  const [search,        setSearch]     = useState('');
  const [typing,        setTyping]     = useState(false);
  const [socketOk,      setSocketOk]   = useState(false);

  const endRef      = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const activeRef   = useRef<any>(null);
  const typingTimer = useRef<any>(null);

  /* ── Auth + load ─────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/profile');
        const u = data?.data || data;
        setUser(u);
        await loadConvs();
        initSocket();
        // Auto-open from ?conv= param
        const cid = searchParams.get('conv');
        if (cid) openConv(cid);
      } catch { router.push('/login'); }
      finally  { setLoading(false); }
    })();
    return () => { socket?.disconnect(); socket = null; };
  }, []);

  /* ── Socket init ─────────────────────────────────────── */
  const initSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const s = getSocket(token);

    s.on('connect',    () => setSocketOk(true));
    s.on('disconnect', () => setSocketOk(false));
    s.on('connect_error', () => setSocketOk(false));

    s.on('new_message', (msg: any) => {
      // Add to messages if it belongs to the active conversation
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        // Only show if this conversation is active
        if (activeRef.current?._id === msg.conversation ||
            activeRef.current?._id === msg.conversation?._id) {
          return [...prev, msg];
        }
        return prev;
      });
      // Always update conversation preview
      setConvs(prev => prev.map(c => {
        const cid = msg.conversation?._id || msg.conversation;
        if (c._id !== cid) return c;
        const isActive = activeRef.current?._id === c._id;
        return {
          ...c,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
          unreadUser: isActive ? 0 : (c.unreadUser || 0) + 1,
        };
      }));
    });

    s.on('user_typing',      () => setTyping(true));
    s.on('user_stop_typing', () => setTyping(false));
  };

  /* ── Load conversations ──────────────────────────────── */
  const loadConvs = async () => {
    setCLoading(true);
    try {
      const { data } = await API.get('/chat');
      setConvs(data?.data || []);
    } finally { setCLoading(false); }
  };

  /* ── Open conversation ───────────────────────────────── */
  const openConv = useCallback(async (idOrConv: any) => {
    const id  = typeof idOrConv === 'string' ? idOrConv : idOrConv._id;
    const obj = typeof idOrConv === 'object' ? idOrConv : convs.find(c => c._id === id);

    // Leave old room
    if (activeRef.current) socket?.emit('leave_conversation', activeRef.current._id);

    setActive(obj || null);
    activeRef.current = obj || null;
    setMessages([]);
    setMPage(1);
    setTyping(false);
    setMLoading(true);

    // Join socket room
    socket?.emit('join_conversation', id);

    // Mark read in UI immediately
    setConvs(prev => prev.map(c => c._id === id ? { ...c, unreadUser: 0 } : c));

    try {
      const { data } = await API.get(`/chat/${id}/messages?limit=50&page=1`);
      setMessages(data?.data || []);
      setHasMore((data?.pagination?.pages || 1) > 1);
    } finally {
      setMLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [convs]);

  /* ── Load earlier messages ───────────────────────────── */
  const loadMore = async () => {
    if (!active || !hasMore) return;
    const next = mPage + 1;
    setMPage(next);
    const { data } = await API.get(`/chat/${active._id}/messages?limit=50&page=${next}`);
    setMessages(prev => [...(data?.data || []), ...prev]);
    setHasMore(next < (data?.pagination?.pages || 1));
  };

  /* ── Send message ────────────────────────────────────── */
  const send = async () => {
    const text = input.trim();
    if (!text || !active || sending) return;
    setInput('');
    setSending(true);
    stopTyping();

    // Optimistic
    const opt = { _id: `opt_${Date.now()}`, sender: { _id: user?._id, name: user?.name }, text, createdAt: new Date().toISOString(), read: false, _opt: true };
    setMessages(p => [...p, opt]);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const { data } = await API.post(`/chat/${active._id}/messages`, { text });
      setMessages(p => p.map(m => m._id === opt._id ? (data?.data || m) : m));
      setConvs(p => p.map(c => c._id === active._id
        ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() } : c));
    } catch {
      setMessages(p => p.filter(m => m._id !== opt._id));
      setInput(text);
    } finally {
      setSending(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  };

  /* ── Typing ──────────────────────────────────────────── */
  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!active) return;
    socket?.emit('typing_start', { conversationId: active._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 2000);
  };

  const stopTyping = () => {
    if (active) socket?.emit('typing_stop', { conversationId: active._id });
    clearTimeout(typingTimer.current);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  /* ── Start new conversation ──────────────────────────── */
  const startConv = async (trainerId?: string, nutritionistId?: string) => {
    try {
      const { data } = await API.post('/chat', { trainerId, nutritionistId });
      await loadConvs();
      openConv(data.data);
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to start conversation'); }
  };

  /* ── Derived ─────────────────────────────────────────── */
  const pro       = active?.trainer || active?.nutritionist;
  const color     = proColor(pro?._id || '');
  const totalUnread = convs.reduce((s, c) => s + (c.unreadUser || 0), 0);
  const filtered  = convs.filter(c => {
    const name = (c.trainer?.name || c.nutritionist?.name || '').toLowerCase();
    return !search.trim() || name.includes(search.toLowerCase());
  });

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#03050a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:44, height:44, border:'2px solid rgba(198,241,53,0.15)', borderTop:'2px solid #c6f135', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;--lime:#c6f135;--cyan:#00d4ff;--rose:#f43f5e;--text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);}
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes blink{0%,100%{opacity:.3}50%{opacity:1}}
        @keyframes pulse2{0%,100%{opacity:1}50%{opacity:.5}}

        .layout{display:flex;height:100vh;}

        /* SIDEBAR */
        .sidenav{width:258px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:26px 16px;position:fixed;top:0;left:0;bottom:0;overflow-y:auto;z-index:100;}
        .sidenav::-webkit-scrollbar{width:3px;} .sidenav::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.05);}
        .logo{display:flex;align-items:center;gap:9px;text-decoration:none;margin-bottom:30px;}
        .logo-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-.5px;} .logo-text em{font-style:normal;color:var(--lime);}
        .nav-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--sub);padding:0 8px;margin:14px 0 5px;opacity:.7;}
        .nav-a{display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:10px;font-size:13px;font-weight:500;color:var(--sub);transition:all .18s;margin-bottom:1px;border:1px solid transparent;text-decoration:none;position:relative;}
        .nav-a:hover{color:var(--text);background:rgba(255,255,255,.04);}
        .nav-a.on{color:var(--lime);background:rgba(198,241,53,.08);border-color:rgba(198,241,53,.12);font-weight:700;}
        .nbadge{margin-left:auto;min-width:17px;height:17px;padding:0 4px;border-radius:100px;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;}
        .nbadge-red{background:rgba(244,63,94,.15);color:#fb7185;}
        .nbadge-cyan{background:rgba(0,212,255,.1);color:var(--cyan);}
        .nbadge-lime{background:rgba(198,241,53,.1);color:var(--lime);}
        .sb-bottom{margin-top:auto;padding-top:14px;}
        .ucard{display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--line);margin-bottom:9px;}
        .uav{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,rgba(198,241,53,.3),rgba(0,212,255,.2));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--lime);flex-shrink:0;}
        .logout-btn{width:100%;padding:9px;background:rgba(244,63,94,.05);border:1px solid rgba(244,63,94,.12);border-radius:9px;color:#fb7185;font-size:12px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .logout-btn:hover{background:rgba(244,63,94,.12);}

        /* CHAT LAYOUT */
        .chat-wrap{margin-left:258px;flex:1;display:flex;height:100vh;overflow:hidden;}

        /* CONTACTS */
        .contacts{width:296px;flex-shrink:0;border-right:1px solid var(--line);display:flex;flex-direction:column;background:var(--panel);}
        .c-head{padding:16px 16px 12px;border-bottom:1px solid var(--line);}
        .c-title{font-size:15px;font-weight:800;letter-spacing:-.4px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;}
        .sconn{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:600;}
        .sdot{width:6px;height:6px;border-radius:50%;}
        .sdot-on{background:#34d399;animation:pulse2 2s infinite;}
        .sdot-off{background:var(--rose);}
        .c-search{position:relative;}
        .c-search input{width:100%;padding:8px 12px 8px 32px;background:var(--panel2);border:1px solid var(--line);border-radius:9px;color:var(--text);font-size:12.5px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all .2s;}
        .c-search input:focus{border-color:rgba(198,241,53,.3);}
        .c-search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--sub);pointer-events:none;}
        .c-list{flex:1;overflow-y:auto;padding:6px;}
        .c-list::-webkit-scrollbar{width:3px;} .c-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.05);}

        .c-item{display:flex;align-items:center;gap:10px;padding:10px 9px;border-radius:11px;cursor:pointer;transition:all .18s;margin-bottom:2px;border:1px solid transparent;}
        .c-item:hover{background:rgba(255,255,255,.04);}
        .c-item.active{background:rgba(198,241,53,.05);border-color:rgba(198,241,53,.1);}
        .c-av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
        .c-info{flex:1;min-width:0;}
        .c-name{font-size:12.5px;font-weight:700;margin-bottom:2px;display:flex;align-items:center;justify-content:space-between;gap:4px;}
        .c-last{font-size:11px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;justify-content:space-between;gap:4px;}
        .c-role{font-size:9.5px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--sub);margin-top:1px;}
        .c-time{font-size:10px;color:var(--sub);white-space:nowrap;}
        .c-unread{min-width:17px;height:17px;padding:0 4px;border-radius:50%;background:var(--lime);color:#000;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

        /* SKELETON */
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .skel{background:linear-gradient(90deg,var(--panel) 25%,var(--panel2) 50%,var(--panel) 75%);background-size:200% 100%;animation:shimmer 1.4s ease infinite;border-radius:6px;}

        /* MESSAGES */
        .msgs-area{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .m-header{padding:13px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;background:rgba(10,18,32,.95);backdrop-filter:blur(20px);flex-shrink:0;}
        .m-hinfo{display:flex;align-items:center;gap:10px;}
        .m-hav{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
        .m-hname{font-size:13.5px;font-weight:800;letter-spacing:-.3px;}
        .m-hsub{font-size:11px;color:var(--sub);margin-top:1px;}
        .m-hactions{display:flex;gap:7px;}
        .hbtn{padding:6px 12px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;border:1px solid;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .hbtn-lime{background:rgba(198,241,53,.08);color:var(--lime);border-color:rgba(198,241,53,.2);}
        .hbtn-lime:hover{background:rgba(198,241,53,.15);}
        .hbtn-ghost{background:rgba(255,255,255,.03);color:var(--sub);border-color:var(--line);}
        .hbtn-ghost:hover{color:var(--text);}

        .msgs-scroll{flex:1;overflow-y:auto;padding:18px 22px;display:flex;flex-direction:column;gap:2px;}
        .msgs-scroll::-webkit-scrollbar{width:4px;} .msgs-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.05);border-radius:2px;}
        .load-more{align-self:center;padding:5px 14px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:100px;font-size:11px;font-weight:600;color:var(--sub);cursor:pointer;margin-bottom:8px;font-family:'Plus Jakarta Sans',sans-serif;}
        .load-more:hover{color:var(--text);}
        .date-sep{text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--sub);margin:10px 0;display:flex;align-items:center;gap:8px;}
        .date-sep::before,.date-sep::after{content:'';flex:1;height:1px;background:var(--line);}

        .mrow{display:flex;margin-bottom:3px;animation:msgIn .2s ease;}
        .mrow.me{justify-content:flex-end;}
        .mrow.other{justify-content:flex-start;}
        .mav{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;flex-shrink:0;margin-right:6px;align-self:flex-end;}
        .mbwrap{display:flex;flex-direction:column;max-width:65%;}
        .mb{padding:9px 13px;border-radius:16px;font-size:13px;line-height:1.55;word-break:break-word;}
        .mb.me{background:linear-gradient(135deg,rgba(198,241,53,.13),rgba(198,241,53,.07));border:1px solid rgba(198,241,53,.18);border-bottom-right-radius:3px;color:var(--text);}
        .mb.other{background:var(--panel2);border:1px solid var(--line);border-bottom-left-radius:3px;}
        .mb.opt{opacity:.55;}
        .mtime{font-size:10px;color:var(--sub);margin-top:3px;display:flex;align-items:center;gap:3px;}
        .mtime.me{justify-content:flex-end;}
        .tick{font-size:10px;}
        .tick.read{color:var(--lime);}

        .typing-row{display:flex;align-items:flex-end;gap:6px;margin-bottom:4px;}
        .typing-bub{display:flex;align-items:center;gap:3px;padding:9px 13px;background:var(--panel2);border:1px solid var(--line);border-radius:16px;border-bottom-left-radius:3px;}
        .tdot{width:5px;height:5px;border-radius:50%;background:var(--sub);animation:blink 1.2s ease infinite;}
        .tdot:nth-child(2){animation-delay:.2s;} .tdot:nth-child(3){animation-delay:.4s;}

        /* INPUT */
        .inp-area{padding:10px 20px 16px;border-top:1px solid var(--line);background:rgba(10,18,32,.95);backdrop-filter:blur(20px);flex-shrink:0;}
        .inp-row{display:flex;gap:8px;align-items:flex-end;}
        .chat-inp{flex:1;padding:10px 14px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;color:var(--text);font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;resize:none;max-height:110px;min-height:42px;transition:all .2s;line-height:1.5;}
        .chat-inp:focus{border-color:rgba(198,241,53,.3);box-shadow:0 0 0 3px rgba(198,241,53,.05);}
        .send-btn{width:42px;height:42px;border-radius:10px;background:var(--lime);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:900;color:#000;flex-shrink:0;transition:all .2s;}
        .send-btn:hover:not(:disabled){background:#d4ff45;box-shadow:0 0 16px rgba(198,241,53,.35);}
        .send-btn:disabled{background:rgba(255,255,255,.06);color:var(--sub);cursor:not-allowed;}
        .inp-hint{font-size:10px;color:var(--sub);margin-top:5px;text-align:center;}

        /* EMPTY STATES */
        .c-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;gap:9px;}
        .m-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;text-align:center;gap:10px;}
        .empty-icon{font-size:44px;}
        .empty-title{font-size:16px;font-weight:800;}
        .empty-sub{font-size:12.5px;color:var(--sub);line-height:1.65;max-width:280px;}
        .start-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:var(--lime);color:#000;font-size:12px;font-weight:800;border-radius:10px;border:none;cursor:pointer;text-decoration:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;margin-top:4px;}
        .start-btn:hover{background:#d4ff45;}

        @media(max-width:900px){.sidenav{display:none}.chat-wrap{margin-left:0}.contacts{width:100%}}
      `}</style>

      <div className="layout">
        {/* ── SIDEBAR ── */}
        <aside className="sidenav">
          <a className="logo" href="/">
            <div className="logo-icon">U</div>
            <span className="logo-text"><em>Urban</em>Well</span>
          </a>

          <div className="nav-label">Dashboard</div>
          <a className="nav-a" href="/dashboard">⚡ Overview</a>
          <a className="nav-a" href="/progress">📊 Progress</a>

          <div className="nav-label">Track</div>
          <a className="nav-a" href="/workouts/generate">🏋️ Workouts</a>
          <a className="nav-a" href="/workouts/history">📋 Workout History</a>
          <a className="nav-a" href="/progress/log">📝 Log Progress</a>

          <div className="nav-label">Discover</div>
          <a className="nav-a" href="/bookings">📅 Bookings</a>
          <a className="nav-a" href="/trainers">👥 Trainers</a>
          <a className="nav-a" href="/nutritionists">🧬 Nutritionists</a>
          <a className="nav-a" href="/meals">🥗 Meal Plans</a>
          <a className="nav-a" href="/gym-packages">📍 Gym Packages</a>
          <a className="nav-a" href="/supplements">💊 Supplements</a>
          <a className="nav-a" href="/articles">📰 Articles</a>

          <div className="nav-label">Communication</div>
          <a className="nav-a on" href="/chat">
            💬 Messages
            {totalUnread > 0 && <span className="nbadge nbadge-red">{totalUnread}</span>}
          </a>
          <a className="nav-a" href="/notifications">🔔 Notifications</a>

          <div className="nav-label">Account</div>
          <a className="nav-a" href="/profile">👤 Profile</a>

          <div className="sb-bottom">
            <div className="ucard">
              <div className="uav">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
              <div>
                <div style={{ fontSize:12.5, fontWeight:700, marginBottom:1 }}>{user?.name}</div>
                <div style={{ fontSize:10, color:'var(--sub)', overflow:'hidden', textOverflow:'ellipsis', maxWidth:130, whiteSpace:'nowrap' }}>{user?.email}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}>
              Sign out
            </button>
          </div>
        </aside>

        {/* ── CHAT WRAP ── */}
        <div className="chat-wrap">

          {/* CONTACTS PANEL */}
          <div className="contacts">
            <div className="c-head">
              <div className="c-title">
                Messages
                <div className="sconn">
                  <div className={`sdot ${socketOk ? 'sdot-on' : 'sdot-off'}`} />
                  <span style={{ color: socketOk ? '#34d399' : 'var(--rose)', fontSize:10 }}>
                    {socketOk ? 'Live' : 'Connecting…'}
                  </span>
                </div>
              </div>
              <div className="c-search">
                <span className="c-search-icon">🔍</span>
                <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="c-list">
              {convsLoading ? (
                [1,2,3,4].map(i => (
                  <div key={i} style={{ display:'flex', gap:10, padding:'10px 9px', marginBottom:2 }}>
                    <div className="skel" style={{ width:40, height:40, borderRadius:'50%', flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div className="skel" style={{ height:12, marginBottom:6 }} />
                      <div className="skel" style={{ height:10, width:'70%' }} />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="c-empty">
                  <div className="empty-icon">💬</div>
                  <div style={{ fontSize:14, fontWeight:700 }}>No conversations</div>
                  <div style={{ fontSize:12, color:'var(--sub)', textAlign:'center', lineHeight:1.6 }}>
                    Book a session with a trainer or nutritionist to unlock messaging.
                  </div>
                  <a className="start-btn" href="/trainers">👥 Find a Trainer</a>
                </div>
              ) : (
                filtered.map(conv => {
                  const p = conv.trainer || conv.nutritionist;
                  if (!p) return null;
                  const c  = proColor(p._id);
                  const isActive = active?._id === conv._id;
                  return (
                    <div key={conv._id} className={`c-item ${isActive ? 'active' : ''}`} onClick={() => openConv(conv)}>
                      <div className="c-av" style={{ background:`${c}18`, color:c }}>
                        {p.avatar
                          ? <img src={p.avatar} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                          : initials(p.name)}
                      </div>
                      <div className="c-info">
                        <div className="c-name">
                          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:110 }}>{p.name}</span>
                          <span className="c-time">{timeAgo(conv.lastMessageAt)}</span>
                        </div>
                        <div className="c-last">
                          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                            {conv.lastMessage || 'Start a conversation'}
                          </span>
                          {conv.unreadUser > 0 && <span className="c-unread">{conv.unreadUser}</span>}
                        </div>
                        <div className="c-role">{conv.trainer ? 'Trainer' : 'Nutritionist'}{p.specialty ? ` · ${p.specialty}` : ''}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* MESSAGES AREA */}
          <div className="msgs-area">
            {!active || !pro ? (
              <div className="m-empty">
                <div className="empty-icon">💬</div>
                <div className="empty-title">Select a conversation</div>
                <div className="empty-sub">
                  {convs.length === 0
                    ? 'Book a session with a trainer or nutritionist to start chatting directly.'
                    : 'Pick a conversation on the left to view messages.'}
                </div>
                {convs.length === 0 && <a className="start-btn" href="/trainers">👥 Browse Trainers</a>}
              </div>
            ) : (
              <>
                {/* HEADER */}
                <div className="m-header">
                  <div className="m-hinfo">
                    <div className="m-hav" style={{ background:`${color}18`, color }}>
                      {pro.avatar
                        ? <img src={pro.avatar} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                        : initials(pro.name)}
                    </div>
                    <div>
                      <div className="m-hname">{pro.name}</div>
                      <div className="m-hsub">
                        {active.trainer ? 'Personal Trainer' : 'Nutritionist'}
                        {pro.specialty ? ` · ${pro.specialty}` : ''}
                        {pro.rating    ? ` · ★ ${pro.rating}`  : ''}
                      </div>
                    </div>
                  </div>
                  <div className="m-hactions">
                    <a href={active.trainer ? `/trainers/${pro._id}` : `/nutritionists/${pro._id}`}
                      className="hbtn hbtn-ghost">Profile</a>
                    <a href="/bookings" className="hbtn hbtn-lime">📅 Book</a>
                    <a href="/dashboard" className="hbtn hbtn-ghost">← Back</a>
                  </div>
                </div>

                {/* MESSAGES */}
                <div className="msgs-scroll">
                  {hasMore && (
                    <button className="load-more" onClick={loadMore}>↑ Load earlier</button>
                  )}

                  {msgLoading ? (
                    <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
                      <div style={{ width:30, height:30, border:'2px solid rgba(198,241,53,.15)', borderTop:'2px solid #c6f135', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'48px 20px' }}>
                      <div style={{ fontSize:36, marginBottom:10 }}>👋</div>
                      <div style={{ fontSize:14, fontWeight:700, marginBottom:5 }}>Say hello!</div>
                      <div style={{ fontSize:12, color:'var(--sub)' }}>Start the conversation with {pro.name.split(' ')[0]}</div>
                    </div>
                  ) : (
                    groupByDate(messages).map((group, gi) => (
                      <React.Fragment key={gi}>
                        <div className="date-sep">{group.label}</div>
                        {group.messages.map(msg => {
                          const isMe = (msg.sender?._id || msg.sender) === user?._id;
                          return (
                            <div key={msg._id} className={`mrow ${isMe ? 'me' : 'other'}`}>
                              {!isMe && (
                                <div className="mav" style={{ background:`${color}18`, color }}>
                                  {pro.avatar ? <img src={pro.avatar} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} /> : initials(pro.name)}
                                </div>
                              )}
                              <div className="mbwrap">
                                <div className={`mb ${isMe ? 'me' : 'other'} ${msg._opt ? 'opt' : ''}`}>
                                  {msg.text}
                                </div>
                                <div className={`mtime ${isMe ? 'me' : ''}`}>
                                  {fmtTime(msg.createdAt)}
                                  {isMe && (
                                    <span className={`tick ${msg.read ? 'read' : ''}`}>
                                      {msg.read ? '✓✓' : '✓'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}

                  {typing && (
                    <div className="typing-row">
                      <div className="mav" style={{ background:`${color}18`, color }}>{initials(pro.name)}</div>
                      <div className="typing-bub"><div className="tdot"/><div className="tdot"/><div className="tdot"/></div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {/* INPUT */}
                <div className="inp-area">
                  <div className="inp-row">
                    <textarea
                      ref={inputRef}
                      className="chat-inp"
                      placeholder={`Message ${pro.name.split(' ')[0]}…`}
                      value={input}
                      rows={1}
                      onChange={onInput}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    />
                    <button className="send-btn" disabled={!input.trim() || sending} onClick={send}>
                      {sending
                        ? <div style={{ width:17, height:17, border:'2px solid rgba(0,0,0,.2)', borderTop:'2px solid #000', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                        : '↑'}
                    </button>
                  </div>
                  <div className="inp-hint">Enter to send · Shift+Enter for new line</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}