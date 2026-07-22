import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Pending from "./pages/Pending";
import Admin from "./pages/Admin";
import Library from "./pages/Library";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import Analytics from "./pages/Analytics";
import Resources from "./pages/Resources";
import Explore from "./pages/Explore";
import AgentService from "./pages/AgentService";
import Landing from "./pages/Landing";
import Layout from "./components/Layout";

function ProtectedRoute({
  children,
  requireAdmin = false,
  requireApproved = true,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireApproved?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-[#0f1117] text-gray-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin" />
          <span className="text-sm">Loading A.R.I.A...</span>
        </div>
      </div>
    );
  if (!user) return <Navigate to="/" replace />;
  if (requireAdmin && !user.is_admin) return <Navigate to="/dashboard" replace />;
  if (requireApproved && !user.is_approved && !user.is_admin)
    return <Navigate to="/pending" replace />;

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" toastOptions={{ 
        style: { background: '#1a1d27', color: '#fff', border: '1px solid #333' },
        success: { iconTheme: { primary: '#fff', secondary: '#000' } }
      }} />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/pending"
            element={
              <ProtectedRoute requireApproved={false}>
                <Pending />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="archives" element={<Dashboard archives />} />
            <Route path="library" element={<Library />} />
            <Route path="resources" element={<Resources />} />
            <Route path="explore" element={<Explore />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="chat" element={<Chat />} />
            <Route path="agents/:agentId" element={<AgentService />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
