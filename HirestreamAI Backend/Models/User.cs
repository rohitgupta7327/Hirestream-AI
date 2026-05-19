using System;
using System.ComponentModel.DataAnnotations;

namespace HirestreamAI_Backend.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required, StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(200)]
        public string Email { get; set; } = string.Empty;

        // store hashed password only
        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = "student";

        public string? Organization { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
