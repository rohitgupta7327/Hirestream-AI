import React, { useState, useEffect } from 'react';
import Navbar from '../Layout/Navbar';
import StudentComponent from '../components/Studentcomponent.jsx';
import Sidebar from '../components/Sidebar';

const StudentDashboard = () => {
  const [files, setFiles] = useState([]);

  // Initialize state from sessionStorage
  const [jdText, setJdText] = useState(() => sessionStorage.getItem('student_jdText') || '');
  const [history, setHistory] = useState([]);
  const [results, setResults] = useState([]);

  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5054/api/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(h => {
           const parsed = JSON.parse(h.resultJson);
           return { ...parsed, historyId: h.id, scanDate: h.scanDate };
        });
        setHistory(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleDeleteHistory = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5054/api/history/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setHistory(prev => prev.filter(h => h.historyId !== id));
      } else {
        alert("Failed to delete history from server.");
      }
    } catch (err) {
      console.error("Failed to delete history:", err);
      alert("Error deleting history.");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('student_jdText', jdText);
  }, [jdText]);

  // Removed sessionStorage for results as it's now DB-backed

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(newFiles); // Replace instead of append for students
  };


  const handleDrop = (e) => {
    e.preventDefault();
    const newFiles = Array.from(e.dataTransfer.files);
    setFiles(newFiles); // Replace instead of append for students
  };

  const handleScan = async () => {
    if (!files.length || !jdText) {
      alert("Please upload resumes and add a job description.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("resumes", file));
    formData.append("jd", jdText);

    try {
      const res = await fetch("http://localhost:5054/api/scan/student", {
        method: "POST",
        body: formData,
      });

      if (res.status === 429) {
        const msg = "Rate limit reached. Please wait.";
        setError(msg);
        alert(msg);
        return;
      }

      if (!res.ok) {
        const msg = `Failed to scan resumes (HTTP ${res.status}).`;
        setError(msg);
        alert(msg);
        return;
      }

      const data = await res.json();

      const incomingArr = Array.isArray(data) ? data : [data];

      const normalized = incomingArr
        .filter((c) => (c?.name || c?.Name) && (c?.email || c?.Email))
        .map((c) => {
          const name = c.name ?? c.Name ?? "Unknown Candidate";
          const email = c.email ?? c.Email ?? "Not Found";
          const matchPercentage = parseInt(
            c.matchScore ?? c.MatchScore ?? 0,
            10,
          );

          return {
            id: `${email}-${name}-${Math.random().toString(36).slice(2)}`,
            name,
            email,
            matchPercentage: Number.isFinite(matchPercentage) ? matchPercentage : 0,
            readinessStatus: c.readinessStatus ?? c.ReadinessStatus ?? "Unknown",
            skills: c.matchedSkills ?? c.MatchedSkills ?? [],
            missingSkills: c.gapAnalysis?.criticalMissingSkills ?? c.GapAnalysis?.CriticalMissingSkills ?? [],
            keyStrengths: c.keyStrengths ?? c.KeyStrengths ?? [],
            resumeWeaknesses: c.resumeWeaknesses ?? c.ResumeWeaknesses ?? [],
            interviewQuestions: c.interviewQuestions ?? c.InterviewQuestions ?? [],
            actionPlan: c.actionPlan ?? c.ActionPlan ?? [],
            learningRoadmap: c.learningRoadmap ?? c.LearningRoadmap ?? { phase: "Pending", tasks: [] },
            recommendedProject: c.recommendedProject ?? c.RecommendedProject ?? { title: "N/A", description: "", technologies: [] },
          };
        })
        .sort((a, b) => b.matchPercentage - a.matchPercentage);

      // --- SAVE TO DB ---
      const token = localStorage.getItem("token");
      if (token) {
        normalized.forEach(async (c) => {
          try {
            await fetch("http://localhost:5054/api/history", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                candidateName: c.name,
                candidateEmail: c.email,
                matchPercentage: c.matchPercentage,
                resultJson: JSON.stringify(c)
              })
            });
          } catch (err) {
            console.error("Failed to save history:", err);
          }
        });
        // Refresh history to update sidebar
        setTimeout(() => fetchHistory(), 500);
      }

      setResults(normalized);
      setFiles([]);
    } catch (err) {
      console.error("Scan error:", err);
      const msg = "Error analyzing resume. Try again.";
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-textPrimary font-sans antialiased">
      <Navbar />
      
      <Sidebar 
        history={history} 
        onNewScan={() => {
          setFiles([]);
          setJdText("");
          setResults([]);
        }}
        onHistoryClick={(item) => setResults([item])}
        onDeleteClick={handleDeleteHistory}
        role="student"
      />

      <main className="flex-1 overflow-y-auto pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto mb-6 px-8 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Student Career Dashboard</h1>
            <p className="text-gray-400 mt-2">Upload your resume to get AI-driven career coaching, gap analysis, and interview prep.</p>
          </div>
          {results.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all generated results?")) {
                  setResults([]);
                  sessionStorage.removeItem('student_results');
                }
              }}
              className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all duration-300 flex items-center gap-2"
              title="Clear all results"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear Data
            </button>
          )}
        </div>

        {error && (
          <div className="max-w-6xl mx-auto px-8 mt-4">
            <div className="bg-red-500/15 border border-red-500/30 text-red-200 rounded-lg p-3 text-sm">
              {error}
            </div>
          </div>
        )}

        <StudentComponent
          files={files}
          handleDrop={handleDrop}
          handleFileUpload={handleFileUpload}
          jdText={jdText}
          setJdText={setJdText}
          handleScan={handleScan}
          loading={loading}
          results={results}
        />
      </main>
    </div>
  );
};

export default StudentDashboard;


