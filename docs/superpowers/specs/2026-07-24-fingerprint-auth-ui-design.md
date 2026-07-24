# تصميم واجهات البصمة والمصادقة

## نظرة عامة

إضافة ثلاث شاشات جديدة لتطبيق iABS الحالي بنظام React + Vite + Tailwind CSS + Framer Motion:

1. **شاشة تسجيل البصمة** (`FingerprintEnrollPage`)
2. **شاشة التحقق من البصمة** (`FingerprintAuthPage`)
3. **شاشة نجاح المصادقة** (`AuthenticatedPage`)

الهدف: منح المستخدم تجربة دخول احترافية، آمنة بصرياً، وغنية بالرسوم المتحركة والتأثيرات ثلاثية الأبعاد.

## القرارات المصممة

- **النمط البصري:** سايبر سيكيوريتي داكن (Cyber-Security Dark).
- **الألوان:** الأسود العميق، الأحمر النيون لـ iABS (`#ff0000`)، والرمادي الزجاجي.
- **التأثيرات:** tilt 3D على البطاقة، حلقات نبض، خط مسح، تحول البصمة إلى علامة صح، انتقالات AnimatePresence، جسيمات خلفية.
- **التقنيات:** المكتبات الموجودة فقط: React 19، Tailwind CSS (CDN)، Framer Motion، Lucide React.
- **لا تبعيات جديدة.**

## المكونات الجديدة

### 1. `SecurityBackground`

خلفية مشتركة لكل شاشات الأمان.

- جسيمات حمراء صغيرة تتحرك ببطء عبر الشاشة.
- شبكة رقمية خافتة تتحرك بشكل متكرر.
- طبقة ضبابية داكنة في الأسفل لتنعيم الانتقال.

### 2. `FingerprintScanner`

الماسح الرئيسي ثلاثي الأبعاد.

- بطاقة زجاجية بتأثير tilt عند حركة الماوس (CSS perspective + rotateX/rotateY).
- دائرة ماسح مع:
  - حلقات نبض متحركة (Framer Motion scale + opacity).
  - خط مسح أحمر يتحرك عمودياً.
  - أيقونة بصمة بيضاء تملأ باللون الأحمر أثناء المسح.
- حالات وضوحة: `idle`, `scanning`, `success`, `error`.
- رسوم متحركة على الحالة: shimmer زجاجي، توهج نيون.

### 3. `FingerprintEnrollPage`

شاشة تسجيل بصمة جديدة.

- عنوان كبير: "تسجيل بصمة الأمان".
- `FingerprintScanner` في المنتصف.
- رسالة توجيه: "ضع إصبعك على الماسح".
- زر "بدء التسجيل".
- سيناريو التسجيل:
  1. الضغط على الزر يبدأ حالة `scanning`.
  2. محاكاة مسح لمدة 3 ثوانٍ.
  3. حفظ علامة "تم التسجيل" في `localStorage` (`fingerprint_enrolled`).
  4. انتقال تلقائي إلى `FingerprintAuthPage`.

### 4. `FingerprintAuthPage`

شاشة التحقق من البصمة.

- عنوان: "التحقق من الهوية".
- `FingerprintScanner` في حالة `scanning` تلقائياً.
- سيناريو المصادقة:
  1. يبدأ المسح تلقائياً لمدة 2.5 ثانية.
  2. عند النجاح: تحول البصمة إلى علامة صح، confetti، انتقال إلى `AuthenticatedPage`.
  3. عند الفشل: اهتزاز البطاقة، توهج أحمر، رسالة "البصمة غير متطابقة"، زر إعادة المحاولة.
- Fallback: زر "الدخول بكلمة المرور" يستخدم النظام الحالي `GlobalPasswordPage`.

### 5. `AuthenticatedPage`

شاشة نجاح المصادقة.

- شعار iABS كبير مع تأثير توهج نبض.
- رسالة ترحيب: "تمت المصادقة بنجاح".
- بطاقة المستخدم:
  - الصورة الرمزية (ProAvatar الموجودة).
  - اسم المستخدم.
  - الدور.
