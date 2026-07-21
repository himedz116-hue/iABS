import React, { useState, useEffect, useRef } from 'react';
import { supabase, leaderboardService } from '../services/supabase';
import { chatService } from '../services/chatService';
import { ArrowUp, ArrowDown, Timer, Users, Trophy, ChevronRight, CheckCircle2, XCircle, Home, MonitorOff, Maximize2 } from 'lucide-react';
import { ProAvatar } from './ProAvatar';
import { IabsLogo } from './IabsLogo';

interface HigherLowerGameProps {
    onHome: () => void;
    isOBS?: boolean;
}

interface Question {
    id: number;
    stage_number: number;
    question_text: string;
    is_higher: boolean;
    fact: string;
}

export const HigherLowerGame: React.FC<HigherLowerGameProps> = ({ onHome, isOBS = false }) => {
    const [gameState, setGameState] = useState<'stage_select' | 'playing' | 'results' | 'stage_complete'>('stage_select');
    const [stages, setStages] = useState<number[]>([]);
    const [selectedStage, setSelectedStage] = useState<number | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    
    // Game variables
    const [timeLeft, setTimeLeft] = useState(20);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [higherVotes, setHigherVotes] = useState<Set<string>>(new Set());
    const [lowerVotes, setLowerVotes] = useState<Set<string>>(new Set());
    const [voterData, setVoterData] = useState<{ [username: string]: { avatar: string, display: string } }>({});
    const [showAnswer, setShowAnswer] = useState(false);
    const [roundWinners, setRoundWinners] = useState<{ username: string, avatar: string, points: number }[]>([]);

    const totalVotes = higherVotes.size + lowerVotes.size;
    const higherPercentage = totalVotes === 0 ? 50 : Math.round((higherVotes.size / totalVotes) * 100);
    const lowerPercentage = totalVotes === 0 ? 50 : Math.round((lowerVotes.size / totalVotes) * 100);

    // Fetch stages on mount
    useEffect(() => {
        const fetchStages = async () => {
            const { data } = await supabase
                .from('higher_lower_questions')
                .select('stage_number')
                .order('stage_number', { ascending: true });
            
            if (data) {
                const uniqueStages = Array.from(new Set(data.map(d => d.stage_number)));
                setStages(uniqueStages.length > 0 ? uniqueStages : Array.from({length: 30}, (_, i) => i + 1));
            }
        };
        fetchStages();
    }, []);

    // Fetch questions when stage is selected
    const handleStageSelect = async (stage: number) => {
        setSelectedStage(stage);
        
        const { data, error } = await supabase
            .from('higher_lower_questions')
            .select('*')
            .eq('stage_number', stage)
            .order('id', { ascending: true });
            
        if (data && data.length > 0) {
            setQuestions(data);
            setCurrentQuestionIndex(0);
            resetRound();
            setGameState('playing');
        } else {
            alert('لا توجد أسئلة لهذه المرحلة حالياً.');
        }
    };

    const resetRound = () => {
        setTimeLeft(20);
        setHigherVotes(new Set());
        setLowerVotes(new Set());
        setShowAnswer(false);
        setIsTimerRunning(true);
        setRoundWinners([]);
    };

    // Timer logic
    useEffect(() => {
        if (gameState !== 'playing' || !isTimerRunning) return;
        
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            handleTimeUp();
        }
    }, [timeLeft, isTimerRunning, gameState]);

    // Chat listener
    useEffect(() => {
        if (gameState !== 'playing' || !isTimerRunning) return;

        const unsubscribe = chatService.onMessage((msg) => {
            const content = msg.content.trim();
            const username = msg.user.username.toLowerCase();
            
            // Check if user already voted
            if (higherVotes.has(username) || lowerVotes.has(username)) return;

            const isHigher = content === 'اعلى' || content === 'أعلى';
            const isLower = content === 'اقل' || content === 'أقل';

            if (isHigher || isLower) {
                // Update voter data
                setVoterData(prev => ({
                    ...prev,
                    [username]: {
                        avatar: msg.user.avatar || '',
                        display: msg.user.username
                    }
                }));

                if (isHigher) {
                    setHigherVotes(prev => new Set(prev).add(username));
                } else {
                    setLowerVotes(prev => new Set(prev).add(username));
                }
            }
        });

        return () => unsubscribe();
    }, [gameState, isTimerRunning, higherVotes, lowerVotes]);

    const handleTimeUp = async () => {
        setIsTimerRunning(false);
        setShowAnswer(true);

        const currentQ = questions[currentQuestionIndex];
        const correctVoters = currentQ.is_higher ? higherVotes : lowerVotes;
        
        const winners = Array.from(correctVoters).map(username => ({
            username,
            avatar: voterData[username]?.avatar || '',
            display: voterData[username]?.display || username,
            points: 20 // Points per correct answer
        }));

        setRoundWinners(winners);

        // Award points in DB
        for (const winner of winners) {
            await leaderboardService.recordWin(winner.username, winner.avatar, winner.points);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex(prev => prev + 1);
            resetRound();
        } else {
            setGameState('stage_complete');
        }
    };

    // Render Stage Select
    if (gameState === 'stage_select') {
        return (
            <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col font-sans overflow-hidden" dir="rtl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                
                {/* Compact Header */}
                <div className="relative z-10 flex items-center justify-between px-6 py-3 bg-gradient-to-l from-purple-950/40 via-black/80 to-black/80 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onHome} className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-xl border border-white/10 hover:border-red-500/30 transition-all text-white active:scale-90">
                            <Home size={18} />
                        </button>
                        <div className="h-6 w-px bg-white/10" />
                        <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 italic tracking-tighter">
                            أعلى أم أقل 📈📉
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-white/40 text-xs font-bold">30 مرحلة × 20 سؤال</span>
                        <IabsLogo size="sm" />
                    </div>
                </div>

                {/* Main Grid Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 z-10 flex items-center justify-start">
                    <div className="w-full max-w-4xl grid grid-cols-3 md:grid-cols-6 gap-3 mr-auto ml-8">
                        {stages.map(stage => (
                            <button
                                key={stage}
                                onClick={() => handleStageSelect(stage)}
                                className="relative group overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-2 py-8"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Trophy className="text-purple-400 w-9 h-9 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-black text-sm italic drop-shadow-md">مرحلة {stage}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'stage_complete') {
        return (
            <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-6 font-sans overflow-hidden" dir="rtl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-black to-blue-900/40" />
                <Trophy size={100} className="text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-bounce" />
                <h1 className="text-5xl font-black text-white italic tracking-tighter mb-4">اكتملت المرحلة {selectedStage}! 🎉</h1>
                <p className="text-xl text-gray-300 font-bold mb-10">أحسنت! جميع أسئلة هذه المرحلة انتهت.</p>
                <button 
                    onClick={() => setGameState('stage_select')}
                    className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white font-black text-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(147,51,234,0.5)]"
                >
                    العودة للمراحل
                </button>
            </div>
        );
    }

    const currentQ = questions[currentQuestionIndex];

    return (
        <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center font-sans overflow-hidden" dir="rtl">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
            
            {/* Dynamic background based on dominant vote */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-red-600/10 to-transparent transition-opacity duration-1000"
                style={{ opacity: lowerPercentage > 50 ? 1 : 0.2 }}
            />
            <div 
                className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-green-600/10 to-transparent transition-opacity duration-1000"
                style={{ opacity: higherPercentage > 50 ? 1 : 0.2 }}
            />

            {!isOBS && (
                <div className="absolute top-6 right-6 z-50 flex gap-4">
                    <button onClick={onHome} className="p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-2xl text-white transition-all backdrop-blur-md">
                        <XCircle size={24} />
                    </button>
                </div>
            )}

            <div className="w-full max-w-7xl px-4 flex flex-col items-center relative z-10">
                {/* Header Info */}
                <div className="flex items-center gap-6 mb-8 text-white/70 font-black tracking-widest text-sm uppercase">
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                        <Trophy size={16} className="text-purple-400" />
                        مرحلة {selectedStage}
                    </div>
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        سؤال {currentQuestionIndex + 1} / {questions.length}
                    </div>
                </div>

                {/* Question Box */}
                <div className="w-full max-w-4xl glass-card bg-black/40 backdrop-blur-xl border-t border-white/20 rounded-[3rem] p-10 md:p-14 mb-12 text-center relative shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
                    {/* Timer */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-gray-800 to-black rounded-full border-4 border-gray-700 flex items-center justify-center shadow-2xl">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500 rounded-full" 
                            style={{ 
                                clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)',
                                transform: `rotate(${(20 - timeLeft) * 18}deg)`,
                                transition: 'transform 1s linear'
                            }} 
                        />
                        <span className="text-3xl font-black text-white relative z-10 font-mono">{timeLeft}</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight italic tracking-tight drop-shadow-md">
                        {currentQ?.question_text}
                    </h2>
                </div>

                {/* Voting Visualizer */}
                <div className="w-full flex justify-between items-end h-[300px] md:h-[400px] relative">
                    {/* VS Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-24 h-24 bg-black rounded-full border border-white/10 flex items-center justify-center drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        <span className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-gray-400 to-white">VS</span>
                    </div>

                    {/* Lower Bar (Red) */}
                    <div className="w-5/12 h-full flex flex-col items-center justify-end relative">
                        <div className="w-full rounded-t-3xl bg-gradient-to-t from-red-900/50 to-red-600/80 border-t-2 border-x-2 border-red-500/50 backdrop-blur-md transition-all duration-1000 ease-out shadow-[0_0_30px_rgba(220,38,38,0.3)] flex flex-col items-center justify-start overflow-hidden relative group"
                             style={{ height: `${Math.max(10, lowerPercentage)}%` }}>
                             
                             {/* Floating avatars for Lower voters */}
                             <div className="absolute inset-0 overflow-hidden opacity-50 flex flex-wrap gap-2 p-2 content-start">
                                 {Array.from(lowerVotes).map(username => (
                                     <ProAvatar key={username} url={voterData[username]?.avatar} username={username} size="w-8 h-8" />
                                 ))}
                             </div>

                             <div className="absolute top-4 font-black text-4xl text-white drop-shadow-lg">{lowerPercentage}%</div>
                        </div>
                        <div className="mt-4 flex flex-col items-center">
                            <ArrowDown size={48} className="text-red-500 animate-bounce drop-shadow-[0_0_15px_rgba(220,38,38,0.6)]" />
                            <span className="text-3xl font-black text-red-500 italic drop-shadow-md tracking-tighter">أقل</span>
                            <span className="text-white/50 font-bold">{lowerVotes.size} أصوات</span>
                        </div>
                    </div>

                    {/* Higher Bar (Green) */}
                    <div className="w-5/12 h-full flex flex-col items-center justify-end relative">
                        <div className="w-full rounded-t-3xl bg-gradient-to-t from-green-900/50 to-green-500/80 border-t-2 border-x-2 border-green-400/50 backdrop-blur-md transition-all duration-1000 ease-out shadow-[0_0_30px_rgba(74,222,128,0.3)] flex flex-col items-center justify-start overflow-hidden relative group"
                             style={{ height: `${Math.max(10, higherPercentage)}%` }}>
                             
                             {/* Floating avatars for Higher voters */}
                             <div className="absolute inset-0 overflow-hidden opacity-50 flex flex-wrap gap-2 p-2 content-start">
                                 {Array.from(higherVotes).map(username => (
                                     <ProAvatar key={username} url={voterData[username]?.avatar} username={username} size="w-8 h-8" />
                                 ))}
                             </div>

                             <div className="absolute top-4 font-black text-4xl text-white drop-shadow-lg">{higherPercentage}%</div>
                        </div>
                        <div className="mt-4 flex flex-col items-center">
                            <ArrowUp size={48} className="text-green-400 animate-bounce drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]" />
                            <span className="text-3xl font-black text-green-400 italic drop-shadow-md tracking-tighter">أعلى</span>
                            <span className="text-white/50 font-bold">{higherVotes.size} أصوات</span>
                        </div>
                    </div>
                </div>

                {/* Answer Overlay */}
                {showAnswer && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl animate-in zoom-in duration-500">
                        <div className="text-center">
                            <h2 className="text-4xl text-gray-300 font-bold mb-4">الإجابة الصحيحة هي:</h2>
                            <div className={`text-8xl font-black italic tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] mb-8 ${currentQ?.is_higher ? 'text-green-400' : 'text-red-500'}`}>
                                {currentQ?.is_higher ? 'أعلى 📈' : 'أقل 📉'}
                            </div>
                            {currentQ?.fact && (
                                <div className="bg-white/10 border border-white/20 p-6 rounded-3xl max-w-2xl mx-auto mb-12">
                                    <p className="text-xl text-white font-bold">{currentQ.fact}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-4 text-white font-bold text-lg mb-8">
                                <Users className="text-blue-400" />
                                الفائزون في هذه الجولة: <span className="text-yellow-400 text-2xl mx-2">{roundWinners.length}</span> شخص (+20 نقطة)
                            </div>

                            {!isOBS && (
                                <button 
                                    onClick={handleNextQuestion}
                                    className="px-12 py-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl border border-blue-400/50 text-white font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(59,130,246,0.6)] flex items-center justify-center gap-4 mx-auto"
                                >
                                    السؤال التالي <ChevronRight />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Control panel for streamer when time is not up yet but they want to skip? (Optional) */}
            {!isOBS && !showAnswer && (
                <div className="absolute bottom-6 left-6 flex gap-4 z-50">
                     <button onClick={handleTimeUp} className="px-6 py-3 bg-red-600/80 hover:bg-red-500 rounded-xl text-white font-bold transition-all backdrop-blur-md">
                         إظهار الإجابة فوراً
                     </button>
                </div>
            )}
        </div>
    );
};
