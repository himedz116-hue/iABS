import React, { useState, useEffect, useRef } from 'react';
import { Fingerprint, Shield, CheckCircle, AlertCircle, Zap } from 'lucide-react';

interface FingerprintAuthPageProps {
  onSuccess: () => void;
}

export const FingerprintAuthPage: React.FC<FingerprintAuthPageProps> = ({ onSuccess }) => {
  const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'failed'>('idle');
  const [scanLine, setScanLine] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number }>>([]);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [pulseRadius, setPulseRadius] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Generate fingerprint pattern on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);
    
    // Draw concentric arcs for fingerprint effect
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.lineWidth = 1;
    
    for (let r = 30; r < 120; r += 8) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0.3 * Math.PI, 0.7 * Math.PI);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 1.3 * Math.PI, 1.7 * Math.PI);
      ctx.stroke();
    }

    // Add some wave patterns
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.1)';
    for (let r = 40; r < 110; r += 12) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0.5 * Math.PI, 1.5 * Math.PI);
      ctx.stroke();
    }

    // Draw fingerprint ridges detail
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 20; i++) {
      const startAngle = (i / 20) * Math.PI * 2;
      const endAngle = startAngle + 0.3 * Math.PI;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 50 + (i % 5) * 15, startAngle, endAngle);
      ctx.stroke();
    }

  }, []);

  // Animate scan line
  useEffect(() => {
    if (scanPhase === 'scanning') {
      const interval = setInterval(() => {
        setScanLine(prev => (prev + 1) % 100);
      }, 20);
      return () => clearInterval(interval);
    }
  }, [scanPhase]);

  // Animate pulse effect
  useEffect(() => {
    if (scanPhase === 'scanning' || scanPhase === 'processing') {
      const animate = () => {
        setPulseRadius(prev => (prev + 2) % 150);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }
  }, [scanPhase]);

  // Scan progress
  useEffect(() => {
    if (scanPhase === 'scanning') {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            setScanPhase('processing');
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [scanPhase]);

  // Generate particles
  useEffect(() => {
    if (scanPhase === 'scanning' || scanPhase === 'processing') {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 2,
      }));
      setParticles(prev => [...prev.slice(-20), ...newParticles]);
    }
  }, [scanPhase]);

  const handleStartScan = () => {
    setScanPhase('scanning');
    setScanProgress(0);
    setParticles([]);
    setRipples([]);

    // Simulate scan completion
    setTimeout(() => {
      setScanPhase('processing');
    }, 5000);
  };

  // Handle success/failure after processing
  useEffect(() => {
    if (scanPhase === 'processing' && scanProgress >= 100) {
      const timer = setTimeout(() => {
        setScanPhase('success');
        
        // Add success ripples
        setRipples([
          { id: 1, x: 50, y: 50 },
          { id: 2, x: 30, y: 40 },
          { id: 3, x: 70, y: 60 },
        ]);

        setTimeout(onSuccess, 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [scanPhase, scanProgress, onSuccess]);

  const handleRetry = () => {
    setScanPhase('idle');
    setScanProgress(0);
    setParticles([]);
    setRipples([]);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" 
          style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}
        />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
            style={{ transform: 'rotateY(15deg) rotateX(5deg)', animation: 'float 3s ease-in-out infinite' }}>
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            بروتوكول الأمان
          </h1>
        </div>
        <p className="text-blue-400/70 font-medium tracking-wider text-sm uppercase">Security Protocol</p>
      </div>

      {/* Main fingerprint scanner */}
      <div className="relative" style={{ perspective: '1000px' }}>
        {/* Outer ring glow */}
        <div 
          className={`absolute inset-0 rounded-full transition-all duration-500 ${scanPhase === 'scanning' ? 'scale-110 opacity-50' : 'scale-100 opacity-30'}`}
          style={{
            background: `radial-gradient(circle, transparent 40%, rgba(59,130,246,${scanPhase === 'idle' ? '0.1' : '0.3'}) 70%, transparent 100%)`,
            animation: scanPhase === 'scanning' ? 'pulseRing 1.5s ease-in-out infinite' : 'none'
          }}
        />

        {/* Scanner container */}
        <div 
          className="relative w-80 h-80 rounded-full flex items-center justify-center transition-all duration-700"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(30,30,50,0.9) 0%, rgba(15,15,25,0.95) 100%)',
            border: `4px solid ${scanPhase === 'success' ? '#22c55e' : scanPhase === 'failed' ? '#ef4444' : 'rgba(59,130,246,0.5)'}`,
            boxShadow: `
              0 0 60px ${scanPhase === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.3)'},
              inset 0 0 60px rgba(59,130,246,0.1),
              0 25px 50px -12px rgba(0,0,0,0.5)
            `,
            transform: scanPhase === 'scanning' ? 'rotateY(5deg) rotateX(-5deg)' : 'rotateY(0) rotateX(0)',
            animation: scanPhase === 'processing' ? 'subtleFloat 2s ease-in-out infinite' : 'none'
          }}
        >
          {/* Pulse rings */}
          {scanPhase === 'scanning' && (
            <>
              <div 
                className="absolute rounded-full border border-blue-400/30"
                style={{ width: `${150 + pulseRadius}px`, height: `${150 + pulseRadius}px` }}
              />
              <div 
                className="absolute rounded-full border border-purple-400/20"
                style={{ width: `${180 + pulseRadius * 1.2}px`, height: `${180 + pulseRadius * 1.2}px` }}
              />
            </>
          )}

          {/* Canvas fingerprint pattern */}
          <canvas 
            ref={canvasRef}
            width={240}
            height={240}
            className="absolute"
          />

          {/* Scan line */}
          {scanPhase === 'scanning' && (
            <div 
              className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              style={{
                top: `${scanLine}%`,
                boxShadow: '0 0 20px rgba(34,211,238,0.8), 0 0 40px rgba(34,211,238,0.4)',
                animation: 'scanLine 0.5s ease-in-out infinite'
              }}
            />
          )}

          {/* Center icon */}
          <div className={`relative z-10 transition-all duration-500 ${
            scanPhase === 'idle' ? 'scale-100 opacity-100' :
            scanPhase === 'scanning' ? 'scale-90 opacity-80' :
            scanPhase === 'processing' ? 'scale-75 opacity-60' :
            scanPhase === 'success' ? 'scale-110' : 'scale-90'
          }`}>
            {scanPhase === 'idle' && (
              <div className="flex flex-col items-center">
                <Fingerprint className="w-24 h-24 text-blue-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]" />
                <span className="mt-4 text-blue-400/60 text-sm font-medium tracking-wider">ضع إصبعك هنا</span>
              </div>
            )}
            {scanPhase === 'scanning' && (
              <div className="flex flex-col items-center">
                <Fingerprint className="w-24 h-24 text-cyan-400 animate-pulse" />
                <span className="mt-4 text-cyan-400 text-sm font-medium tracking-wider animate-pulse">جاري المسح...</span>
              </div>
            )}
            {scanPhase === 'processing' && (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-4 border-purple-500/50 border-t-purple-400 animate-spin" />
                <span className="mt-4 text-purple-400 text-sm font-medium tracking-wider">جاري التحقق...</span>
              </div>
            )}
            {scanPhase === 'success' && (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-24 h-24 text-green-400 drop-shadow-[0_0_40px_rgba(34,197,94,0.8)]" />
                <span className="mt-4 text-green-400 text-sm font-medium tracking-wider">تم التحقق!</span>
              </div>
            )}
            {scanPhase === 'failed' && (
              <div className="flex flex-col items-center">
                <AlertCircle className="w-24 h-24 text-red-400 drop-shadow-[0_0_40px_rgba(239,68,68,0.8)]" />
                <span className="mt-4 text-red-400 text-sm font-medium tracking-wider">فشل التحقق</span>
              </div>
            )}
          </div>

          {/* Success ripples */}
          {ripples.map(ripple => (
            <div
              key={ripple.id}
              className="absolute rounded-full border-2 border-green-400/50"
              style={{
                width: '100%',
                height: '100%',
                animation: `rippleOut 1.5s ease-out forwards`,
                animationDelay: `${ripple.id * 0.2}s`
              }}
            />
          ))}
        </div>

        {/* Progress ring */}
        {(scanPhase === 'scanning' || scanPhase === 'processing') && (
          <svg className="absolute -inset-4 w-[350px] h-[350px] -rotate-90">
            <circle
              cx="175"
              cy="175"
              r="165"
              fill="none"
              stroke="rgba(59,130,246,0.1)"
              strokeWidth="4"
            />
            <circle
              cx="175"
              cy="175"
              r="165"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${scanProgress * 10.36} 1036`}
              className="transition-all duration-100"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animation: `particleFloat ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
              opacity: 0.6
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <div className="absolute bottom-32 text-center">
        {scanPhase === 'idle' && (
          <button
            onClick={handleStartScan}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white font-black text-lg tracking-wider
              transition-all duration-500 hover:scale-110 active:scale-95 overflow-hidden"
            style={{
              transform: 'rotateX(10deg) translateZ(20px)',
              boxShadow: '0 20px 40px -15px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.3)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <span className="relative flex items-center gap-3">
              <Zap className="w-5 h-5" />
              بدء المسح البيومتري
            </span>
          </button>
        )}

        {scanPhase === 'scanning' && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl font-black text-white">{scanProgress}%</div>
            <div className="text-blue-400/70 text-sm font-medium tracking-wider">جاري قراءة البصمة...</div>
          </div>
        )}

        {scanPhase === 'processing' && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl font-black text-white animate-pulse">التحقق من البيانات</div>
            <div className="text-purple-400/70 text-sm font-medium tracking-wider">يرجى الانتظار...</div>
          </div>
        )}

        {scanPhase === 'failed' && (
          <button
            onClick={handleRetry}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl text-white font-black text-lg tracking-wider
              transition-all duration-500 hover:scale-110 active:scale-95"
          >
            إعادة المحاولة
          </button>
        )}
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />

      {/* CSS Animations */}
      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        
        @keyframes scanLine {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes subtleFloat {
          0%, 100% { transform: rotateY(5deg) rotateX(-5deg) translateY(0); }
          50% { transform: rotateY(5deg) rotateX(-5deg) translateY(-10px); }
        }
        
        @keyframes rippleOut {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        @keyframes particleFloat {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -20px) rotate(90deg); }
          50% { transform: translate(-10px, -40px) rotate(180deg); }
          75% { transform: translate(20px, -20px) rotate(270deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotateY(15deg); }
          50% { transform: translateY(-10px) rotateY(20deg); }
        }
      `}</style>
    </div>
  );
};
