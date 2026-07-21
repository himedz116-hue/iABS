import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../../services/chatService';
import { supabase } from '../../services/supabase';
import { FortuneWheelModal } from './FortuneWheelModal';
import { ProAvatar } from '../ProAvatar';
import { Home, Users, MessageCircle, Play, Trophy, Check, X, Shield, FastForward, Eye, Star, Crown, Zap, ArrowLeft, Sparkles, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

// ==========================================
// TYPES
// ==========================================
type GameMode = 'chat' | 'friends';
type Stage = 'mode_select' | 'setup' | 'playing' | 'question';

export interface MahmahCategory {
  id: string;
  name: string;
  image_url: string;
  gradient?: string;
  questions: MahmahQuestion[];
}

export interface MahmahQuestion {
  id: string;
  category_id?: string;
  points: number;
  text: string;
  answer: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  answer_media_url?: string;
  answer_media_type?: 'image' | 'video' | 'audio';
}

interface Team {
  id: string;
  name: string;
  score: number;
  color: string;
  bgColor: string;
}

interface ChatPlayer {
  username: string;
  avatar: string;
  color: string;
  score: number;
  correctAnswers: number;
}

interface MahmahGameProps {
  onBack: () => void;
}

// ==========================================
// HELPERS
// ==========================================
const normalizeArabic = (text: string): string => {
  return text.toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ؤئ]/g, 'ء')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export const MahmahGame: React.FC<MahmahGameProps> = ({ onBack }) => {
  // ---- Global State ----
  const [stage, setStage] = useState<Stage>('mode_select');
  const [mode, setMode] = useState<GameMode>('chat');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeCategories, setActiveCategories] = useState<MahmahCategory[]>([]);
  const [dbCategories, setDbCategories] = useState<MahmahCategory[]>([]);

  useEffect(() => {
    const fetchMahmahData = async () => {
      const { data: cData } = await supabase.from('mahmah_categories').select('*').order('created_at', { ascending: false });
      const { data: qData } = await supabase.from('mahmah_questions').select('*');
      
      if (cData && qData) {
        const fullCats: MahmahCategory[] = cData.map(c => {
          const catQs = qData.filter(q => q.category_id === c.id);
          const gradients = ['from-green-500 to-emerald-700', 'from-blue-500 to-indigo-700', 'from-red-500 to-rose-700', 'from-yellow-500 to-orange-700', 'from-purple-500 to-fuchsia-700', 'from-cyan-500 to-blue-700'];
          return {
            ...c,
            gradient: gradients[Math.floor(Math.random() * gradients.length)],
            questions: catQs
          };
        });
        setDbCategories(fullCats);
      }
    };
    fetchMahmahData();
  }, []);
  
  // ---- Board State ----
  const [answeredQs, setAnsweredQs] = useState<Set<string>>(new Set());
  const [currentQ, setCurrentQ] = useState<MahmahQuestion | null>(null);
  
  // ---- Game State (Shared) ----
  const [timer, setTimer] = useState(30);
  const [showAnswer, setShowAnswer] = useState(false);
  const timerRef = useRef<any>(null);

  // ---- Chat Mode State ----
  const [streamerScore, setStreamerScore] = useState(0);
  const [chatScore, setChatScore] = useState(0);
  const [chatPlayers, setChatPlayers] = useState<Record<string, ChatPlayer>>({});
  const [chatWinner, setChatWinner] = useState<{ username: string; avatar: string; color: string; isStreamer?: boolean } | null>(null);
  const [chatAnswers, setChatAnswers] = useState<{ username: string; text: string; correct: boolean }[]>([]);
  
  const chatWinnerRef = useRef(chatWinner);
  const showAnswerRef = useRef(showAnswer);
  const currentQRef = useRef(currentQ);

  // ---- Friends Mode State ----
  const [teams, setTeams] = useState<Team[]>([
    { id: 't1', name: 'الفريق الأزرق', score: 0, color: 'text-blue-400', bgColor: 'bg-blue-600' },
    { id: 't2', name: 'الفريق الأحمر', score: 0, color: 'text-red-400', bgColor: 'bg-red-600' }
  ]);
  const [team1Name, setTeam1Name] = useState('الفريق الأزرق');
  const [team2Name, setTeam2Name] = useState('الفريق الأحمر');
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  
  // ---- Helpers State ----
  const [fMultiplier, setFMultiplier] = useState(1);
  const [fBlocked, setFBlocked] = useState(false);
  const [fStolen, setFStolen] = useState(false);
  const [showWheel, setShowWheel] = useState(false);

  // ---- Sync refs ----
  useEffect(() => { chatWinnerRef.current = chatWinner; }, [chatWinner]);
  useEffect(() => { showAnswerRef.current = showAnswer; }, [showAnswer]);
  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);

  // ==========================================
  // START GAME
  // ==========================================
  const startGame = () => {
    const cats = dbCategories.filter(c => selectedCategories.includes(c.id)).slice(0, 6);
    setActiveCategories(cats);
    setAnsweredQs(new Set());
    setCurrentQ(null);

    if (mode === 'chat') {
      setStreamerScore(0);
      setChatScore(0);
      setChatPlayers({});
      setChatAnswers([]);
      setChatWinner(null);
    } else {
      setTeams([
        { id: 't1', name: team1Name || 'الفريق 1', score: 0, color: 'text-blue-400', bgColor: 'bg-blue-600' },
        { id: 't2', name: team2Name || 'الفريق 2', score: 0, color: 'text-red-400', bgColor: 'bg-red-600' }
      ]);
      setActiveTeamIdx(0);
    }
    
    setStage('playing');
  };

  // ==========================================
  // QUESTION SELECTION & TIMER
  // ==========================================
  const selectQuestion = (q: MahmahQuestion) => {
    setCurrentQ(q);
    setShowAnswer(false);
    setTimer(30);
    
    if (mode === 'chat') {
      setChatWinner(null);
      setChatAnswers([]);
    } else {
      setFMultiplier(1);
      setFBlocked(false);
      setFStolen(false);
    }
    
    setStage('question');
  };

  // Timer Logic
  useEffect(() => {
    if (stage !== 'question' || showAnswer || chatWinner) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (mode === 'chat') {
            setShowAnswer(true);
            // Auto close after 4 seconds if time runs out
            setTimeout(() => {
              closeQuestion();
            }, 4000);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, showAnswer, chatWinner, mode]);

  // ==========================================
  // CHAT LISTENER
  // ==========================================
  useEffect(() => {
    if (stage !== 'question' || mode !== 'chat') return;
    
    const unsubscribe = chatService.onMessage((msg) => {
      if (chatWinnerRef.current || showAnswerRef.current) return;
      const q = currentQRef.current;
      if (!q) return;

      const rawContent = msg.content.replace(/\[emote:\d+:[^\]]*\]/gi, '').replace(/<[^>]*>/g, '').trim();
      const userAnswer = normalizeArabic(rawContent);
      const correctAnswer = normalizeArabic(q.answer);

      const isCorrect = userAnswer === correctAnswer || correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer);
      
      if (userAnswer.length >= 2) {
        setChatAnswers(prev => [...prev.slice(-15), { username: msg.user.username, text: msg.content, correct: isCorrect }]);
      }

      if (isCorrect) {
        const winner = { username: msg.user.username, avatar: msg.user.avatar || '', color: msg.user.color || '#fff' };
        setChatWinner(winner);
        setChatScore(prev => prev + q.points);
        
        // Confetti!
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        
        setChatPlayers(prev => {
          const existing = prev[msg.user.username] || { username: msg.user.username, avatar: msg.user.avatar || '', color: msg.user.color || '#fff', score: 0, correctAnswers: 0 };
          return {
            ...prev,
            [msg.user.username]: {
              ...existing,
              score: existing.score + q.points,
              correctAnswers: existing.correctAnswers + 1
            }
          };
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          closeQuestion();
        }, 5000);
      }
    });

    return () => unsubscribe();
  }, [stage, mode]);

  // ==========================================
  // QUESTION ACTIONS
  // ==========================================
  const closeQuestion = () => {
    if (currentQ) {
      setAnsweredQs(prev => new Set(prev).add(currentQ.id));
    }
    setCurrentQ(null);
    setStage('playing');
    
    if (mode === 'friends') {
      setActiveTeamIdx(prev => (prev + 1) % teams.length);
    }
  };

  const streamerCorrect = () => {
    if (!currentQ) return;
    setStreamerScore(prev => prev + currentQ.points);
    setChatWinner({ username: 'الاستريمر', avatar: '', color: '#EAB308', isStreamer: true });
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => {
      closeQuestion();
    }, 4000);
  };

  const friendsCorrect = () => {
    if (!currentQ) return;
    const pts = currentQ.points * fMultiplier;
    setTeams(prev => prev.map((t, i) => i === activeTeamIdx ? { ...t, score: t.score + pts } : t));
    closeQuestion();
  };

  const friendsWrong = () => {
    if (!currentQ) return;
    const pts = Math.floor(currentQ.points * fMultiplier * 0.5);
    setTeams(prev => prev.map((t, i) => {
      if (fStolen && i !== activeTeamIdx) return { ...t, score: t.score + currentQ.points };
      if (i === activeTeamIdx) return { ...t, score: Math.max(0, t.score - pts) };
      return t;
    }));
    closeQuestion();
  };

  const handleWheelResult = (action: string) => {
    setShowWheel(false);
    setTeams(prev => prev.map((t, i) => {
      if (i === activeTeamIdx) {
        if (action === 'add_100') return { ...t, score: t.score + 100 };
        if (action === 'sub_100') return { ...t, score: Math.max(0, t.score - 100) };
        if (action === 'add_200') return { ...t, score: t.score + 200 };
        if (action === 'sub_200') return { ...t, score: Math.max(0, t.score - 200) };
        if (action === 'steal_100') return { ...t, score: t.score + 100 };
      } else if (action === 'steal_100') return { ...t, score: Math.max(0, t.score - 100) };
      return t;
    }));
    if (action === 'lose_turn' || action === 'cancel_question') {
      closeQuestion();
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id);
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  };

  // ==========================================
  // RENDER: MODE SELECT
  // ==========================================
  const renderModeSelect = () => (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white/20 rounded-full" style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            animation: `floatParticle ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`
          }} />
        ))}
      </div>

      <div className="relative z-10 text-center mb-12" style={{ animation: 'slideUp 0.8s ease-out' }}>
        <div className="relative inline-block">
          <div className="absolute -inset-8 bg-red-500/20 blur-[60px] rounded-full animate-pulse" />
          <h1 className="relative text-7xl md:text-8xl font-black italic text-white tracking-tighter" style={{ textShadow: '0 0 60px rgba(255,0,0,0.6), 0 4px 20px rgba(0,0,0,0.8)' }}>محمح</h1>
        </div>
        <p className="text-white/50 font-bold text-lg mt-4 tracking-widest uppercase">لعبة المعلومات والتحديات</p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full px-4" style={{ animation: 'slideUp 1s ease-out' }}>
        <button onClick={() => { setMode('chat'); setSelectedCategories(dbCategories.slice(0, 6).map(c => c.id)); setStage('setup'); }}
          className="group relative p-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:border-red-500/40 hover:shadow-[0_0_60px_rgba(255,0,0,0.15)] active:scale-95">
          <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.3)] group-hover:scale-110 transition-transform duration-500"><MessageCircle size={36} className="text-white" /></div>
            <h3 className="text-2xl font-black italic text-white tracking-tight">🎙️ لعب مع الشات</h3>
            <p className="text-white/40 text-sm leading-relaxed">العب بلوحة الأسئلة الفخمة<br/>والشات يجاوب على الشاشة مباشرة!</p>
          </div>
        </button>

        <button onClick={() => { setMode('friends'); setSelectedCategories(dbCategories.slice(0, 6).map(c => c.id)); setStage('setup'); }}
          className="group relative p-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:border-blue-500/40 hover:shadow-[0_0_60px_rgba(59,130,246,0.15)] active:scale-95">
          <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform duration-500"><Users size={36} className="text-white" /></div>
            <h3 className="text-2xl font-black italic text-white tracking-tight">👥 لعب مع الأصدقاء</h3>
            <p className="text-white/40 text-sm leading-relaxed">مسابقة جماعية حماسية!<br/>فرق تتنافس على لوحة الأسئلة</p>
          </div>
        </button>
      </div>
      <button onClick={onBack} className="relative z-10 mt-10 flex items-center gap-2 text-white/30 hover:text-white/70 font-bold transition-colors" style={{ animation: 'slideUp 1.2s ease-out' }}>
        <ArrowLeft size={18} /> العودة للرئيسية
      </button>
    </div>
  );

  // ==========================================
  // RENDER: SETUP
  // ==========================================
  const renderSetup = () => (
    <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center p-4 pt-8" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <button onClick={() => setStage('mode_select')} className="self-start mb-6 flex items-center gap-2 text-white/40 hover:text-white font-bold transition-colors">
        <ArrowLeft size={18} /> رجوع
      </button>
      
      <h2 className="text-4xl font-black italic text-white tracking-tighter mb-2" style={{ textShadow: '0 0 30px rgba(255,0,0,0.3)' }}>
        {mode === 'chat' ? '🎙️ إعداد لعبة الشات' : '👥 إعداد لعبة الأصدقاء'}
      </h2>
      <p className="text-white/40 font-bold mb-8">اختر الفئات (الحد الأقصى 6)</p>

      {mode === 'friends' && (
        <div className="w-full max-w-2xl grid grid-cols-2 gap-4 mb-8" style={{ animation: 'slideUp 0.6s ease-out' }}>
          <div>
            <label className="block text-blue-400 font-bold mb-2 text-sm">🔵 الفريق الأول</label>
            <input type="text" value={team1Name} onChange={e => setTeam1Name(e.target.value)} className="w-full bg-blue-950/30 border-2 border-blue-500/30 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-red-400 font-bold mb-2 text-sm">🔴 الفريق الثاني</label>
            <input type="text" value={team2Name} onChange={e => setTeam2Name(e.target.value)} className="w-full bg-red-950/30 border-2 border-red-500/30 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-red-400" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mx-auto">
        {dbCategories.map((cat, i) => {
          const isSelected = selectedCategories.includes(cat.id);
          return (
            <button key={cat.id} onClick={() => toggleCategory(cat.id)}
              className={`relative p-6 rounded-3xl border-2 transition-all overflow-hidden group flex flex-col items-center gap-3 ${isSelected ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
              {isSelected && <div className="absolute top-2 right-2 text-yellow-500"><Check size={20} /></div>}
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-inner flex items-center justify-center">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                ) : (
                  <span className="text-2xl font-bold text-white/30">?</span>
                )}
              </div>
              <div className="font-black text-white text-lg">{cat.name}</div>
              <div className="text-xs text-white/50 font-bold">{cat.questions?.length || 0} أسئلة متاحة</div>
              <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${cat.gradient || 'from-zinc-500 to-zinc-700'} ${isSelected ? 'opacity-100' : 'opacity-30'} transition-opacity`} />
            </button>
          );
        })}
        {dbCategories.length === 0 && (
          <div className="col-span-full py-20 text-center text-zinc-500 font-bold italic">جاري تحميل الفئات من الإدارة...</div>
        )}
      </div>

      <div className="flex items-center gap-2 text-yellow-500 font-black text-lg mb-6"><Star size={20} /> {selectedCategories.length} / 6</div>

      <button onClick={startGame} disabled={selectedCategories.length === 0}
        className="bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-xl italic px-12 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,0,0,0.3)] flex items-center gap-3">
        <Play size={24} /> ابدأ اللعبة!
      </button>
    </div>
  );

  // ==========================================
  // RENDER: BOARD (Unified)
  // ==========================================
  const renderBoard = () => (
    <div className="flex-1 w-full max-w-[98%] mx-auto flex gap-4 pt-3 pb-6" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Board Area */}
      <div className="flex-[3] flex flex-col">
        {/* Top Header / Mode Indicator */}
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white/30 hover:text-white/70 transition-colors"><Home size={20} /></button>
            <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">محمح</h1>
          </div>
          <div className="bg-white/10 px-4 py-1.5 rounded-full text-white/70 font-bold text-sm flex items-center gap-2">
            {mode === 'chat' ? <><MessageCircle size={14} /> طور الشات</> : <><Users size={14} /> طور الأصدقاء</>}
          </div>
        </div>

        {/* Jeopardy Grid */}
        <div className="flex-1 grid gap-3" style={{ gridTemplateColumns: `repeat(${activeCategories.length}, 1fr)` }}>
          {activeCategories.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-2 h-full">
              {/* Category Header */}
              <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-lg h-24 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${cat.gradient || 'from-zinc-500 to-zinc-700'}`} />
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1 shadow-inner overflow-hidden">
                  {cat.image_url ? <img src={cat.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white/50">?</span>}
                </div>
                <h3 className="text-white font-black text-xs leading-tight">{cat.name}</h3>
              </div>
              
              {/* Question Boxes */}
              <div className="flex flex-col gap-2 flex-1">
                {[...cat.questions].sort((a,b) => a.points - b.points).map((q, idx) => {
                  const done = answeredQs.has(q.id);
                  return (
                    <button key={q.id} onClick={() => !done && selectQuestion(q)} disabled={done}
                      className={`flex-1 min-h-[60px] rounded-xl flex flex-col items-center justify-center font-black transition-all duration-300 relative overflow-hidden
                        ${done ? 'bg-black/40 text-white/10 border border-white/5 cursor-not-allowed opacity-50' 
                               : 'bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-yellow-400 border border-white/10 hover:border-yellow-500/50 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] cursor-pointer group'}
                      `}>
                      {!done && <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
                      <span className="text-2xl md:text-3xl italic tracking-tighter relative z-10">{done ? '✓' : q.points}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side Panel (Scoreboards) */}
      <div className="flex-[1] flex flex-col bg-white/5 border border-white/10 rounded-3xl p-4 mt-12 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        {mode === 'friends' ? (
          <>
            <div className="text-center font-black text-white/50 text-sm mb-6 uppercase tracking-widest flex items-center justify-center gap-2"><Trophy size={16} /> لوحة الفرق</div>
            <div className="flex flex-col gap-4">
              {teams.map((team, i) => (
                <div key={team.id} className={`flex flex-col p-4 rounded-2xl transition-all duration-500 border-2 ${
                  activeTeamIdx === i ? `border-white shadow-[0_0_30px_rgba(255,255,255,0.1)] bg-gradient-to-br from-white/10 to-transparent scale-105` : 'border-white/5 bg-black/20 opacity-60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold text-sm truncate">{team.name}</span>
                    {activeTeamIdx === i && <span className="text-xs font-black bg-white text-black px-2 py-0.5 rounded-full animate-pulse">يلعب الآن</span>}
                  </div>
                  <div className={`text-4xl font-black italic tracking-tighter ${team.color}`}>{team.score}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="text-center font-black text-white/50 text-sm mb-6 uppercase tracking-widest flex items-center justify-center gap-2"><Crown size={16} className="text-yellow-500" /> التحدي الأكبر</div>
            <div className="flex flex-col gap-4">
              {/* Streamer Score */}
              <div className="flex flex-col p-4 rounded-2xl transition-all duration-500 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent scale-105 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-500 font-bold text-lg truncate flex items-center gap-2">😎 الاستريمر</span>
                </div>
                <div className="text-5xl font-black italic tracking-tighter text-yellow-400">{streamerScore}</div>
              </div>

              <div className="flex items-center justify-center -my-2 z-10">
                <div className="bg-black text-white/50 font-black text-sm px-3 py-1 rounded-full border border-white/10">VS</div>
              </div>

              {/* Chat Score */}
              <div className="flex flex-col p-4 rounded-2xl transition-all duration-500 border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400 font-bold text-lg truncate flex items-center gap-2">💬 الشات</span>
                </div>
                <div className="text-5xl font-black italic tracking-tighter text-blue-400">{chatScore}</div>
              </div>
            </div>
            
            <div className="flex-1 mt-6 overflow-y-auto">
               {(Object.values(chatPlayers) as ChatPlayer[])
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map((p, i) => (
                  <div key={p.username} className={`flex items-center gap-3 p-2 rounded-xl mb-2 ${
                    i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5'
                  }`}>
                    <ProAvatar url={p.avatar} username={p.username} size="w-8 h-8" className="overflow-visible shrink-0" />
                    <div className="text-white font-bold text-xs flex-1 truncate">{p.username}</div>
                    <div className="text-yellow-500 font-black text-xs px-2">{p.score}</div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

    </div>
  );

  // ==========================================
  // RENDER: QUESTION MODAL (Unified)
  // ==========================================
  const renderQuestionModal = () => {
    if (!currentQ) return null;
    const timerPercent = (timer / 30) * 100;
    const activeTeam = teams[activeTeamIdx];

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black pr-[380px]" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        
        {/* Background Ambient Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 blur-[200px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[200px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 blur-[300px] rounded-full" />
        </div>

        {/* Header */}
        <div className="relative z-50 flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/20 backdrop-blur-xl">
          <button onClick={closeQuestion} className="w-12 h-12 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg border border-white/10">
            <X size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 font-black text-xl px-6 py-2 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.2)] backdrop-blur-md">
              {currentQ.points} نقطة
            </div>
            {/* Timer */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-yellow-500/10 blur-[20px] rounded-full animate-pulse" />
              <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={timer <= 10 ? '#EF4444' : '#EAB308'} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${timerPercent * 2.83} 283`} style={{ transition: 'stroke-dasharray 1s linear', filter: 'drop-shadow(0 0 10px rgba(234,179,8,0.5))' }} />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-2xl font-black z-10 ${timer <= 10 ? 'text-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]'}`}>{timer}</span>
            </div>
          </div>
        </div>

        {/* Friends Helpers */}
        {mode === 'friends' && (
          <div className="absolute top-24 right-8 flex gap-2 z-20" style={{ right: 'auto', left: '80px' }}>
            <button onClick={() => setFMultiplier(2)} disabled={showAnswer || fMultiplier === 2}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs transition-all ${fMultiplier === 2 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}>
              <FastForward size={14} /> دبل x2
            </button>
            <button onClick={() => setFBlocked(true)} disabled={showAnswer || fBlocked}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs transition-all ${fBlocked ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}>
              <Shield size={14} /> منع
            </button>
            <button onClick={() => setFStolen(true)} disabled={showAnswer || fStolen || fBlocked}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs transition-all ${fStolen ? 'bg-purple-500 text-white' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}>
              <Volume2 size={14} /> سرقة
            </button>
            <button onClick={() => setShowWheel(true)} disabled={showAnswer}
              className="flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:scale-105 transition-all shadow-lg">
              <Star size={14} /> العجلة
            </button>
          </div>
        )}

        {/* Team Info for Friends Mode */}
        {mode === 'friends' && (
          <div className="relative z-10 px-8 pt-4">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg ${activeTeam.color}`}>
              {fStolen ? <span className="text-purple-400 animate-pulse font-black">🔊 سؤال مسروق!</span> : <span className="font-black text-white">دور: {activeTeam.name}</span>}
            </div>
          </div>
        )}

        {/* Main Content - Full Screen Layout */}
        <div className="flex-1 flex gap-8 p-8 relative z-10">
          
          {/* Left Side: Answer Display */}
          <div className="flex-1 flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
            {mode === 'chat' ? (
              chatWinner ? (
                <div className="flex flex-col items-center gap-4 w-full" style={{ animation: 'zoomBounce 0.5s ease-out' }}>
                  <div className="text-green-400 font-black text-2xl mb-2">🎉 الفائز!</div>
                  <div className="flex items-center gap-4">
                    <ProAvatar url={chatWinner.avatar} username={chatWinner.username} size="w-20 h-20" className="overflow-visible shadow-[0_0_40px_rgba(34,197,94,0.8)]" />
                    <div className="text-white font-black text-4xl">{chatWinner.username}</div>
                  </div>
                  <div className="text-green-400 font-black text-3xl bg-green-500/20 px-8 py-3 rounded-2xl border border-green-500/40">+{currentQ.points}</div>
                </div>
              ) : showAnswer ? (
                <div className="flex flex-col items-center gap-4 w-full" style={{ animation: 'slideUp 0.4s ease-out' }}>
                  <div className="text-red-400 font-black text-xl flex items-center gap-2">
                    <X size={24} /> انتهى الوقت!
                  </div>
                  {currentQ.answer_media_url && (
                    <div className="relative w-full flex justify-center">
                      <div className="absolute -inset-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl rounded-3xl opacity-80" />
                      {currentQ.answer_media_type === 'image' && (
                        <img src={currentQ.answer_media_url} alt="" className="relative z-10 max-h-[250px] rounded-2xl border-2 border-green-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.5)] object-contain" />
                      )}
                      {currentQ.answer_media_type === 'video' && (
                        <video src={currentQ.answer_media_url} controls className="relative z-10 max-h-[250px] rounded-2xl border-2 border-green-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.5)]" />
                      )}
                      {currentQ.answer_media_type === 'audio' && (
                        <audio src={currentQ.answer_media_url} controls className="relative z-10 w-full max-w-sm" />
                      )}
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 shadow-inner w-full">
                    <span className="text-white/50 font-bold text-sm">الإجابة الصحيحة:</span>
                    <div className="text-white font-black text-3xl drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] text-green-400">{currentQ.answer}</div>
                  </div>
                  {/* Show I answered button only when answer is shown */}
                  <button onClick={streamerCorrect} className="group relative flex items-center gap-2 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black px-8 py-3 rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(234,179,8,0.5)] overflow-hidden mt-4">
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
                    <span className="relative z-10 flex items-center gap-2">😎 أنا جاوبتها!</span>
                  </button>
                  <button onClick={() => alert('تم الإبلاغ عن خطأ! سيتم مراجعة السؤال.')} className="text-orange-400 hover:text-orange-300 font-bold text-sm transition-colors px-4 py-2 hover:bg-orange-500/10 rounded-full border border-transparent hover:border-orange-500/30 flex items-center gap-2">
                    ⚠️ حصل خطأ - النظام لم يصطد الكلمة
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full gap-4">
                  <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(239,68,68,1)]" />
                    <span className="text-white/90 font-bold text-base tracking-widest uppercase">جاري الاستماع للشات...</span>
                  </div>
                  <div className="text-white/30 text-sm font-bold">انتظر انتهاء الوقت أو ظهور الإجابة</div>
                </div>
              )
            ) : (
              // Friends mode answer display
              showAnswer && (
                <div className="flex flex-col items-center w-full" style={{ animation: 'zoomBounce 0.5s ease-out' }}>
                  <div className="text-white/40 text-xs font-bold mb-3">الإجابة الصحيحة:</div>
                  {currentQ.answer_media_url && (
                    <div className="relative mb-4 group w-full flex justify-center">
                      <div className="absolute -inset-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl rounded-3xl opacity-80" />
                      {currentQ.answer_media_type === 'image' && (
                        <img src={currentQ.answer_media_url} alt="" className="relative z-10 max-h-[250px] rounded-xl border-2 border-green-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.5)] object-contain" />
                      )}
                      {currentQ.answer_media_type === 'video' && (
                        <video src={currentQ.answer_media_url} controls className="relative z-10 max-h-[250px] rounded-xl border-2 border-green-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.5)]" />
                      )}
                      {currentQ.answer_media_type === 'audio' && (
                        <audio src={currentQ.answer_media_url} controls className="relative z-10 w-full max-w-sm" />
                      )}
                    </div>
                  )}
                  <div className="text-4xl font-black text-green-400" style={{ textShadow: '0 0 40px rgba(74,222,128,0.4)' }}>{currentQ.answer}</div>
                </div>
              )
            )}
          </div>

          {/* Right Side: Question */}
          <div className="flex-1 flex flex-col items-center text-center px-4 relative z-10 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
            {/* Question Media */}
            {currentQ.media_url && (
              <div className="mb-4 w-full flex justify-center" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                {currentQ.media_type === 'image' && (
                  <div className="relative max-w-md w-full group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-red-500/20 blur-xl rounded-3xl opacity-60 group-hover:opacity-100 transition-opacity" />
                    <img src={currentQ.media_url} alt="" className="relative z-10 w-full max-h-[300px] object-contain rounded-xl border-2 border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]" />
                  </div>
                )}
                {currentQ.media_type === 'video' && (
                  <div className="relative max-w-lg w-full group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl rounded-3xl opacity-60" />
                    <video src={currentQ.media_url} controls autoPlay className="relative z-10 w-full max-h-[300px] rounded-xl border-2 border-purple-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)]" />
                  </div>
                )}
                {currentQ.media_type === 'audio' && (
                  <div className="relative w-full max-w-md group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/10 via-indigo-500/10 to-pink-500/10 blur-xl rounded-3xl opacity-60" />
                    <div className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                      <div className="flex items-center gap-2 text-pink-400 font-black text-base"><span className="text-2xl">🎵</span> استمع وجاوب!</div>
                      <audio src={currentQ.media_url} controls autoPlay className="w-full" style={{ filter: 'hue-rotate(300deg)' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Question Text */}
            {currentQ.text && (
              <h2 className={`font-black text-white leading-tight w-full px-2 ${currentQ.media_url ? 'text-2xl md:text-3xl lg:text-4xl' : (mode === 'chat' ? 'text-3xl md:text-4xl lg:text-5xl' : 'text-4xl md:text-5xl lg:text-6xl')}`} style={{ textShadow: '0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.2)' }}>
                {currentQ.text}
              </h2>
            )}
          </div>
        </div>

        {/* Chat Answers Feed (Only in chat mode) */}
        {mode === 'chat' && !showAnswer && !chatWinner && (
          <div className="absolute bottom-8 left-8 right-8 max-w-2xl mx-auto max-h-[120px] overflow-y-auto rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] px-1 py-2" style={{ scrollbarWidth: 'none' }}>
            <div className="flex flex-col-reverse gap-1 px-3">
              {[...chatAnswers].reverse().map((a, i) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${i === 0 ? 'animate-in slide-in-from-bottom-2 duration-300' : ''} ${a.correct ? 'bg-green-500/20 border border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-white/[0.03]'}`}>
                  <div className="shrink-0">
                    <ProAvatar username={a.username} size="w-6 h-6" className="overflow-visible" />
                  </div>
                    <span className={`font-bold text-xs truncate ${a.correct ? 'text-green-400' : 'text-white/60'}`}>{a.username}</span>
                    <span className={`text-xs font-bold flex-1 text-right truncate ${a.correct ? 'text-green-300' : 'text-white/30'}`}>{a.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends Mode Controls */}
          {mode === 'friends' && (
            <div className="mt-6 flex items-center gap-6">
              {!showAnswer ? (
                <button onClick={() => setShowAnswer(true)} className="flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  <Eye size={28} /> كشف الإجابة
                </button>
              ) : (
                <div className="flex items-center gap-6">
                  <button onClick={friendsCorrect} className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-700 text-white px-10 py-5 rounded-full font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                    <Check size={28} /> صحيحة
                  </button>
                  <button onClick={friendsWrong} className="flex items-center gap-3 bg-gradient-to-r from-red-500 to-red-700 text-white px-10 py-5 rounded-full font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                    <X size={28} /> خاطئة
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <>
      {stage === 'mode_select' && renderModeSelect()}
      {stage === 'setup' && renderSetup()}
      {stage === 'playing' && renderBoard()}
      {stage === 'question' && renderQuestionModal()}

      {showWheel && <FortuneWheelModal onClose={() => setShowWheel(false)} onApplyResult={handleWheelResult} />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoomBounce { 0% { opacity: 0; transform: scale(0.3); } 70% { transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes floatParticle { 0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; } 50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; } }
      `}</style>
    </>
  );
};
