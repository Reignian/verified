import HomePage from '../components/HomePage';
import AcademicInstitution from '../components/AcademicInstitution';
import Login from '../components/Login';

function renderPage(currentPage, onPageChange) {
  switch(currentPage) {
    case 'login':
      return <Login onPageChange={onPageChange} />;
    case 'academic-institution':
      return <AcademicInstitution />;
    case 'home':
    default:
      return <HomePage />;
  }
}

export default renderPage;
