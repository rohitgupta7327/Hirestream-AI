using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Configuration;

namespace HirestreamAI_Backend.Services
{
    public interface IEmailService
    {
        Task SendRejectionEmailAsync(string candidateName, string candidateEmail, string jobTitle, byte[] pdfAttachment, string attachmentFileName);
        Task SendAcceptanceEmailAsync(string candidateName, string candidateEmail, string jobTitle);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendRejectionEmailAsync(string candidateName, string candidateEmail, string jobTitle, byte[] pdfAttachment, string attachmentFileName)
        {
            var smtpServer = _configuration["Smtp:Server"] ?? "localhost";
            var smtpPort = int.TryParse(_configuration["Smtp:Port"], out var port) ? port : 587;
            var senderName = _configuration["Smtp:SenderName"] ?? "HireStream AI";
            var senderEmail = _configuration["Smtp:SenderEmail"] ?? "noreply@hirestream.ai";
            var username = _configuration["Smtp:Username"] ?? "";
            var password = _configuration["Smtp:Password"] ?? "";
            var enableSsl = bool.TryParse(_configuration["Smtp:EnableSsl"], out var ssl) ? ssl : true;

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress(candidateName, candidateEmail));
            message.Subject = $"Update on your application for {jobTitle} - HireStream AI Career Roadmap";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                <div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1a202c;"">
                    <div style=""text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;"">
                        <h1 style=""color: #3b82f6; margin: 0; font-size: 24px;"">HireStream AI</h1>
                        <p style=""color: #718096; margin: 5px 0 0 0; font-size: 14px;"">Smart Recruitment & Feedback</p>
                    </div>
                    
                    <p>Dear <strong>{candidateName}</strong>,</p>
                    
                    <p>Thank you for taking the time to apply for the position of <strong>{jobTitle}</strong>. We appreciate your interest in joining our team and the effort you put into your application and resume.</p>
                    
                    <p>After careful review of your qualifications and experience against the requirements of the role, we regret to inform you that we will not be moving forward with your application at this time.</p>
                    
                    <div style=""background-color: #f7fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;"">
                        <h3 style=""margin-top: 0; color: #2d3748;"">Your Career Development Roadmap 🚀</h3>
                        <p style=""margin-bottom: 0;"">At HireStream AI, we believe every application should be an opportunity to grow. We have generated a <strong>personalized PDF Career Development Roadmap</strong> based on our analysis of your resume and the job description. It is attached to this email.</p>
                    </div>
                    
                    <p>The attached roadmap highlights:</p>
                    <ul>
                        <li><strong>Your Key Strengths</strong> that aligned well with the job.</li>
                        <li><strong>Skill Gaps</strong> that you can work on.</li>
                        <li><strong>An Actionable Learning Path</strong> with structured steps to help you bridge those gaps.</li>
                    </ul>
                    
                    <p>We wish you the very best of luck in your job search and all your future professional endeavors.</p>
                    
                    <hr style=""border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;"" />
                    
                    <p style=""font-size: 12px; color: #a0aec0; text-align: center;"">
                        This is an automated feedback message sent by HireStream AI on behalf of the recruitment team.<br />
                        Please do not reply directly to this email.
                    </p>
                </div>"
            };

            // Attach PDF
            if (pdfAttachment != null && pdfAttachment.Length > 0)
            {
                bodyBuilder.Attachments.Add(attachmentFileName, pdfAttachment, ContentType.Parse("application/pdf"));
            }

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            // In case of SSL vs TLS vs StartTLS settings
            await client.ConnectAsync(smtpServer, smtpPort, enableSsl ? MailKit.Security.SecureSocketOptions.StartTlsWhenAvailable : MailKit.Security.SecureSocketOptions.None);
            
            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
            {
                await client.AuthenticateAsync(username, password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }

        public async Task SendAcceptanceEmailAsync(string candidateName, string candidateEmail, string jobTitle)
        {
            var smtpServer = _configuration["Smtp:Server"] ?? "localhost";
            var smtpPort = int.TryParse(_configuration["Smtp:Port"], out var port) ? port : 587;
            var senderName = _configuration["Smtp:SenderName"] ?? "HireStream AI";
            var senderEmail = _configuration["Smtp:SenderEmail"] ?? "noreply@hirestream.ai";
            var username = _configuration["Smtp:Username"] ?? "";
            var password = _configuration["Smtp:Password"] ?? "";
            var enableSsl = bool.TryParse(_configuration["Smtp:EnableSsl"], out var ssl) ? ssl : true;

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress(candidateName, candidateEmail));
            message.Subject = $"Good news regarding your application for {jobTitle} - HireStream AI";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                <div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1a202c;"">
                    <div style=""text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;"">
                        <h1 style=""color: #10b981; margin: 0; font-size: 24px;"">HireStream AI</h1>
                        <p style=""color: #718096; margin: 5px 0 0 0; font-size: 14px;"">Application Status Update</p>
                    </div>
                    
                    <p>Dear <strong>{candidateName}</strong>,</p>
                    
                    <p>We have fantastic news! After reviewing your application and resume against the requirements for the <strong>{jobTitle}</strong> position, our hiring team has selected you to proceed to the next stage of our recruitment process.</p>
                    
                    <p>Your qualifications and skills matched our criteria extremely well, and we are excited to learn more about you.</p>
                    
                    <div style=""background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;"">
                        <h3 style=""margin-top: 0; color: #065f46;"">Next Steps 🗓</h3>
                        <p>Our recruitment coordinator will contact you shortly to schedule an initial interview. Please keep an eye on your inbox and spam folder.</p>
                        <p style=""margin-bottom: 0;"">In the meantime, feel free to review the job requirements and prepare any questions you might have for us.</p>
                    </div>
                    
                    <p>Congratulations once again, and we look forward to speaking with you soon!</p>
                    
                    <p>Best regards,</p>
                    <p><strong>The Recruitment Team</strong><br />HireStream AI Partners</p>
                    
                    <hr style=""border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;"" />
                    
                    <p style=""font-size: 12px; color: #a0aec0; text-align: center;"">
                        This message was sent by HireStream AI on behalf of the recruitment team.<br />
                        Please do not reply directly to this email.
                    </p>
                </div>"
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, smtpPort, enableSsl ? MailKit.Security.SecureSocketOptions.StartTlsWhenAvailable : MailKit.Security.SecureSocketOptions.None);
            
            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
            {
                await client.AuthenticateAsync(username, password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}
