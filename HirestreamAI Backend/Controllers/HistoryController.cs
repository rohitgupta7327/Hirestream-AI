using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using HirestreamAI_Backend.Data;
using HirestreamAI_Backend.Models;

namespace HirestreamAI_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requires a valid JWT Token
public class HistoryController : ControllerBase
{
    private readonly AppDbContext _context;

    public HistoryController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> SaveHistory([FromBody] HistoryDto dto)
    {
        // Extract UserId from the token claims
        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new { message = "Invalid token or user ID missing." });
        }

        // Extract Role from token
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value ?? "student";

        var historyRecord = new ScanHistory
        {
            UserId = userId,
            CandidateName = dto.CandidateName,
            CandidateEmail = dto.CandidateEmail,
            Role = roleClaim,
            MatchPercentage = dto.MatchPercentage,
            ResultJson = dto.ResultJson,
            ScanDate = DateTime.UtcNow
        };

        _context.ScanHistories.Add(historyRecord);
        await _context.SaveChangesAsync();

        return Ok(new { message = "History saved successfully", id = historyRecord.Id });
    }

    [HttpGet]
    public async Task<IActionResult> GetHistory()
    {
        // Extract UserId from the token claims
        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new { message = "Invalid token or user ID missing." });
        }

        // Fetch history ordered by newest first
        var history = await _context.ScanHistories
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.ScanDate)
            .ToListAsync();

        return Ok(history);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteHistory(int id)
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new { message = "Invalid token or user ID missing." });
        }

        var record = await _context.ScanHistories.FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId);
        if (record == null)
        {
            return NotFound(new { message = "Record not found or access denied." });
        }

        _context.ScanHistories.Remove(record);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Record deleted successfully." });
    }
}

public class HistoryDto
{
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public int MatchPercentage { get; set; }
    public string ResultJson { get; set; } = string.Empty;
}
