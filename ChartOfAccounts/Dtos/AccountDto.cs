

namespace ChartOfAccounts;

/// <summary>
/// بيانات الحساب المحاسبي المنفرد.
/// </summary>
public class AccountDto
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NameArabic { get; set; } = string.Empty;
    public string NameEnglish { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public string AccountTypeName => AccountType.ToString();
    public NormalBalance NormalBalance { get; set; }
    public string NormalBalanceName => NormalBalance.ToString();
    public AccountClassification Classification { get; set; }
    public string ClassificationName => Classification.ToString();
    public int Level { get; set; }
    public Guid? ParentAccountId { get; set; }
    public string? ParentAccountCode { get; set; }
    public bool IsHeader { get; set; }
    public bool IsPostable { get; set; }
    public bool IsActive { get; set; }
    public SystemAccountRole? SystemRole { get; set; }
    public string? SystemRoleName => SystemRole?.ToString();
    public string LineagePath { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CurrencyCode { get; set; }
    public int ChildrenCount { get; set; }
}

/// <summary>
/// عقدة في شجرة الحسابات الهيكلية التفاعلية (Hierarchical Tree Node).
/// </summary>
public class AccountTreeNodeDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NameArabic { get; set; } = string.Empty;
    public string NameEnglish { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public NormalBalance NormalBalance { get; set; }
    public AccountClassification Classification { get; set; }
    public int Level { get; set; }
    public Guid? ParentAccountId { get; set; }
    public bool IsHeader { get; set; }
    public bool IsPostable { get; set; }
    public bool IsActive { get; set; }
    public SystemAccountRole? SystemRole { get; set; }
    public string LineagePath { get; set; } = string.Empty;
    public List<AccountTreeNodeDto> Children { get; set; } = new();
}

/// <summary>
/// طلب إضافة حساب محاسبي مخصص ضمن شجرة حسابات الشركة.
/// </summary>
public class CreateAccountRequest
{
    public Guid CompanyId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NameArabic { get; set; } = string.Empty;
    public string NameEnglish { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public NormalBalance? NormalBalance { get; set; }
    public AccountClassification? Classification { get; set; }
    public Guid? ParentAccountId { get; set; }
    public bool IsHeader { get; set; } = false;
    public bool IsPostable { get; set; } = true;
    public SystemAccountRole? SystemRole { get; set; }
    public string? Description { get; set; }
    public string? CurrencyCode { get; set; }
}

/// <summary>
/// طلب تعديل بيانات حساب محاسبي قائم.
/// </summary>
public class UpdateAccountRequest
{
    public string NameArabic { get; set; } = string.Empty;
    public string NameEnglish { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CurrencyCode { get; set; }
    public bool IsActive { get; set; } = true;
}

