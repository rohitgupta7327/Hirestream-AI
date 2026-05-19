import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/Dashboard"; 
import LandingPage from "./Pages/Landingpage";
import Auth from "./Pages/Auth";
import StudentDashboard from "./Pages/StudentDashboard";
import AuthGuard from "./components/AuthGuard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/dashboard" 
          element={
            <AuthGuard allowedRole="recruiter">
              <Dashboard />
            </AuthGuard>
          } 
        />
        <Route 
          path="/student-dashboard" 
          element={
            <AuthGuard allowedRole="student">
              <StudentDashboard />
            </AuthGuard>
          } 
        />
      </Routes>
    </Router>
  );
}
