using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HirestreamAI_Backend.Models
{
    public class ScanHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required, StringLength(100)]
        public string CandidateName { get; set; } = string.Empty;

        [Required, StringLength(200)]
        public string CandidateEmail { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string Role { get; set; } = string.Empty; // e.g. "recruiter" or "student"

        [Required]
        public int MatchPercentage { get; set; }

        // We will store the full AI Result object as a JSON string to keep it flexible
        public string ResultJson { get; set; } = string.Empty;

        public DateTime ScanDate { get; set; } = DateTime.UtcNow;
    }
}