- شبكة إجراءات سريعة:
  - لوحة التحكم.
  - الألعاب.
  - الإعدادات.
- زر تسجيل الخروج.

## تدفق البيانات

```
App.tsx
  ├─> FingerprintEnrollPage (إذا لم يكن fingerprint_enrolled)
  ├─> FingerprintAuthPage (إذا لم يكن authenticated)
  └─> AuthenticatedPage (بعد المصادقة الناجحة)
```

### مفاتيح localStorage

- `fingerprint_enrolled`: `true` بعد التسجيل.
- `site_access_granted`: كائن المصادقة الحالي (يُحدّث ليشمل `method: 'fingerprint'`).

## التأثيرات ثلاثية الأبعاد والحركة

| التأثير | التقنية | الوصف |
|---------|---------|-------|
| Tilt 3D | CSS `perspective` + `rotateX/Y` | البطاقة تتمايل بسلاسة مع حركة الماوس |
| Pulse Rings | Framer Motion `scale`, `opacity` | حلقات تتوسع وتتلاشى من مركز الماسح |
| Scan Line | CSS `@keyframes` + translateY | خط أحمر يتحرك لأعلى وأسفل |
| Fingerprint Fill | SVG stroke-dashoffset | البصمة تُرسم تدريجياً باللون الأحمر |
| Success Morph | Framer Motion `layoutId` | البصمة تتحول إلى علامة صح |
| Page Transitions | Framer Motion `AnimatePresence` | انتقالات سلسة بين الشاشات |
| Confetti | `canvas-confetti` الموجودة | تأثير احتفالي عند النجاح |
| Glass Shimmer | CSS gradient animation | ومض ضوئي يمر عبر البطاقة |
| Floating Particles | Framer Motion | جسيمات حمراء تطفو في الخلفية |

## التعامل مع الأخطاء

- **مهلة المسح:** إذا لم يكتمل خلال 5 ثوانٍ، يُعاد تعيين الحالة إلى `idle` مع رسالة "يرجى إعادة المحاولة".
- **بصمة غير متطابقة:** اهتزاش البطاقة (Framer Motion shake)، توهج أحمر، رسالة خطأ واضحة.
- **عدم دعم البصمة:** زر fallback للدخول بكلمة المرور العالمية.
- **فشل localStorage:** عرض رسالة خطأ بدون إيقاف التطبيق.

## الاختبارات

- اختبار انتقال الحالات: `idle` → `scanning` → `success`.
- اختبار حالة الفشل: `scanning` → `error` → `idle`.
- اختبار حفظ `fingerprint_enrolled` في `localStorage`.
- اختبار عرض `AuthenticatedPage` بعد المصادقة.
- اختبار عدم وجود أخطاء TypeScript أو lint.

## الملفات الجديدة

- `src/components/SecurityBackground.tsx`
- `src/components/FingerprintScanner.tsx`
- `src/components/FingerprintEnrollPage.tsx`
- `src/components/FingerprintAuthPage.tsx`
- `src/components/AuthenticatedPage.tsx`

## الملفات المعدلة

- `App.tsx`: توجيه المستخدم إلى الشاشات الجديدة بناءً على حالة `fingerprint_enrolled` و `site_access_granted`.
- `index.css`: إضافة keyframes مخصصة للماسح والومض الزجاجي.

## المعايير المقبولة

- [ ] كل المكونات الجديدة تُعرض بلا أخطاء.
- [ ] تأثير tilt 3D يعمل على بطاقة الماسح.
- [ ] انتقالات الحالات (idle/scanning/success/error) سلسة وواضحة.
- [ ] المصادقة الناجحة تنتقل إلى `AuthenticatedPage`.
- [ ] تسجيل البصمة يحفظ الحالة في `localStorage`.
- [ ] لا توجد أخطاء TypeScript أو build.
