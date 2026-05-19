public class Candidate
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();
    public double MatchPercentage { get; set; }
    public List<string> MissingSkills { get; set; } = new();
    public string Reason { get; set; } = string.Empty;
}