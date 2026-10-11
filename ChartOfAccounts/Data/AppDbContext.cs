using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ramsha.EntityFrameworkCore;

namespace ChartOfAccounts;

public class AppDbContext(DbContextOptions<AppDbContext> options)
: RamshaEFDbContext<AppDbContext>(options)
{
    /// <summary>
    /// جدول الشركات / المنشآت
    /// </summary>
    public DbSet<Company> Companies => Set<Company>();

    /// <summary>
    /// جدول دليل الحسابات الفعلي للشركات
    /// </summary>
    public DbSet<Account> Accounts => Set<Account>();

    /// <summary>
    /// جدول قوالب دليل الحسابات المعيارية
    /// </summary>
    public DbSet<CoaTemplate> CoaTemplates => Set<CoaTemplate>();

    /// <summary>
    /// جدول بنود وحسابات القوالب الهيكلية
    /// </summary>
    public DbSet<CoaTemplateNode> CoaTemplateNodes => Set<CoaTemplateNode>();

    /// <summary>
    /// جدول ربط الأدوار النظامية بالحسابات المالية
    /// </summary>
    public DbSet<CompanySystemAccount> CompanySystemAccounts => Set<CompanySystemAccount>();

    /// <summary>
    /// جدول سجلات تدقيق عمليات التهيئة
    /// </summary>
    public DbSet<CoaInitializationAuditLog> CoaInitializationAuditLogs => Set<CoaInitializationAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // تطبيق كافة التكوينات المعرفة في طبقة البنية التحتية
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
