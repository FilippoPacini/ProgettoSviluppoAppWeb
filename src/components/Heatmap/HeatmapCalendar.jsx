import { useState, useMemo } from 'react';
import { buildYearGrid, monthPositions } from '../../utils/heatmapUtils';
import { formatLong, monthLabel } from '../../utils/dateUtils';
import styles from './HeatmapCalendar.module.css';

const WEEKDAY_LABELS = ['Lun', '', 'Mer', '', 'Ven', '', 'Dom'];

// Contribution graph annuale: una colonna per settimana, sette celle per colonna.
// Il colore di ogni cella riflette quante abitudini sono state completate quel giorno
// rispetto al totale (0 -> grigio, 4 -> verde marino scuro).
export function HeatmapCalendar({ completions, totalHabits }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [hovered, setHovered] = useState(null);

  // useMemo: la griglia è costosa da ricostruire e cambia solo se cambiano
  // anno, completions o numero di abitudini.
  const weeks = useMemo(
    () => buildYearGrid(year, completions, totalHabits),
    [year, completions, totalHabits]
  );
  const months = useMemo(() => monthPositions(weeks), [weeks]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <button
          className={styles.navBtn}
          onClick={() => setYear((y) => y - 1)}
          aria-label="Anno precedente"
        >
          ‹
        </button>
        <span className={styles.year}>{year}</span>
        <button
          className={styles.navBtn}
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= currentYear}
          aria-label="Anno successivo"
        >
          ›
        </button>
      </div>

      <div className={styles.scroll}>
        <div className={styles.grid}>
          {/* Etichette dei mesi allineate sopra le colonne */}
          <div className={styles.monthRow}>
            {months.map((m) => (
              <span
                key={m.month}
                className={styles.monthLabel}
                style={{ gridColumnStart: m.weekIndex + 2 }}
              >
                {monthLabel(m.month).slice(0, 3)}
              </span>
            ))}
          </div>

          <div className={styles.matrix}>
            {/* Colonna delle etichette dei giorni */}
            <div className={styles.weekdays}>
              {WEEKDAY_LABELS.map((label, i) => (
                <span key={i} className={styles.weekdayLabel}>
                  {label}
                </span>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className={styles.column}>
                {week.map((cell, di) =>
                  cell === null ? (
                    <div key={di} className={styles.cellEmpty} />
                  ) : (
                    <div
                      key={di}
                      className={styles.cell}
                      style={{ backgroundColor: `var(--heatmap-${cell.level})` }}
                      onMouseEnter={() => setHovered(cell)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slot del tooltip ad altezza fissa: il riquadro col dettaglio del giorno
          appare qui quando passi sopra una cella. Lo spazio è SEMPRE riservato,
          così comparsa e scomparsa non spostano il resto della pagina: prima il
          tooltip era nel flusso normale e, apparendo/sparendo, faceva "sobbalzare"
          la vista a ogni giorno su cui passavo il mouse. */}
      <div className={styles.tooltipSlot}>
        {hovered && (
          <div className={styles.tooltip}>
            <strong>{formatLong(hovered.date)}</strong>
            <span>
              {hovered.completed} su {hovered.total} abitudini completate
            </span>
          </div>
        )}
      </div>

      <div className={styles.legend}>
        <span>Meno</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={styles.legendCell}
            style={{ backgroundColor: `var(--heatmap-${level})` }}
          />
        ))}
        <span>Più</span>
      </div>
    </div>
  );
}
