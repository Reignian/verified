import './Navigation.css';

function Navigation({ currentPage, onPageChange }) {
  const handleAcademicInstitutionClick = async () => {
    // Connect to wallet first
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        console.log('Wallet connected');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
    
    // Then navigate to the page
    onPageChange('academic-institution');
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
            className={`nav-link ${currentPage === 'academic-institution' ? 'active' : ''}`}
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
