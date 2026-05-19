import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ NEW: Try API-based stored values first
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");
    const userRole = localStorage.getItem("role");
    const userOrg = localStorage.getItem("organization");

    if (userName || userEmail) {
      setUser({
        name: userName || "User",
        email: userEmail || "No Email",
        role: userRole || "Not Set",
        organization: userOrg || "Not Set"
      });
    } else {
      // 🔁 OLD fallback (DO NOT REMOVE)
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        setUser(JSON.parse(currentUser));
      }
    }
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/10 px-8 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        {/* Left: Brand & Home Navigation */}
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            HireStream AI
          </h1>

          <Link
            to="/"
            className="text-l font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            Home
          </Link>

        </div>

        {/* Right: Profile Section */}
        <div className="relative">
          <div
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 pl-2 pr-4 py-1.5 rounded-full hover:bg-white/10 transition"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-sm font-medium text-gray-200">{user?.name || "User"}</span>
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-3 w-64 bg-[#0f172a] border border-white/10 rounded-2xl p-5 shadow-2xl">
              <div className="space-y-4">

                {/* Personal Info */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Account Information</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[11px] text-blue-400 font-medium">Full Name</p>
                      <p className="text-sm text-gray-200 font-semibold">{user?.name}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-blue-400 font-medium">Email Address</p>
                      <p className="text-sm text-gray-200">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-white/5" />

                {/* Professional Info */}
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] text-blue-400 font-medium">Role</p>
                      <p className="text-sm text-gray-200 capitalize">{user?.role || "Not Set"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-blue-400 font-medium">
                        {user?.role === "recruiter" ? "Company" : "College"}
                      </p>
                      <p className="text-sm text-gray-200 truncate">
                        {/* ✅ FIXED: support both new + old */}
                        {user?.organization || user?.company || user?.college || "Not Set"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-white/5" />

                {/* Logout Button */}
                <button
                  onClick={() => {
                    // Clear ALL auth and session data
                    sessionStorage.clear();
                    localStorage.removeItem("currentUser");
                    localStorage.removeItem("token");
                    localStorage.removeItem("role");
                    localStorage.removeItem("userName");
                    localStorage.removeItem("userEmail");
                    localStorage.removeItem("organization");

                    setUser(null);
                    navigate("/");
                  }}
                  className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                >
                  Logout Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}