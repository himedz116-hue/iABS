import React, { useState, useEffect, useRef } from 'react';
import { Timer, Trophy, ChevronLeft, Star, Settings, User, CheckCircle2, XCircle, BarChart3, Image as ImageIcon, Lock, Clock, RotateCcw, Home, Volume2, VolumeX, Zap, Skull, PlayCircle, ArrowRight, Swords, Eye } from 'lucide-react';
import { Question, ChatUser, GameSettings } from '../types';
import { QUESTIONS_DB, CATEGORIES } from '../constants';
import { chatService } from '../services/chatService';
import { leaderboardService } from '../services/supabase';
import { ProAvatar } from './ProAvatar';
import fawazirTxt from '../fawazir.txt?raw';

const parseFawazir = (txt: string): Question[] => {
  const questions: Question[] = [];
  let currentQuestion: any = null;
  const optionLetterToIndex: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'أ': 0, 'ب': 1, 'ج': 2, 'د': 3 };

  const lines = txt.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Start of a new question: Matches "1." or "1-" or "س1:" or "1:"
    if (/^(?:\d+|س\d+)[\.:-]/i.test(line)) {
      if (currentQuestion && currentQuestion.options.length >= 2 && currentQuestion.correctIndex !== undefined) {
        questions.push(currentQuestion as Question);
      }
      currentQuestion = {
        id: questions.length + 1,
        stage: Math.floor(questions.length / 20) + 1,
        category: 'ramadan',
        text: line.replace(/^(?:\d+|س\d+)[\.:-]\s*/i, '').trim(),
        options: [],
        correctIndex: undefined
      };
      if (currentQuestion.stage > 20) currentQuestion.stage = 20;
    }
    else if (currentQuestion) {
      // Check for options: Latin (A) B) C) D)) or Arabic (أ) ب) ج) د))
      const optMatch = line.match(/^([A-Dأ-د])\)\s*(.*)/i);
      if (optMatch) {
        const idx = optionLetterToIndex[optMatch[1]];
        if (idx !== undefined) {
          currentQuestion.options[idx] = optMatch[2].trim();
        }
      }
      // Check for options on same line separated by | (old format fallback)
      else if (line.includes('A)') && line.includes('B)')) {
        const parts = line.split('|').map(p => p.trim());
        parts.forEach(p => {
          const m = p.match(/^([A-D])\)\s*(.*)/i);
          if (m) {
            currentQuestion.options[optionLetterToIndex[m[1].toUpperCase()]] = m[2].trim();
          }
        });
      }
      // Check for answer: الإجابة: B or الإجابة: ب
      else if (line.includes('الإجابة:')) {
        const ansMatch = line.match(/الإجابة:\s*([A-Dأ-د])/i);
        if (ansMatch) {
          const idx = optionLetterToIndex[ansMatch[1]];
          if (idx !== undefined) {
            currentQuestion.correctIndex = idx;
          }
        }
      }
    }
  }

  if (currentQuestion && currentQuestion.options.length >= 2 && currentQuestion.correctIndex !== undefined) {
    questions.push(currentQuestion as Question);
  }
  return questions;
};

const RAMADAN_QUESTIONS_DYNAMIC = parseFawazir(fawazirTxt);

const logoImage = "https://i.ibb.co/pvCN1NQP/95505180312.png"; // Keeping for now but added fallback logic below 
const fallbackLogo = "https://streamarena.vercel.app/logo.png"; // Potential fallback

const MAIN_BACKGROUND_URL = "/pak/classic_2.png";
const CONTENT_BACKGROUND_URL = "https://i.ibb.co/k6mHccgc/content.png";

const AVAILABLE_BACKGROUNDS = [
  { id: 'custom_bg', url: '/fawazir-bg.png', label: 'خلفية عشوائية' },
  { id: 'custom_bg2', url: '/fawazir-alt-bg.jpeg', label: 'خلفية عشوائية 2' },
  { id: 'classic', url: 'https://i.ibb.co/pjDLM8Hq/1000126047.png', label: 'الكلاسيكية 1' },
  { id: 'classic2', url: '/pak/classic_2.png', label: 'الكلاسيكية 2' },
  { id: 'ramadan1', url: '/pak/spiritual.jpg', label: 'روحانية' },
  { id: 'ramadan2', url: '/pak/ramadan_patterns.jpg', label: 'نقوش رمضان' },
  { id: 'ramadan3', url: '/pak/lantern.png', label: 'فانوس' },
  { id: 'content', url: CONTENT_BACKGROUND_URL, label: 'الميدان' },
  { id: 'custom2', url: '/pak/arena_2.png', label: 'ساحة التحدي' },
  { id: 'ramadan4', url: '/pak/ramadan_nights.jpg', label: 'ليالي رمضان' },
];

interface FawazirGameProps {
  category: string;
  onFinish: () => void;
  onHome: () => void;
  isOBS?: boolean;
}

interface PlayerStats {
  user: string;
  avatar: string;
  winCount: number;
  totalTime: number; // in seconds
  averageTime: number;
}

interface RoundWinnerInfo {
  user: string;
  avatar: string;
  responseTime: number;
  winCountBefore: number;
}

