import React, { useState } from 'react';
import StudentUploadSection from './StudentUploadSection';
import html2pdf from 'html2pdf.js';

export default function Studentcomponent({
  files,
  handleDrop,
  handleFileUpload,
  jdText,
  setJdText,
  handleScan,
  loading,
  results = [],
}) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = () => {
    // 1. Set state to expand all boxes
    setIsGeneratingPDF(true);

    // 2. Wait for React to re-render, then trigger print
    setTimeout(() => {
      window.print();
      setIsGeneratingPDF(false);
    }, 500);
  };

  const boxClasses = isGeneratingPDF
    ? "bg-card border border-borderCard rounded-xl p-6 shadow-lg h-auto"
    : "bg-card border border-borderCard rounded-xl p-6 shadow-lg h-80 overflow-y-auto custom-scrollbar";

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-12">
      <div className="max-w-6xl mx-auto">
        {/* 1. New Student Upload Section */}
        <section data-html2canvas-ignore="true">
          <StudentUploadSection
            files={files}
            handleFileUpload={handleFileUpload}
            jdText={jdText}
            setJdText={setJdText}
            handleScan={handleScan}
            loading={loading}
          />
        </section>

        {!loading && results.length === 0 && (
          <section className="mt-16 text-center space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Skill Gap Analysis", icon: "📊", desc: "See exactly which tech stacks you are missing for your dream job." },
                { title: "Interview Prep", icon: "💬", desc: "Get real interview questions based on your actual experience." },
                { title: "Learning Roadmap", icon: "🗺️", desc: "A step-by-step path to master the skills you're currently missing." }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {results && results.length > 0 && (
          <div id="pdf-content" className={`mt-12 space-y-10 ${isGeneratingPDF ? 'bg-background p-4' : ''}`}>

            {/* Header for PDF and Download Button */}
            <div className="flex justify-between items-center mb-6" data-html2canvas-ignore="true">
              <h2 className="text-2xl font-bold text-white">Your AI Career Analysis</h2>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isGeneratingPDF ? "Preparing PDF..." : "📥 Download PDF Report"}
              </button>
            </div>

            {/* Top Section: Score, Strengths, Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Match Score Card */}
              <div className={boxClasses}>
                <h2 className="text-textLabel text-sm font-semibold uppercase tracking-wider mb-2">
                  Your Match Score
                </h2>
                <div className="text-6xl font-bold text-progress mb-2">
                  {results?.[0]?.matchPercentage ?? 0}
                  <span className="text-2xl text-textLabel">%</span>
                </div>
                <p className="text-textLabel text-sm mt-4">
                  {(results?.[0]?.matchPercentage ?? 0) >= 70
                    ? 'Interview Ready with Polish'
                    : 'Keep improving to be interview-ready'}
                </p>
                {/* Matched Skills Pills */}
                <div className="flex gap-2 mt-4 flex-wrap justify-center overflow-hidden">
                  {(results?.[0]?.skills?.length ? results[0].skills : []).slice(0, 6).map((s, idx) => (
                    <span
                      key={`${s}-${idx}`}
                      className="px-3 py-1 bg-primary/20 text-progress text-xs rounded-full border border-primary/30"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Strengths */}
              <div className={boxClasses}>
                <div className={`flex items-center gap-2 mb-4 ${isGeneratingPDF ? '' : 'sticky top-0 bg-card z-10 pb-2'}`}>
                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <h3 className="text-textPrimary font-semibold text-md">Key Strengths vs JD</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-300">
                  {(results?.[0]?.keyStrengths?.length ? results[0].keyStrengths : []).map((strength, idx) => (
                    <li key={`strength-${idx}`} className="flex gap-2 items-start">
                      <span className="text-success mt-0.5 shrink-0">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resume Weaknesses & Red Flags */}
              <div className={boxClasses}>
                <div className={`flex items-center gap-2 mb-4 ${isGeneratingPDF ? '' : 'sticky top-0 bg-card z-10 pb-2'}`}>
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <h3 className="text-textPrimary font-semibold text-md">Resume Weaknesses</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-300">
                  {(results?.[0]?.resumeWeaknesses?.length ? results[0].resumeWeaknesses : []).map((weakness, idx) => (
                    <li key={`weakness-${idx}`} className="flex gap-2 items-start">
                      <span className="text-red-500 mt-0.5 shrink-0">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Middle Section: Missing Skills & Interview Questions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Critical Missing Skills */}
              <div className={boxClasses}>
                <div className={`flex items-center gap-2 mb-4 ${isGeneratingPDF ? '' : 'sticky top-0 bg-card z-10 pb-2'}`}>
                  <svg className="w-5 h-5 text-alert" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <h3 className="text-textPrimary font-semibold text-md">Missing Skills</h3>
                </div>
                <div className="space-y-4 text-sm">
                  {(results?.[0]?.missingSkills?.length ? results[0].missingSkills : []).map((skillObj, idx) => (
                    <div key={`${skillObj.skillName || skillObj.SkillName}-${idx}`} className="bg-alertBg border border-alert/30 rounded p-3">
                      <span className="font-semibold block text-alert">{skillObj.skillName || skillObj.SkillName}</span>
                      <span className="text-gray-300 text-xs mt-1 block">
                        {skillObj.reason || skillObj.Reason} (Priority: {skillObj.priority || skillObj.Priority})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Interview Questions */}
              <div className={`md:col-span-2 ${boxClasses}`}>
                <div className={`flex items-center gap-2 mb-4 ${isGeneratingPDF ? '' : 'sticky top-0 bg-card z-10 pb-2'}`}>
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  <h3 className="text-textPrimary font-semibold text-md">Expected Interview Questions</h3>
                </div>
                <ul className="space-y-4 text-sm text-gray-300">
                  {(results?.[0]?.interviewQuestions?.length ? results[0].interviewQuestions : []).map((q, idx) => (
                    <li key={`question-${idx}`} className="bg-background border border-borderCard p-4 rounded-lg italic leading-relaxed">
                      <span className="text-blue-400 font-bold mr-2 not-italic">Q{idx + 1}:</span>"{q}"
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Middle Section: Actionable Next Steps */}
            <div className="bg-card border border-borderCard rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Action Plan & Next Steps
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(results?.[0]?.actionPlan?.length ? results[0].actionPlan : []).map((step, idx) => (
                  <div key={`step-${idx}`} className={`${idx === 0 ? 'bg-successBg border-success/30' : 'bg-background border-borderCard'} border rounded-lg p-4 pr-3 flex flex-col items-center text-center ${isGeneratingPDF ? 'h-auto' : 'h-60 overflow-y-auto custom-scrollbar'}`}>
                    <span className={`w-10 h-10 rounded-full ${idx === 0 ? 'bg-success/20 text-success' : 'bg-borderCard text-gray-300'} flex items-center justify-center font-bold mb-4 shrink-0`}>{step.stepNumber || step.StepNumber || idx + 1}</span>
                    <span className="text-sm font-medium text-gray-200">{step.task || step.Task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section: Learning Roadmap & Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Learning Roadmap */}
              <div className={`bg-card border border-borderCard rounded-xl p-6 shadow-lg ${isGeneratingPDF ? 'h-auto' : 'h-96 overflow-y-auto custom-scrollbar'}`}>
                <h2 className="text-lg font-semibold text-textPrimary mb-4">Learning Roadmap</h2>
                {results?.[0]?.learningRoadmap && (
                  <div className="border-l-2 border-borderCard pl-4 space-y-4">
                    <div className="relative">
                      <div className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background"></div>
                      <h3 className="text-sm font-bold text-textPrimary">{results[0].learningRoadmap.phase || results[0].learningRoadmap.Phase}</h3>
                      <ul className="text-sm text-gray-300 mt-3 list-disc pl-4 space-y-2">
                        {(results[0].learningRoadmap.tasks || results[0].learningRoadmap.Tasks || []).map((task, idx) => (
                          <li key={`task-${idx}`} className="leading-relaxed">{task}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Recommended Projects */}
              <div className={`bg-card border border-borderCard rounded-xl p-6 shadow-lg ${isGeneratingPDF ? 'h-auto' : 'h-96 overflow-y-auto custom-scrollbar'}`}>
                <h2 className="text-lg font-semibold text-textPrimary mb-4">Recommended Projects</h2>
                {results?.[0]?.recommendedProject && (
                  <div className="bg-background border border-borderCard rounded-lg p-5 hover:border-primary transition-colors cursor-pointer">
                    <h3 className="text-md font-bold text-textPrimary mb-2">{results[0].recommendedProject.title || results[0].recommendedProject.Title}</h3>
                    <p className="text-sm text-gray-300 mb-4 leading-relaxed">{results[0].recommendedProject.description || results[0].recommendedProject.Description}</p>
                    <div className="flex gap-2 flex-wrap">
                      {(results[0].recommendedProject.technologies || results[0].recommendedProject.Technologies || []).map((tech, idx) => (
                        <span key={`tech-${idx}`} className="px-3 py-1 bg-card border border-borderCard text-textLabel text-xs rounded-full shadow-sm">{tech}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


