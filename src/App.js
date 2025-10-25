// fileName: App.js (Updated with Admin Routes)

import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './components/home/HomePage';
import AcademicInstitution from './components/institution/AcademicInstitution';
import MyVerifiED from './components/student/MyVerifiED';
import AdminDashboard from './components/admin/AdminDashboard';
import Login from './components/common/Login';
import Navigation from './components/common/Navigation';

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if current page is login page
  const isLoginPage = location.pathname === '/login' || location.pathname === '/verified/login';

  // Determine current page type
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/institution-dashboard' || path === '/verified/institution-dashboard') return 'institution';
    if (path === '/student-dashboard' || path === '/verified/student-dashboard') return 'student';
    if (path === '/admin-dashboard' || path === '/verified/admin-dashboard') return 'admin';
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
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('institutionId');
    localStorage.removeItem('publicAddress');
    setUser(null);
    navigate('/');
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
        <Route path="/verified" element={<HomePage />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/verified/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/institution-dashboard" element={<AcademicInstitution />} />
        <Route path="/verified/institution-dashboard" element={<AcademicInstitution />} />
        <Route path="/student-dashboard" element={<MyVerifiED />} />
        <Route path="/verified/student-dashboard" element={<MyVerifiED />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/verified/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;