export interface CountryData {
  id: string; 
  iso2: string; 
  nameAr: string; 
  nameEn: string; 
  continent: string; 
  capital: string;
  center: [number, number];
  zoom: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export const COUNTRIES: CountryData[] = [
  // ================= EASY =================
  { id: "SAU", iso2: "SA", nameAr: "السعودية", nameEn: "Saudi Arabia", continent: "آسيا", capital: "الرياض", center: [45, 24], zoom: 4.5, difficulty: 'EASY' },
  { id: "EGY", iso2: "EG", nameAr: "مصر", nameEn: "Egypt", continent: "أفريقيا", capital: "القاهرة", center: [30, 27], zoom: 5, difficulty: 'EASY' },
  { id: "PSE", iso2: "PS", nameAr: "فلسطين", nameEn: "Palestine", continent: "آسيا", capital: "القدس", center: [35.2, 31.9], zoom: 18, difficulty: 'EASY' },
  { id: "USA", iso2: "US", nameAr: "امريكا", nameEn: "United States of America", continent: "أمريكا الشمالية", capital: "واشنطن", center: [-95, 38], zoom: 2.5, difficulty: 'EASY' },
  { id: "GBR", iso2: "GB", nameAr: "بريطانيا", nameEn: "United Kingdom", continent: "أوروبا", capital: "لندن", center: [-2, 54], zoom: 7, difficulty: 'EASY' },
  { id: "FRA", iso2: "FR", nameAr: "فرنسا", nameEn: "France", continent: "أوروبا", capital: "باريس", center: [2, 46], zoom: 6, difficulty: 'EASY' },
  { id: "RUS", iso2: "RU", nameAr: "روسيا", nameEn: "Russia", continent: "أوروبا وآسيا", capital: "موسكو", center: [90, 60], zoom: 1.5, difficulty: 'EASY' },
  { id: "CHN", iso2: "CN", nameAr: "الصين", nameEn: "China", continent: "آسيا", capital: "بكين", center: [104, 35], zoom: 2.5, difficulty: 'EASY' },
  { id: "BRA", iso2: "BR", nameAr: "البرازيل", nameEn: "Brazil", continent: "أمريكا الجنوبية", capital: "برازيليا", center: [-55, -10], zoom: 2.5, difficulty: 'EASY' },
  { id: "IND", iso2: "IN", nameAr: "الهند", nameEn: "India", continent: "آسيا", capital: "نيودلهي", center: [78, 22], zoom: 3.5, difficulty: 'EASY' },
  { id: "AUS", iso2: "AU", nameAr: "استراليا", nameEn: "Australia", continent: "أوقيانوسيا", capital: "كانبرا", center: [133, -25], zoom: 3, difficulty: 'EASY' },
  { id: "CAN", iso2: "CA", nameAr: "كندا", nameEn: "Canada", continent: "أمريكا الشمالية", capital: "أوتاوا", center: [-95, 60], zoom: 1.5, difficulty: 'EASY' },
  { id: "ITA", iso2: "IT", nameAr: "ايطاليا", nameEn: "Italy", continent: "أوروبا", capital: "روما", center: [12, 42], zoom: 6, difficulty: 'EASY' },
  { id: "ESP", iso2: "ES", nameAr: "اسبانيا", nameEn: "Spain", continent: "أوروبا", capital: "مدريد", center: [-4, 40], zoom: 6, difficulty: 'EASY' },
  { id: "DEU", iso2: "DE", nameAr: "المانيا", nameEn: "Germany", continent: "أوروبا", capital: "برلين", center: [10, 51], zoom: 6, difficulty: 'EASY' },
  { id: "JPN", iso2: "JP", nameAr: "اليابان", nameEn: "Japan", continent: "آسيا", capital: "طوكيو", center: [138, 36], zoom: 6, difficulty: 'EASY' },
  { id: "ARE", iso2: "AE", nameAr: "الامارات", nameEn: "United Arab Emirates", continent: "آسيا", capital: "أبو ظبي", center: [54, 24], zoom: 12, difficulty: 'EASY' },

  // ================= MEDIUM =================
  { id: "MAR", iso2: "MA", nameAr: "المغرب", nameEn: "Morocco", continent: "أفريقيا", capital: "الرباط", center: [-6, 32], zoom: 5, difficulty: 'MEDIUM' },
  { id: "DZA", iso2: "DZ", nameAr: "الجزائر", nameEn: "Algeria", continent: "أفريقيا", capital: "الجزائر", center: [2, 28], zoom: 3.5, difficulty: 'MEDIUM' },
  { id: "IRQ", iso2: "IQ", nameAr: "العراق", nameEn: "Iraq", continent: "آسيا", capital: "بغداد", center: [43, 33], zoom: 5, difficulty: 'MEDIUM' },
  { id: "SYR", iso2: "SY", nameAr: "سوريا", nameEn: "Syria", continent: "آسيا", capital: "دمشق", center: [39, 35], zoom: 7, difficulty: 'MEDIUM' },
  { id: "YEM", iso2: "YE", nameAr: "اليمن", nameEn: "Yemen", continent: "آسيا", capital: "صنعاء", center: [47, 15], zoom: 5, difficulty: 'MEDIUM' },
  { id: "MEX", iso2: "MX", nameAr: "المكسيك", nameEn: "Mexico", continent: "أمريكا الشمالية", capital: "مكسيكو سيتي", center: [-102, 23], zoom: 4, difficulty: 'MEDIUM' },
  { id: "ARG", iso2: "AR", nameAr: "الارجنتين", nameEn: "Argentina", continent: "أمريكا الجنوبية", capital: "بوينس آيرس", center: [-65, -35], zoom: 2.5, difficulty: 'MEDIUM' },
  { id: "TUR", iso2: "TR", nameAr: "تركيا", nameEn: "Turkey", continent: "أوروبا وآسيا", capital: "أنقرة", center: [35, 39], zoom: 5, difficulty: 'MEDIUM' },
  { id: "KOR", iso2: "KR", nameAr: "كوريا الجنوبية", nameEn: "South Korea", continent: "آسيا", capital: "سيول", center: [128, 36], zoom: 10, difficulty: 'MEDIUM' },
  { id: "IDN", iso2: "ID", nameAr: "اندونيسيا", nameEn: "Indonesia", continent: "آسيا", capital: "جاكرتا", center: [118, -2], zoom: 3, difficulty: 'MEDIUM' },
  { id: "ZAF", iso2: "ZA", nameAr: "جنوب افريقيا", nameEn: "South Africa", continent: "أفريقيا", capital: "بريتوريا", center: [24, -29], zoom: 4, difficulty: 'MEDIUM' },
  { id: "PRT", iso2: "PT", nameAr: "البرتغال", nameEn: "Portugal", continent: "أوروبا", capital: "لشبونة", center: [-8, 39], zoom: 8, difficulty: 'MEDIUM' },
  { id: "GRC", iso2: "GR", nameAr: "اليونان", nameEn: "Greece", continent: "أوروبا", capital: "أثينا", center: [22, 39], zoom: 8, difficulty: 'MEDIUM' },
  { id: "PAK", iso2: "PK", nameAr: "باكستان", nameEn: "Pakistan", continent: "آسيا", capital: "إسلام آباد", center: [70, 30], zoom: 5, difficulty: 'MEDIUM' },
  { id: "TUN", iso2: "TN", nameAr: "تونس", nameEn: "Tunisia", continent: "أفريقيا", capital: "تونس", center: [9, 34], zoom: 8, difficulty: 'MEDIUM' },
  { id: "JOR", iso2: "JO", nameAr: "الاردن", nameEn: "Jordan", continent: "آسيا", capital: "عمان", center: [36, 31], zoom: 12, difficulty: 'MEDIUM' },
  { id: "LBN", iso2: "LB", nameAr: "لبنان", nameEn: "Lebanon", continent: "آسيا", capital: "بيروت", center: [35.8, 33.8], zoom: 20, difficulty: 'MEDIUM' },
  { id: "KWT", iso2: "KW", nameAr: "الكويت", nameEn: "Kuwait", continent: "آسيا", capital: "الكويت", center: [47.5, 29.5], zoom: 15, difficulty: 'MEDIUM' },
  { id: "QAT", iso2: "QA", nameAr: "قطر", nameEn: "Qatar", continent: "آسيا", capital: "الدوحة", center: [51, 25.5], zoom: 20, difficulty: 'MEDIUM' },
  { id: "BHR", iso2: "BH", nameAr: "البحرين", nameEn: "Bahrain", continent: "آسيا", capital: "المنامة", center: [50.5, 26], zoom: 25, difficulty: 'MEDIUM' },
  { id: "OMN", iso2: "OM", nameAr: "عمان", nameEn: "Oman", continent: "آسيا", capital: "مسقط", center: [56, 21], zoom: 5, difficulty: 'MEDIUM' },

  // ================= HARD =================
  { id: "DJI", iso2: "DJ", nameAr: "جيبوتي", nameEn: "Djibouti", continent: "أفريقيا", capital: "جيبوتي", center: [42.5, 11.5], zoom: 25, difficulty: 'HARD' },
  { id: "MRT", iso2: "MR", nameAr: "موريتانيا", nameEn: "Mauritania", continent: "أفريقيا", capital: "نواكشوط", center: [-10, 20], zoom: 4, difficulty: 'HARD' },
  { id: "SOM", iso2: "SO", nameAr: "الصومال", nameEn: "Somalia", continent: "أفريقيا", capital: "مقديشو", center: [46, 5], zoom: 5, difficulty: 'HARD' },
  { id: "COM", iso2: "KM", nameAr: "جزر القمر", nameEn: "Comoros", continent: "أفريقيا", capital: "موروني", center: [43.3, -11.6], zoom: 35, difficulty: 'HARD' },
  { id: "MNG", iso2: "MN", nameAr: "منغوليا", nameEn: "Mongolia", continent: "آسيا", capital: "أولان باتور", center: [103, 46], zoom: 3, difficulty: 'HARD' },
  { id: "KGZ", iso2: "KG", nameAr: "قيرغيزستان", nameEn: "Kyrgyzstan", continent: "آسيا", capital: "بيشكيك", center: [74, 41], zoom: 8, difficulty: 'HARD' },
  { id: "TJK", iso2: "TJ", nameAr: "طاجيكستان", nameEn: "Tajikistan", continent: "آسيا", capital: "دوشنبه", center: [71, 38], zoom: 9, difficulty: 'HARD' },
  { id: "NPL", iso2: "NP", nameAr: "نيبال", nameEn: "Nepal", continent: "آسيا", capital: "كاتماندو", center: [84, 28], zoom: 8, difficulty: 'HARD' },
  { id: "BTN", iso2: "BT", nameAr: "بوتان", nameEn: "Bhutan", continent: "آسيا", capital: "تيمفو", center: [90, 27.5], zoom: 12, difficulty: 'HARD' },
  { id: "LSO", iso2: "LS", nameAr: "ليسوتو", nameEn: "Lesotho", continent: "أفريقيا", capital: "ماسيرو", center: [28, -29.5], zoom: 15, difficulty: 'HARD' },
  { id: "SWZ", iso2: "SZ", nameAr: "إسواتيني", nameEn: "Eswatini", continent: "أفريقيا", capital: "مبابان", center: [31.5, -26.5], zoom: 18, difficulty: 'HARD' },
  { id: "SUR", iso2: "SR", nameAr: "سورينام", nameEn: "Suriname", continent: "أمريكا الجنوبية", capital: "باراماريبو", center: [-56, 4], zoom: 8, difficulty: 'HARD' },
  { id: "GUY", iso2: "GY", nameAr: "غويانا", nameEn: "Guyana", continent: "أمريكا الجنوبية", capital: "جورج تاون", center: [-59, 5], zoom: 7, difficulty: 'HARD' },
  { id: "FJI", iso2: "FJ", nameAr: "فيجي", nameEn: "Fiji", continent: "أوقيانوسيا", capital: "سوفا", center: [178, -18], zoom: 15, difficulty: 'HARD' },
  { id: "VUT", iso2: "VU", nameAr: "فانواتو", nameEn: "Vanuatu", continent: "أوقيانوسيا", capital: "بورت فيلا", center: [168, -16], zoom: 15, difficulty: 'HARD' },
  { id: "PRK", iso2: "KP", nameAr: "كوريا الشمالية", nameEn: "North Korea", continent: "آسيا", capital: "بيونغ يانغ", center: [127, 40], zoom: 8, difficulty: 'HARD' },
  { id: "BLR", iso2: "BY", nameAr: "بيلاروسيا", nameEn: "Belarus", continent: "أوروبا", capital: "مينسك", center: [28, 53], zoom: 6, difficulty: 'HARD' },
  { id: "MDA", iso2: "MD", nameAr: "مولدوفا", nameEn: "Moldova", continent: "أوروبا", capital: "كيشيناو", center: [28.5, 47], zoom: 12, difficulty: 'HARD' },
  { id: "BDI", iso2: "BI", nameAr: "بوروندي", nameEn: "Burundi", continent: "أفريقيا", capital: "جيتيقا", center: [29.9, -3.3], zoom: 18, difficulty: 'HARD' },
  { id: "RWA", iso2: "RW", nameAr: "رواندا", nameEn: "Rwanda", continent: "أفريقيا", capital: "كيغالي", center: [29.8, -1.9], zoom: 18, difficulty: 'HARD' }
];
