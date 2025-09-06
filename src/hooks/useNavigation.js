import { useState } from 'react';

function useNavigation(initialPage = 'home') {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const changePage = (page) => {
    setCurrentPage(page);
  };

  return {
    currentPage,
    changePage
  };
}

export default useNavigation;
