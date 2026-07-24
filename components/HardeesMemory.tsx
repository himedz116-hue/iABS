import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Trophy, RotateCcw, Star, Timer, Zap, Tag, Users } from 'lucide-react';
import { chatService } from '../services/chatService';
import { ProAvatar } from './ProAvatar';

interface HardeesMemoryProps {
  onHome: () => void;
  isOBS?: boolean;
}

const ACTUAL_IMAGES = [
  '/هارديز/IMG_2533.PNG', '/هارديز/IMG_2534.PNG', '/هارديز/IMG_2536.PNG', '/هارديز/IMG_2537.PNG',
  '/هارديز/IMG_2538.PNG', '/هارديز/IMG_2539.PNG', '/هارديز/IMG_2540.PNG', '/هارديز/IMG_2541.PNG',
  '/هارديز/IMG_2542.PNG', '/هارديز/IMG_2543.PNG', '/هارديز/IMG_2544.PNG', '/هارديز/IMG_2545.PNG',
  '/هارديز/IMG_2546.PNG', '/هارديز/IMG_2547.PNG', '/هارديز/IMG_2548.PNG', '/هارديز/IMG_2549.PNG',
  '/هارديز/IMG_2550.PNG', '/هارديز/IMG_2551.PNG', '/هارديز/IMG_2552.PNG', '/هارديز/IMG_2553.PNG',
  '/هارديز/IMG_2554.PNG', '/هارديز/IMG_2555.PNG', '/هارديز/IMG_2556.PNG', '/هارديز/IMG_2557.PNG',
  '/هارديز/IMG_2558.PNG', '/هارديز/IMG_2559.PNG', '/هارديز/IMG_2560.PNG', '/هارديز/IMG_2561.PNG',
  '/هارديز/IMG_2562.PNG', '/هارديز/IMG_2563.PNG', '/هارديز/IMG_2564.PNG', '/هارديز/IMG_2565.PNG',
  '/هارديز/IMG_2566.PNG', '/هارديز/IMG_2567.PNG', '/هارديز/IMG_2568.PNG', '/هارديز/IMG_2569.PNG',
  '/هارديز/IMG_2570.PNG', '/هارديز/IMG_2571.PNG', '/هارديز/IMG_2572.PNG',
];

const HARDEES_LOGO = '/Hardees-01.png';

interface Card {
  id: number;
  cardNumber: number;
  imageIndex: number;
  imageSrc: string;
  isFlipped: boolean;
  isMatched: boolean;
  matchedBy?: { name: string; avatar: string };
}

