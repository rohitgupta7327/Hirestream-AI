using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HirestreamAI_Backend.Data;
using HirestreamAI_Backend.Models;
using BCrypt.Net;

namespace HirestreamAI_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                {
                    return BadRequest(new { message = "Email and Password are required fields." });
                }

                var userRole = (dto.Role ?? "student").Trim().ToLower();
                var orgName = (dto.Organization ?? "").Trim();
                if (string.IsNullOrWhiteSpace(orgName))
                {
                    orgName = userRole == "recruiter" ? "Company Name Required" : "General";
                }

                var cleanEmail = dto.Email.Trim().ToLower();
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);

                if (existingUser != null)
                {
                    return BadRequest(new
                    {
                        message = $"This email is already registered as a {existingUser.Role}. Please log in or use a different email."
                    });
                }

                string hashedPw = BCrypt.Net.BCrypt.HashPassword(dto.Password);

                var newUser = new User
                {
                    FullName = string.IsNullOrWhiteSpace(dto.FullName) ? "User" : dto.FullName.Trim(),
                    Email = cleanEmail,
                    PasswordHash = hashedPw,
                    Role = userRole,
                    Organization = orgName,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                return Ok(new { message = "User registered successfully!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SIGNUP ERROR] {ex}");
                var msg = ex.InnerException != null ? $"{ex.Message} ({ex.InnerException.Message})" : ex.Message;
                return StatusCode(500, new { message = $"Signup Database Error: {msg}" });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                {
                    return BadRequest(new { message = "Email and Password are required." });
                }

                var cleanEmail = dto.Email.Trim().ToLower();
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);

                if (user == null)
                {
                    return NotFound(new { message = "Your account is not registered. Please sign up." });
                }

                if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                {
                    return Unauthorized(new { message = "Invalid email or password." });
                }

                // Generate the token
                var token = GenerateJwtToken(user);

                return Ok(new
                {
                    token = token,
                    role = user.Role,
                    fullName = user.FullName,
                    organization = user.Organization,
                    message = "Login successful"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LOGIN ERROR] {ex}");
                var msg = ex.InnerException != null ? $"{ex.Message} ({ex.InnerException.Message})" : ex.Message;
                return StatusCode(500, new { message = $"Login Database Error: {msg}" });
            }
        }

        // This method must be INSIDE the AuthController class but OUTSIDE other methods
        private string GenerateJwtToken(User user)
        {
            // 1. Get the Key and ensure it is treated as a UTF8 byte array
            var rawJwtKey = _config["Jwt:Key"];
            var jwtKey = (!string.IsNullOrWhiteSpace(rawJwtKey) && !rawJwtKey.StartsWith("YOUR_") && rawJwtKey.Length >= 32)
                ? rawJwtKey
                : "HireStreamAI_Permanent_Secret_Key_2026_Stay_Secure";

            var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

            // 2. Create the Security Key
            var securityKey = new SymmetricSecurityKey(keyBytes);
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // 3. Define the Claims (stored in the token)
            var claims = new[]
            {
        new Claim(JwtRegisteredClaimNames.Sub, user.Email),
        new Claim("UserId", user.Id.ToString()),
        new Claim(ClaimTypes.Role, user.Role),
        new Claim("FullName", user.FullName),
        new Claim("Organization", user.Organization ?? ""), // Handles the new field
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

            // 4. Build the Token object
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(3),
                signingCredentials: credentials);

            // 5. Convert to the final string for the Frontend
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}