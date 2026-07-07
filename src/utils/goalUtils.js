import { today } from './dateUtils';

// Progresso di un obiettivo: se collegato a un'abitudine conto i completamenti di quella
// tra inizio e scadenza (automatico); se manuale uso il contatore salvato goal.progress.
export function goalProgress(goal, completions) {
  if (goal.linkedHabitId) {
    return Object.entries(completions).filter(([iso, ids]) => {
      if (!Array.isArray(ids) || !ids.includes(goal.linkedHabitId)) return false;
      if (goal.createdAt && iso < goal.createdAt) return false;
      if (goal.deadline && iso > goal.deadline) return false;
      return true;
    }).length;
  }
  return goal.progress || 0;
}

// Stato derivato: raggiunto il target -> completato; scaduto senza raggiungerlo ->
// fallito; altrimenti in corso. Lo stato "vero" e' sempre calcolato dai dati, cosi
// non puo' andare fuori sincrono.
export function goalStatus(goal, completions) {
  const value = goalProgress(goal, completions);
  const target = goal.target?.value ?? 0;
  if (target > 0 && value >= target) return 'completed';
  if (goal.deadline && today() > goal.deadline) return 'failed';
  return 'active';
}

// Percentuale 0..100 verso il target, per la barra di avanzamento.
export function goalPercent(goal, completions) {
  const target = goal.target?.value ?? 0;
  if (target <= 0) return 0;
  return Math.min(100, Math.round((goalProgress(goal, completions) / target) * 100));
}
