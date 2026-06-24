// Palavras do Universo — Service Worker
// Handles push notifications for daily messages

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
    icon: payload.icon ?? "/assets/palavrasuniverso.webp",
    tag: payload.tag ?? "pdu-daily",
    renotify: true,
    data: { url: payload.url ?? "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
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
