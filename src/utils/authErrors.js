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
    case 'auth/missing-email':
      return 'Inserisci la tua email.';
    case 'auth/requires-recent-login':
      return 'Per sicurezza devi accedere di nuovo prima di cambiare la password.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Accesso annullato.';
    case 'auth/popup-blocked':
      return 'Il browser ha bloccato la finestra di accesso: consenti i popup e riprova.';
    case 'auth/account-exists-with-different-credential':
      return 'Esiste già un account con questa email, registrato con un altro metodo.';
    case 'auth/operation-not-allowed':
      return 'Metodo di accesso non disponibile al momento.';
    case 'auth/unauthorized-domain':
      return 'Dominio non autorizzato per l\'accesso con Google.';
    default:
      return err?.message || 'Si è verificato un errore. Riprova.';
  }
}
