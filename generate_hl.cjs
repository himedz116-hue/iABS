const fs = require('fs');

const categories = [
    { base: 'هل عدد سكان', subjects: ['اليابان', 'مصر', 'السعودية', 'فرنسا', 'الصين', 'الهند', 'البرازيل', 'ألمانيا', 'بريطانيا', 'كندا'], metric: 'مليون نسمة', min: 20, max: 1400 },
    { base: 'هل مساحة', subjects: ['روسيا', 'كندا', 'الصين', 'أمريكا', 'البرازيل', 'أستراليا', 'الهند', 'الأرجنتين', 'كازاخستان', 'الجزائر'], metric: 'مليون كيلومتر مربع', min: 1, max: 17 },
    { base: 'هل عدد مستخدمي', subjects: ['فيسبوك', 'يوتيوب', 'واتساب', 'إنستغرام', 'تيك توك', 'سناب شات', 'إكس (تويتر)', 'تيليجرام', 'ريديت', 'ديسكورد'], metric: 'النشطين مليون شهرياً', min: 300, max: 3000 },
    { base: 'هل سرعة', subjects: ['الفهد', 'الصقر', 'النعامة', 'الأسد', 'الحصان', 'الدلفين', 'القرش', 'الغزال', 'الكنغر', 'النسر'], metric: 'كم في الساعة', min: 40, max: 350 },
    { base: 'هل درجة حرارة', subjects: ['سطح الشمس', 'مركز الأرض', 'البركان', 'سطح الزهرة', 'سطح المريخ', 'الفضاء الخارجي', 'الماء المغلي', 'النيتروجين السائل'], metric: 'درجة مئوية', min: -200, max: 6000 },
    { base: 'هل ارتفاع', subjects: ['جبل إيفرست', 'برج خليفة', 'برج إيفل', 'تمثال الحرية', 'هرم خوفو', 'شلالات أنجل', 'جبل كليمنجارو', 'برج طوكيو'], metric: 'متر', min: 100, max: 9000 },
    { base: 'هل عمق', subjects: ['خندق ماريانا', 'البحر الميت', 'المحيط الأطلسي', 'المحيط الهندي', 'البحر الأحمر', 'البحر المتوسط', 'بحيرة بايكال'], metric: 'متر', min: 300, max: 11000 },
    { base: 'هل سنة إصدار', subjects: ['أول آيفون', 'بلايستيشن 1', 'لعبة ماينكرافت', 'فيلم تايتانيك', 'موقع يوتيوب', 'موقع جوجل', 'ويندوز 95', 'أول سيارة بنزين'], metric: 'ميلادي', min: 1880, max: 2015 },
    { base: 'هل مبيعات', subjects: ['بلايستيشن 4', 'نينتندو سويتش', 'آيفون 6', 'لعبة GTA V', 'لعبة ماينكرافت', 'لعبة تتريس', 'بلايستيشن 2'], metric: 'مليون نسخة/وحدة', min: 50, max: 300 },
    { base: 'هل عدد عظام', subjects: ['الإنسان البالغ', 'الطفل الرضيع', 'القطة', 'الكلب', 'الثعبان', 'القرش'], metric: 'عظمة', min: 0, max: 400 },
    { base: 'هل طول', subjects: ['نهر النيل', 'نهر الأمازون', 'سور الصين العظيم', 'نهر المسيسيبي', 'قناة السويس'], metric: 'كيلومتر', min: 150, max: 21000 },
    { base: 'هل وزن', subjects: ['الفيل الأفريقي', 'الحوت الأزرق', 'وحيد القرن', 'الزرافة', 'فرس النهر', 'الدب القطبي'], metric: 'كيلوجرام', min: 500, max: 150000 },
    { base: 'هل عدد حلقات', subjects: ['ون بيس', 'ناروتو شيبودن', 'المحقق كونان', 'دراغون بول زد', 'هجوم العمالقة', 'ديث نوت'], metric: 'حلقة', min: 37, max: 1100 },
    { base: 'هل عدد مشاهدات أغنية', subjects: ['Baby Shark', 'Despacito', 'Shape of You', 'See You Again', 'Gangnam Style'], metric: 'مليار مشاهدة', min: 3, max: 14 }
];

let questions = [];
let idCounter = 1;

for (let stage = 1; stage <= 30; stage++) {
    for (let q = 1; q <= 20; q++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const subject = cat.subjects[Math.floor(Math.random() * cat.subjects.length)];
        const refValue = Math.floor(Math.random() * (cat.max - cat.min + 1)) + cat.min;
        const isHigher = Math.random() > 0.5;
        const text = `${cat.base} ${subject} أعلى أم أقل من ${refValue} ${cat.metric}؟`;
        
        questions.push({
            id: idCounter++,
            stage_number: stage,
            question_text: text,
            is_higher: isHigher,
            fact: `هذه إحصائية تقريبية للتحدي في المرحلة ${stage}`
        });
    }
}

let sql = `CREATE TABLE IF NOT EXISTS public.higher_lower_questions (
    id SERIAL PRIMARY KEY,
    stage_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    is_higher BOOLEAN NOT NULL,
    fact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);\n\nTRUNCATE TABLE public.higher_lower_questions RESTART IDENTITY;\n\n`;

const batchSize = 100;
for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const values = batch.map(q => 
        `(${q.stage_number}, '${q.question_text.replace(/'/g, "''")}', ${q.is_higher}, '${q.fact}')`
    ).join(',\n');
    sql += `INSERT INTO public.higher_lower_questions (stage_number, question_text, is_higher, fact) VALUES \n${values};\n\n`;
}

fs.writeFileSync('C:/Users/MOH/.gemini/antigravity/brain/7fd37f07-aa4e-4fae-b0ff-b582ca911481/higher_lower_init.sql', sql, 'utf8');
console.log('Generated higher_lower_init.sql with 600 questions.');
