using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChartOfAccounts.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CoaTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NameArabic = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    NameEnglish = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IndustryType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RecommendedMaxDepth = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsSystemTemplate = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoaTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Companies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NameArabic = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NameEnglish = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TaxNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BaseCurrency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "SAR"),
                    FiscalYearStartMonth = table.Column<int>(type: "integer", nullable: false),
                    MaxAccountDepth = table.Column<int>(type: "integer", nullable: false, defaultValue: 5),
                    IsCoaInitialized = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    InitializedFromTemplateId = table.Column<Guid>(type: "uuid", nullable: true),
                    InitializedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Companies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CoaTemplateNodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NameArabic = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    NameEnglish = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    AccountType = table.Column<int>(type: "integer", nullable: false),
                    NormalBalance = table.Column<int>(type: "integer", nullable: false),
                    Classification = table.Column<int>(type: "integer", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    ParentNodeCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsHeader = table.Column<bool>(type: "boolean", nullable: false),
                    IsPostable = table.Column<bool>(type: "boolean", nullable: false),
                    DefaultSystemRole = table.Column<int>(type: "integer", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoaTemplateNodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoaTemplateNodes_CoaTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "CoaTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NameArabic = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    NameEnglish = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    AccountType = table.Column<int>(type: "integer", nullable: false),
                    NormalBalance = table.Column<int>(type: "integer", nullable: false),
                    Classification = table.Column<int>(type: "integer", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    ParentAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsHeader = table.Column<bool>(type: "boolean", nullable: false),
                    IsPostable = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    SystemRole = table.Column<int>(type: "integer", nullable: true),
                    LineagePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Accounts_Accounts_ParentAccountId",
                        column: x => x.ParentAccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Accounts_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CoaInitializationAuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AccountsCreatedCount = table.Column<int>(type: "integer", nullable: false),
                    SystemRolesMappedCount = table.Column<int>(type: "integer", nullable: false),
                    ExecutionDurationMs = table.Column<long>(type: "bigint", nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DetailsJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoaInitializationAuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoaInitializationAuditLogs_CoaTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "CoaTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CoaInitializationAuditLogs_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompanySystemAccounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    AccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsLocked = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    AssignedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanySystemAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompanySystemAccounts_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CompanySystemAccounts_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_CompanyId_Code",
                table: "Accounts",
                columns: new[] { "CompanyId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_CompanyId_IsPostable",
                table: "Accounts",
                columns: new[] { "CompanyId", "IsPostable" });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_CompanyId_Level",
                table: "Accounts",
                columns: new[] { "CompanyId", "Level" });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_CompanyId_LineagePath",
                table: "Accounts",
                columns: new[] { "CompanyId", "LineagePath" });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_ParentAccountId",
                table: "Accounts",
                column: "ParentAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_CoaInitializationAuditLogs_CompanyId_Timestamp",
                table: "CoaInitializationAuditLogs",
                columns: new[] { "CompanyId", "TimestampUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_CoaInitializationAuditLogs_TemplateId",
                table: "CoaInitializationAuditLogs",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_CoaTemplateNodes_TemplateId_Code",
                table: "CoaTemplateNodes",
                columns: new[] { "TemplateId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CoaTemplateNodes_TemplateId_Level",
                table: "CoaTemplateNodes",
                columns: new[] { "TemplateId", "Level" });

            migrationBuilder.CreateIndex(
                name: "IX_CoaTemplates_Code",
                table: "CoaTemplates",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Companies_Code",
                table: "Companies",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompanySystemAccounts_AccountId",
                table: "CompanySystemAccounts",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_CompanySystemAccounts_CompanyId_Role",
                table: "CompanySystemAccounts",
                columns: new[] { "CompanyId", "Role" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoaInitializationAuditLogs");

            migrationBuilder.DropTable(
                name: "CoaTemplateNodes");

            migrationBuilder.DropTable(
                name: "CompanySystemAccounts");

            migrationBuilder.DropTable(
                name: "CoaTemplates");

            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "Companies");
        }
    }
}
