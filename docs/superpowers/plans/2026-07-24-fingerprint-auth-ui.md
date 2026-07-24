# خطة تنفيذ واجهات البصمة والمصادقة

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** إضافة ثلاث شاشات جديدة (تسجيل البصمة، التحقق من البصمة، نجاح المصادقة) مع تأثيرات ثلاثية الأبعاد ورسوم متحركة سايبر سيكيوريتي داكن.

**Architecture:** خمسة مكونات React جديدة (SecurityBackground, FingerprintScanner, FingerprintEnrollPage, FingerprintAuthPage, AuthenticatedPage) مع تعديل App.tsx لتوجيه المستخدم، وإضافة keyframes CSS للتأثيرات. استخدام Framer Motion + canvas-confetti + Tailwind الموجودة. لا تبعيات جديدة.

**Tech Stack:** React 19، TypeScript، Tailwind CSS (CDN)، Framer Motion، Lucide React، canvas-confetti، Vite.

**ملاحظة:** المشروع لا يحتوي على إطار اختبار. التحقق يتم عبر `tsc --noEmit` و `npm run build` و تشغيل dev server.

---

## Task 1: مكون SecurityBackground

**Files:**
- Create: `components/SecurityBackground.tsx`

- [ ] **Step 1: إنشاء SecurityBackground.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export const SecurityBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 4,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* الشبكة الرقمية المتحركة */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.15) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite',
        }}
      />

      {/* الجسيمات الطافئة */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-red-500"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            boxShadow: '0 0 10px rgba(255,0,0,0.6)',
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* طبقة ضبابية في الأسفل */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,1), transparent)',
        }}
      />

      {/* المحتوى فوق الخلفية */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default SecurityBackground;
```

- [ ] **Step 2: التحقق من البناء (type check)**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: لا أخطاء متعلقة بـ SecurityBackground.

- [ ] **Step 3: Commit**

```bash
git add components/SecurityBackground.tsx
git commit -m "feat: add SecurityBackground component with floating particles"
```

---

## Task 2: إضافة keyframes CSS في index.css

**Files:**
- Modify: `index.css`

- [ ] **Step 1: قراءة index.css الحالي**

Run: `cat index.css | tail -50`

- [ ] **Step 2: إضافة keyframes جديدة في نهاية الملف**

أضف في نهاية `index.css`:

```css
@keyframes grid-move {
  0% { background-position: 0 0; }
  100% { background-position: 50px 50px; }
}

@keyframes scan-line {
  0% { transform: translateY(-50%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(50%); opacity: 0; }
}

@keyframes glass-shimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%) skewX(-15deg); }
}

@keyframes neon-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255,0,0,0.4), 0 0 40px rgba(255,0,0,0.2); }
  50% { box-shadow: 0 0 40px rgba(255,0,0,0.8), 0 0 80px rgba(255,0,0,0.4); }
}

@keyframes scan-fingerprint {
  0% { stroke-dashoffset: 1000; }
  100% { stroke-dashoffset: 0; }
}

.scanner-card {
  transform-style: preserve-3d;
  transition: transform 0.2s ease-out;
}

.glass-shimmer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  animation: glass-shimmer 3s ease-in-out infinite;
  pointer-events: none;
}

.neon-pulse {
  animation: neon-pulse 2s ease-in-out infinite;
}

.fingerprint-svg path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
}

.fingerprint-svg.scanning path {
  animation: scan-fingerprint 3s ease-out forwards;
}
```

- [ ] **Step 3: Commit**

```bash
git add index.css
git commit -m "feat: add custom keyframes for fingerprint scanner animations"
```

---

## Task 3: مكون FingerprintScanner

**Files:**
- Create: `components/FingerprintScanner.tsx`

- [ ] **Step 1: إنشاء FingerprintScanner.tsx**

```tsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Fingerprint } from 'lucide-react';

export type ScannerState = 'idle' | 'scanning' | 'success' | 'error';

interface FingerprintScannerProps {
  state: ScannerState;
  size?: number;
}

