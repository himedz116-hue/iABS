
import React, { useState, useEffect } from 'react';
import {
  Shield, Trash2, Key, Database, Save, AlertTriangle,
  UserPlus, UserMinus, Search, Star, Ban, Unlock,
  Megaphone, Activity, History, Settings, Users,
  Zap, Palette, Eye, EyeOff, RotateCw, Trophy,
  Music, Sparkles, Wind, Flame, Ticket, Fingerprint,
  Users2, Gavel, Radio, LayoutDashboard, Terminal, X, Clock
} from 'lucide-react';
import { leaderboardService, adminService, supabase } from '../services/supabase';
import { chatService } from '../services/chatService';
import { ProAvatar } from './ProAvatar';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bans' | 'announcements' | 'arena' | 'promo' | 'logs' | 'system'>('overview');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [arenaStatus, setArenaStatus] = useState<any>({});

  const [targetUser, setTargetUser] = useState('');
  const [pointDelta, setPointDelta] = useState(100);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statType, setStatType] = useState<'points' | 'credits' | 'wins'>('points');

  const [banReason, setBanReason] = useState('مخالفة قوانين الدردشة');
  const [searchQuery, setSearchQuery] = useState('');

  const [newPromo, setNewPromo] = useState({ code: '', amount: 1000, maxUses: 10 });
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [chatMonitorActive, setChatMonitorActive] = useState(false);
  const [chatStatus, setChatStatus] = useState<{ connected: boolean; error: boolean; details?: string }>({ connected: false, error: false });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const validateSession = async () => {
      let raw = localStorage.getItem('admin_access_granted');
      if (!raw) {
        const siteAuth = localStorage.getItem('site_access_granted');
        if (siteAuth) {
          const parsedSite = JSON.parse(siteAuth);
          if (parsedSite.role === 'admin') {
            localStorage.setItem('admin_access_granted', siteAuth);
            raw = siteAuth;
          }
        }
      }
      let token: string | null = null;
      if (raw) {
        try { const parsed = JSON.parse(raw); token = parsed?.token || null; } catch { }
      }
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'admin_password')
        .maybeSingle();
      if (error) { console.warn("[AdminAuth] Supabase check failed, skipping validation."); return; }
      if (data && token) {
        const dbPass = String(data.value).trim();
        const sessionPass = String(token).trim();
        if (sessionPass !== dbPass) {
          console.error("[AdminAuth] Password mismatch. Revoking access.");
          localStorage.removeItem('admin_access_granted');
          onLogout();
        }
      }
    };
    validateSession();
    const channel = supabase
      .channel('admin_password_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, validateSession)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const channel = localStorage.getItem('kick_channel_name') || 'iabs';
    chatService.connect(channel);
    setChatMonitorActive(true);
    const unbindStatus = chatService.onStatusChange((connected, error, details) => {
      setChatStatus({ connected, error, details });
    });
    return () => {
      unbindStatus();
      chatService.disconnect();
      setChatMonitorActive(false);
    };
  }, []);

  useEffect(() => {
    const unbindMsg = chatService.onMessage(async (msg) => {
      const raw = msg.content.trim().toUpperCase();
      const matched = promoCodes.find(p => p.is_active && (raw === p.code.toUpperCase() || raw === `!${p.code.toUpperCase()}`));
      if (matched) {
        const res = await leaderboardService.claimPromoCode(msg.user.username, matched.code);
        if ((res as any).success) {
          showStatus(`✅ تم تفعيل الكود ${matched.code} للمستخدم ${msg.user.username}`);
          fetchData();
        }
      }
    });
    return () => unbindMsg();
  }, [promoCodes]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: promos } = await adminService.getPromoCodes();
      setPromoCodes(promos || []);
      if (activeTab === 'users' || activeTab === 'overview' || activeTab === 'bans') {
        const { data: allProfiles } = await adminService.getAllProfiles();
        const rankedData = await leaderboardService.getAllRankedPlayers();
        const statsMap = new Map();
        rankedData.forEach((p: any) => { statsMap.set(p.username?.toLowerCase(), { score: p.score, wins: p.wins }); });
        const merged = allProfiles.map((p: any) => {
          const stats = statsMap.get(p.username?.toLowerCase()) || { score: 0, wins: 0 };
          return { ...p, ...stats };
        });
        merged.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
        setProfiles(merged);
        const { data: recentLogs } = await adminService.getAuditLogs(200);
        setLogs(recentLogs);
      }
      if (activeTab === 'announcements') { const { data } = await adminService.getAnnouncements(); setAnnouncements(data); }
      if (activeTab === 'logs') { const { data } = await adminService.getAuditLogs(); setLogs(data); }
      if (activeTab === 'arena') { const { status } = await adminService.getArenaStatus(); setArenaStatus(status); }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const showStatus = (msg: string, err = false) => {
    setStatusMsg(msg);
    setIsError(err);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleAdjustStats = async (isAdding: boolean, customAmount?: number) => {
    if (!targetUser) return showStatus('يرجى إدخال اسم المستخدم', true);
    const amount = customAmount !== undefined ? (isAdding ? customAmount : -customAmount) : (isAdding ? pointDelta : -pointDelta);
    let error;
    if (statType === 'points') { const res = await leaderboardService.adjustPlayerStats(targetUser, amount, 0); error = res.error; }
    else if (statType === 'wins') { const res = await leaderboardService.adjustPlayerStats(targetUser, 0, amount); error = res.error; }
    else { const res = await adminService.adjustCredits(targetUser, amount); error = res.error; }
    if (error) { showStatus('حدث خطأ: ' + (typeof error === 'string' ? error : (error.message || 'فشلت العملية')), true); }
    else { showStatus(`تم تحديث بيانات ${targetUser}`); await fetchData(); }
  };

  const handleResetUser = async (username: string) => {
    if (!confirm(`هل أنت متأكد من تصفير جميع بيانات ${username}؟`)) return;
    await leaderboardService.adjustPlayerStats(username, -999999, -999999);
    const { data: p } = await adminService.getAllProfiles();
    const userProf = p.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
    if (userProf && userProf.credits > 0) { await adminService.adjustCredits(username, -userProf.credits); }
    await adminService.logAction('CORE_ADMIN', 'RESET_USER_STATS', { username });
    showStatus(`تم تصفير بيانات ${username}`);
    fetchData();
  };

  const handleToggleBan = async (username: string, currentBan: boolean) => {
    const { error } = await adminService.toggleUserBan(username, !currentBan, banReason);
    if (error) showStatus('خطأ في العملية', true);
    else { showStatus(currentBan ? `تم فك حظر ${username}` : `تم حظر ${username} بنجاح`); fetchData(); }
  };

  const updateArena = async (key: string, value: any) => {
    const { error } = await adminService.updateArenaStatus(key, value);
    if (error) showStatus('فشل التحديث', true);
    else { showStatus('تم تحديث إعدادات الساحة'); fetchData(); }
  };

  const filteredProfiles = profiles.filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()));

  const TABS = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard, color: 'text-white' },
    { id: 'users', label: 'المتسابقين', icon: Users, color: 'text-blue-500' },
    { id: 'bans', label: 'المحظورين', icon: Gavel, color: 'text-red-500' },
    { id: 'announcements', label: 'البث', icon: Radio, color: 'text-orange-500' },
    { id: 'promo', label: 'الأكواد', icon: Ticket, color: 'text-yellow-500' },
    { id: 'arena', label: 'الساحة', icon: Palette, color: 'text-purple-500' },
    { id: 'logs', label: 'السجل', icon: Terminal, color: 'text-zinc-400' },
    { id: 'system', label: 'الصيانة', icon: Settings, color: 'text-red-600' },
  ];

  return (
    <div className="w-full h-full bg-[#030303] text-white flex animate-in fade-in duration-700 font-sans overflow-hidden">

      {/* SIDEBAR */}
      <div className="w-[280px] shrink-0 bg-gradient-to-b from-black via-zinc-900/80 to-black border-l border-white/5 flex flex-col p-6 relative">
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-red-600 via-red-500/30 to-transparent opacity-30"></div>

        <div className="flex items-center gap-4 mb-10 px-1">
          <div className="relative">
            <div className="absolute inset-0 bg-red-600 blur-xl opacity-50 animate-pulse"></div>
            <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-red-600 to-red-900 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.3)] border border-red-500/30">
              <Shield size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white">iABS <span className="text-red-500">ADM</span></h1>
            <p className="text-xs text-zinc-600 font-bold tracking-[0.3em] uppercase">Control Suite</p>
          </div>
        </div>

        <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
          {TABS.map(tab => {
            const isAct = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group text-right ${isAct ? 'bg-gradient-to-r from-red-600/20 to-red-600/5 text-white shadow-[0_0_30px_rgba(255,0,0,0.1)] border border-red-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/[0.03] border border-transparent'}`}>
                {isAct && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r-full shadow-[0_0_10px_rgba(255,0,0,0.5)]"></div>}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isAct ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-zinc-500 group-hover:bg-white/10'}`}>
                  <tab.icon size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-base italic leading-tight">{tab.label}</span>
                  {isAct && <span className="text-[9px] text-red-400/60 uppercase tracking-[0.2em] font-bold mt-0.5">Active</span>}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={onLogout} className="mt-6 py-4 px-5 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-red-600/10 hover:text-red-500 hover:border-red-500/30 transition-all active:scale-95 italic bg-white/[0.02] flex items-center justify-center gap-3">
          <Shield size={16} /> Logout
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* HEADER */}
        <div className="h-24 shrink-0 border-b border-white/5 flex items-center justify-between px-10 bg-gradient-to-r from-black via-zinc-900/50 to-black relative z-40">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-600 font-black uppercase tracking-wider">Global Operations</span>
              <span className="text-2xl font-black italic uppercase tracking-tight text-white">{activeTab.replace('_', ' ')}</span>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="flex items-center gap-3 bg-green-500/5 px-4 py-2 rounded-2xl border border-green-500/10">
              <div className="relative w-3 h-3">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-0 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              </div>
              <span className="text-sm font-black text-green-400 italic tracking-wider">SYSTEM LIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchData} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:border-white/20">
              <RotateCw size={24} className={isLoading ? 'animate-spin text-red-500' : 'text-zinc-400'} />
            </button>
            <div className="bg-white/[0.03] px-6 py-3 rounded-2xl border border-white/5">
              <span className="text-sm font-mono font-black text-zinc-500">SESSION: iABS-{Math.floor(Math.random() * 99999)}</span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar bg-[radial-gradient(ellipse_at_top,rgba(255,0,0,0.03),transparent_70%)]">
          {statusMsg && (
            <div className={`fixed top-10 left-1/2 -translate-x-1/2 px-10 py-5 rounded-[2rem] font-black shadow-2xl z-[1000] animate-in slide-in-from-top-10 backdrop-blur-2xl border text-lg ${isError ? 'bg-red-600/90 border-red-400 text-white' : 'bg-green-600/90 border-green-400 text-white'}`}>
              <div className="flex items-center gap-3">{isError ? <AlertTriangle size={24} /> : <Shield size={24} />}{statusMsg}</div>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'إجمالي المسجلين', value: profiles.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  { label: 'المحظورين حالياً', value: profiles.filter(p => p.is_banned).length, icon: Ban, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                  { label: 'الأرصدة المتداولة', value: profiles.reduce((acc, p) => acc + (p.credits || 0), 0), icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                  { label: 'نقاط المتصدرين', value: profiles.reduce((acc, p) => acc + (p.score || 0), 0), icon: Trophy, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                ].map(stat => (
                  <div className={`relative overflow-hidden rounded-[2.5rem] border ${stat.border} ${stat.bg} p-7 transition-all duration-500 hover:scale-[1.02] group bg-gradient-to-br from-black/80 to-black/40`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-16 h-16 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                        <stat.icon size={30} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-500 uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className="text-4xl font-black italic text-white">{stat.value.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/[0.02] blur-2xl"></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-8">
                  <h3 className="text-2xl font-black italic mb-6 flex items-center gap-3 text-white">آخر النشاطات <Activity size={24} className="text-blue-500" /></h3>
                  <div className="space-y-3">
                    {profiles.slice(0, 5).map(p => (
                      <div key={p.id} className="bg-black/60 p-5 rounded-2xl flex items-center justify-between border border-white/[0.03] hover:border-white/10 transition-all">
                        <div className="flex items-center gap-4">
                          <ProAvatar url={p.avatar_url} username={p.username} size="w-12 h-12" className="overflow-visible" />
                          <span className="font-black italic text-lg text-white">{p.username}</span>
                        </div>
                        <span className="text-sm font-mono text-zinc-600">{new Date(p.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-10 flex flex-col justify-center items-center text-center">
                  <Terminal size={120} className="text-zinc-800 mb-6" />
                  <h4 className="text-3xl font-black italic mb-3 text-white">النظام قيد التشغيل الكامل</h4>
                  <p className="text-zinc-500 font-bold text-lg max-w-md">جميع الوحدات البرمجية تعمل بكفاءة عالية. السيرفر متصل بقاعدة بيانات SQL السحابية.</p>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                <div className="flex-1 w-full max-w-lg">
                  <label className="text-sm font-black text-zinc-600 uppercase tracking-wider mb-1 block italic">Search</label>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث بالاسم..." className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 pr-14 text-lg text-white font-black focus:border-blue-600 outline-none transition-all shadow-lg" />
                  </div>
                </div>
                <div className="bg-zinc-900/80 px-8 py-5 rounded-2xl border border-white/10 text-center">
                  <span className="text-sm font-black text-zinc-500 uppercase tracking-wider block mb-1">Total</span>
                  <span className="text-3xl font-black italic text-white">{filteredProfiles.length}</span>
                </div>
              </div>

              <div className="rounded-[2.5rem] border border-white/5 overflow-hidden shadow-xl bg-black/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-white/[0.03] text-sm font-black uppercase text-zinc-500 tracking-[0.1em] border-b border-white/5">
                        <th className="p-6">اللاعب</th>
                        <th className="p-6">فوز</th>
                        <th className="p-6">نقاط</th>
                        <th className="p-6">رصيد</th>
                        <th className="p-6">الحالة</th>
                        <th className="p-6 text-center">تحكم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {filteredProfiles.map(p => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-all group">
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <ProAvatar url={p.avatar_url} username={p.username} size="w-14 h-14" className="overflow-visible" />
                              <div>
                                <div className={`text-xl font-black italic ${p.is_banned ? 'text-zinc-700 line-through' : 'text-white'}`}>{p.username}</div>
                                <div className="text-sm font-mono text-zinc-600">{p.id?.slice(0, 8).toUpperCase()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-5"><div className="font-black text-2xl text-blue-500 italic">{p.wins || 0}</div></td>
                          <td className="p-5 text-2xl font-black italic text-white/80">{p.score || 0}</td>
                          <td className="p-5 text-2xl font-black text-green-500 italic">
                            § {p.credits || 0}
                            <div className="text-xs font-mono text-zinc-500 mt-1">{(logs || []).find(l => (l.details?.username === p.username) && (l.action === 'PROMO_REDEEM' || l.action === 'CREDITS_ADJUST')) ? 'معدّل' : ' '}</div>
                          </td>
                          <td className="p-5">
                            {p.is_banned
                              ? <span className="inline-flex items-center gap-2 bg-red-600/10 text-red-500 border border-red-500/20 px-5 py-2 rounded-full text-sm font-black tracking-wider uppercase">Restricted</span>
                              : <span className="inline-flex items-center gap-2 bg-green-600/10 text-green-500 border border-green-500/20 px-5 py-2 rounded-full text-sm font-black tracking-wider uppercase">Authorized</span>
                            }
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2 justify-center">
                              <button onClick={() => { setTargetUser(p.username); setStatType('points'); showStatus(`تم تحديد ${p.username}`); }} className="p-3 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-500/10 hover:border-blue-500/30" title="نقاط"><Trophy size={18} /></button>
                              <button onClick={() => { setTargetUser(p.username); setStatType('wins'); showStatus(`تم تحديد ${p.username}`); }} className="p-3 bg-yellow-600/10 text-yellow-500 rounded-xl hover:bg-yellow-600 hover:text-white transition-all border border-yellow-500/10 hover:border-yellow-500/30" title="فوز"><Star size={18} /></button>
                              <button onClick={() => { setTargetUser(p.username); setStatType('credits'); showStatus(`تم تحديد ${p.username}`); }} className="p-3 bg-green-600/10 text-green-500 rounded-xl hover:bg-green-600 hover:text-black transition-all border border-green-500/10 hover:border-green-500/30" title="رصيد"><Zap size={18} /></button>
                              <button onClick={() => handleToggleBan(p.username, p.is_banned)} className={`p-3 rounded-xl border transition-all ${p.is_banned ? 'bg-green-600 text-black border-green-500/30' : 'bg-red-600/10 text-red-500 border-red-500/10 hover:bg-red-600 hover:text-white hover:border-red-500/30'}`}>{p.is_banned ? <Unlock size={18} /> : <Ban size={18} />}</button>
                              <button onClick={() => handleResetUser(p.username)} className="p-3 bg-white/5 text-white/40 rounded-xl border border-white/5 hover:bg-white/10 hover:text-white transition-all"><RotateCw size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {targetUser && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" onClick={() => setTargetUser('')}></div>
                  <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0a0a0a] to-black rounded-[3rem] border border-white/10 shadow-[0_50px_150px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className={`h-2 w-full transition-all duration-500 ${statType === 'points' ? 'bg-blue-600' : statType === 'wins' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <div className="p-8 md:p-10 space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <ProAvatar url={profiles.find(p => p.username === targetUser)?.avatar_url} username={targetUser} size="w-16 h-16" className="border-2 border-white/10 overflow-visible" />
                          <div>
                            <h2 className="text-3xl font-black italic text-white tracking-tighter">{targetUser}</h2>
                            <p className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em]">Admin Control</p>
                          </div>
                        </div>
                        <button onClick={() => setTargetUser('')} className="w-12 h-12 bg-white/5 hover:bg-red-600 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-white/10"><X size={24} /></button>
                      </div>

                      <div className="grid grid-cols-3 gap-3 p-2 bg-white/[0.02] border border-white/5 rounded-2xl">
                        {[{ id: 'points', label: 'النقاط', icon: Trophy, activeColor: 'bg-blue-600' }, { id: 'wins', label: 'الفوز', icon: Star, activeColor: 'bg-yellow-500' }, { id: 'credits', label: 'الرصيد', icon: Zap, activeColor: 'bg-green-500' }].map(tab => (
                          <button key={tab.id} onClick={() => setStatType(tab.id as any)}
                            className={`flex flex-col items-center gap-3 py-6 rounded-2xl transition-all duration-300 ${statType === tab.id ? `${tab.activeColor} text-white shadow-xl scale-105 border border-white/20` : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                            <tab.icon size={28} />
                            <span className="text-sm font-black uppercase tracking-wider">{tab.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          {[{ label: 'الرصيد', value: profiles.find(p => p.username === targetUser)?.credits || 0, color: 'text-green-500' }, { label: 'النقاط', value: profiles.find(p => p.username === targetUser)?.score || 0, color: 'text-blue-500' }, { label: 'الفوز', value: profiles.find(p => p.username === targetUser)?.wins || 0, color: 'text-yellow-500' }].map((stat, i) => (
                            <div key={i} className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-center">
                              <p className="text-sm font-black text-zinc-600 uppercase mb-1 tracking-wider">{stat.label}</p>
                              <p className={`text-2xl font-black italic ${stat.color}`}>{stat.value.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>

                        <div className="bg-black/80 border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center gap-6">
                          <span className="text-sm font-black text-zinc-600 uppercase tracking-[0.4em]">Adjusting Value</span>
                          <div className="flex items-center gap-8">
                            <button onClick={() => setPointDelta(Math.max(1, (Number(pointDelta) || 0) - 10))} className="w-16 h-16 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-3xl font-black text-white">-</button>
                            <input type="number" value={pointDelta} onChange={(e) => setPointDelta(Number(e.target.value))}
                              className={`w-40 bg-transparent text-center text-5xl font-black outline-none tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors duration-500 ${statType === 'points' ? 'text-blue-500' : statType === 'wins' ? 'text-yellow-500' : 'text-green-500'}`} />
                            <button onClick={() => setPointDelta((Number(pointDelta) || 0) + 10)} className="w-16 h-16 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-3xl font-black text-white">+</button>
                          </div>
                          <div className="flex flex-wrap justify-center gap-3">
                            {[1, 5, 20, 50, 100, 500, 1000].map(val => (
                              <button key={val} onClick={() => handleAdjustStats(true, val)} className="px-6 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-base font-black hover:bg-white/10 transition-all text-zinc-400 hover:text-white">+{val}</button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button onClick={() => handleAdjustStats(true)}
                            className={`flex-[3] py-6 rounded-2xl font-black text-xl italic uppercase tracking-wider transition-all active:scale-95 border border-white/10 ${statType === 'points' ? 'bg-blue-600 text-white shadow-[0_0_40px_rgba(59,130,246,0.3)]' : statType === 'wins' ? 'bg-yellow-500 text-black shadow-[0_0_40px_rgba(234,179,8,0.3)]' : 'bg-green-500 text-black shadow-[0_0_40px_rgba(34,197,94,0.3)]'}`}>
                            تأكيد الإضافة
                          </button>
                          <button onClick={() => handleAdjustStats(false)}
                            className="flex-1 py-6 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 text-lg">
                            <UserMinus size={24} />
                            <span className="italic font-black">خصم</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BANS TAB */}
          {activeTab === 'bans' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-700">
              <div>
                <h2 className="text-6xl font-black text-red-600 italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,0,0,0.3)]">IRON SHIELD</h2>
                <p className="text-zinc-500 font-bold mt-4 text-xl italic uppercase">Centralized Punishment & Restriction Hub</p>
              </div>

              <div className="rounded-[4rem] border border-red-600/20 bg-red-600/[0.01] p-12 shadow-2xl relative overflow-hidden group">
                <Gavel size={150} className="absolute right-[-20px] top-[-20px] text-red-600/5 group-hover:rotate-12 transition-transform duration-1000" />
                <h3 className="text-3xl font-black text-white italic mb-10 flex items-center gap-4 border-b border-white/5 pb-6">
                  <Ban className="text-red-600" size={32} /> حظر لاعب جديد
                </h3>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-zinc-600 uppercase tracking-wider pl-4">Target Identity</label>
                      <input type="text" value={targetUser} onChange={(e) => setTargetUser(e.target.value)}
                        placeholder="اسم المستخدم..."
                        className="w-full bg-black border border-white/10 rounded-[2.5rem] p-6 text-2xl text-white font-black focus:border-red-600 outline-none transition-all shadow-inner" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-zinc-600 uppercase tracking-wider pl-4">Violation Type</label>
                      <select value={banReason} onChange={(e) => setBanReason(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-[2.5rem] p-6 text-xl text-white font-black focus:border-red-600 outline-none appearance-none">
                        <option>مخالفة قوانين الدردشة</option>
                        <option>استخدام برامج مساعدة (Cheating)</option>
                        <option>إزعاج المتسابقين (Harassment)</option>
                        <option>إساءة استخدام النظام</option>
                        <option>قرار إداري مباشر</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => { if (!targetUser) return showStatus('يرجى كتابة اسم اللاعب', true); if (confirm(`تأكيد حظر ${targetUser} نهائياً؟`)) handleToggleBan(targetUser, false); }}
                    className="w-full py-8 bg-black border-2 border-red-600 text-red-500 font-black text-3xl rounded-[3rem] hover:bg-red-600 hover:text-white transition-all shadow-[0_30px_80px_rgba(220,38,38,0.2)] flex items-center justify-center gap-4 italic uppercase">
                    <Gavel size={36} /> Execute Judgement
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-black text-zinc-600 uppercase tracking-[0.3em] pl-4 italic">Banned List Database</h4>
                {profiles.filter(p => p.is_banned).map(p => (
                  <div key={p.id} className="rounded-3xl border border-red-900/40 bg-red-950/5 p-8 flex items-center justify-between group hover:border-red-500/40 transition-all">
                    <div className="flex items-center gap-8">
                      <div className="relative group-hover:scale-110 transition-transform">
                        <ProAvatar url={p.avatar_url} username={p.username} size="w-20 h-20" className="opacity-40 grayscale overflow-visible" />
                        <Ban size={28} className="absolute inset-0 m-auto text-red-600 drop-shadow-xl z-20" />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-white italic">{p.username}</div>
                        <div className="text-xs font-bold text-red-600/60 uppercase tracking-widest mt-1">Status: Restricted Permanently</div>
                      </div>
                    </div>
                    <button onClick={() => handleToggleBan(p.username, true)} className="px-8 py-4 bg-green-600/10 text-green-500 border border-green-500/20 rounded-2xl font-black text-sm hover:bg-green-600 hover:text-black transition-all active:scale-95 italic uppercase tracking-widest">Unban Player</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-right-12">
              <div>
                <h2 className="text-6xl font-black text-white italic tracking-tighter">BROADCAST CORE</h2>
                <p className="text-zinc-500 font-bold mt-4 text-xl italic uppercase">Global Frequency Distribution System</p>
              </div>

              <div className="rounded-[4rem] border border-orange-500/20 bg-orange-500/[0.01] p-14 shadow-2xl relative">
                <Radio size={200} className="absolute left-[-50px] top-[-50px] text-orange-600/5" />
                <div className="flex flex-col gap-10">
                  <textarea value={newAnnouncement} onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder="اكتب رسالة البث العام هنا... ستظهر للجميع فوراً!"
                    className="w-full bg-black/40 border-4 border-white/[0.03] rounded-[3rem] p-12 text-3xl text-white font-black focus:border-red-600 outline-none transition-all min-h-[300px] shadow-inner text-center leading-relaxed italic placeholder:text-zinc-800" />
                  <button onClick={async () => { if (!newAnnouncement) return; setIsLoading(true); const { error } = await adminService.addAnnouncement(newAnnouncement); setIsLoading(false); if (!error) { setNewAnnouncement(''); showStatus('تم إطلاق البث المباشر بنجاح!'); fetchData(); } else { showStatus('فشل إرسال البث', true); } }}
                    disabled={isLoading}
                    className="w-full py-8 bg-gradient-to-r from-red-600 to-orange-600 text-white font-black text-3xl rounded-[3rem] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_25px_80px_rgba(255,0,0,0.4)] flex items-center justify-center gap-4 italic uppercase disabled:opacity-50">
                    <Radio size={40} className={isLoading ? 'animate-spin' : 'animate-pulse'} />
                    {isLoading ? 'Processing...' : 'TRANSMIT REAL-TIME PULSE'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {announcements.map(a => (
                  <div key={a.id} className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] flex items-center justify-between group relative overflow-hidden hover:bg-white/[0.04] transition-all">
                    <div className="absolute top-0 left-0 w-2 h-full bg-orange-600/20 group-hover:bg-orange-600 transition-colors"></div>
                    <p className="text-xl text-white font-bold flex-1 px-4 italic leading-relaxed">{a.content}</p>
                    <button onClick={() => adminService.deleteAnnouncement(a.id).then(fetchData)} className="p-4 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shrink-0"><Trash2 size={24} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROMO TAB */}
          {activeTab === 'promo' && (
            <div className="max-w-5xl mx-auto space-y-12 animate-in zoom-in-95 duration-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-6xl font-black text-yellow-500 italic tracking-tighter">GOLDEN FORGE</h2>
                  <p className="text-zinc-500 font-bold mt-4 text-xl">صناعة الأكواد والهدايا الترويجية</p>
                </div>
                <Ticket size={100} className="text-yellow-600/20" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="rounded-[4rem] border border-yellow-500/20 bg-yellow-500/[0.01] p-12 shadow-2xl">
                  <h3 className="text-3xl font-black text-white italic mb-4 flex items-center gap-4"><Sparkles className="text-yellow-500" /> كود ترويجي جديد</h3>
                  <div className="mb-6 text-sm text-zinc-500 font-bold">
                    حالة مراقبة الشات: {chatStatus.connected ? <span className="text-green-500">متصل</span> : <span className="text-red-500">غير متصل</span>}
                    {chatStatus.details ? <span className="mr-2 opacity-60">({chatStatus.details})</span> : null}
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-sm font-black text-zinc-600 uppercase tracking-wider pl-4">Secret Sequence</label>
                      <input type="text" value={newPromo.code} onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                        placeholder="مثال: GOLDEN_KICK"
                        className="w-full bg-black border-2 border-white/10 rounded-[3rem] p-8 text-4xl text-white font-black focus:border-yellow-500 outline-none transition-all shadow-2xl text-center tracking-widest placeholder:text-zinc-800" />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-zinc-600 uppercase tracking-wider">Amount (§)</label>
                        <input type="number" value={newPromo.amount} onChange={(e) => setNewPromo({ ...newPromo, amount: Number(e.target.value) })}
                          className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-2xl font-black text-yellow-500 text-center" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-zinc-600 uppercase tracking-wider">Global Limit</label>
                        <input type="number" value={newPromo.maxUses} onChange={(e) => setNewPromo({ ...newPromo, maxUses: Number(e.target.value) })}
                          className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-2xl font-black text-white text-center" />
                      </div>
                    </div>
                    <button onClick={async () => { if (!newPromo.code) return; await adminService.addPromoCode(newPromo.code, newPromo.amount, newPromo.maxUses); showStatus('تم توليد الكود بنجاح'); setNewPromo({ code: '', amount: 1000, maxUses: 10 }); fetchData(); }}
                      className="w-full py-8 bg-yellow-500 text-black font-black text-3xl rounded-[3rem] hover:scale-[1.03] active:scale-95 transition-all shadow-[0_20px_60px_rgba(234,179,8,0.3)] flex items-center justify-center gap-4 italic uppercase">
                      <Save size={32} /> Commit Golden Forge
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-zinc-600 uppercase tracking-[0.3em] pl-4 italic">Active Coupon Clusters</h3>
                  {promoCodes.map(promo => (
                    <div key={promo.id} className="bg-gradient-to-r from-zinc-900 to-black border border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between group hover:border-yellow-500/30 transition-all shadow-2xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-24 h-full bg-yellow-500/5 skew-x-[-20deg] translate-x-12"></div>
                      <div className="flex items-center gap-10">
                        <div className="w-20 h-20 bg-yellow-500 rounded-3xl flex items-center justify-center text-black font-black text-4xl shadow-xl shrink-0 group-hover:rotate-12 transition-transform">
                          <Ticket size={40} />
                        </div>
                        <div>
                          <div className="text-3xl font-black text-white italic tracking-widest uppercase">{promo.code}</div>
                          <div className="flex items-center gap-5 mt-3">
                            <span className="text-yellow-500 font-black text-lg italic">§ {promo.reward_amount}</span>
                            <div className="h-4 w-px bg-zinc-700"></div>
                            <span className="text-zinc-500 text-sm font-bold uppercase">{promo.current_uses} / {promo.max_uses} USES</span>
                            <div className="h-4 w-px bg-zinc-700"></div>
                            <span className={`text-sm font-black uppercase ${promo.is_active ? 'text-green-500' : 'text-red-500'}`}>{promo.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative z-10 opacity-0 group-hover:opacity-100 flex items-center gap-3">
                        <button onClick={() => adminService.togglePromoActive(promo.id, !promo.is_active).then(fetchData)} className={`p-4 rounded-2xl transition-all ${promo.is_active ? 'bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white' : 'bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-black'}`}>{promo.is_active ? <EyeOff size={22} /> : <Eye size={22} />}</button>
                        <button onClick={() => adminService.deletePromoCode(promo.id).then(fetchData)} className="p-4 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={24} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ARENA TAB */}
          {activeTab === 'arena' && (
            <div className="space-y-12 animate-in fade-in duration-1000">
              <div>
                <h2 className="text-6xl font-black text-white italic tracking-tighter">ARENA CORE</h2>
                <p className="text-zinc-500 font-bold mt-4 text-xl italic uppercase">Quantum Environment Manipulation Control</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="rounded-[4rem] border border-white/5 bg-white/[0.01] p-10 hover:border-red-600/30 transition-all shadow-2xl flex flex-col">
                  <h3 className="text-2xl font-black text-white italic mb-10 border-b border-white/5 pb-4 flex items-center justify-between">Thematic Matrix <Palette size={24} className="text-red-600" /></h3>
                  <div className="grid grid-cols-1 gap-4 flex-1">
                    {['default', 'neon_blue', 'golden_arena', 'stealth_dark'].map(m => (
                      <button key={m} onClick={() => updateArena('global_mood', { ...arenaStatus.global_mood, theme: m })}
                        className={`p-6 rounded-[2rem] flex items-center justify-center border-2 transition-all font-black text-sm uppercase tracking-widest ${arenaStatus.global_mood?.theme === m ? 'border-red-600 bg-white/5 text-white scale-105 shadow-xl' : 'border-transparent bg-black/40 text-zinc-600 hover:border-white/10'}`}>
                        {m.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[4rem] border border-white/5 bg-white/[0.01] p-10 hover:border-green-500/30 transition-all shadow-2xl flex flex-col">
                  <h3 className="text-2xl font-black text-white italic mb-10 border-b border-white/5 pb-4 flex items-center justify-between">Visual FX <Sparkles size={24} className="text-green-500" /></h3>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    {[
                      { id: 'none', label: 'VOID', icon: EyeOff, color: 'text-zinc-600' },
                      { id: 'snow', label: 'SNOW', icon: Wind, color: 'text-blue-400' },
                      { id: 'fire', label: 'EMBER', icon: Flame, color: 'text-orange-500' },
                      { id: 'confetti', label: 'CELEB', icon: Sparkles, color: 'text-green-500' }
                    ].map(fx => (
                      <button key={fx.id} onClick={() => updateArena('global_mood', { ...arenaStatus.global_mood, particles: fx.id })}
                        className={`p-8 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all border-2 ${arenaStatus.global_mood?.particles === fx.id ? 'bg-green-500 text-black border-green-500 scale-105 shadow-xl' : 'bg-black/40 text-zinc-600 border-transparent hover:border-white/10'}`}>
                        <fx.icon size={32} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{fx.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[4rem] border border-white/5 bg-white/[0.01] p-10 hover:border-blue-500/30 transition-all shadow-2xl flex flex-col">
                  <h3 className="text-2xl font-black text-white italic mb-10 border-b border-white/5 pb-4 flex items-center justify-between">Audio Stream <Music size={24} className="text-blue-500" /></h3>
                  <div className="space-y-8 flex-1">
                    <div className="bg-black/60 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
                      <span className="text-sm font-black uppercase tracking-widest text-zinc-500 italic">Streaming Status</span>
                      <button onClick={() => updateArena('audio_overlay', { ...arenaStatus.audio_overlay, enabled: !arenaStatus.audio_overlay?.enabled })}
                        className={`w-16 h-8 rounded-full p-1 relative transition-all ${arenaStatus.audio_overlay?.enabled ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                        <div className={`w-6 h-6 rounded-full bg-white shadow-lg transition-all ${arenaStatus.audio_overlay?.enabled ? 'translate-x-8' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                    <div className="bg-black/60 p-6 rounded-[2rem] border border-white/5">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-500 italic block mb-4">Volume Control</label>
                      <input type="range" min="0" max="1" step="0.1" value={arenaStatus.audio_overlay?.volume || 0.5}
                        onChange={(e) => updateArena('audio_overlay', { ...arenaStatus.audio_overlay, volume: parseFloat(e.target.value) })}
                        className="w-full accent-blue-600" />
                    </div>
                    <div className="bg-black/60 p-6 rounded-[2rem] border border-white/5">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-500 italic block mb-2">Source URL</label>
                      <input type="text" value={arenaStatus.audio_overlay?.url || ''}
                        onChange={(e) => updateArena('audio_overlay', { ...arenaStatus.audio_overlay, url: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm text-white font-black focus:border-blue-600 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div>
                <h2 className="text-6xl font-black text-zinc-400 italic tracking-tighter">AUDIT TRAIL</h2>
                <p className="text-zinc-600 font-bold mt-4 text-xl italic uppercase">Chronological Security Event Log</p>
              </div>

              <div className="rounded-[2.5rem] border border-white/5 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-white/[0.02] text-sm font-black uppercase text-zinc-500 tracking-[0.1em] border-b border-white/5">
                        <th className="p-6">الوقت</th>
                        <th className="p-6">المشرف</th>
                        <th className="p-6">الإجراء</th>
                        <th className="p-6">التفاصيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-all">
                          <td className="p-5 text-sm text-zinc-500 font-mono whitespace-nowrap">{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                          <td className="p-5 text-lg font-black italic text-white">{log.admin_username || 'SYSTEM'}</td>
                          <td className="p-5">
                            <span className="inline-block px-4 py-2 bg-white/5 rounded-xl text-sm font-black uppercase tracking-wider text-zinc-400">{log.action}</span>
                          </td>
                          <td className="p-5 text-sm text-zinc-500 font-bold">{log.details ? JSON.stringify(log.details).slice(0, 80) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
              <div>
                <h2 className="text-6xl font-black text-red-600 italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,0,0,0.3)]">SYSTEM CORE</h2>
                <p className="text-zinc-500 font-bold mt-4 text-xl italic uppercase">Deep Maintenance & Recovery Controls</p>
              </div>

              <div className="rounded-[4rem] border border-red-600/20 bg-red-600/[0.01] p-12 shadow-2xl space-y-10 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-red-600/5 blur-[100px] rounded-full"></div>

                <div className="relative z-10">
                  <h3 className="text-3xl font-black text-white italic mb-6 flex items-center gap-4"><Database className="text-red-600" size={32} /> Database Administration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/60 rounded-[2rem] p-8 border border-white/5">
                      <h4 className="text-lg font-black text-zinc-400 italic mb-4">Leaderboard Reset</h4>
                      <p className="text-sm text-zinc-600 font-bold mb-6">مسح جميع إحصائيات المتصدرين وإعادة تعيين اللوحة.</p>
                      <button onClick={async () => { if (confirm('هل أنت متأكد من تصفير لوحة المتصدرين بالكامل؟')) { await leaderboardService.resetLeaderboard(); showStatus('تم تصفير لوحة المتصدرين'); fetchData(); } }}
                        className="w-full py-4 bg-red-600/10 border border-red-500/20 rounded-2xl text-red-500 font-black text-base hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3">
                        <RotateCw size={20} /> Reset Leaderboard
                      </button>
                    </div>
                    <div className="bg-black/60 rounded-[2rem] p-8 border border-white/5">
                      <h4 className="text-lg font-black text-zinc-400 italic mb-4">Bulk Operations</h4>
                      <p className="text-sm text-zinc-600 font-bold mb-6">أدوات تحكم جماعية للمستخدمين والبيانات.</p>
                      <div className="flex flex-col gap-3">
                        <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 font-black text-base hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3">
                          <Fingerprint size={20} /> Validate All Sessions
                        </button>
                        <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 font-black text-base hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3">
                          <Clock size={20} /> Sync Timestamps
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 border-t border-white/5 pt-10">
                  <h3 className="text-3xl font-black text-white italic mb-6 flex items-center gap-4"><Shield className="text-red-600" size={32} /> Security Reset</h3>
                  <button onClick={async () => { if (confirm('إعادة تعيين كلمة سر الأدمن؟')) { await supabase.from('app_config').upsert({ key: 'admin_password', value: '123456' }); showStatus('تم إعادة تعيين كلمة السر إلى 123456'); } }}
                    className="w-full py-6 bg-black border-2 border-red-600 text-red-500 font-black text-2xl rounded-[3rem] hover:bg-red-600 hover:text-white transition-all shadow-[0_20px_60px_rgba(220,38,38,0.15)] flex items-center justify-center gap-4 italic uppercase">
                    <Key size={28} /> Reset Admin Password to Default
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
