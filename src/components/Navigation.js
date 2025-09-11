import './Navigation.css';

function Navigation({ currentPage, onPageChange }) {
  const handleAcademicInstitutionClick = () => {
    onPageChange('login');
  };

  return (
    <nav>
      <div className="nav-container">
        <a href="#" className="nav-brand" onClick={() => onPageChange('home')}>
          VerifiED
        </a>
        <div className="nav-links">
          <a 
            href="#" 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onPageChange('home')}
          >
            Home
          </a>
          <a 
            href="#" 
            className={`nav-link ${currentPage === 'login' ? 'active' : ''}`}
            onClick={handleAcademicInstitutionClick}
          >
            Academic Institution
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
