
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { chatService } from '../services/chatService';
import { leaderboardService } from '../services/supabase';
import { Swords, RotateCcw, Trophy, LogOut } from 'lucide-react';
import { ProAvatar } from './ProAvatar';

interface TeamBattleProps {
   channelConnected: boolean;
   onHome: () => void;
}

const SidebarPortal = ({ children }: { children?: React.ReactNode }) => {
   const [mounted, setMounted] = useState(false);
   useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
   const el = document.getElementById('game-sidebar-portal');
   if (!mounted || !el) return null;
   return createPortal(children, el);
};

export const TeamBattle: React.FC<TeamBattleProps> = ({ channelConnected, onHome }) => {
   const [isActive, setIsActive] = useState(false);
   const [score, setScore] = useState(50); // 100 = Red Wins, 0 = Green Wins, 50 = Tie
   const [winner, setWinner] = useState<'RED' | 'GREEN' | null>(null);
   const [contributors, setContributors] = useState<Record<string, { redPoints: number, greenPoints: number, avatar?: string }>>({});

   const scoreRef = useRef(score);
   const isActiveRef = useRef(isActive);
   useEffect(() => { scoreRef.current = score; }, [score]);
   useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

   useEffect(() => {
      if (!channelConnected) return;
      const cleanup = chatService.onMessage(async (msg) => {
         if (!isActiveRef.current) return;
         const content = msg.content.trim();
         const normalizedContent = content.toLowerCase().replace(/[أإآ]/g, 'ا');
         const user = msg.user.username;

         // Green Team (Right)
         if (normalizedContent === '!يمين' || normalizedContent === '!right' || normalizedContent === 'يمين' || normalizedContent === 'اخضر' || normalizedContent === '!اخضر') {
            setScore(prev => Math.max(0, prev - 2)); // Green pushes left
            setContributors(prev => {
               const c = prev[user] || { redPoints: 0, greenPoints: 0 };
               return { ...prev, [user]: { ...c, greenPoints: c.greenPoints + 1, avatar: msg.user.avatar } };
            });

            // Fetch real Kick avatar asynchronously
            chatService.fetchKickAvatar(user).then(avatar => {
               if (avatar) {
                  setContributors(current => ({
                     ...current,
                     [user]: { ...current[user], avatar }
                  }));
               }
            });
         }
         // Red Team (Left)
         else if (normalizedContent === '!يسار' || normalizedContent === '!left' || normalizedContent === 'يسار' || normalizedContent === 'احمر' || normalizedContent === '!احمر') {
            setScore(prev => Math.min(100, prev + 2)); // Red pushes right
            setContributors(prev => {
               const c = prev[user] || { redPoints: 0, greenPoints: 0 };
               return { ...prev, [user]: { ...c, redPoints: c.redPoints + 1, avatar: msg.user.avatar } };
            });

            // Fetch real Kick avatar asynchronously
            chatService.fetchKickAvatar(user).then(avatar => {
               if (avatar) {
                  setContributors(current => ({
                     ...current,
                     [user]: { ...current[user], avatar }
                  }));
               }
            });
         }

         // Check Win Condition
         if (scoreRef.current >= 100 && !winner) {
            setWinner('RED');
            setIsActive(false);
            Object.entries(contributors).forEach(async ([u, data]) => {
               if ((data as any).redPoints > 0) {
                  await leaderboardService.recordWin(u, (data as any).avatar || '', 25);
               }
            });
         } else if (scoreRef.current <= 0 && !winner) {
            setWinner('GREEN');
            setIsActive(false);
            Object.entries(contributors).forEach(async ([u, data]) => {
               if ((data as any).greenPoints > 0) {
                  await leaderboardService.recordWin(u, (data as any).avatar || '', 25);
               }
            });
         }
      });
      return cleanup;
   }, [channelConnected, contributors, winner]);

   const resetGame = () => {
      setScore(50);
      setWinner(null);
      setContributors({});
      setIsActive(true);
   };

   return (
      <>
         <SidebarPortal>
            <div className="bg-[#141619] p-4 rounded-xl border border-white/5 space-y-3 animate-in slide-in-from-right-4">
               <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                     <Swords size={12} /> تحكم المعركة
                  </h4>
                  <button onClick={onHome} className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl transition-all border border-red-500/20">
                     <LogOut size={14} />
                  </button>
               </div>
               <button
                  onClick={resetGame}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-white/5"
               >
                  <RotateCcw size={16} /> {isActive ? 'إعادة' : 'بدء معركة جديدة'}
               </button>
            </div>
         </SidebarPortal>

          <div className="w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="ltr">
            <div className="absolute inset-0 flex pointer-events-none opacity-20">
               <div className="w-1/2 h-full bg-red-900/40"></div>
               <div className="w-1/2 h-full bg-green-900/40"></div>
            </div>

            {!isActive && !winner ? (
               <div className="text-center z-10">
                   <Swords size={48} className="mx-auto mb-2 text-gray-500" />
                   <h2 className="text-3xl font-black text-white mb-1">حرب الفرق</h2>
                   <button onClick={resetGame} className="mt-3 px-5 py-3 bg-kick-green text-black font-black rounded-xl hover:scale-105 transition-transform">
                     ابدأ الحرب
                  </button>
               </div>
            ) : (
                <div className="w-full max-w-2xl z-10 flex flex-col items-center gap-5">
                   <div className="flex justify-between w-full text-lg font-black uppercase tracking-widest px-4">
                     <div className={`text-red-500 flex flex-col items-start gap-1 ${score > 50 ? 'scale-110' : 'opacity-50'} transition-all`}>
                        <span className="flex items-center gap-2">الفريق الأحمر {score > 50 && '🔥'}</span>
                        <span className="text-xs bg-red-600/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 italic drop-shadow-md">اكتب: احمر</span>
                     </div>
                     <div className={`text-green-500 flex flex-col items-end gap-1 ${score < 50 ? 'scale-110' : 'opacity-50'} transition-all`}>
                        <span className="flex items-center gap-2">{score < 50 && '🔥'} الفريق الأخضر</span>
                        <span className="text-xs bg-green-600/20 text-green-400 px-3 py-1.5 rounded-lg border border-green-500/30 italic drop-shadow-md">اكتب: اخضر</span>
                     </div>
                  </div>
                   <div className="w-full h-12 bg-[#1a1d21] rounded-full border-2 border-white/10 relative overflow-hidden shadow-2xl">
                     <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/20 z-20"></div>
                     <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-600 via-transparent to-green-600 transition-all duration-300 ease-out" style={{ width: '100%' }}>
                        <div className="absolute top-0 bottom-0 w-4 bg-white shadow-[0_0_20px_white] z-30 transition-all duration-300 ease-linear" style={{ left: `${score}%` }}>
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white font-bold">{score >= 50 ? score : 100 - score}%</div>
                        </div>
                        <div className="absolute inset-0 bg-red-600/50" style={{ width: `${score}%` }}></div>
                        <div className="absolute inset-0 bg-green-600/50 right-0 left-auto" style={{ width: `${100 - score}%` }}></div>
                     </div>
                  </div>
                  {winner && (
                      <div className="text-center animate-in zoom-in duration-500 mt-5 w-full">
                         <Trophy size={60} className={`mx-auto mb-4 ${winner === 'RED' ? 'text-red-500 drop-shadow-[0_0_20px_red]' : 'text-green-500 drop-shadow-[0_0_20px_green]'}`} />
                         <h1 className="text-5xl font-black text-white mb-8 italic drop-shadow-xl">{winner === 'RED' ? 'الفريق الأحمر انتصر!' : 'الفريق الأخضر انتصر!'}</h1>

                         <div className="flex justify-around items-end w-full gap-8 px-4 mt-6">
                            {/* Red Leader */}
                            {(() => {
                               const redLeader = Object.entries(contributors).filter(([_, d]) => d.redPoints > 0).sort((a, b) => b[1].redPoints - a[1].redPoints)[0];
                               return redLeader ? (
                                  <div className="flex flex-col items-center gap-3 bg-red-900/20 p-6 rounded-[2rem] border-2 border-red-500/30 flex-1 relative overflow-hidden group shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                                     <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent"></div>
                                     <div className="text-red-500 font-black text-xs tracking-widest uppercase mb-2">قائد الأحمر</div>
                                     <ProAvatar url={redLeader[1].avatar} username={redLeader[0]} size="w-24 h-24" className="border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] z-10" />
                                     <span className="text-white text-xl font-black z-10 mt-2">{redLeader[0]}</span>
                                     <span className="bg-red-500 text-white px-5 py-2 rounded-full text-sm font-bold z-10">{redLeader[1].redPoints} ضربة</span>
                                  </div>
                               ) : (
                                  <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-500/20 rounded-[2rem] bg-red-900/10">
                                     <span className="text-red-500/50 font-black text-sm">لا يوجد مقاتلين</span>
                                  </div>
                               );
                            })()}

                            {/* Green Leader */}
                            {(() => {
                               const greenLeader = Object.entries(contributors).filter(([_, d]) => d.greenPoints > 0).sort((a, b) => b[1].greenPoints - a[1].greenPoints)[0];
                               return greenLeader ? (
                                  <div className="flex flex-col items-center gap-3 bg-green-900/20 p-6 rounded-[2rem] border-2 border-green-500/30 flex-1 relative overflow-hidden group shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                                     <div className="absolute inset-0 bg-gradient-to-t from-green-600/20 to-transparent"></div>
                                     <div className="text-green-500 font-black text-xs tracking-widest uppercase mb-2">قائد الأخضر</div>
                                     <ProAvatar url={greenLeader[1].avatar} username={greenLeader[0]} size="w-24 h-24" className="border-4 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)] z-10" />
                                     <span className="text-white text-xl font-black z-10 mt-2">{greenLeader[0]}</span>
                                     <span className="bg-green-500 text-white px-5 py-2 rounded-full text-sm font-bold z-10">{greenLeader[1].greenPoints} ضربة</span>
                                  </div>
                               ) : (
                                  <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-green-500/20 rounded-[2rem] bg-green-900/10">
                                     <span className="text-green-500/50 font-black text-sm">لا يوجد مقاتلين</span>
                                  </div>
                               );
                            })()}
                         </div>
                      </div>
                  )}
               </div>
            )}
         </div>
      </>
   );
};
