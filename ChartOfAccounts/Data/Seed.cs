
using Microsoft.EntityFrameworkCore;

namespace ChartOfAccounts;


/// <summary>
/// خدمة بذر قاعدة البيانات (Database Seeder) لضمان توفر القوالب المحاسبية المعيارية
/// عند إقلاع التطبيق دون تكرار أو الإضرار بالبيانات القائمة.
/// </summary>
public class DbSeeder
{
    private readonly AppDbContext _context;
    private readonly ILogger<DbSeeder> _logger;

    public DbSeeder(AppDbContext context, ILogger<DbSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// بذر قوالب شجرة الحسابات الافتراضية
    /// </summary>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var standardTemplates = CoaTemplateSeedData.GetStandardTemplates();

            foreach (var template in standardTemplates)
            {
                var existingTemplate = await _context.CoaTemplates
                    .Include(t => t.Nodes)
                    .FirstOrDefaultAsync(t => t.Code == template.Code, cancellationToken);

                if (existingTemplate == null)
                {
                    _logger.LogInformation("بذر قالب شجرة حسابات جديد: {TemplateCode} - {TemplateName}", template.Code, template.NameArabic);
                    template.ValidateIntegrity();
                    await _context.CoaTemplates.AddAsync(template, cancellationToken);
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("اكتمل بذر البيانات المحاسبية الأولية بنجاح.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "حدث خطأ أثناء بذر البيانات المحاسبية الأولية.");
            throw;
        }
    }
}

/// <summary>
/// فئة بيانات البذور المحاسبية (Seed Data) لتوفير قوالب شجرة حسابات معيارية احترافية
/// متوافقة مع المعايير الدولية لإعداد التقارير المالية (IFRS) والأنظمة الضريبية (ضريبة القيمة المضافة VAT).
/// </summary>
public static class CoaTemplateSeedData
{
    public static readonly Guid CommercialTemplateId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid ServicesTemplateId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid SmeTemplateId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    /// <summary>
    /// توليد القوالب المعيارية الثلاثة الجاهزة للاستخدام في النظام.
    /// </summary>
    public static List<CoaTemplate> GetStandardTemplates()
    {
        return new List<CoaTemplate>
        {
            CreateCommercialTemplate(),
            CreateServicesTemplate(),
            CreateSmeTemplate()
        };
    }

    /// <summary>
    /// قالب الشركات التجارية المعياري (Standard Commercial Template - 4 to 5 Levels)
    /// </summary>
    private static CoaTemplate CreateCommercialTemplate()
    {
        var template = new CoaTemplate(
            code: "COMMERCIAL_IFRS",
            nameArabic: "دليل الحسابات المعياري للشركات التجارية (متوافق مع معايير IFRS)",
            nameEnglish: "Standard Commercial Chart of Accounts (IFRS Compliant)",
            industryType: "Commercial",
            recommendedMaxDepth: 5,
            description: "قالب محاسبي متكامل للشركات التجارية، يدعم إدارة المخزون، ضريبة القيمة المضافة، العملاء والموردين، وإقفال الحسابات التلقائي.",
            isSystemTemplate: true,
            version: 1);

        // تم تعيين المعرف يدوياً لضمان ثباته عبر البيئات
        typeof(CoaTemplate).GetProperty(nameof(CoaTemplate.Id))!.SetValue(template, CommercialTemplateId);

        // ==========================================
        // 1. الأصول (ASSETS)
        // ==========================================
        template.AddNode("1", "الأصول", "Assets", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 1, null, true, false);

        // 11 الأصول المتداولة
        template.AddNode("11", "الأصول المتداولة", "Current Assets", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 2, "1", true, false);

        // 1101 النقدية وما في حكمها
        template.AddNode("1101", "النقدية وما في حكمها", "Cash and Cash Equivalents", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", true, false);
        template.AddNode("110101", "صندوق النقدية الرئيسي", "Main Cash on Hand", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 4, "1101", false, true, SystemAccountRole.CashOnHand);
        template.AddNode("110102", "الحساب البنكي الجاري الرئيسي", "Operating Bank Account", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 4, "1101", false, true, SystemAccountRole.BankDefault);

        // 1102 العملاء والمدينون
        template.AddNode("1102", "العملاء والذمم المدينة", "Accounts Receivable and Debtors", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", true, false);
        template.AddNode("110201", "حساب العملاء التجاريين", "Trade Accounts Receivable", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 4, "1102", false, true, SystemAccountRole.AccountsReceivable);

        // 1103 المخزون السلعي
        template.AddNode("1103", "المخزون السلعي", "Merchandise Inventory", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", true, false);
        template.AddNode("110301", "مخزون بضائع جاهزة للبيع", "Finished Goods Inventory", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 4, "1103", false, true, SystemAccountRole.Inventory);

        // 1104 المصروفات المدفوعة مقدماً والأرصدة المدينة
        template.AddNode("1104", "مصروفات مدفوعة مقدماً وأرصدة مدينة أخرى", "Prepaid Expenses and Other Receivables", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", true, false);
        template.AddNode("110401", "المصروفات المدفوعة مقدماً", "Prepaid Expenses", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 4, "1104", false, true, SystemAccountRole.PrepaidExpenses);
        template.AddNode("110402", "ضريبة القيمة المضافة على المشتريات (المدخلات)", "VAT Input Tax on Purchases", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 4, "1104", false, true, SystemAccountRole.VatInputTax);

        // 12 الأصول غير المتداولة
        template.AddNode("12", "الأصول غير المتداولة", "Non-Current Assets", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 2, "1", true, false);
        template.AddNode("1201", "الممتلكات والآلات والمعدات", "Property, Plant and Equipment", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "12", true, false);
        template.AddNode("120101", "أجهزة ومعدات تقنية ومكتبية", "IT and Office Equipment", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 4, "1201", false, true);
        template.AddNode("120102", "مجمع إهلاك الأجهزة والمعدات", "Accumulated Depreciation - Equipment", AccountType.Asset, NormalBalance.Credit, AccountClassification.BalanceSheet, 4, "1201", false, true, SystemAccountRole.AccumulatedDepreciation);

        // ==========================================
        // 2. الخصوم والالتزامات (LIABILITIES)
        // ==========================================
        template.AddNode("2", "الخصوم والالتزامات", "Liabilities", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 1, null, true, false);

        // 21 الالتزامات المتداولة
        template.AddNode("21", "الالتزامات المتداولة", "Current Liabilities", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 2, "2", true, false);
        template.AddNode("2101", "الموردون والذمم الدائنة", "Accounts Payable and Creditors", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "21", true, false);
        template.AddNode("210101", "حساب الموردين التجاريين", "Trade Accounts Payable", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 4, "2101", false, true, SystemAccountRole.AccountsPayable);

        template.AddNode("2102", "الضرائب والمستحقات الأخرى", "Taxes and Accrued Liabilities", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "21", true, false);
        template.AddNode("210201", "ضريبة القيمة المضافة على المبيعات (المخرجات)", "VAT Output Tax on Sales", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 4, "2102", false, true, SystemAccountRole.VatOutputTax);
        template.AddNode("210202", "الإيرادات غير المكتسبة (المقبوضة مقدماً)", "Unearned Revenue", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 4, "2102", false, true, SystemAccountRole.UnearnedRevenue);
        template.AddNode("210203", "مصروفات مستحقة الدفع", "Accrued Expenses", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 4, "2102", false, true);

        // ==========================================
        // 3. حقوق الملكية (EQUITY)
        // ==========================================
        template.AddNode("3", "حقوق الملكية", "Equity", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 1, null, true, false);

        template.AddNode("31", "رأس المال والاحتياطيات والأرباح", "Capital, Reserves and Earnings", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 2, "3", true, false);
        template.AddNode("3101", "رأس المال المدفوع", "Paid-in Capital", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "31", true, false);
        template.AddNode("310101", "رأس مال المساهمين / الشركاء", "Shareholders' Equity Capital", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 4, "3101", false, true);

        template.AddNode("3102", "الأرباح والاحتياطيات", "Earnings and Reserves", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "31", true, false);
        template.AddNode("310201", "الأرباح المبقاة / المدورة", "Retained Earnings", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 4, "3102", false, true, SystemAccountRole.RetainedEarnings);
        template.AddNode("310202", "أرباح وخسائر العام الحالي", "Current Year Profit or Loss", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 4, "3102", false, true, SystemAccountRole.CurrentYearProfitLoss);

        template.AddNode("3103", "تسويات حقوق الملكية", "Equity Adjustments", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "31", true, false);
        template.AddNode("310301", "تسوية الأرصدة الافتتاحية", "Opening Balance Equity", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 4, "3103", false, true, SystemAccountRole.OpeningBalanceEquity);

        // ==========================================
        // 4. الإيرادات (REVENUE)
        // ==========================================
        template.AddNode("4", "الإيرادات", "Revenue", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 1, null, true, false);

        template.AddNode("41", "الإيرادات التشغيلية", "Operating Revenue", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 2, "4", true, false);
        template.AddNode("4101", "إيرادات المبيعات", "Sales Revenue", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 3, "41", true, false);
        template.AddNode("410101", "إيرادات مبيعات البضائع والمنتجات", "Product Sales Revenue", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 4, "4101", false, true, SystemAccountRole.SalesRevenue);
        template.AddNode("410102", "مردودات ومسموحات المبيعات", "Sales Returns and Allowances", AccountType.Revenue, NormalBalance.Debit, AccountClassification.IncomeStatement, 4, "4101", false, true, SystemAccountRole.SalesReturns);

        template.AddNode("42", "إيرادات ومكاسب أخرى", "Other Income and Gains", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 2, "4", true, false);
        template.AddNode("4201", "مكاسب تمويلية وفروق عملة", "Financial Gains and FX", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 3, "42", true, false);
        template.AddNode("420101", "أرباح فروق أسعار صرف العملات الأجنبية", "Foreign Exchange Gains", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 4, "4201", false, true, SystemAccountRole.ForeignExchangeGain);

        // ==========================================
        // 5. المصروفات (EXPENSES)
        // ==========================================
        template.AddNode("5", "المصروفات", "Expenses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 1, null, true, false);

        template.AddNode("51", "تكلفة المبيعات", "Cost of Sales", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 2, "5", true, false);
        template.AddNode("5101", "تكلفة البضاعة المباعة", "Cost of Goods Sold", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 3, "51", true, false);
        template.AddNode("510101", "تكلفة البضاعة المباعة - منتجات", "Cost of Goods Sold - Products", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 4, "5101", false, true, SystemAccountRole.CostOfGoodsSold);

        template.AddNode("52", "المصروفات التشغيلية والإدارية", "Operating and Administrative Expenses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 2, "5", true, false);
        template.AddNode("5201", "المصروفات العمومية والإدارية", "General and Administrative Expenses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 3, "52", true, false);
        template.AddNode("520101", "مصروفات إدارية وعمومية عامة", "General Admin Expense", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 4, "5201", false, true, SystemAccountRole.GeneralAndAdminExpense);
        template.AddNode("520102", "الرواتب والأجور ومزايا الموظفين", "Salaries and Employee Wages", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 4, "5201", false, true, SystemAccountRole.PayrollExpense);
        template.AddNode("520103", "مصروف إهلاك الأصول الثابتة", "Depreciation Expense", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 4, "5201", false, true, SystemAccountRole.DepreciationExpense);

        template.AddNode("53", "مصروفات وخسائر أخرى", "Other Expenses and Losses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 2, "5", true, false);
        template.AddNode("5301", "خسائر تمويلية وفروق عملة", "Financial Losses and FX", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 3, "53", true, false);
        template.AddNode("530101", "خسائر فروق أسعار صرف العملات الأجنبية", "Foreign Exchange Losses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 4, "5301", false, true, SystemAccountRole.ForeignExchangeLoss);

        return template;
    }

    /// <summary>
    /// قالب قطاع الخدمات والاستشارات (Professional Services Template - 4 Levels)
    /// </summary>
    private static CoaTemplate CreateServicesTemplate()
    {
        var template = new CoaTemplate(
            code: "SERVICES_PROFESSIONAL",
            nameArabic: "دليل الحسابات المعياري لقطاع الخدمات والاستشارات",
            nameEnglish: "Professional Services Chart of Accounts Template",
            industryType: "Services",
            recommendedMaxDepth: 4,
            description: "قالب مخصص للشركات الخدمية والتقنية والاستشارية، بدون مخزون سلعي ومصمم لإدارة تكاليف العقود والخدمات.",
            isSystemTemplate: true,
            version: 1);

        typeof(CoaTemplate).GetProperty(nameof(CoaTemplate.Id))!.SetValue(template, ServicesTemplateId);

        // 1 الأصول
        template.AddNode("1", "الأصول", "Assets", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 1, null, true, false);
        template.AddNode("11", "الأصول المتداولة", "Current Assets", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 2, "1", true, false);
        template.AddNode("1101", "صندوق النقدية الرئيسي", "Cash on Hand", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", false, true, SystemAccountRole.CashOnHand);
        template.AddNode("1102", "البنك الجاري الرئيسي", "Main Operating Bank", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", false, true, SystemAccountRole.BankDefault);
        template.AddNode("1103", "العملاء والذمم المدينة", "Accounts Receivable", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", false, true, SystemAccountRole.AccountsReceivable);
        template.AddNode("1104", "المصروفات المدفوعة مقدماً", "Prepaid Expenses", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", false, true, SystemAccountRole.PrepaidExpenses);
        template.AddNode("1105", "ضريبة القيمة المضافة على المشتريات", "VAT Input Tax", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", false, true, SystemAccountRole.VatInputTax);

        template.AddNode("12", "الأصول غير المتداولة", "Non-Current Assets", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 2, "1", true, false);
        template.AddNode("1201", "الأجهزة والمعدات", "Computers and Equipment", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "12", false, true);
        template.AddNode("1202", "مجمع إهلاك الأجهزة والمعدات", "Accumulated Depreciation", AccountType.Asset, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "12", false, true, SystemAccountRole.AccumulatedDepreciation);

        // 2 الخصوم
        template.AddNode("2", "الخصوم", "Liabilities", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 1, null, true, false);
        template.AddNode("21", "الالتزامات المتداولة", "Current Liabilities", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 2, "2", true, false);
        template.AddNode("2101", "الموردون والذمم الدائنة", "Accounts Payable", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "21", false, true, SystemAccountRole.AccountsPayable);
        template.AddNode("2102", "ضريبة القيمة المضافة على المبيعات", "VAT Output Tax", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "21", false, true, SystemAccountRole.VatOutputTax);
        template.AddNode("2103", "أتعاب استشارات مقدمة (إيرادات غير مكتسبة)", "Unearned Service Revenue", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "21", false, true, SystemAccountRole.UnearnedRevenue);

        // 3 حقوق الملكية
        template.AddNode("3", "حقوق الملكية", "Equity", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 1, null, true, false);
        template.AddNode("31", "رأس المال والاحتياطيات", "Capital and Reserves", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 2, "3", true, false);
        template.AddNode("3101", "رأس المال", "Share Capital", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "31", false, true);
        template.AddNode("3102", "الأرباح المبقاة", "Retained Earnings", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "31", false, true, SystemAccountRole.RetainedEarnings);
        template.AddNode("3103", "أرباح وخسائر العام الحالي", "Current Year Profit or Loss", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "31", false, true, SystemAccountRole.CurrentYearProfitLoss);
        template.AddNode("3104", "تسوية الأرصدة الافتتاحية", "Opening Balance Equity", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "31", false, true, SystemAccountRole.OpeningBalanceEquity);

        // 4 الإيرادات
        template.AddNode("4", "الإيرادات", "Revenue", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 1, null, true, false);
        template.AddNode("41", "الإيرادات المهنية والخدمية", "Service Revenues", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 2, "4", true, false);
        template.AddNode("4101", "إيرادات تقديم الخدمات والاستشارات", "Professional Consulting Revenue", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 3, "41", false, true, SystemAccountRole.SalesRevenue);
        template.AddNode("4102", "أرباح فروق صرف العملات", "Foreign Exchange Gains", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 3, "41", false, true, SystemAccountRole.ForeignExchangeGain);

        // 5 المصروفات
        template.AddNode("5", "المصروفات", "Expenses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 1, null, true, false);
        template.AddNode("51", "المصروفات التشغيلية", "Operating Expenses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 2, "5", true, false);
        template.AddNode("5101", "الرواتب والأتعاب المهنية", "Salaries and Professional Fees", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 3, "51", false, true, SystemAccountRole.PayrollExpense);
        template.AddNode("5102", "مصروفات إدارية وعمومية", "General and Admin Expenses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 3, "51", false, true, SystemAccountRole.GeneralAndAdminExpense);
        template.AddNode("5103", "مصروف إهلاك الأصول", "Depreciation Expense", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 3, "51", false, true, SystemAccountRole.DepreciationExpense);
        template.AddNode("5104", "خسائر فروق أسعار العملات", "Foreign Exchange Losses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 3, "51", false, true, SystemAccountRole.ForeignExchangeLoss);

        return template;
    }

    /// <summary>
    /// قالب المنشآت الصغيرة والمتوسطة المبسط (SME Lean Template - 3 Levels)
    /// </summary>
    private static CoaTemplate CreateSmeTemplate()
    {
        var template = new CoaTemplate(
            code: "SME_SIMPLIFIED",
            nameArabic: "دليل الحسابات المبسط للمنشآت الصغيرة والمتوسطة (3 مستويات)",
            nameEnglish: "Simplified SME Chart of Accounts (3 Levels)",
            industryType: "SME",
            recommendedMaxDepth: 3,
            description: "شجرة حسابات موجزة وسريعة تناسب المنشآت الصغيرة ورواد الأعمال بعمق 3 مستويات فقط لتسهيل إدارة الحسابات.",
            isSystemTemplate: true,
            version: 1);

        typeof(CoaTemplate).GetProperty(nameof(CoaTemplate.Id))!.SetValue(template, SmeTemplateId);

        // 1 الأصول
        template.AddNode("1", "الأصول", "Assets", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 1, null, true, false);
        template.AddNode("11", "الأصول المتداولة", "Current Assets", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 2, "1", true, false);
        template.AddNode("111", "الصندوق الرئيسي", "Cash on Hand", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", false, true, SystemAccountRole.CashOnHand);
        template.AddNode("112", "البنك الرئيسي", "Bank Account", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", false, true, SystemAccountRole.BankDefault);
        template.AddNode("113", "العملاء", "Accounts Receivable", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", false, true, SystemAccountRole.AccountsReceivable);
        template.AddNode("114", "المخزون السلعي", "Inventory", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", false, true, SystemAccountRole.Inventory);
        template.AddNode("115", "ضريبة المشتريات", "VAT Input Tax", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "11", false, true, SystemAccountRole.VatInputTax);

        template.AddNode("12", "الأصول الثابتة", "Fixed Assets", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 2, "1", true, false);
        template.AddNode("121", "المعدات والأجهزة", "Equipment", AccountType.Asset, NormalBalance.Debit, AccountClassification.BalanceSheet, 3, "12", false, true);

        // 2 الخصوم
        template.AddNode("2", "الخصوم", "Liabilities", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 1, null, true, false);
        template.AddNode("21", "الخصوم المتداولة", "Current Liabilities", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 2, "2", true, false);
        template.AddNode("211", "الموردون", "Accounts Payable", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "21", false, true, SystemAccountRole.AccountsPayable);
        template.AddNode("212", "ضريبة المبيعات", "VAT Output Tax", AccountType.Liability, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "21", false, true, SystemAccountRole.VatOutputTax);

        // 3 حقوق الملكية
        template.AddNode("3", "حقوق الملكية", "Equity", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 1, null, true, false);
        template.AddNode("31", "رأس المال والأرباح", "Capital and Retained Earnings", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 2, "3", true, false);
        template.AddNode("311", "رأس المال", "Capital", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "31", false, true);
        template.AddNode("312", "الأرباح المبقاة", "Retained Earnings", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "31", false, true, SystemAccountRole.RetainedEarnings);
        template.AddNode("313", "أرباح العام الحالي", "Current Year Profit", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "31", false, true, SystemAccountRole.CurrentYearProfitLoss);
        template.AddNode("314", "الرصيد الافتتاحي", "Opening Balance Equity", AccountType.Equity, NormalBalance.Credit, AccountClassification.BalanceSheet, 3, "31", false, true, SystemAccountRole.OpeningBalanceEquity);

        // 4 الإيرادات
        template.AddNode("4", "الإيرادات", "Revenue", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 1, null, true, false);
        template.AddNode("41", "إيرادات المبيعات", "Sales Revenue", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 2, "4", true, false);
        template.AddNode("411", "المبيعات", "Sales", AccountType.Revenue, NormalBalance.Credit, AccountClassification.IncomeStatement, 3, "41", false, true, SystemAccountRole.SalesRevenue);

        // 5 المصروفات
        template.AddNode("5", "المصروفات", "Expenses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 1, null, true, false);
        template.AddNode("51", "المصروفات التشغيلية", "Operating Expenses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 2, "5", true, false);
        template.AddNode("511", "تكلفة البضاعة المباعة", "Cost of Goods Sold", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 3, "51", false, true, SystemAccountRole.CostOfGoodsSold);
        template.AddNode("512", "المصروفات العامة والإدارية", "General Admin Expenses", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 3, "51", false, true, SystemAccountRole.GeneralAndAdminExpense);
        template.AddNode("513", "الرواتب والأجور", "Salaries", AccountType.Expense, NormalBalance.Debit, AccountClassification.IncomeStatement, 3, "51", false, true, SystemAccountRole.PayrollExpense);

        return template;
    }
}
