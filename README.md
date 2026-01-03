# Growth Plus - نموذج التسجيل

نموذج تسجيل احترافي باللغة العربية لبرنامج Growth Plus، مبني باستخدام Next.js 16 و React 19.

## المميزات

- 🎨 تصميم عصري واحترافي مع تدرجات لونية جميلة
- 🌐 دعم كامل للغة العربية (RTL)
- 📱 متجاوب تماماً مع جميع الأجهزة
- ✨ رسوم متحركة سلسة وجذابة باستخدام Framer Motion
- 🎯 نظام خطوات تفاعلي (Stepper)
- ✅ التحقق من صحة البيانات باستخدام Zod
- 🚫 بدون عناصر HTML الأصلية - جميع المكونات مخصصة
- 🎭 خط Almarai العربي المخصص

## التقنيات المستخدمة

- **Next.js 16** - إطار عمل React
- **React 19** - مكتبة بناء واجهات المستخدم
- **TypeScript** - لغة البرمجة
- **Tailwind CSS** - إطار عمل CSS
- **Framer Motion** - مكتبة الرسوم المتحركة
- **React Hook Form** - إدارة النماذج
- **Zod** - التحقق من صحة البيانات
- **Radix UI** - مكونات واجهة المستخدم

## البدء

### التثبيت

```bash
npm install
```

### تشغيل السيرفر المحلي

```bash
npm run dev
```

افتح المتصفح على [http://localhost:3000](http://localhost:3000)

### البناء للإنتاج

```bash
npm run build
npm start
```

## البنية

```
├── app/
│   ├── layout.tsx          # التخطيط الرئيسي
│   ├── page.tsx            # الصفحة الرئيسية
│   └── globals.css         # الأنماط العامة
├── components/
│   ├── ui/                 # مكونات واجهة المستخدم الأساسية
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── radio-group.tsx
│   │   ├── form.tsx
│   │   └── loading.tsx
│   ├── stepper.tsx         # مكون نظام الخطوات
│   └── step-one-form.tsx   # نموذج الخطوة الأولى
├── lib/
│   └── utils.ts            # دوال مساعدة
└── public/
    ├── logo.webp           # شعار البرنامج
    └── fonts/
        └── almarai/        # خط Almarai العربي
```

## الخطوة الأولى - المعلومات الأساسية

يتضمن النموذج الحالي الحقول التالية:

- **الاسم الكامل** - نص (حرفين على الأقل)
- **البريد الإلكتروني** - بريد إلكتروني صحيح
- **العمر** - رقم (من 18 إلى 100)
- **الجنس** - اختيار (ذكر/أنثى)
- **رقم الجوال** - رقم سعودي (يبدأ بـ 05 ويتكون من 10 أرقام)

## التخصيص

### الألوان

اللون الأساسي للبرنامج هو `#2A3984` ويمكن تغييره من:

- `app/globals.css` - متغيرات CSS
- `components/ui/*.tsx` - مكونات واجهة المستخدم

### إضافة خطوات جديدة

1. قم بتحديث مصفوفة `STEPS` في `app/page.tsx`
2. أنشئ مكون نموذج جديد (مثل `step-two-form.tsx`)
3. أضف الحالة والمنطق المناسب في `app/page.tsx`

## الترخيص

هذا المشروع مملوك لبرنامج Growth Plus.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
