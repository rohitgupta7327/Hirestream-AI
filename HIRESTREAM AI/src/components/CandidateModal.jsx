import React from "react";

export default function CandidateModal({ selectedCandidate, setSelectedCandidate, rejectCandidate, acceptCandidate }) {
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
        <div className="p-6 pt-4 border-t border-white/5 shrink-0 bg-[#0f172a] z-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setSelectedCandidate(null)}
            className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition text-white cursor-pointer"
          >
            Close
          </button>
          {selectedCandidate.email && selectedCandidate.email !== "Not Found" && selectedCandidate.email !== "Not found" && (
            <>
              {/* Accept Option */}
              <button
                onClick={() => acceptCandidate(selectedCandidate)}
                disabled={selectedCandidate.emailStatus === "sending" || selectedCandidate.emailStatus === "accepted" || selectedCandidate.emailStatus === "rejected" || selectedCandidate.emailStatus === "sent"}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                  selectedCandidate.emailStatus === "accepted"
                    ? "bg-green-600/20 text-green-400 border border-green-500/30 cursor-default"
                    : selectedCandidate.emailStatus === "sending"
                    ? "bg-blue-600/50 text-white/50 cursor-not-allowed animate-pulse"
                    : (selectedCandidate.emailStatus === "rejected" || selectedCandidate.emailStatus === "sent")
                    ? "bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:opacity-90 cursor-pointer"
                }`}
              >
                {selectedCandidate.emailStatus === "sending" && "Mailing..."}
                {selectedCandidate.emailStatus === "accepted" && "✔ Accepted"}
                {selectedCandidate.emailStatus === "failed" && "Retry Accept"}
                {!selectedCandidate.emailStatus && "Accept & Email"}
                {((selectedCandidate.emailStatus === "rejected" || selectedCandidate.emailStatus === "sent") && selectedCandidate.emailStatus !== "sending") && "Accepted"}
              </button>

              {/* Reject Option */}
              <button
                onClick={() => rejectCandidate(selectedCandidate)}
                disabled={selectedCandidate.emailStatus === "sending" || selectedCandidate.emailStatus === "accepted" || selectedCandidate.emailStatus === "rejected" || selectedCandidate.emailStatus === "sent"}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                  (selectedCandidate.emailStatus === "rejected" || selectedCandidate.emailStatus === "sent")
                    ? "bg-red-600/20 text-red-400 border border-red-500/30 cursor-default"
                    : selectedCandidate.emailStatus === "sending"
                    ? "bg-blue-600/50 text-white/50 cursor-not-allowed animate-pulse"
                    : selectedCandidate.emailStatus === "accepted"
                    ? "bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-red-600 to-pink-500 text-white hover:opacity-90 cursor-pointer"
                }`}
              >
                {selectedCandidate.emailStatus === "sending" && "Mailing..."}
                {(selectedCandidate.emailStatus === "rejected" || selectedCandidate.emailStatus === "sent") && "✘ Rejected"}
                {selectedCandidate.emailStatus === "failed" && "Retry Reject"}
                {!selectedCandidate.emailStatus && "Reject & Email"}
                {(selectedCandidate.emailStatus === "accepted" && selectedCandidate.emailStatus !== "sending") && "Rejected"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}