import React, { useState, useEffect } from 'react';
import {
  Trophy, Sparkles, Users2, Zap, ArrowUp, ArrowDown, Flag, Keyboard,
  Swords, Gift, Brain, Vote, Bomb, Type, Flame, Smile, Coffee,
  ChevronRight, Play, Star, Heart, Globe, Crown, Medal, Target,
  Gamepad2, MonitorPlay, MessageCircle, Timer, Shuffle, Eye
} from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

const GAMES_DATA = [
  {
    name: 'محمح',
    nameEn: 'MHMH',
    icon: Brain,
    color: 'from-indigo-500 to-purple-600',
    borderColor: 'border-indigo-500/30',
    glowColor: 'rgba(99,102,241,0.4)',
    description: 'لعبة أسئلة وأجوبة تفاعلية على شكل جيوباردي! يتم تقسيم الأسئلة إلى فئات ونقاط مختلفة. الشات يجاوب والأسرع يفوز!',
    howToPlay: 'اكتب الإجابة في الشات قبل انتهاء الوقت. كل فئة فيها أسئلة بنقاط مختلفة (100، 300، 500).',
  },
  {
    name: 'أعلى أم أقل',
    nameEn: 'HIGHER OR LOWER',
    icon: ArrowUp,
    color: 'from-pink-500 to-rose-600',
    borderColor: 'border-pink-500/30',
    glowColor: 'rgba(236,72,153,0.4)',
    description: 'هل تظن أن الرقم أعلى أو أقل؟ لعبة تخمين ممتعة حيث يصوت الشات على إجابتهم والنتيجة تظهر مباشرة!',
    howToPlay: 'اكتب "أعلى" أو "أقل" في الشات خلال وقت التصويت. الأغلبية الصحيحة تفوز بالنقاط!',
  },
  {
    name: 'فوازير',
    nameEn: 'FAWAZIR',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/30',
    glowColor: 'rgba(245,158,11,0.4)',
    description: 'أسئلة ثقافية متنوعة مع خيارات متعددة. سرعتك في الإجابة تحدد ترتيبك!',
    howToPlay: 'اختر رقم الإجابة الصحيحة (1، 2، 3، أو 4) في الشات بأسرع وقت ممكن.',
  },
  {
    name: 'كراسي موسيقية',
    nameEn: 'MUSICAL CHAIRS',
    icon: Coffee,
    color: 'from-teal-500 to-cyan-600',
    borderColor: 'border-teal-500/30',
    glowColor: 'rgba(20,184,166,0.4)',
    description: 'لعبة الكراسي الموسيقية الكلاسيكية بنكهة رقمية! الموسيقى تتوقف ولازم تكتب بسرعة عشان ما تطلع.',
    howToPlay: 'عندما تتوقف الموسيقى، اكتب الكلمة المطلوبة بأسرع وقت. آخر شخص يطلع!',
  },
  {
    name: 'حرب المساكيل',
    nameEn: 'MASAQIL WAR',
    icon: Swords,
    color: 'from-red-500 to-red-700',
    borderColor: 'border-red-500/30',
    glowColor: 'rgba(239,68,68,0.4)',
    description: 'حرب أسئلة ملحمية بين فريقين! كل فريق يحاول الإجابة بشكل أسرع للفوز بالنقاط.',
    howToPlay: 'انضم لفريقك وأجب على الأسئلة في الشات. الفريق الأسرع بالإجابة الصحيحة يكسب النقاط!',
  },
  {
    name: 'تخمين الصورة المموهة',
    nameEn: 'BLUR GUESS',
    icon: Eye,
    color: 'from-blue-500 to-blue-700',
    borderColor: 'border-blue-500/30',
    glowColor: 'rgba(59,130,246,0.4)',
    description: 'صورة مموهة تبدأ بالوضوح تدريجياً. كل ما خمنت أبكر، كل ما كسبت نقاط أكثر!',
    howToPlay: 'اكتب تخمينك في الشات. الصورة تتضح مع الوقت وأول شخص يخمن صح يفوز!',
  },
  {
    name: 'عجلة الحظ',
    nameEn: 'SPIN WHEEL',
    icon: Gift,
    color: 'from-yellow-500 to-amber-600',
    borderColor: 'border-yellow-500/30',
    glowColor: 'rgba(234,179,8,0.4)',
    description: 'عجلة الحظ الشهيرة! لف العجلة وشوف وين بتوقف. جوائز ومفاجآت بانتظارك!',
    howToPlay: 'الستريمر يلف العجلة والحظ يختار الفائز أو الجائزة!',
  },
  {
    name: 'مسابقة الأعلام',
    nameEn: 'FLAG QUIZ',
    icon: Flag,
    color: 'from-green-500 to-emerald-600',
    borderColor: 'border-green-500/30',
    glowColor: 'rgba(34,197,94,0.4)',
    description: 'اختبر معرفتك بأعلام العالم! شوف العلم وخمن الدولة بأسرع وقت.',
    howToPlay: 'اكتب اسم الدولة في الشات عندما يظهر العلم. الأسرع يفوز!',
  },
  {
    name: 'سباق الكتابة',
    nameEn: 'TYPING RACE',
    icon: Keyboard,
    color: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-500/30',
    glowColor: 'rgba(139,92,246,0.4)',
    description: 'سباق كتابة حماسي! اكتب الكلمة أو الجملة المطلوبة بأسرع وقت ممكن.',
    howToPlay: 'اكتب النص المعروض في الشات بالضبط. الأسرع والأدق يفوز!',
  },
  {
    name: 'صيد الكنز',
    nameEn: 'GRID HUNT',
    icon: Target,
    color: 'from-orange-500 to-red-600',
    borderColor: 'border-orange-500/30',
    glowColor: 'rgba(249,115,22,0.4)',
    description: 'شبكة مليئة بالمفاجآت! اختر المربع الصحيح واكسب النقاط أو واجه الفخاخ.',
    howToPlay: 'اكتب رقم المربع في الشات. بعض المربعات فيها نقاط وبعضها فخاخ!',
  },
  {
    name: 'خلط الأكواب',
    nameEn: 'CUP SHUFFLE',
    icon: Shuffle,
    color: 'from-sky-500 to-blue-600',
    borderColor: 'border-sky-500/30',
    glowColor: 'rgba(14,165,233,0.4)',
    description: 'تتبع الكرة تحت الأكواب! الأكواب تتحرك بسرعة وعليك اختيار الكوب الصحيح.',
    howToPlay: 'شاهد الأكواب وهي تتحرك، ثم اكتب رقم الكوب الذي تعتقد أن الكرة تحته.',
  },
  {
    name: 'حرب الأراضي',
    nameEn: 'TERRITORY WAR',
    icon: Globe,
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/30',
    glowColor: 'rgba(16,185,129,0.4)',
    description: 'احتل الأراضي وسيطر على الخريطة! لعبة استراتيجية جماعية مثيرة.',
    howToPlay: 'اختر المنطقة التي تريد احتلالها وأجب على السؤال للسيطرة عليها.',
  },
  {
    name: 'حقيقة أم كذبة',
    nameEn: 'TRUTH OR LIE',
    icon: Brain,
    color: 'from-fuchsia-500 to-pink-600',
    borderColor: 'border-fuchsia-500/30',
    glowColor: 'rgba(217,70,239,0.4)',
    description: 'هل المعلومة صحيحة أم خاطئة؟ اختبر حدسك ومعرفتك العامة!',
    howToPlay: 'اكتب "صح" أو "غلط" في الشات بعد قراءة المعلومة.',
  },
  {
    name: 'تحدي الرسم',
    nameEn: 'DRAWING CHALLENGE',
    icon: Sparkles,
    color: 'from-rose-500 to-pink-600',
    borderColor: 'border-rose-500/30',
    glowColor: 'rgba(244,63,94,0.4)',
    description: 'الستريمر يرسم والشات يخمن! لعبة إبداعية مليئة بالضحك والمرح.',
    howToPlay: 'خمن ما يرسمه الستريمر واكتب إجابتك في الشات. الأسرع يفوز!',
  },
  {
    name: 'حرب الفواكه',
    nameEn: 'FRUIT WAR',
    icon: Flame,
    color: 'from-lime-500 to-green-600',
    borderColor: 'border-lime-500/30',
    glowColor: 'rgba(132,204,22,0.4)',
    description: 'معركة فواكه حماسية! اختر فاكهتك وحارب للبقاء في الساحة.',
    howToPlay: 'اكتب اسم الفاكهة التي تختارها وشارك في المعركة!',
  },
  {
    name: 'تخمين الشعار',
    nameEn: 'LOGO ROUND',
    icon: Eye,
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/30',
    glowColor: 'rgba(6,182,212,0.4)',
    description: 'شعارات شركات ومنتجات مشهورة. هل تقدر تعرفها كلها؟',
    howToPlay: 'اكتب اسم الشركة أو المنتج صاحب الشعار في الشات.',
  },
  {
    name: 'التصويت',
    nameEn: 'VOTING GAME',
    icon: Vote,
    color: 'from-indigo-500 to-blue-600',
    borderColor: 'border-indigo-500/30',
    glowColor: 'rgba(99,102,241,0.4)',
    description: 'صوّت على رأيك! أسئلة ممتعة والشات يقرر الإجابة بالأغلبية.',
    howToPlay: 'اكتب رقم اختيارك في الشات وشوف رأي الأغلبية!',
  },
  {
    name: 'قنبلة الوقت',
    nameEn: 'TIME BOMB',
    icon: Bomb,
    color: 'from-red-600 to-orange-600',
    borderColor: 'border-red-600/30',
    glowColor: 'rgba(220,38,38,0.4)',
    description: 'القنبلة تدور بين اللاعبين! أجب قبل ما تنفجر عليك.',
    howToPlay: 'أجب على السؤال بسرعة قبل انتهاء الوقت. إذا انفجرت القنبلة عليك، تخرج!',
  },
  {
    name: 'بناء الكلمات',
    nameEn: 'WORD BUILDER',
    icon: Type,
    color: 'from-amber-500 to-yellow-600',
    borderColor: 'border-amber-500/30',
    glowColor: 'rgba(245,158,11,0.4)',
    description: 'كوّن كلمات من الأحرف المعطاة! كل ما كانت الكلمة أطول، كل ما كسبت أكثر.',
    howToPlay: 'اكتب أطول كلمة تقدر تكوّنها من الأحرف الظاهرة في الشات.',
  },
  {
    name: 'جسر الزجاج',
    nameEn: 'GLASS BRIDGE',
    icon: Flame,
    color: 'from-cyan-400 to-blue-600',
    borderColor: 'border-cyan-400/30',
    glowColor: 'rgba(34,211,238,0.4)',
    description: 'مستوحاة من لعبة الحبار! اختر الزجاجة الصحيحة أو اسقط.',
    howToPlay: 'اختر يمين أو يسار في كل خطوة. الزجاج الخطأ يكسر وتسقط!',
  },
  {
    name: 'الأرض حمم',
    nameEn: 'FLOOR IS LAVA',
    icon: Flame,
    color: 'from-orange-500 to-red-600',
    borderColor: 'border-orange-500/30',
    glowColor: 'rgba(249,115,22,0.4)',
    description: 'الأرض تتحول لحمم بركانية! اقفز على المنصات الآمنة قبل فوات الأوان.',
    howToPlay: 'اكتب رقم المنصة الآمنة في الشات قبل أن تغمرها الحمم!',
  },
  {
    name: 'شفرة الإيموجي',
    nameEn: 'EMOJI CODE',
    icon: Smile,
    color: 'from-yellow-400 to-orange-500',
    borderColor: 'border-yellow-400/30',
    glowColor: 'rgba(250,204,21,0.4)',
    description: 'فك شفرة الإيموجيات! مجموعة إيموجيات تمثل كلمة أو جملة، خمنها!',
    howToPlay: 'شوف الإيموجيات واكتب الكلمة أو الجملة التي تمثلها في الشات.',
  },
  {
    name: 'الكلمات الممنوعة',
    nameEn: 'FORBIDDEN WORDS',
    icon: Flame,
    color: 'from-red-500 to-rose-600',
    borderColor: 'border-red-500/30',
    glowColor: 'rgba(239,68,68,0.4)',
    description: 'لعبة حماسية! حاول تشرح الكلمة لفريقك بدون ما تقول الكلمات الممنوعة.',
    howToPlay: 'اشرح الكلمة المطلوبة بدون استخدام الكلمات الموجودة في القائمة الممنوعة.',
  },
  {
    name: 'لعبة الحروف',
    nameEn: 'LETTER HEXAGON',
    icon: Type,
    color: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-500/30',
    glowColor: 'rgba(59,130,246,0.4)',
    description: 'تحدي الحروف السريع! كوّن كلمات من الحروف المعروضة أمامك بأسرع وقت.',
    howToPlay: 'استخدم الحروف المتاحة في الخلايا لتكوين كلمات صحيحة.',
  },
  {
    name: 'تحدي الفرق',
    nameEn: 'TEAM BATTLE',
    icon: Swords,
    color: 'from-orange-500 to-red-500',
    borderColor: 'border-orange-500/30',
    glowColor: 'rgba(249,115,22,0.4)',
    description: 'معركة حامية بين الفرق! اجمع النقاط لفريقك واهزم الفريق الخصم.',
    howToPlay: 'انضم لفريق وجاوب بسرعة لتكسب نقاط وتتفوق على الفريق الثاني.',
  },
  {
    name: 'السحب',
    nameEn: 'RAFFLE',
    icon: Gift,
    color: 'from-emerald-400 to-green-500',
    borderColor: 'border-emerald-400/30',
    glowColor: 'rgba(52,211,153,0.4)',
    description: 'نظام سحوبات متقدم لاختيار الفائزين من الشات بكل عدل وشفافية.',
    howToPlay: 'اكتب كلمة السحب في الشات لتدخل في السحب العشوائي.',
  },
];

