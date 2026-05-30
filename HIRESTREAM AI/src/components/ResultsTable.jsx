import React from "react";

export default function ResultsTable({ results, setSelectedCandidate, rejectCandidate, acceptCandidate }) {
  return (
    <div className="mt-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
        Candidate Rankings
      </h2>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Head */}
          <thead>
            <tr className="text-gray-400 border-b border-white/10 text-sm">
              <th className="p-4 font-medium">Rank</th>
              <th className="p-4 font-medium">Candidate</th>
              <th className="p-4 font-medium">Match Score</th>
              <th className="p-4 font-medium">Insights</th>
              <th className="p-4 font-medium">Action / Status</th>
            </tr>
          </thead>

          {/* Table Body */}

          <tbody>
            {results.map((c, i) => (
              <tr
                key={`${c.name}-${i}`}
                className="border-b border-white/5 hover:bg-white/10 transition-all duration-200"
                onClick={() => setSelectedCandidate(c)}
              >
                {/* Rank */}
                <td className="p-4 text-gray-400 align-middle">
                  {i + 1}
                </td>

                {/* Candidate */}
                <td className="p-4 align-middle">
                  <div className="font-semibold text-white leading-tight">
                    {c.name}
                  </div>
                  <div className="text-xs mt-1">
                    {c.email !== "Not Found" ? (
                      <a
                        href={`mailto:${c.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1 w-max transition-colors"
                        title={`Send email to ${c.email}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {c.email}
                      </a>
                    ) : (
                      <span className="text-gray-500">{c.email}</span>
                    )}
                  </div>
                </td>

                {/* Score */}
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3">
                    {/* Progress Bar */}
                    <div className="w-36 bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500"
                        style={{ width: `${c.matchPercentage}%` }}
                      />
                    </div>

                    {/* Percentage */}
                    <span className="text-cyan-400 font-bold text-sm min-w-[40px]">
                      {c.matchPercentage}%
                    </span>
                  </div>
                </td>

                {/* Button */}
                <td className="p-4 align-middle">
                  <button className="bg-white/10 hover:bg-white/20 text-xs px-4 py-1.5 rounded-full transition">
                    View Details
                  </button>
                </td>

                {/* Accept & Reject Action */}
                <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                  {c.emailStatus === "sending" && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      <div className="w-2 h-2 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                      Sending Email...
                    </span>
                  )}
                  {c.emailStatus === "accepted" && (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20" title="Acceptance email sent.">
                      ✔ Accepted
                    </span>
                  )}
                  {(c.emailStatus === "rejected" || c.emailStatus === "sent") && (
                    <span className="flex items-center gap-1.5 text-xs text-red-400 font-semibold bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20" title="Rejection email and career roadmap sent.">
                      ✘ Rejected
                    </span>
                  )}
                  {c.emailStatus === "failed" && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-red-400 italic block">Failed to send. Retry:</span>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => acceptCandidate(c)}
                          className="px-2 py-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded hover:bg-green-500 hover:text-white transition cursor-pointer"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => rejectCandidate(c)}
                          className="px-2 py-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500 hover:text-white transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                  {!c.emailStatus && c.email && c.email !== "Not Found" && c.email !== "Not found" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptCandidate(c)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-green-400 bg-green-500/10 hover:bg-green-500 hover:text-white border border-green-500/20 rounded-lg transition-all duration-300 cursor-pointer"
                        title="Send Acceptance Email"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectCandidate(c)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all duration-300 cursor-pointer"
                        title="Send Rejection Email & Career Roadmap PDF"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {!c.emailStatus && (!c.email || c.email === "Not Found" || c.email === "Not found") && (
                    <span className="text-xs text-gray-500 italic">No Email Found</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}