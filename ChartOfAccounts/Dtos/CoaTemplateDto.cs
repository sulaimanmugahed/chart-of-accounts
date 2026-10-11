

namespace ChartOfAccounts;

/// <summary>
/// ملخص قالب دليل الحسابات.
/// </summary>
public class CoaTemplateDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NameArabic { get; set; } = string.Empty;
    public string NameEnglish { get; set; } = string.Empty;
    public string IndustryType { get; set; } = string.Empty;
    public int RecommendedMaxDepth { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public bool IsSystemTemplate { get; set; }
    public int Version { get; set; }
    public int TotalNodesCount { get; set; }
    public int SystemRolesDefinedCount { get; set; }
}


/// <summary>
/// تفاصيل قالب دليل الحسابات مع كامل شجرته الهيكلية.
/// </summary>
public class CoaTemplateDetailDto : CoaTemplateDto
{
    public List<CoaTemplateNodeDto> Nodes { get; set; } = new();
}

/// <summary>
/// بند في قالب دليل الحسابات.
/// </summary>
public class CoaTemplateNodeDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NameArabic { get; set; } = string.Empty;
    public string NameEnglish { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public NormalBalance NormalBalance { get; set; }
    public AccountClassification Classification { get; set; }
    public int Level { get; set; }
    public string? ParentNodeCode { get; set; }
    public bool IsHeader { get; set; }
    public bool IsPostable { get; set; }
    public SystemAccountRole? DefaultSystemRole { get; set; }
    public string? DefaultSystemRoleName => DefaultSystemRole?.ToString();
    public string? Description { get; set; }
}


/// <summary>
/// طلب إنشاء قالب دليل حسابات مخصص.
/// </summary>
public class CreateTemplateRequest
{
    public string Code { get; set; } = string.Empty;
    public string NameArabic { get; set; } = string.Empty;
    public string NameEnglish { get; set; } = string.Empty;
    public string IndustryType { get; set; } = "General";
    public int RecommendedMaxDepth { get; set; } = 5;
    public string? Description { get; set; }
    public List<CreateTemplateNodeRequest> Nodes { get; set; } = new();
}

public class CreateTemplateNodeRequest
{
    public string Code { get; set; } = string.Empty;
    public string NameArabic { get; set; } = string.Empty;
    public string NameEnglish { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public NormalBalance? NormalBalance { get; set; }
    public AccountClassification? Classification { get; set; }
    public int Level { get; set; } = 1;
    public string? ParentNodeCode { get; set; }
    public bool IsHeader { get; set; } = false;
    public bool IsPostable { get; set; } = true;
    public SystemAccountRole? DefaultSystemRole { get; set; }
    public string? Description { get; set; }
}