import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { Home, Lock, ShieldCheck, Unlock, Users, Play, RefreshCw, Eye, EyeOff, Crown } from 'lucide-react';

interface SafeCodeGameProps {
  onHome: () => void;
  isOBS?: boolean;
}

interface CodeEntry {
  id: string;
  code: string;
  username: string;
  isCorrect: boolean;
  timestamp: number;
}

export const SafeCodeGame: React.FC<SafeCodeGameProps> = ({ onHome, isOBS = false }) => {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'won'>('setup');
  const [winningCode, setWinningCode] = useState('');
  const [tempWinningCode, setTempWinningCode] = useState('');
  const [entries, setEntries] = useState<CodeEntry[]>([]);
  const [hostPassword, setHostPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [vaultShake, setVaultShake] = useState(false);
  const [vaultGlow, setVaultGlow] = useState(false);
  const [showFeed, setShowFeed] = useState(true);
  const entriesEndRef = useRef<HTMLDivElement>(null);

  const generateWinningCode = useCallback(() => {
    const code = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setWinningCode(code);
    setTempWinningCode(code);
    return code;
  }, []);

  useEffect(() => {
    if (!isOBS) return;
    
    const unsubscribe = chatService.onMessage((msg) => {
      if (gameState !== 'playing') return;
      const content = msg.content.replace(/\[emote:\d+:[^\]]*\]/gi, '').replace(/<[^>]*>/g, '').trim();
      const codeMatch = content.match(/\b(\d{4})\b/);
      if (!codeMatch) return;

      const code = codeMatch[1];
      const isCorrect = code === winningCode;

      setEntries(prev => {
        const exists = prev.some(e => e.code === code && e.username === msg.user.username);
        if (exists) return prev;
        return [...prev, {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          code,
          username: msg.user.username,
          isCorrect,
          timestamp: Date.now()
        }];
      });

      if (isCorrect && isLocked) {
        setIsLocked(false);
        setVaultShake(true);
        setVaultGlow(true);
        setTimeout(() => setVaultShake(false), 600);
        setTimeout(() => setVaultGlow(false), 3000);
        setGameState('won');
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [gameState, winningCode, isLocked, isOBS]);

  useEffect(() => {
    if (entriesEndRef.current) {
      entriesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries]);

  const handleHostPasswordSubmit = () => {
    if (hostPassword === '1234') {
      setShowPasswordInput(false);
      setHostPassword('');
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  };

  const startGame = () => {
    let code = tempWinningCode;
    if (code.length !== 4) {
      code = generateWinningCode();
    } else {
      setWinningCode(code);
    }
    setEntries([]);
    setIsLocked(true);
    setVaultShake(false);
    setVaultGlow(false);
    setGameState('playing');
  };

  const resetGame = () => {
    setGameState('setup');
    setEntries([]);
    setIsLocked(true);
    setVaultShake(false);
    setVaultGlow(false);
  };

  const toggleFeed = () => {
    setShowFeed(prev => !prev);
  };

  const renderVault = () => {
    return (
      <div className="relative flex flex-col items-center justify-center">
        {/* Vault Body */}
        <div className={`relative transition-all duration-500 ${vaultShake ? 'animate-shake' : ''}`}>
          {/* Glow Effect */}
          {vaultGlow && (
            <div className="absolute -inset-20 bg-green-500/30 blur-[80px] rounded-full animate-pulse" />
          )}
          
          {/* Vault Container */}
          <div className={`relative w-64 h-72 md:w-80 md:h-96 rounded-[2.5rem] border-4 transition-all duration-500 ${
            isLocked 
              ? 'bg-gradient-to-b from-zinc-800 to-zinc-900 border-zinc-600 shadow-[0_0_60px_rgba(0,0,0,0.8)]' 
              : 'bg-gradient-to-b from-green-900/80 to-green-950/90 border-green-500/50 shadow-[0_0_100px_rgba(34,197,94,0.4)]'
          }`}>
            
            {/* Vault Door */}
            <div className="absolute inset-4 rounded-[2rem] border-2 border-zinc-600/50 flex items-center justify-center overflow-hidden">
              {/* Inner Mechanism */}
              <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 transition-all duration-700 ${
                isLocked ? 'bg-zinc-900 border-zinc-700' : 'bg-green-500/20 border-green-400 shadow-[0_0_40px_rgba(34,197,94,0.5)]'
              }`}>
                {/* Lock Indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isLocked ? (
                    <Lock size={48} className="text-zinc-500" />
                  ) : (
                    <Unlock size={48} className="text-green-400 animate-bounce" />
                  )}
                </div>

                {/* Spinning Ring */}
                {isLocked && (
                  <div className="absolute inset-[-8px] rounded-full border-2 border-dashed border-zinc-600/50 animate-spin" style={{ animationDuration: '20s' }} />
                )}
              </div>

              {/* Corner Bolts */}
              {[0, 90, 180, 270].map((deg, i) => (
                <div key={i} className="absolute w-4 h-4 bg-zinc-600 rounded-full border-2 border-zinc-500"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${deg}deg) translate(80px) rotate(-90deg)`
                  }} />
              ))}
            </div>

            {/* Status Text */}
            <div className="absolute -bottom-12 left-0 right-0 text-center">
              <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full border backdrop-blur-md ${
                isLocked 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              }`}>
                {isLocked ? (
                  <>
                    <Lock size={16} />
                    <span className="font-black text-sm tracking-widest">مقفل</span>
                  </>
                ) : (
                  <>
                    <Unlock size={16} />
                    <span className="font-black text-sm tracking-widest">مفتوح</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Winning Code Display (for host) */}
        {gameState === 'playing' && (
          <div className="mt-20 flex items-center gap-3">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-6 py-3 backdrop-blur-md">
              <div className="text-yellow-500/60 text-[10px] font-bold uppercase tracking-widest mb-1">الرمز السري</div>
              <div className="text-yellow-400 font-black text-2xl tracking-[0.3em] font-mono">{winningCode}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLiveFeed = () => {
    if (!showFeed) return null;

    return (
      <div className="w-full max-w-md mx-auto mt-8">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/60 font-black text-xs uppercase tracking-widest">البث المباشر</span>
          </div>
          <button onClick={toggleFeed} className="text-white/40 hover:text-white transition-colors">
            <EyeOff size={14} />
          </button>
        </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-white/30 font-bold text-sm">
              في انتظار الأكواد...
            </div>
          ) : (
            <div className="space-y-2">
              {entries.slice(-20).map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-500 animate-in slide-in-from-right ${
                    entry.isCorrect
                      ? 'bg-green-500/20 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                      entry.isCorrect ? 'bg-green-500 text-black' : 'bg-white/10 text-white/70'
                    }`}>
                      {entry.isCorrect ? <Crown size={14} /> : entry.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white/80 font-bold text-sm">{entry.username}</span>
                  </div>
                  <div className={`font-black text-lg tracking-wider font-mono ${
                    entry.isCorrect ? 'text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'text-white/60'
                  }`}>
                    {entry.code.split('').map((digit, i) => (
                      <span key={i} className="inline-block animate-in zoom-in" style={{ animationDelay: `${i * 100}ms` }}>
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div ref={entriesEndRef} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSetup = () => {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto gap-8">
        {/* Vault Preview */}
        <div className="relative">
          <div className="absolute inset-0 bg-red-600/10 blur-[80px] rounded-full" />
          <div className={`relative w-48 h-56 rounded-[2rem] border-4 bg-gradient-to-b from-zinc-800 to-zinc-900 border-zinc-600 shadow-[0_0_60px_rgba(0,0,0,0.8)] flex items-center justify-center`}>
            <Lock size={64} className="text-zinc-500" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">💰 البنك الآمن</h1>
          <p className="text-white/50 font-bold text-lg">SAFE CODE</p>
        </div>

        <div className="w-full space-y-4">
          {/* Host Password */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={20} className="text-yellow-500" />
              <span className="text-white font-black text-sm uppercase tracking-widest">تحكم المشرف</span>
            </div>
            
            {!showPasswordInput ? (
              <button
                onClick={() => setShowPasswordInput(true)}
                className="w-full py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 font-black text-sm transition-all hover:scale-[1.02]"
              >
                أدخال كلمة مرور المشرف
              </button>
            ) : (
              <div className="flex gap-3">
                <input
                  type="password"
                  value={hostPassword}
                  onChange={(e) => setHostPassword(e.target.value)}
                  placeholder="كلمة المرور..."
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-center tracking-widest focus:outline-none focus:border-yellow-500/50"
                  onKeyPress={(e) => e.key === 'Enter' && handleHostPasswordSubmit()}
                />
                <button
                  onClick={handleHostPasswordSubmit}
                  className="px-6 py-3 bg-yellow-500 text-black rounded-xl font-black text-sm hover:scale-105 transition-all"
                >
                  دخول
                </button>
              </div>
            )}
          </div>

          {/* Game Controls */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Play size={20} className="text-green-500" />
              <span className="text-white font-black text-sm uppercase tracking-widest">بدء اللعبة</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2 block">الرمز الفائز (4 أرقام)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={tempWinningCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setTempWinningCode(val.padStart(4, '0'));
                  }}
                  placeholder="0000"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-2xl text-center tracking-[0.5em] focus:outline-none focus:border-green-500/50"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startGame}
                  className="flex-1 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-xl text-white font-black text-lg transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  بدء اللعبة
                </button>
                <button
                  onClick={generateWinningCode}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white font-black transition-all hover:scale-105"
                  title="توليد رمز عشوائي"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGameOver = () => {
    const winner = entries.find(e => e.isCorrect);
    
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto gap-8">
        <div className="relative">
          <div className="absolute -inset-10 bg-green-500/20 blur-[100px] rounded-full animate-pulse" />
          <div className={`relative w-48 h-56 rounded-[2rem] border-4 bg-gradient-to-b from-green-900/80 to-green-950/90 border-green-500/50 shadow-[0_0_100px_rgba(34,197,94,0.4)] flex items-center justify-center`}>
            <Unlock size={64} className="text-green-400 animate-bounce" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-black text-green-400 mb-2 tracking-tight drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]">
            🎉 تم فتح الخزنة!
          </h2>
          {winner && (
            <div className="flex flex-col items-center gap-3 mt-4">
              <div className="flex items-center gap-3">
                <Crown size={24} className="text-yellow-400" />
                <span className="text-yellow-400 font-black text-xl">{winner.username}</span>
              </div>
              <div className="bg-green-500/20 border border-green-500/40 rounded-2xl px-8 py-4">
                <div className="text-green-400/60 text-xs font-bold uppercase tracking-widest mb-1">الرمز الفائز</div>
                <div className="text-green-400 font-black text-3xl tracking-[0.5em] font-mono">{winningCode}</div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={resetGame}
          className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black transition-all hover:scale-105 flex items-center gap-2"
        >
          <RefreshCw size={18} />
          لعبة جديدة
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-500/5 blur-[150px] rounded-full" />
      
      {/* Protocol Lines Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"
            style={{
              top: `${10 + i * 5}%`,
              left: '0',
              right: '0',
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full flex flex-col items-center gap-8">
        {/* Header */}
        <div className="flex items-center justify-between w-full max-w-4xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Lock size={20} className="text-green-500" />
              <span className="text-white font-black text-lg tracking-tight">البنك الآمن</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-white/40 text-xs font-bold uppercase tracking-widest">SAFE CODE PROTOCOL</span>
          </div>

          <div className="flex items-center gap-3">
            {gameState === 'playing' && (
              <button
                onClick={toggleFeed}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-md transition-all ${
                  showFeed 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-white/5 border-white/10 text-white/50'
                }`}
              >
                {showFeed ? <Eye size={14} /> : <EyeOff size={14} />}
                <span className="text-xs font-bold">البث المباشر</span>
              </button>
            )}
            <button
              onClick={onHome}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/70 hover:text-white transition-all"
            >
              <Home size={18} />
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="w-full max-w-4xl flex flex-col items-center">
          {gameState === 'setup' && renderSetup()}
          {gameState === 'playing' && (
            <>
              {renderVault()}
              {renderLiveFeed()}
            </>
          )}
          {gameState === 'won' && renderGameOver()}
        </div>

        {/* Status Bar */}
        {gameState === 'playing' && (
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
              <span className="text-white/50 text-xs font-bold uppercase tracking-widest">
                {isLocked ? 'في الانتظار' : 'تم الفتح'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-white/40" />
              <span className="text-white/50 text-xs font-bold">{entries.length} محاولة</span>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
};
