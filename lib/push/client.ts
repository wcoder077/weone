"use client";

// Browser side of Web Push: register the service worker, ask for permission, subscribe.

const SW_PATH = "/sw.js";

export type PushSupport = "unsupported" | "needs-install" | "ready";

export function getPushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const hasPush = typeof PushManager !== "undefined" && typeof Notification !== "undefined";
  if ("serviceWorker" in navigator && hasPush) return "ready";
  // iPhone / iPad only get Web Push for sites added to the Home Screen.
  const isApple = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return isApple ? "needs-install" : "unsupported";
}

function toApplicationServerKey(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob((base64Url + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function toBase64Url(buffer: ArrayBuffer | null) {
  if (!buffer) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function registration() {
  return navigator.serviceWorker.register(SW_PATH, { scope: "/" });
}

export async function getCurrentSubscription() {
  if (getPushSupport() !== "ready") return null;
  const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export type SubscribeResult =
  | { ok: true; endpoint: string; p256dh: string; auth: string }
  | { ok: false; reason: "denied" | "failed" | "not-configured" };

// Must be called from a click: browsers only show the permission prompt after a user gesture.
export async function subscribeToPush(): Promise<SubscribeResult> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return { ok: false, reason: "not-configured" };
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, reason: "denied" };
    const reg = await registration();
    await navigator.serviceWorker.ready;
    const subscription =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toApplicationServerKey(publicKey) }));
    return {
      ok: true,
      endpoint: subscription.endpoint,
      p256dh: toBase64Url(subscription.getKey("p256dh")),
      auth: toBase64Url(subscription.getKey("auth")),
    };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

export async function unsubscribeFromPush() {
  const subscription = await getCurrentSubscription();
  if (!subscription) return null;
  const { endpoint } = subscription;
  await subscription.unsubscribe();
  return endpoint;
}
