const fs = require('fs');
let code = fs.readFileSync('components/DrawingChallenge.tsx', 'utf-8');

// 1. Replace the WORDS_TO_DRAW array
const newWords = `const WORDS_TO_DRAW = [
    // سهلة جداً
    'شجرة', 'كرسي', 'طاولة', 'تفاحة', 'شمس', 'قمر', 'نجمة', 'سحابة', 'مطر', 'ثلج',
    'كتاب', 'قلم', 'باب', 'شباك', 'بيت', 'سيارة', 'طائرة', 'سفينة', 'قطار', 'دراجة',
    'قطة', 'كلب', 'فأر', 'سمكة', 'عصفور', 'بطة', 'دجاجة', 'بيضة', 'خبز', 'حليب',
    'كوب', 'صحن', 'ملعقة', 'شوكة', 'سكين', 'نظارة', 'ساعة', 'خاتم', 'مفتاح', 'قفل',
    'هاتف', 'تلفزيون', 'راديو', 'كمبيوتر', 'ماوس', 'لوحة مفاتيح', 'شاشة', 'سماعة', 'ميكروفون', 'كاميرا',
    'سرير', 'مخدة', 'بطانية', 'دولاب', 'مرآة', 'مشط', 'فرشاة', 'صابون', 'شامبو', 'منشفة',
    'قميص', 'بنطلون', 'فستان', 'حذاء', 'جوارب', 'قبعة', 'قفازات', 'وشاح', 'حزام', 'محفظة',
    'وردة', 'زهرة', 'عشب', 'ورقة', 'غصن', 'جذر', 'تراب', 'رمل', 'صخرة', 'جبل',
    'نهر', 'بحر', 'محيط', 'شاطئ', 'جزيرة', 'صحراء', 'غابة', 'حديقة', 'مزرعة', 'مدينة',
    'قرية', 'شارع', 'رصيف', 'إشارة مرور', 'جسر', 'نفق', 'مستشفى', 'مدرسة', 'مسجد', 'كنيسة',
    // متوسطة
    'أسد', 'نمر', 'فيل', 'زرافة', 'قرد', 'غوريلا', 'دب', 'ثعلب', 'ذئب', 'غزال',
    'حصان', 'حمار', 'بقرة', 'خروف', 'ماعز', 'جمل', 'نعامة', 'طاووس', 'بومة', 'نسر',
    'صقر', 'حمامة', 'غراب', 'ببغاء', 'ضفدع', 'سلحفاة', 'تمساح', 'ثعبان', 'سحلية', 'ديناصور',
    'قرش', 'حوت', 'دلفين', 'أخطبوط', 'سلطعون', 'قنديل البحر', 'نجمة البحر', 'حصان البحر', 'صدفة', 'لؤلؤة',
    'فراشة', 'نحلة', 'ذبابة', 'بعوضة', 'نملة', 'عنكبوت', 'عقرب', 'خنفساء', 'دودة', 'حلزون',
    'موز', 'برتقال', 'عنب', 'بطيخ', 'شمام', 'فراولة', 'كرز', 'خوخ', 'مشمش', 'برقوق',
    'أناناس', 'مانجو', 'كيوي', 'رمان', 'تين', 'تمر', 'ليمون', 'جزر', 'بطاطس', 'طماطم',
    'خيار', 'بصل', 'ثوم', 'فلفل', 'باذنجان', 'كوسا', 'قرع', 'ذرة', 'فطر', 'زيتون',
    'دراجة نارية', 'شاحنة', 'حافلة', 'سيارة إسعاف', 'سيارة شرطة', 'سيارة إطفاء', 'جرار', 'دبابة', 'مروحية', 'منطاد',
    'صاروخ', 'قمر صناعي', 'رائد فضاء', 'كوكب', 'مجرة', 'تلسكوب', 'مجهر', 'بوصلة', 'خريطة', 'كرة أرضية',
    // صعبة وممتعة
    'مكنسة', 'ممسحة', 'دلو', 'إسفنجة', 'مكواة', 'غسالة', 'ثلاجة', 'فرن', 'خلاط', 'ميكروويف',
    'مروحة', 'مكيف', 'مدفأة', 'مصباح', 'شمعة', 'مصباح يدوي', 'بطارية', 'سلك', 'قابس', 'مقبس',
    'مطرقة', 'مسمار', 'مفك', 'منشار', 'كماشة', 'مفتاح ربط', 'مثقاب', 'شريط لاصق', 'غراء', 'مقص',
    'مسطرة', 'ممحاة', 'براية', 'دباسة', 'مشبك ورق', 'دفتر', 'مغلف', 'طابع', 'صندوق', 'حقيبة',
    'مظلة', 'عصا', 'عكاز', 'كرسي متحرك', 'نظارة طبية', 'نظارة شمسية', 'عدسة مكبرة', 'منظار', 'صنارة صيد', 'شبكة',
    'خيمة', 'كيس نوم', 'نار مخيم', 'حطب', 'فأس', 'سيف', 'درع', 'رمح', 'قوس وسهم', 'بندقية',
    'مسدس', 'قنبلة', 'مدفع', 'دبابة', 'غواصة', 'حاملة طائرات', 'قراصنة', 'سفينة قراصنة', 'كنز', 'خريطة كنز',
    'تاج', 'صولجان', 'عرش', 'قلعة', 'حصن', 'برج', 'سور', 'بوابة', 'خندق', 'جسر متحرك',
    'ملك', 'ملكة', 'أمير', 'أميرة', 'فارس', 'ساحر', 'جنية', 'تنين', 'وحيد القرن', 'حورية بحر',
    'شبح', 'مصاص دماء', 'مومياء', 'زومبي', 'كائن فضائي', 'طبق طائر', 'إنسان آلي', 'آلة زمن', 'بوابة سحرية', 'عصا سحرية',
    'بيانو', 'جيتار', 'كمان', 'طبلة', 'مزمار', 'عود', 'قانون', 'ناي', 'ميكروفون', 'مكبر صوت',
    'ملعب', 'مسبح', 'صالة رياضية', 'كرة قدم', 'كرة سلة', 'كرة مضرب', 'مضرب', 'شبكة', 'حكم', 'كأس',
    'ميدالية', 'منصة تتويج', 'حلبة مصارعة', 'قفازات ملاكمة', 'لوح تزلج', 'زلاجات', 'دراجة هوائية', 'خوذة', 'طائرة ورقية', 'أرجوحة',
    'زحليقة', 'لعبة أحجية', 'مكعب روبيك', 'دمية', 'دب محشو', 'سيارة لعبة', 'قطار لعبة', 'طائرة لعبة', 'مسدس ماء', 'بالون',
    'مهرج', 'سيرك', 'خيمة سيرك', 'أرجوحة بهلوان', 'أسد في قفص', 'فيل بيلعب', 'عجلة فيريس', 'قطار الموت', 'شبح الملاهي', 'حصان الملاهي',
    'بيتزا', 'هامبرغر', 'ساندوتش', 'هوت دوج', 'تاكو', 'سوشي', 'نودلز', 'معكرونة', 'شوربة', 'سلطة',
    'كيك', 'بسكويت', 'شوكولاتة', 'حلوى', 'مصاصة', 'آيس كريم', 'عصير', 'قهوة', 'شاي', 'حليب',
    'دكتور', 'ممرضة', 'شرطي', 'إطفائي', 'جندي', 'طيار', 'بحار', 'طباخ', 'خباز', 'حلاق',
    'نجار', 'حداد', 'سباك', 'كهربائي', 'بناء', 'رسام', 'موسيقي', 'مغني', 'ممثل', 'مخرج',
    'محامي', 'قاضي', 'مهندس', 'معلم', 'طالب', 'عالم', 'رائد فضاء', 'مزارع', 'صياد', 'راعي',
    'لص', 'محقق', 'جاسوس', 'بطل خارق', 'شرير', 'نينجا', 'ساموراي', 'رجل ثلج', 'سانتا كلوز',
    'خفاش', 'قنفذ', 'خلد الماء', 'فقمة', 'فظ', 'بطريق'
];`;

