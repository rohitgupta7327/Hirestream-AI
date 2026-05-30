using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Text.Json;
using HirestreamAI_Backend.Models;
using HirestreamAI_Backend.Services;

namespace HirestreamAI_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScanController : ControllerBase
{
    private readonly AIService _aiService;
    private readonly ResumeParser _parser;
    private readonly IEmailService _emailService;
    private readonly IPdfRoadmapService _pdfRoadmapService;

    public ScanController(AIService aiService, ResumeParser parser, IEmailService emailService, IPdfRoadmapService pdfRoadmapService)
    {
        _aiService = aiService;
        _parser = parser;
        _emailService = emailService;
        _pdfRoadmapService = pdfRoadmapService;
    }


    [HttpPost]
    public async Task<IActionResult> Scan(
        [FromForm] List<IFormFile> resumes, 
        [FromForm] string jd,
        [FromForm] int technicalWeight = 60,
        [FromForm] int experienceWeight = 25,
        [FromForm] int toolsWeight = 15)
    {
        if (resumes == null || !resumes.Any()) return BadRequest("No resumes uploaded");
        if (string.IsNullOrWhiteSpace(jd)) return BadRequest("Job description is required");

        var candidates = new List<Candidate>();

        foreach (var file in resumes)
        {
            

            // 1. Small proactive delay to stay under the radar (1 second)
            await Task.Delay(2000);
            try
            {
                // 1. Extract Text & Email
                var text = _parser.ExtractText(file);
                if (string.IsNullOrWhiteSpace(text) || text == "EMPTY")
                {
                    candidates.Add(new Candidate
                    {
                        Name = file.FileName,
                        Email = "Not found",
                        Skills = new List<string>(),
                        MissingSkills = new List<string>(),
                        MatchPercentage = 0,
                        Reason = "System could not extract readable text from this file. Please ensure it is a valid document."
                    });
                    continue; 
                }
                var email = _parser.ExtractEmail(text);

                // Compress text to save tokens
                text = _parser.CompressResumeText(text);

                // 2. Get AI Analysis (Pass custom weights)
                var aiRawResult = await _aiService.GetMatchScore(jd, text, technicalWeight, experienceWeight, toolsWeight);
                
                // If the AI API is overloaded, tell the frontend to trigger its retry loop
                if (aiRawResult.Contains("\"error\"") || aiRawResult == "{}" || string.IsNullOrWhiteSpace(aiRawResult))
                {
                    return StatusCode(429, new { error = "AI API is overloaded or rate limited." });
                }

                // 3. Parse JSON with Cleaning
                var aiData = ParseCleanJson(aiRawResult);
                
                var extractedName = _parser.ExtractName(text);
                var finalName = (!string.IsNullOrWhiteSpace(extractedName) && extractedName.Length < 50) 
                                ? extractedName 
                                : file.FileName;

                // (JSON already parsed on line 50)

                candidates.Add(new Candidate
                {
                    Name = finalName,
                    Email = string.IsNullOrEmpty(email) ? "Not found" : email,
                    Skills = aiData.Skills ?? new List<string>(),

                    // ✅ FIX HERE
                    MatchPercentage = Math.Min(100, Math.Max(0, aiData.MatchPercentage)),

                    MissingSkills = aiData.MissingSkills ?? new List<string>(),
                    Reason = aiData.Reason
                });
            }
            catch (Exception ex)
            {
                // If one file fails, we guarantee it still returns an entry to the frontend
                Console.WriteLine($"Error processing {file.FileName}: {ex.Message}");
                candidates.Add(new Candidate
                {
                    Name = file.FileName,
                    Email = "Error",
                    Skills = new List<string>(),
                    MissingSkills = new List<string>(),
                    MatchPercentage = 0,
                    Reason = $"Internal processing error: {ex.Message}"
                });
            }
        }

        var ranked = candidates
      .Where(c => c != null)
      .OrderByDescending(c => c.MatchPercentage)
      .ToList();

        return Ok(ranked);
    }
    private AIResult ParseCleanJson(string rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return new AIResult
            {
                MatchPercentage = 0,
                Skills = new List<string>(),
                MissingSkills = new List<string>(),
                Reason = "Empty response from AI"
            };
        }
        try
        {
            // Strip potential Markdown wrapping that Gemini sometimes hallucinates
            var cleanJson = rawJson.Trim();
            if (cleanJson.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
                cleanJson = cleanJson.Substring(7);
            else if (cleanJson.StartsWith("```"))
                cleanJson = cleanJson.Substring(3);

            if (cleanJson.EndsWith("```"))
                cleanJson = cleanJson.Substring(0, cleanJson.Length - 3);

            cleanJson = cleanJson.Trim();

            Console.WriteLine($"[DEBUG] AI Clean JSON: {cleanJson}");

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var result = JsonSerializer.Deserialize<AIResult>(cleanJson, options);

            return result ?? new AIResult
            {
                MatchPercentage = 0,
                Skills = new List<string>(),
                MissingSkills = new List<string>(),
                Reason = "Deserialization returned null"
            };                  
        }                       
        catch (Exception ex)
        {
            Console.WriteLine($"❌ FINAL PARSE ERROR: {ex.Message}");

            return new AIResult
            {
                MatchPercentage = 0,
                Skills = new List<string>(),
                MissingSkills = new List<string>(),
                Reason = "AI parsing failed"
            };
        }
    }

