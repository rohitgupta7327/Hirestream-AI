using System;
using System.IO;
using System.Collections.Generic;
using PdfSharpCore.Pdf;
using PdfSharpCore.Drawing;

namespace HirestreamAI_Backend.Services
{
    public interface IPdfRoadmapService
    {
        byte[] GenerateRoadmapPdf(string candidateName, string jobTitle, double matchPercentage, List<string> skills, List<string> missingSkills, string reason);
    }

    public class PdfRoadmapService : IPdfRoadmapService
    {
        public byte[] GenerateRoadmapPdf(string candidateName, string jobTitle, double matchPercentage, List<string> skills, List<string> missingSkills, string reason)
        {
            using (var ms = new MemoryStream())
            {
                // Create document
                var document = new PdfDocument();
                document.Info.Title = $"HireStream AI Career Roadmap - {candidateName}";
                document.Info.Author = "HireStream AI";

                // Add page (A4)
                var page = document.AddPage();
                page.Size = PdfSharpCore.PageSize.A4;
                
                var gfx = XGraphics.FromPdfPage(page);

                // Define Styles & Colors
                var colorPrimary = XColor.FromArgb(30, 58, 138);     // Deep Blue
                var colorSecondary = XColor.FromArgb(14, 116, 144);  // Teal
                var colorBackground = XColor.FromArgb(248, 250, 252); // Off-White Slate 50
                var colorTextDark = XColor.FromArgb(15, 23, 42);     // Slate 900
                var colorTextMuted = XColor.FromArgb(71, 85, 105);   // Slate 600
                var colorBorder = XColor.FromArgb(226, 232, 240);    // Slate 200
                var colorGreen = XColor.FromArgb(22, 163, 74);      // Green 600
                var colorRed = XColor.FromArgb(220, 38, 38);        // Red 600

                var fontTitle = new XFont("Helvetica", 20, XFontStyle.Bold);
                var fontSubtitle = new XFont("Helvetica", 11, XFontStyle.Italic);
                var fontHeader = new XFont("Helvetica", 14, XFontStyle.Bold);
                var fontSubHeader = new XFont("Helvetica", 12, XFontStyle.Bold);
                var fontBody = new XFont("Helvetica", 10, XFontStyle.Regular);
                var fontBodyBold = new XFont("Helvetica", 10, XFontStyle.Bold);
                var fontFooter = new XFont("Helvetica", 8, XFontStyle.Regular);

                double currentY = 40;
                double margin = 40;
                double pageWidth = page.Width.Point - (margin * 2);

                // 1. Draw Title Header Banner
                gfx.DrawRectangle(new XSolidBrush(colorPrimary), margin, currentY, pageWidth, 55);
                gfx.DrawString("HIRESTREAM AI", fontTitle, XBrushes.White, new XRect(margin + 20, currentY + 12, pageWidth - 40, 30), XStringFormats.TopLeft);
                gfx.DrawString("Personalized Career Roadmap & Feedback Report", fontSubtitle, XBrushes.LightGray, new XRect(margin + 20, currentY + 36, pageWidth - 40, 20), XStringFormats.TopLeft);
                currentY += 75;

                // 2. Candidate Metadata Grid
                gfx.DrawRectangle(new XSolidBrush(colorBackground), margin, currentY, pageWidth, 60);
                gfx.DrawRectangle(new XPen(colorBorder), margin, currentY, pageWidth, 60);

                gfx.DrawString("CANDIDATE DETAILS", fontSubHeader, new XSolidBrush(colorSecondary), margin + 15, currentY + 12);
                gfx.DrawString($"Name: {candidateName}", fontBodyBold, new XSolidBrush(colorTextDark), margin + 15, currentY + 32);
                gfx.DrawString($"Target Role: {jobTitle}", fontBodyBold, new XSolidBrush(colorTextDark), margin + 15, currentY + 46);

                // Draw Match Score Badge
                double badgeX = page.Width.Point - margin - 120;
                gfx.DrawRectangle(new XSolidBrush(XColor.FromArgb(239, 246, 255)), badgeX, currentY + 10, 105, 40);
                gfx.DrawRectangle(new XPen(XColor.FromArgb(191, 219, 254)), badgeX, currentY + 10, 105, 40);
                gfx.DrawString("MATCH SCORE", fontFooter, new XSolidBrush(colorTextMuted), badgeX + 20, currentY + 16);
                var scoreBrush = matchPercentage >= 70 ? new XSolidBrush(colorGreen) : (matchPercentage >= 50 ? new XSolidBrush(colorSecondary) : new XSolidBrush(colorRed));
                gfx.DrawString($"{matchPercentage}%", fontHeader, scoreBrush, badgeX + 32, currentY + 26);

                currentY += 80;

                // 3. AI Feedback / Match Summary Section
                gfx.DrawString("AI MATCH FEEDBACK", fontHeader, new XSolidBrush(colorPrimary), margin, currentY);
                gfx.DrawLine(new XPen(colorBorder, 1.5), margin, currentY + 6, page.Width.Point - margin, currentY + 6);
                currentY += 16;

                var wrappedFeedback = WrapText(gfx, reason, pageWidth, fontBody);
                foreach (var line in wrappedFeedback)
                {
                    gfx.DrawString(line, fontBody, new XSolidBrush(colorTextDark), margin, currentY);
                    currentY += 15;
                }
                currentY += 15;

                // 4. Strengths & Gaps Two-Column
                double colWidth = (pageWidth - 20) / 2;
                double col1X = margin;
                double col2X = margin + colWidth + 20;
                double listStartY = currentY;

                // Strengths Column
                gfx.DrawString("KEY STRENGTHS", fontSubHeader, new XSolidBrush(colorGreen), col1X, listStartY);
                gfx.DrawLine(new XPen(colorBorder), col1X, listStartY + 4, col1X + colWidth, listStartY + 4);
                double strengthsY = listStartY + 16;
                if (skills != null && skills.Count > 0)
                {
                    foreach (var skill in skills)
                    {
                        gfx.DrawString($"✔  {skill}", fontBody, new XSolidBrush(colorTextDark), col1X, strengthsY);
                        strengthsY += 16;
                    }
                }
                else
                {
                    gfx.DrawString("No matching keywords identified.", fontSubtitle, new XSolidBrush(colorTextMuted), col1X, strengthsY);
                    strengthsY += 16;
                }

                // Gaps Column
                gfx.DrawString("CRITICAL MISSING SKILLS", fontSubHeader, new XSolidBrush(colorRed), col2X, listStartY);
                gfx.DrawLine(new XPen(colorBorder), col2X, listStartY + 4, col2X + colWidth, listStartY + 4);
                double gapsY = listStartY + 16;
                if (missingSkills != null && missingSkills.Count > 0)
                {
                    foreach (var skill in missingSkills)
                    {
                        gfx.DrawString($"✘  {skill}", fontBody, new XSolidBrush(colorTextDark), col2X, gapsY);
                        gapsY += 16;
                    }
                }
                else
                {
                    gfx.DrawString("All primary skills match! Nice.", fontSubtitle, new XSolidBrush(colorGreen), col2X, gapsY);
                    gapsY += 16;
                }

                currentY = Math.Max(strengthsY, gapsY) + 20;

                // 5. Tailored Action Roadmap (Check if we have space, otherwise add page - but for a typical roadmap it fits)
                if (currentY > page.Height.Point - 150)
                {
                    page = document.AddPage();
                    page.Size = PdfSharpCore.PageSize.A4;
                    gfx = XGraphics.FromPdfPage(page);
                    currentY = 40;
                }

                gfx.DrawString("ACTIONABLE LEARNING ROADMAP", fontHeader, new XSolidBrush(colorPrimary), margin, currentY);
                gfx.DrawLine(new XPen(colorBorder, 1.5), margin, currentY + 6, page.Width.Point - margin, currentY + 6);
                currentY += 22;

                if (missingSkills != null && missingSkills.Count > 0)
                {
                    int step = 1;
                    foreach (var skill in missingSkills)
                    {
                        if (currentY > page.Height.Point - 80)
                        {
                            page = document.AddPage();
                            page.Size = PdfSharpCore.PageSize.A4;
                            gfx = XGraphics.FromPdfPage(page);
                            currentY = 40;
                        }

                        gfx.DrawRectangle(new XSolidBrush(colorBackground), margin, currentY, pageWidth, 40);
                        gfx.DrawRectangle(new XPen(colorBorder), margin, currentY, pageWidth, 40);

                        gfx.DrawString($"Step {step}: Bridge your gap in '{skill}'", fontBodyBold, new XSolidBrush(colorSecondary), margin + 15, currentY + 14);
                        gfx.DrawString($"Recommended Action: Complete a structured tutorial on {skill}, build a small prototype project, and test your understanding.", fontBody, new XSolidBrush(colorTextMuted), margin + 15, currentY + 28);
                        
                        currentY += 48;
                        step++;
                    }
                }
                else
                {
                    gfx.DrawString("Outstanding job! Your skills are well aligned. We recommend focusing on practical system design, interview preparation, and full-stack projects.", fontBody, new XSolidBrush(colorTextDark), margin, currentY);
                    currentY += 20;
                }

                // Footer
                gfx.DrawLine(new XPen(colorBorder), margin, page.Height.Point - 45, page.Width.Point - margin, page.Height.Point - 45);
                gfx.DrawString("Generated automatically by HireStream AI. Help yourself grow with structured feedback.", fontFooter, new XSolidBrush(colorTextMuted), margin, page.Height.Point - 35);
                gfx.DrawString("Page 1 of 1", fontFooter, new XSolidBrush(colorTextMuted), page.Width.Point - margin - 50, page.Height.Point - 35);

                // Save to stream
                document.Save(ms);
                return ms.ToArray();
            }
        }

        // Helper to wrap text for PDFSharp drawing
        private List<string> WrapText(XGraphics gfx, string text, double maxWidth, XFont font)
        {
            var words = text.Split(' ');
            var lines = new List<string>();
            var currentLine = "";

            foreach (var word in words)
            {
                var testLine = string.IsNullOrEmpty(currentLine) ? word : $"{currentLine} {word}";
                var size = gfx.MeasureString(testLine, font);

                if (size.Width > maxWidth)
                {
                    lines.Add(currentLine);
                    currentLine = word;
                }
                else
                {
                    currentLine = testLine;
                }
            }

            if (!string.IsNullOrEmpty(currentLine))
            {
                lines.Add(currentLine);
            }

            return lines;
        }
    }
}
