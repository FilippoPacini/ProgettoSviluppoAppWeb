import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Illustration } from '../components/UI/Illustration';
import { mapAuthError } from '../utils/authErrors';
import styles from './Auth.module.css';

export function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setAuthError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email non valida');
      return;
    }
    setError('');

    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setAuthError(mapAuthError(err));
    } finally {
      setSubmitting(false);
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

        {sent ? (
          // Messaggio volutamente neutro: non rivela quali email sono registrate.
          <p className={styles.subtitle}>
            Se esiste un account con questa email, riceverai un messaggio con il link
            per reimpostare la password.
          </p>
        ) : (
          <>
            <p className={styles.subtitle}>
              Inserisci la tua email: ti mandiamo il link per reimpostare la password.
            </p>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuonome@example.com"
              error={error}
            />

            {authError && <p className={styles.formError}>{authError}</p>}

            <Button full onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Invio...' : 'Invia il link di reset'}
            </Button>
          </>
        )}

        <p className={styles.switch}>
          <Link to="/login">Torna al login</Link>
        </p>
      </div>
    </div>
  );
}
