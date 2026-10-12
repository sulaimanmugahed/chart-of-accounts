# الدليل التقني الكامل — منصة دليل الحسابات

> مرجع عربي للمطورين ومشغّلي النظام. يصف هذا الدليل الكود الموجود في المستودع حاليًا، بما فيه الفروق بين بيانات المحاكاة وبيانات الخدمة الفعلية. عند التعارض، تكون خدمة .NET هي المرجع لعقود الـ API وقواعد العمل.

## المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [المعمارية وبنية المستودع](#المعمارية-وبنية-المستودع)
3. [المتطلبات والتشغيل المحلي](#المتطلبات-والتشغيل-المحلي)
4. [الخدمة الخلفية: الإعداد والبيانات](#الخدمة-الخلفية-الإعداد-والبيانات)
5. [نموذج البيانات وقواعد المجال](#نموذج-البيانات-وقواعد-المجال)
6. [مرجع واجهة REST](#مرجع-واجهة-rest)
7. [التعدادات (Enums)](#التعدادات-enums)
8. [الأخطاء والتحقق](#الأخطاء-والتحقق)
9. [دليل الحسابات والتهيئة](#دليل-الحسابات-والتهيئة)
10. [الواجهة الأمامية](#الواجهة-الأمامية)
11. [المحاكاة والاتصال بالخدمة الحقيقية](#المحاكاة-والاتصال-بالخدمة-الحقيقية)
12. [الاختبارات والتحقق](#الاختبارات-والتحقق)
13. [النشر والأمان](#النشر-والأمان)
14. [الفروق المعروفة وملاحظات التكامل](#الفروق-المعروفة-وملاحظات-التكامل)
15. [استكشاف الأخطاء](#استكشاف-الأخطاء)
16. [خريطة الملفات](#خريطة-الملفات)

---

## نظرة عامة

المشروع نظام لإدارة **الشركات ودليل الحسابات**: إنشاء حسابات شجرية متعددة المستويات، تعريف قوالب معيارية، تطبيق قالب على شركة، وربط حسابات الشركة بأدوار النظام مثل النقدية والعملاء والموردين والإيرادات.

يتكون النظام من تطبيقين منفصلين:

- **Backend:** خدمة ASP.NET Core على .NET 10، مع EF Core ومزوّد PostgreSQL عبر Ramsha.
- **Frontend:** تطبيق React عربي باتجاه RTL يعمل بواسطة Vite. يستخدم TanStack Query لحالة الخادم، وTanStack Table للجداول، وReact Hook Form مع Zod للنماذج.

> النطاق الحالي هو إدارة دليل الحسابات وتهيئته وربط أدواره. لا تتضمن الخدمة الحالية دفتر قيود يومية أو ترحيل قيود أو أرصدة وتقارير مالية مكتملة أو تسجيل دخول وصلاحيات مستخدمين.

## المعمارية وبنية المستودع

```text
المتصفح
  └── React / Vite (frontend/src)
       ├── REST نسبي: /api/* و /ping
       └── في وضع التطوير: وكيل Vite إلى .NET، أو middleware محاكاة مضمّن

ASP.NET Core (.NET 10)
  ├── Controllers/       HTTP والمسارات
  ├── Services/          قواعد الاستخدام والتعامل مع البيانات
  ├── Domain/            الكيانات، التعدادات، وقواعد المجال
  ├── Dtos/              عقود الطلب والاستجابة
  └── Data/              EF Core DbContext، الإعدادات، والبيانات الأولية
       └── PostgreSQL
```

الاتصال في الواجهة يمر عبر `src/lib/http.ts` ثم عميل المورد في `src/api/` ثم hooks الميزة في `src/features/*/hooks.ts`. تحفظ TanStack Query النتائج مؤقتًا وتعيد جلب المفاتيح المتأثرة بعد عمليات التعديل.

## المتطلبات والتشغيل المحلي

### المتطلبات

- **.NET SDK 10** لتشغيل الخدمة الخلفية.
- **PostgreSQL** متاح عبر الشبكة؛ الإعداد الافتراضي يتوقع `localhost:5432`.
- **Node.js** بإصدار يدعمه Vite 8 (وفق القفل الحالي: `^20.19.0` أو `>=22.12.0`) وnpm.
- Git لنسخ المستودع.

### تشغيل PostgreSQL والخدمة الخلفية

شغّل PostgreSQL أولًا. القيمة الافتراضية في `ChartOfAccounts/appsettings.json` هي:

```text
Host=localhost;Port=5432;Database=ChartOfAccountDb;Username=postgres;Password=postgres;Pooling=true;
```

غيّرها حسب بيئتك، والأفضل تمريرها كمتغير بيئة بدل حفظ كلمة مرور حقيقية في ملف الإعدادات:

```bash
export ConnectionStrings__Default='Host=localhost;Port=5432;Database=ChartOfAccountDb;Username=postgres;Password=غيّرها;Pooling=true;'

dotnet restore ChartOfAccounts.slnx
dotnet run --project ChartOfAccounts/ChartOfAccounts.csproj --launch-profile http
```

على PowerShell يمكن ضبط المتغير قبل التشغيل هكذا:

```powershell
$env:ConnectionStrings__Default = 'Host=localhost;Port=5432;Database=ChartOfAccountDb;Username=postgres;Password=غيّرها;Pooling=true;'
dotnet run --project ChartOfAccounts/ChartOfAccounts.csproj --launch-profile http
```

ملف `launchSettings.json` يعرّف ملف التشغيل `http` على `http://localhost:5126`، وملف `https` على `https://localhost:7104` بالإضافة إلى `http://localhost:5126`. اختبر جاهزية الخدمة:

```bash
curl -i http://localhost:5126/ping
curl -i http://localhost:5126/api/companies
```

المسار `/ping` يعيد `200 OK` دون جسم استجابة. هو فحص حياة بسيط لا يتصل بقاعدة البيانات؛ كما أن `Program.cs` يسجل خطأ تهيئة قاعدة البيانات في السجل ثم يكمل تشغيل الخادم. لذلك قد ينجح `/ping` بينما استعلامات البيانات تفشل، واستخدم `GET /api/companies` للتحقق من الوصول الفعلي إلى DB.

### تشغيل الواجهة الأمامية

```bash
cd frontend
npm ci
npm run dev
```

افتح الرابط الذي يطبعه Vite (افتراضيًا `http://localhost:5173`). وضع التشغيل الافتراضي `mock`، لذا يمكن استعراض الواجهة واختبارها دون تشغيل PostgreSQL أو .NET.

### بناء الإنتاج ومعاينته

```bash
cd frontend
npm run build
npm run preview
```

البناء يخرج إلى `frontend/dist`. وضع المحاكاة يعمل في سيرفر Vite للتطوير وفي `vite preview`، لكنه **ليس خادمًا API مضمنًا داخل ملفات `dist`**؛ عند نشر ملفات ثابتة على استضافة عادية يجب توجيه `/api` و`/ping` إلى backend عبر reverse proxy، أو تشغيل خدمة API مناسبة.

## الخدمة الخلفية: الإعداد والبيانات

### إعدادات التطبيق

| الإعداد | المصدر الحالي | الغرض |
| --- | --- | --- |
| `ConnectionStrings:Default` | `appsettings.json` أو `ConnectionStrings__Default` | اتصال PostgreSQL الافتراضي. |
| `AllowedHosts` | `appsettings.json` (`*`) | مضيفات ASP.NET المقبولة؛ يجب تضييقها في الإنتاج حسب الاستضافة. |
| `Logging:LogLevel` | `appsettings*.json` | مستوى سجلات التطبيق وASP.NET Core. |
| `VITE_API_MODE` | بيئة Vite | `mock` افتراضيًا أو `real` للواجهة. |
| `VITE_API_TARGET` | بيئة Vite | هدف وكيل التطوير عند `VITE_API_MODE=real`، افتراضيًا `http://localhost:5126`. |
| `VITE_API_BASE_URL` | بيئة الواجهة | بادئة اختيارية لطلبات HTTP النسبية؛ تترك فارغة عادةً عند استخدام وكيل Vite أو reverse proxy. |

يوفر المشروع ملف `appsettings.Development.json` لإعدادات السجلات فقط. لا تضع بيانات اعتماد إنتاجية في Git.

### ما يحدث عند بدء الخدمة

ينفذ `Program.cs` الخطوات التالية عند كل إقلاع:

1. ينشئ `AppDbContext` ويستدعي `Database.EnsureCreatedAsync()`.
2. يضيف القوالب المعيارية الناقصة بحسب رمز القالب.
3. إذا كان جدول الشركات فارغًا تمامًا، ينشئ ثلاث شركات تجريبية:
   - `COMP-001` — شركة الأمل للتجارة والاستيراد، عمق أقصى 5، عملة `SAR`.
   - `COMP-002` — مكتب الرواد للحلول التقنية والاستشارات، عمق أقصى 4، عملة `SAR`.
   - `COMP-003` — متجر النور للمبيعات السريعة، عمق أقصى 3، عملة `SAR`.
4. يهيّئ `COMP-001` بقالب `COMMERCIAL_IFRS` و`COMP-002` بقالب `SERVICES_PROFESSIONAL` في الوضع `Strict` مع الربط التلقائي للأدوار. تبقى الشركة الثالثة بلا تهيئة تلقائية.

إن وُجدت شركة واحدة أو أكثر، لا يضيف كود الإقلاع الشركات التجريبية ولا ينفّذ التهيئة التلقائية لها. يستمر بذر القوالب التي لا توجد مسبقًا.

> **تنبيه قاعدة البيانات:** الكود الحالي يستخدم `EnsureCreatedAsync` وليس `MigrateAsync`. وجود ملفات داخل `ChartOfAccounts/Migrations` لا يعني أنها تُطبّق تلقائيًا عند الإقلاع. `EnsureCreated` مناسب لقاعدة جديدة/تجريبية، لكنه لا يدير ترقية مخطط قاعدة بيانات موجودة. قبل اعتماد مسار migrations للإنتاج، اختر استراتيجية واحدة وطبّقها واختبر ترقية البيانات؛ لا تخلط `EnsureCreated` وEF migrations على قاعدة واحدة.

### الطبقات والمسؤوليات

- `Controllers/`: تحويل HTTP إلى استدعاءات خدمة وإرجاع أكواد HTTP وDTOs.
- `Services/`: قواعد العمليات مثل إنشاء الحساب، منع التكرار، التحقق من العمق، التهيئة، وربط الأدوار.
- `Domain/`: كيانات المجال وعملياتها الداخلية والاستثناءات المخصصة.
- `Dtos/`: أشكال الطلبات والاستجابات.
- `Data/AppDbContext.cs`: DbSets وتجميع تكوينات EF Core.
- `Data/AccountConfiguration.cs`: الفهارس والعلاقات وقواعد الحذف.
- `Data/Seed.cs`: القوالب المعيارية الافتراضية.

## نموذج البيانات وقواعد المجال

### الكيانات والجداول

| الجدول | دوره وأهم حقوله |
| --- | --- |
| `Companies` | بيانات الشركة، رمزها، عملتها، بداية سنتها المالية، حد عمق الدليل، وحالة التهيئة والقالب المستخدم. |
| `Accounts` | الحساب الفعلي: الرمز، الاسمان، النوع والطبيعة والتصنيف، المستوى، الأب، خصائص الترحيل، الدور النظامي، ومسار الشجرة. |
| `CoaTemplates` | بيانات القالب: الرمز، الصناعة، العمق الموصى به، الإصدار، ونوع القالب. |
| `CoaTemplateNodes` | بنود القالب المسطحة مع `ParentNodeCode` لتكوين شجرة عند التطبيق. |
| `CompanySystemAccounts` | ربط دور نظامي واحد بحساب شركة، مع القفل والملاحظات ووقت الإسناد. |
| `CoaInitializationAuditLogs` | نتيجة كل محاولة تهيئة/دمج مسجلة: الحالة، الأعداد، المدة، الخطأ والتفاصيل. |

### العلاقات والفهارس المهمة

- لكل شركة رموز شركات فريدة (`Companies.Code`).
- رمز الحساب فريد داخل الشركة: `(CompanyId, Code)`؛ يمكن لشركتين استخدام الرمز نفسه.
- الدور النظامي فريد داخل الشركة: `(CompanyId, Role)`.
- رمز القالب فريد على مستوى النظام، ورمز بند القالب فريد داخل القالب.
- توجد فهارس للاستعلام حسب الشركة والمستوى، وقابلية الترحيل، ومسار النسب، وكذلك سجلات التدقيق حسب الشركة والتاريخ.
- حسابات الشركة وربوطها وسجلات التدقيق مرتبطة بالشركة. حذف الأب في شجرة الحسابات مقيّد (`Restrict`)؛ حذف حساب مرتبط بدور نظامي مقيّد أيضًا. حذف قالب يحذف بنوده التابعة (Cascade).

### قواعد الشركة والحسابات

- `MaxAccountDepth` بين **3 و10**، والقيمة الافتراضية 5.
- بداية السنة المالية شهر من 1 إلى 12؛ القيمة الافتراضية 1.
- إنشاء الحساب يحتاج `CompanyId` صالحًا ورمزًا واسمًا عربيًا.
- الحساب الجذري في المستوى 1؛ مستوى الابن يساوي مستوى الأب + 1.
- يجب أن يكون نوع الابن المحاسبي مطابقًا لنوع الأب، والأب يجب أن يكون ضمن الشركة نفسها.
- لا يجوز تجاوز عمق الشركة؛ عند إضافة أول ابن إلى حساب تحليلي يحوّله النظام تلقائيًا إلى حساب تجميعي غير قابل للترحيل.
- عند إنشاء حساب تجميعي (`IsHeader=true`) تُفرض `IsPostable=false`. الحسابات القابلة للترحيل هي الحسابات التحليلية المناسبة لإسناد القيود من الأنظمة المستهلكة.
- افتراضيًا: الأصول والمصروفات طبيعتها مدينة؛ الخصوم وحقوق الملكية والإيرادات دائنة. الأصول والخصوم وحقوق الملكية تُصنّف ضمن قائمة المركز المالي، والإيرادات والمصروفات ضمن قائمة الدخل. يمكن للطلب تحديد القيم اختياريًا.
- `LineagePath` مسار نصي مادي مثل `/1/11/1101/` لتتبع النسب.
- تعديل الحساب عبر `PUT` يغيّر الاسم والوصف والعملة وحالة النشاط فقط؛ لا يغيّر الرمز أو النوع أو الأب.
- لا يحذف الحساب إذا كان له أبناء أو كان مربوطًا بدور نظامي.
- خفض عمق الشركة غير مسموح إذا أصبح أقل من أعلى مستوى موجود. تغيير العمق خارج النطاق 3–10 مرفوض.

### قوالب النظام

| الرمز | المعرف الثابت | الغرض | عمق موصى به |
| --- | --- | --- | ---: |
| `COMMERCIAL_IFRS` | `11111111-1111-1111-1111-111111111111` | أنشطة تجارية، مخزون، ضريبة قيمة مضافة، عملاء وموردون. | 5 |
| `SERVICES_PROFESSIONAL` | `22222222-2222-2222-2222-222222222222` | شركات الخدمات المهنية والاستشارات. | 4 |
| `SME_SIMPLIFIED` | `33333333-3333-3333-3333-333333333333` | منشآت صغيرة ودليل مبسط من ثلاثة مستويات. | 3 |

تفاصيل أعداد البنود الفعلية في backend موضحة في [فروق المحاكاة](#الفروق-المعروفة-وملاحظات-التكامل)، لأن بيانات mock في الواجهة موسعة ومختلفة حاليًا.

## مرجع واجهة REST

### قواعد عامة

- العنوان الافتراضي: `http://localhost:5126`.
- جميع المسارات ترجع JSON ما لم تكن الاستجابة `204 No Content` أو `/ping`.
- استخدم ترويسة `Content-Type: application/json` مع الطلبات ذات الجسم.
- الحقول في أمثلة JSON بصيغة `camelCase`. حقول التعداد ترسل عادةً بأرقامها؛ راجع جدول [التعدادات](#التعدادات-enums).
- `Guid` الشركة يمرر كمعامل استعلام في معظم واجهات الحسابات والأدوار. استخرج المعرّفات أولًا من `GET /api/companies` أو `GET /api/templates`.

### فهرس المسارات

| المورد | الطريقة والمسار | الاستخدام والاستجابة الناجحة |
| --- | --- | --- |
| الصحة | `GET /ping` | `200` فارغ؛ فحص جاهزية بسيط. |
| الشركات | `GET /api/companies` | قائمة `CompanyDto[]`. |
| الشركات | `GET /api/companies/{id}` | `CompanyDto`؛ `404` إذا لم توجد. |
| الشركات | `POST /api/companies` | إنشاء شركة؛ `201 Created`. |
| الشركات | `PUT /api/companies/{id}` | تعديل الاسم والرقم الضريبي وعملة الأساس؛ `200`. |
| الشركات | `PUT /api/companies/{id}/depth` | تعديل العمق؛ **الجسم رقم JSON خام** مثل `5`؛ `200`. |
| الحسابات | `GET /api/accounts/tree?companyId={guid}` | شجرة متداخلة من `AccountTreeNodeDto[]`. |
| الحسابات | `GET /api/accounts?companyId={guid}&maxLevel={n}&postableOnly={bool}` | قائمة مسطحة. `maxLevel` يعني المستوى ≤ n؛ `postableOnly=true` يرشّح الحسابات القابلة للترحيل. |
| الحسابات | `GET /api/accounts/{id}?companyId={guid}` | تفاصيل الحساب؛ `404` إذا لم يوجد في الشركة. |
| الحسابات | `POST /api/accounts` | إنشاء حساب؛ `201 Created`. `CompanyId` داخل جسم الطلب. |
| الحسابات | `PUT /api/accounts/{id}?companyId={guid}` | تعديل الاسم والوصف والعملة والنشاط؛ `200`. |
| الحسابات | `DELETE /api/accounts/{id}?companyId={guid}` | حذف؛ `204` عند النجاح، `404` إذا لم يوجد. |
| القوالب | `GET /api/templates` | قائمة ملخصات القوالب. |
| القوالب | `GET /api/templates/{id}` | تفاصيل القالب مع `Nodes`. |
| القوالب | `GET /api/templates/code/{code}` | تفاصيل قالب حسب الرمز مثل `SME_SIMPLIFIED`. |
| القوالب | `POST /api/templates` | إنشاء قالب مخصص؛ `201 Created`. |
| التهيئة | `POST /api/initialization/validate` | تحقق مسبق من وجود الشركة والقالب والعمق والحسابات القائمة؛ `200` مع `ValidationResultDto`. |
| التهيئة | `POST /api/initialization/initialize` | تطبيق/دمج/محاكاة قالب؛ `200` عند النجاح. |
| التهيئة | `GET /api/initialization/audit-logs/{companyId}` | سجل التدقيق مرتبًا من الأحدث إلى الأقدم. |
| الأدوار النظامية | `GET /api/system-accounts?companyId={guid}` | قائمة ربط الأدوار بالشركة. |
| الأدوار النظامية | `GET /api/system-accounts/{role}?companyId={guid}` | الحساب المرتبط بدور مثل `CashOnHand`؛ `404` إذا لم يربط. |
| الأدوار النظامية | `POST /api/system-accounts?companyId={guid}` | إنشاء/تحديث ربط دور؛ `200`. |
| الأدوار النظامية | `GET /api/system-accounts/validate-critical?companyId={guid}` | تحقق من اكتمال الأدوار الحرجة؛ `200` مع نتيجة ورسالة. |

هناك مسارات بديلة متوافقة مع أسماء المتحكمات:

- القوالب: `/api/coatemplates/...` إلى جانب `/api/templates/...`.
- التهيئة: `/api/coainitialization/...` إلى جانب `/api/initialization/...`.
- الحسابات النظامية: `/api/systemaccounts/...` إلى جانب `/api/system-accounts/...`.

### حقول DTOs الرئيسية

التواريخ (`...AtUtc`, `timestampUtc`) تُرسل بصيغة ISO 8601 بتوقيت UTC. الحقول الاختيارية قد تكون `null` أو غير موجودة حسب الطلب.

| DTO | الحقول |
|---|---|
| `CompanyDto` | `id`, `code`, `nameArabic`, `nameEnglish`, `taxNumber`, `baseCurrency`, `fiscalYearStartMonth`, `maxAccountDepth`, `isCoaInitialized`, `initializedFromTemplateId`, `initializedAtUtc`, `totalAccountsCount`, `isActive`. |
| `AccountDto` | `id`, `companyId`, `code`, `nameArabic`, `nameEnglish`, `accountType`/`accountTypeName`, `normalBalance`/`normalBalanceName`, `classification`/`classificationName`, `level`, `parentAccountId`, `parentAccountCode`, `isHeader`, `isPostable`, `isActive`, `systemRole`/`systemRoleName`, `lineagePath`, `description`, `currencyCode`, `childrenCount`. |
| `AccountTreeNodeDto` | `id`, `code`, `nameArabic`, `nameEnglish`, `accountType`, `normalBalance`, `classification`, `level`, `parentAccountId`, `isHeader`, `isPostable`, `isActive`, `systemRole`, `lineagePath`, `children[]` المتداخلة. |
| `CoaTemplateDto` | `id`, `code`, `nameArabic`, `nameEnglish`, `industryType`, `recommendedMaxDepth`, `description`, `isActive`, `isSystemTemplate`, `version`, `totalNodesCount`, `systemRolesDefinedCount`. |
| `CoaTemplateDetailDto` / `CoaTemplateNodeDto` | التفاصيل تضيف `nodes[]`; حقول كل عقدة: `id`, `code`, `nameArabic`, `nameEnglish`, `accountType`, `normalBalance`, `classification`, `level`, `parentNodeCode`, `isHeader`, `isPostable`, `defaultSystemRole`/`defaultSystemRoleName`, `description`. |
| `ValidationResultDto` | `canInitialize`, `isCompanyAlreadyInitialized`, `existingAccountsCount`, `companyMaxDepth`, `templateMaxDepth`, `depthCompatible`, `validationErrors[]`, `validationWarnings[]`. |
| `InitializeCoaResultDto` | `isSuccess`, `companyId`, `companyName`, `templateId`, `templateName`, `status`, `accountsCreatedCount`, `systemRolesMappedCount`, `maxDepthEnforced`, `durationMs`, `message`, `warnings[]`, `mappedRoles[]`. |
| `SystemAccountMappingDto` | `id`, `companyId`, `role`/`roleName`, `accountId`, `accountCode`, `accountNameArabic`, `accountNameEnglish`, `accountType`, `isLocked`, `assignedAtUtc`, `notes`. |
| نتيجة فحص الأدوار الحرجة | `companyId`, `allCriticalRolesMapped`, `message`. |
| سجل التدقيق | `id`, `companyId`, `templateId`, `templateName`, `status` كنص، `accountsCreatedCount`, `systemRolesMappedCount`, `executionDurationMs`, `errorMessage`, `timestampUtc`, `detailsJson`. |

### أشكال الطلبات

| الطلب | الحقول |
|---|---|
| `CreateCompanyRequest` | `code`, `nameArabic`, `nameEnglish`, `taxNumber?`, `baseCurrency` (افتراضي `SAR`), `fiscalYearStartMonth` (افتراضي 1), `maxAccountDepth` (افتراضي 5). |
| `UpdateCompanyRequest` | `nameArabic`, `nameEnglish`, `taxNumber?`, `baseCurrency`. الرمز والعمق لهما مسارا إدارة منفصلان. |
| `CreateAccountRequest` | `companyId`, `code`, الاسمان، `accountType`, `normalBalance?`, `classification?`, `parentAccountId?`, `isHeader` (افتراضي false), `isPostable` (افتراضي true), `systemRole?`, `description?`, `currencyCode?`. |
| `UpdateAccountRequest` | `nameArabic`, `nameEnglish`, `description?`, `currencyCode?`, `isActive` (افتراضي true). لا يغيّر النوع أو الرمز أو الأب. |
| `CreateTemplateRequest` | `code`, `nameArabic`, `nameEnglish`, `industryType` (افتراضي General)، `recommendedMaxDepth` (افتراضي 5)، `description?`, `nodes[]`. كل عقدة تقبل `code`, الاسمين، `accountType`, `normalBalance?`, `classification?`, `level`, `parentNodeCode?`, `isHeader`, `isPostable`, `defaultSystemRole?`, `description?`. |
| `ValidatePrerequisitesRequest` | `companyId`, `templateId`. |
| `InitializeCoaRequest` | `companyId`, `templateId`, `mode` (افتراضي 1/Strict)، `autoMapSystemRoles` (افتراضي true)، `accountCodePrefix?`. |
| `UpdateSystemAccountMappingRequest` | `role`, `accountId`, `isLocked` (افتراضي false), `forceIfLocked` (افتراضي false), `notes?`. |

### طلب إنشاء شركة

```http
POST /api/companies
Content-Type: application/json
```

```json
{
  "code": "COMP-004",
  "nameArabic": "شركة تجريبية",
  "nameEnglish": "Demo Company",
  "taxNumber": "300000000000003",
  "baseCurrency": "SAR",
  "fiscalYearStartMonth": 1,
  "maxAccountDepth": 5
}
```

`code` يحوّل إلى أحرف كبيرة ويجب أن يكون فريدًا. `baseCurrency` الافتراضي `SAR`، وشهر السنة المالية الافتراضي 1، والعمق الافتراضي 5. استجابة الإنشاء `201` وبها `CompanyDto`، بما في ذلك `id` لاستخدامه لاحقًا.

### طلب إنشاء حساب

```http
POST /api/accounts
Content-Type: application/json
```

```json
{
  "companyId": "<COMPANY_GUID>",
  "code": "110101",
  "nameArabic": "الصندوق الرئيسي",
  "nameEnglish": "Main Cash",
  "accountType": 1,
  "parentAccountId": "<PARENT_ACCOUNT_GUID>",
  "isHeader": false,
  "isPostable": true,
  "description": "حساب النقدية",
  "currencyCode": "SAR"
}
```

`normalBalance` و`classification` اختياريان ويحددهما الخادم افتراضيًا من نوع الحساب. الحساب الجذري لا يرسل `parentAccountId` أو يرسله `null`.

### إنشاء قالب مخصص

العقد يرسل بنود القالب في مصفوفة واحدة؛ يربط كل ابن بأبيه من خلال `parentNodeCode`:

```json
{
  "code": "RETAIL_CUSTOM",
  "nameArabic": "قالب متجر مخصص",
  "nameEnglish": "Custom Retail Template",
  "industryType": "Retail",
  "recommendedMaxDepth": 3,
  "description": "قالب مختصر للعرض التوضيحي",
  "nodes": [
    {
      "code": "1",
      "nameArabic": "الأصول",
      "nameEnglish": "Assets",
      "accountType": 1,
      "level": 1,
      "parentNodeCode": null,
      "isHeader": true,
      "isPostable": false
    },
    {
      "code": "11",
      "nameArabic": "الأصول المتداولة",
      "nameEnglish": "Current Assets",
      "accountType": 1,
      "level": 2,
      "parentNodeCode": "1",
      "isHeader": true,
      "isPostable": false
    }
  ]
}
```

يتحقق backend من عدم تكرار الأكواد، وجود الأب، أن المستوى يساوي مستوى الأب + 1، تطابق نوع الحساب، وأن الجذر بالمستوى 1. ينشأ القالب المرسل كقالب غير نظامي (`IsSystemTemplate=false`).

### التحقق والتهيئة

فحص المتطلبات:

```http
POST /api/initialization/validate
Content-Type: application/json
```

```json
{
  "companyId": "<COMPANY_GUID>",
  "templateId": "33333333-3333-3333-3333-333333333333"
}
```

يشمل الناتج: `canInitialize`، `isCompanyAlreadyInitialized`، `existingAccountsCount`، `companyMaxDepth`، `templateMaxDepth`، `depthCompatible`، وقائمتي `validationErrors` و`validationWarnings`.

تطبيق القالب في وضع الدمج الآمن:

```http
POST /api/initialization/initialize
Content-Type: application/json
```

```json
{
  "companyId": "<COMPANY_GUID>",
  "templateId": "33333333-3333-3333-3333-333333333333",
  "mode": 2,
  "autoMapSystemRoles": true,
  "accountCodePrefix": null
}
```

تحتوي استجابة `InitializeCoaResultDto` على النجاح، الشركة والقالب، الحالة، عدد الحسابات المنشأة والأدوار المعينة، العمق المفروض، المدة، الرسالة، التحذيرات، والروابط المنشأة في `mappedRoles`.

### ربط دور نظامي

```http
POST /api/system-accounts?companyId=<COMPANY_GUID>
Content-Type: application/json
```

```json
{
  "role": 1,
  "accountId": "<POSTABLE_ACCOUNT_GUID>",
  "isLocked": false,
  "forceIfLocked": false,
  "notes": "إعداد أولي"
}
```

يجب أن يكون الحساب موجودًا في الشركة نفسها وقابلًا للترحيل وغير تجميعي، ومن النوع المتوقع للدور. إذا كان الربط الحالي مقفلًا، لا تغيّره إلا بتمرير `forceIfLocked: true`. هذا الخيار استثناء منطقي في API وليس بديلًا عن صلاحيات مستخدم؛ الخدمة الحالية لا تطبق مصادقة/تفويض.

## التعدادات (Enums)

قيم الأعداد التالية هي القيم الرقمية المستخدمة في عقود .NET. تعرض الواجهة الأمامية التسميات العربية وتطبّع القيم الرقمية أو النصية الواردة.

### نوع الحساب `AccountType`

| القيمة | الاسم | الوصف |
|---:|---|---|
| 1 | `Asset` | الأصول. |
| 2 | `Liability` | الخصوم والالتزامات. |
| 3 | `Equity` | حقوق الملكية. |
| 4 | `Revenue` | الإيرادات. |
| 5 | `Expense` | المصروفات. |

### الطبيعة والتصنيف

| التعداد | القيمة | الاسم |
|---|---:|---|
| `NormalBalance` | 1 | `Debit` — مدين. |
| `NormalBalance` | 2 | `Credit` — دائن. |
| `AccountClassification` | 1 | `BalanceSheet` — قائمة المركز المالي. |
| `AccountClassification` | 2 | `IncomeStatement` — قائمة الدخل. |

### أوضاع التهيئة `InitializationMode`

| القيمة | الاسم | السلوك |
|---:|---|---|
| 1 | `Strict` | إنشاء أولي فقط؛ يرفض التنفيذ إذا كانت للشركة حسابات قائمة. |
| 2 | `IdempotentMerge` | يضيف الحسابات الناقصة بحسب رمز القالب ولا يستبدل الحسابات الموجودة أو الربوط النظامية الموجودة. |
| 3 | `DryRun` | يحاكي النتائج دون حفظ حسابات أو ربط أو سجل تدقيق. |

### حالة التهيئة `InitializationStatus`

| القيمة | الاسم | المعنى |
|---:|---|---|
| 1 | `Pending` | قيد المعالجة. |
| 2 | `Success` | نجاح التهيئة. |
| 3 | `Failed` | فشل؛ يسجل النظام محاولة الفشل إذا أمكن. |
| 4 | `Reconciled` | اكتمل الدمج دون الحاجة لإنشاء حسابات جديدة. |

### أدوار النظام `SystemAccountRole`

| القيمة | الاسم | النوع المتوقع |
|---:|---|---|
| 1 | `CashOnHand` | أصل. |
| 2 | `BankDefault` | أصل. |
| 3 | `AccountsReceivable` | أصل. |
| 4 | `AccountsPayable` | خصم. |
| 5 | `Inventory` | أصل. |
| 6 | `SalesRevenue` | إيراد. |
| 7 | `SalesReturns` | إيراد (حساب مقابل). |
| 8 | `CostOfGoodsSold` | مصروف. |
| 9 | `RetainedEarnings` | حقوق ملكية. |
| 10 | `CurrentYearProfitLoss` | حقوق ملكية. |
| 11 | `OpeningBalanceEquity` | حقوق ملكية. |
| 12 | `VatInputTax` | أصل. |
| 13 | `VatOutputTax` | خصم. |
| 14 | `ForeignExchangeGain` | إيراد. |
| 15 | `ForeignExchangeLoss` | مصروف. |
| 16 | `GeneralAndAdminExpense` | مصروف. |
| 17 | `PayrollExpense` | مصروف. |
| 18 | `AccumulatedDepreciation` | أصل (حساب مقابل). |
| 19 | `DepreciationExpense` | مصروف. |
| 20 | `UnearnedRevenue` | خصم. |
| 21 | `PrepaidExpenses` | أصل. |

الأدوار الستة الحرجة التي يتحقق منها `validate-critical` هي: `CashOnHand` و`AccountsReceivable` و`AccountsPayable` و`SalesRevenue` و`CostOfGoodsSold` و`RetainedEarnings`.

## الأخطاء والتحقق

### صيغة أخطاء المجال

الأخطاء التي يلتقطها `ExceptionHandlingMiddleware` تعود عادةً بهذا الشكل:

```json
{
  "isSuccess": false,
  "statusCode": 400,
  "errorCode": "ACCOUNT_DEPTH_EXCEEDED",
  "errorMessage": "رسالة الخطأ باللغة العربية",
  "timestampUtc": "2026-10-12T00:00:00Z"
}
```

أما بعض استجابات عدم العثور المباشرة من Controllers فتأتي بالشكل الأبسط:

```json
{ "message": "..." }
```

قد تعود أخطاء تحقق ASP.NET Core الأخرى على هيئة `ProblemDetails`/`errors`. يقرأ عميل الواجهة الصيغ الثلاث ويحوّل أخطاء الحقول إلى رسائل النماذج حيثما توفرت.

### أبرز رموز المجال

| رمز الخطأ | الحالة المعتادة | السبب |
|---|---:|---|
| `ACCOUNT_DEPTH_EXCEEDED` | 400 | القالب أو الحساب سيجاوز حد عمق الشركة. |
| `COMPANY_ALREADY_INITIALIZED` | 409 | طلب `Strict` على شركة لها حسابات. |
| `DUPLICATE_ACCOUNT_CODE` | 409 | رمز الحساب مستخدم في الشركة نفسها. |
| `INVALID_ACCOUNT_HIERARCHY` | 400 | أب غير صالح/غير موجود، نوع مختلف، أو بنية قالب غير سليمة. |
| `SYSTEM_ACCOUNT_MAPPING_ERROR` | 400 | حساب غير قابل للترحيل، نوع غير متوافق، أو محاولة تعديل ربط مقفل دون القوة الاستثنائية. |
| `DUPLICATE_COMPANY_CODE` | 400 | رمز الشركة مستخدم. |
| `DUPLICATE_TEMPLATE_CODE` | 400 | رمز القالب مستخدم. |
| `INVALID_MAX_DEPTH` | 400 | العمق أقل من 3 أو أكبر من 10. |
| `CANNOT_REDUCE_DEPTH_BELOW_EXISTING` | 400 | العمق المطلوب أقل من مستوى حساب موجود. |
| `ACCOUNT_MAPPED_TO_ROLE` | 400 | محاولة حذف حساب مستخدم في ربط نظامي. |
| `COMPANY_NOT_FOUND` / `TEMPLATE_NOT_FOUND` / `ACCOUNT_NOT_FOUND` | غالبًا 400 في استثناءات المجال؛ وقد تكون 404 في استعلامات GET المباشرة. | المرجع غير موجود. |
| `EMPTY_TEMPLATE` | 400 | القالب لا يحتوي على بنود. |

`400` هو تحويل الوسيط العام لاستثناءات `AccountingDomainException`، حتى لو كان اسم الرمز يشير إلى مورد غير موجود. بعض GETs وDELETE تعيد `404` مباشرة. أخطاء الخادم غير المتوقعة تعود `500` برمز `INTERNAL_SERVER_ERROR`.

## دليل الحسابات والتهيئة

### تدفق موصى به لتهيئة شركة جديدة

1. أنشئ الشركة من `POST /api/companies` وخذ `id` من الاستجابة.
2. اختر قالبًا من `GET /api/templates`، ثم اعرض تفاصيله إذا لزم.
3. استدعِ `POST /api/initialization/validate` بالشركة والقالب.
4. إذا لم يكن هناك تعارض عمق أو أخطاء أخرى، نفّذ `DryRun` أولًا عند الحاجة (القيمة `mode: 3`).
5. للتطبيق الأول استخدم `Strict` (`mode: 1`) و`autoMapSystemRoles: true`.
6. عند وجود حسابات سابقة، لا تستخدم `Strict`: افحص باستخدام `validate` ثم اختر `IdempotentMerge` (`mode: 2`).
7. راجع `GET /api/system-accounts?companyId=...` و`GET /api/system-accounts/validate-critical?companyId=...`، ثم راجع سجل التدقيق.

### الفروق بين الأوضاع

- **Strict:** يشترط عدم وجود حسابات. إذا وجد حساب واحد أو أكثر، يوقف العملية بتعارض `409 COMPANY_ALREADY_INITIALIZED`، تجنبًا للتكرار. لاحظ أن شرط التنفيذ يعتمد على الحسابات القائمة؛ أما فحص `validate` فيعرض أيضًا علم الشركة `IsCoaInitialized`.
- **IdempotentMerge:** يطابق بنود القالب بالحسابات عبر رمز الحساب (بعد إضافة `AccountCodePrefix` اختياري). ينشئ الناقص فقط. لا يستبدل حسابًا موجودًا، ولا يغيّر ربط دور موجود مسبقًا؛ يضيف تحذيرًا للدور المرتبط. التنفيذ الفعلي داخل معاملة DB، ويسجل نتيجة التدقيق.
- **DryRun:** يعيد تقديرًا لما سيُنشأ وما سيُربط، دون كتابة. لا يكتب سجل تدقيق. استخدمه للمعاينة لا لضمان نتيجة مطابقة لحظية إذا تغيّرت قاعدة البيانات بعده.

بعد نجاح التنفيذ يعلّم النظام الشركة كمهيأة. في عملية فعلية لا تُحفظ الحسابات وربوطها جزئيًا عند الفشل: يجري rollback ثم يحاول تسجيل سجل فشل مستقل.

### قواعد ربط الأدوار

- كل شركة لها ربط واحد فقط لكل `SystemAccountRole`.
- يجب أن يكون الحساب من الشركة نفسها، تحليليًا وقابلًا للترحيل، وألا يكون حسابًا تجميعيًا.
- يتحقق الخادم من نوع الحساب المتوقع (الجدول السابق).
- عند إنشاء ربط لأول مرة يمكن ضبط `isLocked`. عند تحديث ربط مقفل يتطلب الطلب `forceIfLocked: true`. بعد ذلك يحدد `isLocked` الحالة الجديدة.
- فحص الأدوار الحرجة يعيد كائنًا فيه `companyId` و`allCriticalRolesMapped` و`message`؛ لا يعيد Boolean مجردًا.

## الواجهة الأمامية

### الصفحات والوظائف

| المسار | المحتوى |
|---|---|
| `/` | لوحة متابعة بإحصاءات الشركة المختارة، أنواع الحسابات، الأدوار الحرجة وآخر نشاط تهيئة. |
| `/companies` | عرض وإنشاء وتعديل الشركات وحد العمق. |
| `/templates` | استعراض القوالب وإنشاء قالب مخصص. |
| `/templates/:templateId` | تفاصيل القالب وعرض الشجرة. |
| `/accounts` | شجرة الحسابات وقائمة مسطحة، تصفية حسب المستوى والترحيل، وإنشاء/تعديل/حذف. |
| `/initialization` | اختيار الشركة والقالب، التحقق المسبق، أوضاع التهيئة وسجل التدقيق. |
| `/system-accounts` | روابط الأدوار، الأدوار الحرجة، التعيين، القفل وكسر القفل. |

التطبيق عربي و`dir="rtl"` من صفحة HTML. يتم الاحتفاظ بالشركة المختارة في `localStorage` تحت المفتاح `coa:selected-company`. قاعدة الاختيار التلقائي: آخر شركة محفوظة إن كانت لا تزال موجودة، وإلا أول شركة مهيأة، وإلا أول شركة في القائمة.

### التقنيات والطبقات

| التقنية | استخدامها |
|---|---|
| React 19 + TypeScript | بناء الواجهة والمكونات. |
| Vite 8 | خادم التطوير والبناء والمعاينة. |
| TanStack Query 5 | استعلامات REST، التخزين المؤقت، الطفرات وإبطال الاستعلامات بعد التعديل. |
| TanStack Table 9 | الجداول المسطحة والشجرية والفرز والتصفية والترقيم وإظهار الأعمدة. |
| React Hook Form + Zod | نماذج الشركات والحسابات والقوالب والتهيئة وربط الأدوار والتحقق من الحقول. |
| Tailwind CSS 4 | الرموز والتنسيق عبر CSS-first theme ومكونات واجهة محلية. |
| React Router 7 | مسارات الصفحات والتوجيه. |

مجلدات الواجهة:

```text
frontend/
├── mock/                 محاكاة REST وبيانات العرض وإضافة Vite
├── scripts/              اختبار SSR واختبارات تدفقات API
└── src/
    ├── api/              DTOs وتعدادات ومطبّعات وعملاء كل مورد
    ├── components/       ui وlayout وdata وfeedback
    ├── features/         صفحات وhooks لكل ميزة
    ├── hooks/            سياق الشركة المختارة
    ├── lib/              http والأخطاء والتنسيق وإعداد QueryClient
    └── styles/           Tailwind theme والأنماط العامة
```

### سياسة الاستعلامات والطفرات

- مفاتيح TanStack Query مجمعة بحسب المورد: الشركات، القوالب، الحسابات، التهيئة، وربوط الحسابات النظامية.
- معاملات `AbortSignal` تمرر من query إلى `fetch` لإلغاء الطلب عند الحاجة.
- `staleTime` الافتراضي 30 ثانية، و`gcTime` خمس دقائق، وإعادة المحاولة حتى مرتين للأخطاء غير 4xx؛ لا يعاد طلب أخطاء 4xx ولا الطفرات.
- بعد الإنشاء أو التعديل أو الحذف، تبطل hooks مفاتيح الموارد المتأثرة وتعرض Toast عربيًا للنجاح أو الفشل.
- مكوّن `DataTable` يوحد حالات التحميل والخطأ والفراغ وأدوات الفرز/الترقيم حسب الصفحة.
- يحوّل `src/api/normalize.ts` الحقول والتعدادات القادمة من backend/mock إلى نماذج ثابتة تستخدمها الواجهة.

## المحاكاة والاتصال بالخدمة الحقيقية

### وضع `mock` (الافتراضي)

```bash
cd frontend
npm run dev
```

يضيف Vite middleware إلى `/api/*` و`/ping`، ويستجيب من بيانات في الذاكرة (`frontend/mock/`). يتيح ذلك استعراض الواجهة وتدفقات الإنشاء والتعديل دون خدمة .NET. توجد مهلة اصطناعية قصيرة لتقريب زمن الشبكة. بيانات التعديل تعيش في عملية Vite الحالية وتعود إلى البذور عند إعادة تشغيل السيرفر؛ لا تكتب المحاكاة إلى PostgreSQL.

### وضع `real`

لتوجيه طلبات المتصفح إلى backend عبر وكيل Vite:

```bash
cd frontend
VITE_API_MODE=real npm run dev
```

الهدف الافتراضي `http://localhost:5126`. لتغييره:

```bash
VITE_API_MODE=real VITE_API_TARGET=http://localhost:7000 npm run dev
```

أو ضع القيم في `frontend/.env.local`:

```dotenv
VITE_API_MODE=real
VITE_API_TARGET=http://localhost:5126
```

في هذا الوضع يمرر Vite مساري `/api` و`/ping` إلى الهدف. الواجهة نفسها تستخدم روابط نسبية، فلا ينبغي أن يستدعي كود المتصفح `localhost` مباشرة عند عرض معاينة مستضافة.

**للنشر:** وكيل `server.proxy` في هذا المشروع خاص بخادم Vite التطويري، وليس إعداد reverse proxy إنتاجي. عند تقديم `dist` عبر Nginx أو استضافة ثابتة، وجّه `/api` و`/ping` إلى backend على مستوى الخادم. كذلك لا يعمل mock middleware في استضافة ملفات ثابتة لا تشغّل Vite middleware؛ شغّل `vite preview` للعرض التجريبي أو وفّر API فعليًا.

### أوامر الواجهة

| الأمر | النتيجة |
|---|---|
| `npm ci` | تثبيت الإصدارات المقفلة في `package-lock.json`. |
| `npm run dev` | سيرفر التطوير؛ mock افتراضي. |
| `npm run typecheck` | فحص TypeScript (`tsc -b --force`). |
| `npm run build` | فحص الأنواع ثم بناء Vite إلى `dist/`. |
| `npm run preview` | تشغيل معاينة build؛ mock middleware متاح إذا بُنيت بالإعداد الافتراضي. |
| `npm run smoke` | اختبار دخان SSR للمسارات وتدفقات API. |
| `npm run lint` | Oxlint على `src`, `mock`, `scripts`. |

## الاختبارات والتحقق

التحقق المتاح ضمن الواجهة هو `frontend/scripts/smoke.mjs`، ويشغّل Vite في middleware mode ثم:

1. يستورد `smoke-render.tsx` عبر Vite SSR، ويغذي `fetch` بردود `createMockApi()`.
2. يرسم صفحات التطبيق داخل providers و`MemoryRouter` ويتحقق من نصوص عربية متوقعة في 8 حالات: الصفحات الست، تفاصيل قالب، ومسار غير معروف.
3. ينفذ `smoke-flows.ts` على المحاكاة، متضمنًا إنشاء الشركة، أوضاع التهيئة، قيود العمق والشجرة، قواعد الدور والقفل والحذف وسجل التدقيق.

آخر تحقق موثق على هذه الشيفرة قبل إضافة هذا الدليل: `tsc -b --force` ناجح؛ build ناجح؛ smoke يجتاز 8 حالات عرض و34 تحقق تدفق؛ lint بلا أخطاء وبضعة تحذيرات fast-refresh. بعد أي تغيير برمجي أعد تشغيل الأوامر من `frontend/`.

> لا يوجد حاليًا مشروع اختبارات .NET منفصل ضمن المستودع. أضف اختبارات وحدات/تكامل للـ backend قبل توسيع قواعد المجال أو اعتمادها في الإنتاج.

## النشر والأمان

**الإعداد الحالي مناسب للتطوير والعرض، وليس إعداد إنتاج آمنًا بمفرده.** قبل نشر backend أو ربطه ببيانات حقيقية:

1. أضف المصادقة والتفويض وتحقق صلاحيات المستخدمين لكل شركة ولكل عملية.
2. استبدل سياسة CORS `AllowAll` بقائمة origins موثوقة؛ أوقف السماح العام بالطرق والرؤوس في الإنتاج.
3. استخدم HTTPS، وحدد `AllowedHosts`، واحفظ أسرار قاعدة البيانات في secret store.
4. غيّر بيانات الاعتماد الافتراضية `postgres/postgres` ولا تستخدمها خارج بيئة محلية معزولة.
5. راجع سلوك رسائل 500: الوسيط الحالي يضع `exception.Message` في رد الأخطاء غير المعروفة، وهو ما قد يكشف تفاصيل داخلية. استخدم رسالة عامة ومعرّف تتبع في الإنتاج.
6. اختر إدارة مخطط DB عبر migrations بدل الاعتماد على `EnsureCreated` عند وجود ترقية مستمرة.
7. أضف سجل تدقيق وصلاحيات للعمليات الحساسة، وحدد سياسة احتفاظ للبيانات والنسخ الاحتياطية.
8. في الإنتاج قدّم الواجهة عبر HTTPS ومرّر `/api` و`/ping` عبر reverse proxy إلى خدمة backend؛ لا تضع عنوان `localhost` في JavaScript الذي يعمل لدى المستخدم.
9. راجع أحجام الطلبات والصفحات؛ واجهات القوائم الحالية تعيد القوائم كاملة ولا تطبق ترقيمًا خادميًا.

سياسة CORS الحالية، كما في `Program.cs`، تسمح لأي origin وطريقة ورأس. الواجهة تستخدم في التطوير proxy نسبيًا، لذلك لا تحتاج إلى استدعاء API cross-origin مباشرًا.

## الفروق المعروفة وملاحظات التكامل

### بيانات seed: backend مقابل mock

بيانات القوالب في `frontend/mock/seed.ts` **مستقلة وموسعة** وليست نسخة مطابقة من `ChartOfAccounts/Data/Seed.cs`. القياس من المصدر الحالي:

| القالب | Backend: البنود / أعمق مستوى / أدوار افتراضية | Mock UI: البنود / أعمق مستوى / أدوار افتراضية |
|---|---:|---:|
| `COMMERCIAL_IFRS` | 53 / 4 / 21 | 79 / 5 / 21 |
| `SERVICES_PROFESSIONAL` | 31 / 4 / 18 | 65 / 4 / 20 |
| `SME_SIMPLIFIED` | 27 / 3 / 14 | 34 / 3 / 17 |

لكل قالب خمسة جذور. هذه أرقام البنود في تعريفات القوالب، وليست دائمًا عدد حسابات الشركة بعد تهيئتها (قد توجد حسابات سابقة أو بادئة رموز). لذلك:

- استخدم mock لتجربة التفاعل وقواعد الواجهة، لا لمقارنة أعداد backend الدقيقة.
- إذا أضيفت حقول أو قاعدة عمل إلى أحد الطرفين، حدّث الطرف الآخر واختبارات التدفقات معًا.
- عند الدمج والتكامل الفعلي، اختبر الواجهة مقابل `VITE_API_MODE=real`؛ الـ API الفعلي هو المرجع النهائي.

### قيود موجودة في الإصدار الحالي

- لا توجد مصادقة أو صلاحيات مستخدمين في البرنامج الحالي.
- لا توجد واجهة حذف شركة/قالب أو إزالة ربط دور؛ لا تعرض الواجهة هذه الوظائف.
- عمليات القوائم ليست paginated على الخادم؛ بعض الفرز والتصفية والترقيم يتم محليًا في الجدول.
- ملفات EF migrations موجودة، لكن الإقلاع يعتمد `EnsureCreatedAsync` كما سبق توضيحه.
- حزمة OpenAPI موجودة في المشروع، لكن `Program.cs` لا يسجل/يعرض endpoint Swagger/OpenAPI حاليًا.

## استكشاف الأخطاء

| العرض | ما يجب فحصه |
|---|---|
| `Npgsql` لا يستطيع الاتصال | تأكد من تشغيل PostgreSQL، المضيف والمنفذ، قاعدة البيانات و`ConnectionStrings__Default` وصلاحيات المستخدم. |
| `dotnet run` لا يستهدف المنفذ المتوقع | استخدم `--launch-profile http` أو راجع `ChartOfAccounts/Properties/launchSettings.json`. |
| الواجهة تعرض تعذر الاتصال بالخدمة | افتراضيًا mock لا يحتاج backend؛ في `real` شغّل الخدمة على `VITE_API_TARGET`، أعد تشغيل Vite بعد تغيير `.env.local`، وتأكد من `/ping`. |
| طلبات `/api` تعود 404 في build منشور ثابت | يلزم reverse proxy/API server؛ mock middleware لا يعمل داخل ملفات `dist` وحدها. |
| القالب غير متوافق مع الشركة | تحقق أن أعلى مستوى للقالب لا يتجاوز `MaxAccountDepth` (3–10). استخدم قالبًا أقصر أو ارفع حد العمق إذا لم يخالف مستوى حساب قائم. |
| تهيئة Strict تعيد 409 | الشركة لديها حسابات؛ استخدم `DryRun` للمراجعة أو `IdempotentMerge` للمطابقة. |
| لا يمكن إضافة ابن لحساب | النوع يجب أن يساوي نوع الأب، والمستوى التالي لا يتجاوز الحد؛ إضافة الابن تحول الأب إلى Header. |
| لا يمكن تعيين دور إلى حساب | تحقق من أن الحساب تحليلي وقابل للترحيل ونوعه يطابق الدور، وأنه تابع للشركة المطلوبة. |
| لا يمكن تعديل ربط دور | افحص `isLocked`; يلزم `forceIfLocked` لتغيير الربط المقفل. |
| لا يمكن حذف حساب | قد توجد حسابات فرعية أو ربط نظامي يشير إليه. |
| بيانات mock عادت إلى البداية | هذا متوقع بعد إعادة تشغيل عملية Vite؛ المخزن في الذاكرة وليس قاعدة بيانات دائمة. |

## خريطة الملفات

```text
ChartOfAccounts.slnx
ChartOfAccounts/
├── Program.cs                    تسجيل الخدمات، middleware، health ping، التهيئة والبذر
├── Controllers/                  REST controllers ومعالجة الأخطاء
├── Dtos/                         عقود الطلب/الاستجابة
├── Domain/                       الكيانات والتعدادات والاستثناءات
├── Data/                         DbContext، Fluent configuration، seed
├── Services/                     خدمات الشركات والحسابات والقوالب والتهيئة والأدوار
├── Migrations/                   ملفات EF Core migrations (لا تطبق تلقائيًا حاليًا)
└── appsettings*.json             إعدادات الاتصال والسجلات

frontend/
├── README.md                     دليل تشغيل الواجهة
├── vite.config.ts                إعداد mock/real والوكيل والمسارات
├── mock/                         seed ومحاكي API وإضافة Vite
├── scripts/                      smoke-render وsmoke-flows
└── src/
    ├── api/                      DTO mirrors وعملاء REST والتعدادات والتطبيع
    ├── components/               عناصر الواجهة والتخطيط والجداول والحالات
    ├── features/                 صفحات الشركات والقوالب والحسابات والتهيئة والأدوار
    ├── hooks/                     سياق الشركة المختارة
    ├── lib/                       HTTP والأخطاء والتنسيق وQueryClient
    └── styles/                    Tailwind theme والأنماط العامة
```
