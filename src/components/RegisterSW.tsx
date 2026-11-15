"use client";

import { useEffect } from "react";

/** Registers the service worker in production builds only. */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Offline support is optional; the app works without it.
    });
  }, []);
  return null;
}
