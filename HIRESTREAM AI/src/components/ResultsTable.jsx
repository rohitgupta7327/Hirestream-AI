import React from "react";

export default function ResultsTable({ results, setSelectedCandidate }) {
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}