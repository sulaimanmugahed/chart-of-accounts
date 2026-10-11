

using System.Net;
using System.Text.Json;

namespace ChartOfAccounts;

/// <summary>
/// وسيط معالجة الاستثناءات المحاسبية والنظامية العامة (Global Exception Handling Middleware).
/// يحول الأخطاء المحاسبية إلى ردود JSON معيارية واضحة باللغة العربية مع رموز الحالة HTTP الملائمة.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var statusCode = HttpStatusCode.InternalServerError;
        var errorCode = "INTERNAL_SERVER_ERROR";
        var message = "حدث خطأ غير متوقع في الخادم.";

        switch (exception)
        {
            case AccountDepthExceededException depthEx:
                statusCode = HttpStatusCode.BadRequest;
                errorCode = depthEx.ErrorCode ?? "ACCOUNT_DEPTH_EXCEEDED";
                message = depthEx.Message;
                _logger.LogWarning("خرق لقاعدة عمق شجرة الحسابات: {Message}", message);
                break;

            case CompanyAlreadyInitializedException initEx:
                statusCode = HttpStatusCode.Conflict;
                errorCode = initEx.ErrorCode ?? "COMPANY_ALREADY_INITIALIZED";
                message = initEx.Message;
                _logger.LogWarning("محاولة إعادة تهيئة دليل حسابات موجود: {Message}", message);
                break;

            case DuplicateAccountCodeException dupEx:
                statusCode = HttpStatusCode.Conflict;
                errorCode = dupEx.ErrorCode ?? "DUPLICATE_ACCOUNT_CODE";
                message = dupEx.Message;
                _logger.LogWarning("تكرار رمز الحساب: {Message}", message);
                break;

            case InvalidAccountHierarchyException hierEx:
                statusCode = HttpStatusCode.BadRequest;
                errorCode = hierEx.ErrorCode ?? "INVALID_ACCOUNT_HIERARCHY";
                message = hierEx.Message;
                _logger.LogWarning("خلل في هيكلية الحسابات: {Message}", message);
                break;

            case SystemAccountMappingException mapEx:
                statusCode = HttpStatusCode.BadRequest;
                errorCode = mapEx.ErrorCode ?? "SYSTEM_ACCOUNT_MAPPING_ERROR";
                message = mapEx.Message;
                _logger.LogWarning("خطأ في ربط دور الحساب النظامي: {Message}", message);
                break;

            case AccountingDomainException domainEx:
                statusCode = HttpStatusCode.BadRequest;
                errorCode = domainEx.ErrorCode ?? "ACCOUNTING_DOMAIN_ERROR";
                message = domainEx.Message;
                _logger.LogWarning("خطأ في قواعد النطاق المحاسبي: {Message}", message);
                break;

            default:
                _logger.LogError(exception, "استثناء غير معالج في النظام المحاسبي.");
                message = exception.Message;
                break;
        }

        response.StatusCode = (int)statusCode;

        var errorResponse = new
        {
            isSuccess = false,
            statusCode = (int)statusCode,
            errorCode = errorCode,
            errorMessage = message,
            timestampUtc = DateTime.UtcNow
        };

        var json = JsonSerializer.Serialize(errorResponse);
        await response.WriteAsync(json);
    }
}

