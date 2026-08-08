import webpush from 'web-push';
import { db } from '@/lib/db';

/**
 * Web Push notification helper for Sivan VIP Taxi.
 *
 * Uses VAPID (Voluntary Application Server Identification) keys stored in env:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 *
 * Flow:
 *   1. Browser subscribes via PushManager (in PWARegister.tsx)
 *   2. Subscription {endpoint, keys.p256dh, keys.auth} POSTed to /api/push/subscribe
 *   3. Saved in PushSubscription table
 *   4. Server sends push via web-push to all stored subscriptions
 *   5. Service worker (sw.js) receives 'push' event and showsNotification
 */

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@sivantaxi.com';

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY || '';
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  actions?: { action: string; title: string }[];
  renotify?: boolean;
}

/**
 * Send a push notification to ALL subscribed admin devices.
 * Returns summary of successes/failures. Never throws.
 */
export async function sendPushToAll(payload: PushPayload): Promise<{
  sent: number;
  failed: number;
  removed: number;
}> {
  try {
    ensureConfigured();
  } catch (e) {
    console.error('[push] VAPID not configured:', e);
    return { sent: 0, failed: 0, removed: 0 };
  }

  const subs = await db.pushSubscription.findMany();
  if (subs.length === 0) {
    return { sent: 0, failed: 0, removed: 0 };
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || 'sivan-notification',
    renotify: payload.renotify ?? true,
    data: { url: payload.url || '/' },
    actions: payload.actions || [
      { action: 'open', title: 'مشاهده' },
      { action: 'close', title: 'بستن' },
    ],
  });

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dhKey,
              auth: sub.authKey,
            },
          },
          pushPayload
        );
        return { ok: true, endpoint: sub.endpoint };
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        // 404 = subscription expired, 410 = gone — remove from DB
        if (status === 404 || status === 410) {
          await db.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
          return { ok: false, endpoint: sub.endpoint, removed: true };
        }
        throw err;
      }
    })
  );

  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const r of results) {
    if (r.status === 'fulfilled') {
      if (r.value.ok) sent++;
      else if ((r.value as { removed?: boolean }).removed) removed++;
      else failed++;
    } else {
      failed++;
    }
  }

  return { sent, failed, removed };
}

/**
 * Save (or update) a push subscription in the DB.
 */
export async function saveSubscription(
  endpoint: string,
  p256dhKey: string,
  authKey: string,
  label?: string,
  userAgent?: string
) {
  return db.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dhKey, authKey, label: label || '', userAgent },
    update: { p256dhKey, authKey, label: label || undefined, userAgent, updatedAt: new Date() },
  });
}

/**
 * Remove a push subscription (e.g. when user unsubscribes).
 */
export async function removeSubscription(endpoint: string) {
  return db.pushSubscription.deleteMany({ where: { endpoint } });
}

/**
 * List all subscriptions (for admin UI).
 */
export async function listSubscriptions() {
  return db.pushSubscription.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      endpoint: true,
      label: true,
      userAgent: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
