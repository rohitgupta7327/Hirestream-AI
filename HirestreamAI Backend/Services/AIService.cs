using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using HirestreamAI_Backend.Services; // Assuming IResumeParser is in your Services folder
using HirestreamAI_Backend.Data;     // Assuming ApplicationDbContext is in a Data or Models folder

namespace HirestreamAI_Backend.Services;

public interface IAIService
{
    Task<string> GetMatchScore(string jd, string resume, int technicalWeight = 60, int experienceWeight = 25, int toolsWeight = 15);
    Task<string> AnalyzeStudentResumeAsync(string jd, string resume);
}

public class AIService : IAIService
{
    private readonly string _apiKey;
    private readonly IHttpClientFactory _httpClientFactory;

    // ✅ In-memory cache (prevents different results for same input)
    private static Dictionary<string, string> _cache = new();

    public AIService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _apiKey = configuration["Gemini:ApiKey"] ?? "";
        _httpClientFactory = httpClientFactory;
    }

    // ==========================================
    // RECRUITER DASHBOARD: JD vs Resume Matcher
    // ==========================================
    public async Task<string> GetMatchScore(string jd, string resume, int technicalWeight = 60, int experienceWeight = 25, int toolsWeight = 15)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            Console.WriteLine("❌ API Key Missing");
            return "{}";
        }

        // ✅ CACHE KEY (stable)
        var cacheKey = $"recruiter_{jd.GetHashCode()}_{resume.GetHashCode()}_{technicalWeight}_{experienceWeight}_{toolsWeight}";

        // ✅ RETURN FROM CACHE
        if (_cache.ContainsKey(cacheKey))
        {
            Console.WriteLine("⚡ Returning cached result for Recruiter");
            return _cache[cacheKey];
        }

        using var client = _httpClientFactory.CreateClient();
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

        var prompt = $@"
You are a STRICT and CONSISTENT resume evaluator.

IMPORTANT RULES:
- Always return the SAME result for the SAME input
- DO NOT generate random scores
- DO NOT give 100% unless perfect match
- DO NOT give 0% unless completely irrelevant
- For partial matches, score between 30–85

EVALUATION RUBRIC:
You MUST calculate the matchPercentage using this strict mathematical formula:
1. Skills Match ({technicalWeight} points max): Identify all core technical skills required in the JD. Calculate the exact percentage of these skills present in the resume. (e.g. 4 out of 5 skills = {Math.Round(technicalWeight * 0.8)} points).
2. Experience/Projects Match ({experienceWeight} points max): Deduct points if the resume lacks the required years of experience or domain-specific projects mentioned in the JD.
3. Tools & Frameworks ({toolsWeight} points max): Deduct points for missing secondary tools (Git, Agile, specific databases, etc.).
Calculate the exact sum of these 3 categories and return it as the matchPercentage (0-100). Be extremely objective.

RETURN JSON ONLY:{{
  ""matchPercentage"": number,
  ""skills"": [""string""],
  ""missingSkills"": [""string""],
  ""reason"": ""short explanation""}}

Job Description:{jd}

