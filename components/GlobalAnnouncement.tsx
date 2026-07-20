
import React, { useState, useEffect } from 'react';
import { Megaphone, X, Radio, ShieldAlert, Cpu } from 'lucide-react';

interface GlobalAnnouncementProps {
    message: string;
    onClose: () => void;
}

export const GlobalAnnouncement: React.FC<GlobalAnnouncementProps> = ({ message, onClose }) => {
    const [visible, setVisible] = useState(false);
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Trigger animations
        const timer = setTimeout(() => setVisible(true), 100);

        // Countdown interval
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Close logic
        const closeTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 1000);
        }, 10000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            clearTimeout(closeTimer);
        };
    }, [onClose]);

    return (
        <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-6 transition-all duration-700 ${visible ? 'bg-black/90 backdrop-blur-xl opacity-100' : 'bg-transparent backdrop-blur-0 opacity-0 pointer-events-none'}`}>

            {/* Dynamic Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-red-600/10 animate-pulse rounded-full blur-[200px]"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            </div>

            <div className={`relative max-w-2xl w-full transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) transform ${visible ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-20 opacity-0'}`}>
                {/* Sleek Neon Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-3xl blur-xl opacity-40 animate-pulse"></div>

                <div className="relative backdrop-blur-2xl bg-black/80 rounded-3xl border border-red-500/30 overflow-hidden shadow-[0_20px_50px_rgba(255,0,0,0.2)]">
                    
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>

                    <div className="p-8 md:p-10 flex flex-col items-center text-center relative z-10">
                        {/* Compact Animated Icon */}
                        <div className="mb-6 relative">
                            <div className="absolute inset-0 bg-red-500 blur-2xl opacity-40 animate-ping"></div>
                            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-900 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(255,0,0,0.5)] border-2 border-red-400/50">
                                <Radio size={40} className="text-white animate-pulse" />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4 mb-8 w-full max-w-full">
                            <div className="flex items-center justify-center gap-2 text-red-500 font-black tracking-[0.3em] text-xs uppercase italic drop-shadow-[0_0_8px_red]">
                                <ShieldAlert size={14} /> إعلان إداري هام <ShieldAlert size={14} />
                            </div>

                            <h2 className="text-3xl md:text-4xl font-black text-white leading-relaxed tracking-tight drop-shadow-[0_5px_15px_rgba(255,0,0,0.4)] px-4 break-words whitespace-pre-wrap">
                                {message}
                            </h2>
                            <p className="text-white/50 font-bold text-sm leading-relaxed mt-2">
                                رسالة رسمية من النظام. يرجى المتابعة والالتزام الفوري.
                            </p>
                        </div>

                        {/* Minimalist Countdown Badge */}
                        <div className="flex items-center justify-center gap-4 w-full">
                            <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent"></div>
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-red-500/20 rounded-full blur-md group-hover:bg-red-500/40 transition-all"></div>
                                <div className="relative bg-black border border-red-500/30 px-6 py-2.5 rounded-full flex items-center gap-3 shadow-inner">
                                    <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-lg shadow-[0_0_15px_red]">
                                        {countdown}
                                    </div>
                                    <span className="text-xs font-black text-white/70 tracking-widest uppercase">Syncing...</span>
                                </div>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                        </div>
                    </div>
                    
                    {/* Bottom Security Overlay */}
                    <div className="absolute bottom-0 left-0 w-full h-2 bg-zinc-900 border-t border-white/5">
                        <div
                            className="h-full bg-red-600 shadow-[0_0_20px_red] transition-all duration-[10000ms] ease-linear"
                            style={{ width: visible ? '100%' : '0%' }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Floating Meta Info */}
            <div className="absolute bottom-10 left-10 flex items-center gap-4 opacity-20">
                <Cpu size={24} className="text-white animate-spin-slow" />
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Protocol: BROADCAST_EVENT</span>
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Status: ENFORCED_VIEW</span>
                </div>
            </div>

            {/* Right Meta Info */}
            <div className="absolute bottom-10 right-10 flex flex-col items-end opacity-20">
                <span className="text-xs font-black text-white italic tracking-tighter uppercase">iABS System Access 2.0</span>
                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-1">iABS Operation</span>
            </div>
        </div>
    );
};
