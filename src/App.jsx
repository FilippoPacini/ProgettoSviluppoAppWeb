import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Habits } from './pages/Habits';
import { Goals } from './pages/Goals';
import { Diary } from './pages/Diary';
import { Coach } from './pages/Coach';
import { Profile } from './pages/Profile';
import { PersonalityTest } from './pages/PersonalityTest';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DevSeed } from './pages/DevSeed';
import { SetupCheck } from './pages/SetupCheck';
import { Spinner } from './components/UI/Spinner';

// Schermata di attesa mostrata mentre Firebase controlla la sessione al primo
// caricamento (onAuthStateChanged non ha ancora risposto).
function AuthLoading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  );
}

// Guardia delle route riservate: senza utente in sessione rimando al login.
// L'utente arriva dal context, popolato da onAuthStateChanged.
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  // Finché Firebase non ha risposto attendo: al refresh di una rotta protetta
  // l'utente è assente per un istante e non voglio rimbalzarlo su /login.
  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Al contrario: se sono già loggato, le pagine di auth non hanno senso.
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        {/* Onboarding: accessibile solo da loggati, ma fuori dal Layout (schermo intero) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <PersonalityTest />
            </ProtectedRoute>
          }
        />

        {/* Area applicativa: tutte le route figlie condividono il Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/profile" element={<Profile />} />
          {/* Seed solo in sviluppo: in build di produzione import.meta.env.DEV
              e' false, la rotta viene eliminata e DevSeed non entra nel bundle. */}
          {import.meta.env.DEV && <Route path="/dev/seed" element={<DevSeed />} />}
          {import.meta.env.DEV && <Route path="/dev/check" element={<SetupCheck />} />}
        </Route>

        {/* Qualsiasi rotta sconosciuta torna alla dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
