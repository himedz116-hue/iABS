export interface MahmahQuestion {
  id: string;
  points: number;
  text: string;
  answer: string;
  hints?: string[];
}

export interface MahmahCategory {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  questions: MahmahQuestion[]; // Should always be exactly 6 questions
}

export const MAHMAH_CATEGORIES: MahmahCategory[] = [
  {
    id: "sports",
    name: "الرياضة والكرة",
    emoji: "⚽",
    gradient: "from-green-500 to-emerald-700",
    questions: [
      { id: "s1", points: 100, text: "ما هي الدولة الفائزة بكأس العالم 2022؟", answer: "الأرجنتين" },
      { id: "s2", points: 100, text: "كم عدد لاعبي فريق كرة القدم في الملعب؟", answer: "11" },
      { id: "s3", points: 300, text: "في أي مدينة يقع ملعب سانتياغو بيرنابيو؟", answer: "مدريد" },
      { id: "s4", points: 300, text: "أول منتخب عربي يصل نصف نهائي كأس العالم؟", answer: "المغرب" },
      { id: "s5", points: 500, text: "من هو الهداف التاريخي لدوري أبطال أوروبا؟", answer: "كريستيانو رونالدو" },
      { id: "s6", points: 500, text: "من حصل على الكرة الذهبية 2023؟", answer: "ميسي" },
    ]
  },
  {
    id: "anime",
    name: "الأنمي",
    emoji: "⚔️",
    gradient: "from-purple-500 to-indigo-700",
    questions: [
      { id: "a1", points: 100, text: "ما اسم بطل أنمي ون بيس؟", answer: "لوفي" },
      { id: "a2", points: 100, text: "أنمي عن قراصنة يبحثون عن كنز؟", answer: "ون بيس" },
      { id: "a3", points: 300, text: "بطل أنمي هجوم العمالقة؟", answer: "إيرين" },
      { id: "a4", points: 300, text: "ما اسم عائلة كيلوا في هانتر؟", answer: "زولديك" },
      { id: "a5", points: 500, text: "المحقق الذي يطارد كيرا في ديث نوت؟", answer: "إل" },
      { id: "a6", points: 500, text: "ما اسم تقنية ناروتو المميزة (كرة زرقاء)؟", answer: "راسينغان" },
    ]
  },
  {
    id: "movies",
    name: "أفلام ومسلسلات",
    emoji: "🎬",
    gradient: "from-red-500 to-rose-700",
    questions: [
      { id: "m1", points: 100, text: "مسلسل كويتي شهير (درب الـ...)؟", answer: "درب الزلق" },
      { id: "m2", points: 100, text: "فيلم رسوم متحركة عن أسد يصبح ملك الغابة؟", answer: "الأسد الملك" },
      { id: "m3", points: 300, text: "اسم مسلسل السطو الإسباني الشهير؟", answer: "لا كاسا دي بابيل" },
      { id: "m4", points: 300, text: "العائلة حاكمة الشمال في صراع العروش؟", answer: "ستارك" },
      { id: "m5", points: 500, text: "تخصص والتر وايت في Breaking Bad؟", answer: "الكيمياء" },
      { id: "m6", points: 500, text: "من يلعب دور جاك في فيلم تايتنك؟", answer: "ليوناردو دي كابريو" },
    ]
  },
  {
    id: "gaming",
    name: "ألعاب الفيديو",
    emoji: "🎮",
    gradient: "from-blue-500 to-cyan-700",
    questions: [
      { id: "g1", points: 100, text: "لعبة بناء مكعبات شهيرة جداً؟", answer: "ماين كرافت" },
      { id: "g2", points: 100, text: "لعبة كرة قدم شهيرة من EA Sports؟", answer: "فيفا" },
      { id: "g3", points: 300, text: "اسم المدينة في لعبة GTA V؟", answer: "لوس سانتوس" },
      { id: "g4", points: 300, text: "لعبة باتل رويال من Epic Games؟", answer: "فورتنايت" },
      { id: "g5", points: 500, text: "بطل سلسلة God of War؟", answer: "كريتوس" },
      { id: "g6", points: 500, text: "في لعبة Valorant ما اسم العميل الذي يستخدم السكاكين؟", answer: "جيت" },
    ]
  },
  {
    id: "countries",
    name: "بلدان وعواصم",
    emoji: "🌍",
    gradient: "from-teal-500 to-green-700",
    questions: [
      { id: "c1", points: 100, text: "عاصمة المملكة العربية السعودية؟", answer: "الرياض" },
      { id: "c2", points: 100, text: "دولة عربية عاصمتها القاهرة؟", answer: "مصر" },
      { id: "c3", points: 300, text: "دولة خليجية نظمت كأس العالم 2022؟", answer: "قطر" },
      { id: "c4", points: 300, text: "عاصمة اليابان؟", answer: "طوكيو" },
      { id: "c5", points: 500, text: "أكبر دولة في العالم من حيث المساحة؟", answer: "روسيا" },
      { id: "c6", points: 500, text: "دولة تُعرف بـ بلاد الشمس المشرقة؟", answer: "اليابان" },
    ]
  },
  {
    id: "variety",
    name: "ثقافة عامة",
    emoji: "🧠",
    gradient: "from-yellow-500 to-amber-700",
    questions: [
      { id: "v1", points: 100, text: "كم عدد أيام السنة الميلادية؟", answer: "365" },
      { id: "v2", points: 100, text: "أكمل: عصفور في اليد خير من عشرة على الـ...", answer: "الشجرة" },
      { id: "v3", points: 300, text: "كم عدد قارات العالم؟", answer: "7" },
      { id: "v4", points: 300, text: "العنصر الكيميائي الذي رمزه O؟", answer: "الأكسجين" },
      { id: "v5", points: 500, text: "من مكتشف الجاذبية الأرضية؟", answer: "نيوتن" },
      { id: "v6", points: 500, text: "ما هو أصغر كوكب في المجموعة الشمسية؟", answer: "عطارد" },
    ]
  },
  {
    id: "science",
    name: "علوم وتكنولوجيا",
    emoji: "🔬",
    gradient: "from-sky-500 to-blue-700",
    questions: [
      { id: "sc1", points: 100, text: "ما الغاز الذي نتنفسه؟", answer: "الأكسجين" },
      { id: "sc2", points: 100, text: "من اخترع المصباح الكهربائي؟", answer: "إديسون" },
      { id: "sc3", points: 300, text: "ما هو أقرب كوكب للشمس؟", answer: "عطارد" },
      { id: "sc4", points: 300, text: "من مؤسس شركة تسلا؟", answer: "إيلون ماسك" },
      { id: "sc5", points: 500, text: "ما اسم أول رائد فضاء هبط على القمر؟", answer: "نيل أرمسترونغ" },
      { id: "sc6", points: 500, text: "ما هي سرعة الضوء تقريباً بالكيلومتر في الثانية؟", answer: "300000" },
    ]
  },
  {
    id: "history",
    name: "تاريخ",
    emoji: "📜",
    gradient: "from-orange-500 to-red-700",
    questions: [
      { id: "h1", points: 100, text: "في أي سنة فُتحت مكة المكرمة؟", answer: "8 هجري" },
      { id: "h2", points: 100, text: "من هو أول خليفة في الإسلام؟", answer: "أبو بكر الصديق" },
      { id: "h3", points: 300, text: "من بنى الأهرامات في مصر؟", answer: "الفراعنة" },
      { id: "h4", points: 300, text: "في أي عام سقطت الأندلس؟", answer: "1492" },
      { id: "h5", points: 500, text: "من هو فاتح القسطنطينية؟", answer: "محمد الفاتح" },
      { id: "h6", points: 500, text: "في أي قرن بدأت الثورة الصناعية؟", answer: "الثامن عشر" },
    ]
  }
];
