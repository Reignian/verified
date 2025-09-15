import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import AcademicInstitution from './components/AcademicInstitution';
import MyVerifiED from './components/MyVerifiED';
import Login from './components/Login';
import Navigation from './components/Navigation';

function AppContent() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current page type
  const getCurrentPage = () => {
    if (location.pathname === '/institution-dashboard') return 'institution';
    if (location.pathname === '/student-dashboard') return 'student';
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
    setShowLoginModal(false);
    // Refresh user state
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    if (userId && userType) {
      setUser({ id: userId, type: userType });
    }
  };

  return (
    <>
      <Navigation 
        onLoginClick={() => setShowLoginModal(true)}
        isLoggedIn={!!user}
        onLogout={handleLogout}
        userType={user?.type}
        currentPage={getCurrentPage()}
      />
      
      {showLoginModal && (
        <Login 
          isModal={true} 
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/institution-dashboard" element={<AcademicInstitution />} />
        <Route path="/student-dashboard" element={<MyVerifiED />} />
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