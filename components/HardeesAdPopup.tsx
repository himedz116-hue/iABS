import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Play, Volume2, VolumeX } from 'lucide-react';

const HARDEES_LOGO = '/Hardees-01.png';
const AD_VIDEOS = [
  '/Animated_logos_and_discount_code_202607232019-ezremove.mp4',
  '/89979878.mp4'
];
const AD_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export const HardeesAdPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [currentVideo, setCurrentVideo] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showAd = useCallback(() => {
    const randomVideo = AD_VIDEOS[Math.floor(Math.random() * AD_VIDEOS.length)];
    setCurrentVideo(randomVideo);
    setVideoEnded(false);
    setProgress(0);
    setCountdown(0);
    setIsVisible(true);
  }, []);

  // Timer to show ad every 10 minutes
  useEffect(() => {
    timerRef.current = setInterval(() => {
      showAd();
    }, AD_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showAd]);

  // Video progress tracking
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
      const remaining = Math.ceil(videoRef.current.duration - videoRef.current.currentTime);
      setCountdown(remaining);
    }
  };

  const handleVideoEnd = () => {
    setVideoEnded(true);
    setProgress(100);
    setCountdown(0);
  };

  const handleClose = () => {
    setIsVisible(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
          />

          {/* Popup Container */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-lg bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-3xl border border-orange-500/30 shadow-[0_0_60px_rgba(234,88,12,0.3)] overflow-hidden">

              {/* Top Glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-red-500 to-orange-600" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />

              {/* Skip / Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-20 bg-black/70 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-300 border border-white/20 hover:border-red-400 shadow-lg backdrop-blur-sm group"
                title="تخطي الإعلان"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>

              {/* Header with Logo */}
              <div className="relative pt-6 pb-3 px-6 flex items-center justify-center gap-4">
                <motion.img
                  src={HARDEES_LOGO}
                  alt="Hardees"
                  className="h-16 md:h-20 object-contain drop-shadow-[0_0_30px_rgba(234,88,12,0.6)]"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                />
              </div>

              {/* Discount Banner */}
              <div className="mx-6 mb-4">
                <motion.div
                  className="relative bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 rounded-2xl p-4 text-center overflow-hidden"
                  animate={{ boxShadow: ['0 0 20px rgba(234,88,12,0.4)', '0 0 40px rgba(234,88,12,0.7)', '0 0 20px rgba(234,88,12,0.4)'] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
                  <p className="text-white/80 text-sm font-bold mb-1">🔥 استخدم الآن في هارديز 🔥</p>
                  <div className="flex items-center justify-center gap-3">
                    <Tag className="w-5 h-5 text-yellow-300" />
                    <span className="text-3xl md:text-4xl font-black text-white tracking-wider" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                      UP25
                    </span>
                    <Tag className="w-5 h-5 text-yellow-300" />
                  </div>
                  <p className="text-yellow-200 text-lg font-black mt-1">يخصم 25% من طلبك! 🍔</p>
                </motion.div>
              </div>

              {/* Video Section */}
              <div className="mx-6 mb-4">
                <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10">
                  {/* Mute Button */}
                  <button
                    onClick={toggleMute}
                    className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors border border-white/20"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <video
                    ref={videoRef}
                    src={currentVideo}
                    autoPlay
                    muted={isMuted}
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnd}
                    className="w-full aspect-video object-cover"
                  />

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                      style={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Countdown */}
                  {!videoEnded && countdown > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-black px-2 py-1 rounded-lg border border-white/20">
                      {countdown} ثانية
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <div className="px-6 pb-6">
                <motion.button
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all duration-500 bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 shadow-[0_0_30px_rgba(234,88,12,0.5)] cursor-pointer"
                  whileTap={{ scale: 0.97 }}
                >
                  <X className="w-5 h-5" />
                  تخطي ومتابعة اللعب
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
