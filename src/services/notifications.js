// Notifiche locali della PWA via Notification API + service worker: showNotification
// passa dal SW, cosi' compare anche con l'app installata. Il permesso si chiede in modo
// contestuale (pulsante in Profilo), non all'avvio.

export function notificationsSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  );
}

// 'granted' | 'denied' | 'default' | 'unsupported'
export function permissionStatus() {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.requestPermission();
}

// Dal service worker se c'e' (serve alla PWA installata), altrimenti dal
// costruttore. getRegistration() e non ready: senza SW registrato ready non si
// risolve mai e la funzione resta appesa (caso di npm run dev).
export async function showNotification(title, options = {}) {
  if (permissionStatus() !== 'granted') return false;
  const opts = { icon: '/icon-192.png', badge: '/icon-192.png', ...options };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, opts);
      return true;
    }
  } catch {
    // Cade sul fallback sotto.
  }
  new Notification(title, opts);
  return true;
}