const startIdx = code.indexOf('const WORDS_TO_DRAW = [');
const endIdx = code.indexOf('];', startIdx) + 2;
code = code.slice(0, startIdx) + newWords + code.slice(endIdx);

// 2. Add usedWords state
const stateInsertIdx = code.indexOf('const [isGenerating, setIsGenerating] = useState(false);');
const stateInsert = `const [isGenerating, setIsGenerating] = useState(false);\n    const [usedWords, setUsedWords] = useState<Set<string>>(new Set());`;
code = code.replace('const [isGenerating, setIsGenerating] = useState(false);', stateInsert);

// 3. Update selectWord
code = code.replace(
    'const selectWord = (w: string) => { setTargetWord(w); setTimer(config.roundDuration); setPhase(\'DRAWING\'); };',
    'const selectWord = (w: string) => { setTargetWord(w); setTimer(config.roundDuration); setPhase(\'DRAWING\'); setUsedWords(prev => new Set(prev).add(w)); };'
);

// 4. Update prepareNextRound to use the fast reliable local generation with usedWords filtering
const prepareNextRoundStart = code.indexOf('const prepareNextRound = async () => {');
const prepareNextRoundEnd = code.indexOf('};', prepareNextRoundStart) + 2;

const newPrepareNextRound = `const prepareNextRound = async () => {
        setIsGenerating(true);
        setPhase('SELECT_WORD');
        setWinner(null);
        engineRef.current?.clearLayer(engineRef.current.layers[1]?.id || '');
        engineRef.current?.composite();

        // Simulate a tiny delay for nice UI effect
        setTimeout(() => {
            const availableWords = WORDS_TO_DRAW.filter(w => !usedWords.has(w));
            
            // Shuffle
            for (let i = availableWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableWords[i], availableWords[j]] = [availableWords[j], availableWords[i]];
            }
            
            let selected: string[] = [];
            if (availableWords.length >= 3) {
                selected = availableWords.slice(0, 3);
            } else if (availableWords.length > 0) {
                selected = availableWords;
            } else {
                // Out of words! Reset usedWords and reshuffle all
                setUsedWords(new Set());
                const reshuffled = [...WORDS_TO_DRAW].sort(() => Math.random() - 0.5);
                selected = reshuffled.slice(0, 3);
            }
            
            setSuggestedWords(selected);
            setIsGenerating(false);
        }, 800);
    };`;

code = code.slice(0, prepareNextRoundStart) + newPrepareNextRound + code.slice(prepareNextRoundEnd);

fs.writeFileSync('components/DrawingChallenge.tsx', code);
console.log('Words expanded and logic updated.');
