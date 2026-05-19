using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;
using UglyToad.PdfPig;
using DocumentFormat.OpenXml.Packaging;
using Tesseract;
using ImageMagick;

namespace HirestreamAI_Backend.Services
{
    public class ResumeParser
    {
        public string ExtractText(IFormFile file)
        {
            if (file == null || file.Length == 0) return string.Empty;

            var extension = Path.GetExtension(file.FileName).ToLower();

            try
            {
                string result = string.Empty;

                // We open the stream ONCE and pass it to the specific extractors
                using (var stream = file.OpenReadStream())
                {
                    if (stream.CanSeek) stream.Position = 0;

                    result = extension switch
                    {
                        ".pdf" => ExtractFromPdf(stream), // Pass the stream, not the file
                        ".docx" => ExtractFromDocx(stream),
                        ".txt" => ExtractFromTxt(stream),
                        ".png" or ".jpg" or ".jpeg" or ".webp" => ExtractUsingOCR(stream),
                        _ => string.Empty
                    };
                }

                // Compress horizontal whitespace but PRESERVE newlines so we can extract the first line as the name
                result = Regex.Replace(result, @"[^\S\r\n]+", " ");
                result = Regex.Replace(result, @"[\r\n]+", "\n").Trim();

                Console.WriteLine("=== FINAL EXTRACTED TEXT ===");
                Console.WriteLine(string.IsNullOrWhiteSpace(result) ? "EMPTY" : "Text Extracted Successfully");

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error extracting text: {ex.Message}");
                return string.Empty;
            }
        }

        private string ExtractFromPdf(Stream stream)
        {
            var sb = new StringBuilder();
            try
            {
                using (var pdf = PdfDocument.Open(stream))
                {
                    foreach (var page in pdf.GetPages())
                    {
                        var pageText = UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor.ContentOrderTextExtractor.GetText(page);
                        sb.AppendLine(pageText);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ PdfPig failed: {ex.Message}");
            }

            var text = sb.ToString().Trim();

            // If the PDF is a scanned image, it will be empty or very short
            if (string.IsNullOrWhiteSpace(text) || text.Length < 50)
            {
                Console.WriteLine("⚠️ PDF empty or unreadable → switching to OCR...");
                // Reset stream position before OCR
                if (stream.CanSeek) stream.Position = 0;
                return ExtractUsingOCR(stream);
            }

            return text;
        }

        private string ExtractUsingOCR(Stream stream)
        {
            var sb = new StringBuilder();
            try
            {
                string tessDataPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "tessdata");

                var settings = new MagickReadSettings
                {
                    Density = new Density(300, 300, DensityUnit.PixelsPerInch)
                };

                using (var images = new MagickImageCollection())
                {
                    images.Read(stream, settings);

                    using (var engine = new TesseractEngine(tessDataPath, "eng", EngineMode.Default))
                    {
                        foreach (var image in images)
                        {
                            image.Format = MagickFormat.Png;
                            byte[] pngBytes = image.ToByteArray();

                            using (var img = Pix.LoadFromMemory(pngBytes))
                            using (var page = engine.Process(img))
                            {
                                sb.AppendLine(page.GetText());
                            }
                        }
                    }
                }
                return sb.ToString();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ OCR Critical Error: {ex.Message}");
                return string.Empty;
            }
        }

        private string ExtractFromDocx(Stream stream)
        {
            try
            {
                using var doc = WordprocessingDocument.Open(stream, false);
                var body = doc.MainDocumentPart?.Document?.Body;
                return body?.InnerText ?? string.Empty;
            }
            catch { return string.Empty; }
        }

        private string ExtractFromTxt(Stream stream)
        {
            try
            {
                using var reader = new StreamReader(stream);
                return reader.ReadToEnd();
            }
            catch { return string.Empty; }
        }

        public string ExtractEmail(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return "Not Found";
            var match = Regex.Match(text, @"[\w\.-]+@[\w\.-]+\.[a-z]{2,}");
            return match.Success ? match.Value : "Not Found";

        }
        public string ExtractName(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return "Unknown Candidate";

            var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);

            // Assume first meaningful line is name
            return lines.Length > 0 ? lines[0].Trim() : "Unknown Candidate";
        }

        public string CompressResumeText(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return text;

            // 0. Remove irrelevant personal details (DOB, Hobbies, Address, etc.)
            var personalInfoPatterns = new[]
            {
                @"(?i)(date of birth|dob|born on)\s*[:\-]?\s*[\d]{1,2}[a-zA-Z/\-\. ]+[\d]{2,4}", // e.g., Date of Birth: 12/04/1998 or 12 Jan 1998
                @"(?i)(hobbies|interests|leisure)\s*[:\-]?\s*.*?(?=\n|$)", // e.g., Hobbies: Reading, Cricket
                @"(?i)(marital status|religion|nationality|gender|blood group|passport)\s*[:\-]?\s*.*?(?=\n|$)",
                @"(?i)(father'?s name|mother'?s name|parent'?s name)\s*[:\-]?\s*.*?(?=\n|$)",
                @"(?i)(address|permanent address|current address)\s*[:\-]?\s*.*?(?=\n|$)"
            };

            foreach (var pattern in personalInfoPatterns)
            {
                text = Regex.Replace(text, pattern, " ", RegexOptions.IgnoreCase | RegexOptions.Multiline);
            }

            // 1. Remove URLs
            text = Regex.Replace(text, @"(http|https|ftp|www)\://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(:[a-zA-Z0-9]*)?/?([a-zA-Z0-9\-\._\?\,\'/\\\+&amp;%\$#\=~])*", "");

            // 2. Remove common English Stop-Words
            var stopWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase) 
            { 
                "the", "is", "at", "which", "on", "and", "a", "an", "to", "in", "of", "for", "with", "about" 
            };
            
            var words = text.Split(new[] { ' ', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries)
                            .Where(w => !stopWords.Contains(w));

            text = string.Join(" ", words);

            // 3. Remove non-ASCII characters
            text = Regex.Replace(text, @"[^\u0000-\u007F]+", " ");

            // 4. Maximum length cutoff
            if (text.Length > 6000)
            {
                text = text.Substring(0, 6000);
            }

            return text.Trim();
        }
    }
}