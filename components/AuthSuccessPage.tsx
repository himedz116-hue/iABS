import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Sparkles, Trophy, Star, Zap, Crown, Rocket, PartyPopper, Confetti } from 'lucide-react';

interface AuthSuccessPageProps {
  username?: string;
  onContinue?: () => void;
}

export const AuthSuccessPage: React.FC<AuthSuccessPageProps> = ({ 
  username = "المستخدم", 
  onContinue 
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    delay: number;
    duration: number;
    rotation: number;
  }>>([]);
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
  }>>([]);
  const [confetti, setConfetti] = useState<Array<{
    id: number;
    x: number;
    color: string;
    delay: number;
    duration: number;
    rotation: number;
  }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation phases
  useEffect(() => {
    const phases = [
      { delay: 0, duration: 800 },      // Phase 0: Initial glow
      { delay: 300, duration: 600 },    // Phase 1: Checkmark appears
      { delay: 800, duration: 1000 },   // Phase 2: Text animation
      { delay: 1500, duration: 500 },   // Phase 3: Celebration starts
      { delay: 2000, duration: 999999 }, // Phase 4: Continuous celebration
    ];

    const timers = phases.map((phase, index) => 
      setTimeout(() => setAnimationPhase(index), phase.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  // Generate celebration particles
  useEffect(() => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4'];
    
    if (animationPhase >= 3) {
      // Initial burst
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: Date.now() + i,
        x: 40 + Math.random() * 20,
        y: 40 + Math.random() * 20,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 3,
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);

      // Add more particles periodically
      const interval = setInterval(() => {
        setParticles(prev => {
          const newOnes = Array.from({ length: 10 }, (_, i) => ({
            id: Date.now() + i + Math.random(),
            x: 30 + Math.random() * 40,
            y: 30 + Math.random() * 40,
            size: 4 + Math.random() * 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: 0,
            duration: 2 + Math.random() * 3,
            rotation: Math.random() * 360,
          }));
          return [...prev.slice(-60), ...newOnes];
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [animationPhase]);

  // Generate stars
  useEffect(() => {
    if (animationPhase >= 2) {
      const newStars = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 8 + Math.random() * 16,
        delay: Math.random() * 1,
      }));
      setStars(newStars);
    }
  }, [animationPhase]);

  // Generate confetti
  useEffect(() => {
    if (animationPhase >= 3) {
      const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3'];
      const newConfetti = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 4,
        rotation: Math.random() * 720 - 360,
      }));
      setConfetti(newConfetti);
    }
  }, [animationPhase]);

  // 3D Card animation canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || animationPhase < 1) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw rotating 3D rings
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      for (let i = 0; i < 3; i++) {
        const radius = 60 + i * 20;
        const rotation = (frame * (0.02 + i * 0.01)) * (i % 2 === 0 ? 1 : -1);
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${59 + i * 30}, ${130 + i * 20}, ${246 + i * 10}, ${0.5 - i * 0.1})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
      }
      
      frame++;
      if (animationPhase < 4) {
        requestAnimationFrame(animate);
      }
    };
    
    const interval = setInterval(() => {
      if (animationPhase >= 4) {
        animate();
      }
    }, 16);
    
    return () => clearInterval(interval);
  }, [animationPhase]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.2) 0%, transparent 60%),
          linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f1f3d 100%)
        `
      }}>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            animation: 'bgFloat 30s linear infinite'
          }}
        />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map(c => (
          <div
            key={c.id}
            className="absolute w-3 h-3"
            style={{
              left: `${c.x}%`,
              top: '-20px',
              backgroundColor: c.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `confettiFall ${c.duration}s ease-in forwards`,
              animationDelay: `${c.delay}s`,
              transform: `rotate(${c.rotation}deg)`
            }}
          />
        ))}
      </div>

      {/* Stars */}
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute pointer-events-none"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animation: `starPop 0.5s ease-out forwards, starFloat 3s ease-in-out infinite`,
            animationDelay: `${star.delay}s, ${star.delay}s`
          }}
        >
          <Sparkles className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" 
            style={{ width: star.size, height: star.size }} />
        </div>
      ))}

      {/* Main success card */}
      <div 
        className="relative z-10 flex flex-col items-center"
        style={{
          transform: animationPhase >= 1 
            ? 'translateY(0) scale(1)' 
            : 'translateY(50px) scale(0.8)',
          opacity: animationPhase >= 1 ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* 3D rotating rings behind checkmark */}
        <canvas
          ref={canvasRef}
          width={200}
          height={120}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: animationPhase >= 2 ? 1 : 0, transition: 'opacity 0.5s' }}
        />

        {/* Success circle with glow */}
        <div 
          className="relative"
          style={{
            transform: animationPhase >= 1 
              ? 'perspective(1000px) rotateX(0) rotateY(0) scale(1)'
              : 'perspective(1000px) rotateX(-30deg) rotateY(30deg) scale(0.5)',
            transition: 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Outer glow rings */}
          <div className="absolute -inset-8 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(34,197,94,0.3), transparent, rgba(34,197,94,0.3), transparent)',
              animation: animationPhase >= 3 ? 'spinSlow 3s linear infinite' : 'none',
              opacity: animationPhase >= 2 ? 1 : 0
            }}
          />
          <div className="absolute -inset-16 rounded-full border-2 border-dashed border-green-500/30"
            style={{
              animation: animationPhase >= 3 ? 'spinSlow 5s linear infinite reverse' : 'none',
              opacity: animationPhase >= 2 ? 0.5 : 0
            }}
          />
          
          {/* Main circle */}
          <div 
            className="relative w-48 h-48 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #22c55e 0%, #16a34a 50%, #15803d 100%)',
              boxShadow: `
                0 0 60px rgba(34,197,94,0.5),
                0 0 100px rgba(34,197,94,0.3),
                inset 0 -10px 30px rgba(0,0,0,0.3),
                inset 0 10px 30px rgba(255,255,255,0.2)
              `,
              transform: 'translateZ(30px)',
              animation: animationPhase >= 3 ? 'pulseGlow 2s ease-in-out infinite' : 'none'
            }}
          >
            {/* Inner highlight */}
            <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-white/20 blur-sm" />
            
            {/* Checkmark */}
            <CheckCircle 
              className={`text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] transition-all duration-700 ${
                animationPhase >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
              style={{ 
                width: animationPhase >= 3 ? 90 : 70,
                height: animationPhase >= 3 ? 90 : 70,
                animation: animationPhase >= 3 ? 'checkBounce 0.6s ease-out' : 'none',
                animationDelay: '0.5s'
              }}
            />
          </div>
        </div>

        {/* Success text */}
        <div 
          className="mt-8 text-center"
          style={{
            opacity: animationPhase >= 2 ? 1 : 0,
            transform: animationPhase >= 2 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDelay: '0.3s'
          }}
        >
          <h1 
            className="text-5xl font-black text-white mb-2"
            style={{
              textShadow: `
                0 0 20px rgba(34,197,94,0.5),
                0 0 40px rgba(34,197,94,0.3),
                0 4px 6px rgba(0,0,0,0.3)
              `,
              animation: animationPhase >= 3 ? 'textGlow 2s ease-in-out infinite' : 'none'
            }}
          >
            تم المصادقة!
          </h1>
          <p className="text-green-400/80 text-xl font-medium tracking-wider mb-4">
            Authentication Successful
          </p>
          
          {/* Username display */}
          <div 
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
            style={{
              transform: animationPhase >= 3 ? 'translateZ(20px)' : 'translateZ(0)',
              transition: 'transform 0.5s ease-out',
              transitionDelay: '0.5s'
            }}
          >
            <Crown className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-bold text-lg">{username}</span>
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          </div>
        </div>

        {/* Celebration icons */}
        <div 
          className="flex items-center gap-8 mt-8"
          style={{
            opacity: animationPhase >= 3 ? 1 : 0,
            transition: 'opacity 0.5s ease-out',
            transitionDelay: '0.8s'
          }}
        >
          {[
            { icon: Trophy, label: 'مرحباً', color: 'text-yellow-400' },
            { icon: Star, label: 'VIP', color: 'text-orange-400' },
            { icon: Rocket, label: 'جاهز', color: 'text-blue-400' },
            { icon: PartyPopper, label: '🎉', color: 'text-pink-400' },
          ].map((item, index) => (
            <div 
              key={index}
              className="flex flex-col items-center gap-2"
              style={{
                transform: animationPhase >= 3 
                  ? `translateY(0) rotate(${Math.sin(index) * 5}deg)`
                  : 'translateY(20px)',
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transitionDelay: `${1 + index * 0.1}s`,
                animation: animationPhase >= 3 ? `bounceIn ${0.5}s ease-out` : 'none',
                animationDelay: `${1 + index * 0.1}s`
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20"
                style={{
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                  animation: animationPhase >= 3 ? `floatIcon ${2 + index * 0.3}s ease-in-out infinite` : 'none',
                  animationDelay: `${index * 0.2}s`
                }}
              >
                <item.icon className={`w-7 h-7 ${item.color}`} />
              </div>
              <span className="text-white/80 text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                animation: `particleExplode ${p.duration}s ease-out forwards`,
                animationDelay: `${p.delay}s`,
                transform: `rotate(${p.rotation}deg)`
              }}
            />
          ))}
        </div>

        {/* Continue button */}
        {onContinue && (
          <button
            onClick={onContinue}
            className="mt-12 group relative px-10 py-4 rounded-2xl font-black text-lg text-white overflow-hidden
              transition-all duration-500 hover:scale-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              boxShadow: '0 20px 40px -15px rgba(34,197,94,0.5), 0 0 30px rgba(34,197,94,0.3)',
              transform: animationPhase >= 4 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
              opacity: animationPhase >= 4 ? 1 : 0,
              transition: 'all 0.5s ease-out',
              transitionDelay: '1.5s'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <span className="relative flex items-center gap-3">
              <Zap className="w-5 h-5" />
              متابعة
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
          </button>
        )}
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/30 to-transparent" />

      {/* CSS Animations */}
      <style>{`
        @keyframes bgFloat {
          0% { transform: translate(0, 0); }
          100% { transform: translate(30px, 30px); }
        }
        
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { 
            box-shadow: 
              0 0 60px rgba(34,197,94,0.5),
              0 0 100px rgba(34,197,94,0.3),
              inset 0 -10px 30px rgba(0,0,0,0.3),
              inset 0 10px 30px rgba(255,255,255,0.2);
          }
          50% { 
            box-shadow: 
              0 0 80px rgba(34,197,94,0.7),
              0 0 120px rgba(34,197,94,0.4),
              inset 0 -10px 30px rgba(0,0,0,0.3),
              inset 0 10px 30px rgba(255,255,255,0.2);
          }
        }
        
        @keyframes checkBounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        
        @keyframes textGlow {
          0%, 100% { 
            text-shadow: 
              0 0 20px rgba(34,197,94,0.5),
              0 0 40px rgba(34,197,94,0.3),
              0 4px 6px rgba(0,0,0,0.3);
          }
          50% { 
            text-shadow: 
              0 0 30px rgba(34,197,94,0.7),
              0 0 60px rgba(34,197,94,0.5),
              0 4px 6px rgba(0,0,0,0.3);
          }
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        
        @keyframes particleExplode {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { 
            transform: translate(
              ${() => (Math.random() - 0.5) * 200}px, 
              ${() => (Math.random() - 0.5) * 200}px
            ) scale(0); 
            opacity: 0; 
          }
        }
        
        @keyframes confettiFall {
          0% { 
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% { 
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes starPop {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        @keyframes starFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};
