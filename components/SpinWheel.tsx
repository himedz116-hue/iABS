
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChatUser } from '../types';
import { chatService } from '../services/chatService';
import { leaderboardService } from '../services/supabase';
import {
   Trophy, Users, Play, RotateCcw, Lock, Unlock,
   Trash2, LogOut, Home, Settings, Zap, Clock,
   Sparkles, Volume2, VolumeX, History, Palette,
   ChevronRight, Check, ShieldCheck, UserPlus, Image as ImageIcon,
   UserMinus, RefreshCcw, Loader2, User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProAvatar } from './ProAvatar';

interface SpinWheelProps {
   channelConnected: boolean;
   onHome: () => void;
}

type GamePhase = 'SETUP' | 'PLAYING';

interface WheelConfig {
   joinKeyword: string;
   spinDuration: number;
   soundEnabled: boolean;
   autoReopen: boolean;
   neonGlow: boolean;
   showAvatars: boolean;
   minParticipants: number;
   removeWinner: boolean;
}

// Sticker mapping replicated from MusicalChairsGame for consistency
const STICKERS_IABS_MAPPING: Record<string, string | null> = {
   'iabs324244': '3544675', 'iabsdance': '4428507', 'iabsddddddd': '3109207', 'iabshhhh': '3689146',
   'iabsKSA1': '2942650', 'iabst79eer': '4338825', 'iabst7yyhhh': '3989626', 'iabsw6nn': '4428504',
   'iabs235235': '3329508', 'iabs3': '1014969', 'iabs3oooo': '3989709', 'iabs4': '1014975',
   'iabs505': '3823817', 'iabs66': '1056550', 'iabs7': '1015210', 'iabs7son': '2893352',
   'iabs8': '1015225', 'iabs8rd': '2893346', 'iabsa': '1078051', 'iabsa4lfi': '3329257',
   'iabsashhhhhhhi': '3989578', 'iabsb6666666h': '4937186', 'iabsbatman': '3989610', 'iabsboo': '3330599',
   'iabsdaaaaaaaaaaaanc': '4937181', 'iabsdaaance': '3823818', 'iabsdaaanceee': '3989569',
   'iabsdaaannnccee3434': '4937184', 'iabsdanceee': '3500550', 'iabsddddd': '3109209',
   'iabseat': '3109204', 'iabsewwwwwwwwwww': '3989594', 'iabsfloss': '3989597', 'iabsgoooo': '3330629',
   'iabsgraa7': '3989577', 'iabshaaaaaaaaaahhaa': '3329484', 'iabshhh44': '3689147', 'iabshmmmmmi': '2893345',
   'iabshootee': '3329485', 'iabshuu': '3109190', 'iabsjhj': '3330238', 'iabsknslh': '4953422',
   'iabskoksal': '3989580', 'iabslm': '3329260', 'iabsloooove': '4937189', 'iabsm39bbb': '3329530',
   'iabsm9dom': '3989615', 'iabsmusaeed': '3989609', 'iabsnashb': '2893344', 'iabsqqq': '3330234',
   'iabsqwqw': '3330235', 'iabsr3333333b': '4937191', 'iabsrbbee3': '3989591', 'iabsshhhhhhhhhhh': '3330619',
   'iabssmallcup': '2607940', 'iabsswalllffff': '4937179', 'iabst777yh': '3989623', 'iabsw3lykmm': '3544674'
};
const STICKERS_IABS = Object.keys(STICKERS_IABS_MAPPING).map(s => ({ name: s, id: STICKERS_IABS_MAPPING[s] }));

const SidebarPortal = ({ children }: { children?: React.ReactNode }) => {
   const [mounted, setMounted] = useState(false);
   useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
   const el = document.getElementById('game-sidebar-portal');
   if (!mounted || !el) return null;
   return createPortal(children, el);
};

