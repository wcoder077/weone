// Service worker for push notifications. It does nothing else: no caching, no offline mode.
// badge-96.png is white on transparent: Android draws only its shape in the status bar.
// The server sends { title, body, url, tag }; see app/api/push/route.ts.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  event.waitUntil(
    (async () => {
      // The app is open and in front: it already shows the new message live.
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const inFront = windows.some((client) => client.visibilityState === "visible" && client.focused);
      if (inFront && data.tag !== "push-test") return;

      await self.registration.showNotification(data.title || "we1", {
        body: data.body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        data: { url: data.url || "/" },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin);
  // Only pages of this site.
  const url = target.origin === self.location.origin ? target.href : self.location.origin;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        await client.focus();
        if ("navigate" in client) await client.navigate(url).catch(() => undefined);
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
