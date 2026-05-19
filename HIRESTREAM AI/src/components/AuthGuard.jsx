import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";

const AuthGuard = ({ children, allowedRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      // 1. Get auth data
      const isLoggedIn = sessionStorage.getItem("isLoggedIn");
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("role")?.toLowerCase();

      console.log(`[AuthGuard] Path: ${location.pathname} | Expected: ${allowedRole} | Found: ${userRole} | LoggedIn: ${isLoggedIn}`);

      // 2. Perfect match: user has the correct role for this route
      if (isLoggedIn === "true" && token && userRole === allowedRole.toLowerCase()) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // 3. Logged in but WRONG route (e.g., student on /dashboard)
      //    DO NOT clear their session — redirect them to the correct dashboard
      if (isLoggedIn === "true" && token && userRole) {
        console.warn(`[AuthGuard] Role mismatch: redirecting ${userRole} to correct dashboard`);
        const correctPath = userRole === "recruiter" ? "/dashboard" : "/student-dashboard";
        setRedirectPath(correctPath);
        setIsLoading(false);
        return;
      }

      // 4. Not logged in at all — clear stale data and send to landing
      console.warn(`[AuthGuard] No valid session found. Clearing data.`);
      sessionStorage.removeItem("isLoggedIn");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      setIsLoading(false);
    };

    checkAuth();

    // Listen for cross-tab logins/logouts
    const handleStorageChange = (e) => {
      if (e.key === "role" || e.key === "token" || e.key === null) {
        // e.key === null happens when localStorage.clear() is called
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);

  }, [navigate, location, allowedRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying security token...</p>
        </div>
      </div>
    );
  }

  // Redirect to correct dashboard if role mismatch
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // Not authorized and no redirect → send to landing
  if (!isAuthorized) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default AuthGuard;