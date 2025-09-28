// fileName: App.js (Updated with Admin Routes)

import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import AcademicInstitution from './components/AcademicInstitution';
import MyVerifiED from './components/MyVerifiED';
import AdminDashboard from './components/AdminDashboard'; // NEW
import Login from './components/Login';
import Navigation from './components/Navigation';

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Determine current page type
  const getCurrentPage = () => {
    if (location.pathname === '/institution-dashboard') return 'institution';
    if (location.pathname === '/student-dashboard') return 'student';
    if (location.pathname === '/admin-dashboard') return 'admin'; // NEW
    return 'home';
  };

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    
    if (userId && userType) {
      setUser({ id: userId, type: userType });
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
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
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/institution-dashboard" element={<AcademicInstitution />} />
        <Route path="/student-dashboard" element={<MyVerifiED />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} /> {/* NEW */}
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