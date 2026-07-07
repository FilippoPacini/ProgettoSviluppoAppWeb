import { useState, useMemo } from 'react';
import { useDiary } from '../hooks/useDiary';
import { DiaryEntry } from '../components/DiaryEntry/DiaryEntry';
import { EmptyState } from '../components/UI/EmptyState';
import { TextArea } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Spinner } from '../components/UI/Spinner';
import { today } from '../utils/dateUtils';
import styles from './Diary.module.css';

export function Diary() {
  const { diary, loading, addEntry, deleteEntry } = useDiary();

  const [text, setText] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const handleSave = () => {
    if (text.trim().length === 0) return;
    addEntry({ date: today(), text: text.trim() });
    setText('');
  };

  // Da Firestore le voci arrivano senza ordine: le ordino per data decrescente
  // (le stringhe 'YYYY-MM-DD' sono ordinabili alfabeticamente). Poi filtro per data.
  const visible = useMemo(() => {
    const sorted = [...diary].sort((a, b) => b.date.localeCompare(a.date));
    return filterDate ? sorted.filter((e) => e.date === filterDate) : sorted;
  }, [diary, filterDate]);

  if (loading) {
    return (
      <div className="page-container">
        <Spinner label="Carico il diario..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Diario</h1>
        <p>Annota pensieri e riflessioni sul tuo percorso.</p>
      </div>

      <div className={styles.composer}>
        <TextArea
          label={`Oggi, ${today()}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Com’è andata oggi?"
          rows={4}
        />
        <div className={styles.composerActions}>
          <Button onClick={handleSave} disabled={text.trim().length === 0}>
            Salva voce
          </Button>
        </div>
      </div>

      <div className={styles.filterRow}>
        <label className={styles.filterLabel}>
          Filtra per data
          <input
            type="date"
            className={styles.dateInput}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </label>
        {filterDate && (
          <button className={styles.clearFilter} onClick={() => setFilterDate('')}>
            Mostra tutte
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          illustration="diary"
          title={filterDate ? 'Nessuna voce in questa data' : 'Il diario e\' vuoto'}
          text={filterDate ? '' : 'Scrivi la prima voce per iniziare a raccontarti.'}
        />
      ) : (
        <div className={styles.list}>
          {visible.map((entry) => (
            <DiaryEntry key={entry.id} entry={entry} onDelete={deleteEntry} />
          ))}
        </div>
      )}
    </div>
  );
}
