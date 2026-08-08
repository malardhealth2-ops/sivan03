'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  // Lazy init: detect standalone (already installed) on first render — avoids setState-in-effect.
  const [installed, setInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true
    );
  });

  // Register service worker (PRODUCTION ONLY).
  // In dev mode the SW's chunk caching breaks Next.js Turbopack HMR — cached
  // /_next/* chunks with stale hashes get served after recompile and React
  // throws "client-side exception". So we never register the SW during dev,
  // and we also proactively UNREGISTER any SW + clear caches that a previous
  // dev session may have left behind (so the broken preview self-heals).
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Always clean up leftover SW + caches in dev so stale chunks don't
    // keep getting served after the server has recompiled.
    if (process.env.NODE_ENV !== 'production') {
      (async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          if (regs.length > 0) {
            // Force a clean reload so no stale SW-controlled response remains.
            window.location.reload();
          }
        } catch (err) {
          console.warn('[PWA] dev cleanup failed:', err);
        }
      })();
      return;
    }

    // Production: register the SW.
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
        })
        .catch((err) => console.warn('[PWA] SW registration failed:', err));
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  // Listen for beforeinstallprompt + appinstalled
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };
    const installedHandler = () => {
      setInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  }, [deferredPrompt]);

  if (installed) return null;

  return (
    <AnimatePresence>
      {showInstallBanner && (
        <motion.div
          initial={{ opacity: 0, y: 40, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 40, x: '-50%' }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-1/2 z-[200] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="bg-[#1a1a1a] border border-[#D4AF37]/40 rounded-2xl shadow-2xl shadow-black/50 p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#fafafa] text-sm font-bold">نصب اپلیکیشن سیوان</p>
              <p className="text-[#a1a1aa] text-xs mt-0.5">
                روی گوشی یا کامپیوتر نصب کنید و دسترسی سریع داشته باشید
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleInstall}
                className="bg-[#D4AF37] hover:bg-[#E5C76B] text-[#0a0a0a] text-xs font-bold px-3 py-2 rounded-lg transition-colors"
              >
                نصب
              </button>
              <button
                type="button"
                aria-label="بستن"
                onClick={() => setShowInstallBanner(false)}
                className="text-[#a1a1aa] hover:text-[#fafafa] p-1.5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---- Notification permission + push subscription helper ---- */

/**
 * Request notification permission and subscribe to push notifications.
 * Returns the PushSubscription or null.
 */
export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[PWA] Push not supported');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('[PWA] Notification permission denied');
    return null;
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();

  if (!sub) {
    if (!vapidPublicKey) {
      console.error('[PWA] No VAPID public key provided');
      return null;
    }
    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });
  }

  return sub;
}

/** Convert base64url VAPID key to Uint8Array for PushManager. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

/** Check if notifications are supported. */
export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/** Get current notification permission state. */
export function getPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}