export const FawazirGame: React.FC<FawazirGameProps> = ({ category, onFinish, onHome, isOBS }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(20);
  const [gameState, setGameState] = useState<'PRE_START' | 'RULES' | 'PLAYING' | 'ROUND_WIN' | 'SUMMARY'>('PRE_START');
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('fawazir_completed_stages');
    if (saved) setCompletedStages(JSON.parse(saved));
  }, []);

  const handleStageComplete = (stage: number) => {
    if (!completedStages.includes(stage)) {
      const updated = [...completedStages, stage];
      setCompletedStages(updated);
      localStorage.setItem('fawazir_completed_stages', JSON.stringify(updated));
    }
  };

  // Mark stage complete when game ends with a selected stage
  useEffect(() => {
    if (gameState === 'SUMMARY' && selectedStage !== null) {
      handleStageComplete(selectedStage);
    }
  }, [gameState, selectedStage]);

  const handleStageSelect = (stage: number) => {
    setSelectedStage(stage);
    // Filter questions by stage
    let pool = RAMADAN_QUESTIONS_DYNAMIC.filter(q => q.stage === stage);
    // Exclude used IDs
    let available = pool.filter(q => !usedIdsRef.current.has(q.id));
    if (available.length === 0) {
      usedIdsRef.current.clear();
      available = pool;
    }
    available = [...available].sort(() => Math.random() - 0.5);
    const count = settings.roundsCount >= 999 ? available.length : settings.roundsCount;
    const gameQuestions = available.slice(0, count);
    gameQuestions.forEach(q => usedIdsRef.current.add(q.id));
    setWinnersList([]);
    setCurrentIndex(0);
    setRoundWinners([]);
    userAttemptsRef.current.clear();
    setQuestions(gameQuestions);
    setGameState('RULES');
  };
  const [roundWinner, setRoundWinner] = useState<RoundWinnerInfo | null>(null);
  const [roundWinners, setRoundWinners] = useState<RoundWinnerInfo[]>([]);
  const [winnersList, setWinnersList] = useState<PlayerStats[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string>('url(/pak/classic_2.png)');
  const [avatarCache, setAvatarCache] = useState<Record<string, string>>({});
  const [roundStartTime, setRoundStartTime] = useState<number>(0);
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<number>>(new Set());

  const [settings, setSettings] = useState<GameSettings & {
    ramadanDay: number;
    ramadanMixMode: boolean;
    goldenRound: boolean;
    hiddenOptions: boolean;
    hardcore: boolean;
    doublePoints: boolean;
  }>({
    winMode: 'SPEED',
    roundsCount: category === 'ramadan' ? 999 : 15,
    timerDuration: 20,
    gameOverOnMiss: false,
    backgroundId: 'custom_bg',
    soundEnabled: true,
    autoNext: false,
    winnerDuration: 5,
    ramadanDay: 1,
    ramadanMixMode: false,
    goldenRound: false,
    hiddenOptions: false,
    hardcore: false,
    doublePoints: false,
  });

  const [showAllBgs, setShowAllBgs] = useState(false);

  const questionsRef = useRef<Question[]>([]);
  const currentIndexRef = useRef(0);
  const gameStateRef = useRef(gameState);
  const settingsRef = useRef(settings);
  const userAttemptsRef = useRef<Set<string>>(new Set());
  const roundStartTimeRef = useRef<number>(0);
  const winnersListRef = useRef<PlayerStats[]>([]);
  const roundWinnersRef = useRef<RoundWinnerInfo[]>([]);

  useEffect(() => {
    questionsRef.current = questions;
    currentIndexRef.current = currentIndex;
    gameStateRef.current = gameState;
    settingsRef.current = settings;
    roundStartTimeRef.current = roundStartTime;
    winnersListRef.current = winnersList;
    roundWinnersRef.current = roundWinners;
  }, [questions, currentIndex, gameState, settings, roundStartTime, winnersList, roundWinners]);

  // Keep track of used questions across sessions
  const usedIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Load used IDs from localStorage
    const saved = localStorage.getItem('fawazir_used_ids');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        usedIdsRef.current = new Set(parsed);
      } catch (e) { console.error('Error loading used IDs', e); }
    }
  }, []);

  const saveUsedIds = (newSet: Set<number>) => {
    localStorage.setItem('fawazir_used_ids', JSON.stringify([...newSet]));
  };

  useEffect(() => {
    // Determine which database to use
    const dbSource = category === 'ramadan' ? RAMADAN_QUESTIONS_DYNAMIC : QUESTIONS_DB;

    if (category === 'ramadan') {
      const dayQuestions = dbSource.filter(q => q.stage === settings.ramadanDay);
      setQuestions(dayQuestions);
      return;
    }

    let available = dbSource.filter(q => q.category === category && !usedIdsRef.current.has(q.id));
    if (available.length < settings.roundsCount) {
      usedIdsRef.current.clear();
      saveUsedIds(usedIdsRef.current);
      available = dbSource.filter(q => q.category === category);
    }
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
  }, [category, settings.roundsCount, settings.ramadanDay]);

  useEffect(() => {
    const bg = AVAILABLE_BACKGROUNDS.find(b => b.id === settings.backgroundId);
    if (bg) setBackgroundImage(`url(${bg.url})`);
  }, [settings.backgroundId]);

  useEffect(() => {
    if (roundWinner && !roundWinner.avatar) {
      chatService.fetchKickAvatar(roundWinner.user).then(url => {
        if (url) {
          setRoundWinner(prev => prev ? { ...prev, avatar: url } : null);
          setAvatarCache(prev => ({ ...prev, [roundWinner.user.toLowerCase()]: url }));
        }
      });
    }
  }, [roundWinner]);

  const startGame = () => {
    setSelectedStage(null);
    let gameQuestions: Question[] = [];

    if (category === 'ramadan') {
      let pool = RAMADAN_QUESTIONS_DYNAMIC;
      if (!settings.ramadanMixMode) {
        pool = pool.filter(q => q.stage === settings.ramadanDay);
      }

      let available = pool.filter(q => !usedIdsRef.current.has(q.id));

      // If we ran out, reset
      if (available.length === 0) {
        usedIdsRef.current.clear();
        available = pool;
      }

      if (settings.ramadanMixMode) {
        available = [...available].sort(() => Math.random() - 0.5);
      }

      const count = settings.roundsCount >= 999 ? available.length : settings.roundsCount;
      gameQuestions = available.slice(0, count);

      if (gameQuestions.length === 0) {
        // Fallback
        gameQuestions = RAMADAN_QUESTIONS_DYNAMIC.slice(0, count);
      }
    } else {
      // Re-filter to ensure we don't pick already used questions from the current set
      const available = questions.filter(q => !usedIdsRef.current.has(q.id));
      gameQuestions = available.slice(0, settings.roundsCount);

      if (gameQuestions.length === 0) {
        // If none available (shouldn't happen with the reset logic), just take what we have
        const fallback = QUESTIONS_DB.filter(q => q.category === category).slice(0, settings.roundsCount);
        gameQuestions.push(...fallback);
      }
    }

    // Mark these as used immediately
    gameQuestions.forEach(q => usedIdsRef.current.add(q.id));

    setWinnersList([]);
    setCurrentIndex(0);
    setRoundWinners([]);
    userAttemptsRef.current.clear();
    setQuestions(gameQuestions);
    setGameState('RULES');
  };

  const startActualGame = () => {
    setTimer(settings.timerDuration);
    setRoundStartTime(Date.now());
    setGameState('PLAYING');
  };

  useEffect(() => {
    let interval: number;
    if (gameState === 'PLAYING' && timer > 0) {
      interval = window.setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && gameState === 'PLAYING') {
      if (settings.autoNext) {
        handleRoundEnd(null);
      }
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  const playSound = (type: 'correct' | 'wrong' | 'timer' | 'win') => {
    if (!settings.soundEnabled) return;
  };

  const normalizeArabic = (text: string) => {
    if (!text) return "";
    return text.trim().toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[ؤئ]/g, 'ء')
      .replace(/[\u064B-\u0652]/g, '') // Remove Harakat
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()) // Normalize Hindi digits to Western digits
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  useEffect(() => {
    const unsubscribe = chatService.onMessage((msg) => {
      if (gameStateRef.current !== 'PLAYING') return;
      const currentQ = questionsRef.current[currentIndexRef.current];
      if (!currentQ) return;

      const username = msg.user.username;
      if (userAttemptsRef.current.has(username)) return;

      const normalizedUser = normalizeArabic(msg.content);
      if (normalizedUser.length < 1) return;

      // Allow single character only if it's a number, otherwise require at least 2 chars
      if (normalizedUser.length < 2 && !/^\d+$/.test(normalizedUser)) return;

      const checkMatch = (option: string) => {
        const normOpt = normalizeArabic(option);
        const normUser = normalizedUser;

        // 1. Exact match is always winner
        if (normOpt === normUser) return true;

        // 2. Starts with logic (Requested by user)
        if (normOpt.startsWith(normUser)) return true;

        // 3. Ends with logic (E.g., "الخطاب" for "عمر بن الخطاب")
        if (normOpt.endsWith(' ' + normUser)) return true;

        // 4. Multi-word inclusion (e.g., "بن الخطاب")
        const userWordsCount = normUser.split(' ').filter(w => w.length > 0).length;
        if (userWordsCount >= 2 && normOpt.includes(normUser)) return true;

        return false;
      };

      let exactMatchIndex = -1;
      const matchingIndices = currentQ.options.reduce((acc, opt, idx) => {
        const normOpt = normalizeArabic(opt);
        if (normOpt === normalizedUser) {
          exactMatchIndex = idx;
        }
        if (checkMatch(opt)) acc.push(idx);
        return acc;
      }, [] as number[]);

      let finalMatchIndex = -1;
      if (exactMatchIndex !== -1) {
        finalMatchIndex = exactMatchIndex;
      } else if (matchingIndices.length === 1) {
        finalMatchIndex = matchingIndices[0];
      }

      // If multiple matches found but none is exact, it's ambiguous
      if (finalMatchIndex === -1 && matchingIndices.length > 1) return;

      // If no matches found at all, count it as a failed attempt
      if (finalMatchIndex === -1) {
        userAttemptsRef.current.add(username);
        return;
      }

      // Valid match found
      userAttemptsRef.current.add(username);

      // Check if the match is the correct one
      if (finalMatchIndex === currentQ.correctIndex) {
        const responseTime = (Date.now() - roundStartTimeRef.current) / 1000;
        const previousStats = winnersListRef.current.find(w => w.user === username);
        const winCountBefore = previousStats ? previousStats.winCount : 0;

        let avatarUrl = msg.user.avatar || avatarCache[username.toLowerCase()] || '';
        const winnerObj: RoundWinnerInfo = {
          user: username,
          avatar: avatarUrl,
          responseTime,
          winCountBefore
        };

        if (!avatarUrl) {
          chatService.fetchKickAvatar(username).then(av => {
            if (av) {
              const uLower = username.toLowerCase();
              setAvatarCache(prev => ({ ...prev, [uLower]: av }));
              setRoundWinners(prev => prev.map(w => w.user.toLowerCase() === uLower ? { ...w, avatar: av } : w));
              setRoundWinner(prev => (prev && prev.user.toLowerCase() === uLower) ? { ...prev, avatar: av } : prev);
              setWinnersList(prev => prev.map(w => w.user.toLowerCase() === uLower ? { ...w, avatar: av } : w));
            }
          });
        }

        setRoundWinners(prev => {
          const next = [...prev, winnerObj];
          const sorted = next.sort((a, b) => a.responseTime - b.responseTime);

          // Immediate end for SPEED mode (Requested to be more responsive)
          if (settingsRef.current.winMode === 'SPEED' && sorted.length === 1) {
            handleRoundEnd(winnerObj);
          }

          return sorted;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleRoundEnd = async (singleWinner: RoundWinnerInfo | null) => {
    if (gameStateRef.current !== 'PLAYING') return;

    // Use the collected winners OR the single winner if it's the first one
    const winners = singleWinner ? [singleWinner] : [...roundWinnersRef.current].sort((a, b) => a.responseTime - b.responseTime);

    setGameState('ROUND_WIN');
    setRoundWinners(winners);
    setRoundWinner(winners.length > 0 ? winners[0] : null);

    if (winners.length > 0) {
      // Awarding points based on rank in the round for fairness
      const isGoldenRound = settingsRef.current.goldenRound && currentIndexRef.current === questionsRef.current.length - 1;
      const multiplier = (settingsRef.current.doublePoints ? 2 : 1) * (isGoldenRound ? 2 : 1);

      winners.forEach(async (w, index) => {
        const basePoints = index === 0 ? 100 : index === 1 ? 50 : 25; // First gets more
        await leaderboardService.recordWin(w.user, w.avatar, basePoints * multiplier);
      });

      setWinnersList(prev => {
        let newList = [...prev];
        winners.forEach(w => {
          const idx = newList.findIndex(u => u.user === w.user);
          if (idx !== -1) {
            const newCount = newList[idx].winCount + 1;
            const newTotalTime = newList[idx].totalTime + w.responseTime;
            newList[idx] = {
              ...newList[idx],
              winCount: newCount,
              totalTime: newTotalTime,
              averageTime: newTotalTime / newCount
            };
          } else {
            newList.push({
              user: w.user,
              avatar: w.avatar,
              winCount: 1,
              totalTime: w.responseTime,
              averageTime: w.responseTime
            });
          }
        });

        // GLOBAL RANKING: Rounds Won (Primary), Avg Speed (Secondary)
        return newList.sort((a, b) => {
          if (b.winCount !== a.winCount) return b.winCount - a.winCount;
          return a.averageTime - b.averageTime;
        });
      });
    }

    if (settingsRef.current.autoNext) {
      setTimeout(nextRound, settingsRef.current.winnerDuration * 1000);
    }
  };

  const nextRound = () => {
    userAttemptsRef.current.clear();
    setRoundWinners([]);
    setRoundWinner(null);

    const winners = settingsRef.current.winMode === 'SPEED' ? (roundWinner ? [roundWinner] : []) : roundWinners;
    if (settingsRef.current.gameOverOnMiss && winners.length === 0) {
      setGameState('SUMMARY');
      return;
    }

    setCurrentIndex(prev => {
      const nextIdx = prev + 1;
      if (nextIdx < questionsRef.current.length) {
        setTimer(settingsRef.current.timerDuration);
        setRoundStartTime(Date.now());
        setGameState('PLAYING');
        return nextIdx;
      } else {
        setGameState('SUMMARY');
        return prev;
      }
    });
  };

  return (
    <div className={`absolute inset-0 flex items-center justify-center overflow-hidden transition-all duration-1000 bg-cover bg-center ${isOBS ? 'bg-none' : ''}`} style={{ backgroundImage: isOBS ? 'none' : backgroundImage }}>
      {!isOBS && <div className="absolute inset-0 bg-black/40"></div>}

      <div className="relative z-10 w-full h-full flex flex-col items-center p-3 max-w-4xl">
        {(!isOBS || gameState === 'PLAYING') && gameState !== 'PRE_START' && gameState !== 'RULES' && gameState !== 'SUMMARY' && (
          <div className="w-full flex justify-between items-center mb-8">
            <div className="w-10"></div>
            <div className="w-10"></div>
          </div>
        )}

        {gameState === 'PRE_START' ? (
          <div className="flex-1 w-full flex items-start justify-center animate-in zoom-in duration-700 overflow-y-auto custom-scrollbar p-3">
            <div className="relative w-full max-w-3xl mt-1 mb-3 animate-in slide-in-from-bottom duration-700">
              {/* Background glows */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-red-600/15 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

              {/* Main card */}
              <div className="relative glass-card p-4 md:p-5 rounded-[2rem] border border-red-600/20 w-full text-center shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-xl bg-black/85">
                {/* Top neon line */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 via-white/30 to-transparent"></div>
                {/* Corner decorations */}
                <div className="absolute top-3 right-3 w-8 h-8 border-t border-r border-red-500/30 rounded-tr-lg"></div>
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b border-l border-red-500/30 rounded-bl-lg"></div>

                {/* Header */}
                <div className="mb-3 relative">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-8 h-px bg-gradient-to-l from-red-500/50 to-transparent"></div>
                    <div className="p-1.5 bg-gradient-to-br from-red-600 to-red-900 rounded-lg shadow-[0_0_15px_rgba(255,0,0,0.3)] border border-white/10 animate-pulse">
                      <Settings size={12} className="text-white" />
                    </div>
                    <div className="w-8 h-px bg-gradient-to-r from-red-500/50 to-transparent"></div>
                  </div>
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase red-neon-text">إعدادات الميدان</h2>
                  <p className="text-gray-500 font-bold tracking-[0.3em] text-[9px]">ADVANCED BATTLE CONFIGURATION</p>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4 text-right">
                  {/* Left Column */}
                  <div className="space-y-3">
                    {/* Stage Map Card */}
                    <div className="bg-white/[0.03] p-3 rounded-[1.5rem] border border-white/5 hover:border-red-900/50 transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute -top-8 -right-8 w-16 h-16 bg-red-600/5 blur-2xl rounded-full group-hover:bg-red-600/10 transition-all"></div>
                      <div className="flex justify-between items-center mb-2 relative z-10">
                        <label className="text-[9px] font-black text-iabs-red uppercase tracking-wider flex items-center gap-1"><Settings size={11} /> خريطة المراحل</label>
                        {category === 'ramadan' && (
                          <div className="flex gap-1">
                            <button onClick={() => setSettings({ ...settings, ramadanMixMode: false })} className={`px-2 py-0.5 rounded-lg font-black text-[8px] transition-all ${!settings.ramadanMixMode ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-black/40 text-gray-500 hover:text-white'}`}>حسب المرحلة</button>
                            <button onClick={() => setSettings({ ...settings, ramadanMixMode: true })} className={`px-2 py-0.5 rounded-lg font-black text-[8px] transition-all ${settings.ramadanMixMode ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-black/40 text-gray-500 hover:text-white'}`}>عشوائي شامل</button>
                          </div>
                        )}
                      </div>

                      {category === 'ramadan' && !settings.ramadanMixMode && (
                        <div className="relative z-10">
                          <div className="grid grid-cols-5 gap-1.5" dir="ltr">
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((stage) => {
                              const isCompleted = completedStages.includes(stage);
                              const isUnlocked = stage === 1 || completedStages.includes(stage - 1);
                              const isSelected = settings.ramadanDay === stage;
                              return (
                                <button
                                  key={stage}
                                  disabled={!isUnlocked}
                                  onClick={() => handleStageSelect(stage)}
                                  className={`group relative aspect-square rounded-lg border transition-all duration-300 flex flex-col items-center justify-center
                                    ${isSelected
                                      ? 'border-red-500 bg-red-600/20 shadow-[0_0_15px_rgba(220,38,38,0.4)] scale-105'
                                      : isUnlocked
                                        ? isCompleted
                                          ? 'border-green-500/40 bg-green-900/20 hover:border-green-500'
                                          : 'border-white/10 bg-black/40 hover:border-red-500/50 hover:bg-red-600/10'
                                        : 'border-zinc-800 bg-zinc-900/30 opacity-40 cursor-not-allowed'
                                    }`}
                                >
                                  {isUnlocked ? (
                                    isCompleted ? (
                                      <CheckCircle2 size={12} className="text-green-500" />
                                    ) : (
                                      <span className="text-[9px] font-black text-white leading-none">{stage}</span>
                                    )
                                  ) : (
                                    <Lock size={10} className="text-zinc-600" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Win Mode & Timer Card */}
                    <div className="bg-white/[0.03] p-3 rounded-[1.5rem] border border-white/5 hover:border-red-900/50 transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute -top-8 -left-8 w-16 h-16 bg-purple-600/5 blur-2xl rounded-full group-hover:bg-purple-600/10 transition-all"></div>
                      <label className="text-[9px] font-black text-iabs-red uppercase tracking-wider block mb-2 flex items-center gap-1 relative z-10"><Trophy size={11} /> نظام الفوز</label>
                      <div className="grid grid-cols-2 gap-1.5 mb-3 relative z-10">
                        <button onClick={() => setSettings({ ...settings, winMode: 'SPEED' })} className={`h-9 flex items-center justify-center gap-1.5 rounded-lg font-black text-xs transition-all duration-300 ${settings.winMode === 'SPEED' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105' : 'bg-black/40 text-gray-500 hover:bg-white/10 hover:text-white'}`}>
                          <Zap size={14} /> الأسرع
                        </button>
                        <button onClick={() => setSettings({ ...settings, winMode: 'POINTS' })} className={`h-9 flex items-center justify-center gap-1.5 rounded-lg font-black text-xs transition-all duration-300 ${settings.winMode === 'POINTS' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105' : 'bg-black/40 text-gray-500 hover:bg-white/10 hover:text-white'}`}>
                          <BarChart3 size={14} /> نقاط
                        </button>
                      </div>

                      <label className="text-[9px] font-black text-iabs-red uppercase tracking-wider block mb-2 flex items-center gap-1 relative z-10"><Clock size={11} /> مؤقت الإجابة</label>
                      <div className="relative z-10">
                        <input
                          type="range" min="5" max="60" step="5"
                          value={settings.timerDuration}
                          onChange={(e) => setSettings({ ...settings, timerDuration: parseInt(e.target.value) })}
                          className="w-full accent-red-600 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer mb-1"
                        />
                        <div className="flex justify-between text-gray-500 font-mono text-[10px]">
                          <span>5s</span>
                          <span className="text-white font-black text-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{settings.timerDuration}s</span>
                          <span>60s</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    {/* Backgrounds Card */}
                    <div className="bg-white/[0.03] p-3 rounded-[1.5rem] border border-white/5 hover:border-red-900/50 transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-red-600/5 blur-2xl rounded-full group-hover:bg-red-600/10 transition-all"></div>
                      <div className="flex justify-between items-center mb-2 relative z-10">
                        <label className="text-[9px] font-black text-iabs-red uppercase tracking-wider flex items-center gap-1">
                          <ImageIcon size={11} /> خلفيات
                        </label>
                        <button onClick={() => setShowAllBgs(!showAllBgs)} className="text-[8px] font-black text-red-500 hover:text-red-400 bg-red-900/10 hover:bg-red-900/20 px-2 py-0.5 rounded-lg transition-all border border-red-500/20">
                          {showAllBgs ? 'إخفاء' : 'المزيد'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 transition-all duration-500 relative z-10">
                        {(showAllBgs ? AVAILABLE_BACKGROUNDS : AVAILABLE_BACKGROUNDS.slice(0, 2)).map(bg => (
                          <button key={bg.id} onClick={() => setSettings({ ...settings, backgroundId: bg.id })} className={`aspect-video rounded-lg border-2 transition-all duration-300 relative overflow-hidden group/btn ${settings.backgroundId === bg.id ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)] scale-105 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-[1.02]'}`}>
                            <img src={bg.url} className="w-full h-full object-cover" />
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all ${settings.backgroundId === bg.id ? 'opacity-0' : 'opacity-100 group-hover/btn:opacity-0'}`}>
                              <span className="font-black text-[8px] text-white tracking-widest bg-black/60 px-1.5 py-0.5 rounded-full">{bg.label}</span>
                            </div>
                            {settings.backgroundId === bg.id && (
                              <div className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 shadow-lg animate-in zoom-in duration-300">
                                <CheckCircle2 size={8} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Power-ups Card */}
                    <div className="bg-white/[0.03] p-3 rounded-[1.5rem] border border-white/5 hover:border-red-900/50 transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute -top-8 -left-8 w-16 h-16 bg-green-600/5 blur-2xl rounded-full group-hover:bg-green-600/10 transition-all"></div>
                      <label className="text-[9px] font-black text-iabs-red uppercase tracking-wider block mb-2 flex items-center gap-1 relative z-10"><Zap size={11} /> القوى الخاصة</label>

                      <div className="space-y-1 relative z-10">
                        {[
                          { key: 'goldenRound', icon: <Star size={12} />, label: 'الجولة الذهبية', desc: 'آخر جولة ×2', color: 'yellow' },
                          { key: 'hiddenOptions', icon: <Eye size={12} />, label: 'تأخير الخيارات', desc: 'نصف وقت مخفي', color: 'blue' },
                          { key: 'hardcore', icon: <Skull size={12} />, label: 'التحدي الأعمى', desc: 'بدون خيارات!', color: 'red' },
                          { key: 'doublePoints', icon: <BarChart3 size={12} />, label: 'نقاط مضاعفة', desc: 'كل الجولات ×2', color: 'green' },
                        ].map(p => (
                          <div key={p.key} className="flex justify-between items-center p-1.5 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-all group/toggle">
                            <div className="flex items-center gap-1.5">
                              <div className={`${settings[p.key as keyof typeof settings] ? `text-${p.color}-500` : 'text-gray-600'} transition-colors`}>{p.icon}</div>
                              <div className="text-right">
                                <div className="font-black text-white text-[10px] leading-tight">{p.label}</div>
                                <div className={`text-[7px] text-${p.color}-500/70 leading-tight`}>{p.desc}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => setSettings({ ...settings, [p.key]: !settings[p.key as keyof typeof settings] })}
                              className={`w-8 h-4 rounded-full transition-all relative shrink-0 ${settings[p.key as keyof typeof settings] ? `bg-${p.color}-500` : 'bg-gray-700'}`}
                            >
                              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${settings[p.key as keyof typeof settings] ? 'left-0.5' : 'left-[18px]'}`}></span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-2 relative z-10 w-full">
                  <button onClick={startGame} className="flex-[3] bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:via-red-400 hover:to-red-500 text-white font-black py-2.5 px-5 rounded-[1.2rem] text-sm shadow-[0_10px_40px_rgba(220,38,38,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group border border-red-400/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/20 blur-3xl rounded-full group-hover:bg-yellow-500/40 transition-colors"></div>
                    <PlayCircle size={16} className="fill-white text-red-600 drop-shadow-lg relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                    <span className="relative z-10 tracking-widest italic decoration-2 underline-offset-8 group-hover:underline">ابدأ التحدي 🔥</span>
                  </button>
                  <button onClick={onHome} className="flex-1 px-3 py-2.5 bg-black/60 border-2 border-white/10 hover:border-red-500/50 hover:bg-red-600/10 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)] text-white rounded-[1.2rem] flex items-center justify-center transition-all group backdrop-blur-md">
                    <Home size={14} className="group-hover:scale-110 transition-transform text-gray-400 group-hover:text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : gameState === 'RULES' ? (
          <div className="flex-1 w-full flex items-center justify-center animate-in zoom-in duration-700 p-4 overflow-y-auto custom-scrollbar">
            <div className="relative w-full max-w-2xl animate-in slide-in-from-bottom duration-700">
              {/* Background glow effects */}
              <div className="absolute -top-20 right-0 w-80 h-80 bg-red-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse"></div>
              <div className="absolute -bottom-20 left-0 w-80 h-80 bg-yellow-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse delay-1000"></div>

              <div className="relative glass-card p-5 md:p-6 rounded-[2rem] border border-red-600/20 w-full text-center shadow-[0_0_100px_rgba(255,0,0,0.15)] backdrop-blur-3xl bg-black/90 overflow-hidden">
                {/* Top neon line */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 via-white/20 to-transparent"></div>
                {/* Corner decorations */}
                <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-red-500/20 rounded-tr-md"></div>
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-red-500/20 rounded-bl-md"></div>

                {/* Header */}
                <div className="mb-5 relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-12 h-px bg-gradient-to-l from-red-500/30 to-transparent"></div>
                    <div className="p-2 bg-gradient-to-br from-red-600 to-red-900 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-white/10 animate-pulse">
                      <Swords size={16} className="text-white" />
                    </div>
                    <div className="w-12 h-px bg-gradient-to-r from-red-500/30 to-transparent"></div>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase red-neon-text drop-shadow-[0_0_20px_rgba(255,0,0,0.3)]">قوانين الميدان 📜</h2>
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto rounded-full mt-2"></div>
                </div>

                {/* Rules Cards */}
                <div className="space-y-3 text-right mb-8 relative z-10">
                  {/* Rule 1 */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-transparent rounded-[1.5rem] opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
                    <div className="relative bg-white/[0.03] p-4 rounded-[1.5rem] border border-white/10 hover:border-red-500/40 transition-all duration-300 flex flex-col md:flex-row items-center md:items-start gap-3 shadow-lg">
                      <div className="p-2.5 bg-red-600/20 rounded-xl group-hover:bg-red-600 transition-all duration-300 shadow-lg shrink-0">
                        <User size={18} className="text-red-500 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div className="text-center md:text-right flex-1">
                        <h3 className="text-base md:text-lg font-black text-white mb-1 italic flex items-center justify-center md:justify-start gap-1.5">
                          محاولة واحدة فقط! <span className="text-lg">⚠️</span>
                        </h3>
                        <p className="text-gray-400 font-bold leading-relaxed text-xs md:text-sm">كل لاعب له فرصة واحدة فقط للإجابة في كل جولة. أي رسالة تنكتب في الشات (حتى لو مو الإجابة) راح تُحتسب كمحاولة وتروح عليك فرصتك.</p>
                      </div>
                    </div>
                  </div>

                  {/* Rule 2 */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-600/20 to-transparent rounded-[1.5rem] opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
                    <div className="relative bg-white/[0.03] p-4 rounded-[1.5rem] border border-white/10 hover:border-green-500/40 transition-all duration-300 flex flex-col md:flex-row items-center md:items-start gap-3 shadow-lg">
                      <div className="p-2.5 bg-green-500/20 rounded-xl group-hover:bg-green-500 transition-all duration-300 shadow-lg shrink-0">
                        <CheckCircle2 size={18} className="text-green-500 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div className="text-center md:text-right flex-1">
                        <h3 className="text-base md:text-lg font-black text-white mb-1 italic flex items-center justify-center md:justify-start gap-1.5">
                          طابق الإجابة <span className="text-lg">🎯</span>
                        </h3>
                        <p className="text-gray-400 font-bold leading-relaxed text-xs md:text-sm">لازم تنكتب الإجابة في الشات <span className="text-green-400">نفس المكتوب بالضبط</span> في خيارات الشاشة حرفياً. التدقيق الإملائي مهم جداً!</p>
                      </div>
                    </div>
                  </div>

                  {/* Rule 3 */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600/20 to-transparent rounded-[1.5rem] opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
                    <div className="relative bg-white/[0.03] p-4 rounded-[1.5rem] border border-white/10 hover:border-yellow-500/40 transition-all duration-300 flex flex-col md:flex-row items-center md:items-start gap-3 shadow-lg">
                      <div className="p-2.5 bg-yellow-500/20 rounded-xl group-hover:bg-yellow-500 transition-all duration-300 shadow-lg shrink-0">
                        <Clock size={18} className="text-yellow-500 group-hover:text-black transition-colors duration-300" />
                      </div>
                      <div className="text-center md:text-right flex-1">
                        <h3 className="text-base md:text-lg font-black text-white mb-1 italic flex items-center justify-center md:justify-start gap-1.5">
                          السرعة تحسم! <span className="text-lg">⚡</span>
                        </h3>
                        <p className="text-gray-400 font-bold leading-relaxed text-xs md:text-sm">الوقت من ذهب! كلما كنت أسرع في لقط الإجابة وكتابتها بالوقت، زادت نقاطك وفرصتك تتصدر قائمة الأساطير.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <div className="relative z-10 w-full flex justify-center">
                  <button onClick={startActualGame} className="group relative bg-white text-black hover:bg-gray-200 font-black py-3 px-8 rounded-[1.2rem] text-base shadow-[0_15px_50px_rgba(255,255,255,0.15)] hover:shadow-[0_20px_60px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 italic border-2 border-transparent hover:border-white/50 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-transparent to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10">فهمت، لنبدأ!</span>
                    <PlayCircle size={16} className="relative z-10 group-hover:text-red-600 transition-colors group-hover:scale-110 group-hover:rotate-12 duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : gameState === 'SUMMARY' ? (
          <div className="flex-1 w-full flex flex-col items-center animate-in fade-in duration-1000 overflow-y-auto custom-scrollbar p-4 md:p-8 relative">
            {/* Background Atmosphere */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-600/10 blur-[200px] rounded-full animate-pulse"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-yellow-600/10 blur-[200px] rounded-full animate-pulse delay-700"></div>
            </div>

            <div className="w-full max-w-4xl relative z-10">
              {/* Top Victory Banner - More Compact */}
              <div className="text-center mb-6 relative">
                <div className="inline-block relative">
                  <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-1 animate-bounce drop-shadow-[0_5px_20px_rgba(234,179,8,0.4)]">
                    مبروكككككك 🎉🎉🎊
                  </h2>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase red-neon-text leading-none mb-3">
                  أساطير الميدان
                </h1>
                <div className="flex items-center justify-center gap-6 opacity-30">
                  <div className="h-px w-32 bg-gradient-to-r from-transparent to-white"></div>
                  <div className="w-3 h-3 rotate-45 border border-white"></div>
                  <div className="h-px w-32 bg-gradient-to-l from-transparent to-white"></div>
                </div>
              </div>

              {(() => {
                const top3 = winnersList.slice(0, 3);
                const restPlayers = winnersList.slice(3, 23);

                if (!winnersList.length) {
                  return (
                    <div className="text-center py-10 bg-black/40 rounded-[2rem] border-2 border-dashed border-white/10 backdrop-blur-3xl">
                      <Skull size={48} className="text-gray-800 mx-auto mb-4 opacity-30" />
                      <h2 className="text-2xl font-black text-white/20 italic">الميدان بانتظار أبطاله...</h2>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                    {/* LEFT SIDE: The Grand Champion & Buttons */}
                    <div className="lg:w-[42%] flex flex-col items-center">
                      <div className="w-full bg-gradient-to-b from-yellow-500/20 via-black/40 to-black/90 backdrop-blur-3xl rounded-[2rem] border-l-4 border-t-4 border-yellow-500 p-4 shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden group mb-4">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/5 blur-[100px] group-hover:bg-yellow-500/10 transition-all"></div>

                        {/* Winner Avatar */}
                        <div className="relative mb-4 flex justify-center">
                          <div className="relative">
                            <div className="absolute -inset-3 bg-yellow-500/20 blur-[60px] rounded-full animate-pulse"></div>
                            <ProAvatar
                              url={top3[0]?.avatar}
                              username={top3[0]?.user}
                              size="w-24 h-24"
                              className="z-10 transition-transform group-hover:scale-110"
                            />
                            <div className="absolute -top-4 -right-4 animate-float z-20">
                              <Trophy size={32} className="text-yellow-400 fill-yellow-400 filter drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]" />
                            </div>
                          </div>
                        </div>

                        <div className="text-center relative z-10">
                          <div className="bg-yellow-500 text-black px-4 py-1 rounded-full font-black text-[8px] mb-3 shadow-xl italic inline-block tracking-widest uppercase">🥇 ULTIMATE CHAMPION</div>
                          <h3 className="text-2xl md:text-3xl font-black text-white mb-4 gold-glow-text truncate tracking-tighter leading-none">{top3[0]?.user}</h3>

                          <div className="grid grid-cols-2 gap-3 w-full">
                            <div className="bg-white/5 p-3 rounded-[1.2rem] border border-white/10 text-center shadow-inner group-hover:bg-white/10 transition-all">
                              <span className="text-[8px] text-yellow-500 font-black block mb-1 uppercase tracking-widest">VICTORIES</span>
                              <span className="text-xl font-black text-white italic font-mono">{top3[0]?.winCount}</span>
                            </div>
                            <div className="bg-white/5 p-3 rounded-[1.2rem] border border-white/10 text-center shadow-inner group-hover:bg-white/10 transition-all">
                              <span className="text-[8px] text-yellow-500 font-black block mb-1 uppercase tracking-widest">AVG SPEED</span>
                              <span className="text-xl font-black text-white italic font-mono">{top3[0]?.averageTime.toFixed(3)}s</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Stacked under Winner */}
                      <div className="flex flex-col gap-2 w-full px-2">
                        <button onClick={startGame} className="group w-full py-3 bg-white text-black font-black rounded-[1.2rem] text-base hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 italic shadow-[0_20px_60px_rgba(255,255,255,0.2)]">
                          إعادة المعركة <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-1000" />
                        </button>
                        <button onClick={onHome} className="group w-full py-3 bg-red-600 text-white font-black rounded-[1.2rem] text-base hover:bg-red-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 italic shadow-[0_20px_60px_rgba(220,38,38,0.3)]">
                          <Home size={16} /> الرئيسية
                        </button>
                      </div>
                    </div>

                    {/* RIGHT SIDE: Hall of Legends (Ranking 2-23) */}
                    <div className="lg:w-[58%] bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-white/5 p-4 flex flex-col shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[150px] -z-10 animate-pulse"></div>

                      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                        <h3 className="text-xl font-black text-white italic red-neon-text">قـائمة الأسـاطـير</h3>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                          <span className="text-white/40 font-black text-[8px] uppercase tracking-[0.2em]">Live Rankings</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                        {Array.from({ length: 22 }).map((_, i) => {
                          const player = winnersList[i + 1];
                          const rank = i + 2;

                          if (!player) return (
                            <div key={i} className="bg-white/5 rounded-[1.5rem] p-4 border-2 border-dashed border-white/5 opacity-10 flex items-center gap-3 grayscale">
                              <span className="text-xl font-black text-white italic w-8 text-center">#{rank}</span>
                              <div className="w-10 h-10 rounded-xl bg-zinc-800"></div>
                              <div className="flex-1 h-2 bg-zinc-800 rounded-full"></div>
                            </div>
                          );

                          const isTop3 = rank <= 3;
                          const rankColor = rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-orange-500' : 'text-white/20';

                          return (
                            <div key={i} className="group bg-white/[0.03] hover:bg-white/10 rounded-[1.2rem] p-3 flex items-center gap-3 border border-white/5 hover:border-red-600/30 transition-all hover:-translate-y-1 relative overflow-hidden shadow-lg">
                              <div className="absolute top-[-20%] right-[-10%] w-16 h-16 bg-red-600/5 blur-2xl group-hover:bg-red-600/10 transition-all"></div>
                              <span className={`text-xl font-black italic absolute right-3 transition-all ${rankColor} group-hover:scale-110`}>#{rank}</span>

                              <div className="relative">
                                <ProAvatar
                                  url={player.avatar}
                                  username={player.user}
                                  size="w-12 h-12"
                                  className={`group-hover:border-red-500 transition-all shadow-xl ${isTop3 ? 'border-2 border-yellow-500' : ''}`}
                                />
                                {isTop3 && (
                                  <div className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-lg flex items-center justify-center text-[8px] font-black border-2 border-black ${rank === 2 ? 'bg-slate-400' : 'bg-orange-600'} text-black z-20`}>
                                    {rank === 2 ? '🥈' : '🥉'}
                                  </div>
                                )}
                              </div>

                              <div className="relative z-10 min-w-0 flex-1">
                                <div className="text-base font-black text-white truncate mb-1 group-hover:text-red-500 transition-colors uppercase italic">{player.user}</div>
                                <div className="flex gap-3">
                                  <div className="flex flex-col">
                                    <span className="text-[6px] text-white/40 font-black uppercase tracking-widest">Wins</span>
                                    <span className="text-base font-black text-white italic">{player.winCount}</span>
                                  </div>
                                  <div className="w-px h-5 bg-white/10 mt-auto"></div>
                                  <div className="flex flex-col">
                                    <span className="text-[6px] text-white/40 font-black uppercase tracking-widest">Speed</span>
                                    <span className="text-base font-black text-blue-400 italic">{player.averageTime.toFixed(2)}s</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="flex-1 w-full flex flex-col items-center justify-center relative">
            {gameState === 'ROUND_WIN' && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center animate-in fade-in zoom-in duration-1000">
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-green-500/20 blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-500/20 blur-[150px] animate-pulse delay-700"></div>
                <div className="text-center relative max-w-2xl w-full mx-4 p-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-visible">
                  <div className="bg-[#050505] rounded-[2.4rem] p-4 relative overflow-visible ring-1 ring-white/10">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent animate-shimmer"></div>

                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 px-5 py-1.5 rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(220,38,38,0.5)] z-[110] border-t-4 border-white/20 animate-bounce">
                      <span className="text-white font-black text-sm italic tracking-[0.2em] uppercase drop-shadow-lg">ROUND OVER</span>
                    </div>

                    {/* Correct Answer Display - NEW */}
                    <div className="mt-8 mb-6 animate-in slide-in-from-top duration-700">
                      <p className="text-gray-500 font-bold text-[10px] tracking-widest uppercase mb-1.5">الإجابة الصحيحة هي:</p>
                      <div className="inline-block bg-white/10 px-6 py-2 rounded-[1.2rem] border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <span className="text-xl md:text-2xl font-black text-green-500 italic drop-shadow-sm">
                          {questions[currentIndex]?.options[questions[currentIndex]?.correctIndex]}
                        </span>
                      </div>
                    </div>

                    {roundWinners.length > 0 ? (
                      <div className="flex flex-col items-center">
                        {settings.winMode === 'SPEED' ? (
                          <div className="w-full flex flex-col items-center">
                            <div className="relative mb-4">
                              <div className="relative z-10">
                                <ProAvatar
                                  url={roundWinners[0].avatar}
                                  username={roundWinners[0].user}
                                  size="w-28 h-28"
                                  className="shadow-[0_0_60px_rgba(220,38,38,0.4)]"
                                />
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-0.5 rounded-xl font-black text-[10px] shadow-xl italic whitespace-nowrap z-20">WINNER</div>
                              </div>
                            </div>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter mb-3 red-neon-text filter drop-shadow-xl">{roundWinners[0].user}</h2>
                            <div className="flex gap-2 mb-4">
                              <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                                <Clock size={12} className="text-red-500" />
                                <span className="text-base font-black text-white italic font-mono">{roundWinners[0].responseTime.toFixed(3)}s</span>
                              </div>
                              <div className="bg-red-600/10 px-3 py-1.5 rounded-xl border border-red-500/30 flex items-center gap-1.5">
                                <Trophy size={12} className="text-yellow-500" />
                                <span className="text-base font-black text-white italic font-mono">{roundWinners[0].winCountBefore + 1}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full flex flex-col items-center mb-8">
                            <h3 className="text-red-500 font-black tracking-[0.5em] text-lg uppercase mb-6 italic">ROUND WINNERS</h3>
                            <div className="flex flex-wrap justify-center gap-4 max-h-[250px] overflow-y-auto custom-scrollbar p-4 bg-white/[0.02] rounded-[2rem] border border-white/5 w-full">
                              {roundWinners.map((w, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2 group animate-in zoom-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                  <div className="relative">
                                    <ProAvatar
                                      url={w.avatar}
                                      username={w.user}
                                      size="w-20 h-20"
                                      className="shadow-[0_0_30px_rgba(220,38,38,0.3)] group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute -bottom-1.5 -right-1.5 bg-red-600 text-white w-5 h-5 rounded-lg flex items-center justify-center font-black border border-black text-[8px] shadow-xl z-20">#{idx + 1}</div>
                                  </div>
                                  <span className="text-white font-black text-[10px] block truncate max-w-[80px] drop-shadow-md">{w.user}</span>
                                  <div className="bg-red-600/20 px-1.5 py-0.5 rounded-lg border border-red-500/20 mt-0.5">
                                    <span className="text-red-500 font-black text-[8px] font-mono italic">{w.responseTime.toFixed(3)}s</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="w-full bg-white/[0.03] rounded-[1.5rem] p-4 border border-white/10 backdrop-blur-xl relative overflow-hidden mb-4">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-3xl rounded-full"></div>
                          <div className="flex flex-col md:flex-row items-center justify-between mb-3 px-2 gap-2">
                            <h4 className="text-white/40 font-black text-[8px] uppercase tracking-[0.5em] italic">ROUND PERFORMANCE</h4>
                            <div className="flex gap-2">
                              <div className="bg-red-600/20 px-2 py-1 rounded-xl border border-red-500/30 flex items-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                                <span className="text-[7px] text-red-500 font-black uppercase">ROUND AVG:</span>
                                <span className="text-sm font-black text-white italic font-mono">{(roundWinners.reduce((acc, curr) => acc + curr.responseTime, 0) / (roundWinners.length || 1)).toFixed(3)}s</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                            {roundWinners.slice(0, 3).map((player, idx) => (
                              <div key={idx} className={`p-2 rounded-xl flex items-center gap-2 border transition-all bg-black/40 relative overflow-hidden group hover:scale-[1.02] shadow-2xl ${idx === 0 ? 'border-yellow-500/50 shadow-yellow-500/10' : 'border-white/5'}`}>
                                <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-2xl opacity-10"></div>
                                <span className={`text-base font-black italic ${idx === 0 ? 'text-yellow-500' : 'text-white/20'}`}>#{idx + 1}</span>
                                <ProAvatar
                                  url={player.avatar}
                                  username={player.user}
                                  size="w-10 h-10"
                                  className={idx === 0 ? 'animate-pulse' : ''}
                                />
                                <div className="min-w-0">
                                  <div className="text-[11px] font-black text-white truncate">{player.user}</div>
                                  <div className="flex gap-1.5">
                                    <div className="text-[7px] font-bold text-blue-400">TIME: {player.responseTime.toFixed(3)}s</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="max-h-48 overflow-y-auto custom-scrollbar pr-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {roundWinners.slice(3, 33).map((player, i) => (
                              <div key={i} className="bg-black/40 rounded-xl p-2 flex items-center gap-2 border border-white/5 hover:bg-white/10 transition-all group relative overflow-hidden">
                                <span className="text-white/10 font-black text-[8px] italic">#{i + 4}</span>
                                <ProAvatar
                                  url={player.avatar}
                                  username={player.user}
                                  size="w-10 h-10"
                                />
                                <div className="min-w-0">
                                  <div className="text-[10px] font-black text-white truncate">{player.user}</div>
                                  <div className="text-[7px] font-bold text-blue-400">{player.responseTime.toFixed(2)}s</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                          <button onClick={nextRound} className="group relative px-5 py-2 bg-white text-black font-black rounded-[1.2rem] text-base shadow-[0_20px_60px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 italic overflow-hidden mb-2">
                          الجولة التالية <ArrowRight size={14} className="group-hover:translate-x-3 transition-transform duration-500" />
                          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
                        </button>
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-red-600 flex items-center justify-center mb-4 bg-red-600/5 animate-pulse">
                          <Skull size={36} className="text-red-500 opacity-50" />
                        </div>
                        <h2 className="text-3xl font-black text-red-500 italic uppercase tracking-tighter mb-4 red-neon-text">NO WINNERS</h2>
                        <button onClick={nextRound} className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black rounded-2xl text-lg transition-all flex items-center gap-2">
                          المتابعة <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={`w-full max-w-3xl transition-all duration-1000 ${gameState === 'ROUND_WIN' ? 'blur-3xl opacity-30 scale-110 grayscale pointer-events-none' : 'scale-100 opacity-100'}`}>
              <div className="relative overflow-visible p-4 md:p-6">
                <div className="absolute -top-4 inset-x-4 flex items-center justify-between z-20">
                  <div className="flex gap-2">
                    <div className="bg-[#0A0A0A] border border-white/10 px-3 py-1 rounded-xl flex items-center gap-2 shadow-2xl">
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-widest italic">الجولة</span>
                      <span className="text-lg font-black text-white italic font-mono">{currentIndex + 1}/{questions.length}</span>
                    </div>
                    <div className={`bg-[#0A0A0A] border px-3 py-1 rounded-xl flex items-center gap-2 shadow-2xl transition-all ${timer < 10 ? 'border-red-600 text-red-600 animate-pulse' : 'border-white/10 text-white'}`}>
                      <Clock size={12} />
                      <span className="text-lg font-black font-mono italic">{timer}s</span>
                    </div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 -top-3">
                    <div className="w-12 h-12 bg-black rounded-full border-4 border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.8)] flex items-center justify-center relative overflow-hidden group">
                      <img
                        src={logoImage}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackLogo; }}
                        className="w-7 h-7 object-contain relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        alt="Logo"
                      />
                    </div>
                  </div>
                  <button onClick={() => setGameState('PRE_START')} className="w-8 h-8 bg-red-600 rounded-full border border-white/20 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-white">
                    <ChevronLeft size={14} />
                  </button>
                </div>

                <div className="text-center mb-6 mt-6 px-2 relative z-10">
                  <h2 className="text-lg md:text-2xl font-black text-white leading-tight italic tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,1)]">
                    {questions[currentIndex]?.text}
                  </h2>
                </div>

                {gameState === 'PLAYING' && (
                  <div className="mb-6 flex flex-col items-center gap-3">
                    <p className="text-red-500 font-black text-sm italic tracking-[0.2em] uppercase animate-pulse">
                      اكتب الإجابة في الشات للفوز! ⌨️
                    </p>
                    {roundWinners.length > 0 && (
                      <div className="bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 animate-bounce">
                        <Trophy size={12} className="text-yellow-500" />
                        <span className="text-green-500 font-black text-[10px] italic uppercase">
                          تم العثور على {roundWinners.length} إجابة صحيحة!
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full relative z-10 animate-in slide-in-from-bottom-10 duration-700">
                  {settings.hardcore ? (
                    <div className="col-span-2 text-center p-4 bg-black/60 rounded-2xl border border-red-500/50 shadow-2xl">
                      <Skull className="text-red-500 mx-auto mb-2" size={28} />
                      <h3 className="text-xl font-black text-white tracking-widest drop-shadow-lg leading-relaxed">التحدي الأعمى<br /><span className="text-sm text-gray-400">أجب بدون خيارات</span></h3>
                    </div>
                  ) : (
                    questions[currentIndex]?.options.map((opt, idx) => {
                      const isCorrect = idx === questions[currentIndex]?.correctIndex;
                      const isRoundWin = gameState === 'ROUND_WIN';
                      const isHidden = settings.hiddenOptions && gameState === 'PLAYING' && timer > settings.timerDuration / 2;

                      let cardStyles = "border-white/10 bg-black/60 hover:border-red-600/50 hover:bg-red-600/[0.02]";
                      let textStyles = "text-white";

                      if (isRoundWin) {
                        if (isCorrect) {
                          cardStyles = "border-green-500 bg-green-500/20 scale-105 shadow-[0_0_50px_rgba(34,197,94,0.4)] z-50 relative";
                          textStyles = "text-green-500";
                        } else {
                          cardStyles = "border-white/5 bg-black/40 opacity-30 grayscale";
                          textStyles = "text-white/20";
                        }
                      } else if (isHidden) {
                        cardStyles = "border-white/5 bg-gray-900/40 blur-[4px] pointer-events-none opacity-80";
                        textStyles = "text-transparent";
                      }

                      return (
                        <div key={idx} className={`group relative p-3 md:p-4 rounded-[1.5rem] border-2 flex items-center justify-center transition-all duration-500 shadow-2xl overflow-hidden ${cardStyles}`}>
                          <div className="absolute top-0 left-0 w-1 h-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></div>
                          {isHidden ? (
                            <span className="text-2xl font-black italic text-gray-600 absolute blur-none drop-shadow-lg">???</span>
                          ) : (
                            <span className={`text-sm md:text-xl font-black italic text-center relative z-10 px-3 transition-all ${textStyles} drop-shadow-md`}>{opt}</span>
                          )}
                          {!isRoundWin && !isHidden && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-600/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          )}
                          {isRoundWin && isCorrect && (
                            <div className="absolute top-3 right-6 text-green-500 animate-bounce">
                              <CheckCircle2 size={24} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {!isOBS && (
                  <div className="mt-8 flex flex-col items-center gap-4 relative z-50">
                    {gameState === 'PLAYING' && (timer === 0 || roundWinners.length > 0) && (
                      <button onClick={() => handleRoundEnd(null)} className="group px-5 py-2 bg-green-600 hover:bg-green-500 text-white font-black rounded-full text-base shadow-[0_0_50px_rgba(34,197,94,0.5)] animate-in zoom-in duration-500 transition-all flex items-center gap-1.5">
                        <Eye size={14} /> اعـلان الـفـائزيـن ({roundWinners.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
