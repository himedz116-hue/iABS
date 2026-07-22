import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../../services/chatService';
import { supabase } from '../../services/supabase';
import { FortuneWheelModal } from './FortuneWheelModal';
import { ProAvatar } from '../ProAvatar';
import { getAssetUrl } from '../../utils/assets';
import { Home, Users, MessageCircle, Play, Trophy, Check, X, Shield, FastForward, Eye, Star, Crown, Zap, ArrowLeft, Sparkles, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

// ==========================================
// TYPES
// ==========================================
type GameMode = 'chat' | 'friends';
type Stage = 'mode_select' | 'setup' | 'playing' | 'question';
type ChatSide = 'chat' | 'streamer';

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

const splitQuestionText = (text: string): { main: string; hint: string | null } => {
  const match = text.match(/\([^)]+\)/);
  if (!match) return { main: text, hint: null };
  const hint = match[0].trim();
  const main = text.replace(/\([^)]+\)/g, '').replace(/\s+/g, ' ').trim();
  return { main, hint };
};

const renderAnswerMedia = (q: MahmahQuestion, className = 'max-h-[min(42vh,380px)]') => {
  if (!q.answer_media_url) return null;
  const type = q.answer_media_type || 'image';
  return (
    <div className="relative w-full max-w-xl flex justify-center">
      <div className="absolute -inset-3 bg-gradient-to-r from-green-500/30 to-emerald-500/30 blur-xl rounded-3xl opacity-80" />
      {type === 'image' && (
        <img src={q.answer_media_url} alt="" className={`relative z-10 w-full ${className} rounded-2xl border-2 border-green-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.5)] object-contain`} />
      )}
      {type === 'video' && (
        <video src={q.answer_media_url} controls className={`relative z-10 w-full ${className} rounded-2xl border-2 border-green-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.5)]`} />
      )}
      {type === 'audio' && (
        <audio src={q.answer_media_url} controls className="relative z-10 w-full max-w-lg" />
      )}
    </div>
  );
};

const STREAMER_WIN_IMAGES = [
  'iAABS-FAS/image-253661ba-141c-45d1-8fe1-5e65d4c86b3c.png',
  'iAABS-FAS/image-3d92afa6-91c6-447c-9577-cbd17092d7fc.png',
  'iAABS-FAS/image-69b2e552-7158-46a1-a496-d2e49f2230f1.png',
  'iAABS-FAS/image-833e1648-36de-4f46-810b-e4063a7b42a5.png',
  'iAABS-FAS/image-c1345461-c314-4359-9d5a-4aaf27ed5898.png'
].map((path) => getAssetUrl(path) || `/${path}`);

