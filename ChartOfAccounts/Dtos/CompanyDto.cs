namespace ChartOfAccounts;

/// <summary>
/// بيانات الشركة / المستأجر المعروضة للمستخدم.
/// </summary>
public class CompanyDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NameArabic { get; set; } = string.Empty;
    public string NameEnglish { get; set; } = string.Empty;
    public string? TaxNumber { get; set; }
    public string BaseCurrency { get; set; } = "SAR";
    public int FiscalYearStartMonth { get; set; }
    public int MaxAccountDepth { get; set; }
    public bool IsCoaInitialized { get; set; }
    public Guid? InitializedFromTemplateId { get; set; }
    public DateTime? InitializedAtUtc { get; set; }
    public int TotalAccountsCount { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// طلب إنشاء شركة أو منشأة جديدة.
/// </summary>
public class CreateCompanyRequest
{
    public string Code { get; set; } = string.Empty;
    public string NameArabic { get; set; } = string.Empty;
    public string NameEnglish { get; set; } = string.Empty;
    public string? TaxNumber { get; set; }
    public string BaseCurrency { get; set; } = "SAR";
    public int FiscalYearStartMonth { get; set; } = 1;
    public int MaxAccountDepth { get; set; } = 5;
}

/// <summary>
/// طلب تعديل بيانات الشركة.
/// </summary>
public class UpdateCompanyRequest
{
    public string NameArabic { get; set; } = string.Empty;
    public string NameEnglish { get; set; } = string.Empty;
    public string? TaxNumber { get; set; }
    public string BaseCurrency { get; set; } = "SAR";
}

/// <summary>
/// طلب تعديل عمق شجرة الحسابات للشركة.
/// </summary>
public class CompanyDepthConfigDto
{
    public Guid CompanyId { get; set; }
    public int MaxAccountDepth { get; set; }
}

