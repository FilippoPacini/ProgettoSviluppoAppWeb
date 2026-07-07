import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Illustration } from '../components/UI/Illustration';
import { mapAuthError } from '../utils/authErrors';
import styles from './Auth.module.css';

export function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Inserisci il tuo nome';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email non valida';
    if (form.password.length < 6) next.password = 'Almeno 6 caratteri';
    if (form.confirm !== form.password) next.confirm = 'Le password non coincidono';
    return next;
  };

  const handleSubmit = async () => {
    setAuthError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      await register(form.email, form.password, form.name.trim());
      // Nuovo utente senza profilo: lo mando subito al test di personalità (onboarding)
      navigate('/onboarding');
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
        <p className={styles.subtitle}>Crea il tuo account e inizia a forgiare abitudini.</p>

        <Input label="Nome" value={form.name} onChange={update('name')} placeholder="Mario Rossi" error={errors.name} />
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
        <Input
          label="Conferma password"
          type="password"
          value={form.confirm}
          onChange={update('confirm')}
          placeholder="••••••••"
          error={errors.confirm}
        />

        {authError && <p className={styles.formError}>{authError}</p>}

        <Button full onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creazione...' : 'Registrati'}
        </Button>

        <p className={styles.switch}>
          Hai già un account? <Link to="/login">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
