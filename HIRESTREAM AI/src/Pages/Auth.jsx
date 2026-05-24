import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Auth() {

  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState("recruiter");
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "", college: "" });

  // Auto-redirect if already logged in
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role")?.toLowerCase();

    if (isLoggedIn === "true" && token && savedRole) {
      const target = savedRole === "recruiter" ? "/dashboard" : "/student-dashboard";
      console.log(`[Auth] Already logged in as ${savedRole}, redirecting to ${target}`);
      navigate(target, { replace: true });
    }
  }, [navigate]);

  // ✅ UPDATED LOGIN (API + fallback local)
  const handleLogin = async () => {
    // 1. Basic field verification
    if (!form.email || !form.password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5054/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // 2. Role Verification: Compare UI selection with Database record
        console.log(`[Auth Login] Backend role: "${data.role}" | UI selected role: "${role}"`);

        if (data.role.toLowerCase() !== role.toLowerCase()) {
          alert(`Access Denied: This account is registered as a ${data.role.toUpperCase()}. Please select the correct role to log in.`);
          return;
        }

        // 3. Store Auth Data if verification passes
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role.toLowerCase());
        localStorage.setItem("userName", data.fullName);

        // ✅ ADDED (no conflict with existing data)
        localStorage.setItem("userEmail", form.email);
        localStorage.setItem("organization", data.organization);

        sessionStorage.setItem("isLoggedIn", "true");

        // 4. Navigate to the verified dashboard
        const targetPath = data.role.toLowerCase() === "recruiter" ? "/dashboard" : "/student-dashboard";
        console.log(`[Auth Login] Navigating to: ${targetPath}`);
        navigate(targetPath, { replace: true });
      }
      else {
        alert(data.message || "Invalid Credentials");
        if (response.status === 404) {
          setIsSignup(true);
        }
      }
    } catch (error) {
      console.error("API Login Error:", error);
      alert("Connection Error: Ensure your .NET Backend is running on port 5054.");
    }
  };

  // ✅ FINAL SIGNUP (Connects React to SQL Server)
  const handleSignup = async () => {

    const org = role === "recruiter" ? form.company : form.college;
    // 1. Validate required fields
    if (!form.email || !form.password || !form.name || form.role) {
      alert("Please fill in all required fields (Name, Email,Role and Password).");
      return;
    }

    try {
      // 2. Call the .NET Signup API
      const response = await fetch("http://localhost:5054/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.name, // Maps to 'FullName' in your C# SignupDto
          email: form.email,
          password: form.password,
          role: role,
          organization: org
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account successfully created in SQL Server! You can now log in.");
        // Switch to the Login view
        setIsSignup(false);
      } else {
        // Handle backend errors (e.g., "Email is already registered.")
        alert(data.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup Connection Error:", error);
      alert("Cannot connect to backend. Please ensure your .NET project is running on port 5054.");
    }
  };

  // ✅ FINAL LOGOUT (Clears both Token and Session)
  const handleLogout = () => {
    // Clear all persistent data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("currentUser");

    // Clear session status
    sessionStorage.removeItem("isLoggedIn");

    // Send user back to the landing/auth page
    navigate("/");
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans">
      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl w-96 shadow-2xl backdrop-blur-md">

        <h2 className="text-3xl font-bold mb-2 text-center text-blue-400">
          HireStream AI
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          {isSignup ? "Create your professional account" : "Sign in to your workspace"}
        </p>

        <div className="space-y-4">
          {isSignup && (
            <input
              placeholder="Full Name"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 outline-none transition-all"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 outline-none transition-all"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 outline-none transition-all"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <label className="text-xs text-gray-500 block mb-1">Select Role</label>
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => setRole("recruiter")}
              className={`flex-1 py-2 text-sm rounded-lg transition-all ${role === "recruiter" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400"
                }`}
            >
              Recruiter
            </button>
            <button
              onClick={() => setRole("student")}
              className={`flex-1 py-2 text-sm rounded-lg transition-all ${role === "student" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400"
                }`}
            >
              Student
            </button>
          </div>

          {isSignup && (
            <input
              placeholder={role === "recruiter" ? "Company Name" : "College Name"}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 outline-none transition-all"
              onChange={(e) =>
                setForm({ ...form, [role === "recruiter" ? "company" : "college"]: e.target.value })
              }
            />
          )}

          <button
            onClick={isSignup ? handleSignup : handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-xl mt-4 shadow-lg shadow-blue-600/20 transition-all"
          >
            {isSignup ? "Get Started" : "Log In"}
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
            <span
              className="text-blue-400 font-medium cursor-pointer ml-2 hover:underline"
              onClick={() => setIsSignup(!isSignup)}
            >
              {isSignup ? "Log In" : "Sign Up"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}