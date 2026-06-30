import React, { useState, useEffect } from 'react';

export const IabsLogo: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [animationState, setAnimationState] = useState<'hidden' | 'emerging' | 'impact' | 'idle'>('hidden');

    useEffect(() => {
        const timer1 = setTimeout(() => setAnimationState('emerging'), 500);
        const timer2 = setTimeout(() => setAnimationState('impact'), 1300);
        const timer3 = setTimeout(() => setAnimationState('idle'), 1800);
        return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
    }, []);

    return (
        <>
        <style>{`
            @keyframes neon-core {
                0%, 100% { opacity: 0.9; stroke-width: 2; }
                50% { opacity: 1; stroke-width: 2.5; }
            }
            @keyframes neon-glow {
                0%, 100% { opacity: 0.15; filter: drop-shadow(0 0 4px rgba(255,0,0,0.4)); }
                50% { opacity: 0.35; filter: drop-shadow(0 0 12px rgba(255,0,0,0.8)); }
            }
            @keyframes neon-shift {
                0% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -40; }
            }
            @keyframes neon-color {
                0%, 100% { stroke: #ff0000; }
                33% { stroke: #ff4400; }
                66% { stroke: #ff2200; }
            }
            .animate-neon-core { animation: neon-core 2.5s ease-in-out infinite, neon-color 4s ease-in-out infinite, neon-shift 3s linear infinite; stroke-dasharray: 8 4; }
            .animate-neon-glow { animation: neon-glow 2.5s ease-in-out infinite; }
        `}</style>
        <div className="flex items-center justify-center flex-row gap-0 relative" dir="ltr">
            {/* Impact Flash Effect */}
            <div className={`absolute inset-[-50%] z-40 pointer-events-none transition-opacity duration-300 ${animationState === 'impact' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-full h-full bg-red-500/30 blur-[100px] animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 blur-[50px] rounded-full animate-ping" style={{animationDuration:'0.6s'}}></div>
            </div>

            {/* iABS Logo (Original High-Quality Design) */}
            <h1 
                className={`relative text-5xl md:text-7xl font-black tracking-tighter leading-none select-none group/name z-10 ${animationState === 'impact' ? 'animate-shake-intense' : ''}`} 
                dir="ltr"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative inline-block hover:scale-105 transition-transform duration-700 cursor-default">
                    <div className={`absolute inset-[-60%] bg-gradient-to-r from-[#FF2D2D]/0 via-[#FF2D2D]/5 to-[#FF2D2D]/0 blur-[150px] ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}></div>
                    <div className={`absolute inset-[-50%] [background:radial-gradient(circle,rgba(255,255,255,0.08),transparent)] blur-[130px] ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000 animate-pulse`}></div>

                    <div 
                         className={`relative z-10 -translate-y-1 -translate-x-1 ${isHovered ? 'animate-glitch -translate-y-4 -translate-x-2' : ''} transition-transform duration-500`}
                         style={{ clipPath: 'polygon(-10% -10%, 110% -10%, 110% 35%, 90% 48%, 82% 52%, 75% 38%, 68% 32%, 60% 42%, 52% 38%, 45% 45%, 38% 42%, 30% 58%, 22% 55%, 15% 62%, 10% 60%, -10% 65%)' }}
                    >
                        <span className="relative">
                            <span style={{ color: '#FF2D2D', textShadow: '0 0 30px rgba(255, 45, 45, 0.3)' }} className="[-webkit-text-stroke:2px_black] md:[-webkit-text-stroke:6px_black] [paint-order:stroke_fill]">i</span>
                            <span className="text-white [-webkit-text-stroke:2px_black] md:[-webkit-text-stroke:6px_black] [paint-order:stroke_fill]">ABS</span>
                        </span>
                        <div className={`absolute inset-0 bg-gradient-to-t from-white/10 to-transparent ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 pointer-events-none`}></div>
                    </div>

                    <div 
                        className={`absolute inset-0 z-10 translate-y-1 translate-x-1 ${isHovered ? 'animate-glitch [animation-delay:0.1s] translate-y-4 translate-x-2' : ''} transition-transform duration-500`}
                        style={{ clipPath: 'polygon(-10% 65%, 10% 60%, 15% 62%, 22% 55%, 30% 58%, 38% 42%, 45% 45%, 52% 38%, 60% 42%, 68% 32%, 75% 38%, 82% 52%, 90% 48%, 110% 35%, 110% 110%, -10% 110%)' }}
                    >
                        <span className="relative">
                            <span style={{ color: '#FF2D2D', textShadow: '0 0 30px rgba(255, 45, 45, 0.3)' }} className="[-webkit-text-stroke:2px_black] md:[-webkit-text-stroke:6px_black] [paint-order:stroke_fill]">i</span>
                            <span className="text-white [-webkit-text-stroke:1px_black] md:[-webkit-text-stroke:3px_black] [paint-order:stroke_fill]">ABS</span>
                        </span>
                    </div>

                    <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                         <path d="M0 65 L10 60 L15 62 L22 55 L30 58 L38 42 L45 45 L52 38 L60 42 L68 32 L75 38 L82 52 L90 48 L100 35" stroke="#ff0000" strokeWidth="6" fill="none" className="animate-neon-glow" strokeLinecap="round" strokeLinejoin="round" />
                         <path d="M0 65 L10 60 L15 62 L22 55 L30 58 L38 42 L45 45 L52 38 L60 42 L68 32 L75 38 L82 52 L90 48 L100 35" stroke="#ff0000" strokeWidth="2" fill="none" className="animate-neon-core" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </h1>

            {/* ARENA text - emerges from behind iABS */}
            <div 
                className={`relative mr-2 md:mr-4 transition-all duration-700 ease-out z-0 
                ${animationState === 'emerging' ? 'animate-emerge' : ''}
                ${animationState === 'hidden' ? 'opacity-0' : 'opacity-100'}`}
                dir="ltr"
            >
                <div className="flex items-center">
                    <div className={`w-px h-10 md:h-14 bg-red-500/50 ml-4 md:ml-6 mr-2 md:mr-3 ${animationState === 'impact' ? 'bg-white' : ''} transition-colors duration-200`}></div>
                    <h2 className={`text-3xl md:text-5xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.3)] transition-all ${animationState === 'impact' ? 'scale-110' : 'scale-100'}`}
                        style={{
                            textShadow: '0 2px 0 #8b0000, 0 4px 15px rgba(0,0,0,0.5), 0 0 30px rgba(255,0,0,0.2)',
                            WebkitTextStroke: '0.5px rgba(255,255,255,0.15)'
                        }}>
                        ARENA
                    </h2>
                </div>
            </div>
        </div>
        </>
    );
};