    [HttpPost("student")]
    public async Task<IActionResult> ScanStudent([FromForm] List<IFormFile> resumes, [FromForm] string jd)
    {
        if (resumes == null || !resumes.Any()) return BadRequest("No resumes uploaded");

        var file = resumes.First();
        var text = _parser.ExtractText(file);
        if (text == "EMPTY") return BadRequest("Could not extract text from resume");

        var email = _parser.ExtractEmail(text);

        // Compress text to save tokens
        text = _parser.CompressResumeText(text);

        var aiRawResult = await _aiService.AnalyzeStudentResumeAsync(jd, text);

        StudentDashboardResult aiData;
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            aiData = JsonSerializer.Deserialize<StudentDashboardResult>(aiRawResult, options) ?? new StudentDashboardResult();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Student Parse Error: {ex.Message}");
            aiData = new StudentDashboardResult();
        }

        var extractedName = _parser.ExtractName(text);
        var finalName = (!string.IsNullOrWhiteSpace(extractedName) && extractedName.Length < 50) 
                        ? extractedName 
                        : file.FileName;

        aiData.Name = finalName;
        aiData.Email = string.IsNullOrEmpty(email) ? "Not found" : email;

        return Ok(aiData);
    }

    [HttpPost("reject-email")]
    public async Task<IActionResult> RejectEmail([FromBody] RejectionEmailDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CandidateEmail) || dto.CandidateEmail == "Not found" || dto.CandidateEmail == "Error")
        {
            return BadRequest(new { message = "Candidate email is invalid or missing." });
        }

        try
        {
            // Generate PDF
            var pdfBytes = _pdfRoadmapService.GenerateRoadmapPdf(
                dto.CandidateName, 
                dto.JobTitle, 
                dto.MatchPercentage, 
                dto.Skills, 
                dto.MissingSkills, 
                dto.Reason
            );

            // Send Email
            var fileName = $"Career_Roadmap_{dto.CandidateName.Replace(" ", "_")}.pdf";
            await _emailService.SendRejectionEmailAsync(
                dto.CandidateName, 
                dto.CandidateEmail, 
                dto.JobTitle, 
                pdfBytes, 
                fileName
            );

            return Ok(new { message = "Rejection email with personalized roadmap sent successfully!" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending rejection email: {ex.Message}");
            return StatusCode(500, new { message = $"Failed to send email: {ex.Message}" });
        }
    }

    [HttpPost("accept-email")]
    public async Task<IActionResult> AcceptEmail([FromBody] AcceptanceEmailDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CandidateEmail) || dto.CandidateEmail == "Not found" || dto.CandidateEmail == "Error")
        {
            return BadRequest(new { message = "Candidate email is invalid or missing." });
        }

        try
        {
            await _emailService.SendAcceptanceEmailAsync(
                dto.CandidateName, 
                dto.CandidateEmail, 
                dto.JobTitle
            );

            return Ok(new { message = "Acceptance email sent successfully!" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending acceptance email: {ex.Message}");
            return StatusCode(500, new { message = $"Failed to send email: {ex.Message}" });
        }
    }
}

public class RejectionEmailDto
{
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public double MatchPercentage { get; set; }
    public List<string> Skills { get; set; } = new();
    public List<string> MissingSkills { get; set; } = new();
    public string Reason { get; set; } = string.Empty;
}

public class AcceptanceEmailDto
{
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
}
