// fileName: App.js (Updated with Admin Routes)

import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

import { useState, useEffect } from 'react';
import HomePage from './components/home/HomePage';
import AcademicInstitution from './components/institution/AcademicInstitution';
import MyVerifiED from './components/student/MyVerifiED';
import AdminDashboard from './components/admin/AdminDashboard';
import Login from './components/common/Login';
import SignUp from './components/common/SignUp';
import Navigation from './components/common/Navigation';

function ProtectedRoute({ allowedTypes, children }) {
  const userId = localStorage.getItem('userId');
  const userType = localStorage.getItem('userType');

  if (!userId || (allowedTypes && !allowedTypes.includes(userType))) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if current page is login or signup page
  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup';

  // Determine current page type
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/institution-dashboard') return 'institution';
    if (path === '/student-dashboard') return 'student';
    if (path === '/admin-dashboard') return 'admin';
    return 'home';
  };

  useEffect(() => {
    // Check if user is logged in on initial load only
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    
    if (userId && userType) {
      setUser({ id: userId, type: userType });
    }
  }, []); // Remove location dependency to prevent re-renders on route changes

  const handleLogout = () => {
    // First navigate to homepage so the user sees the public landing page
    navigate('/');

    // Then clear auth state and storage shortly after navigation
    setTimeout(() => {
      localStorage.removeItem('userId');
      localStorage.removeItem('userType');
      localStorage.removeItem('institutionId');
      localStorage.removeItem('publicAddress');
      setUser(null);
    }, 0);
  };

  const handleLoginSuccess = () => {
    // Refresh user state
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    if (userId && userType) {
      setUser({ id: userId, type: userType });
    }
  };

  return (
    <>
      {!isLoginPage && (
        <Navigation 
          onLoginClick={() => navigate('/login')}
          isLoggedIn={!!user}
          onLogout={handleLogout}
          userType={user?.type}
          currentPage={getCurrentPage()}
        />
      )}
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/institution-dashboard"
          element={
            <ProtectedRoute allowedTypes={['institution', 'institution_staff']}>
              <AcademicInstitution />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedTypes={['student']}>
              <MyVerifiED />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;