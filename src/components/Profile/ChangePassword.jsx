import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { mapAuthError } from '../../utils/authErrors';
import styles from './ChangePassword.module.css';

const VUOTO = { current: '', next: '', confirm: '' };

export function ChangePassword() {
  const { user, changePassword } = useAuth();

  const [form, setForm] = useState(VUOTO);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Un account collegato solo a Google non ha una password su Firebase: il form
  // non avrebbe nulla da cambiare.
  const isPasswordUser = user?.providers?.includes('password');
  if (!isPasswordUser) {
    return (
      <section className={styles.card}>
        <h3>Password</h3>
        <p className={styles.desc}>
          Accedi con Google: la password si gestisce dal tuo account Google.
        </p>
      </section>
    );
  }

  const handleSubmit = async () => {
    setError('');
    setOk('');

    if (form.next.length < 6) {
      setError('La nuova password deve avere almeno 6 caratteri.');
      return;
    }
    if (form.next !== form.confirm) {
      setError('Le due nuove password non coincidono.');
      return;
    }
    if (form.next === form.current) {
      setError('La nuova password deve essere diversa da quella attuale.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(form.current, form.next);
      setForm(VUOTO);
      setOk('Password aggiornata.');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.card}>
      <h3>Cambia password</h3>
      <p className={styles.desc}>
        Per confermare il cambio ti viene richiesta la password attuale.
      </p>

      <Input
        label="Password attuale"
        type="password"
        value={form.current}
        onChange={update('current')}
        placeholder="••••••••"
      />
      <Input
        label="Nuova password"
        type="password"
        value={form.next}
        onChange={update('next')}
        placeholder="••••••••"
      />
      <Input
        label="Conferma nuova password"
        type="password"
        value={form.confirm}
        onChange={update('confirm')}
        placeholder="••••••••"
      />

      {error && <p className={styles.error}>{error}</p>}
      {ok && <p className={styles.ok}>{ok}</p>}

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Aggiornamento...' : 'Aggiorna password'}
      </Button>
    </section>
  );
}
