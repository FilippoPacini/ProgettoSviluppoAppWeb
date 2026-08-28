import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import './styles/global.css';

// Ordine dei provider: Auth più esterno, poi i dati. L'ErrorBoundary sta fuori di
// tutto, cosi intercetta anche gli errori dei provider.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
