// Service worker de Firebase Cloud Messaging — necesario para que las notificaciones push
// lleguen aunque el navegador esté minimizado o completamente cerrado.
// Debe vivir en la RAÍZ del sitio (mismo nivel que student.html) para cubrir todo el dominio.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyB8M29ujqCEatEZMaNHbGEyDmfygipG_Y0",
  authDomain:        "maths-level-up.firebaseapp.com",
  projectId:         "maths-level-up",
  storageBucket:     "maths-level-up.firebasestorage.app",
  messagingSenderId: "854549565666",
  appId:             "1:854549565666:web:2613613306c6cb16b30ebb"
});

const messaging = firebase.messaging();

// Pestaña cerrada / minimizada / en otra app: Chrome despierta este service worker con el push
// y nosotros decidimos cómo se ve la notificación del sistema (Windows/macOS/Android).
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  const data = payload.data || {};
  self.registration.showNotification(title || 'Nuevo mensaje', {
    body: body || '',
    icon: '/favicon.svg',
    tag: data.tag || undefined,
    data
  });
});

// Clic en la notificación: enfoca una pestaña ya abierta del sitio, o abre una nueva.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = self.location.origin + (event.notification.data?.url || '/student/tareas');
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find(c => c.url.startsWith(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