Resume:{resume}
";

        var recruiterSchema = new
        {
            type = "OBJECT",
            properties = new
            {
                matchPercentage = new { type = "INTEGER" },
                skills = new { type = "ARRAY", items = new { type = "STRING" } },
                missingSkills = new { type = "ARRAY", items = new { type = "STRING" } },
                reason = new { type = "STRING" }
            },
            required = new[] { "matchPercentage", "skills", "missingSkills", "reason" }
        };

        var result = await ExecuteGeminiRequestAsync(client, url, prompt, cacheKey, recruiterSchema);
        if (result == null)
        {
            Console.WriteLine("⚠️ Gemini API failed. Falling back to local keyword matching engine.");
            return GenerateRecruiterFallback(jd, resume);
        }
        return result;
    }

    // ==========================================
    // STUDENT DASHBOARD: Resume Analyzer
    // ==========================================
    public async Task<string> AnalyzeStudentResumeAsync(string jd, string resume)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            Console.WriteLine("❌ API Key Missing");
            return "{}";
        }

        // ✅ CACHE KEY (prefix separates it from recruiter queries)
        var cacheKey = $"student_{jd.GetHashCode()}_{resume.GetHashCode()}";

        if (_cache.ContainsKey(cacheKey))
        {
            Console.WriteLine("⚡ Returning cached result for Student Dashboard");
            return _cache[cacheKey];
        }

        using var client = _httpClientFactory.CreateClient();
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

        var prompt = $@"
        You are an elite Tech Recruiter and Career Coach at a top-tier tech company.
        Analyze the candidate's resume AGAINST the provided Job Description.
        Be brutally honest, highly specific, and deeply actionable. No generic fluff.

        CRITICAL RULES:
        1. DO NOT use placeholders like X%, Y, or Z. 
        2. Give concrete, realistic examples tailored to the candidate's actual projects. If they built a 'Task Manager', suggest rewriting it to 'Reduced task retrieval time by 40% using Redis' instead of 'improved by X%'.
        3. Make the Action Plan exactly 4 distinct, immediately executable steps.

        Job Description:
        {jd}

        Resume Text:
        {resume}

        Ensure all fields are populated with relevant, realistic data tailored strictly to matching this candidate to this exact Job Description.";

        var studentSchema = new
        {
            type = "OBJECT",
            properties = new
            {
                matchScore = new { type = "INTEGER" },
                readinessStatus = new { type = "STRING" },
                matchedSkills = new { type = "ARRAY", items = new { type = "STRING" } },
                gapAnalysis = new
                {
                    type = "OBJECT",
                    properties = new
                    {
                        criticalMissingSkills = new
                        {
                            type = "ARRAY",
                            items = new
                            {
                                type = "OBJECT",
                                properties = new
                                {
                                    skillName = new { type = "STRING" },
                                    reason = new { type = "STRING" },
                                    priority = new { type = "STRING" }
                                },
                                required = new[] { "skillName", "reason", "priority" }
                            }
                        }
                    },
                    required = new[] { "criticalMissingSkills" }
                },
                keyStrengths = new { type = "ARRAY", items = new { type = "STRING" } },
                resumeWeaknesses = new { type = "ARRAY", items = new { type = "STRING" } },
                interviewQuestions = new { type = "ARRAY", items = new { type = "STRING" } },
                actionPlan = new
                {
                    type = "ARRAY",
                    items = new
                    {
                        type = "OBJECT",
                        properties = new
                        {
                            stepNumber = new { type = "INTEGER" },
                            task = new { type = "STRING" }
                        },
                        required = new[] { "stepNumber", "task" }
                    }
                },
                learningRoadmap = new
                {
                    type = "OBJECT",
                    properties = new
                    {
                        phase = new { type = "STRING" },
                        tasks = new { type = "ARRAY", items = new { type = "STRING" } }
                    },
                    required = new[] { "phase", "tasks" }
                },
                recommendedProject = new
                {
                    type = "OBJECT",
                    properties = new
                    {
                        title = new { type = "STRING" },
                        description = new { type = "STRING" },
                        technologies = new { type = "ARRAY", items = new { type = "STRING" } }
                    },
                    required = new[] { "title", "description", "technologies" }
                }
            },
            required = new[] { "matchScore", "readinessStatus", "matchedSkills", "gapAnalysis", "keyStrengths", "resumeWeaknesses", "interviewQuestions", "actionPlan", "learningRoadmap", "recommendedProject" }
        };

        var result = await ExecuteGeminiRequestAsync(client, url, prompt, cacheKey, studentSchema);
        if (result == null)
        {
            Console.WriteLine("⚠️ Gemini API failed. Falling back to local career analysis engine.");
            return GenerateStudentFallback(jd, resume);
        }
        return result;
    }

    // ==========================================
    // HELPER: Shared execution logic
    // ==========================================
    private async Task<string?> ExecuteGeminiRequestAsync(HttpClient client, string url, string prompt, string cacheKey, object? responseSchema = null)
    {
        var generationConfig = new Dictionary<string, object>
        {
            { "response_mime_type", "application/json" },
            { "temperature", 0.0 }
        };

        if (responseSchema != null)
        {
            generationConfig["response_schema"] = responseSchema;
        }

        var payload = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            },
            generationConfig = generationConfig
        };

        try
        {
            var httpContent = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(url, httpContent);

            if ((int)response.StatusCode == 429)
            {
                Console.WriteLine("⚠️ Quota Exceeded (429). Please wait or check billing.");
                return null;
            }

            var rawResponse = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"❌ API ERROR: {response.StatusCode}. Details: {rawResponse}");
                return null;
            }

            using var doc = JsonDocument.Parse(rawResponse);
            var root = doc.RootElement;

            if (root.TryGetProperty("candidates", out var candidates) &&
                candidates.ValueKind == JsonValueKind.Array &&
                candidates.GetArrayLength() > 0)
            {
                var firstCandidate = candidates[0];

                if (firstCandidate.TryGetProperty("content", out var content) &&
                    content.TryGetProperty("parts", out var parts) &&
                    parts.ValueKind == JsonValueKind.Array &&
                    parts.GetArrayLength() > 0)
                {
                    var textPart = parts[0];

                    if (textPart.TryGetProperty("text", out var textElement))
                    {
                        var cleanJson = textElement.GetString() ?? "{}";
                        cleanJson = cleanJson.Trim();

                        // ✅ Handle AI returning array instead of object
                        try
                        {
                            using var textDoc = JsonDocument.Parse(cleanJson);
                            if (textDoc.RootElement.ValueKind == JsonValueKind.Array && textDoc.RootElement.GetArrayLength() > 0)
                            {
                                cleanJson = textDoc.RootElement.GetRawText();
                            }
                        }
                        catch { /* ignore parsing issues here */ }

                        // ✅ SAVE TO CACHE
                        _cache[cacheKey] = cleanJson;

                        return cleanJson;
                    }
                }
            }
            return null;
        }
        catch (HttpRequestException e)
        {
            Console.WriteLine($"❌ Request Error: {e.Message}");
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ PARSE ERROR: {ex.Message}");
            return null;
        }
    }

    // ==========================================
    // LOCAL RESILIENCY FALLBACKS
    // ==========================================
    private string GenerateRecruiterFallback(string jd, string resume)
    {
        var commonKeywords = new[] { 
            "C#", ".NET", "ASP.NET", "React", "Angular", "Vue", "Javascript", "Typescript", 
            "Python", "Java", "SQL", "SQL Server", "MySQL", "Postgres", "MongoDB", "NoSQL", 
            "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Agile", "Scrum", 
            "REST API", "GraphQL", "HTML", "CSS", "Tailwind", "Machine Learning", "AI", "Node.js"
        };

        var jdUpper = jd.ToUpper();
        var resumeUpper = resume.ToUpper();

        var jdKeywords = commonKeywords.Where(k => jdUpper.Contains(k.ToUpper())).ToList();
        if (!jdKeywords.Any())
        {
            jdKeywords = new List<string> { "Software Development", "Programming" };
        }

        var matchedSkills = jdKeywords.Where(k => resumeUpper.Contains(k.ToUpper())).ToList();
        var missingSkills = jdKeywords.Except(matchedSkills).ToList();

        int score = (int)Math.Round((double)matchedSkills.Count * 100 / jdKeywords.Count);
        score = Math.Clamp(score, 15, 95); // Ensure realistic range

        var result = new
        {
            matchPercentage = score,
            skills = matchedSkills,
            missingSkills = missingSkills,
            reason = $"Analyzed via local fallback engine. Found {matchedSkills.Count} matching skills. Missing core keywords: {string.Join(", ", missingSkills.Take(3))}."
        };

        return JsonSerializer.Serialize(result);
    }

    private string GenerateStudentFallback(string jd, string resume)
    {
        var commonKeywords = new[] { 
            "C#", ".NET", "ASP.NET", "React", "Angular", "Vue", "Javascript", "Typescript", 
            "Python", "Java", "SQL", "SQL Server", "MySQL", "Postgres", "MongoDB", "NoSQL", 
            "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Agile", "Scrum", 
            "REST API", "GraphQL", "HTML", "CSS", "Tailwind", "Machine Learning", "AI", "Node.js"
        };

        var jdUpper = jd.ToUpper();
        var resumeUpper = resume.ToUpper();

        var jdKeywords = commonKeywords.Where(k => jdUpper.Contains(k.ToUpper())).ToList();
        if (!jdKeywords.Any())
        {
            jdKeywords = new List<string> { "Software Development", "Communication", "Problem Solving" };
        }

        var matchedSkills = jdKeywords.Where(k => resumeUpper.Contains(k.ToUpper())).ToList();
        var missingSkills = jdKeywords.Except(matchedSkills).ToList();

        int score = (int)Math.Round((double)matchedSkills.Count * 100 / jdKeywords.Count);
        score = Math.Clamp(score, 20, 95);

        string status = score > 80 ? "Ready" : (score > 50 ? "Needs Improvement" : "Not Ready");

        var criticalMissing = missingSkills.Select(s => new
        {
            skillName = s,
            reason = $"Required for standard industry roles matching '{s}' demands in JD.",
            priority = "High"
        }).ToList();

        var strengths = matchedSkills.Take(3).Select(s => $"Strong foundation in {s}").ToList();
        if (!strengths.Any()) strengths.Add("General technical aptitude");

        var weaknesses = missingSkills.Take(2).Select(s => $"Lack of practical projects using {s}").ToList();
        if (!weaknesses.Any()) weaknesses.Add("Limited specialized tech stack experience");

        var interviewQuestions = missingSkills.Take(2).Select(s => $"Explain the core architecture of {s} and how you would integrate it into a project.").ToList();
        interviewQuestions.Add("Explain a complex problem you solved in your past projects.");

        var actionPlan = new List<object>
        {
            new { stepNumber = 1, task = $"Build a mini-project integrating {string.Join(", ", missingSkills.Take(2))}." },
            new { stepNumber = 2, task = "Refactor existing projects to use standard architecture." },
            new { stepNumber = 3, task = "Review conceptual questions on system design." },
            new { stepNumber = 4, task = "Publish your code to GitHub and update your resume." }
        };

        var learningRoadmap = new
        {
            phase = "Skills Acquisition",
            tasks = missingSkills.Select(s => $"Learn fundamentals of {s} and complete 2 practice exercises.").ToList()
        };

        var recommendedProject = new
        {
            title = $"Full-stack application using {string.Join(" and ", missingSkills.Take(2))}",
            description = "A real-world project demonstrating database setup, REST APIs, and client interface.",
            technologies = missingSkills.Take(3).ToList()
        };

        var result = new
        {
            matchScore = score,
            readinessStatus = status,
            matchedSkills = matchedSkills,
            gapAnalysis = new
            {
                criticalMissingSkills = criticalMissing
            },
            keyStrengths = strengths,
            resumeWeaknesses = weaknesses,
            interviewQuestions = interviewQuestions,
            actionPlan = actionPlan,
            learningRoadmap = learningRoadmap,
            recommendedProject = recommendedProject
        };

        return JsonSerializer.Serialize(result);
    }
}