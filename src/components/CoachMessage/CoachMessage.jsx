import styles from './CoachMessage.module.css';

// Un messaggio nella chat del coach. Distingue mittente utente/coach con classi
// diverse. Se il coach allega libri suggeriti, li mostra in coda al messaggio.
export function CoachMessage({ message }) {
  const isCoach = message.role === 'coach';

  return (
    <div className={`${styles.row} ${isCoach ? styles.coachRow : styles.userRow}`}>
      {isCoach && <span className={styles.avatar}>🤖</span>}
      <div className={`${styles.bubble} ${isCoach ? styles.coachBubble : styles.userBubble}`}>
        <p>{message.text}</p>

        {isCoach && message.books && message.books.length > 0 && (
          <div className={styles.books}>
            <span className={styles.booksTitle}>Letture consigliate</span>
            {message.books.map((book) => (
              <span key={book.title} className={styles.book}>
                📖 <strong>{book.title}</strong> — {book.author}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
