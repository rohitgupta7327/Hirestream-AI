using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HirestreamAI_Backend.Data;
using HirestreamAI_Backend.Services;
using ImageMagick;

var builder = WebApplication.CreateBuilder(args);

// Load local gitignored configuration file if it exists
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);


// 1. ENVIRONMENT & TOOLS SETUP
// Keep your Ghostscript path for ResumeParser exactly as it is on your machine
MagickNET.SetGhostscriptDirectory(@"C:\Program Files\gs\gs10.07.0\bin");

// 2. DATABASE CONFIGURATION (Microsoft SQL Server LocalDB)
var sqlConn = builder.Configuration.GetConnectionString("DefaultConnection")
              ?? "Server=(localdb)\\mssqllocaldb;Database=HirestreamAI;Trusted_Connection=True;MultipleActiveResultSets=true";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(sqlConn));

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
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}


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

// 9. START THE SERVER
app.Run();