
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ChartOfAccounts;

/// <summary>
/// تكوين جدول الحسابات المالية (Accounts) باستخدام Fluent API في EF Core.
/// يضمن العزل التام بين الشركات، الفهرسة المتقدمة، وقواعد الحذف الآمن للهيكل الشجري.
/// </summary>
public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("Accounts");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.CompanyId)
            .IsRequired();

        builder.Property(a => a.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.NameArabic)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(a => a.NameEnglish)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(a => a.AccountType)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(a => a.NormalBalance)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(a => a.Classification)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(a => a.Level)
            .IsRequired();

        builder.Property(a => a.IsHeader)
            .IsRequired();

        builder.Property(a => a.IsPostable)
            .IsRequired();

        builder.Property(a => a.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(a => a.SystemRole)
            .HasConversion<int?>();

        builder.Property(a => a.LineagePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(a => a.CurrencyCode)
            .HasMaxLength(10);

        builder.Property(a => a.Description)
            .HasMaxLength(500);

        // الفهرس الفريد المركب: رمز الحساب فريد تماماً على مستوى الشركة الواحدة
        builder.HasIndex(a => new { a.CompanyId, a.Code })
            .IsUnique()
            .HasDatabaseName("IX_Accounts_CompanyId_Code");

        // فهارس لتحسين سرعة الاستعلامات والتقارير المالية
        builder.HasIndex(a => new { a.CompanyId, a.Level })
            .HasDatabaseName("IX_Accounts_CompanyId_Level");

        builder.HasIndex(a => new { a.CompanyId, a.IsPostable })
            .HasDatabaseName("IX_Accounts_CompanyId_IsPostable");

        builder.HasIndex(a => new { a.CompanyId, a.LineagePath })
            .HasDatabaseName("IX_Accounts_CompanyId_LineagePath");

        // علاقة شجرية ذاتية (Self-Referencing Relationship)
        // قاعدة الحذف: تقييد (Restrict) لمنع الحذف المتسلسل العشوائي لشجرة الحسابات
        builder.HasOne(a => a.ParentAccount)
            .WithMany(a => a.ChildAccounts)
            .HasForeignKey(a => a.ParentAccountId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}


/// <summary>
/// تكوين جدول سجل تدقيق تهيئة شجرة الحسابات (CoaInitializationAuditLogs).
/// </summary>
public class CoaInitializationAuditLogConfiguration : IEntityTypeConfiguration<CoaInitializationAuditLog>
{
    public void Configure(EntityTypeBuilder<CoaInitializationAuditLog> builder)
    {
        builder.ToTable("CoaInitializationAuditLogs");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.CompanyId)
            .IsRequired();

        builder.Property(l => l.TemplateId)
            .IsRequired();

        builder.Property(l => l.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(l => l.ErrorMessage)
            .HasMaxLength(2000);

        builder.Property(l => l.DetailsJson);

        builder.HasIndex(l => new { l.CompanyId, l.TimestampUtc })
            .HasDatabaseName("IX_CoaInitializationAuditLogs_CompanyId_Timestamp");
    }
}

/// <summary>
/// تكوين جدول قوالب دليل الحسابات (CoaTemplates).
/// </summary>
public class CoaTemplateConfiguration : IEntityTypeConfiguration<CoaTemplate>
{
    public void Configure(EntityTypeBuilder<CoaTemplate> builder)
    {
        builder.ToTable("CoaTemplates");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Code)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(t => t.Code)
            .IsUnique();

        builder.Property(t => t.NameArabic)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(t => t.NameEnglish)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(t => t.IndustryType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.Description)
            .HasMaxLength(1000);

        builder.HasMany(t => t.Nodes)
            .WithOne(n => n.Template)
            .HasForeignKey(n => n.TemplateId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>
/// تكوين جدول بنود قوالب الحسابات (CoaTemplateNodes).
/// </summary>
public class CoaTemplateNodeConfiguration : IEntityTypeConfiguration<CoaTemplateNode>
{
    public void Configure(EntityTypeBuilder<CoaTemplateNode> builder)
    {
        builder.ToTable("CoaTemplateNodes");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(n => n.NameArabic)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(n => n.NameEnglish)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(n => n.AccountType)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(n => n.NormalBalance)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(n => n.Classification)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(n => n.ParentNodeCode)
            .HasMaxLength(50);

        builder.Property(n => n.DefaultSystemRole)
            .HasConversion<int?>();

        builder.Property(n => n.Description)
            .HasMaxLength(500);

        // الفهرس الفريد: رمز البند فريد على مستوى القالب الواحد
        builder.HasIndex(n => new { n.TemplateId, n.Code })
            .IsUnique()
            .HasDatabaseName("IX_CoaTemplateNodes_TemplateId_Code");

        builder.HasIndex(n => new { n.TemplateId, n.Level })
            .HasDatabaseName("IX_CoaTemplateNodes_TemplateId_Level");
    }
}

/// <summary>
/// تكوين جدول الشركات (Companies) باستخدام Fluent API في EF Core.
/// يضبط القيود، الفهارس الفريدة، وطول الحقول لقاعدة بيانات SQL Server.
/// </summary>
public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Companies");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(c => c.Code)
            .IsUnique();

        builder.Property(c => c.NameArabic)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.NameEnglish)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.TaxNumber)
            .HasMaxLength(50);

        builder.Property(c => c.BaseCurrency)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("SAR");

        builder.Property(c => c.MaxAccountDepth)
            .IsRequired()
            .HasDefaultValue(5);

        builder.Property(c => c.IsCoaInitialized)
            .IsRequired()
            .HasDefaultValue(false);

        // العلاقات الملاحية
        builder.HasMany(c => c.Accounts)
            .WithOne(a => a.Company)
            .HasForeignKey(a => a.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.SystemAccountMappings)
            .WithOne(sa => sa.Company)
            .HasForeignKey(sa => sa.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.InitializationAuditLogs)
            .WithOne(l => l.Company)
            .HasForeignKey(l => l.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>
/// تكوين جدول ربط الحسابات النظامية للشركة (CompanySystemAccounts).
/// يضمن عدم تكرار نفس الدور لنفس الشركة (Unique Compound Index on CompanyId + Role).
/// </summary>
public class CompanySystemAccountConfiguration : IEntityTypeConfiguration<CompanySystemAccount>
{
    public void Configure(EntityTypeBuilder<CompanySystemAccount> builder)
    {
        builder.ToTable("CompanySystemAccounts");

        builder.HasKey(sa => sa.Id);

        builder.Property(sa => sa.CompanyId)
            .IsRequired();

        builder.Property(sa => sa.Role)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(sa => sa.AccountId)
            .IsRequired();

        builder.Property(sa => sa.IsLocked)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(sa => sa.Notes)
            .HasMaxLength(500);

        // فهرس فريد: لكل شركة دور نظامي واحد فقط لا يتكرر
        builder.HasIndex(sa => new { sa.CompanyId, sa.Role })
            .IsUnique()
            .HasDatabaseName("IX_CompanySystemAccounts_CompanyId_Role");

        builder.HasOne(sa => sa.Account)
            .WithMany()
            .HasForeignKey(sa => sa.AccountId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
