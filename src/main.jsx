import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import './styles/global.css';

// Ordine dei provider: Auth più esterno (chi siamo), poi i dati dell'utente.
// Le route dentro App leggono da entrambi via i rispettivi hook.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  </StrictMode>
);
