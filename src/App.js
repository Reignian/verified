import Navigation from './components/Navigation';
import useNavigation from './hooks/useNavigation';
import renderPage from './utils/pageRenderer';

function App() {
  const { currentPage, changePage } = useNavigation();

  return (
    <div>
      <Navigation 
        currentPage={currentPage} 
        onPageChange={changePage} 
      />
      <div>
        {renderPage(currentPage, changePage)}
      </div>
    </div>
  );
}

export default App;
