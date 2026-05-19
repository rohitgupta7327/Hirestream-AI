import React from "react";

export default function UploadSection({ files, setFiles, handleDrop, handleFileUpload, jdText, setJdText, weights, setWeights, handleScan, loading }) {
  const hasFiles = files.length > 0;

  const handleRemoveFile = (e, indexToRemove) => {
    e.preventDefault();
    e.stopPropagation();
    if (setFiles) {
      setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    }
  };

  // Auto-balancing logic: ensure sliders always exactly equal 100
  const handleWeightChange = (changedKey, newValue) => {
    let val = parseInt(newValue);
    if (isNaN(val)) return;
    if (val < 0) val = 0;
    if (val > 100) val = 100;

    const newWeights = { ...weights };
    const oldVal = newWeights[changedKey];
    const diff = val - oldVal;

    const otherKeys = Object.keys(weights).filter(k => k !== changedKey);
    const k1 = otherKeys[0];
    const k2 = otherKeys[1];
    const othersTotal = newWeights[k1] + newWeights[k2];

    newWeights[changedKey] = val;

    if (othersTotal === 0) {
       newWeights[k1] = (100 - val) / 2;
       newWeights[k2] = 100 - val - newWeights[k1];
    } else {
       newWeights[k1] = Math.max(0, Math.round(newWeights[k1] - (diff * (newWeights[k1] / othersTotal))));
       newWeights[k2] = 100 - val - newWeights[k1];
    }

    if (newWeights[k2] < 0) {
        newWeights[k2] = 0;
        newWeights[k1] = 100 - val;
    }

    setWeights(newWeights);
  };

  return (
    <div className="bg-card border border-borderCard rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Resume Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">1</span>
            Candidate Resumes
          </h3>
          <div 
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed ${hasFiles ? 'border-success/30 bg-success/5' : 'border-white/10 bg-white/5'} rounded-xl p-8 transition-all duration-300 h-[220px] flex flex-col justify-center`}
          >
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="recruiterResumeUpload"
            />
            <label htmlFor="recruiterResumeUpload" className="cursor-pointer flex flex-col items-center text-center w-full">
              {!hasFiles ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-md font-medium text-white">Upload Resumes</p>
                  <p className="text-xs text-gray-500 mt-1">Drag & drop or click</p>
                </>
              ) : (
                <div className="w-full flex flex-col items-center max-h-full">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-success mb-2">{files.length} Files Staged</p>
                  <div className="flex flex-wrap justify-center gap-1.5 overflow-y-auto custom-scrollbar max-h-20 mb-2 w-full">
                    {files.map((file, idx) => (
                      <div key={idx} className="group relative flex items-center bg-white/10 px-2 py-0.5 rounded border border-white/5 max-w-[120px]">
                        <span className="text-[10px] text-gray-300 truncate w-full" title={file.name}>
                          {file.name}
                        </span>
                        <button 
                          onClick={(e) => handleRemoveFile(e, idx)}
                          className="absolute -right-1.5 -top-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-white text-[10px] hover:bg-red-400 transition-colors shadow-sm cursor-pointer z-20"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-400 underline underline-offset-2 hover:text-blue-300 mt-1">+ Add more files</p>
                </div>
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
            placeholder="Paste the Job Description for the open position. The AI will rank the resumes against this..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            className="w-full h-[220px] p-4 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none resize-none custom-scrollbar"
          />
        </div>
      </div>

      {/* AI Scoring Weights Section */}
      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">3</span>
          AI Scoring Weights
          <span className="text-xs font-normal text-gray-400 ml-2">(Total must be 100%)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 rounded-xl p-6 border border-white/5">
          {/* Technical Skills Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 font-medium">Technical Skills</span>
              <span className="text-primary font-bold">{weights.technical}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={weights.technical}
              onChange={(e) => handleWeightChange('technical', e.target.value)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <p className="text-[10px] text-gray-500">Core technologies requested in JD</p>
          </div>

          {/* Experience Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 font-medium">Experience</span>
              <span className="text-blue-400 font-bold">{weights.experience}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={weights.experience}
              onChange={(e) => handleWeightChange('experience', e.target.value)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[10px] text-gray-500">Years of experience & domain projects</p>
          </div>

          {/* Tools Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 font-medium">Tools & Frameworks</span>
              <span className="text-indigo-400 font-bold">{weights.tools}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={weights.tools}
              onChange={(e) => handleWeightChange('tools', e.target.value)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[10px] text-gray-500">Secondary skills like Git, Jira, Agile</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleScan}
          disabled={loading || !hasFiles || !jdText}
          className={`group relative px-8 py-4 rounded-xl font-bold text-white overflow-hidden transition-all duration-300 ${loading ? 'bg-gray-700' : 'bg-primary hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:scale-105 transition-transform duration-300"></div>
          <span className="relative flex items-center gap-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing Resumes...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Scan & Rank Candidates
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}