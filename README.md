# منصة دليل الحسابات

نظام لإدارة الشركات، قوالب دليل الحسابات، الشجرة المحاسبية، وربط أدوار الحسابات النظامية. يحتوي المستودع على خدمة REST بـ .NET 10 وواجهة React عربية RTL قابلة للتجربة دون تشغيل الخدمة عبر وضع المحاكاة.

## ابدأ من هنا

- **الدليل التقني الكامل بالعربية:** [قراءة الدليل](docs/arabic-guide.md) — إعداد وتشغيل backend وfrontend، مرجع API، DTOs والتعدادات، قواعد العمل، الاختبارات، النشر والأمان، وملاحظات التكامل.
- **دليل الواجهة الأمامية:** [frontend/README.md](frontend/README.md) — أوامر الواجهة، صفحاتها وبنية ملفاتها.

## تشغيل الواجهة بسرعة

يتطلب Node.js إصدارًا يدعمه Vite 8 وnpm. وضع المحاكاة هو الافتراضي، فلا يحتاج هذا المسار إلى تشغيل .NET أو PostgreSQL:

```bash
cd frontend
npm ci
npm run dev
```

افتح رابط Vite الذي يظهر في الطرفية، غالبًا `http://localhost:5173`.

## تشغيل الخدمة الخلفية

يتطلب .NET SDK 10 وPostgreSQL. الإعداد الافتراضي في `ChartOfAccounts/appsettings.json` يستخدم قاعدة `ChartOfAccountDb` على `localhost:5432`؛ غيّر بيانات الاتصال قبل التشغيل:

```bash
export ConnectionStrings__Default='Host=localhost;Port=5432;Database=ChartOfAccountDb;Username=postgres;Password=غيّرها;Pooling=true;'
dotnet restore ChartOfAccounts.slnx
dotnet run --project ChartOfAccounts/ChartOfAccounts.csproj --launch-profile http
```

عنوان الخدمة الافتراضي `http://localhost:5126`. فحص `/ping` لا يحتاج إلى بيانات، لكن لا يتحقق من اتصال PostgreSQL؛ راجع السجلات وجرّب `GET /api/companies` للتحقق من قاعدة البيانات.

## ربط الواجهة بالـ API الحقيقي

```bash
cd frontend
VITE_API_MODE=real VITE_API_TARGET=http://localhost:5126 npm run dev
```

بدون `VITE_API_MODE=real` تعمل الواجهة على بيانات mock في الذاكرة. يشرح [الدليل الكامل](docs/arabic-guide.md) إعداد الوكيل، النشر خلف reverse proxy، مسارات REST، قواعد العمل، والتحذيرات الأمنية.

## التقنيات الأساسية

- Backend: ASP.NET Core / .NET 10، EF Core، PostgreSQL عبر Ramsha.
- Frontend: React 19، TypeScript، Vite 8، TanStack Query، TanStack Table v9، React Hook Form + Zod، Tailwind CSS v4.

## تنبيه قبل الإنتاج

الخدمة الحالية لا تتضمن مصادقة أو تفويضًا، وتسمح بسياسة CORS مفتوحة، كما أن تهيئة قاعدة البيانات تعتمد `EnsureCreatedAsync` لا migrations تلقائية. لا تعرضها على شبكة عامة أو تربطها ببيانات حقيقية قبل مراجعة الأمان وإدارة المخطط. التفاصيل وخطوات المعالجة موضحة في [الدليل التقني](docs/arabic-guide.md#النشر-والأمان).
