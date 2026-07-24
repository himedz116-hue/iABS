import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { leaderboardService } from '../services/supabase';
import { ChatUser } from '../types';
import { Lock, Play, Trophy, ShieldAlert, Terminal, Zap, Fingerprint, Cpu, Eye, EyeOff, Settings, X } from 'lucide-react';
import { ProAvatar } from './ProAvatar';
import { motion, AnimatePresence } from 'framer-motion';

interface SafeCodeProps {
  onHome: () => void;
  isOBS?: boolean;
}

interface PlayerGuess {
  id: string;
  user: ChatUser;
  guess: string;
  matches: boolean[];
  isWinner: boolean;
  timestamp: number;
}

export const SafeCode: React.FC<SafeCodeProps> = ({ onHome, isOBS }) => {
  const [phase, setPhase] = useState<'SETUP' | 'PLAYING' | 'WINNER'>('SETUP');
  const [targetCode, setTargetCode] = useState<string>('');
  const [guesses, setGuesses] = useState<PlayerGuess[]>([]);
  const [winner, setWinner] = useState<PlayerGuess | null>(null);
  const [foundDigits, setFoundDigits] = useState<(string | null)[]>([null, null, null, null]);
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHints, setShowHints] = useState(true);
  
  const phaseRef = useRef(phase);
  const targetCodeRef = useRef(targetCode);
  const guessesRef = useRef(guesses);
  const foundDigitsRef = useRef(foundDigits);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { targetCodeRef.current = targetCode; }, [targetCode]);
  useEffect(() => { guessesRef.current = guesses; }, [guesses]);
  useEffect(() => { foundDigitsRef.current = foundDigits; }, [foundDigits]);

  const generateCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0');
  };

  const startGame = () => {
    setTargetCode(generateCode());
    setGuesses([]);
    setWinner(null);
    setFoundDigits([null, null, null, null]);
    setIsCodeVisible(false);
    setPhase('PLAYING');
  };

  useEffect(() => {
    const unsubscribe = chatService.onMessage((msg) => {
      if (phaseRef.current !== 'PLAYING') return;

      const content = msg.content.trim();
      
      const match = content.match(/\d{4}/);
      
      if (match) {
        const guess = match[0];
        const target = targetCodeRef.current;
        let isWinner = true;
        const matches: boolean[] = [false, false, false, false];
        const newFound = [...foundDigitsRef.current];
        let newlyDiscovered = false;

        for (let i = 0; i < 4; i++) {
          if (guess[i] === target[i]) {
            matches[i] = true;
            if (newFound[i] === null) {
              newFound[i] = guess[i];
              newlyDiscovered = true;
            }
          } else {
            isWinner = false;
          }
        }

        if (newlyDiscovered) {
          setFoundDigits(newFound);
        }

        const newGuess: PlayerGuess = {
          id: msg.id + Date.now() + Math.random(),
          user: msg.user,
          guess,
          matches,
          isWinner,
          timestamp: Date.now()
        };

        setGuesses(prev => {
          // Append to end for auto-scroll effect
          const updated = [...prev, newGuess];
          if (updated.length > 40) return updated.slice(updated.length - 40);
          return updated;
        });

        if (isWinner) {
          setPhase('WINNER');
          setWinner(newGuess);
          leaderboardService.recordWin(msg.user.username, msg.user.avatar || '', 100);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-scroll to bottom of log when new guesses come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [guesses]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center font-sans overflow-hidden relative z-10 text-white">
      {/* Dynamic Red Background FX */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.15)_0%,transparent_70%)]" />
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/10 blur-[120px] rounded-full"
        />
      </div>



      {phase === 'SETUP' && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 50 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          transition={{ type: "spring", bounce: 0.5 }}
          className="bg-black/60 p-16 rounded-[3rem] border border-red-500/40 flex flex-col items-center gap-8 backdrop-blur-xl z-10 shadow-[0_0_80px_rgba(220,38,38,0.2)] relative overflow-hidden"
        >
          {!isOBS && (
            <div className="absolute top-4 left-4 flex gap-3">
              <button onClick={onHome} className="bg-black/60 p-2.5 rounded-full hover:bg-red-900/50 transition-colors border border-red-500/30 backdrop-blur-md group" title="الرئيسية">
                <Lock className="w-5 h-5 text-red-500 group-hover:text-red-400" />
              </button>
              <button onClick={() => setShowSettings(true)} className="bg-black/60 p-2.5 rounded-full hover:bg-red-900/50 transition-colors border border-red-500/30 backdrop-blur-md group" title="الإعدادات">
                <Settings className="w-5 h-5 text-red-500 group-hover:text-red-400" />
              </button>
            </div>
          )}
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full" />
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <ShieldAlert className="w-32 h-32 text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
            <div className="absolute inset-0 border-2 border-dashed border-red-500/30 rounded-full scale-125" />
          </motion.div>

          <div className="text-center space-y-2">
            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-red-100 to-red-500 tracking-wider">
              البنك الآمن
            </h1>
            <p className="text-red-400/80 text-2xl max-w-lg mx-auto font-medium">
              الخزنة المركزية مقفلة برمز سري من 4 أرقام. أسرع هكر يخترق الرمز سيفوز!
            </p>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(220,38,38,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame} 
            className="mt-6 bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-bold py-5 px-16 rounded-full text-3xl flex items-center gap-4 transition-all border border-red-400/50"
          >
            <Zap className="w-8 h-8 fill-white" />
            بدء الهجوم
          </motion.button>
        </motion.div>
      )}

      {phase === 'PLAYING' && (
        <div className="w-full h-full flex flex-col p-8 z-10 min-h-0 relative">
          {/* Header - Left Aligned */}
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-start mb-6 shrink-0"
          >
            <div className="bg-black/50 border border-red-500/40 px-10 py-5 rounded-3xl flex items-center gap-6 backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.2)]">
              <Terminal className="w-10 h-10 text-red-500 animate-pulse" />
              <h2 className="text-4xl font-black text-white tracking-[0.2em] uppercase">SYSTEM BREACH IN PROGRESS</h2>
            </div>
          </motion.div>

          <div className="flex-1 flex gap-8 max-w-[90rem] w-full mx-auto min-h-0 flex-row-reverse">
             {/* Safe Display - Right Side */}
             <div className="flex-[1.2] flex flex-col items-center justify-center relative min-h-0">
              
              {/* Massive Lock Visualization */}
              <div className="relative group mb-16 shrink-0">
                <motion.div 
                  animate={{ scale: [1, 1.02, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-red-600/30 blur-[100px] rounded-full" 
                />
                 <div className="bg-black/60 border border-red-500/50 rounded-full w-[20rem] h-[20rem] flex items-center justify-center shadow-[0_0_80px_rgba(220,38,38,0.4)] relative z-10 backdrop-blur-xl">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border-[3px] border-dashed border-red-500/30 rounded-full" />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute inset-10 border-2 border-dotted border-red-400/20 rounded-full" />
                  
                  <Lock className="w-24 h-24 text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                  <div className="absolute bottom-20 text-red-500/50 font-mono text-xl tracking-widest">LOCKED</div>
                </div>
              </div>

              {/* Code Slots */}
              <div className="flex gap-6 text-6xl font-black text-white font-mono bg-black/50 p-8 rounded-[2rem] border border-red-500/30 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-md shrink-0" dir="ltr">
                {[0, 1, 2, 3].map((i) => {
                  const digit = showHints ? foundDigits[i] : null;
                  return (
                    <div key={i} className={`w-24 h-32 rounded-2xl flex items-center justify-center border-2 shadow-inner relative overflow-hidden transition-all duration-500
                      ${digit !== null 
                        ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.5)]' 
                        : 'bg-black/80 border-red-900/50 text-red-500/30'}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-b ${digit !== null ? 'from-green-500/10' : 'from-red-500/5'} to-transparent pointer-events-none`} />
                      {digit !== null ? (
                        <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
                          {digit}
                        </motion.span>
                      ) : (
                        '?'
                      )}
                    </div>
                  );
                })}
              </div>

              <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-8 text-red-400 text-xl flex items-center justify-center gap-3 bg-red-950/40 px-8 py-3 rounded-full border border-red-900/50 shrink-0 w-[90%]"
              >
                <Cpu className="w-6 h-6 shrink-0" />
                <span>اكتب 4 أرقام في الشات لاختراق الخزنة...</span>
              </motion.div>
            </div>

             {/* Protocol Log - Left Side */}
             <div className="flex-1 bg-black/60 border border-red-500/30 rounded-[2rem] p-6 flex flex-col relative backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden max-h-[55%] shrink-0 mt-12">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-70" />
              
              <div className="flex items-center justify-between mb-6 border-b border-red-500/20 pb-4 shrink-0">
                <h3 className="text-red-500 font-mono text-2xl tracking-widest font-bold flex items-center gap-3">
                  <Fingerprint className="w-8 h-8" />
                  LIVE PROTOCOL LOG
                </h3>
                <div className="flex items-center gap-4">
                  {!isOBS && (
                    <>
                      <button onClick={onHome} className="bg-black/60 p-2.5 rounded-full hover:bg-red-900/50 transition-colors border border-red-500/30 backdrop-blur-md group" title="الرئيسية">
                        <Lock className="w-5 h-5 text-red-500 group-hover:text-red-400" />
                      </button>
                      <button onClick={() => setShowSettings(true)} className="bg-black/60 p-2.5 rounded-full hover:bg-red-900/50 transition-colors border border-red-500/30 backdrop-blur-md group" title="الإعدادات">
                        <Settings className="w-5 h-5 text-red-500 group-hover:text-red-400" />
                      </button>
                      <div className="flex items-center gap-3 bg-black/60 px-5 py-2.5 rounded-full border border-red-500/30 backdrop-blur-md shadow-lg">
                        <span className={`font-mono text-xl tracking-[0.3em] font-black transition-all duration-300 ${isCodeVisible ? 'text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'text-gray-400 blur-md select-none'}`}>
                          {targetCode}
                        </span>
                        <button 
                          onMouseEnter={() => setIsCodeVisible(true)}
                          onMouseLeave={() => setIsCodeVisible(false)}
                          className="text-red-500 hover:text-red-400 p-1 border-l border-red-500/30 pl-3"
                        >
                          {isCodeVisible ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                        </button>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2 text-red-400/60 font-mono text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    INTERCEPTING CHAT
                  </div>
                </div>
              </div>
              
              <div ref={scrollRef} className="flex-1 overflow-y-auto pr-4 flex flex-col gap-4 custom-scrollbar min-h-0">
                <AnimatePresence initial={false}>
                  {guesses.map((g) => (
                    <motion.div 
                      key={g.id}
                      initial={{ opacity: 0, x: 100, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                      className="bg-black/80 p-5 rounded-2xl border border-red-900/40 flex items-center justify-between group hover:border-red-500/50 transition-colors relative overflow-hidden shrink-0"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <ProAvatar url={g.user.avatar} username={g.user.username} size="w-12 h-12" className="border-2 border-red-900/50" />
                        <span className="text-gray-200 font-bold text-xl truncate max-w-[200px]">{g.user.username}</span>
                      </div>
                      <div className="flex gap-2 relative z-10" dir="ltr">
                        {g.guess.split('').map((char, i) => {
                          const isCorrect = g.matches[i];
                          return (
                            <motion.div 
                              initial={{ rotateX: 90 }}
                              animate={{ rotateX: 0 }}
                              transition={{ delay: i * 0.1, type: "spring" }}
                              key={i} 
                              className={`w-12 h-14 flex items-center justify-center text-2xl font-black font-mono rounded-xl border-2 
                                ${isCorrect 
                                  ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
                                  : 'bg-red-950/40 border-red-900/40 text-red-500/40'}`}
                            >
                              {char}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                  
                  {guesses.length === 0 && (
                    <div className="h-full flex items-center justify-center text-red-500/30 font-mono text-xl opacity-50 animate-pulse">
                      WAITING FOR INPUT...
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'WINNER' && winner && (
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl"
        >
          {/* Confetti / Particle effect behind winner */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: "100vh", x: "50vw", scale: 0 }}
                  animate={{ 
                    y: "-10vh", 
                    x: `${Math.random() * 100}vw`,
                    scale: [0, Math.random() * 2 + 1, 0],
                    rotate: Math.random() * 360
                  }}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute w-4 h-4 bg-red-500 rounded-full shadow-[0_0_10px_#dc2626]"
                />
             ))}
          </div>

          <div className="bg-black/90 p-16 rounded-[3rem] border-4 border-red-500/50 flex flex-col items-center gap-8 shadow-[0_0_150px_rgba(220,38,38,0.4)] relative overflow-hidden z-10 pointer-events-auto">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.2)_0%,transparent_70%)] pointer-events-none" />
            
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <Trophy className="w-40 h-40 text-red-500 drop-shadow-[0_0_40px_rgba(220,38,38,0.8)]" />
            </motion.div>

            <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-red-500 mb-4">
              تم الاختراق بنجاح!
            </h2>
            
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-8 my-4"
            >
              <ProAvatar url={winner.user.avatar} username={winner.user.username} size="w-32 h-32" className="border-4 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.6)]" />
              <div className="text-right">
                <p className="text-5xl text-white font-black mb-2 drop-shadow-[0_2px_10px_rgba(220,38,38,0.5)]">{winner.user.username}</p>
                <p className="text-2xl text-red-400 font-medium">هو أول من اخترق البنك وفتح الخزنة!</p>
              </div>
            </motion.div>

            <div className="flex gap-6 mt-6" dir="ltr">
              {winner.guess.split('').map((char, i) => (
                <motion.div 
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1), type: "spring" }}
                  className="w-28 h-32 bg-red-950/40 border-4 border-red-500 rounded-2xl flex items-center justify-center text-7xl font-black font-mono text-red-500 shadow-[0_0_40px_rgba(220,38,38,0.6)]"
                >
                  {char}
                </motion.div>
              ))}
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame} 
              className="mt-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black py-5 px-16 rounded-full text-2xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.6)] cursor-pointer relative z-50"
            >
              تأمين الخزنة ولعب جولة جديدة
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && !isOBS && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-black/90 border-2 border-red-500/50 p-8 rounded-3xl min-w-[500px] shadow-[0_0_50px_rgba(220,38,38,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
              
              <div className="flex justify-between items-center mb-8 border-b border-red-500/20 pb-4">
                <h3 className="text-2xl font-bold text-red-500 flex items-center gap-3">
                  <Settings className="w-7 h-7" /> 
                  إعدادات اللعبة
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-red-500 hover:text-white bg-red-950/50 p-2 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-red-950/20 p-5 rounded-2xl border border-red-900/40">
                  <div>
                    <span className="text-white text-xl font-bold block mb-1">إظهار التلميحات</span>
                    <span className="text-red-400/60 text-sm">عرض الأرقام التي تم تخمينها بشكل صحيح في الشاشة</span>
                  </div>
                  <button 
                    onClick={() => setShowHints(!showHints)}
                    className={`w-16 h-8 rounded-full transition-colors relative flex-shrink-0 border ${showHints ? 'bg-green-500/20 border-green-500' : 'bg-red-950 border-red-900'}`}
                  >
                    <div className={`w-6 h-6 rounded-full absolute top-0.5 transition-all shadow-md ${showHints ? 'left-9 bg-green-400' : 'left-1 bg-red-500/50'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
