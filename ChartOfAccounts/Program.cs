
using Microsoft.EntityFrameworkCore;
using Ramsha;
using Ramsha.AspNetCore.Mvc;
using ChartOfAccounts;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRamsha(ramsha =>
{
    ramsha
    .AddEFPostgreSql()
    .AddModule<AspNetCoreMvcModule>();

});

builder.Services.AddRamshaDbContext<AppDbContext>(options =>
{
    options.AddDefaultRepositories(true);
});


// تسجيل خدمات طبقة التطبيق والبنية التحتية
builder.Services.AddScoped<CoaInitializationService>();
builder.Services.AddScoped<CoaTemplateService>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<SystemAccountMappingService>();
builder.Services.AddScoped<CompanyService>();
builder.Services.AddScoped<DbSeeder>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// تفعيل وسيط معالجة الاستثناءات المحاسبية العامة
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("AllowAll");

app.UseRamsha();

app.MapGet("ping", () =>
{
    return Results.Ok();

});



// =========================================================================
// بذر البيانات وتهيئة قاعدة البيانات تلقائياً عند الإقلاع
// =========================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var dbContext = services.GetRequiredService<AppDbContext>();
    var seeder = services.GetRequiredService<DbSeeder>();
    var initService = services.GetRequiredService<CoaInitializationService>();

    try
    {
        // إنشاء قاعدة البيانات والجداول إن لم تكن موجودة
        await dbContext.Database.EnsureCreatedAsync();

        // بذر قوالب شجرة الحسابات المعيارية
        await seeder.SeedAsync();

        // بذر شركات تجريبية لاختبار المنظومة فورياً إذا كانت قاعدة البيانات فارغة من الشركات
        if (!await dbContext.Companies.AnyAsync())
        {
            logger.LogInformation("بذر شركات تجريبية مع إعدادات عمق مختلفة...");

            // 1. شركة تجارية كبرى بحد عمق 5 مستويات
            var commercialCompany = new Company(
                code: "COMP-001",
                nameArabic: "شركة الأمل للتجارة والاستيراد",
                nameEnglish: "Al-Amal Trading & Import Co.",
                baseCurrency: "SAR",
                maxAccountDepth: 5,
                taxNumber: "300123456700003");

            // 2. شركة استشارات وتقنية بحد عمق 4 مستويات
            var servicesCompany = new Company(
                code: "COMP-002",
                nameArabic: "مكتب الرواد للحلول التقنية والاستشارات",
                nameEnglish: "Al-Rowad Tech Solutions & Consulting",
                baseCurrency: "SAR",
                maxAccountDepth: 4,
                taxNumber: "300987654300003");

            // 3. متجر صغير لرواد الأعمال بحد عمق 3 مستويات فقط
            var smeCompany = new Company(
                code: "COMP-003",
                nameArabic: "متجر النور للمبيعات السريعة",
                nameEnglish: "Al-Noor Express Retail",
                baseCurrency: "SAR",
                maxAccountDepth: 3,
                taxNumber: "300555666700003");

            await dbContext.Companies.AddRangeAsync(commercialCompany, servicesCompany, smeCompany);
            await dbContext.SaveChangesAsync();

            // تهيئة شجرة الحسابات تلقائياً للشركة الأولى والثانية كنموذج أولي جاهز للاستعراض
            logger.LogInformation("تهيئة شجرة حسابات الشركة الأولى تلقائياً...");
            await initService.InitializeCompanyCoaAsync(new InitializeCoaRequest
            {
                CompanyId = commercialCompany.Id,
                TemplateId = CoaTemplateSeedData.CommercialTemplateId,
                Mode = InitializationMode.Strict,
                AutoMapSystemRoles = true
            });

            logger.LogInformation("تهيئة شجرة حسابات الشركة الثانية تلقائياً...");
            await initService.InitializeCompanyCoaAsync(new InitializeCoaRequest
            {
                CompanyId = servicesCompany.Id,
                TemplateId = CoaTemplateSeedData.ServicesTemplateId,
                Mode = InitializationMode.Strict,
                AutoMapSystemRoles = true
            });

            logger.LogInformation("تم إعداد البيانات التجريبية الأولية بنجاح.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "حدث خطأ أثناء تهيئة وبذر قاعدة البيانات عند الإقلاع.");
    }
}


app.Run();

