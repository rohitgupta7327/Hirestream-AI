namespace HirestreamAI_Backend.Models;

public class StudentDashboardResult
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int MatchScore { get; set; }
    public string? ReadinessStatus { get; set; }
    public List<string> MatchedSkills { get; set; } = new();

    public List<string> KeyStrengths { get; set; } = new();
    public List<string> ResumeWeaknesses { get; set; } = new();
    public List<string> InterviewQuestions { get; set; } = new();

    public GapAnalysis? GapAnalysis { get; set; }
    public List<ActionItem> ActionPlan { get; set; } = new();
    public LearningRoadmap? LearningRoadmap { get; set; }
    public RecommendedProject? RecommendedProject { get; set; }
}

public class GapAnalysis
{
    public List<MissingSkill> CriticalMissingSkills { get; set; } = new();
}

public class MissingSkill
{
    public string? SkillName { get; set; }
    public string? Reason { get; set; }
    public string? Priority { get; set; }
}

public class ActionItem
{
    public int StepNumber { get; set; }
    public string? Task { get; set; }
}

public class LearningRoadmap
{
    public string? Phase { get; set; }
    public List<string> Tasks { get; set; } = new();
}

public class RecommendedProject
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public List<string> Technologies { get; set; } = new();
}