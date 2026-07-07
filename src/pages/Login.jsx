import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Illustration } from '../components/UI/Illustration';
import { mapAuthError } from '../utils/authErrors';
import styles from './Auth.module.css';

export function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Validazione lato client prima di "chiamare il backend". Restituisco una mappa
  // campo -> messaggio; se è vuota il form è valido.
  const validate = () => {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email non valida';
    if (form.password.length < 6) next.password = 'Almeno 6 caratteri';
    return next;
  };

  const handleSubmit = async () => {
    setAuthError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setAuthError(mapAuthError(err));
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.hero}>
          <Illustration name="auth" size={120} />
        </div>
        <div className={styles.brand}>
          <span className={styles.brandMark}>HF</span>
          <span className={styles.brandName}>HabitForge</span>
        </div>
        <p className={styles.subtitle}>Bentornato, riprendi da dove hai lasciato.</p>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={update('email')}
          placeholder="tuonome@example.com"
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={update('password')}
          placeholder="••••••••"
          error={errors.password}
        />

        {authError && <p className={styles.formError}>{authError}</p>}

        <Button full onClick={handleSubmit} disabled={loading}>
          {loading ? 'Accesso...' : 'Accedi'}
        </Button>

        <p className={styles.switch}>
          Non hai un account? <Link to="/register">Registrati</Link>
        </p>
      </div>
    </div>
  );
}
