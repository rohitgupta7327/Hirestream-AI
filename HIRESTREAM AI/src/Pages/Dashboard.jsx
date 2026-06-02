import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import "../index.css";
import { processRanking } from "../utils/rankingUtils";
import UploadSection from "../components/UploadSection";
import ResultsTable from "../components/ResultsTable";
import CandidateModal from "../components/CandidateModal";
import Navbar from "../Layout/Navbar";
import Sidebar from "../components/Sidebar";

export default function HireStreamPremiumUI() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);

  // Initialize state from sessionStorage
  const [jdText, setJdText] = useState(() => sessionStorage.getItem('recruiter_jdText') || "");
  const [weights, setWeights] = useState(() => {
    const saved = sessionStorage.getItem('recruiter_weights');
    return saved ? JSON.parse(saved) : { technical: 60, experience: 25, tools: 15 };
  });
  const [history, setHistory] = useState([]);
  const [results, setResults] = useState([]);
  
  const [autoEmail, setAutoEmail] = useState(() => {
    return localStorage.getItem('autoEmailRejections') === 'true';
  });
  const [autoEmailThreshold, setAutoEmailThreshold] = useState(() => {
    const saved = localStorage.getItem('autoEmailThreshold');
    return saved ? parseInt(saved) : 50;
  });

  useEffect(() => {
    localStorage.setItem('autoEmailRejections', autoEmail);
  }, [autoEmail]);

  useEffect(() => {
    localStorage.setItem('autoEmailThreshold', autoEmailThreshold);
  }, [autoEmailThreshold]);


  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(h => {
           const parsed = JSON.parse(h.resultJson);
           if (Array.isArray(parsed)) {
             return { isBatch: true, candidates: parsed, name: h.candidateName, historyId: h.id, scanDate: h.scanDate };
           }
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
      const res = await fetch(`${API_URL}/api/history/${id}`, {
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

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('recruiter_jdText', jdText);
  }, [jdText]);

  useEffect(() => {
    sessionStorage.setItem('recruiter_weights', JSON.stringify(weights));
  }, [weights]);

  // Removed sessionStorage for results as it's now DB-backed
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [rankChanges, setRankChanges] = useState({});

  const handleRejectCandidate = async (candidate) => {
    if (!candidate.email || candidate.email === "Not Found" || candidate.email === "Not found") {
      alert("Candidate email not found.");
      return;
    }

    // Update state to "sending"
    setResults(prev => prev.map(r => r.id === candidate.id ? { ...r, emailStatus: "sending" } : r));
    if (selectedCandidate && selectedCandidate.id === candidate.id) {
      setSelectedCandidate(prev => ({ ...prev, emailStatus: "sending" }));
    }

    try {
      const res = await fetch("http://localhost:5054/api/scan/reject-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          jobTitle: jdText || "Software Engineer",
          matchPercentage: candidate.matchPercentage,
          skills: candidate.skills,
          missingSkills: candidate.missingSkills,
          reason: candidate.reason
        })
      });

      if (res.ok) {
        setResults(prev => prev.map(r => r.id === candidate.id ? { ...r, emailStatus: "rejected" } : r));
        if (selectedCandidate && selectedCandidate.id === candidate.id) {
          setSelectedCandidate(prev => ({ ...prev, emailStatus: "rejected" }));
        }
      } else {
        setResults(prev => prev.map(r => r.id === candidate.id ? { ...r, emailStatus: "failed" } : r));
        if (selectedCandidate && selectedCandidate.id === candidate.id) {
          setSelectedCandidate(prev => ({ ...prev, emailStatus: "failed" }));
        }
      }
    } catch (err) {
      setResults(prev => prev.map(r => r.id === candidate.id ? { ...r, emailStatus: "failed" } : r));
      if (selectedCandidate && selectedCandidate.id === candidate.id) {
        setSelectedCandidate(prev => ({ ...prev, emailStatus: "failed" }));
      }
      console.error("Error sending rejection email:", err);
    }
  };

  const handleAcceptCandidate = async (candidate) => {
    if (!candidate.email || candidate.email === "Not Found" || candidate.email === "Not found") {
      alert("Candidate email not found.");
      return;
    }

    // Update state to "sending"
    setResults(prev => prev.map(r => r.id === candidate.id ? { ...r, emailStatus: "sending" } : r));
    if (selectedCandidate && selectedCandidate.id === candidate.id) {
      setSelectedCandidate(prev => ({ ...prev, emailStatus: "sending" }));
    }

    try {
      const res = await fetch("http://localhost:5054/api/scan/accept-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          jobTitle: jdText || "Software Engineer"
        })
      });

      if (res.ok) {
        setResults(prev => prev.map(r => r.id === candidate.id ? { ...r, emailStatus: "accepted" } : r));
        if (selectedCandidate && selectedCandidate.id === candidate.id) {
          setSelectedCandidate(prev => ({ ...prev, emailStatus: "accepted" }));
        }
      } else {
        setResults(prev => prev.map(r => r.id === candidate.id ? { ...r, emailStatus: "failed" } : r));
        if (selectedCandidate && selectedCandidate.id === candidate.id) {
          setSelectedCandidate(prev => ({ ...prev, emailStatus: "failed" }));
        }
      }
    } catch (err) {
      setResults(prev => prev.map(r => r.id === candidate.id ? { ...r, emailStatus: "failed" } : r));
      if (selectedCandidate && selectedCandidate.id === candidate.id) {
        setSelectedCandidate(prev => ({ ...prev, emailStatus: "failed" }));
      }
      console.error("Error sending acceptance email:", err);
    }
  };


  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const newFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleScan = async () => {
    if (!files.length || !jdText) {
      alert("Please upload resumes and add a job description.");
      return;
    }

    setLoading(true);

    try {
      // We will keep track of which files succeeded so we don't clear the ones that failed
      let filesProcessedSuccessfully = [];
      let batchCandidates = []; // Collect candidates for this batch

      // Process each file sequentially so they appear on the UI one-by-one in real-time
      for (const file of files) {
        let success = false;
        let retryCount = 0;

        while (!success && retryCount < 3) {
          const formData = new FormData();
          formData.append("resumes", file); 
          formData.append("jd", jdText);
          formData.append("technicalWeight", weights.technical);
          formData.append("experienceWeight", weights.experience);
          formData.append("toolsWeight", weights.tools);

          const res = await fetch("http://localhost:5054/api/scan", {
            method: "POST",
            body: formData,
          });

          if (res.status === 429 || res.status === 503) {
            retryCount++;
            if (retryCount >= 3) {
              alert(`High server demand. Skipping ${file.name}. You can try uploading it again later.`);
              break; // Give up on this specific file after 3 tries
            }
            // Silent wait for 10 seconds before automatically retrying
            await new Promise((resolve) => setTimeout(resolve, 10000));
            continue; // Loop back and try this file again!
          }

          if (!res.ok) {
             console.error("Backend error for file", file.name);
             break;
          }

          const data = await res.json();

          // 1. Normalize data IMMEDIATELY
          const incomingArr = Array.isArray(data) ? data : [data];

          // --- FILTER HERE TO REMOVE EMPTY/GHOST ROWS ---
          const filteredIncoming = incomingArr.filter(
            (c) => (c.name || c.Name) && (c.email || c.Email),
          );

          if (filteredIncoming.length > 0) {
             const newData = filteredIncoming.map((c) => {
               // Handle PascalCase vs camelCase from backend
               const name = c.name ?? c.Name ?? "Unknown Candidate";
               const email = c.email ?? c.Email ?? "Not Found";
               const score = parseInt(c.matchPercentage ?? c.MatchPercentage ?? 0);

               return {
                 // Create a truly unique ID for React keys
                 id: `${email}-${name}-${Math.random().toString(36).substr(2, 9)}`,
                 name: name,
                 email: email,
                 matchPercentage: score,
                 skills: c.matchedSkills ?? c.MatchedSkills ?? c.skills ?? [],
                 missingSkills: c.missingSkills ?? c.MissingSkills ?? [],
                 reason: c.reason ?? c.Reason ?? "No reason provided.",
               };
             });

             batchCandidates.push(...newData);

             // 2. Update state with a clean merge
             setResults((prev) => {
               const cleanPrev = prev.filter(
                 (p) => p.name && p.name !== "Unknown Candidate",
               );
               const combined = [...cleanPrev, ...newData];

               const unique = combined.filter(
                 (item, index, self) =>
                   index ===
                   self.findIndex(
                     (t) => t.email === item.email && t.name === item.name,
                   ),
               );

               // Final Sort: Ensure highest scores are at the top
               return unique.sort((a, b) => b.matchPercentage - a.matchPercentage);
             });
          }

          success = true;
          filesProcessedSuccessfully.push(file);
        }
      }

      // --- AUTO-EMAIL REJECTIONS ---
      if (autoEmail && batchCandidates.length > 0) {
        batchCandidates.forEach(c => {
          if (c.matchPercentage < autoEmailThreshold && c.email && c.email !== "Not Found" && c.email !== "Not found") {
            handleRejectCandidate(c);
          }
        });
      }

      // --- SAVE BATCH TO DB ---
      if (batchCandidates.length > 0) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            await fetch("http://localhost:5054/api/history", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                candidateName: `Batch Scan (${batchCandidates.length} Candidates)`,
                candidateEmail: "batch@hirestream.com",
                matchPercentage: 0,
                resultJson: JSON.stringify(batchCandidates)
              })
            });
            // Refresh history to update sidebar
            setTimeout(() => fetchHistory(), 500);
          } catch (err) {
            console.error("Failed to save batch history:", err);
          }
        }
      }

      // ONLY clear files from the UI that were successfully processed!
      // If a file failed 3 times, it will safely remain in the staging area for the user to try again.
      setFiles((prevFiles) => prevFiles.filter((f) => !filesProcessedSuccessfully.includes(f)));
    } catch (err) {
      console.error("Extraction error:", err);
      alert("Backend error processing candidate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-white">
      {/* Navbar sits at the very top (fixed) */}
      <Navbar />

      <Sidebar 
        history={history} 
        onNewScan={() => {
          setFiles([]);
          setJdText("");
          setResults([]);
        }}
        onHistoryClick={(item) => {
          if (item.isBatch && item.candidates) {
            setResults(item.candidates);
          } else {
            // Fallback for older single records
            setResults([item]);
          }
        }}
        onDeleteClick={handleDeleteHistory}
        role="recruiter"
      />

      {/* Main Content Container */}
      <main className="flex-1 overflow-y-auto pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto mb-6 px-8 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Recruiter Workspace</h1>
            <p className="text-gray-400 mt-2">Upload multiple candidate resumes and a Job Description to get AI rankings.</p>
          </div>
          {results.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all generated results?")) {
                  setResults([]);
                  sessionStorage.removeItem('recruiter_results');
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
        <div className="max-w-6xl mx-auto space-y-10">

          {/* 1. Upload Section (Wrapped in a div for better spacing control) */}
          <section>
            <UploadSection
              files={files}
              setFiles={setFiles}
              handleDrop={handleDrop}
              handleFileUpload={handleFileUpload}
              jdText={jdText}
              setJdText={setJdText}
              weights={weights}
              setWeights={setWeights}
              handleScan={handleScan}
              loading={loading}
              autoEmail={autoEmail}
              setAutoEmail={setAutoEmail}
              autoEmailThreshold={autoEmailThreshold}
              setAutoEmailThreshold={setAutoEmailThreshold}
            />
          </section>

          {/* 2. Results Section */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ResultsTable
                  results={results}
                  setSelectedCandidate={setSelectedCandidate}
                  rejectCandidate={handleRejectCandidate}
                  acceptCandidate={handleAcceptCandidate}
                />
              </motion.section>
            )}
          </AnimatePresence>

          {/* 3. Modal Layer */}
          <AnimatePresence>
            {selectedCandidate && (
              <CandidateModal
                selectedCandidate={selectedCandidate}
                setSelectedCandidate={setSelectedCandidate}
                rejectCandidate={handleRejectCandidate}
                acceptCandidate={handleAcceptCandidate}
              />
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
