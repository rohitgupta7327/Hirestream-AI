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

// Bind to dynamic PORT injected by Railway or cloud hosts
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://*:{port}");
}
// 1. SAFELY INITIALIZE GHOSTSCRIPT (ISOLATED TO PREVENT JIT STARTUP CRASH)
try
{
    InitGhostscript();
}
catch (Exception ex)
{
    Console.WriteLine($"Ghostscript setup warning: {ex.Message}");
}

// 2. DATABASE CONFIGURATION
var connectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("DATABASE_PRIVATE_URL")
    ?? Environment.GetEnvironmentVariable("DATABASE_PUBLIC_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Database connection string not found.");
}

connectionString = ConvertDatabaseUrl(connectionString);
Console.WriteLine($"Database connection string loaded: {connectionString.Split(';')[0]}");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null)));

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
var rawJwtKey = builder.Configuration["Jwt:Key"];
var jwtKey = (!string.IsNullOrWhiteSpace(rawJwtKey) && !rawJwtKey.StartsWith("YOUR_") && rawJwtKey.Length >= 32)
    ? rawJwtKey
    : "HireStreamAI_Permanent_Secret_Key_2026_Stay_Secure";

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
app.UseCors("AllowAll");

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        // Ensure CORS headers are attached to 500 exception responses
        context.Response.Headers["Access-Control-Allow-Origin"] = "*";
        context.Response.Headers["Access-Control-Allow-Methods"] = "*";
        context.Response.Headers["Access-Control-Allow-Headers"] = "*";

        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;

        var errorMessage = exception?.Message ?? "An unexpected server error occurred.";
        if (exception?.InnerException != null)
        {
            errorMessage += $" ({exception.InnerException.Message})";
        }

        Console.WriteLine($"[GLOBAL EXCEPTION HANDLER] 500 Error: {exception}");

        var result = System.Text.Json.JsonSerializer.Serialize(new { message = errorMessage });
        await context.Response.WriteAsync(result);
    });
});

app.UseSwagger();
app.UseSwaggerUI();
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
        try
        {
            await dbContext.Database.MigrateAsync();
        }
        catch (Exception migEx)
        {
            Console.WriteLine($"MigrateAsync fallback to EnsureCreated: {migEx.Message}");
            await dbContext.Database.EnsureCreatedAsync();
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Database Migration Warning: {ex.Message}");
}

Console.WriteLine("Application Starting...");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
app.MapGet("/", () => Results.Ok("HirestreamAI Backend is running!"));
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

    NpgsqlConnectionStringBuilder builder;

    var lower = databaseUrl.ToLowerInvariant();
    if (lower.StartsWith("postgres://") || lower.StartsWith("postgresql://"))
    {
        if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri))
        {
            throw new ArgumentException($"DATABASE_URL is not a valid URI: {databaseUrl}");
        }

        var userInfo = uri.UserInfo.Split(':', 2);
        builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : string.Empty,
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            Database = uri.AbsolutePath.TrimStart('/'),
            SslMode = SslMode.Prefer,
            KeepAlive = 30
        };
        builder["Trust Server Certificate"] = "true";
        builder["Pooling"] = "true";
        builder["Timeout"] = "30";
        builder["KeepAlive"] = "15";
        builder["Connection Idle Lifetime"] = "30";
        builder["Connection Lifetime"] = "300";

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
                        if (Enum.TryParse<SslMode>(value, ignoreCase: true, out var sslMode))
                        {
                            builder.SslMode = sslMode;
                        }
                        break;
                    default:
                        builder[key] = value;
                        break;
                }
            }
        }
    }
    else
    {
        builder = new NpgsqlConnectionStringBuilder(databaseUrl)
        {
            KeepAlive = 15
        };
        if (builder.SslMode == SslMode.Require && !string.IsNullOrEmpty(builder.Host) && (builder.Host.Contains("localhost") || builder.Host.Contains("railway.internal") || builder.Host.Contains("127.0.0.1")))
        {
            builder.SslMode = SslMode.Prefer;
        }
        builder["Trust Server Certificate"] = "true";
        builder["Pooling"] = "true";
        builder["Timeout"] = "30";
        builder["Connection Idle Lifetime"] = "30";
        builder["Connection Lifetime"] = "300";
    }

    return builder.ToString();
}

[System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
static void InitGhostscript()
{
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
}