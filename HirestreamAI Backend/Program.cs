using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.Text;
using HirestreamAI_Backend.Services;
using ImageMagick;
using Microsoft.EntityFrameworkCore;
using HirestreamAI_Backend.Data;

var builder = WebApplication.CreateBuilder(args);

// Load local gitignored configuration file if it exists
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);

// Fallback to port 8080 if Railway doesn't explicitly inject a PORT variable
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// 1. SAFELY INITIALIZE GHOSTSCRIPT
try
{
    if (OperatingSystem.IsWindows())
    {
        MagickNET.SetGhostscriptDirectory(@"C:\Program Files\gs\gs10.07.0\bin");
    }
    else if (OperatingSystem.IsLinux())
    {
        MagickNET.SetGhostscriptDirectory("/usr");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Ghostscript setup warning: {ex.Message}");
}

// 2. DATABASE CONFIGURATION
var connectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings__DefaultConnection not found.");
}

connectionString = ConvertDatabaseUrl(connectionString);
Console.WriteLine("Database connection string loaded.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 3. CORE SERVICES
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 4. CUSTOM SERVICES FOR DI
builder.Services.AddScoped<AIService>();
builder.Services.AddScoped<ResumeParser>();
builder.Services.AddTransient<IEmailService, EmailService>();
builder.Services.AddTransient<IPdfRoadmapService, PdfRoadmapService>();

// 5. JWT AUTHENTICATION SETUP
var jwtKey = builder.Configuration["Jwt:Key"] ?? "HireStreamAI_Permanent_Secret_Key_2026_Secure";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// 6. CORS SETUP
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 7. HTTP PIPELINE CONFIGURATION (CRITICAL MIDDLEWARE ORDER)
app.UseSwagger();
app.UseSwaggerUI();

// CORS MUST BE BEFORE USEROUTING
app.UseCors("AllowAll");

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 8. DATABASE AUTO-MIGRATION
try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Database Migration Warning: {ex.Message}");
}

Console.WriteLine("Application Starting...");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");

// 9. START THE SERVER
app.Run();

static string ConvertDatabaseUrl(string databaseUrl)
{
    if (string.IsNullOrWhiteSpace(databaseUrl))
    {
        throw new ArgumentException("DATABASE_URL is empty.", nameof(databaseUrl));
    }

    databaseUrl = databaseUrl.Trim();
    if ((databaseUrl.StartsWith('"') && databaseUrl.EndsWith('"')) ||
        (databaseUrl.StartsWith('\'') && databaseUrl.EndsWith('\'')))
    {
        databaseUrl = databaseUrl[1..^1].Trim();
    }

    var lower = databaseUrl.ToLowerInvariant();
    if (lower.StartsWith("postgres://") || lower.StartsWith("postgresql://"))
    {
        if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri))
        {
            throw new ArgumentException($"DATABASE_URL is not a valid URI: {databaseUrl}");
        }

        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : string.Empty,
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            Database = uri.AbsolutePath.TrimStart('/'),
            SslMode = SslMode.Require
        };

        var query = uri.Query.TrimStart('?');
        if (!string.IsNullOrEmpty(query))
        {
            foreach (var part in query.Split('&', StringSplitOptions.RemoveEmptyEntries))
            {
                var kv = part.Split('=', 2);
                if (kv.Length != 2) continue;

                var key = kv[0].ToLowerInvariant();
                var value = Uri.UnescapeDataString(kv[1]);
                switch (key.ToLowerInvariant())
                {
                    case "sslmode":
                        if (Enum.TryParse<SslMode>(value, ignoreCase: true, out var sslMode))
                        {
                            builder.SslMode = sslMode;
                        }
                        break;

                    case "trustservercertificate":
                        if (bool.TryParse(value, out var trust) && trust)
                        {
                            builder.SslMode = SslMode.Require;
                        }
                        break;

                    default:
                        builder[key] = value;
                        break;
                }
            }
        }

        return builder.ToString();
    }

    return databaseUrl;
}