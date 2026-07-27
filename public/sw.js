// Palavras do Universo — Service Worker
// Handles push notifications for daily messages

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Palavras do Universo", body: event.data.text() };
  }

  const title = payload.title ?? "Palavras do Universo";
  const options = {
    body: payload.body ?? "Sua mensagem de hoje está pronta.",
    icon: payload.icon ?? "/assets/palavras-symbol.webp",
    tag: payload.tag ?? "pdu-daily",
    renotify: true,
    data: { url: payload.url ?? "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let url = "/";
  try {
    const candidate = new URL(event.notification.data?.url ?? "/", self.location.origin);
    url = candidate.origin === self.location.origin ? candidate.href : "/";
  } catch {
    url = "/";
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) return client.focus();
        }
        return clients.openWindow(url);
      })
  );
});