export const SpinWheel: React.FC<SpinWheelProps> = ({ channelConnected, onHome }) => {
   const [phase, setPhase] = useState<GamePhase>('SETUP');
   const [config, setConfig] = useState<WheelConfig>({
      joinKeyword: '!دخول',
      spinDuration: 8,
      soundEnabled: true,
      autoReopen: false,
      neonGlow: true,
      showAvatars: true,
       minParticipants: 2,
      removeWinner: false
   });

   const [participants, setParticipants] = useState<ChatUser[]>([]);
   const [isSpinning, setIsSpinning] = useState(false);
   const [isOpen, setIsOpen] = useState(false);
   const [winner, setWinner] = useState<ChatUser | null>(null);
   const canSpin = isOpen && participants.length >= config.minParticipants && !isSpinning;
   const [rotation, setRotation] = useState(0);
   const [history, setHistory] = useState<ChatUser[]>([]);
   const [botCount, setBotCount] = useState(0);
   const [winnerAvatarUrl, setWinnerAvatarUrl] = useState<string | null>(null);

   const canvasRef = useRef<HTMLCanvasElement>(null);
   const needleRef = useRef<HTMLDivElement>(null);
   const isOpenRef = useRef(isOpen);
   const participantsRef = useRef(participants);
   const configRef = useRef(config);
   const spinStartRef = useRef(0);
   const spinDurationRef = useRef(0);
   const spinStartRotRef = useRef(0);
   const spinEndRotRef = useRef(0);
   const rafRef = useRef(0);
   const highlightRef = useRef(-1);
   const isSpinningRef = useRef(false);
   const currentAngleRef = useRef(0);

   useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
    useEffect(() => { participantsRef.current = participants; }, [participants]);
   useEffect(() => { configRef.current = config; }, [config]);
   useEffect(() => { currentAngleRef.current = rotation; }, [rotation]);

   const wheelColors = useMemo(() => [
      '#ff0000', '#22c55e', '#3b82f6', '#eab308', '#a855f7',
      '#ec4899', '#f97316', '#06b6d4', '#8b5cf6', '#ef4444'
   ], []);

   // Chat integration with sticker support
   useEffect(() => {
      if (!channelConnected) return;
      const cleanup = chatService.onMessage((msg) => {
         if (phase !== 'PLAYING' || !isOpenRef.current) return;

         const lower = msg.content.toLowerCase();
         const raw = msg.content;
         const keyword = configRef.current.joinKeyword.toLowerCase();

         // Sticker logic
         const targetStickerId = STICKERS_IABS_MAPPING[keyword];
         const isKeywordMatch = keyword && lower.includes(keyword);
         const isStickerIdMatch = targetStickerId && raw.includes(targetStickerId);
         const isStickerTagMatch = targetStickerId && lower.includes(`emote:${targetStickerId}:`);

         if (isKeywordMatch || isStickerIdMatch || isStickerTagMatch) {
            setParticipants(prev => {
               if (prev.length >= 500) return prev;

               const newUserLower = msg.user.username.toLowerCase().trim();
               const exists = prev.some(p => p.username.toLowerCase().trim() === newUserLower);

               if (exists) {
                  return prev;
               }

               // Fetch real Kick avatar asynchronously
               chatService.fetchKickAvatar(msg.user.username).then(avatar => {
                  if (avatar) {
                     setParticipants(current => current.map(p =>
                        p.username === msg.user.username ? { ...p, avatar } : p
                     ));
                  }
               });

               return [...prev, msg.user];
            });
         }
      });
      return cleanup;
   }, [channelConnected, phase]);

   // Standalone canvas draw that reads from refs (no React dependency)
   const drawFrame = useCallback((highlightIdx: number, spinning: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 20;

      ctx.clearRect(0, 0, size, size);

      const pList = participantsRef.current;
      const count = pList.length;
      if (count === 0) {
         const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
         grad.addColorStop(0, '#16161a');
         grad.addColorStop(1, '#0c0c0e');
         ctx.beginPath();
         ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
         ctx.fillStyle = grad;
         ctx.fill();
         ctx.strokeStyle = '#333';
         ctx.lineWidth = 10;
         ctx.stroke();
         ctx.fillStyle = '#444';
         ctx.font = 'black 60px "Outfit", sans-serif';
         ctx.textAlign = 'center';
         ctx.fillText('ARENA EMPTY', centerX, centerY);
         return;
      }

      const angleStep = (Math.PI * 2) / count;
      const segAngleDeg = 360 / count;
      const isNarrow = segAngleDeg < 20;

      pList.forEach((p, i) => {
         const startAngle = i * angleStep;
         const endAngle = (i + 1) * angleStep;
         const isHl = highlightIdx === i && spinning;

         ctx.beginPath();
         ctx.moveTo(centerX, centerY);
         ctx.arc(centerX, centerY, radius, startAngle, endAngle);

           const color = wheelColors[i % wheelColors.length];
           if (isHl) {
              const hlGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
              hlGrad.addColorStop(0, '#ffd700');
              hlGrad.addColorStop(0.6, '#ffaa00');
              hlGrad.addColorStop(1, '#ff8800');
              ctx.fillStyle = hlGrad;
              ctx.shadowColor = 'rgba(255,215,0,0.9)';
              ctx.shadowBlur = 50;
           } else {
              const segmentGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius);
              // Alternate brightness for visual separation at high counts
              const altFactor = (i % 2 === 0) ? 0 : 0.15;
              segmentGrad.addColorStop(0, color);
              segmentGrad.addColorStop(1, `rgba(0,0,0,${0.3 + altFactor})`);
              ctx.fillStyle = segmentGrad;
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
           }
           ctx.fill();
           ctx.shadowColor = 'transparent';

           if (isHl) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 6;
              ctx.stroke();
              ctx.strokeStyle = '#ffd700';
              ctx.lineWidth = 3;
              ctx.stroke();
           } else {
              // White separator lines between segments
              ctx.strokeStyle = count > 30 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
              ctx.lineWidth = count > 60 ? 0.5 : 1;
              ctx.stroke();
           }

         ctx.save();
         ctx.translate(centerX, centerY);
         ctx.rotate(startAngle + angleStep / 2);

          let fontSize: number;
          if (count <= 8) fontSize = 32;
          else if (count <= 15) fontSize = 26;
          else if (count <= 25) fontSize = 20;
          else if (count <= 40) fontSize = 16;
          else if (count <= 60) fontSize = 13;
          else if (count <= 90) fontSize = 11;
          else if (count <= 130) fontSize = 10;
          else if (count <= 200) fontSize = 9;
          else if (count <= 300) fontSize = 8;
          else fontSize = 6;
          fontSize = Math.min(fontSize, radius * 0.13);
          fontSize = Math.max(5, fontSize);

         const truncatedName = p.username.length > 16 ? p.username.substring(0, 13) + '..' : p.username;

         ctx.fillStyle = '#ffffff';
         ctx.font = `900 ${fontSize}px "Outfit", sans-serif`;
         ctx.shadowColor = 'rgba(0,0,0,1)';
         ctx.shadowBlur = 8;

         if (isNarrow) {
            ctx.rotate(-Math.PI / 2);
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             if (isHl) {
                ctx.shadowColor = 'rgba(255,215,0,1)';
                ctx.shadowBlur = 30;
                ctx.fillStyle = '#ffd700';
             }
             ctx.fillText(truncatedName, 0, -(radius - fontSize * 1.5));
          } else {
             ctx.textAlign = 'right';
             ctx.textBaseline = 'middle';
             ctx.strokeStyle = 'rgba(0,0,0,0.7)';
             ctx.lineWidth = 4;
             ctx.strokeText(truncatedName, radius - 24, 0);
             if (isHl) {
                ctx.shadowColor = 'rgba(255,215,0,1)';
                ctx.shadowBlur = 30;
                ctx.fillStyle = '#ffd700';
             }
             ctx.fillText(truncatedName, radius - 24, 0);
         }
         ctx.restore();
      });

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#1a1a1e';
      ctx.lineWidth = 20;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0c';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 10;
      ctx.stroke();
   }, [wheelColors]);

   const drawWheel = useCallback(() => {
      drawFrame(-1, false);
   }, [drawFrame]);

   useEffect(() => { drawWheel(); }, [drawWheel, participants.length]);

   // Redraw when participants content changes (not during spin)
   useEffect(() => {
      if (!isSpinningRef.current) drawFrame(-1, false);
   }, [participants]);

   // cubic-bezier(0.05, 0.7, 0.1, 1) — faster start, slower deceleration
   // X(t) = 0.15t + 0.3t² + 0.55t³, Y(t) = 2.4t - 1.8t² + 0.4t³
   const cubicBezier = (t: number): number => {
      let u = t;
      for (let i = 0; i < 8; i++) {
         const xCur = 0.15*u + 0.3*u*u + 0.55*u*u*u;
         const dx = 0.15 + 0.6*u + 1.65*u*u;
         if (Math.abs(xCur - t) < 1e-6) break;
         u -= (xCur - t) / dx;
      }
      u = Math.max(0, Math.min(1, u));
      return 2.4*u - 1.8*u*u + 0.4*u*u*u;
   };

   const spinTheWheel = () => {
      if (!isOpen || participants.length < config.minParticipants || isSpinning) return;

      setIsSpinning(true);
      isSpinningRef.current = true;
      setIsOpen(false);
      setWinner(null);
      setWinnerAvatarUrl(null);

      const winIndex = Math.floor(Math.random() * participants.length);
      const preloadUser = participants[winIndex];
      // Preload winner avatar during spin so it's ready when animation ends
      if (preloadUser.avatar) {
         const img = new Image();
         img.src = preloadUser.avatar;
         setWinnerAvatarUrl(preloadUser.avatar);
      } else {
         setWinnerAvatarUrl(null);
      }
      const angleStep = 360 / participants.length;
      const extraSpins = 360 * (18 + Math.floor(Math.random() * 10));
      // Needle rotation 0° = points UP (canvas 270°).
      // Winner segment center canvas angle = winIndex * angleStep + angleStep/2
      // Needle rotation to point there = (winnerCanvasAngle - 270) mod 360
      const winnerNeedleAngle = ((winIndex * angleStep + angleStep / 2 - 270) % 360 + 360) % 360;
      const finalAngle = currentAngleRef.current - (currentAngleRef.current % 360) + winnerNeedleAngle + extraSpins;

      const duration = config.spinDuration * 1000;
      const startAngle = currentAngleRef.current;
      const startTime = Date.now();

      spinStartRef.current = startTime;
      spinDurationRef.current = duration;
      spinStartRotRef.current = startAngle;
      spinEndRotRef.current = finalAngle;
      highlightRef.current = -1;

      const animateSpin = () => {
         const elapsed = Date.now() - startTime;
         const progress = Math.min(1, elapsed / duration);
         const eased = cubicBezier(progress);
         const currentAngle = startAngle + (finalAngle - startAngle) * eased;

         // Rotate needle (not the wheel)
         currentAngleRef.current = currentAngle;
         if (needleRef.current) {
            needleRef.current.style.transform = `rotate(${currentAngle}deg)`;
         }

         // Track which segment the needle points at
         // Needle rotation 0° = points UP (canvas 270°)
         // Convert needle rotation to canvas angle: (rot + 270) % 360
         const canvasAngle = ((currentAngle % 360) + 270 + 360) % 360;
         const count = participantsRef.current.length;
         if (count > 0) {
            const segAngle = 360 / count;
            const idx = Math.floor(canvasAngle / segAngle) % count;
            highlightRef.current = idx;
            drawFrame(idx, true);
         }

         if (progress < 1) {
            rafRef.current = requestAnimationFrame(animateSpin);
         } else {
            // Spin complete
            highlightRef.current = -1;
            drawFrame(-1, false);
            currentAngleRef.current = finalAngle;
            setRotation(finalAngle);
            setIsSpinning(false);
            isSpinningRef.current = false;

            const winUser = participants[winIndex];
            setWinner(winUser);
            setHistory(prev => [winUser, ...prev].slice(0, 15));

            confetti({
               particleCount: 200,
               spread: 90,
               origin: { y: 0.6 },
               colors: ['#ff0000', '#ffffff', '#ffd700', '#3b82f6']
            });

            leaderboardService.recordWin(winUser.username, winUser.avatar || '', 100);

            if (config.removeWinner) {
               setTimeout(() => {
                  setParticipants(prev => prev.filter((_, idx) => idx !== winIndex));
               }, 3000);
            }

            if (config.autoReopen) {
               setTimeout(() => setIsOpen(true), 4000);
            }
         }
      };

      rafRef.current = requestAnimationFrame(animateSpin);
   };

   const resetGame = () => {
      setParticipants([]);
      setWinner(null);
      setRotation(0);
      setIsOpen(false);
      setHistory([]);
   };

   const selectedSticker = useMemo(() => {
      const s = STICKERS_IABS.find(x => x.name.toLowerCase() === config.joinKeyword.toLowerCase());
      return s ? `https://files.kick.com/emotes/${s.id}/full` : null;
   }, [config.joinKeyword]);

   return (
      <>
         <SidebarPortal>
            {phase === 'PLAYING' && (
               <div className="space-y-3 animate-in slide-in-from-right duration-500">
                  {/* Control Panel */}
                  <div className="glass-card p-3 rounded-[1.5rem] border border-white/5 space-y-3 shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
                     <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                           <Settings size={14} className="text-red-600" /> مـيدان الـعجلة
                        </h4>
                        <button onClick={() => setPhase('SETUP')} className="text-gray-500 hover:text-white transition-colors">
                           <RotateCcw size={16} />
                        </button>
                     </div>

                      <div className="grid grid-cols-2 gap-2">
                         {!isOpen ? (
                            <button onClick={() => setIsOpen(true)} className="bg-white/5 text-green-500 border border-green-500/20 font-black py-3 rounded-xl text-[10px] hover:bg-green-500/10 transition-all flex flex-col items-center justify-center gap-2 uppercase italic">
                               <Unlock size={18} /> فتح الانضمام
                            </button>
                         ) : (
                            <button onClick={() => setIsOpen(false)} className="bg-red-600 text-white font-black py-3 rounded-xl text-[10px] shadow-lg shadow-red-600/20 flex flex-col items-center justify-center gap-2 uppercase italic animate-pulse">
                               <Lock size={18} /> إغلاق الانضمام
                            </button>
                         )}
                         <button onClick={resetGame} className="bg-white/5 text-gray-400 font-black py-3 rounded-xl text-[10px] border border-white/5 hover:text-white transition-all italic uppercase flex flex-col items-center justify-center gap-2">
                            <Trash2 size={18} /> تصفير
                         </button>
                      </div>


                      {isOpen && (
                         <div className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl px-3 py-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[8px] font-black text-emerald-400 italic uppercase tracking-wider">
                               {participants.length >= config.minParticipants ? 'جاهز للتدوير' : `يحتاج ${config.minParticipants - participants.length}`}
                            </span>
                         </div>
                      )}
                     <button
                        onClick={spinTheWheel}
                        disabled={!canSpin}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-3 rounded-2xl text-xs shadow-[0_6px_20px_rgba(220,38,38,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 italic border-t-2 border-white/20 disabled:opacity-30"
                     >
                        {isSpinning ? <Loader2 className="animate-spin" size={20} /> : <Play fill="currentColor" size={20} />} تـدوير الـعـجـلـة
                     </button>
                  </div>

                  {/* Participants List */}
                  <div className="glass-card rounded-xl border border-white/5 flex flex-col overflow-hidden h-[180px] shadow-xl">
                     <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                              <Users size={14} className="text-red-600" /> المتواجدون
                           </span>
                        </div>
                        <span className="bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black italic shadow-lg">{participants.length}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {participants.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                              <UserPlus size={24} className="mb-1 text-gray-400" />
                              <p className="text-[10px] font-black text-gray-500">في انتظار الأبطال...</p>
                           </div>
                        ) : (
                           [...participants].reverse().map((p, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 rounded-xl transition-all border border-white/5 bg-black/20 hover:bg-white/5 group animate-in slide-in-from-right duration-300">
                                  <ProAvatar
                                     url={p.avatar || ''}
                                     username={p.username}
                                     size="w-8 h-8"
                                     className="overflow-visible"
                                  />
                                 <span className="text-[11px] font-black text-white truncate">{p.username}</span>
                              </div>
                           ))
                        )}
                     </div>
                  </div>

                  {/* Winner History Mini */}
                  {history.length > 0 && (
                     <div className="glass-card p-3 rounded-xl border border-white/5 shadow-xl">
                        <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1 mb-2">
                           <History size={12} className="text-amber-500" /> السجل الأخير
                        </h4>
                        <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                           {history.map((h, i) => (
                              <div key={i} className="w-8 h-8 rounded-lg border border-amber-500/30 shrink-0 shadow-lg flex items-center justify-center bg-black/40 overflow-visible" title={h.username}>
                                  <ProAvatar
                                     url={h.avatar || ''}
                                     username={h.username}
                                     size="w-10 h-10"
                                     className="overflow-visible"
                                  />
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            )}
         </SidebarPortal>

         <div className="w-full h-full flex flex-col items-center justify-center bg-transparent relative font-display select-none overflow-hidden" dir="rtl">

            {phase === 'SETUP' ? (
               <div className="w-full max-w-3xl animate-in fade-in zoom-in duration-700 p-5">
                  <div className="flex flex-col items-center text-center mb-8">
                     <div className="relative group p-4">
                        <div className="absolute inset-0 bg-red-600 blur-[36px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-800 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.4)] mb-6 transform group-hover:scale-110 transition-transform duration-500 border-2 border-white/20">
                           <Zap size={28} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" fill="white" />
                        </div>
                     </div>
                     <h1 className="text-7xl font-black text-white italic tracking-tighter uppercase mb-2 drop-shadow-[0_0_24px_rgba(255,255,255,0.1)]">عـجلة الـحظ</h1>
                     <div className="flex items-center gap-3">
                        <span className="h-px w-12 bg-red-600/40"></span>
                        <p className="text-red-500 font-black tracking-[0.6em] text-xs uppercase italic">Premium Arena Hub</p>
                        <span className="h-px w-12 bg-red-600/40"></span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Left Column: Basic Settings */}
                     <div className="glass-card p-6 rounded-[2rem] border border-white/10 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-600 group-hover:w-2 transition-all"></div>
                        <h3 className="text-lg font-black text-white flex items-center gap-3 mb-6"><Zap className="text-red-600" /> إعـدادات الـدخول</h3>

                        <div className="space-y-6">
                           <div className="space-y-3">
                              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex justify-between">
                                 كلمة الانضمام <span className="text-red-500 font-bold">{selectedSticker ? 'ملصق مكتشف' : 'نص'}</span>
                              </label>
                              <div className="relative">
                                 <input
                                    value={config.joinKeyword}
                                    onChange={e => setConfig({ ...config, joinKeyword: e.target.value })}
                                    className="w-full bg-black/60 border-2 border-white/5 focus:border-red-600 rounded-[1.5rem] py-4 px-5 text-white font-black text-xl outline-none transition-all shadow-inner"
                                    placeholder="!دخول أو اسم الملصق"
                                 />
                                 <div className="absolute left-6 top-1/2 -translate-y-1/2">
                                    {selectedSticker ? (
                                       <img src={selectedSticker} className="w-8 h-8 object-contain animate-bounce" alt="sticker" />
                                    ) : (
                                       <UserPlus className="text-gray-500" size={20} />
                                    )}
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-3">
                              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                                 <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Clock size={12} /> مـدة الـدوران</label>
                                 <div className="flex items-center justify-between">
                                    <button onClick={() => setConfig({ ...config, spinDuration: Math.max(3, config.spinDuration - 1) })} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white font-black transition-all">-</button>
                                    <span className="text-lg font-black text-white font-mono">{config.spinDuration}s</span>
                                    <button onClick={() => setConfig({ ...config, spinDuration: Math.min(20, config.spinDuration + 1) })} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white font-black transition-all">+</button>
                                 </div>
                              </div>
                              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                                 <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Users size={12} /> الـحد الأدنى</label>
                                 <div className="flex items-center justify-between">
                                    <button onClick={() => setConfig({ ...config, minParticipants: Math.max(1, config.minParticipants - 1) })} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white font-black transition-all">-</button>
                                    <span className="text-lg font-black text-white font-mono">{config.minParticipants}</span>
                                    <button onClick={() => setConfig({ ...config, minParticipants: Math.min(50, config.minParticipants + 1) })} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white font-black transition-all">+</button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Right Column: Visuals & Logic */}
                     <div className="glass-card p-6 rounded-[2rem] border border-white/10 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-1 h-full bg-red-600 group-hover:w-2 transition-all"></div>
                        <h3 className="text-lg font-black text-white flex items-center gap-3 mb-6"><Palette className="text-red-600" /> إضـافات مـتقدمة</h3>

                        <div className="grid grid-cols-2 gap-3">
                           <button onClick={() => setConfig({ ...config, soundEnabled: !config.soundEnabled })} className={`p-3 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-2 ${config.soundEnabled ? 'bg-red-600/20 border-red-600 text-white shadow-lg' : 'bg-white/5 border-transparent text-gray-500 grayscale'}`}>
                              {config.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                              <span className="text-[10px] font-black uppercase tracking-wider">سـاوند إفـكت</span>
                           </button>
                           <button onClick={() => setConfig({ ...config, neonGlow: !config.neonGlow })} className={`p-3 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-2 ${config.neonGlow ? 'bg-red-600/20 border-red-600 text-white shadow-lg' : 'bg-white/5 border-transparent text-gray-500 grayscale'}`}>
                              <Sparkles size={20} />
                              <span className="text-[10px] font-black uppercase tracking-wider">تـوهج نـيون</span>
                           </button>
                           <button onClick={() => setConfig({ ...config, removeWinner: !config.removeWinner })} className={`p-3 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-2 ${config.removeWinner ? 'bg-red-600/20 border-red-600 text-white shadow-lg' : 'bg-white/5 border-transparent text-gray-500 grayscale'}`}>
                              <UserMinus size={20} />
                              <span className="text-[10px] font-black uppercase tracking-wider">استبعاد الـفائز</span>
                           </button>
                           <button onClick={() => setConfig({ ...config, showAvatars: !config.showAvatars })} className={`p-3 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-2 ${config.showAvatars ? 'bg-red-600/20 border-red-600 text-white shadow-lg' : 'bg-white/5 border-transparent text-gray-500 grayscale'}`}>
                              <ImageIcon size={20} />
                              <span className="text-[10px] font-black uppercase tracking-wider">عـرض الـصور</span>
                           </button>
                        </div>

                        <button
                           onClick={() => setPhase('PLAYING')}
                           className="w-full mt-6 bg-white text-black font-black py-4 rounded-[1.5rem] text-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 shadow-[0_12px_36px_rgba(255,255,255,0.15)] italic border-t-2 border-red-600"
                        >
                           بـدء الـمواجهة <ChevronRight size={24} className="rotate-180" />
                        </button>
                     </div>
                  </div>

                  <div className="flex justify-center mt-8 gap-4">
                     <button onClick={onHome} className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all border border-white/5 shadow-lg">
                        <Home size={22} />
                     </button>
                  </div>
               </div>
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center relative p-5">
                   {winner && (
                      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-in zoom-in duration-500">
                        {/* Celebration background effects */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-500/20 blur-[120px] rounded-full animate-pulse" style={{animationDuration:'3s'}}></div>
                          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-red-600/15 blur-[100px] rounded-full animate-pulse" style={{animationDuration:'4s', animationDelay:'1s'}}></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-amber-500/5 via-red-500/5 to-amber-500/5 rounded-full blur-[80px] animate-spin-slow" style={{animationDuration:'10s'}}></div>
                          {/* Floating celebration particles */}
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="absolute w-2 h-2 rounded-full" style={{
                              left: `${5 + (i * 8) % 90}%`,
                              top: `${5 + (i * 11) % 90}%`,
                              background: ['#ffd700','#ff0000','#ffffff','#ff6600','#ff00ff'][i % 5],
                              boxShadow: `0 0 10px ${['#ffd700','#ff0000','#ffffff','#ff6600','#ff00ff'][i % 5]}`,
                              animation: `particle-drift ${3 + (i % 3)}s ease-in-out infinite`,
                              animationDelay: `${i * 0.4}s`,
                              '--dx': `${(i % 2 === 0 ? 1 : -1) * (40 + i * 8)}px`,
                              '--dy': `${-50 - i * 15}px`,
                              '--r': `${i * 30}deg`,
                            } as React.CSSProperties}></div>
                          ))}
                        </div>

                        <div className="relative max-w-lg w-full mx-4">
                          {/* Trophy */}
                          <div className="flex justify-center mb-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-amber-500 blur-[60px] opacity-30 animate-pulse" style={{animationDuration:'1.5s'}}></div>
                              <Trophy size={80} className="text-[#FFD700] animate-bounce drop-shadow-[0_0_40px_rgba(255,215,0,0.8)]" fill="currentColor" strokeWidth={1.5} />
                            </div>
                          </div>

                          {/* Winner card - premium */}
                          <div className="bg-gradient-to-b from-[#0a0a0c] to-[#050505] p-8 rounded-[2.5rem] border border-amber-500/30 shadow-[0_0_80px_rgba(255,215,0,0.2)] text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[2000ms] skew-x-[-20deg]"></div>

                             {/* Avatar - big */}
                             <div className="relative mx-auto mb-5 w-28 h-28">
                               <div className="absolute -inset-3 bg-gradient-to-br from-amber-400 via-red-500 to-amber-400 rounded-[1.5rem] animate-spin-slow opacity-60 blur-[2px]" style={{animationDuration:'4s'}}></div>
                               <div className="relative w-full h-full rounded-[1.25rem] overflow-hidden ring-2 ring-amber-500/50 shadow-[0_0_40px_rgba(255,215,0,0.4)] bg-[#111]">
                                 {winnerAvatarUrl ? (
                                   <img src={winnerAvatarUrl} className="w-full h-full object-cover" alt="" onError={() => setWinnerAvatarUrl(null)} referrerPolicy="no-referrer" />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center">
                                     <span className="text-5xl font-black text-amber-500/80 uppercase select-none">{winner.username.charAt(0)}</span>
                                   </div>
                                 )}
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                               </div>
                             </div>

                            <div className="text-amber-500 font-black uppercase tracking-[0.5em] text-[10px] mb-3 italic flex items-center justify-center gap-3">
                              <span className="w-12 h-px bg-amber-500/40"></span> بـطل الـساحة <span className="w-12 h-px bg-amber-500/40"></span>
                            </div>

                            <div className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_6px_20px_rgba(0,0,0,1)] mb-2">{winner.username}</div>

                            <div className="flex items-center justify-center gap-2 mb-6">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                              <span className="text-[9px] text-amber-500/60 font-black tracking-[0.4em] uppercase italic">CHAMPION</span>
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" style={{animationDelay:'0.5s'}}></span>
                            </div>

                            <div className="flex gap-3 justify-center">
                              <button onClick={() => setWinner(null)} className="px-6 py-3 bg-white/5 border border-white/10 text-white font-black text-sm rounded-xl hover:bg-white/10 hover:scale-105 transition-all italic">
                                إغلاق
                              </button>
                              <button onClick={onHome} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-sm rounded-xl hover:scale-105 transition-all italic shadow-[0_0_25px_rgba(255,215,0,0.3)] border-t-2 border-white/20 flex items-center gap-2">
                                الرئيسية
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                   )}

                   <div className="relative" style={{perspective:'800px'}}>
                      <div className="relative w-[480px] h-[480px] md:w-[560px] md:h-[560px] flex items-center justify-center mx-auto my-auto scale-[0.85] md:scale-100">

                      {/* Spinning glow effects */}
                      {isSpinning && (
                        <>
                          <div className="absolute inset-[-30px] rounded-full bg-gradient-to-r from-red-600/20 via-red-500/10 to-red-600/20 animate-spin-slow blur-[40px] pointer-events-none" style={{animationDuration:'2s'}}></div>
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="absolute w-2 h-2 bg-red-500/80 rounded-full blur-[2px] animate-ping pointer-events-none" style={{
                              left: `${30 + Math.sin(i * 1.047) * 40 + 50}%`,
                              top: `${30 + Math.cos(i * 1.047) * 40 + 50}%`,
                              animationDelay: `${i * 0.3}s`,
                              animationDuration: '1.5s'
                            }}></div>
                          ))}
                        </>
                      )}

                      {/* Wheel - fixed, does NOT rotate */}
                      <div className={`w-[380px] h-[380px] md:w-[420px] md:h-[420px] rounded-full p-3 bg-[#0a0a0c] border-[12px] border-[#16161a] shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden ${config.neonGlow ? 'premium-neon' : ''} relative`}>
                         <canvas
                            ref={canvasRef}
                            width={1200}
                            height={1200}
                            className="w-full h-full"
                         />
                         {/* Needle pointer at center - rotates */}
                         <div ref={needleRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 z-[55]" style={{ transformOrigin: 'center center' }}>
                            {/* Glow trail behind needle */}
                            <div className="absolute top-0 left-0 w-0 h-0" style={{ transform: 'rotate(180deg)', transformOrigin: 'center center' }}>
                               <div className={`absolute top-[-35px] left-[-10px] w-5 h-[135px] bg-gradient-to-t from-red-600/60 via-red-500/20 to-transparent blur-[14px] ${isSpinning ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`} style={{ borderRadius: '50% 50% 0 0' }}></div>
                            </div>
                            {/* Premium red needle with gold accents - visible against any color */}
                            <div className="relative" style={{ transform: 'translateY(-118px)' }}>
                               {/* Animated tip glow - larger */}
                               <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-red-500/30 blur-[12px] rounded-full animate-ping ${isSpinning ? 'opacity-100' : 'opacity-0'}`} style={{animationDuration:'1s'}}></div>
                               {/* Tip golden spark */}
                               <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-400/40 blur-[6px] rounded-full ${isSpinning ? 'opacity-100' : 'opacity-0'}`}></div>
                               <svg width="20" height="118" viewBox="0 0 20 118" className="drop-shadow-[0_0_35px_rgba(255,0,0,0.9)]">
                                  <defs>
                                     <linearGradient id="needleGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                        <stop offset="0%" stopColor="#660000"/>
                                        <stop offset="25%" stopColor="#b30000"/>
                                        <stop offset="60%" stopColor="#ff1a1a"/>
                                        <stop offset="100%" stopColor="#ff4444"/>
                                     </linearGradient>
                                     <linearGradient id="borderGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                        <stop offset="0%" stopColor="#ffd700"/>
                                        <stop offset="50%" stopColor="#ffaa00"/>
                                        <stop offset="100%" stopColor="#ffffff"/>
                                     </linearGradient>
                                     <filter id="needleGlow">
                                        <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ff0000" floodOpacity="0.95"/>
                                     </filter>
                                  </defs>
                                  {/* Outer gold border */}
                                  <path d="M10 0 L2 108 Q10 120 18 108 Z" fill="url(#borderGrad)" opacity="0.6"/>
                                  {/* Main red body */}
                                  <path d="M10 2 L4 106 Q10 116 16 106 Z" fill="url(#needleGrad)" filter="url(#needleGlow)"/>
                                  {/* Left shine strip */}
                                  <path d="M10 2 L4 106 Q6 108 8 105 L10 4 Z" fill="rgba(255,255,255,0.2)"/>
                                  {/* Center glow line */}
                                  <line x1="10" y1="4" x2="10" y2="108" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                                  {/* Tip gold accent */}
                                  <path d="M10 0 L8 8 Q10 12 12 8 Z" fill="#ffd700" opacity="0.8"/>
                                  {/* White tip dot */}
                                  <circle cx="10" cy="4" r="3" fill="white" opacity="0.95"/>
                               </svg>
                               {/* Base glow ring */}
                               <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-r from-red-600/40 to-amber-500/20 blur-[15px] rounded-full"></div>
                            </div>
                         </div>
                      </div>
                      
                      {/* Center Hub Premium - on top of needle base */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 md:w-32 md:h-32 bg-[#0a0a0c] rounded-full z-[70] border-[6px] border-[#16161a] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,1)]">
                         <div className="absolute -inset-4 bg-red-600/20 blur-[30px] rounded-full animate-pulse" style={{animationDuration:'2s'}}></div>
                         <button
                           onClick={() => canSpin && spinTheWheel()}
                           disabled={!canSpin}
                           className={`group w-[72px] h-[72px] md:w-[84px] md:h-[84px] bg-gradient-to-br from-red-500 to-red-800 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.6)] relative overflow-hidden transform rotate-45 border-2 border-white/30 transition-all duration-500 ${canSpin ? 'cursor-pointer hover:scale-110 hover:shadow-[0_0_60px_rgba(255,0,0,0.9)] active:scale-95 hover:border-white/50' : 'cursor-not-allowed opacity-40'}`}>
                            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 skew-x-[-20deg] pointer-events-none"></div>
                            {canSpin && (
                              <div className="absolute -inset-2 rounded-xl border-2 border-red-400/40 animate-ping opacity-0 group-hover:opacity-100 transition-opacity" style={{animationDuration:'1.5s'}}></div>
                            )}
                            <div className="text-white font-black text-xl md:text-2xl -rotate-45 italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">iABS</div>
                            {isSpinning && (
                              <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl"></div>
                            )}
                         </button>
                      </div>

                      {/* Premium Decorative Outer Rings */}
                      <div className="absolute inset-[-20px] border-[1px] border-white/10 rounded-full pointer-events-none opacity-30"></div>
                      <div className="absolute inset-[-42px] border-[1px] border-red-600/10 rounded-full pointer-events-none opacity-20" style={{animation: 'spin-slow 60s linear infinite'}}></div>
                      <div className="absolute inset-[-64px] border-[1px] border-white/5 rounded-full pointer-events-none opacity-10" style={{animation: 'reverse-slow 100s linear infinite'}}></div>

                      {/* Outer floating glow orbs */}
                      <div className="absolute -top-[3%] -left-[3%] w-32 h-32 bg-red-600/10 blur-[60px] rounded-full animate-pulse" style={{animationDuration:'4s'}}></div>
                      <div className="absolute -bottom-[3%] -right-[3%] w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full animate-pulse" style={{animationDuration:'5s', animationDelay:'1s'}}></div>

                      {/* Status badge next to wheel */}
                      <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full flex items-center gap-2 border text-[11px] font-black italic uppercase tracking-wider ${isOpen ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'bg-red-600/20 border-red-500/30 text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`}></span>
                        {isOpen ? 'مفتوح - يمكن التدوير' : 'مغلق'}
                      </div>
                      </div>
                   </div>

                  {/* Bottom Giant Info Bar */}
                  <div className="mt-4 bg-black/60 backdrop-blur-3xl border border-white/5 px-5 py-3 rounded-[1.5rem] flex items-center gap-4 shadow-[0_10px_36px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-10 duration-1000">
                     <div className="flex flex-col items-center px-4 border-l border-white/10">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                           <Users size={12} /> الـمقاتـلون
                        </span>
                        <span className="text-lg font-black text-white italic font-mono leading-none">{participants.length}</span>
                     </div>
                     <div className="flex flex-col items-center px-4 border-l border-white/10">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                           <Zap size={12} /> كـلمة الـدخول
                        </span>
                        <div className="flex items-center gap-3">
                           <span className="text-lg font-black text-red-500 italic uppercase leading-none">{config.joinKeyword}</span>
                           {selectedSticker && <img src={selectedSticker} className="w-8 h-8 object-contain" alt="s" />}
                        </div>
                     </div>
                     <div className="flex flex-col items-center px-4">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">الـحالة الـحالية</span>
                        <div className={`px-3 py-1 rounded-lg flex items-center gap-2 border ${isOpen ? 'bg-green-600/10 border-green-500 text-green-500' : 'bg-red-600/10 border-red-600 text-red-600'}`}>
                           {isOpen ? <Unlock size={16} className="animate-bounce" /> : <Lock size={16} />}
                           <span className="text-base font-black italic uppercase">
                              {isOpen ? 'مـفـتوح' : 'مـغـلق'}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>

         <style>{`
         .premium-neon {
           box-shadow: 0 0 60px rgba(220, 38, 38, 0.4), inset 0 0 60px rgba(220, 38, 38, 0.2);
           border-color: rgba(220, 38, 38, 0.5) !important;
         }
         @keyframes spin-slow {
           from { transform: rotate(0deg); }
           to { transform: rotate(360deg); }
         }
         @keyframes reverse-slow {
           from { transform: rotate(360deg); }
           to { transform: rotate(0deg); }
         }
        @keyframes wheel-shake {
          0%, 100% { transform: rotate(var(--r, 0deg)) translateX(0); }
          25% { transform: rotate(var(--r, 0deg)) translateX(-2px); }
          75% { transform: rotate(var(--r, 0deg)) translateX(2px); }
        }
        @keyframes spin-highlight {
          0% { transform: rotate(0deg) scaleY(1); opacity: 0.6; }
          25% { opacity: 1; }
          50% { transform: rotate(180deg) scaleY(1.1); opacity: 0.6; }
          75% { opacity: 1; }
          100% { transform: rotate(360deg) scaleY(1); opacity: 0.6; }
        }
        .animate-spin-slow { animation: spin-slow 80s linear infinite; }
        .animate-reverse-slow { animation: reverse-slow 120s linear infinite; }
        .animate-wheel-shake { animation: wheel-shake 0.15s ease-in-out infinite; }
        .animate-spin-highlight { animation: spin-highlight 1.5s linear infinite; }
         .clip-path-triangle { clip-path: polygon(50% 100%, 0 0, 100% 0); }
         
         .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(220, 38, 38, 0.5); }

         @media screen and (max-height: 900px) {
            .scale-90 { transform: scale(0.8); }
         }
      `}</style>
      </>
   );
};
