const fs = require('fs');
let content = fs.readFileSync('components/DrawingChallenge.tsx', 'utf-8');

// Find the start of WORDS_TO_DRAW and its end (];)
const startMarker = "const WORDS_TO_DRAW = [";
const startIdx = content.indexOf(startMarker);

// Find the COLORS line which comes right after
const colorsMarker = "const COLORS = [";
const colorsIdx = content.indexOf(colorsMarker);

if (startIdx !== -1 && colorsIdx !== -1) {
    const newWordsArray = `const WORDS_TO_DRAW = [
    'سيارة', 'بيت', 'شجرة', 'شمس', 'قمر', 'بحر', 'كتاب', 'قلم', 'تفاحة', 'موزة',
    'قطة', 'كلب', 'اسد', 'فيل', 'طائرة', 'هاتف', 'كمبيوتر', 'كرسي', 'طاولة', 'خبز',
    'جامع', 'برج', 'سفينة', 'صحراء', 'جبل', 'بركان', 'نظارة', 'ساعة', 'مطر', 'ثلج',
    'وردة', 'فراشة', 'سمكة', 'نجمة', 'سحابة', 'نار', 'برتقال', 'عنب', 'بطيخ',
    'كرز', 'فراولة', 'أناناس', 'فأر', 'زرافة', 'قرد', 'نحلة', 'عنكبوت', 'سلحفاة', 'أرنب',
    'دراجة', 'موتوسيكل', 'شاحنة', 'صاروخ', 'خيمة', 'منارة', 'قلعة', 'هرم', 'بيتزا', 'همبرغر',
    'آيس كريم', 'كيك', 'دونات', 'قهوة', 'شاي', 'عصير', 'ساندوتش', 'جبنة', 'بيض',
    'مطرقة', 'مفتاح', 'سيف', 'درع', 'تاج', 'خاتم', 'حقيبة', 'مظلة', 'بيانو', 'جيتار',
    'طبلة', 'كاميرا', 'تلفزيون', 'راديو', 'مصباح', 'مروحة', 'مكيف', 'ثلاجة',
    'سرير', 'أريكة', 'فرشاة أسنان', 'صابون', 'مرآة', 'سجادة', 'منشفة', 'حذاء', 'قميص', 'قبعة',
    'بحيرة', 'نهر', 'شلال', 'غابة', 'نخلة', 'حديقة', 'صبار', 'فطر', 'دلفين', 'سمك قرش',
    'بالون', 'كرة قدم', 'كرة سلة', 'شطرنج', 'بولينج', 'تزلج', 'دمية', 'لغز',
    'ذهب', 'فضة', 'نحاس', 'الماس', 'ياقوت', 'زمرد', 'بلاستيك', 'زجاج', 'خشب', 'حديد'
];

`;
    content = content.substring(0, startIdx) + newWordsArray + content.substring(colorsIdx);
    console.log('Fixed WORDS_TO_DRAW array completely');
} else {
    console.log('Could not find markers', startIdx, colorsIdx);
}

fs.writeFileSync('components/DrawingChallenge.tsx', content);
console.log('File saved.');
