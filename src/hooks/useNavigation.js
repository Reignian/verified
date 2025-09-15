import { useState, useEffect } from 'react';

function useNavigation(initialPage = 'home') {
  const [currentPage, setCurrentPage] = useState(() => {
    // Check if user is logged in on app startup
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    
    if (userId && userType === 'institution') {
      return 'academic-institution';
    } else if (userId && userType === 'student') {
      return 'student-account';
    }
    return initialPage;
  });

  const changePage = (page) => {
    setCurrentPage(page);
  };

  return {
    currentPage,
    changePage
  };
}

export default useNavigation;
