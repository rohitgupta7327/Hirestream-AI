import React from "react";

export default function StudentUploadSection({ files, handleFileUpload, jdText, setJdText, handleScan, loading }) {
  const hasFile = files.length > 0;

  return (
    <div className="bg-card border border-borderCard rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Resume Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">1</span>
            Your Professional Resume
          </h3>
          <div className={`border-2 border-dashed ${hasFile ? 'border-success/30 bg-success/5' : 'border-white/10 bg-white/5'} rounded-xl p-8 transition-all duration-300`}>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="studentResume"
            />
            <label htmlFor="studentResume" className="cursor-pointer flex flex-col items-center text-center">
              {!hasFile ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-md font-medium text-white">Drop your resume here</p>
                  <p className="text-xs text-gray-500 mt-1">PDF or DOCX supported</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-md font-medium text-success">{files[0].name}</p>
                  <p className="text-xs text-blue-400 mt-2 underline">Click to change resume</p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Right Side: Job Description */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">2</span>
            Job Description
          </h3>
          <textarea
            placeholder="Paste the JD you're aiming for. Our AI will analyze how you match and what's missing..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            className="w-full h-[148px] p-4 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none resize-none custom-scrollbar"
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleScan}
          disabled={loading || !hasFile || !jdText}
          className={`group relative px-8 py-4 rounded-xl font-bold text-white overflow-hidden transition-all duration-300 ${loading ? 'bg-gray-700' : 'bg-primary hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:scale-105 transition-transform duration-300"></div>
          <span className="relative flex items-center gap-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Plz Wait while Analysing.....
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyse Resume
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
