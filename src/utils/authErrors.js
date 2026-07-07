// Traduce i codici di errore di Firebase Auth in messaggi chiari in italiano.
// Per gli errori non previsti (es. il timeout di Firestore) uso il messaggio
// dell'errore stesso, che e' gia' esplicativo.
export function mapAuthError(err) {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email o password non corretti.';
    case 'auth/email-already-in-use':
      return 'Esiste già un account con questa email. Prova ad accedere.';
    case 'auth/invalid-email':
      return 'Email non valida.';
    case 'auth/weak-password':
      return 'La password deve avere almeno 6 caratteri.';
    case 'auth/too-many-requests':
      return 'Troppi tentativi. Riprova tra qualche minuto.';
    case 'auth/network-request-failed':
      return 'Problema di rete: controlla la connessione e riprova.';
    default:
      return err?.message || 'Si è verificato un errore. Riprova.';
  }
}
