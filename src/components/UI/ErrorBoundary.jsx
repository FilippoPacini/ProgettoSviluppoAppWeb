import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

// Senza boundary un errore in fase di render lascia la pagina bianca.
// Deve essere una classe: getDerivedStateFromError non ha equivalenti negli hook.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  // In fase di render: passa allo stato di fallback.
  static getDerivedStateFromError(error) {
    return { error };
  }

  // Dopo il commit: qui andrebbe l'invio a un servizio di monitoraggio.
  componentDidCatch(error, info) {
    console.error('Errore di rendering:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>Qualcosa si e' rotto</h1>
        <p className={styles.text}>
          Si e' verificato un errore imprevisto. I tuoi dati sono al sicuro su Firestore:
          ricaricando la pagina dovresti ritrovare tutto al suo posto.
        </p>
        <p className={styles.detail}>{this.state.error.message}</p>
        <button className={styles.button} onClick={() => window.location.reload()}>
          Ricarica la pagina
        </button>
      </div>
    );
  }
}
