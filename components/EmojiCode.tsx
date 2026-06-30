
import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { leaderboardService } from '../services/supabase';
import { ChatUser } from '../types';
import { Smile, Play, Settings, Users, Trophy, LogOut, User, Crown, ChevronRight, Sparkles, Star, Award, Zap, Eye, RotateCcw, Brain, Timer } from 'lucide-react';
import { ProAvatar } from './ProAvatar';

interface EmojiCodeProps {
    onHome: () => void;
    isOBS?: boolean;
}

interface GameConfig {
    joinKeyword: string;
    maxPlayers: number;
    roundDuration: number;
    pointsPerAnswer: number;
    totalQuestions: number;
    category: string;
}

import { EMOJI_PUZZLES, EmojiPuzzle } from './EmojiData';

const CATEGORIES = ['الكل', ...Array.from(new Set(EMOJI_PUZZLES.map(p => p.category)))];

export const EmojiCode: React.FC<EmojiCodeProps> = ({ onHome, isOBS }) => {
    const [config, setConfig] = useState<GameConfig>({
        joinKeyword: 'ايموجي',
        maxPlayers: 200,
        roundDuration: 20,
        pointsPerAnswer: 10,
        totalQuestions: 10,
        category: 'الكل',
    });

    const [phase, setPhase] = useState<GamePhase>('SETUP');
    const [participants, setParticipants] = useState<ChatUser[]>([]);
    const [playerScores, setPlayerScores] = useState<Record<string, PlayerScore>>({});
    const [currentPuzzle, setCurrentPuzzle] = useState<EmojiPuzzle | null>(null);
    const [usedTopics, setUsedTopics] = useState<string[]>([]);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [winner, setWinner] = useState<{ user: ChatUser; time: number } | null>(null);
    const [showEmojis, setShowEmojis] = useState(false);
    const [emojiScale, setEmojiScale] = useState(0);
    const [answeredThisRound, setAnsweredThisRound] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const phaseRef = useRef(phase);
    const configRef = useRef(config);
    const participantsRef = useRef(participants);
    const currentPuzzleRef = useRef(currentPuzzle);
    const playerScoresRef = useRef(playerScores);
    const answeredRef = useRef(answeredThisRound);
    const questionStartRef = useRef(0);

    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { configRef.current = config; }, [config]);
    useEffect(() => { participantsRef.current = participants; }, [participants]);
    useEffect(() => { currentPuzzleRef.current = currentPuzzle; }, [currentPuzzle]);
    useEffect(() => { playerScoresRef.current = playerScores; }, [playerScores]);
    useEffect(() => { answeredRef.current = answeredThisRound; }, [answeredThisRound]);

    // Chat listener
    useEffect(() => {
        const unsubscribe = chatService.onMessage((msg) => {
            const content = msg.content.trim().toLowerCase();

            if (phaseRef.current === 'LOBBY') {
                if (content.includes(configRef.current.joinKeyword.toLowerCase())) {
                    setParticipants(prev => {
                        if (prev.length >= configRef.current.maxPlayers) return prev;
                        if (prev.some(p => p.username.toLowerCase() === msg.user.username.toLowerCase())) return prev;
                        const newUser = { ...msg.user };
                        chatService.fetchKickAvatar(newUser.username).then(avatar => {
                            if (avatar) setParticipants(c => c.map(p => p.username.toLowerCase() === newUser.username.toLowerCase() ? { ...p, avatar } : p));
                        }).catch(() => { });
                        return [...prev, newUser];
                    });
                }
            }

            if (phaseRef.current === 'QUESTION' && !answeredRef.current && currentPuzzleRef.current) {
                const puzzle = currentPuzzleRef.current;
                const normalizedContent = normalizeArabic(content);
                const isCorrect = puzzle.answers.some(a => {
                    const normalizedAnswer = normalizeArabic(a);
                    const isExact = normalizedContent === normalizedAnswer;
                    const isUserInside = normalizedAnswer.includes(normalizedContent) && normalizedContent.length >= 3;
                    const isAnswerInside = normalizedContent.includes(normalizedAnswer) && normalizedAnswer.length >= 2;
                    return isExact || isUserInside || isAnswerInside;
                });

                if (isCorrect) {
                    const timeTaken = (Date.now() - questionStartRef.current) / 1000;
                    const timeBonus = Math.max(1, Math.floor((configRef.current.roundDuration - timeTaken) / 2));
                    const points = configRef.current.pointsPerAnswer + timeBonus;

                    setAnsweredThisRound(true);
                    setWinner({ user: msg.user, time: timeTaken });

                    // Record win in leaderboard
                    leaderboardService.recordWin(msg.user.username, msg.user.avatar || '', points);

                    // Update score
                    setPlayerScores(prev => {
                        const key = msg.user.username.toLowerCase();
                        const existing = prev[key] || { user: msg.user, score: 0, correctAnswers: 0, streak: 0 };
                        return {
                            ...prev,
                            [key]: {
                                ...existing,
                                user: msg.user,
                                score: existing.score + points,
                                correctAnswers: existing.correctAnswers + 1,
                                streak: existing.streak + 1,
                            }
                        };
                    });

                    // Reset streaks for others
                    setPlayerScores(prev => {
                        const updated = { ...prev };
                        Object.keys(updated).forEach(k => {
                            if (k !== msg.user.username.toLowerCase()) {
                                updated[k] = { ...updated[k], streak: 0 };
                            }
                        });
                        return updated;
                    });

                    setPhase('ANSWERED');
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // Timer
    useEffect(() => {
        if (phase === 'QUESTION' && timeLeft > 0) {
            const timer = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) { timeUp(); return 0; }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [phase, timeLeft]);

    // Emoji entrance animation
    useEffect(() => {
        if (phase === 'QUESTION') {
            setShowEmojis(false);
            setEmojiScale(0);
            setTimeout(() => { setShowEmojis(true); setEmojiScale(1); }, 300);
        }
    }, [phase, currentPuzzle]);



    const startGame = () => {
        if (participants.length < 1) return;
        const initialScores: Record<string, PlayerScore> = {};
        participants.forEach(p => {
            initialScores[p.username.toLowerCase()] = { user: p, score: 0, correctAnswers: 0, streak: 0 };
        });
        setPlayerScores(initialScores);
        setUsedTopics([]);
        setQuestionNumber(0);
        nextQuestion();
    };

    const nextQuestion = async () => {
        if (questionNumber >= config.totalQuestions) {
            setPhase('FINALE');
            return;
        }

        setPhase('LOADING');
        setIsLoading(true);

        // Read used emojis from localStorage
        const storedUsed = JSON.parse(localStorage.getItem('usedEmojis') || '[]');
        
        let available = EMOJI_PUZZLES.filter(p => 
            !storedUsed.includes(p.id) &&
            (config.category === 'الكل' || p.category === config.category)
        );

        if (available.length === 0) {
            // If all emojis in this category are used, reset the pool for this category
            available = EMOJI_PUZZLES.filter(p => config.category === 'الكل' || p.category === config.category);
            // Optionally, we could clear the localStorage here, but better to just use the full pool
        }

        const puzzle = available[Math.floor(Math.random() * available.length)];

        if (puzzle) {
            setCurrentPuzzle(puzzle);
            // Save to localStorage
            const newUsed = [...storedUsed, puzzle.id];
            localStorage.setItem('usedEmojis', JSON.stringify(newUsed));
            setUsedTopics(prev => [...prev, puzzle.answers[0]]);
            setQuestionNumber(prev => prev + 1);
            setTimeLeft(config.roundDuration);
            setWinner(null);
            setAnsweredThisRound(false);

            // Short delay to show loading state if instant
            setTimeout(() => {
                setPhase('QUESTION');
                setIsLoading(false);
                questionStartRef.current = Date.now();
            }, 500);
        } else {
            // If everything failed
            setPhase('FINALE');
        }
    };

    const timeUp = () => {
        // Reset all streaks
        setPlayerScores(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(k => { updated[k] = { ...updated[k], streak: 0 }; });
            return updated;
        });
        setPhase('ANSWERED');
    };

    const continueToNext = () => {
        if (questionNumber >= config.totalQuestions) {
            setPhase('FINALE');
        } else {
            setPhase('BETWEEN');
            setTimeout(() => nextQuestion(), 1500);
        }
    };

    const resetGame = () => {
        setPhase('SETUP');
        setParticipants([]);
        setPlayerScores({});
        setCurrentPuzzle(null);
        setUsedTopics([]);
        setQuestionNumber(0);
        setTimeLeft(0);
        setWinner(null);
        setAnsweredThisRound(false);
    };

    const getSortedPlayers = (): PlayerScore[] =>
        (Object.values(playerScores) as PlayerScore[]).sort((a, b) => b.score - a.score);

    const getDifficultyColor = (d: string) => {
        if (d === 'easy') return 'text-green-400 bg-green-500/10 border-green-500/20';
        if (d === 'medium') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        return 'text-red-400 bg-red-500/10 border-red-500/20';
    };

    return (
        <div className={`w-full h-full flex flex-col items-center bg-transparent text-right font-display select-none ${isOBS ? 'overflow-hidden' : ''}`} dir="rtl">
            <style>{`
            @keyframes emoji-bounce-in {
               0% { transform: scale(0) rotate(-30deg); opacity: 0; }
               50% { transform: scale(1.3) rotate(10deg); }
               70% { transform: scale(0.9) rotate(-5deg); }
               100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes sparkle {
               0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
               50% { opacity: 1; transform: scale(1) rotate(180deg); }
            }
            @keyframes correct-flash {
               0% { background-color: transparent; }
               50% { background-color: rgba(34, 197, 94, 0.2); }
               100% { background-color: transparent; }
            }
            @keyframes streak-fire {
               0%, 100% { text-shadow: 0 0 10px rgba(251,191,36,0.5); }
               50% { text-shadow: 0 0 30px rgba(251,191,36,1), 0 0 60px rgba(249,115,22,0.8); }
            }
            .emoji-enter { animation: emoji-bounce-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            .sparkle-anim { animation: sparkle 2s ease-in-out infinite; }
            .correct-flash { animation: correct-flash 0.5s ease-out 3; }
            .streak-fire { animation: streak-fire 1s ease-in-out infinite; }
         `}</style>

            {/* --- SETUP --- */}
            {phase === 'SETUP' && (
                <div className="w-full max-w-xl animate-in fade-in zoom-in duration-700 py-4 px-3 pb-16 overflow-y-auto custom-scrollbar h-full">
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={onHome} className="p-3 bg-red-600/10 rounded-2xl hover:bg-red-600/20 text-red-500 transition-all border border-red-500/20">
                            <LogOut size={20} />
                        </button>
                        <div className="text-center">
                            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">فك الشفرة</h1>
                            <p className="text-purple-600 font-black tracking-[0.4em] text-[10px] uppercase">EMOJI CODE • iABS</p>
                        </div>
                        <div className="w-14"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="glass-card p-4 rounded-[1.75rem] border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>
                            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4"><Settings size={16} className="text-purple-500" /> إعدادات اللعبة</h3>
                            <div className="space-y-3">
                                <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">التصنيف</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button key={cat} onClick={() => setConfig({ ...config, category: cat })} className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${config.category === cat ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-black/30 p-3 rounded-2xl border border-white/5 text-center space-y-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase">وقت الإجابة</label>
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => setConfig({ ...config, roundDuration: Math.max(5, config.roundDuration - 5) })} className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm">-</button>
                                            <span className="text-base font-black text-white font-mono">{config.roundDuration}s</span>
                                            <button onClick={() => setConfig({ ...config, roundDuration: config.roundDuration + 5 })} className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm">+</button>
                                        </div>
                                    </div>
                                    <div className="bg-black/30 p-3 rounded-2xl border border-white/5 text-center space-y-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase">عدد الأسئلة</label>
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => setConfig({ ...config, totalQuestions: Math.max(3, config.totalQuestions - 1) })} className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm">-</button>
                                            <span className="text-base font-black text-white font-mono">{config.totalQuestions}</span>
                                            <button onClick={() => setConfig({ ...config, totalQuestions: config.totalQuestions + 1 })} className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm">+</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">كلمة الانضمام</label>
                                    <input value={config.joinKeyword} onChange={e => setConfig({ ...config, joinKeyword: e.target.value })} className="w-full bg-black border-2 border-white/10 focus:border-purple-600 rounded-lg p-2 text-white font-bold text-sm text-center outline-none transition-all" />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-4 rounded-[1.75rem] border border-white/5 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20"></div>
                            <div className="relative z-10 text-center">
                                <div className="text-[70px] mb-3 animate-bounce">🤔</div>
                                <div className="flex gap-2 justify-center mb-4">
                                    {['🦁', '👑', '=', '?'].map((e, i) => (
                                        <span key={i} className="text-3xl" style={{ animationDelay: `${i * 0.2}s` }}>{e}</span>
                                    ))}
                                </div>
                                <h2 className="text-xl font-black text-white mb-2">كيف تلعب؟</h2>
                                <div className="space-y-2 text-gray-400 text-sm font-bold max-w-sm">
                                    <p className="flex items-center gap-2"><span className="w-7 h-7 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-xs">1</span> إيموجيات تظهر على الشاشة</p>
                                    <p className="flex items-center gap-2"><span className="w-7 h-7 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-xs">2</span> فك الشفرة واكتب الإجابة!</p>
                                    <p className="flex items-center gap-2"><span className="w-7 h-7 bg-pink-600 text-white rounded-xl flex items-center justify-center font-black text-xs">3</span> أسرع إجابة = نقاط أكثر!</p>
                                </div>
                            </div>
                            <button onClick={() => setPhase('LOBBY')} className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black py-3 px-10 rounded-2xl text-xl hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3 shadow-[0_15px_40px_rgba(147,51,234,0.4)] italic relative z-10 border-t border-white/20">
                                فك الشفرة <Smile size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- LOBBY --- */}
            {phase === 'LOBBY' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
                    <div className="text-center mb-6 z-10">
                        <div className="text-[60px] mb-3 animate-bounce">😎</div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter mb-4 uppercase">في انتظار المتنافسين</h1>
                        <div className="flex items-center justify-center gap-3 text-lg text-gray-400 font-bold bg-black/40 backdrop-blur-xl px-6 py-4 rounded-[2rem] border-2 border-white/5">
                            أرسل <span className="bg-purple-600 text-white px-4 py-1.5 rounded-xl font-black italic">{config.joinKeyword}</span> للمشاركة
                        </div>
                    </div>
                    <div className="flex-1 w-full max-w-lg overflow-y-auto custom-scrollbar px-4 mb-4">
                        <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                            {participants.map(p => (
                                <div key={p.id} className="animate-in zoom-in duration-300 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                    <div className="w-10 h-10">
                                        <ProAvatar
                                            url={p.avatar}
                                            username={p.username}
                                            size="w-10 h-10"
                                            className="overflow-visible"
                                        />
                                    </div>
                                    <span className="font-black text-white text-xs">{p.username}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="w-full max-w-lg bg-black/60 backdrop-blur-[40px] p-5 rounded-[2rem] border border-white/10 flex items-center justify-between z-20">
                        <div className="text-2xl font-black text-white font-mono italic">{participants.length}</div>
                        <div className="flex gap-3">
                            <button onClick={resetGame} className="px-5 py-3 rounded-xl bg-white/5 text-gray-500 font-black hover:text-white transition-all border border-white/10">تراجع</button>
                            <button onClick={startGame} disabled={participants.length < 1} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg rounded-xl hover:scale-105 transition-all disabled:opacity-20 italic flex items-center gap-2">
                                ابدأ! <Brain size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- QUESTION --- */}
            {phase === 'QUESTION' && currentPuzzle && (
                <div className="w-full h-full flex flex-col items-center justify-center p-5 animate-in fade-in duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-black to-pink-950/40"></div>

                    {/* Decorative sparkles */}
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="absolute sparkle-anim" style={{
                            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`, fontSize: '14px',
                        }}>✨</div>
                    ))}

                    <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
                        {/* Progress */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-purple-500 font-black text-sm uppercase tracking-[0.5em]">السؤال {questionNumber} / {config.totalQuestions}</span>
                            <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${getDifficultyColor(currentPuzzle.difficulty)}`}>
                                {currentPuzzle.difficulty === 'easy' ? 'سهل' : currentPuzzle.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                            </div>
                            <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-lg text-xs font-bold text-purple-400">
                                {currentPuzzle.category}
                            </div>
                        </div>

                        {/* Timer */}
                        <div className={`text-[60px] font-black font-mono mb-4 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {timeLeft}
                        </div>

                        {/* Emoji Display */}
                        <div className="bg-black/60 backdrop-blur-2xl border-4 border-purple-500/30 rounded-[2.5rem] p-8 mb-5 shadow-[0_0_60px_rgba(147,51,234,0.3)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                            <div className="relative z-10 flex items-center gap-4" style={{ transform: `scale(${emojiScale})`, transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                                {Array.from(currentPuzzle.emojis)
                                    .filter((c: string) => {
                                        const code = c.charCodeAt(0);
                                        // Filter out English letters and numbers that might creep in from AI
                                        return !(/[a-zA-Z0-9]/.test(c)) && c.trim();
                                    })
                                    .map((emoji, i) => (
                                        <span key={i} className={`text-[60px] ${showEmojis ? 'emoji-enter' : 'opacity-0'}`} style={{ animationDelay: `${i * 0.15}s` }}>
                                            {emoji}
                                        </span>
                                    ))}
                            </div>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-purple-400 font-bold uppercase tracking-widest">
                                = ؟
                            </div>
                        </div>

                        {/* Instruction */}
                        <p className="text-purple-400 font-bold text-base mb-5">اكتب الإجابة في الشات! 💬</p>

                        {/* Timer bar */}
                        <div className="w-full max-w-lg h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                            <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`} style={{ width: `${(timeLeft / config.roundDuration) * 100}%` }} />
                        </div>

                        {/* Mini leaderboard */}
                        <div className="flex gap-2 mt-4">
                            {getSortedPlayers().slice(0, 5).map((p, i) => (
                                <div key={p.user.username} className="bg-black/40 border border-white/10 rounded-xl px-2 py-1 flex items-center gap-1">
                                    <span className={`font-black text-xs ${i === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>#{i + 1}</span>
                                    <span className="text-xs font-bold text-gray-300">{p.user.username}</span>
                                    <span className="text-xs font-black text-purple-400 font-mono">{p.score}</span>
                                    {p.streak >= 2 && <span className="text-xs streak-fire">🔥{p.streak}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- ANSWERED --- */}
            {phase === 'ANSWERED' && currentPuzzle && (
                <div className={`w-full h-full flex flex-col items-center justify-center p-5 animate-in zoom-in duration-500 relative overflow-hidden ${winner ? 'correct-flash' : ''}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-black to-pink-950/40"></div>
                    <div className="relative z-10 text-center w-full max-w-xl">
                        {/* Emoji + answer */}
                        <div className="text-[60px] mb-3">{currentPuzzle.emojis}</div>
                        <div className="text-lg font-bold text-gray-500 mb-1">=</div>
                        <div className="text-3xl font-black text-white italic mb-5">{currentPuzzle.answers[0]}</div>

                        {winner ? (
                            <div className="bg-green-500/10 border-2 border-green-500/30 rounded-[2rem] p-5 mb-4 animate-in slide-in-from-bottom">
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <div className="w-20 h-20">
                                        <ProAvatar
                                            url={winner.user.avatar}
                                            username={winner.user.username}
                                            size="w-20 h-20"
                                            className="overflow-visible"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-xl font-black text-green-400">{winner.user.username}</div>
                                        <div className="text-green-600 font-bold text-sm">في {winner.time.toFixed(1)} ثانية ⚡</div>
                                    </div>
                                </div>
                                <div className="text-green-400 font-black text-sm uppercase tracking-widest">🎉 CORRECT!</div>
                            </div>
                        ) : (
                            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-[2rem] p-5 mb-4">
                                <div className="text-4xl mb-2">⏰</div>
                                <div className="text-red-400 font-black text-lg">انتهى الوقت!</div>
                                <div className="text-gray-500 font-bold mt-2">لم يجب أحد</div>
                            </div>
                        )}

                        <button onClick={continueToNext} className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xl rounded-[1.75rem] hover:scale-105 transition-all italic shadow-[0_0_30px_rgba(147,51,234,0.4)]">
                            {questionNumber >= config.totalQuestions ? 'النتائج النهائية' : 'السؤال التالي'} <ChevronRight size={20} className="inline" />
                        </button>
                    </div>
                </div>
            )}

            {/* --- LOADING --- */}
            {phase === 'LOADING' && (
                <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black"></div>
                    <div className="relative z-10 text-center">
                        <div className="text-[70px] mb-5 animate-bounce">🤖</div>
                        <h2 className="text-2xl font-black text-white italic mb-1">الذكاء الاصطناعي يفكر...</h2>
                        <p className="text-purple-500 font-bold">جاري إعداد لغز جديد لك!</p>
                        <div className="w-48 h-1.5 bg-white/10 rounded-full mt-5 overflow-hidden">
                            <div className="h-full bg-purple-600 animate-[progress_1s_infinite]"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- BETWEEN --- */}
            {phase === 'BETWEEN' && (
                <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black"></div>
                    <div className="relative z-10 text-center animate-pulse">
                        <div className="text-[70px] mb-3">🤔</div>
                        <div className="text-xl font-black text-purple-400 italic">السؤال التالي...</div>
                    </div>
                </div>
            )}

            {/* --- FINALE --- */}
            {phase === 'FINALE' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 animate-in zoom-in duration-1000 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-black to-yellow-950"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-600/20 via-transparent to-transparent"></div>

                    <div className="relative z-10 text-center w-full max-w-lg">
                        <Crown size={60} className="text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_40px_rgba(251,191,36,1)] animate-bounce" />
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 italic uppercase mb-5">النتائج النهائية!</h2>

                        <div className="bg-black/40 rounded-[1.75rem] border border-yellow-500/20 p-4 mb-5 shadow-2xl">
                            {getSortedPlayers().slice(0, 10).map((p, i) => (
                                <div key={p.user.username} className={`flex justify-between items-center py-3 border-b border-white/5 last:border-0 animate-in slide-in-from-right ${i === 0 ? 'bg-yellow-500/10 rounded-xl px-3 -mx-1' : ''}`} style={{ animationDelay: `${i * 150}ms` }}>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-lg font-black ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-700' : 'text-gray-600'}`}>#{i + 1}</span>
                                        <div className={`${i === 0 ? 'w-24 h-24' : 'w-12 h-12'}`}>
                                            <ProAvatar
                                                url={p.user.avatar}
                                                username={p.user.username}
                                                size={i === 0 ? 'w-24 h-24' : 'w-12 h-12'}
                                                className="overflow-visible"
                                            />
                                        </div>
                                        <div>
                                            <span className={`${i === 0 ? 'text-base' : 'text-lg'} font-black text-white`}>{p.user.username}</span>
                                            <span className="text-xs text-gray-500 block">{p.correctAnswers} إجابات صحيحة</span>
                                        </div>
                                    </div>
                                    <span className={`${i === 0 ? 'text-xl text-yellow-400' : 'text-base text-purple-400'} font-black font-mono`}>{p.score}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button onClick={resetGame} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg rounded-xl hover:scale-105 transition-all italic">لعبة جديدة</button>
                            <button onClick={onHome} className="px-5 py-3 bg-white/5 text-gray-500 font-black text-base rounded-xl border border-white/10 hover:text-white transition-all">الرئيسية</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
