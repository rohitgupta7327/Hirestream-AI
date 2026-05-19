import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../index.css";

// Animated Premium Button
const GlowingButton = ({ children, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`group relative px-8 py-4 rounded-xl font-bold text-white overflow-hidden transition-all duration-300 bg-blue-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:scale-105 transition-transform duration-300"></div>
    <span className="relative flex items-center justify-center gap-2">
      {children}
    </span>
  </button>
);

export default function LandingPage() {
  const navigate = useNavigate();

  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  const role = localStorage.getItem("role");

  const handleGetStarted = () => {
    const token = localStorage.getItem("token");

    if (isLoggedIn && token && role) {
      if (role === "recruiter") {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/student-dashboard";
      }
    } else {
      window.location.href = "/auth";
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden relative selection:bg-blue-500/30">

      {/* Dynamic Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Navbar */}
      <nav className="relative z-50 flex justify-between items-center px-6 md:px-16 py-6 border-b border-white/5 bg-[#020617]/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">HireStream<span className="text-blue-500">AI</span></h1>
        </div>
        
        {isLoggedIn ? (
          <button 
            onClick={handleGetStarted} 
            className="flex items-center gap-2 text-sm font-semibold bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-5 py-2.5 rounded-lg transition-all text-blue-400"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            Go to Dashboard
          </button>
        ) : (
          <button 
            onClick={() => window.location.href = "/auth"} 
            className="text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-lg transition-all"
          >
            Sign In
          </button>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 py-32 text-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >

          <h1 className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tighter leading-tight">
            Stop Guessing. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Start Hiring.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            The intelligent talent operating system that analyzes, ranks, and explains every candidate—instantly.
          </p>

          <GlowingButton onClick={handleGetStarted} className="text-lg px-10 py-5">
            {isLoggedIn ? "Enter Dashboard" : "Launch Platform"}
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </GlowingButton>
        </motion.div>
      </section>

      {/* Dual Audience Section */}
      <section className="relative z-10 px-6 md:px-16 py-24 bg-gradient-to-b from-[#020617] to-gray-900/50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">

          {/* Recruiter Box */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">For Recruiters</h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Upload 50 resumes at once. Our AI cross-references them against your exact Job Description and gives you a ranked leaderboard in seconds. Say goodbye to manual screening.
            </p>
            <ul className="space-y-3">
              {["Bulk AI Resume Scanning", "Real-Time Ranked Leaderboard", "Custom Grading Sliders"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Student Box */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">For Candidates</h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Don't apply blindly. Paste a Job Description and your Resume to see exactly what the ATS will see. Get actionable fixes, generated interview questions, and a learning roadmap.
            </p>
            <ul className="space-y-3">
              {["Deep Gap Analysis", "Tailored Interview Prep", "Exportable PDF Reports"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      </section>

      {/* Modern Features Grid */}
      <section className="relative z-10 px-6 md:px-16 py-24">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Engineered for <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Precision</span></h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">Traditional ATS systems look for exact keyword matches. HireStream understands context, impact, and true capability.</p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Contextual AI Scoring",
              desc: "It doesn't just read words; it reads meaning. It knows 'React' and 'Next.js' are related.",
              icon: "M13 10V3L4 14h7v7l9-11h-7z"
            },
            {
              title: "Unbiased Filtering",
              desc: "Focus purely on skills and experience, stripping away the noise that leads to poor hiring decisions.",
              icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            },
            {
              title: "Actionable Feedback",
              desc: "Instead of a simple 'Yes/No', get a breakdown of exactly why a candidate matched (or didn't).",
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-32 text-center border-t border-white/5 bg-gradient-to-b from-[#020617] to-blue-900/10">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to upgrade your workflow?</h2>
        <GlowingButton onClick={handleGetStarted} className="text-xl px-12 py-5">
          {isLoggedIn ? "Back to Dashboard" : "Enter HireStream AI"}
        </GlowingButton>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-gray-500 bg-[#01030B]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center px-6 gap-4">
          <p>© 2026 HireStream AI. Powered by Google Gemini.</p>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}