using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace HirestreamAI_Backend.Models
{
    public class AIResult
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "Unknown Candidate";

        [JsonPropertyName("email")]
        public string Email { get; set; } = "Not Found";

        [JsonPropertyName("matchPercentage")]
        public int MatchPercentage { get; set; }

        [JsonPropertyName("skills")]
        public List<string> Skills { get; set; } = new();

        /// <summary>
        /// Compatibility wrapper for AI responses using "matchedSkills"
        /// Maps directly to the Skills property.
        /// </summary>
        [JsonPropertyName("matchedSkills")]
        public List<string> MatchedSkills
        {
            get => Skills;
            set => Skills = value;
        }

        [JsonPropertyName("missingSkills")]
        public List<string> MissingSkills { get; set; } = new();

        [JsonPropertyName("reason")]
        public string Reason { get; set; } = "";
    }
}