import re

file_path = r'C:\Users\MOH\Documents\GG\iABSS-main\iABSS-main\components\AboutPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add missing games to GAMES_DATA
missing_games = """  {
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
"""

# Insert right before the end of GAMES_DATA array (before the closing bracket ]; )
# We can find the closing bracket by looking for '  },\n]'
pattern = r'  \},\s*\];'
replacement = '  },\n' + missing_games + '];'

content = re.sub(pattern, replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added missing games successfully")
