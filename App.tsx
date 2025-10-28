
import React from 'react';
import AdminApp from './AdminApp';
import PublicCatalog from './components/PublicCatalog';

const App: React.FC = () => {
  const [hash, setHash] = React.useState(window.location.hash);

  React.useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderContent = () => {
    switch (hash) {
      case '#/catalog':
        return <PublicCatalog />;
      default:
        return <AdminApp />;
    }
  };

  return <>{renderContent()}</>;
};

export default App;
