import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import { Button } from '../components/UI/Button';
import { ReminderSettings } from '../components/Reminder/ReminderSettings';
import { formatLong } from '../utils/dateUtils';
import { longestStreak } from '../utils/streakCalculator';
import { sectors } from '../data/personalityQuestions';
import styles from './Profile.module.css';

export function Profile() {
  const { user } = useAuth();
  const { habits, completions } = useHabits();

  if (!user) return null;

  const initials = user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Qualche numero riassuntivo dell’attività complessiva
  const totalCompletions = Object.values(completions).reduce((sum, ids) => sum + ids.length, 0);
  const bestStreak = habits.reduce((max, h) => Math.max(max, longestStreak(h, completions)), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Profilo</h1>
        <p>I tuoi dati e il tuo profilo di personalità.</p>
      </div>

      <section className={styles.userCard}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.userInfo}>
          <h2>{user.displayName}</h2>
          <span className={styles.email}>{user.email}</span>
          <span className={styles.since}>Su HabitForge dal {formatLong(user.createdAt)}</span>
        </div>
      </section>

      <section className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{habits.length}</span>
          <span className={styles.statLabel}>Abitudini</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{totalCompletions}</span>
          <span className={styles.statLabel}>Completamenti totali</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>🔥 {bestStreak}</span>
          <span className={styles.statLabel}>Streak record</span>
        </div>
      </section>

      <section className={styles.profileCard}>
        <h3 className={styles.profileHead}>Profilo di personalità</h3>

        {user.profile ? (
          <>
            <span className={styles.profileName}>{user.profile.name}</span>
            <p className={styles.profileTagline}>{user.profile.tagline}</p>
            <p className={styles.profileDesc}>{user.profile.description}</p>
            {user.profile.interests?.length > 0 && (
              <div className={styles.interests}>
                {sectors
                  .filter((s) => user.profile.interests.includes(s.id))
                  .map((s) => (
                    <span key={s.id} className={styles.interestChip}>
                      {s.emoji} {s.label}
                    </span>
                  ))}
              </div>
            )}
            <Link to="/onboarding">
              <Button variant="secondary">Rifai il test</Button>
            </Link>
          </>
        ) : (
          <>
            <p className={styles.noProfile}>
              Non hai ancora completato il test di personalità. Ti aiuta a ricevere consigli
              più mirati dal coach.
            </p>
            <Link to="/onboarding">
              <Button>Fai il test</Button>
            </Link>
          </>
        )}
      </section>

      <ReminderSettings />
    </div>
  );
}