interface PlayerScore {
  user: any;
  score: number;
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'MAX';

const GRID_CONFIG: Record<Difficulty, { pairs: number; cols: number; label: string; name: string; icon: string }> = {
  EASY: { pairs: 6, cols: 4, label: '12 بطاقة', name: 'سهل', icon: '😊' },
  MEDIUM: { pairs: 12, cols: 6, label: '24 بطاقة', name: 'متوسط', icon: '🔥' },
  HARD: { pairs: 20, cols: 8, label: '40 بطاقة', name: 'صعب', icon: '💀' },
  EXPERT: { pairs: 30, cols: 10, label: '60 بطاقة', name: 'خبير', icon: '⚡' },
  MAX: { pairs: 39, cols: 13, label: '78 بطاقة', name: 'هارديز ماكس', icon: '👑' },
};

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const HardeesMemory: React.FC<HardeesMemoryProps> = ({ onHome, isOBS }) => {
  const [phase, setPhase] = useState<'SETUP' | 'PLAYING' | 'WON'>('SETUP');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [cards, setCards] = useState<Card[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [scores, setScores] = useState<Record<string, PlayerScore>>({});
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // State refs for chat handler
  const stateRef = useRef({ cards, totalPairs });
  useEffect(() => {
    stateRef.current = { cards, totalPairs };
  }, [cards, totalPairs]);

  useEffect(() => {
    if (phase === 'PLAYING') {
      timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Chat Integration
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    const handleChat = (msg: any) => {
      const { cards } = stateRef.current;

      // Extract all numbers from the message
      const numbers = msg.content.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        const num1 = parseInt(numbers[0]);
        const num2 = parseInt(numbers[1]);
        if (num1 === num2) return;

        const idx1 = cards.findIndex(c => c.cardNumber === num1);
        const idx2 = cards.findIndex(c => c.cardNumber === num2);

        if (idx1 === -1 || idx2 === -1) return;
        if (cards[idx1].isMatched || cards[idx2].isMatched || cards[idx1].isFlipped || cards[idx2].isFlipped) return;

        const finalUser = { ...msg.user };
        
        chatService.fetchKickAvatar(finalUser.username).then(realAvatar => {
          if (realAvatar && realAvatar !== finalUser.avatar) {
            finalUser.avatar = realAvatar;
            setScores(prev => prev[finalUser.id] ? { ...prev, [finalUser.id]: { ...prev[finalUser.id], user: finalUser } } : prev);
            setCards(prev => prev.map(c => c.matchedBy?.name === finalUser.username ? { ...c, matchedBy: { ...c.matchedBy, avatar: realAvatar } } : c));
          }
        });

        performFlip(idx1, idx2, finalUser);
      }
    };

    const unsubscribe = chatService.onMessage(handleChat);
    return () => {
      unsubscribe();
    };
  }, [phase]);

  const performFlip = (idx1: number, idx2: number, user: any) => {
    const { cards: currentCards, totalPairs: currentTotal } = stateRef.current;
    
    // Safety check again before flipping
    if (currentCards[idx1].isFlipped || currentCards[idx2].isFlipped || currentCards[idx1].isMatched || currentCards[idx2].isMatched) return;

    setMoves(m => m + 1);

    // Flip cards up
    setCards(prev => prev.map((c, i) => (i === idx1 || i === idx2) ? { ...c, isFlipped: true } : c));

    const card1 = currentCards[idx1];
    const card2 = currentCards[idx2];

    if (card1.imageIndex === card2.imageIndex) {
      // Match!
      setTimeout(() => {
        setCards(prev => prev.map((c, i) => (i === idx1 || i === idx2) ? { ...c, isMatched: true, isFlipped: false, matchedBy: { name: user?.username || 'مجهول', avatar: user?.avatar || undefined } } : c));
        
        if (user) {
          setScores(prev => {
            const newScores = { ...prev };
            if (!newScores[user.id]) newScores[user.id] = { user, score: 0 };
            newScores[user.id].score += 1;
            return newScores;
          });
        }

        setMatchedPairs(p => {
          const n = p + 1;
          if (n === currentTotal) {
            setPhase('WON');
            if (timerRef.current) clearInterval(timerRef.current);
          }
          return n;
        });
      }, 1500); // Stream delay to see the match
    } else {
      // No match
      setTimeout(() => {
        setCards(prev => prev.map((c, i) => (i === idx1 || i === idx2) ? { ...c, isFlipped: false } : c));
      }, 2000); // 2 seconds to memorize before flipping back
    }
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startGame = useCallback(() => {
    const config = GRID_CONFIG[difficulty];
    const selectedImages = shuffleArray(ACTUAL_IMAGES).slice(0, config.pairs);

    const cardPairs: Card[] = [];
    selectedImages.forEach((src, idx) => {
      cardPairs.push({ id: idx * 2, cardNumber: 0, imageIndex: idx, imageSrc: src, isFlipped: false, isMatched: false });
      cardPairs.push({ id: idx * 2 + 1, cardNumber: 0, imageIndex: idx, imageSrc: src, isFlipped: false, isMatched: false });
    });

    const shuffled = shuffleArray(cardPairs).map((c, i) => ({ ...c, cardNumber: i + 1 }));
    setCards(shuffled);
    setScores({});
    setMoves(0);
    setMatchedPairs(0);
    setTotalPairs(config.pairs);
    setElapsedTime(0);
    setPhase('PLAYING');
  }, [difficulty]);

  const sortedScores = Object.values(scores).sort((a, b) => b.score - a.score);

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden" dir="rtl">
      {/* Super Premium background */}
      <div className="absolute inset-0 bg-[#0a0300]" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 50% 0%, rgba(220, 60, 0, 0.25) 0%, transparent 50%), radial-gradient(circle at 10% 90%, rgba(255, 120, 0, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(180, 20, 0, 0.2) 0%, transparent 40%)'
      }} />
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: '110%', x: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 0.8, 0], y: '-10%' }}
            transition={{ duration: 5 + Math.random() * 15, repeat: Infinity, delay: Math.random() * 5, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{
              width: 3 + Math.random() * 5,
              height: 3 + Math.random() * 5,
              background: `radial-gradient(circle, rgba(255, ${150 + Math.random() * 100}, 0, 0.9), transparent)`,
              boxShadow: `0 0 ${5 + Math.random() * 10}px rgba(255, 140, 0, 0.6)`
            }}
          />
        ))}
      </div>

      {/* Home button */}
      {!isOBS && (
        <div className="absolute top-4 left-4 z-50">
          <button onClick={onHome} className="bg-black/50 p-3 rounded-full hover:bg-orange-900/40 transition-all border border-orange-500/20 backdrop-blur-md group">
            <Globe className="w-6 h-6 text-orange-400 group-hover:text-orange-300" />
          </button>
        </div>
      )}

      {/* Promo Code Banner */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="absolute top-4 right-4 z-40 flex justify-center"
      >
        <div className="bg-gradient-to-r from-orange-600/90 via-red-600/90 to-orange-600/90 px-6 py-2 rounded-2xl border border-orange-400/50 backdrop-blur-md shadow-[0_0_30px_rgba(234,88,12,0.4)] flex items-center gap-4">
          <img src={HARDEES_LOGO} alt="Hardees" className="w-10 h-10 object-contain drop-shadow-md" />
          <div className="flex flex-col">
            <span className="text-white font-black text-sm tracking-wide">
              خصم <span className="text-yellow-300 text-lg">25%</span> من هارديز!
            </span>
            <span className="text-orange-100 text-xs font-bold">
              استخدم كود: <span className="bg-yellow-400 text-black px-1.5 rounded text-sm mx-1">UP25</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* ============ SETUP PHASE ============ */}
      {phase === 'SETUP' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          className="bg-black/70 p-12 rounded-[3rem] border border-orange-500/40 flex flex-col items-center gap-8 backdrop-blur-2xl z-10 shadow-[0_0_120px_rgba(234,88,12,0.15)] relative overflow-hidden max-w-2xl w-full"
        >
          {/* Top glow line */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
          
          <div className="flex items-center gap-6">
            <motion.img
              src={HARDEES_LOGO}
              alt="Hardees Logo"
              className="w-32 h-32 object-contain relative z-10 drop-shadow-[0_0_40px_rgba(234,88,12,0.6)]"
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="space-y-1 text-right">
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-orange-300 to-orange-600 drop-shadow-lg">
                لعبة الذاكرة
              </h1>
              <p className="text-orange-300/80 text-xl font-bold">
                اكتب رقمين في الشات لقلب البطاقات! (مثال: 5 8)
              </p>
            </div>
          </div>

          {/* Difficulty */}
          <div className="flex flex-col gap-3 w-full">
            <span className="text-lg text-orange-200/90 font-black">المستوى وعدد البطاقات:</span>
            <div className="grid grid-cols-5 gap-3">
              {(Object.keys(GRID_CONFIG) as Difficulty[]).map(key => {
                const diff = GRID_CONFIG[key];
                return (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                      difficulty === key
                        ? 'bg-gradient-to-br from-orange-600 to-red-700 text-white border-2 border-orange-300 scale-105 shadow-[0_0_25px_rgba(234,88,12,0.6)]'
                        : 'bg-black/50 text-orange-400/80 border border-orange-900/40 hover:bg-orange-900/30'
                    }`}
                  >
                    <span className="text-2xl">{diff.icon}</span>
                    <span className="font-black text-sm whitespace-nowrap">{diff.name}</span>
                    <span className="text-[11px] opacity-70 font-bold bg-black/30 px-2 py-0.5 rounded-full mt-1">{diff.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(234,88,12,0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="w-full mt-2 bg-gradient-to-r from-orange-500 via-red-600 to-orange-500 hover:from-orange-400 hover:via-red-500 hover:to-orange-400 text-white font-black py-5 rounded-2xl text-2xl flex items-center justify-center gap-4 transition-all border border-orange-300/50 shadow-[0_0_40px_rgba(234,88,12,0.3)]"
          >
            <Zap className="w-8 h-8 fill-yellow-300 text-yellow-300" />
            بدء التحدي للشات!
          </motion.button>
        </motion.div>
      )}

      {/* ============ PLAYING PHASE ============ */}
      {phase === 'PLAYING' && (
        <div className="w-full h-full flex gap-6 p-6 pt-24 z-10">
          
          {/* Main Grid Area */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div
              className={`grid gap-2 w-full ${
                  GRID_CONFIG[difficulty].cols <= 4 ? 'max-w-4xl' :
                  GRID_CONFIG[difficulty].cols <= 6 ? 'max-w-5xl' :
                  GRID_CONFIG[difficulty].cols <= 8 ? 'max-w-6xl' : 'max-w-7xl'
                }`}
              style={{ 
                gridTemplateColumns: `repeat(${GRID_CONFIG[difficulty].cols}, minmax(0, 1fr))`,
              }}
            >
              {cards.map((card, index) => {
                const isRevealed = card.isFlipped || card.isMatched;
                return (
                  <motion.div
                    key={card.id}
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: card.isMatched ? 1.02 : 1, rotateY: 0 }}
                    transition={{ delay: index * 0.015, type: 'spring', stiffness: 200 }}
                    className={`relative select-none ${card.isMatched ? 'pointer-events-none' : ''}`}
                    style={{ perspective: '1000px', aspectRatio: '1' }}
                  >
                    <motion.div
                      animate={{ rotateY: isRevealed ? 180 : 0 }}
                      transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
                      className="w-full h-full relative"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Back of Card (face-down) */}
                      <div
                        className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                          card.isMatched ? 'opacity-0 scale-90' : 'bg-gradient-to-br from-[#2a0e00] to-[#120500] border-2 border-orange-600/40 shadow-[0_0_15px_rgba(234,88,12,0.15)] shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]'
                        }`}
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <span className="text-orange-400 font-black text-2xl md:text-3xl lg:text-4xl leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {card.cardNumber}
                        </span>
                      </div>

                      {/* Front of Card (face-up / meal image) */}
                      <div
                        className={`absolute inset-0 rounded-xl overflow-hidden transition-all duration-500 bg-white ${
                          card.isMatched
                            ? 'border-4 border-orange-500 shadow-[0_0_30px_rgba(234,88,12,0.6)]'
                            : 'border-2 border-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.4)]'
                        }`}
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <img src={card.imageSrc} alt="" className="w-full h-full object-cover" draggable={false} />
                        
                        {/* Number badge when revealed */}
                        <div className="absolute top-1 right-1 bg-black/80 text-orange-400 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border border-orange-500/50">
                          {card.cardNumber}
                        </div>

                        {card.isMatched && (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-[2px]">
                            {card.matchedBy && (
                              <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="flex flex-col items-center justify-center gap-2"
                              >
                                  <ProAvatar 
                                    url={card.matchedBy.avatar} 
                                    username={card.matchedBy.name}
                                    size="w-12 h-12 md:w-16 md:h-16" 
                                    className="shadow-[0_0_20px_rgba(234,88,12,0.8)]"
                                  />
                                <div className="bg-orange-950/90 px-3 py-1.5 rounded-lg border border-orange-500/50 flex items-center justify-center shadow-lg">
                                  <span className="text-white font-black text-xs md:text-sm max-w-[90px] truncate">{card.matchedBy.name}</span>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar: Leaderboard & Stats */}
          <div className="w-[340px] flex flex-col gap-4 mt-[230px] shrink-0">
            <div className="bg-black/60 rounded-3xl border border-orange-500/30 p-5 backdrop-blur-xl shadow-[0_0_40px_rgba(234,88,12,0.1)]">
              <div className="flex items-center gap-3 mb-4 border-b border-orange-900/50 pb-4">
                <Timer className="w-6 h-6 text-orange-400" />
                <span className="text-3xl font-black text-white tabular-nums">{formatTime(elapsedTime)}</span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-300 font-bold">الأزواج المكتشفة</span>
                <span className="text-xl font-black text-white">{matchedPairs} / {totalPairs}</span>
              </div>
              <div className="w-full h-3 bg-orange-950 rounded-full overflow-hidden mb-4 border border-orange-900/50">
                <motion.div 
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-400"
                  animate={{ width: `${(matchedPairs / totalPairs) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-orange-400/80 font-bold">
                <span>إجمالي المحاولات:</span>
                <span className="text-white text-lg">{moves}</span>
              </div>
            </div>

            <div className="flex-1 bg-black/60 rounded-3xl border border-orange-500/30 p-5 backdrop-blur-xl flex flex-col overflow-hidden shadow-[0_0_40px_rgba(234,88,12,0.1)]">
              <div className="flex items-center gap-2 mb-4 text-orange-300 font-black text-lg border-b border-orange-900/50 pb-3">
                <Users className="w-5 h-5" />
                أفضل اللاعبين
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                <AnimatePresence>
                  {sortedScores.map((score, i) => (
                    <motion.div
                      key={score.user.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        i === 0 ? 'bg-orange-900/40 border-orange-500/50 shadow-[0_0_15px_rgba(234,88,12,0.2)]' : 'bg-black/40 border-white/5'
                      }`}
                    >
                      <div className="font-black text-orange-400 w-4 text-center">{i + 1}</div>
                      <ProAvatar url={score.user.avatar} username={score.user.username} size="w-8 h-8" />
                      <div className="flex-1 truncate font-bold text-white text-sm">{score.user.username}</div>
                      <div className="font-black text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">
                        {score.score}
                      </div>
                    </motion.div>
                  ))}
                  {sortedScores.length === 0 && (
                    <div className="text-center text-orange-500/40 font-bold mt-10">
                      بانتظار أول إجابة في الشات...
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ WON PHASE ============ */}
      <AnimatePresence>
        {phase === 'WON' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.9)' }}
          >
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(80)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: '-10%', x: `${Math.random() * 100}%`, scale: 0 }}
                  animate={{ y: '110%', scale: [0, 1, 0.5], rotate: Math.random() * 720 }}
                  transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 2, ease: 'easeOut' }}
                  className="absolute rounded-sm"
                  style={{
                    width: 6 + Math.random() * 8,
                    height: 6 + Math.random() * 8,
                    background: ['#ea580c', '#facc15', '#ef4444', '#22c55e', '#3b82f6', '#f97316'][Math.floor(Math.random() * 6)],
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.5, y: 60 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }}
              className="bg-gradient-to-b from-orange-950/90 to-black/95 p-12 rounded-[3rem] border border-orange-500/50 flex flex-col items-center gap-6 backdrop-blur-3xl shadow-[0_0_150px_rgba(234,88,12,0.3)] max-w-2xl w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />

              <motion.img
                src={HARDEES_LOGO}
                alt="Hardees"
                className="w-24 h-24 object-contain drop-shadow-[0_0_30px_rgba(234,88,12,0.8)]"
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-orange-400 to-red-500">
                اكتمل التحدي! 🎉
              </h1>

              {/* Top 3 Winners */}
              {sortedScores.length > 0 && (
                <div className="w-full bg-black/40 rounded-3xl p-6 border border-orange-500/30 mt-4">
                  <h3 className="text-center text-orange-300 font-black text-xl mb-4">أبطال الذاكرة</h3>
                  <div className="flex justify-center items-end gap-4 h-32">
                    {/* 2nd Place */}
                    {sortedScores[1] && (
                      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col items-center">
                        <ProAvatar url={sortedScores[1].user.avatar} username={sortedScores[1].user.username} size="w-12 h-12" />
                        <div className="w-16 h-16 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-lg mt-2 flex items-center justify-center font-black text-white text-xl">2</div>
                        <span className="text-white font-bold text-sm mt-1 max-w-[80px] truncate">{sortedScores[1].user.username}</span>
                      </motion.div>
                    )}
                    {/* 1st Place */}
                    {sortedScores[0] && (
                      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center">
                        <Trophy className="w-8 h-8 text-yellow-400 mb-1" />
                        <ProAvatar url={sortedScores[0].user.avatar} username={sortedScores[0].user.username} size="w-16 h-16" />
                        <div className="w-20 h-24 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg mt-2 flex items-center justify-center font-black text-white text-3xl">1</div>
                        <span className="text-yellow-400 font-black text-base mt-1 max-w-[100px] truncate">{sortedScores[0].user.username}</span>
                      </motion.div>
                    )}
                    {/* 3rd Place */}
                    {sortedScores[2] && (
                      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-col items-center">
                        <ProAvatar url={sortedScores[2].user.avatar} username={sortedScores[2].user.username} size="w-12 h-12" />
                        <div className="w-16 h-12 bg-gradient-to-t from-orange-900 to-orange-700 rounded-t-lg mt-2 flex items-center justify-center font-black text-white text-xl">3</div>
                        <span className="text-white font-bold text-sm mt-1 max-w-[80px] truncate">{sortedScores[2].user.username}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              <div className="w-full bg-gradient-to-r from-orange-700/40 to-red-700/40 p-4 rounded-2xl border border-orange-500/30 text-center mt-2">
                <p className="text-white font-black text-lg">
                  لا تنسى! استخدم كود <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-md font-black mx-1">UP25</span> لخصم <span className="text-yellow-300 font-black">25%</span>
                </p>
              </div>

              <div className="flex gap-4 w-full">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startGame}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black py-4 rounded-2xl text-xl flex items-center justify-center gap-3 border border-orange-400/40">
                  <RotateCcw className="w-6 h-6" /> جولة جديدة
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPhase('SETUP')}
                  className="flex-1 bg-black/50 text-orange-400 font-black py-4 rounded-2xl text-xl flex items-center justify-center gap-3 border border-orange-500/20 hover:bg-orange-950/30">
                  الإعدادات
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS for custom scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(234, 88, 12, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 88, 12, 0.8);
        }
      `}</style>
    </div>
  );
};
