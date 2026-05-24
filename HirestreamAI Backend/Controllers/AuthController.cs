using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claim;
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
            // 1. One Email = One Role Policy
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (existingUser != null)
            {
                return BadRequest(new
                {
                    message = $"This email is already registered as a {existingUser.Role}. Please log in or use a different email."
                });
            }
            // Enforce Organization Presence
            if (string.IsNullOrWhiteSpace(dto.Organization))
            {
                var orgType = dto.Role.ToLower() == "recruiter" ? "Company" : "College";
                return BadRequest(new { message = $"{orgType} name is required." });
            }

            // 2. Hash Password
            string hashedPw = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            // 3. Create User with Organization (Company/College)
            var newUser = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = hashedPw,
                Role = dto.Role.ToLower(),
                Organization = dto.Organization,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User registered successfully!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
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

        // This method must be INSIDE the AuthController class but OUTSIDE other methods
        private string GenerateJwtToken(User user)
        {
            // 1. Get the Key and ensure it is treated as a UTF8 byte array
            var jwtKey = _config["Jwt:Key"] ?? "HireStreamAI_Permanent_Secret_Key_2026_Secure";
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