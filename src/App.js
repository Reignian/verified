import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import AcademicInstitution from './components/AcademicInstitution';
import MyVerifiED from './components/MyVerifiED';
import Login from './components/Login';

function App() {
  return (
    <BrowserRouter>
      {/* The Navigation component can be placed here if it should appear on all pages */}
      {/* Or it can be removed if each page has its own navigation */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/institution-dashboard" element={<AcademicInstitution />} />
        <Route path="/student-dashboard" element={<MyVerifiED />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;