export const FingerprintScanner: React.FC<FingerprintScannerProps> = ({
  state,
  size = 240,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 20;
    const y = -(e.clientX - rect.left - rect.width / 2) / 20;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      ref={cardRef}
      className={`scanner-card glass-shimmer relative rounded-3xl p-8 backdrop-blur-xl ${
        state === 'error' ? 'animate-[shake_0.4s_ease-in-out]' : ''
      }`}
      style={{
        background: 'rgba(26,26,26,0.6)',
        border: '1px solid rgba(255,0,0,0.3)',
        boxShadow:
          state === 'error'
            ? '0 0 60px rgba(255,0,0,0.6), inset 0 0 30px rgba(255,0,0,0.2)'
            : '0 0 40px rgba(255,0,0,0.2), inset 0 0 20px rgba(255,0,0,0.05)',
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative mx-auto flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* حلقات النبض */}
        {state === 'scanning' && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-red-500"
                animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                transition={{
                  duration: 2,
                  delay: i * 0.6,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}

        {/* الدائرة الخارجية مع التوهج */}
        <div
          className={`absolute inset-0 rounded-full ${
            state === 'scanning' ? 'neon-pulse' : ''
          }`}
          style={{
            border: '3px solid rgba(255,0,0,0.5)',
          }}
        />

        {/* خط المسح */}
        {state === 'scanning' && (
          <motion.div
            className="absolute left-4 right-4 h-1 rounded-full"
            style={{
              top: '10%',
              background:
                'linear-gradient(90deg, transparent, #ff0000, transparent)',
              boxShadow: '0 0 20px #ff0000',
            }}
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* أيقونة البصمة أو علامة الصح أو الخطأ */}
        <AnimatePresence mode="wait">
          {state === 'success' ? (
            <motion.div
              key="success"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="relative z-10 rounded-full bg-green-500 p-6"
              style={{ boxShadow: '0 0 60px rgba(34,197,94,0.8)' }}
            >
              <Check size={size * 0.4} className="text-white" strokeWidth={3} />
            </motion.div>
          ) : state === 'error' ? (
            <motion.div
              key="error"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="relative z-10 rounded-full bg-red-600 p-6"
              style={{ boxShadow: '0 0 60px rgba(255,0,0,0.8)' }}
            >
              <AlertTriangle size={size * 0.4} className="text-white" strokeWidth={3} />
            </motion.div>
          ) : (
            <motion.div
              key="fingerprint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-10"
            >
              <Fingerprint
                size={size * 0.5}
                className={state === 'scanning' ? 'text-red-500' : 'text-white/80'}
                style={{
                  filter:
                    state === 'scanning'
                      ? 'drop-shadow(0 0 20px rgba(255,0,0,0.8))'
                      : 'drop-shadow(0 0 10px rgba(255,255,255,0.3))',
                }}
                strokeWidth={1.5}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FingerprintScanner;
```

- [ ] **Step 2: التحقق من البناء**

Run: `npx tsc --noEmit 2>&1 | grep -i "fingerprint" | head -10`
Expected: لا أخطاء.

- [ ] **Step 3: Commit**

```bash
git add components/FingerprintScanner.tsx
git commit -m "feat: add 3D FingerprintScanner with tilt and pulse animations"
```

---

## Task 4: مكون FingerprintEnrollPage

**Files:**
- Create: `components/FingerprintEnrollPage.tsx`

- [ ] **Step 1: إنشاء FingerprintEnrollPage.tsx**

```tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FingerprintScanner, ScannerState } from './FingerprintScanner';
import { Shield, ArrowLeft } from 'lucide-react';

interface FingerprintEnrollPageProps {
  onComplete: () => void;
  onBack: () => void;
}

export const FingerprintEnrollPage: React.FC<FingerprintEnrollPageProps> = ({
  onComplete,
  onBack,
}) => {
  const [state, setState] = useState<ScannerState>('idle');

  const handleEnroll = () => {
    setState('scanning');
    setTimeout(() => {
      setState('success');
      try {
        localStorage.setItem('fingerprint_enrolled', 'true');
      } catch (e) {
        console.error('Failed to save enrollment', e);
      }
      setTimeout(() => onComplete(), 1200);
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.button
        onClick={onBack}
        className="absolute top-6 right-6 flex items-center gap-2 text-white/60 hover:text-white transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ArrowLeft size={20} />
        <span>رجوع</span>
      </motion.button>

      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-500/20 border border-red-500/50">
          <Shield className="text-red-500" size={32} />
        </div>
        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
          تسجيل بصمة الأمان
        </h1>
        <p className="text-white/60 text-lg">بروتوكول الأمان المتقدم لـ iABS</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <FingerprintScanner state={state} size={260} />
      </motion.div>

      <motion.div
        className="mt-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {state === 'idle' && (
          <>
            <p className="text-white/80 text-lg mb-6">
              ضع إصبعك على الماسح للتسجيل
            </p>
            <button
              onClick={handleEnroll}
              className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-lg font-semibold rounded-2xl transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(255,0,0,0.4)]"
            >
              بدء التسجيل
            </button>
          </>
        )}
        {state === 'scanning' && (
          <p className="text-red-400 text-lg animate-pulse">جاري المسح...</p>
        )}
        {state === 'success' && (
          <p className="text-green-400 text-lg">تم التسجيل بنجاح ✓</p>
        )}
      </motion.div>
    </div>
  );
};

export default FingerprintEnrollPage;
```

- [ ] **Step 2: التحقق من البناء**

Run: `npx tsc --noEmit 2>&1 | grep -i "enroll" | head -10`
Expected: لا أخطاء.

- [ ] **Step 3: Commit**

```bash
git add components/FingerprintEnrollPage.tsx
git commit -m "feat: add FingerprintEnrollPage with scanning flow"
```

---

## Task 5: مكون FingerprintAuthPage

**Files:**
- Create: `components/FingerprintAuthPage.tsx`

- [ ] **Step 1: إنشاء FingerprintAuthPage.tsx**

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FingerprintScanner, ScannerState } from './FingerprintScanner';
import { Lock, KeyRound } from 'lucide-react';

interface FingerprintAuthPageProps {
  onSuccess: () => void;
  onFallback: () => void;
}

export const FingerprintAuthPage: React.FC<FingerprintAuthPageProps> = ({
  onSuccess,
  onFallback,
}) => {
  const [state, setState] = useState<ScannerState>('scanning');
  const timeoutRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    startAuth();
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const startAuth = () => {
    setState('scanning');
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      // محاكاة: 80% نجاح
      if (Math.random() < 0.8) {
        setState('success');
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#ff0000', '#ffffff', '#8b0000'],
        });
        try {
          const stored = localStorage.getItem('site_access_granted');
          const parsed = stored ? JSON.parse(stored) : { valid: true };
          localStorage.setItem(
            'site_access_granted',
            JSON.stringify({ ...parsed, valid: true, method: 'fingerprint' })
          );
        } catch (e) {
          console.error('Failed to update auth', e);
        }
        setTimeout(() => onSuccess(), 1200);
      } else {
        attemptsRef.current += 1;
        setState('error');
      }
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-500/20 border border-red-500/50">
          <Lock className="text-red-500" size={32} />
        </div>
        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
          التحقق من الهوية
        </h1>
        <p className="text-white/60 text-lg">بروتوكول المصادقة بالبصمة</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <FingerprintScanner state={state} size={260} />
      </motion.div>

      <motion.div
        className="mt-10 text-center flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {state === 'scanning' && (
          <p className="text-red-400 text-lg animate-pulse">
            جاري التحقق من البصمة...
          </p>
        )}
        {state === 'success' && (
          <p className="text-green-400 text-lg">تمت المصادقة بنجاح ✓</p>
        )}
        {state === 'error' && (
          <>
            <p className="text-red-400 text-lg">البصمة غير متطابقة</p>
            <div className="flex gap-3">
              <button
                onClick={startAuth}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={onFallback}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-2"
              >
                <KeyRound size={18} />
                <span>الدخول بكلمة المرور</span>
              </button>
            </div>
          </>
        )}
        {state !== 'error' && (
          <button
            onClick={onFallback}
            className="mt-2 text-white/50 hover:text-white/80 text-sm flex items-center gap-2 transition"
          >
            <KeyRound size={14} />
            <span>استخدام كلمة المرور</span>
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default FingerprintAuthPage;
```

- [ ] **Step 2: التحقق من البناء**

Run: `npx tsc --noEmit 2>&1 | grep -i "auth" | head -10`
Expected: لا أخطاء.

- [ ] **Step 3: Commit**

```bash
git add components/FingerprintAuthPage.tsx
git commit -m "feat: add FingerprintAuthPage with confetti on success"
```

---

## Task 6: مكون AuthenticatedPage

**Files:**
- Create: `components/AuthenticatedPage.tsx`

- [ ] **Step 1: إنشاء AuthenticatedPage.tsx**

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Gamepad2, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { ProAvatar } from './ProAvatar';
import { IabsLogo } from './IabsLogo';

interface AuthenticatedPageProps {
  username?: string;
  role?: string;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export const AuthenticatedPage: React.FC<AuthenticatedPageProps> = ({
  username = 'المستخدم',
  role = 'مستخدم',
  onLogout,
  onNavigate,
}) => {
  const actions = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      color: 'from-blue-600 to-blue-800',
    },
    {
      id: 'games',
      label: 'الألعاب',
      icon: Gamepad2,
      color: 'from-purple-600 to-purple-800',
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: Settings,
      color: 'from-gray-600 to-gray-800',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 30px rgba(255,0,0,0.4)',
              '0 0 60px rgba(255,0,0,0.8)',
              '0 0 30px rgba(255,0,0,0.4)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block rounded-full p-2"
        >
          <IabsLogo size={120} />
        </motion.div>
      </motion.div>

      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ShieldCheck className="text-green-400" size={32} />
        <h1 className="text-4xl font-bold text-white">تمت المصادقة بنجاح</h1>
      </motion.div>

      <motion.p
        className="text-white/60 text-lg mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        مرحباً بك في بروتوكول iABS الآمن
      </motion.p>

      <motion.div
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-10 flex items-center gap-5 min-w-[320px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ boxShadow: '0 0 40px rgba(255,0,0,0.1)' }}
      >
        <ProAvatar username={username} size={64} />
        <div className="text-right">
          <div className="text-white text-xl font-semibold">{username}</div>
          <div className="text-white/50 text-sm">{role}</div>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-3 gap-4 mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {actions.map((a, i) => (
          <motion.button
            key={a.id}
            onClick={() => onNavigate(a.id)}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className={`bg-gradient-to-br ${a.color} p-6 rounded-2xl flex flex-col items-center gap-3 min-w-[140px] shadow-lg`}
          >
            <a.icon size={32} className="text-white" />
            <span className="text-white font-semibold">{a.label}</span>
          </motion.button>
        ))}
      </motion.div>

      <motion.button
        onClick={onLogout}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.05 }}
        className="px-8 py-3 bg-white/10 hover:bg-red-600 text-white rounded-xl flex items-center gap-2 transition"
      >
        <LogOut size={18} />
        <span>تسجيل الخروج</span>
      </motion.button>
    </div>
  );
};

export default AuthenticatedPage;
```

- [ ] **Step 2: التحقق من البناء**

Run: `npx tsc --noEmit 2>&1 | grep -i "authenticated" | head -10`
Expected: لا أخطاء.

- [ ] **Step 3: Commit**

```bash
git add components/AuthenticatedPage.tsx
git commit -m "feat: add AuthenticatedPage with user card and quick actions"
```

---

## Task 7: دمج المكونات في App.tsx

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: قراءة حالة App.tsx الحالية للتوجيه**

Run: `grep -n "isAuthorized\|currentView\|site_access_granted\|fingerprint" App.tsx | head -20`

- [ ] **Step 2: إضافة imports الجديدة في أعلى App.tsx**

أضف بعد imports الموجودة:

```tsx
import { SecurityBackground } from './components/SecurityBackground';
import { FingerprintEnrollPage } from './components/FingerprintEnrollPage';
import { FingerprintAuthPage } from './components/FingerprintAuthPage';
import { AuthenticatedPage } from './components/AuthenticatedPage';
```

- [ ] **Step 3: إضافة state للبصمة في مكون App**

ابحث عن مكان تعريف `isAuthorized` وأضف بعده:

```tsx
const [fingerprintEnrolled, setFingerprintEnrolled] = useState<boolean>(() => {
  try {
    return localStorage.getItem('fingerprint_enrolled') === 'true';
  } catch {
    return false;
  }
});

const [showAuthenticated, setShowAuthenticated] = useState(false);
```

- [ ] **Step 4: إضافة منطق التوجيه**

ابحث عن مكان render الرئيسي (return في App) وأضف قبل return الأصلي:

```tsx
if (showAuthenticated) {
  return (
    <SecurityBackground>
      <AuthenticatedPage
        username="المستخدم"
        role="عضو مميز"
        onLogout={() => {
          try {
            localStorage.removeItem('site_access_granted');
          } catch (e) {}
          setShowAuthenticated(false);
          setIsAuthorized(false);
        }}
        onNavigate={(view) => {
          setShowAuthenticated(false);
          setCurrentView(view as any);
        }}
      />
    </SecurityBackground>
  );
}

if (isAuthorized && !fingerprintEnrolled) {
  return (
    <SecurityBackground>
      <FingerprintEnrollPage
        onComplete={() => setFingerprintEnrolled(true)}
        onBack={() => setIsAuthorized(false)}
      />
    </SecurityBackground>
  );
}

if (isAuthorized && fingerprintEnrolled) {
  return (
    <SecurityBackground>
      <FingerprintAuthPage
        onSuccess={() => setShowAuthenticated(true)}
        onFallback={() => setIsAuthorized(false)}
      />
    </SecurityBackground>
  );
}
```

- [ ] **Step 5: التحقق من البناء الكامل**

Run: `npm run build 2>&1 | tail -20`
Expected: build ناجح بدون أخطاء.

- [ ] **Step 6: Commit**

```bash
git add App.tsx
git commit -m "feat: integrate fingerprint flow into App routing"
```

---

## Task 8: التحقق النهائي الشامل

- [ ] **Step 1: فحص أنواع TypeScript**

Run: `npx tsc --noEmit 2>&1 | tail -10`
Expected: لا أخطاء.

- [ ] **Step 2: بناء الإنتاج**

Run: `npm run build 2>&1 | tail -15`
Expected: `dist/index.html` و `dist/assets/*` تم إنشاؤها بنجاح.

- [ ] **Step 3: التحقق من تشغيل dev server**

Run: `timeout 10 npm run dev 2>&1 | head -20`
Expected: Vite يبدأ على المنفذ المحلي بدون أخطاء.

- [ ] **Step 4: Commit نهائي**

```bash
git add -A
git commit --allow-empty -m "chore: fingerprint auth UI implementation complete"
```

---

## المعايير المقبولة (Acceptance Criteria)

- [ ] كل المكونات الجديدة تُعرض بلا أخطاء TypeScript.
- [ ] تأثير tilt 3D يعمل على بطاقة الماسح.
- [ ] حلقات النبض تظهر أثناء المسح.
- [ ] خط المسح يتحرك عمودياً.
- [ ] المصادقة الناجحة تُطلق confetti.
- [ ] المصادقة الفاشلة تُظهر رسالة خطأ وتُتيح إعادة المحاولة.
- [ ] تسجيل البصمة يحفظ الحالة في localStorage.
- [ ] صفحة المصادقة الناجحة تعرض شعار iABS مع توهج.
- [ ] زر تسجيل الخروج يُرجع المستخدم لشاشة تسجيل الدخول.
- [ ] البناء الكامل ينجح بدون أخطاء.
