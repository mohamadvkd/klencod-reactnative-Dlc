# Dlc

مشروع React Native CLI مُنشأ بواسطة KlencodIDE.

## القالب: محوّل الوحدات (Unit Converter)

### الميزات
- 6 فئات: الطول، الوزن، الحرارة، البيانات، الوقت، المساحة
- أكثر من 35 وحدة قياس
- تبديل فوري بين الوحدات
- نسخ النتيجة بضغطة واحدة
- عرض الصيغة الحسابية
- تصميم Material 3 حديث
- بدون مكتبات خارجية، بدون إنترنت

## التقنيات
- React Native 0.76.7
- TypeScript
- Android Native (Kotlin + Java)
- GitHub Actions للبناء التلقائي

## البناء

يتم البناء تلقائياً على GitHub Actions عند الضغط على "بناء APK".

## الهيكل
- `App.tsx` — واجهة التطبيق (محوّل الوحدات)
- `index.js` — نقطة الدخول
- `android/` — مشروع Android الأصلي
- `.github/workflows/` — GitHub Actions
- `.klencod/project.json` — بيانات المشروع

## Package
``aof.fog.tgl``
