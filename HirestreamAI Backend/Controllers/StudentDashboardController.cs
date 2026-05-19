using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

// Pointing directly to your folders
using HirestreamAI_Backend.Services;
using HirestreamAI_Backend.Data;

namespace HirestreamAI_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requires a valid JWT token
    public class StudentDashboardController : ControllerBase
    {
        // 🚨 Matched to your ScanController (Using concrete classes, no 'I' prefix)
        private readonly AIService _aiService;
        private readonly ResumeParser _resumeParser;
        private readonly AppDbContext _context;

        public StudentDashboardController(AIService aiService, ResumeParser resumeParser, AppDbContext context)
        {
            _aiService = aiService;
            _resumeParser = resumeParser;
            _context = context;
        }

        [HttpPost("analyze-resume")]
        public async Task<IActionResult> AnalyzeResume(IFormFile resumeFile, [FromForm] string jd)
        {
            if (resumeFile == null || resumeFile.Length == 0)
                return BadRequest("Please upload a valid resume file.");

            try
            {
                // 1. Get the logged-in Student's ID from the JWT Token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                // 2. Extract text (🚨 FIXED: Using your exact method name from ScanController)
                string resumeText = _resumeParser.ExtractText(resumeFile);

                if (resumeText == "EMPTY")
                    return BadRequest("Failed to extract text from the document.");

                // 3. Send text to Gemini and get the raw JSON string back
                string analysisResultJson = await _aiService.AnalyzeStudentResumeAsync(jd ?? "", resumeText);

                // 4. Return the JSON directly to the React frontend
                return Content(analysisResultJson, "application/json");
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(500, $"An error occurred during analysis: {ex.Message}");
            }
        }
    }
}