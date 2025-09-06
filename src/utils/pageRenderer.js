import HomePage from '../components/HomePage';
import AcademicInstitution from '../components/AcademicInstitution';

function renderPage(currentPage) {
  switch(currentPage) {
    case 'academic-institution':
      return <AcademicInstitution />;
    case 'home':
    default:
      return <HomePage />;
  }
}

export default renderPage;