const getOppositeChatSide = (side: ChatSide): ChatSide => side === 'chat' ? 'streamer' : 'chat';

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
  const [chatTurnOwner, setChatTurnOwner] = useState<ChatSide>('chat');
  const [chatResponder, setChatResponder] = useState<ChatSide>('chat');
  const [chatPassUsed, setChatPassUsed] = useState(false);
  const pendingChatWinnerRef = useRef<{ username: string; avatar: string; color: string; isStreamer?: boolean } | null>(null);
  
  const chatWinnerRef = useRef(chatWinner);
  const showAnswerRef = useRef(showAnswer);
  const currentQRef = useRef(currentQ);
  const totalQuestionCount = activeCategories.reduce((sum, cat) => sum + cat.questions.length, 0);
  const isBoardFinished = totalQuestionCount > 0 && answeredQs.size === totalQuestionCount;
  const topChatPlayer = Object.values(chatPlayers).sort((a, b) => (b as ChatPlayer).score - (a as ChatPlayer).score)[0] as ChatPlayer | undefined;
  const chatFinalResult = streamerScore === chatScore ? 'tie' : streamerScore > chatScore ? 'streamer' : 'chat';

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
  const [streamerRevealed, setStreamerRevealed] = useState(false);
  const [streamerCorrectFlash, setStreamerCorrectFlash] = useState(false);

  // ---- Sync refs ----
  useEffect(() => { chatWinnerRef.current = chatWinner; }, [chatWinner]);
  useEffect(() => { showAnswerRef.current = showAnswer; }, [showAnswer]);
  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);

  const passChatQuestion = (nextResponder: ChatSide) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setChatResponder(nextResponder);
    setChatPassUsed(true);
    setTimer(30);
    setShowAnswer(false);
  };

  const revealChatAnswer = (intentional = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(0);
    setShowAnswer(true);
    setStreamerRevealed(intentional);
    if (chatResponder === 'chat') {
      setTimeout(() => {
        closeQuestion();
      }, 4000);
    }
  };

  const handleChatTurnExpired = () => {
    if (chatPassUsed) {
      revealChatAnswer(false);
      return;
    }

    passChatQuestion(getOppositeChatSide(chatResponder));
  };

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
      setChatWinner(null);
      setChatTurnOwner('chat');
      setChatResponder('chat');
      setChatPassUsed(false);
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
    setStreamerRevealed(false);
    setStreamerCorrectFlash(false);
    setTimer(30);
    
    if (mode === 'chat') {
      setChatWinner(null);
      setChatResponder(chatTurnOwner);
      setChatPassUsed(false);
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
            setTimeout(() => {
              handleChatTurnExpired();
            }, 0);
            return 0;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, showAnswer, chatWinner, mode, chatResponder, chatPassUsed]);

  // ==========================================
  // CHAT HELPERS
  // ==========================================
  const ARABIC_CHAR_MAP: Record<string, string> = {
    'أ':'ا','إ':'ا','آ':'ا','ٱ':'ا',
    'ة':'ه','ۀ':'ه',
    'ى':'ي','ي':'ي',
    'ؤ':'ء','ئ':'ء',
    'ب':'ب','ت':'ت','ث':'ث',
    'ج':'ج','ح':'ح','خ':'خ',
    'د':'د','ذ':'ذ','ر':'ر','ز':'ز',
    'س':'س','ش':'ش','ص':'ص','ض':'ض',
    'ط':'ط','ظ':'ظ','ع':'ع','غ':'غ',
    'ف':'ف','ق':'ق','ك':'ك','ل':'ل','م':'م','ن':'ن','ه':'ه','و':'و',
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
    'ﻷ':'لا','ﻹ':'لا','ﻵ':'لا','ﻻ':'لا'
  };

  const ARABIC_NUMBERS_MAP: Record<string, string> = {
    'صفر':'0','واحد':'1','اثنين':'2','اثنان':'2','ثلاثة':'3','ثلاث':'3',
    'اربعة':'4','أربعة':'4','اربعه':'4','أربعه':'4',
    'خمسة':'5','خمس':'5','سته':'6','ستة':'6','سبعة':'7','سبع':'7',
    'ثمانية':'8','ثمانيه':'8','ثمان':'8','تمنية':'8','تمنه':'8',
    'تسعة':'9','تسع':'9','عشرة':'10','عشر':'10',
    'أحد عشر':'11','احد عشر':'11','اثني عشر':'12','اثنى عشر':'12',
    'ثلاثة عشر':'13','أربعة عشر':'14','خمسة عشر':'15',
    'ستة عشر':'16','سبعة عشر':'17','ثمانية عشر':'18','تسعة عشر':'19',
    'عشرون':'20','عشرين':'20','ثلاثون':'30','ثلاثين':'30',
    'اربعون':'40','أربعون':'40','خمسون':'50','خمسين':'50',
    'ستون':'60','ستين':'60','سبعون':'70','سبعين':'70',
    'ثمانون':'80','ثمانين':'80','تسعون':'90','تسعين':'90',
    'مئة':'100','مائة':'100','مئه':'100',
    'مئتان':'200','ثلاثمئة':'300','أربعمئة':'400',
    'خمسمئة':'500','ستمئة':'600','سبعمئة':'700','ثمانيمئة':'800','تسعمئة':'900','ألف':'1000'
  };

  const normalizeForChat = (text: string): string => {
    let normalized = text.toLowerCase()
      .split('').map(ch => ARABIC_CHAR_MAP[ch] || ch).join('')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/[ةۀ]/g, 'ه')
      .replace(/[ىي]/g, 'ي')
      .replace(/[ؤئ]/g, 'ء')
      .replace(/^ا+/, '')
      .replace(/[\u064B-\u0652\u0670\u06D6-\u06DC\u06DF-\u06E8]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    for (const [arabicNum, digit] of Object.entries(ARABIC_NUMBERS_MAP)) {
      normalized = normalized.replace(new RegExp(`\\b${arabicNum}\\b`, 'g'), digit);
    }

    return normalized;
  };

  const levenshtein = (a: string, b: string): number => {
    const an = a.length;
    const bn = b.length;
    const matrix = Array.from({ length: an + 1 }, () => Array(bn + 1).fill(0));
    for (let i = 0; i <= an; i++) matrix[i][0] = i;
    for (let j = 0; j <= bn; j++) matrix[0][j] = j;
    for (let i = 1; i <= an; i++) {
      for (let j = 1; j <= bn; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i-1][j] + 1, matrix[i][j-1] + 1, matrix[i-1][j-1] + cost);
      }
    }
    return matrix[an][bn];
  };

  const tokenMatch = (a: string, b: string): boolean => {
    if (!a || !b) return false;
    const na = normalizeForChat(a);
    const nb = normalizeForChat(b);
    if (na === nb) return true;
    if (na.length >= 2 && nb.includes(na)) return true;
    if (nb.length >= 2 && na.includes(nb)) return true;
    if (na.length >= 3 && nb.length >= 3) {
      const dist = levenshtein(na, nb);
      const maxLen = Math.max(na.length, nb.length);
      if (maxLen > 0 && dist / maxLen <= 0.25) return true;
    }
    return false;
  };

  const isAnswerCorrect = (userAnswer: string, correctAnswer: string): boolean => {
    if (!userAnswer || !correctAnswer) return false;
    const uNorm = normalizeForChat(userAnswer);
    const cNorm = normalizeForChat(correctAnswer);
    if (!uNorm || !cNorm) return false;

    const uTokens = uNorm.split(/\s+/).filter(Boolean);
    const cTokens = cNorm.split(/\s+/).filter(Boolean);
    if (cTokens.length === 0 || uTokens.length === 0) return false;

    if (uNorm.includes(cNorm) || cNorm.includes(uNorm)) return true;

    const matchCount = cTokens.filter(ct => uNorm.includes(ct) || uTokens.some(ut => tokenMatch(ut, ct))).length;

    if (cTokens.length === 1) return matchCount >= 1;
    if (cTokens.length === 2) return matchCount >= 1;
    return matchCount >= 2;
  };

  const BAD_WORDS = new Set([
    'غبي','حمار','كلب','خنزير','عرص','قحبة','زنجي','موت','اقتل','خرا','خول','منيوك'
  ]);

  const hasBadWord = (text: string): boolean => {
    const words = text.split(/\s+/);
    return words.some(w => {
      const n = normalizeForChat(w);
      if (BAD_WORDS.has(n)) return true;
      return [...BAD_WORDS].some(bad => n.includes(bad) || bad.includes(n));
    });
  };

  // ==========================================
  // CHAT LISTENER
  // ==========================================
  useEffect(() => {
    if (stage !== 'question' || mode !== 'chat' || chatResponder !== 'chat') return;
    
    const unsubscribe = chatService.onMessage((msg) => {
      if (chatWinnerRef.current || showAnswerRef.current) return;
      const q = currentQRef.current;
      if (!q) return;

      const rawContent = msg.content.replace(/\[emote:\d+:[^\]]*\]/gi, '').replace(/<[^>]*>/g, '').trim();
      const userAnswer = normalizeForChat(rawContent);
      const correctAnswer = normalizeForChat(q.answer);

      if (hasBadWord(rawContent)) return;

      const isCorrect = isAnswerCorrect(userAnswer, correctAnswer);
      
      if (isCorrect) {
        const winner = { username: msg.user.username, avatar: msg.user.avatar || '', color: msg.user.color || '#fff' };
        pendingChatWinnerRef.current = winner;
        setChatWinner(winner);
      }
    });

    return () => unsubscribe();
  }, [stage, mode, chatResponder]);

  // ==========================================
  // QUESTION ACTIONS
  // ==========================================
  const closeQuestion = () => {
    if (currentQ) {
      setAnsweredQs(prev => new Set(prev).add(currentQ.id));
    }
    setCurrentQ(null);
    setShowAnswer(false);
    setStreamerRevealed(false);
    setStreamerCorrectFlash(false);
    setStage('playing');
    
    if (mode === 'friends') {
      setActiveTeamIdx(prev => (prev + 1) % teams.length);
    } else if (mode === 'chat') {
      setChatWinner(null);
      setChatPassUsed(false);
      setChatTurnOwner(prev => getOppositeChatSide(prev));
    }
  };

  const streamerCorrect = () => {
    if (!currentQ || mode !== 'chat' || chatResponder !== 'streamer') return;
    setStreamerScore(prev => prev + currentQ.points);
    setChatWinner({ username: 'الاستريمر', avatar: '', color: '#EAB308', isStreamer: true });
    setStreamerCorrectFlash(true);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => {
      setStreamerCorrectFlash(false);
      closeQuestion();
    }, 4000);
  };

  const streamerMissed = () => {
    if (mode !== 'chat' || chatResponder !== 'streamer') return;
    if (chatPassUsed) {
      revealChatAnswer();
      return;
    }
    passChatQuestion('chat');
  };

  const chatHostConfirm = () => {
    if (!currentQ || !pendingChatWinnerRef.current) return;
    const winner = pendingChatWinnerRef.current;
    setChatWinner(winner);
    setChatScore(prev => prev + currentQ.points);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    setChatPlayers(prev => {
      const existing = prev[winner.username] || { username: winner.username, avatar: winner.avatar || '', color: winner.color || '#fff', score: 0, correctAnswers: 0 };
      return {
        ...prev,
        [winner.username]: {
          ...existing,
          score: existing.score + currentQ.points,
          correctAnswers: existing.correctAnswers + 1
        }
      };
    });
    pendingChatWinnerRef.current = null;
    setTimeout(() => {
      closeQuestion();
    }, 4000);
  };

  const chatHostReject = () => {
    if (!currentQ) return;
    pendingChatWinnerRef.current = null;
    setChatWinner(null);
    setTimer(30);
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

  const skipTimer = () => {
    if (showAnswer || chatWinner) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (mode === 'chat') {
      handleChatTurnExpired();
      return;
    }
    setTimer(0);
    setShowAnswer(true);
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
              <div className={`flex flex-col p-4 rounded-2xl transition-all duration-500 border-2 shadow-[0_0_30px_rgba(234,179,8,0.1)] ${chatTurnOwner === 'streamer' && !isBoardFinished ? 'border-yellow-300 bg-gradient-to-br from-yellow-500/20 to-transparent scale-105' : 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-500 font-bold text-lg truncate flex items-center gap-2">😎 الاستريمر</span>
                  {chatTurnOwner === 'streamer' && !isBoardFinished && <span className="text-xs font-black bg-yellow-300 text-black px-2 py-0.5 rounded-full animate-pulse">يبدأ التالي</span>}
                </div>
                <div className="text-5xl font-black italic tracking-tighter text-yellow-400">{streamerScore}</div>
              </div>

              <div className="flex items-center justify-center -my-2 z-10">
                <div className="bg-black text-white/50 font-black text-sm px-3 py-1 rounded-full border border-white/10">VS</div>
              </div>

              {/* Chat Score */}
              <div className={`flex flex-col p-4 rounded-2xl transition-all duration-500 border-2 ${chatTurnOwner === 'chat' && !isBoardFinished ? 'border-blue-300 bg-gradient-to-br from-blue-500/20 to-transparent scale-105 shadow-[0_0_30px_rgba(59,130,246,0.18)]' : 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400 font-bold text-lg truncate flex items-center gap-2">💬 الشات</span>
                  {chatTurnOwner === 'chat' && !isBoardFinished && <span className="text-xs font-black bg-blue-300 text-slate-950 px-2 py-0.5 rounded-full animate-pulse">يبدأ التالي</span>}
                </div>
                <div className="text-5xl font-black italic tracking-tighter text-blue-400">{chatScore}</div>
              </div>
            </div>

            {isBoardFinished ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-4 text-center shadow-xl">
                <div className="text-white/50 font-bold text-sm mb-2">انتهت كل الجولات</div>
                <div className={`font-black text-2xl ${chatFinalResult === 'tie' ? 'text-white' : chatFinalResult === 'streamer' ? 'text-yellow-300' : 'text-blue-300'}`}>
                  {chatFinalResult === 'tie' ? 'تعادل بين الشات والاستريمر' : `الفائز النهائي: ${chatFinalResult === 'streamer' ? 'الاستريمر' : 'الشات'}`}
                </div>
                {chatFinalResult === 'chat' && topChatPlayer && (
                  <div className="text-white/60 font-bold text-sm mt-2">
                    نجم الشات: {topChatPlayer.username}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl">
                <div className="text-white/50 font-bold text-sm mb-2">نظام الدور</div>
                <div className={`font-black text-xl ${chatTurnOwner === 'chat' ? 'text-blue-300' : 'text-yellow-300'}`}>
                  {chatTurnOwner === 'chat' ? '💬 السؤال التالي يبدأ مع الشات' : '😎 السؤال التالي يبدأ مع الاستريمر'}
                </div>
                <div className="text-white/45 font-bold text-xs mt-2 leading-6">
                  إذا انتهى الوقت أو ضاعت الإجابة، تنتقل الفرصة مرة واحدة فقط للطرف الآخر.
                </div>
              </div>
            )}
            
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
    const isRevealed = showAnswer || !!chatWinner;
    const isStreamerWinner = !!chatWinner?.isStreamer;
    const chatResponderLabel = chatResponder === 'chat' ? '💬 الشات' : '😎 الاستريمر';

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black pr-[380px] overflow-hidden" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        
        {/* Background Ambient */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full animate-pulse" />
        </div>

        {/* Header */}
        <div className="relative z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/30 backdrop-blur-md">
          <button onClick={closeQuestion} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all border border-white/10">
            <X size={20} />
          </button>
          {mode === 'chat' && chatResponder && (
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md ${chatResponder === 'chat' ? 'border-blue-500/20 bg-blue-500/10 text-blue-200' : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-200'}`}>
              <span className="font-bold text-sm">{chatResponder === 'chat' ? '💬 الشات' : '😎 الاستريمر'}</span>
              {chatPassUsed && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-black text-white/80">الفرصة الأخيرة</span>}
            </div>
          )}
          {mode === 'friends' && activeTeam && (
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md border-white/10 bg-white/5 text-white/80`}>
              <span className="font-bold text-sm">دور: {activeTeam.name}</span>
            </div>
          )}
        </div>

        {/* Friends Helpers */}
        {mode === 'friends' && (
          <div className="absolute top-40 right-8 flex gap-2 z-20">
            <button onClick={() => setFMultiplier(2)} disabled={showAnswer || fMultiplier === 2}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs transition-all border ${fMultiplier === 2 ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30'}`}>
              <FastForward size={14} /> دبل x2
            </button>
            <button onClick={() => setFBlocked(true)} disabled={showAnswer || fBlocked}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs transition-all border ${fBlocked ? 'bg-red-500 text-white border-red-500' : 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30'}`}>
              <Shield size={14} /> منع
            </button>
            <button onClick={() => setFStolen(true)} disabled={showAnswer || fStolen || fBlocked}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs transition-all border ${fStolen ? 'bg-red-500 text-white border-red-500' : 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30'}`}>
              <Volume2 size={14} /> سرقة
            </button>
            <button onClick={() => setShowWheel(true)} disabled={showAnswer}
              className="flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs bg-gradient-to-r from-red-500 to-orange-500 text-white hover:scale-105 transition-all shadow-lg border border-red-500/30">
              <Star size={14} /> العجلة
            </button>
          </div>
        )}

        {/* Team Info for Friends Mode */}
        {mode === 'friends' && (
          <div className="absolute top-40 right-8 mt-14 z-20">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-red-500/30 bg-red-600/20 backdrop-blur-xl shadow-lg ${activeTeam.color}`}>
              {fStolen ? <span className="text-red-400 animate-pulse font-black">🔊 سؤال مسروق!</span> : <span className="font-black text-white">دور: {activeTeam.name}</span>}
            </div>
          </div>
        )}

        {mode === 'chat' && (
          <div className="absolute top-40 right-8 z-20">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border backdrop-blur-xl shadow-lg ${chatResponder === 'chat' ? 'border-blue-500/30 bg-blue-600/20' : 'border-yellow-500/30 bg-yellow-500/20'}`}>
              <span className="font-bold text-white/55">الدور الحالي:</span>
              <span className={`font-black ${chatResponder === 'chat' ? 'text-blue-300' : 'text-yellow-300'}`}>{chatResponderLabel}</span>
              {chatPassUsed && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/80">الفرصة الأخيرة</span>}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 min-h-0 overflow-y-auto flex flex-col items-center relative z-10 px-8 ${isRevealed ? 'justify-start gap-4 py-4' : 'justify-center gap-8 py-8'}`}>

          {/* Score & Time Bar */}
          <div className="flex items-center justify-center gap-4 mb-2 shrink-0">
            <div className="relative">
              <div className="absolute -inset-2 bg-white/5 blur-xl rounded-full opacity-60" />
              <div className="relative z-10 bg-white/[0.03] border border-white/10 backdrop-blur-lg rounded-2xl px-5 py-2 flex items-center gap-3 shadow-lg">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">النقاط</span>
                <span className="text-white font-black text-xl tracking-tight">{currentQ.points}</span>
              </div>
            </div>

            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={timer <= 10 ? '#94a3b8' : '#e2e8f0'} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${timerPercent * 2.83} 283`} style={{ transition: 'stroke-dasharray 1s linear' }} />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-lg font-black z-10 ${timer <= 10 ? 'text-red-300' : 'text-white/90'}`}>{timer}</span>
            </div>
          </div>

          {/* Question Section */}
          <div className="w-full max-w-4xl flex flex-col items-center text-center shrink-0">
            {/* Question Media — hidden once answer is revealed */}
            {!isRevealed && currentQ.media_url && (
              <div className="mb-8 w-full flex justify-center" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                {currentQ.media_type === 'image' && (
                  <div className="relative max-w-lg w-full group">
                    <div className="absolute -inset-3 bg-gradient-to-r from-red-500/30 to-orange-500/30 blur-xl rounded-3xl opacity-60 group-hover:opacity-100 transition-opacity" />
                    <img src={currentQ.media_url} alt="" className="relative z-10 w-full max-h-[min(38vh,360px)] object-contain rounded-2xl border-2 border-red-500/40 shadow-[0_20px_60px_rgba(220,38,38,0.4)]" />
                  </div>
                )}
                {currentQ.media_type === 'video' && (
                  <div className="relative max-w-xl w-full group">
                    <div className="absolute -inset-3 bg-gradient-to-r from-red-500/30 to-orange-500/30 blur-xl rounded-3xl opacity-60 group-hover:opacity-100 transition-opacity" />
                    <video src={currentQ.media_url} controls autoPlay className="relative z-10 w-full max-h-[min(38vh,360px)] rounded-2xl border-2 border-red-500/40 shadow-[0_20px_60px_rgba(220,38,38,0.4)]" />
                  </div>
                )}
                {currentQ.media_type === 'audio' && (
                  <div className="relative w-full max-w-lg group">
                    <div className="absolute -inset-3 bg-gradient-to-r from-red-500/30 to-orange-500/30 blur-xl rounded-3xl opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-xl border border-red-500/40 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-[0_20px_60px_rgba(220,38,38,0.4)]">
                      <div className="flex items-center gap-3 text-red-400 font-black text-lg"><span className="text-3xl">🎵</span> استمع وجاوب!</div>
                      <audio src={currentQ.media_url} controls autoPlay className="w-full" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Answer Media — shown in place of question media when revealed */}
            {showAnswer && currentQ.answer_media_url && (
              <div className="mb-4 w-full flex justify-center" style={{ animation: 'zoomBounce 0.5s ease-out' }}>
                {renderAnswerMedia(currentQ)}
              </div>
            )}

            {/* Question Text */}
            {currentQ.text && (() => {
              const { main, hint } = splitQuestionText(currentQ.text);
              const hasMedia = !!currentQ.media_url || (showAnswer && !!currentQ.answer_media_url);
              const sizeClass = isRevealed
                ? 'text-2xl md:text-3xl'
                : hasMedia ? 'text-3xl md:text-4xl lg:text-5xl' : (mode === 'chat' ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-5xl md:text-6xl lg:text-7xl');
              const hintSizeClass = isRevealed
                ? 'text-lg md:text-xl'
                : hasMedia ? 'text-xl md:text-2xl lg:text-3xl' : (mode === 'chat' ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-3xl md:text-4xl lg:text-5xl');
              return (
                <h2 className={`font-black text-white leading-tight w-full px-4 flex flex-col items-center gap-2 ${sizeClass} ${isRevealed ? 'text-white/70' : ''}`} style={{ textShadow: '0 10px 40px rgba(0,0,0,0.8), 0 0 30px rgba(220,38,38,0.3)' }}>
                  <span>{main}</span>
                  {hint && !isRevealed && (
                    <span className={`${hintSizeClass} text-white/60 font-bold tracking-wide`}>{hint}</span>
                  )}
                </h2>
              );
            })()}
          </div>

          {/* Answer Section */}
          <div className="w-full max-w-4xl flex flex-col items-center">
            {mode === 'chat' ? (
              chatWinner ? (
                <div className="flex flex-col items-center gap-6 w-full" style={{ animation: 'zoomBounce 0.5s ease-out' }}>
                  {isStreamerWinner ? (
                    <div className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-yellow-400/30 bg-gradient-to-br from-yellow-500/16 via-amber-500/12 to-black/45 px-4 py-6 md:px-8 md:py-8 shadow-[0_0_80px_rgba(234,179,8,0.18)]">
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-yellow-300/14 to-transparent" />
                        <div className="absolute -top-10 left-10 w-40 h-40 rounded-full bg-yellow-400/16 blur-3xl animate-pulse" />
                        <div className="absolute -bottom-10 right-10 w-44 h-44 rounded-full bg-orange-500/16 blur-3xl animate-pulse" style={{ animationDelay: '0.8s' }} />
                      </div>

                      <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="inline-flex items-center gap-3 rounded-full border border-yellow-300/40 bg-yellow-400/12 px-6 py-3 text-yellow-200 shadow-[0_0_25px_rgba(250,204,21,0.2)] backdrop-blur-xl">
                          <Crown size={24} className="text-yellow-300" />
                          <span className="font-black text-xl md:text-2xl">الاستريمر خطف السؤال!</span>
                          <Sparkles size={22} className="text-yellow-200" />
                        </div>

                        <div className="w-full max-w-4xl">
                          <div className="hidden md:grid grid-cols-4 items-center gap-4">
                            <div className="space-y-4">
                              {STREAMER_WIN_IMAGES.slice(0, 2).map((src, idx) => (
                                <div
                                  key={src}
                                  className="group relative overflow-hidden rounded-[1.6rem] border border-white/15 bg-white/5 p-2 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
                                  style={{ animation: `winnerFloat ${3.6 + idx * 0.3}s ease-in-out infinite` }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/14 via-transparent to-transparent opacity-70" />
                                  <img src={src} alt={`صورة فوز الاستريمر ${idx + 1}`} className="relative z-10 h-40 w-full rounded-[1.15rem] object-cover transition-transform duration-500 group-hover:scale-105" />
                                </div>
                              ))}
                            </div>

                            <div
                              className="group relative col-span-2 overflow-hidden rounded-[2rem] border border-yellow-300/40 bg-black/20 p-3 shadow-[0_20px_90px_rgba(250,204,21,0.2)]"
                              style={{ animation: 'winnerFloat 4.2s ease-in-out infinite' }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/20 via-transparent to-orange-400/10" />
                              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300/20 via-transparent to-orange-400/20 blur-2xl opacity-80" />
                              <img src={STREAMER_WIN_IMAGES[2]} alt="الصورة الرئيسية لفوز الاستريمر" className="relative z-10 h-[24rem] w-full rounded-[1.5rem] object-cover" />
                            </div>

                            <div className="space-y-4">
                              {STREAMER_WIN_IMAGES.slice(3).map((src, idx) => (
                                <div
                                  key={src}
                                  className="group relative overflow-hidden rounded-[1.6rem] border border-white/15 bg-white/5 p-2 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
                                  style={{ animation: `winnerFloat ${4 + idx * 0.35}s ease-in-out infinite`, animationDelay: `${idx * 0.15}s` }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/14 via-transparent to-transparent opacity-70" />
                                  <img src={src} alt={`صورة فوز الاستريمر ${idx + 4}`} className="relative z-10 h-40 w-full rounded-[1.15rem] object-cover transition-transform duration-500 group-hover:scale-105" />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 md:hidden">
                            {STREAMER_WIN_IMAGES.map((src, idx) => (
                              <div
                                key={src}
                                className={`group relative overflow-hidden rounded-[1.4rem] border p-2 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.35)] ${idx === 2 ? 'col-span-2 border-yellow-300/40 bg-yellow-400/10' : 'border-white/15 bg-white/5'}`}
                                style={{ animation: `winnerFloat ${3.6 + idx * 0.25}s ease-in-out infinite`, animationDelay: `${idx * 0.08}s` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/14 via-transparent to-transparent opacity-70" />
                                <img src={src} alt={`صورة فوز الاستريمر ${idx + 1}`} className={`relative z-10 w-full rounded-[1rem] object-cover transition-transform duration-500 group-hover:scale-[1.03] ${idx === 2 ? 'h-64' : 'h-36'}`} />
                              </div>
                            ))}
                          </div>
                        </div>

                         <div className="flex flex-col items-center gap-4 text-center">
                           <div className="text-white font-black text-5xl md:text-6xl tracking-tight drop-shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                             {chatWinner.username}
                           </div>
                           <div className="text-yellow-100/80 font-bold text-lg md:text-xl">
                             احتفالية خاصة بصور الستريمر الخمس
                           </div>
                           <div className="text-white/40 font-bold text-xs uppercase tracking-widest">✅ الإجابة الصحيحة</div>
                           <div className="text-white font-black text-2xl md:text-3xl text-green-400 tracking-tight">{currentQ.answer}</div>
                           <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                             <button onClick={chatHostConfirm} className="group relative flex items-center gap-3 px-10 py-4 rounded-full font-black text-xl bg-gradient-to-br from-green-400 to-green-700 text-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(34,197,94,0.5)] border border-green-500/30">
                               <Check size={24} /> ✅ صحيقة
                             </button>
                             <button onClick={chatHostReject} className="flex items-center gap-3 bg-white/10 text-white px-8 py-4 rounded-full font-black text-lg hover:bg-white/15 active:scale-95 transition-all border border-white/15">
                               ❌ خاطئة
                             </button>
                           </div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-green-400 font-black text-4xl mb-2">🎉 الفائز!</div>
                      <div className="flex items-center gap-6">
                        <ProAvatar url={chatWinner.avatar} username={chatWinner.username} size="w-28 h-28" className="overflow-visible shadow-[0_0_50px_rgba(34,197,94,0.8)]" />
                        <div className="text-white font-black text-6xl">{chatWinner.username}</div>
                      </div>
                      <div className="text-white/40 font-bold text-xs uppercase tracking-widest mb-1">✅ الإجابة الصحيحة</div>
                      <div className="text-white font-black text-2xl md:text-3xl text-green-400 tracking-tight">{currentQ.answer}</div>
                      <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                        <button onClick={chatHostConfirm} className="group relative flex items-center gap-3 px-10 py-4 rounded-full font-black text-xl bg-gradient-to-br from-green-400 to-green-700 text-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(34,197,94,0.5)] border border-green-500/30">
                          <Check size={24} /> ✅ صحيقة
                        </button>
                        <button onClick={chatHostReject} className="flex items-center gap-3 bg-white/10 text-white px-8 py-4 rounded-full font-black text-lg hover:bg-white/15 active:scale-95 transition-all border border-white/15">
                          ❌ خاطئة
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : showAnswer ? (
                <div className="flex flex-col items-center gap-4 w-full shrink-0 pb-4" style={{ animation: 'slideUp 0.4s ease-out' }}>
                  {streamerRevealed ? (
                    <div className="text-emerald-400 font-black text-2xl flex items-center gap-3">
                      <Check size={28} /> تم كشف الإجابة
                    </div>
                  ) : (
                    <div className="text-red-400 font-black text-2xl flex items-center gap-3">
                      <X size={28} /> انتهى الوقت!
                    </div>
                  )}
                  {!streamerRevealed && (
                    <div className="text-white/60 font-bold text-lg">
                      ما أحد قدر يحسم السؤال، لذلك انكشفت الإجابة.
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-8 py-5 shadow-inner w-full max-w-2xl">
                    <span className="text-white/50 font-bold text-lg">✅ الإجابة الصحيحة:</span>
                    <div className="text-white font-black text-3xl md:text-4xl drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] text-green-400">{currentQ.answer}</div>
                  </div>
                  {chatResponder === 'streamer' ? (
                    <>
                      {!streamerRevealed && (
                        <div className="text-yellow-100/85 font-black text-xl text-center mt-2">
                          أنت جاوبتها؟
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-center gap-4">
                        <button onClick={streamerCorrect} className={`group relative flex items-center gap-3 px-10 py-4 rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-lg overflow-hidden border ${streamerCorrectFlash ? 'bg-green-500 text-black border-green-400 shadow-[0_0_50px rgba(34,197,94,0.6)]' : 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.5)]'}`}>
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
                          <span className="relative z-10 flex items-center gap-3">{streamerCorrectFlash ? <Check size={24} /> : null} {streamerCorrectFlash ? 'صح!' : '✅ جاوبتها'}</span>
                        </button>
                        {!streamerCorrectFlash && (
                          <button onClick={closeQuestion} className="flex items-center gap-3 bg-white/10 text-white px-8 py-4 rounded-full font-black text-lg hover:bg-white/15 active:scale-95 transition-all border border-white/15">
                            ❌ لا، يا هطف
                          </button>
                        )}
                      </div>
                      {!streamerRevealed && (
                        <button onClick={() => alert('تم الإبلاغ عن خطأ! يبدو أن الشات جاوب لكن النظام لم يلتقط الإجابة.')} className="text-orange-400 hover:text-orange-300 font-bold text-base transition-colors px-6 py-3 hover:bg-orange-500/10 rounded-full border border-orange-500/20 hover:border-orange-500/30 flex items-center gap-2">
                          ⚠️ خطأ: نظام الشات ما التقط الإجابة
                        </button>
                      )}
                    </>
                  ) : (
                    <button onClick={() => alert('تم الإبلاغ عن خطأ! سيتم مراجعة السؤال.')} className="text-orange-400 hover:text-orange-300 font-bold text-base transition-colors px-6 py-3 hover:bg-orange-500/10 rounded-full border border-transparent hover:border-orange-500/30 flex items-center gap-2 mt-2">
                      ⚠️ حصل خطأ - النظام لم يصطد الكلمة
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full gap-6">
                  {chatResponder === 'chat' ? (
                    <>
                      <div className="flex items-center gap-4 bg-blue-600/20 backdrop-blur-md px-10 py-5 rounded-full border border-blue-500/30 shadow-lg">
                        <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(96,165,250,1)]" />
                        <span className="text-white/90 font-bold text-xl tracking-widest uppercase">دور الشات الآن</span>
                      </div>
                      <div className="text-white/55 font-bold text-lg text-center max-w-2xl leading-8">
                        {chatPassUsed ? 'هذه آخر فرصة للشات قبل كشف الإجابة.' : 'إذا لم يحسم الشات السؤال، تنتقل الفرصة مباشرة إلى الاستريمر.'}
                      </div>
                      <button
                        onClick={skipTimer}
                        className="group flex flex-col items-center justify-center w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-600/20 to-blue-900/30 border-2 border-blue-500/40 hover:border-blue-400/70 hover:from-blue-600/40 hover:to-blue-900/50 transition-all shadow-[0_0_40px_rgba(37,99,235,0.25)] hover:shadow-[0_0_60px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95 backdrop-blur-md"
                      >
                        <FastForward size={34} className="text-blue-300 group-hover:text-white transition-colors drop-shadow-[0_0_10px_rgba(96,165,250,0.6)]" />
                        <span className="text-white/90 font-black text-sm mt-2 tracking-wide">{chatPassUsed ? 'كشف الإجابة' : 'مررها للاستريمر'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 bg-yellow-500/20 backdrop-blur-md px-10 py-5 rounded-full border border-yellow-500/30 shadow-lg">
                        <div className="w-4 h-4 bg-yellow-300 rounded-full animate-pulse shadow-[0_0_20px_rgba(253,224,71,1)]" />
                        <span className="text-white/90 font-bold text-xl tracking-widest uppercase">دور الاستريمر الآن</span>
                      </div>
                      <div className="text-white/55 font-bold text-lg text-center max-w-2xl leading-8">
                        اكشف الإجابة أولًا، وبعدها قرر إذا كنت جاوبتها أو لا.
                      </div>
                      <button
                        onClick={revealChatAnswer}
                        className="group flex flex-col items-center justify-center w-32 h-32 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-yellow-900/30 border-2 border-yellow-500/40 hover:border-yellow-300/70 hover:from-yellow-500/35 hover:to-yellow-900/45 transition-all shadow-[0_0_40px_rgba(234,179,8,0.22)] hover:shadow-[0_0_60px_rgba(234,179,8,0.35)] hover:scale-105 active:scale-95 backdrop-blur-md"
                      >
                        <Eye size={34} className="text-yellow-300 group-hover:text-white transition-colors drop-shadow-[0_0_10px_rgba(253,224,71,0.7)]" />
                        <span className="text-white/90 font-black text-sm mt-2 tracking-wide">كشف الإجابة</span>
                      </button>
                    </>
                  )}
                </div>
              )
            ) : (
              // Friends mode answer display
              showAnswer && (
                <div className="flex flex-col items-center w-full shrink-0 pb-4" style={{ animation: 'zoomBounce 0.5s ease-out' }}>
                  <div className="text-white/40 text-lg font-bold mb-4">✅ الإجابة الصحيحة:</div>
                  <div className="text-4xl md:text-5xl font-black text-green-400" style={{ textShadow: '0 0 40px rgba(74,222,128,0.4)' }}>{currentQ.answer}</div>
                </div>
              )
            )}
          </div>

            {/* Friends Mode Controls */}
            {mode === 'friends' && (
              <div className="mt-12 flex items-center gap-6">
                {!showAnswer ? (
                  <>
                    <button onClick={() => setShowAnswer(true)} className="flex items-center gap-3 bg-red-600 text-white px-14 py-6 rounded-full font-black text-2xl hover:bg-red-500 active:scale-95 transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] border border-red-500/30">
                      <Eye size={28} /> كشف الإجابة
                    </button>
                    <button
                      onClick={skipTimer}
                      className="group flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-900/30 border-2 border-red-500/40 hover:border-red-400/70 hover:from-red-600/40 hover:to-red-900/50 transition-all shadow-[0_0_40px_rgba(220,38,38,0.25)] hover:shadow-[0_0_60px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 backdrop-blur-md"
                    >
                      <FastForward size={32} className="text-red-400 group-hover:text-white transition-colors drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                      <span className="text-white/90 font-black text-sm mt-2 tracking-wide">تخطي الوقت</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-6">
                    <button onClick={friendsCorrect} className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-700 text-white px-14 py-6 rounded-full font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                      <Check size={28} /> صحيحة
                    </button>
                    <button onClick={friendsWrong} className="flex items-center gap-3 bg-gradient-to-r from-red-500 to-red-700 text-white px-14 py-6 rounded-full font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(239,68,68,0.4)]">
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
        @keyframes winnerFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-10px) scale(1.015); } }
      `}</style>
    </>
  );
};
