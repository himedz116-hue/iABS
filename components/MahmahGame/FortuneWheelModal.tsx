import React, { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';

const WHEEL_OPTIONS = [
  { label: '+100 نقطة', color: '#10B981', action: 'add_100' },
  { label: '-100 نقطة', color: '#EF4444', action: 'sub_100' },
  { label: 'دبل النقاط', color: '#EAB308', action: 'double_points' },
  { label: 'خسارة الدور', color: '#6B7280', action: 'lose_turn' },
  { label: 'إلغاء السؤال', color: '#3B82F6', action: 'cancel_question' },
  { label: 'سرقة 100', color: '#8B5CF6', action: 'steal_100' },
  { label: '+200 نقطة', color: '#14B8A6', action: 'add_200' },
  { label: '-200 نقطة', color: '#F97316', action: 'sub_200' },
];

interface FortuneWheelModalProps {
  onClose: () => void;
  onApplyResult: (action: string) => void;
}

export const FortuneWheelModal: React.FC<FortuneWheelModalProps> = ({ onClose, onApplyResult }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelectedOption(null);
    
    const spins = 5;
    const randomIndex = Math.floor(Math.random() * WHEEL_OPTIONS.length);
    const sliceAngle = 360 / WHEEL_OPTIONS.length;
    const targetAngle = (spins * 360) + (randomIndex * sliceAngle) + (sliceAngle / 2);
    
    setRotation(prev => prev + targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      const result = WHEEL_OPTIONS[randomIndex];
      setSelectedOption(result);
      if (result.action.includes('add') || result.action.includes('double') || result.action.includes('steal')) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[70]">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#EF4444', '#EAB308', '#10B981', '#3B82F6', '#8B5CF6', '#F97316'][i % 6],
                animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 blur-[150px] rounded-full animate-pulse" />
      
      <div className="flex flex-col items-center relative z-10">
        <h2 className="text-5xl font-black text-white italic tracking-tighter mb-2" style={{ textShadow: '0 0 40px rgba(255,0,0,0.5)' }}>
          إنت وحظّك!
        </h2>
        <p className="text-white/40 font-bold mb-8">فتل العجلة وشوف نصيبك 🎰</p>

        {/* The Wheel */}
        <div className="relative w-72 h-72 md:w-80 md:h-80 mb-10">
          {/* Outer glow ring */}
          <div className="absolute -inset-4 rounded-full border-2 border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)]" />
          
          {/* Pointer */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 drop-shadow-2xl">
            <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-white" />
          </div>
          
          <div 
            className="w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.15)]"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              background: `conic-gradient(${WHEEL_OPTIONS.map((opt, i) => 
                `${opt.color} ${(i * 360) / WHEEL_OPTIONS.length}deg ${((i + 1) * 360) / WHEEL_OPTIONS.length}deg`
              ).join(', ')})`
            }}
          >
            {WHEEL_OPTIONS.map((opt, i) => {
              const angle = (i * 360) / WHEEL_OPTIONS.length + (360 / WHEEL_OPTIONS.length) / 2;
              return (
                <div key={i} className="absolute top-0 left-0 w-full h-full" style={{ transform: `rotate(${angle}deg)` }}>
                  <span className="absolute top-6 left-1/2 -translate-x-1/2 text-white font-black text-[10px] md:text-xs whitespace-nowrap origin-bottom" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)', transform: 'rotate(0deg)' }}>
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Center Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-full border-2 border-white/30 flex items-center justify-center shadow-inner z-10">
            <div className="w-3 h-3 bg-white/60 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          </div>
        </div>

        {selectedOption ? (
          <div className="flex flex-col items-center" style={{ animation: 'zoomIn 0.5s ease-out' }}>
            <div className="text-3xl font-black text-white mb-6 py-3 px-8 rounded-2xl border-2 backdrop-blur-md" style={{ borderColor: selectedOption.color, backgroundColor: `${selectedOption.color}30`, boxShadow: `0 0 30px ${selectedOption.color}40` }}>
              {selectedOption.label}
            </div>
            <button
              onClick={() => onApplyResult(selectedOption.action)}
              className="bg-white text-black px-10 py-3 rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              تطبيق ✨
            </button>
          </div>
        ) : (
          <button
            onClick={spinWheel}
            disabled={isSpinning}
            className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-800 text-white px-10 py-4 rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,0,0,0.4)] disabled:opacity-50 disabled:scale-100"
          >
            <Play size={24} className={isSpinning ? 'animate-spin' : ''} />
            {isSpinning ? 'تدور...' : 'افتل العجلة!'}
          </button>
        )}
      </div>

      <button onClick={onClose} disabled={isSpinning} className="absolute top-6 left-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50">
        <X size={24} />
      </button>

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};
