"use client";

import { useEffect, useState } from "react";

export type PushState = "unsupported" | "default" | "granted" | "denied" | "loading";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
  return arr.buffer as ArrayBuffer;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    const updateState = (nextState: PushState) => {
      if (!cancelled) window.setTimeout(() => setState(nextState), 0);
    };

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      updateState("unsupported");
      return () => {
        cancelled = true;
      };
    }

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(async (reg) => {
        if (cancelled) return;
        const existing = await reg.pushManager.getSubscription();
        if (cancelled) return;
        if (existing) {
          setSubscription(existing);
          updateState("granted");
        } else {
          updateState(Notification.permission === "denied" ? "denied" : "default");
        }
      })
      .catch(() => updateState("unsupported"));

    return () => {
      cancelled = true;
    };
  }, []);

  async function subscribe(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) return false;
    setState("loading");

    try {
      const keyRes = await fetch("/api/push/vapid-public-key");
      if (!keyRes.ok) {
        setState("default");
        return false;
      }
      const { publicKey } = (await keyRes.json()) as { publicKey: string };

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      setSubscription(sub);
      setState("granted");
      return true;
    } catch {
      setState(Notification.permission === "denied" ? "denied" : "default");
      return false;
    }
  }

  async function unsubscribe(): Promise<void> {
    if (!subscription) return;
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    await subscription.unsubscribe();
    setSubscription(null);
    setState("default");
  }

  return { state, subscribe, unsubscribe };
}