const STATS = [
  { label: 'لعبة تفاعلية', value: '22+', icon: Gamepad2 },
  { label: 'بث مباشر', value: '∞', icon: MonitorPlay },
  { label: 'تفاعل مباشر', value: '100%', icon: MessageCircle },
  { label: 'وقت ممتع', value: '24/7', icon: Timer },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const [activeGame, setActiveGame] = useState<number | null>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate-section]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-white w-full overflow-x-hidden relative" dir="rtl">
      {/* Floating Particles Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-500/40 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* ============ HERO SECTION ============ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Giant glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-red-600/15 blur-[220px] rounded-full" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-purple-600/15 blur-[180px] rounded-full" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-amber-600/10 blur-[180px] rounded-full" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />



        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Logo */}
          <div className="relative inline-block mb-8">
            <div className="absolute -inset-8 bg-red-600/20 blur-[80px] rounded-full animate-pulse" />
            <div className="animate-float">
              <img
                src="/logo2.png"
                className="h-32 md:h-44 relative drop-shadow-[0_0_60px_rgba(255,0,0,0.8)]"
                alt="iABS Logo"
                style={{ filter: 'brightness(1.2)' }}
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-4 relative">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              iABS
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700 ml-4">
              ARENA
            </span>
          </h1>

          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-red-500 to-transparent mb-6" />

          <p className="text-xl md:text-2xl text-white/70 font-bold max-w-3xl mx-auto leading-relaxed mb-4">
            أكبر منصة ألعاب تفاعلية للبثوث المباشرة في العالم العربي
          </p>
          <p className="text-base md:text-lg text-white/40 font-bold max-w-2xl mx-auto leading-relaxed mb-12">
            العب مع الشات مباشرة في بثوث{' '}
            <span className="text-red-500 font-black">iABS</span> على منصة{' '}
            <span className="text-green-500 font-black">Kick.com</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-5 mb-16">
            <button
              onClick={onBack}
              className="group relative px-10 py-5 bg-gradient-to-r from-red-600 via-red-700 to-rose-700 rounded-2xl font-black text-xl text-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(239,68,68,0.5)] overflow-hidden flex items-center gap-3 border border-red-400/40"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 skew-x-[-20deg]" />
              <Gamepad2 size={26} className="relative z-10 animate-bounce" />
              <span className="relative z-10">دخول ساحة الألعاب الرئيسية</span>
            </button>
            <a
              href="https://kick.com/iabs"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-9 py-5 bg-black/40 backdrop-blur-xl border border-green-500/30 hover:border-green-400/60 rounded-2xl font-black text-xl text-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)] overflow-hidden flex items-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 skew-x-[-20deg]" />
              <Play size={24} className="relative z-10 text-green-400" />
              <span className="relative z-10 text-green-400">شاهد البث على Kick</span>
            </a>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {STATS.map((stat, i) => (
              <div
                key={i}
                className="glass-card bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 text-center hover:bg-black/60 hover:border-red-500/30 transition-all group shadow-xl"
              >
                <stat.icon
                  size={32}
                  className="text-red-500 mx-auto mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                />
                <div className="text-3xl font-black text-white mb-1 font-mono tracking-tight">{stat.value}</div>
                <div className="text-xs text-white/50 font-bold uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">اكتشف المزيد</span>
          <ArrowDown size={20} className="text-white/50" />
        </div>
      </section>

      {/* ============ ABOUT iABS SECTION ============ */}
      <section
        id="about-iabs"
        data-animate-section
        className={`relative py-32 px-4 transition-all duration-1000 ${visibleSections.has('about-iabs') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-l from-red-500/50 to-transparent" />
                <span className="text-red-500 font-black uppercase tracking-[0.3em] text-xs">من نحن</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-8 leading-tight">
                <span className="text-white">ساحة </span>
                <span className="text-red-500">iABS</span>
                <br />
                <span className="text-white/60 text-3xl">حيث يصبح البث لعبة</span>
              </h2>
              <div className="space-y-6 text-white/60 font-bold text-lg leading-relaxed">
                <p>
                  <span className="text-red-500 font-black">iABS ARENA</span> هي منصة ألعاب تفاعلية حصرية مصممة خصيصاً لبثوث{' '}
                  <span className="text-white font-black">iABS</span> على منصة{' '}
                  <span className="text-green-500 font-black">Kick.com</span>.
                </p>
                <p>
                  المنصة تحتوي على أكثر من <span className="text-white font-black">22 لعبة تفاعلية</span> مختلفة، كل لعبة مصممة ليتفاعل معها المشاهدون مباشرة من خلال الشات أثناء البث المباشر.
                </p>
                <p>
                  كل الفعاليات والألعاب تصير حصرياً في بثوث <span className="text-red-500 font-black">iABS</span> على كيك. تابع البث وشارك بالألعاب واكسب النقاط وتنافس مع باقي المشاهدين!
                </p>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: MonitorPlay, title: 'بث مباشر', desc: 'كل الألعاب تصير لايف أثناء البث', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                { icon: MessageCircle, title: 'تفاعل بالشات', desc: 'العب بكتابة إجابتك في شات كيك', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                { icon: Trophy, title: 'لوحة الصدارة', desc: 'تنافس على المركز الأول بالنقاط', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                { icon: Crown, title: 'حصري لـ iABS', desc: 'ألعاب مصممة خصيصاً لقناة iABS', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
              ].map((f, i) => (
                <div
                  key={i}
                  className={`${f.bg} ${f.border} border rounded-3xl p-6 hover:scale-105 transition-all duration-500 group`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <f.icon size={32} className={`${f.color} mb-4 group-hover:scale-110 transition-transform`} />
                  <h3 className="text-white font-black text-lg mb-2">{f.title}</h3>
                  <p className="text-white/40 font-bold text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS SECTION ============ */}
      <section
        id="how-it-works"
        data-animate-section
        className={`relative py-32 px-4 transition-all duration-1000 ${visibleSections.has('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-red-500 font-black uppercase tracking-[0.3em] text-xs">كيف تلعب؟</span>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mt-4 mb-4">
              <span className="text-white">ثلاث خطوات </span>
              <span className="text-red-500">فقط</span>
            </h2>
            <div className="h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'ادخل البث',
                desc: 'افتح بث iABS على Kick.com وانضم للشات. ما تحتاج تسجل بأي مكان ثاني!',
                icon: MonitorPlay,
                color: 'from-green-500 to-emerald-600',
              },
              {
                step: '02',
                title: 'شارك بالألعاب',
                desc: 'لما يبدأ الستريمر لعبة، اكتب إجابتك أو اختيارك في الشات مباشرة.',
                icon: MessageCircle,
                color: 'from-blue-500 to-indigo-600',
              },
              {
                step: '03',
                title: 'اكسب النقاط',
                desc: 'كل إجابة صحيحة تكسبك نقاط! تنافس على قمة لوحة الصدارة وكن الأسطورة.',
                icon: Trophy,
                color: 'from-yellow-500 to-amber-600',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative bg-white/[0.02] border border-white/5 rounded-3xl p-8 text-center hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500 group"
              >
                {/* Step number */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center font-black text-sm text-white shadow-lg`}>
                    {item.step}
                  </div>
                </div>

                <item.icon
                  size={48}
                  className="text-white/20 mx-auto mb-6 mt-4 group-hover:text-white/40 transition-colors"
                />
                <h3 className="text-xl font-black text-white mb-3">{item.title}</h3>
                <p className="text-white/40 font-bold text-sm leading-relaxed">{item.desc}</p>

                {/* Connector line (not on last) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -left-4 w-8 h-px bg-gradient-to-l from-white/10 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ALL GAMES SECTION ============ */}
      <section
        id="all-games"
        data-animate-section
        className={`relative py-32 px-4 transition-all duration-1000 ${visibleSections.has('all-games') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-red-500 font-black uppercase tracking-[0.3em] text-xs">الألعاب</span>
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter mt-4 mb-4">
              <span className="text-white">كل الألعاب في </span>
              <span className="text-red-500">الساحة</span>
            </h2>
            <p className="text-white/40 font-bold max-w-2xl mx-auto">
              اضغط على أي لعبة لمعرفة المزيد عنها وكيفية اللعب
            </p>
            <div className="h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-red-500 to-transparent mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {GAMES_DATA.map((game, i) => (
              <button
                key={i}
                onClick={() => setActiveGame(activeGame === i ? null : i)}
                className={`relative text-right rounded-3xl p-6 transition-all duration-700 group hover:scale-[1.03] overflow-hidden ${
                  activeGame === i ? 'shadow-2xl border-red-500/60 bg-red-950/80' : 'bg-gradient-to-br from-[#0a0000]/90 to-[#1a0505]/90 border-red-900/30 hover:border-red-500/50 hover:shadow-[0_0_50px_rgba(239,68,68,0.2)] hover:-translate-y-2'
                } border backdrop-blur-2xl`}
                style={{ 
                  boxShadow: activeGame === i ? `0 20px 50px -10px ${game.glowColor || 'rgba(239,68,68,0.5)'}` : '0 10px 40px -10px rgba(0,0,0,0.8)',
                }}
              >
                {/* Completely Random Jagged/Laser Lines Background with Parallax effect */}
                <div 
                  className="absolute inset-0 opacity-40 group-hover:opacity-80 transition-all duration-[1500ms] pointer-events-none mix-blend-screen transform scale-100 group-hover:scale-125 group-hover:rotate-3"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg%20width%3D%27400%27%20height%3D%27400%27%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%3E%3Cg%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M20%2C120%20L107%2C45%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.54%29%27%20stroke-width%3D%270.52%27%20/%3E%3Cpath%20d%3D%27M227%2C145%20L-3%2C191%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.57%29%27%20stroke-width%3D%271.35%27%20/%3E%3Cpath%20d%3D%27M30%2C160%20L301%2C-5%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.52%29%27%20stroke-width%3D%271.40%27%20/%3E%3Cpath%20d%3D%27M436%2C131%20L303%2C374%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.48%29%27%20stroke-width%3D%271.27%27%20/%3E%3Cpath%20d%3D%27M416%2C305%20L397%2C179%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.50%29%27%20stroke-width%3D%270.63%27%20/%3E%3Cpath%20d%3D%27M415%2C297%20L393%2C389%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.36%29%27%20stroke-width%3D%271.29%27%20/%3E%3Cpath%20d%3D%27M53%2C312%20L392%2C154%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.26%29%27%20stroke-width%3D%270.92%27%20/%3E%3Cpath%20d%3D%27M254%2C402%20L209%2C108%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.34%29%27%20stroke-width%3D%271.12%27%20/%3E%3Cpath%20d%3D%27M263%2C27%20L33%2C442%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.47%29%27%20stroke-width%3D%271.49%27%20/%3E%3Cpath%20d%3D%27M448%2C314%20L381%2C231%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.58%29%27%20stroke-width%3D%270.63%27%20/%3E%3Cpath%20d%3D%27M41%2C284%20L385%2C39%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.29%29%27%20stroke-width%3D%270.30%27%20/%3E%3Cpath%20d%3D%27M220%2C82%20L208%2C440%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.44%29%27%20stroke-width%3D%270.39%27%20/%3E%3Cpath%20d%3D%27M92%2C325%20L230%2C312%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.31%29%27%20stroke-width%3D%270.12%27%20/%3E%3Cpath%20d%3D%27M239%2C99%20L255%2C207%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.30%29%27%20stroke-width%3D%271.10%27%20/%3E%3Cpath%20d%3D%27M365%2C399%20L311%2C55%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.48%29%27%20stroke-width%3D%270.50%27%20/%3E%3Cpath%20d%3D%27M273%2C159%20L391%2C299%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.11%29%27%20stroke-width%3D%270.91%27%20/%3E%3Cpath%20d%3D%27M34%2C96%20L409%2C-6%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.53%29%27%20stroke-width%3D%270.50%27%20/%3E%3Cpath%20d%3D%27M76%2C254%20L315%2C450%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.19%29%27%20stroke-width%3D%270.96%27%20/%3E%3Cpath%20d%3D%27M112%2C253%20L311%2C37%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.41%29%27%20stroke-width%3D%270.24%27%20/%3E%3Cpath%20d%3D%27M110%2C354%20L169%2C91%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.44%29%27%20stroke-width%3D%270.38%27%20/%3E%3Cpath%20d%3D%27M439%2C116%20L230%2C240%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.37%29%27%20stroke-width%3D%270.94%27%20/%3E%3Cpath%20d%3D%27M207%2C200%20L2%2C143%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.41%29%27%20stroke-width%3D%270.71%27%20/%3E%3Cpath%20d%3D%27M146%2C-32%20L298%2C377%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.32%29%27%20stroke-width%3D%270.31%27%20/%3E%3Cpath%20d%3D%27M150%2C237%20L404%2C250%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.26%29%27%20stroke-width%3D%271.07%27%20/%3E%3Cpath%20d%3D%27M348%2C95%20L419%2C333%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.20%29%27%20stroke-width%3D%270.33%27%20/%3E%3Cpath%20d%3D%27M425%2C374%20L277%2C59%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.56%29%27%20stroke-width%3D%270.13%27%20/%3E%3Cpath%20d%3D%27M104%2C123%20L94%2C145%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.17%29%27%20stroke-width%3D%270.62%27%20/%3E%3Cpath%20d%3D%27M193%2C66%20L140%2C390%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.27%29%27%20stroke-width%3D%270.44%27%20/%3E%3Cpath%20d%3D%27M450%2C135%20L31%2C316%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.42%29%27%20stroke-width%3D%270.89%27%20/%3E%3Cpath%20d%3D%27M-35%2C7%20L317%2C145%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.12%29%27%20stroke-width%3D%270.29%27%20/%3E%3Cpath%20d%3D%27M396%2C391%20L35%2C224%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.48%29%27%20stroke-width%3D%271.31%27%20/%3E%3Cpath%20d%3D%27M435%2C208%20L-9%2C157%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.53%29%27%20stroke-width%3D%270.37%27%20/%3E%3Cpath%20d%3D%27M-11%2C345%20L7%2C373%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.18%29%27%20stroke-width%3D%271.31%27%20/%3E%3Cpath%20d%3D%27M98%2C422%20L27%2C366%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.14%29%27%20stroke-width%3D%271.22%27%20/%3E%3Cpath%20d%3D%27M339%2C105%20L191%2C90%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.51%29%27%20stroke-width%3D%270.38%27%20/%3E%3Cpath%20d%3D%27M365%2C338%20L142%2C254%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.47%29%27%20stroke-width%3D%270.79%27%20/%3E%3Cpath%20d%3D%27M165%2C87%20L65%2C342%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.24%29%27%20stroke-width%3D%270.80%27%20/%3E%3Cpath%20d%3D%27M359%2C342%20L221%2C116%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.54%29%27%20stroke-width%3D%270.42%27%20/%3E%3Cpath%20d%3D%27M340%2C330%20L159%2C119%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.57%29%27%20stroke-width%3D%270.13%27%20/%3E%3Cpath%20d%3D%27M-21%2C102%20L245%2C122%27%20stroke%3D%27rgba%28239%2C68%2C68%2C0.51%29%27%20stroke-width%3D%271.08%27%20/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '300px 300px',
                    backgroundPosition: activeGame === i ? 'center' : 'top left'
                  }}
                />
                
                {/* Extra glow blob on hover */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-600/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-full" />

                {/* Glass Top Highlight */}
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none rounded-t-3xl" />

                {/* Subtle Inner Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10">
                  {/* Pill Header */}
                  <div className="flex items-center justify-between bg-black/60 border border-red-500/20 rounded-full p-2 pl-6 group-hover:bg-black/80 group-hover:border-red-500/60 transition-all duration-500 shadow-inner overflow-hidden relative">
                    {/* Shine effect on pill */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 skew-x-[-20deg] pointer-events-none" />
                    
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${game.color} flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 border border-white/20 relative z-10`}
                    >
                      <game.icon size={22} className="text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]" />
                    </div>
                    <h3 className="text-white font-black text-xl leading-none tracking-wider drop-shadow-lg relative z-10">{game.name}</h3>
                  </div>
                  
                  {/* Always visible description */}
                  <div className="mt-6 px-2">
                    <p className="text-red-100/60 font-bold text-sm leading-loose line-clamp-3 group-hover:text-red-50 transition-colors duration-300 drop-shadow-sm">
                      {game.description}
                    </p>
                  </div>

                  {/* Expanded content */}
                  <div
                    className={`overflow-hidden transition-all duration-500 ${
                      activeGame === i ? 'max-h-[300px] opacity-100 mt-6' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="border-t border-red-500/20 pt-5 px-1">
                      <div className="bg-[#050000]/80 rounded-2xl p-4 border border-red-500/10 relative overflow-hidden shadow-inner group-hover:border-red-500/30 transition-colors duration-500">
                        <div className="absolute inset-0 bg-red-500/5 blur-2xl pointer-events-none" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-red-500 font-black text-xs uppercase tracking-[0.2em] drop-shadow-md">
                              طريقة اللعب
                            </span>
                          </div>
                          <p className="text-white/80 font-bold text-xs leading-relaxed">{game.howToPlay}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ KICK EXCLUSIVE SECTION ============ */}
      <section
        id="kick-exclusive"
        data-animate-section
        className={`relative py-32 px-4 transition-all duration-1000 ${visibleSections.has('kick-exclusive') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-950/5 to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="bg-gradient-to-br from-green-900/20 to-black/50 border border-green-500/20 rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/5 blur-[80px] rounded-full" />

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-8">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-500 font-black text-xs uppercase tracking-widest">حصرياً على Kick</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-6">
                <span className="text-white">كل شي يصير في </span>
                <span className="text-green-500">بث iABS</span>
              </h2>

              <p className="text-white/50 font-bold text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                جميع الألعاب والفعاليات والمسابقات تصير حصرياً أثناء البث المباشر لقناة{' '}
                <span className="text-green-500 font-black">iABS</span> على منصة Kick.com. تابع البث، شارك بالألعاب، واكسب النقاط!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {[
                  { icon: Star, label: 'نقاط حقيقية', desc: 'اكسب نقاط من كل لعبة تفوز فيها' },
                  { icon: Medal, label: 'إطارات حصرية', desc: 'اشترِ إطارات مميزة من المتجر' },
                  { icon: Heart, label: 'مجتمع نشط', desc: 'انضم لأقوى مجتمع بث عربي' },
                ].map((item, i) => (
                  <div key={i} className="bg-black/30 border border-green-500/10 rounded-2xl p-6">
                    <item.icon size={28} className="text-green-500 mb-3" />
                    <h3 className="text-white font-black mb-1">{item.label}</h3>
                    <p className="text-white/30 font-bold text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>

              <a
                href="https://kick.com/iabs"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl font-black text-xl text-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(22,163,74,0.4)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 skew-x-[-20deg]" />
                <Play size={24} className="relative z-10" />
                <span className="relative z-10">kick.com/iabs</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative py-16 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-6">
            <img src="/logo2.png" className="h-16 mx-auto opacity-30" alt="iABS" />
          </div>
          <p className="text-white/20 font-bold text-sm mb-2">
            iABS ARENA — أكبر منصة ألعاب تفاعلية للبثوث المباشرة
          </p>
          <p className="text-white/10 font-bold text-xs">
            جميع الحقوق محفوظة © {new Date().getFullYear()} iABS
          </p>
        </div>
      </footer>
    </div>
  );
};
