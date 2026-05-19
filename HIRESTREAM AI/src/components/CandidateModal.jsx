import React from "react";

export default function CandidateModal({ selectedCandidate, setSelectedCandidate }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 overflow-hidden">
        
        {/* Fixed Header */}
        <div className="p-6 pb-4 border-b border-white/5 shrink-0 flex justify-between items-center bg-[#0f172a] z-10">
          <h2 className="text-2xl font-bold text-blue-400">
            AI Insights
          </h2>
          <button
            onClick={() => setSelectedCandidate(null)}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* Candidate Info */}
          <div className="space-y-1">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-white">Name:</span>{" "}
              {selectedCandidate.name || "Unknown"}
            </p>
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-white">Email:</span>{" "}
              {selectedCandidate.email || "Not Found"}
            </p>
          </div>

          {/* Matched Skills */}
          <div>
            <h4 className="text-xs uppercase text-gray-500 mb-2 font-semibold">
              Matched Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {(selectedCandidate.skills || []).length > 0 ? (
                selectedCandidate.skills.map((s, i) => (
                  <span
                    key={i}
                    className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-xs"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-xs italic">
                  No strong matches found
                </span>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div>
            <h4 className="text-xs uppercase text-gray-500 mb-2 font-semibold">
              Missing Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {(selectedCandidate.missingSkills || []).length > 0 ? (
                selectedCandidate.missingSkills.map((s, i) => (
                  <span
                    key={i}
                    className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-xs"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-green-400 text-xs italic">
                  No major gaps 🎯
                </span>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <h4 className="text-xs uppercase text-gray-500 mb-2 font-semibold">
              AI Reason
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-lg border border-white/5">
              {selectedCandidate.reason || "No explanation provided."}
            </p>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 pt-4 border-t border-white/5 shrink-0 bg-[#0f172a] z-10">
          <button
            onClick={() => setSelectedCandidate(null)}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl font-semibold hover:opacity-90 transition text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}