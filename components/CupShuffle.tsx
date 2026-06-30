import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { chatService } from '../services/chatService';
import { leaderboardService } from '../services/supabase';
import { Coffee, Play, RotateCcw, Trophy, CheckCircle2, Lock, LogOut, Home, Settings, Users, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProAvatar } from './ProAvatar';


interface CupShuffleProps {
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

export const CupShuffle: React.FC<CupShuffleProps> = ({ channelConnected, onHome }) => {
  const [gameState, setGameState] = useState<'IDLE' | 'SHUFFLING' | 'VOTING' | 'REVEAL' | 'FINISHED'>('IDLE');
  const [cupCount, setCupCount] = useState(3);
  const [ballPosition, setBallPosition] = useState(0); // 0-indexed
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [roundVotes, setRoundVotes] = useState<Record<string, { vote: number, avatar?: string }>>({});
  const [voteCounts, setVoteCounts] = useState<number[]>([]);
  const [shuffleAnim, setShuffleAnim] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const votedUsersMutRef = useRef(new Set<string>());

  const gameStateRef = useRef(gameState);
  const roundVotesRef = useRef(roundVotes);
  const cupCountRef = useRef(cupCount);
  const totalRoundsRef = useRef(totalRounds);
  const currentRoundRef = useRef(currentRound);
  const channelConnectedRef = useRef(channelConnected);
  const registerVoteRef = useRef<(voteIndex: number, user: string, avatar?: string) => void>(() => {});

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { roundVotesRef.current = roundVotes; }, [roundVotes]);
  useEffect(() => { cupCountRef.current = cupCount; }, [cupCount]);
  useEffect(() => { totalRoundsRef.current = totalRounds; }, [totalRounds]);
  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);
  useEffect(() => { channelConnectedRef.current = channelConnected; }, [channelConnected]);

  // Single persistent chat listener — registered ONCE on mount, never re-created
  useEffect(() => {
    const cleanup = chatService.onMessage((msg) => {
      try {
        if (!channelConnectedRef.current) return;
        if (gameStateRef.current !== 'VOTING') return;
        const user = msg.user.username;
        if (!user || votedUsersMutRef.current.has(user)) return;

        const text = msg.content
          .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '')
          .replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
          .trim()
          .toLowerCase();

        let voteIndex = -1;
        if (['1', '!1', 'أ', 'a'].includes(text)) voteIndex = 0;
        else if (['2', '!2', 'ب', 'b'].includes(text)) voteIndex = 1;
        else if (['3', '!3', 'ج', 'c'].includes(text)) voteIndex = 2;
        else if (['4', '!4', 'د', 'd'].includes(text)) voteIndex = 3;
        else {
          const dm = text.match(/(\d+)/);
          if (dm) {
            const n = parseInt(dm[1]);
            if (n >= 1 && n <= cupCountRef.current) voteIndex = n - 1;
          }
        }

        if (voteIndex >= 0 && voteIndex < cupCountRef.current) {
          console.log(`[CupShuffle] ✅ Vote ${user} → cup ${voteIndex + 1}`);
          votedUsersMutRef.current.add(user);
          registerVoteRef.current(voteIndex, user, msg.user.avatar);
        } else {
          console.log(`[CupShuffle] ❌ No match "${msg.content}" → "${text}"`);
        }
      } catch (e) {
        console.error('[CupShuffle] chat error', e);
      }
    });
    return cleanup;
  }, []);

  const registerVote = (voteIndex: number, user: string = 'host', avatar?: string) => {
    setRoundVotes(prev => ({ ...prev, [user]: { vote: voteIndex, avatar: avatar || '' } }));
    setVoteCounts(prev => {
      const nc = [...prev];
      while (nc.length < cupCountRef.current) nc.push(0);
      nc[voteIndex] = (nc[voteIndex] || 0) + 1;
      return nc;
    });
  };

  // Expose registerVote via ref so the chat listener can call it
  useEffect(() => { registerVoteRef.current = registerVote; });

  // Init vote counts on cup change
  useEffect(() => {
    setVoteCounts(new Array(cupCount).fill(0));
    if (ballPosition >= cupCount) setBallPosition(Math.floor(Math.random() * cupCount));
  }, [cupCount]);

  // VOTING TIMER
  useEffect(() => {
    let timer: number;
    if (gameState === 'VOTING' && timeLeft > 0) {
      timer = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const triggerConfetti = () => {
    let duration = 3000;
    let animationEnd = Date.now() + duration;
    let defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    let randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    let interval: any = setInterval(function () {
      let timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      let particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  };

  const startRoundSequence = async () => {
    // RESET VOTES FOR NEW ROUND
    setRoundVotes({});
    votedUsersMutRef.current.clear(); // Clear the sync set
    setVoteCounts(new Array(cupCount).fill(0));

    setGameState('SHUFFLING');
    setShuffleAnim(true);

    let currentBall = ballPosition;
    const shuffles = 15 + Math.floor(Math.random() * 10);

    for (let i = 0; i < shuffles; i++) {
      await new Promise(r => setTimeout(r, 150));
      const move = Math.random() > 0.5 ? 1 : -1;
      let next = currentBall + move;
      if (next < 0) next = cupCount - 1;
      if (next >= cupCount) next = 0;
      if (Math.random() > 0.8) next = Math.floor(Math.random() * cupCount);

      currentBall = next;
      setBallPosition(currentBall);
    }

    setShuffleAnim(false);

    // Start Voting Phase
    setGameState('VOTING');
    setTimeLeft(15);

    setTimeout(async () => {
      revealRound(currentBall);
    }, 15000); // 15 seconds voting time
  };

  const revealRound = async (finalBallPos: number) => {
    setGameState('REVEAL');
    triggerConfetti();

    const ns = { ...scores };
    let winnersCount = 0;

    for (const [u, rawData] of Object.entries(roundVotesRef.current)) {
      const data = rawData as { vote: number, avatar?: string };
      if (data.vote === finalBallPos) {
        ns[u] = (ns[u] || 0) + 1;
        winnersCount++;
        leaderboardService.recordWin(u, data.avatar || '', 50);
      }
    }
    setScores(ns);

    const isFinal = currentRoundRef.current >= totalRoundsRef.current;

    setTimeout(() => {
      if (isFinal) {
        setGameState('FINISHED');
      } else {
        setCurrentRound(p => p + 1);
        setRoundVotes({});
        setVoteCounts(new Array(cupCount).fill(0));
        setGameState('IDLE');
        setTimeout(() => startRoundSequence(), 2000);
      }
    }, 5000);
  };

  const sortedScores = Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number));

  return (
    <>
      <SidebarPortal>
        <div className="bg-black/40 p-3 rounded-[1.5rem] border border-white/5 space-y-4 animate-in slide-in-from-right duration-500 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-[12px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
              <Coffee size={16} /> إعدادات الأكواب
            </h4>
            <button onClick={onHome} className="p-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl transition-all border border-red-500/20"><LogOut size={16} /></button>
          </div>

          {/* Game Controls */}
          <div className="space-y-3">
            {gameState === 'IDLE' || gameState === 'FINISHED' ? (
              <>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3 block flex items-center gap-2">
                    <Hash size={12} /> عدد الأكواب: <span className="text-white text-lg">{cupCount}</span>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={cupCount}
                    onChange={(e) => {
                      setCupCount(parseInt(e.target.value));
                      setVoteCounts(new Array(parseInt(e.target.value)).fill(0));
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-[8px] text-gray-500 mt-2 font-mono">
                    <span>3</span><span>10</span>
                  </div>
                </div>

                <button onClick={() => {
                  setScores({});
                  setCurrentRound(1);
                  setRoundVotes({});
                  setVoteCounts(new Array(cupCount).fill(0));
                  startRoundSequence();
                }} className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-black py-3 rounded-xl text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 border-t border-white/20 uppercase tracking-widest">
                  <Play fill="currentColor" size={16} /> بدء اللعبة
                </button>
              </>
            ) : (
              <div className="text-center bg-red-600/20 p-3 rounded-xl border border-red-500/20 animate-pulse">
                <div className="text-red-400 text-xs font-black uppercase tracking-widest mb-1">اللعبة جارية</div>
                <div className="text-white font-mono text-base">{gameState}</div>
                {gameState === 'VOTING' && <div className="text-2xl font-black text-white mt-2 font-mono">{timeLeft}s</div>}
              </div>
            )}
          </div>

          {/* Leaderboard Mini */}
          {sortedScores.length > 0 && (
            <div className="bg-black/20 rounded-xl p-3 border border-white/5 max-h-[160px] overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mb-3 uppercase tracking-widest">
                <Trophy size={12} /> المتصدرين
              </div>
              {sortedScores.map(([name, score], i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0 group">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-600 w-4">{i + 1}.</span>
                    <ProAvatar username={name} size="w-7 h-7" className="overflow-visible" />
                    <span className="text-xs text-gray-300 font-bold group-hover:text-white transition-colors">{name}</span>
                  </div>
                  <span className="text-xs text-red-500 font-mono font-black italic">{score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SidebarPortal>

      <div className="w-full h-full flex flex-col items-center justify-center p-5 bg-transparent relative overflow-hidden select-none">

        {/* Background Ambient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1)_0%,transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        </div>

        {/* Header Info */}
        <div className="absolute top-6 left-0 w-full text-center z-20">
          <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-2xl animate-in slide-in-from-top-4">
            <span className="text-gray-400 text-sm font-black uppercase tracking-widest">Round</span>
            <span className="text-xl font-black text-white italic">{currentRound} <span className="text-gray-600 text-lg">/ {totalRounds}</span></span>
          </div>

          <div className="mt-4 h-10">
            {gameState === 'VOTING' && <div className="text-4xl font-black text-white uppercase tracking-widest animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">Vote: {timeLeft}s</div>}
            {gameState === 'SHUFFLING' && <div className="text-2xl font-black text-red-500 uppercase tracking-widest animate-pulse">Shuffling...</div>}
            {gameState === 'REVEAL' && <div className="text-3xl font-black text-yellow-400 uppercase tracking-widest drop-shadow-[0_0_25px_gold]">Revealed!</div>}
          </div>
        </div>

        {/* GAME AREA */}
        <div className="relative w-full max-w-4xl flex-1 flex flex-col justify-center">

          {/* Cups Grid - Dynamic Layout */}
          <div className={`
                 w-full mx-auto transition-all duration-500
                 ${cupCount <= 5
               ? 'flex flex-wrap justify-center items-end gap-8'
              : 'grid grid-cols-5 gap-x-5 gap-y-12 justify-items-center items-end max-w-3xl'
            }
             `}>
            {Array.from({ length: cupCount }).map((_, idx) => {
              // Determine visual state
              const isBallHere = ballPosition === idx;
              const isRevealed = gameState === 'REVEAL' || gameState === 'IDLE' || gameState === 'FINISHED';

              // Animation: If shuffling, maybe bounce randomly? 
              // Simple random jitter during shuffle
              const shuffleOffset = shuffleAnim ? `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)` : 'none';

              return (
                <div key={idx}
                  onClick={() => {
                    if (gameState === 'VOTING') registerVote(idx, 'host');
                  }}
                  className={`flex flex-col items-center group relative h-[200px] justify-end ${gameState === 'VOTING' ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
                  style={{ transform: shuffleOffset }}>

                  {/* Vote Counter Badge */}
                  <div className="mb-3 bg-black/60 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm shadow-xl transition-all group-hover:scale-110">
                    <Users size={12} className="text-gray-400" />
                    <span className={`font-mono font-black text-sm ${voteCounts[idx] > 0 ? 'text-white' : 'text-gray-500'}`}>{voteCounts[idx] || 0}</span>
                  </div>

                  {/* The Cup Container */}
                  <div className="relative w-14 h-20 md:w-20 md:h-24 perspective-[1000px] z-10 transition-all duration-500">

                    {/* The Cup Body */}
                    <div className={`
                                    w-full h-full relative transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                    ${isRevealed && isBallHere ? '-translate-y-16 rotate-[-15deg]' : 'translate-y-0'}
                                    ${shuffleAnim ? 'blur-[1px]' : ''}
                                `}>
                      <div className="absolute inset-0 bg-gradient-to-b from-red-600 to-red-900 rounded-t-xl rounded-b-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_2px_10px_rgba(255,255,255,0.3)] border-t border-white/20 flex items-center justify-center overflow-hidden">
                        {/* Stripe Deco */}
                        <div className="absolute top-1/2 w-full h-5 bg-black/20 transform -skew-y-12"></div>
                        <div className="absolute top-5 w-full h-1.5 bg-white/10"></div>

                        {/* Cup Number */}
                        <span className="text-3xl font-black text-white/90 italic drop-shadow-[0_2px_0px_rgba(0,0,0,0.5)] z-10">{idx + 1}</span>
                      </div>

                      {/* Cup Rim Highlight */}
                      <div className="absolute top-0 left-0 right-0 h-3 bg-white/10 rounded-full blur-[2px]"></div>
                    </div>

                    {/* THE BALL (Hidden Layer) */}
                    {isBallHere && (
                      <div className={`
                                        absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full -z-10
                                        ${isRevealed ? 'animate-bounce' : 'opacity-0'}
                                        transition-opacity duration-300
                                    `}>
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-yellow-400 to-white shadow-[0_0_20px_gold] animate-pulse"></div>
                      </div>
                    )}
                  </div>

                  {/* Platform Shadow */}
                  <div className="w-14 h-3 bg-black/60 rounded-[100%] blur-md mt-[-10px] z-0"></div>

                </div>
              );
            })}
          </div>

          {/* FINISHED RESULTS OVERLAY */}
          {gameState === 'FINISHED' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
              <div className="bg-gradient-to-b from-gray-900 to-black border border-red-500/20 rounded-3xl p-8 shadow-2xl max-w-lg w-full mx-4 text-center animate-in zoom-in-110 duration-500">
                <Trophy size={64} className="mx-auto text-yellow-400 mb-4 drop-shadow-[0_0_20px_gold]" />
                <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Game Over</h2>
                <p className="text-gray-400 text-sm mb-6 font-mono">{currentRound} Rounds Played</p>

                {sortedScores.length > 0 && (
                  <>
                    <div className="text-yellow-400 text-xl font-black mb-4 flex items-center justify-center gap-2">
                      <Trophy size={20} /> {sortedScores[0][0]}
                    </div>
                    <div className="space-y-2">
                      {sortedScores.map(([name, score], i) => (
                        <div key={i} className="flex justify-between items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-gray-500 w-6">{i + 1}.</span>
                            <ProAvatar username={name} size="w-8 h-8" />
                            <span className="text-sm text-gray-200 font-bold">{name}</span>
                          </div>
                          <span className="text-lg font-black text-red-500 font-mono">{score}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <button onClick={() => {
                  setScores({});
                  setCurrentRound(1);
                  setRoundVotes({});
                  setVoteCounts(new Array(cupCount).fill(0));
                  setGameState('IDLE');
                }} className="mt-6 w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-black py-3 rounded-xl text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 border-t border-white/20 uppercase tracking-widest">
                  <RotateCcw size={16} /> Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
