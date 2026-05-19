import React from 'react';
import { motion } from 'framer-motion';

export default function Sidebar({ history, onNewScan, onHistoryClick, onDeleteClick, role }) {
  return (
    <div className="w-64 min-w-[16rem] bg-[#020617] border-r border-white/10 h-screen sticky top-0 overflow-y-auto flex flex-col pt-24 pb-6 px-4">
      {/* New Scan Button */}
      <button
        onClick={onNewScan}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all mb-8"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        New Scanning
      </button>

      {/* Recents Section */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 px-2">
          Recents
        </h3>
        
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-gray-600 px-2 italic">No recent scans.</p>
          ) : (
            history.map((item) => (
              <motion.div
                key={item.historyId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full relative group"
              >
                <button
                  onClick={() => onHistoryClick(item)}
                  className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors flex flex-col gap-1 border border-transparent hover:border-white/5 pr-10"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate pr-2">
                      {item.name || 'Candidate'}
                    </span>
                    
                    {!item.isBatch && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        item.matchPercentage >= 75 ? 'bg-green-500/10 text-green-400' :
                        item.matchPercentage >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {item.matchPercentage}%
                      </span>
                    )}
                  </div>
                  
                  <span className="text-xs text-gray-500">
                    {new Date(item.scanDate).toLocaleDateString()}
                  </span>
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(window.confirm("Are you sure you want to delete this scan history?")) {
                      onDeleteClick(item.historyId);
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete History"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
