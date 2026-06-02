using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.Text;
using HirestreamAI_Backend.Data;
using HirestreamAI_Backend.Services;
using ImageMagick;

var builder = WebApplication.CreateBuilder(args);

// Load local gitignored configuration file if it exists
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// 1. ENVIRONMENT & TOOLS SETUP
// Set Ghostscript path based on OS
if (OperatingSystem.IsWindows())
{
    MagickNET.SetGhostscriptDirectory(
        @"C:\Program Files\gs\gs10.07.0\bin");
}
else if (OperatingSystem.IsLinux())
{
    // Railway (Linux) - Ghostscript is typically in /usr/bin
    MagickNET.SetGhostscriptDirectory("/usr");
}

// 2. DATABASE CONFIGURATION (PostgreSQL / Railway compatible)
// 2. DATABASE CONFIGURATION (Railway PostgreSQL)

// =======================
// DATABASE CONFIGURATION
// =======================

var connectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "ConnectionStrings__DefaultConnection not found.");
}

// Convert PostgreSQL URI format to Npgsql format if needed (for Railway)
connectionString = ConvertDatabaseUrl(connectionString);

Console.WriteLine("Database connection string loaded.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 3. CORE SERVICES
builder.Services.AddControllers();
builder.Services.AddHttpClient(); // Required for AIService
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
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// 7. HTTP PIPELINE CONFIGURATION
app.UseSwagger();
app.UseSwaggerUI();


// Order is critical here: Routing -> Auth -> Endpoints
app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 8. DATABASE AUTO-CREATION (Safe Development Mode)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated(); // Creates the DB and Tables if they don't exist
}

Console.WriteLine("Application Starting...");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"Database: {connectionString}");
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
                switch (key)
                {
                    case "sslmode":
                        builder.SslMode = ParseSslMode(value);
                        break;
                    case "trustservercertificate":
                        builder.TrustServerCertificate = bool.TryParse(value, out var b) && b;
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

static SslMode ParseSslMode(string sslModeValue)
{
    return sslModeValue?.ToLowerInvariant() switch
    {
        "disable" => SslMode.Disable,
        "allow" => SslMode.Allow,
        "prefer" => SslMode.Prefer,
        "require" => SslMode.Require,
        "verify-ca" => SslMode.VerifyCA,
        "verify-full" => SslMode.VerifyFull,
        _ => SslMode.Require,
    };
}
