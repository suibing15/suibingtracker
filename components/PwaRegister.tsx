"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Check for a new service worker version every time the tab
        // regains focus, not just on the initial load — catches updates
        // published while the app was sitting open in the background.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update().catch(() => {});
        });
      })
      .catch(() => {
        // Non-fatal — the app works fine without the service worker,
        // it just won't be installable/offline-capable.
      });

    // When a new service worker takes control (after skipWaiting +
    // clients.claim on our end), reload once so the open tab actually
    // picks up the new version instead of silently running stale code
    // until the next manual refresh. Guarded so it only fires once.
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }, []);

  return null;
}
