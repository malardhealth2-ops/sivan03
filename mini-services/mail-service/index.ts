/**
 * Sivan Internal Mail Service
 * ==========================
 *
 * A self-hosted mail-sending service that uses the site's own domain
 * (noreply@sivantaxi.com) as the sender identity. Two delivery modes:
 *
 *   1) DIRECT MX DELIVERY (default)
 *      Looks up the recipient's MX records (DNS) and connects directly to
 *      the destination mail server on port 25. This is how real MTAs work.
 *      Requires outbound port 25 to be open (typically works on a VPS but
 *      is blocked by most cloud providers — see mode 2 for that case).
 *
 *   2) SMTP RELAY (optional)
 *      If admin configures relayHost + relayUser + relayPass in SiteSettings,
 *      the service authenticates against that relay (e.g. user's own mail
 *      server, Postfix, Mailcow, Amazon SES, Brevo SMTP, etc.) and sends
 *      through it. Works on any port the relay exposes (587, 465, 2525).
 *
 * All sent emails are persisted in the EmailMessage table with full status
 * (queued → sending → sent | failed), error messages, attempt counts, and
 * the MX host that was contacted. The admin UI can list, view, retry.
 *
 * Runs as a Bun mini-service on port 3004. The Next.js app calls it via
 * the gateway using ?XTransformPort=3004.
 *
 * Endpoints:
 *   POST /send       body: { to, toName?, subject, html, text?, source?, refId? }
 *   POST /retry/:id  retry a failed email
 *   GET  /health
 */

import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { promises as dns } from 'dns';
import { Buffer } from 'buffer';

const PORT = 3004;
const DB_URL = 'file:/home/z/my-project/db/custom.db';

// Prisma needs DATABASE_URL in env
process.env.DATABASE_URL = DB_URL;

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface SenderIdentity {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  // Relay config (optional)
  relayHost: string;
  relayPort: string;
  relayUser: string;
  relayPass: string;
}

async function loadSenderIdentity(): Promise<SenderIdentity | null> {
  const s = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
  if (!s) return null;
  return {
    fromName: s.mailSenderName || 'تاکسی ویژه سیوان',
    fromEmail: s.mailSenderEmail || 'noreply@sivantaxi.com',
    replyTo: s.mailReplyTo || s.mailSenderEmail || 'noreply@sivantaxi.com',
    relayHost: s.relayHost || '',
    relayPort: s.relayPort || '587',
    relayUser: s.relayUser || '',
    relayPass: s.relayPass || '',
  };
}

function htmlToText(html: string): string {
  // Minimal HTML→text conversion for plain-text alternative part
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Look up MX records for a recipient domain and return sorted list. */
async function resolveMxRecords(email: string): Promise<{ exchange: string; priority: number }[]> {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) throw new Error('Invalid email address');

  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      throw new Error(`No MX records found for ${domain}`);
    }
    // Lower priority = preferred
    return records.sort((a, b) => a.priority - b.priority);
  } catch (err) {
    throw new Error(`MX lookup failed for ${domain}: ${(err as Error).message}`);
  }
}

/** Build a nodemailer transporter for direct MX delivery to a specific host. */
function buildDirectTransporter(mxHost: string) {
  return nodemailer.createTransport({
    host: mxHost,
    port: 25,
    secure: false,
    // Don't authenticate — direct MX delivery is unauthenticated SMTP
    // (the receiving server decides whether to accept based on SPF/DKIM/DMARC).
    tls: { rejectUnauthorized: false }, // some MX servers have self-signed certs
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

/** Build a nodemailer transporter for an authenticated SMTP relay. */
function buildRelayTransporter(cfg: SenderIdentity) {
  const port = parseInt(cfg.relayPort || '587', 10);
  return nodemailer.createTransport({
    host: cfg.relayHost,
    port,
    secure: port === 465,
    auth: cfg.relayUser
      ? { user: cfg.relayUser, pass: cfg.relayPass }
      : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 20000,
  });
}

interface SendResult {
  ok: boolean;
  mxHost?: string;
  error?: string;
}

/** Actually send an email via either relay or direct MX, returns delivery result. */
async function deliverEmail(
  cfg: SenderIdentity,
  to: string,
  toName: string | undefined,
  subject: string,
  html: string,
  text: string,
): Promise<SendResult> {
  const from = `"${cfg.fromName}" <${cfg.fromEmail}>`;
  const mailOptions = {
    from,
    to: toName ? `"${toName}" <${to}>` : to,
    replyTo: cfg.replyTo,
    subject,
    text,
    html,
    headers: {
      'X-Mailer': 'SivanMail/1.0',
      'X-Site': 'https://sivantaxi.com',
      'Auto-Submitted': 'auto-generated',
    },
  };

  // Wrap the entire delivery in a hard 30-second timeout so we never get stuck
  // in 'sending' state forever (e.g. when DNS lookup hangs or all MX servers hang).
  const timeoutWrapper = <T>(p: Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Delivery timed out after 30s')), 30000);
      p.then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e); },
      );
    });
  };

  try {
    // Mode 2: SMTP relay (preferred when configured)
    if (cfg.relayHost && cfg.relayUser) {
      try {
        const transporter = buildRelayTransporter(cfg);
        await timeoutWrapper(transporter.sendMail(mailOptions));
        return { ok: true, mxHost: `${cfg.relayHost}:${cfg.relayPort}` };
      } catch (err) {
        return { ok: false, mxHost: `${cfg.relayHost}:${cfg.relayPort}`, error: (err as Error).message };
      }
    }

    // Mode 1: Direct MX delivery
    const mxRecords = await resolveMxRecords(to);
    // Only try the first 2 MX records (sorted by priority) to keep response time reasonable.
    let lastError = '';
    for (const mx of mxRecords.slice(0, 2)) {
      try {
        const transporter = buildDirectTransporter(mx.exchange);
        await timeoutWrapper(transporter.sendMail(mailOptions));
        return { ok: true, mxHost: mx.exchange };
      } catch (err) {
        lastError = `${mx.exchange}: ${(err as Error).message}`;
        // Try next MX
      }
    }
    return { ok: false, error: `All MX servers failed. ${lastError}` };
  } catch (err) {
    return { ok: false, error: `Delivery failed: ${(err as Error).message}` };
  }
}

// ─── Email record management ─────────────────────────────────────────────────

interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  source?: string; // manual | booking | system
  refId?: string;
}

async function enqueueAndSend(input: SendEmailInput): Promise<{ id: string; status: string }> {
  const cfg = await loadSenderIdentity();
  if (!cfg) throw new Error('Site settings not configured');

  // Create the email record in 'queued' state
  const record = await prisma.emailMessage.create({
    data: {
      fromName: cfg.fromName,
      fromEmail: cfg.fromEmail,
      replyTo: cfg.replyTo,
      toEmail: input.to,
      toName: input.toName || null,
      subject: input.subject,
      textBody: input.text || htmlToText(input.html),
      htmlBody: input.html,
      status: 'sending',
      source: input.source || 'manual',
      refId: input.refId || null,
      attemptCount: 1,
    },
  });

  const result = await deliverEmail(
    cfg,
    input.to,
    input.toName,
    input.subject,
    input.html,
    input.text || htmlToText(input.html),
  );

  const updated = await prisma.emailMessage.update({
    where: { id: record.id },
    data: {
      status: result.ok ? 'sent' : 'failed',
      mxHost: result.mxHost || null,
      lastError: result.error || null,
      sentAt: result.ok ? new Date() : null,
    },
  });

  return { id: updated.id, status: updated.status };
}

async function retryEmail(id: string): Promise<{ id: string; status: string; error?: string }> {
  const record = await prisma.emailMessage.findUnique({ where: { id } });
  if (!record) throw new Error('Email not found');
  if (record.status === 'sent') return { id, status: 'sent' };

  const cfg = await loadSenderIdentity();
  if (!cfg) throw new Error('Site settings not configured');

  await prisma.emailMessage.update({
    where: { id },
    data: { status: 'sending', attemptCount: { increment: 1 }, lastError: null },
  });

  const result = await deliverEmail(
    cfg,
    record.toEmail,
    record.toName || undefined,
    record.subject,
    record.htmlBody,
    record.textBody,
  );

  const updated = await prisma.emailMessage.update({
    where: { id },
    data: {
      status: result.ok ? 'sent' : 'failed',
      mxHost: result.mxHost || record.mxHost,
      lastError: result.error || null,
      sentAt: result.ok ? new Date() : record.sentAt,
    },
  });

  return { id: updated.id, status: updated.status, error: result.error };
}

// ─── HTTP server ─────────────────────────────────────────────────────────────

function jsonRes(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function readBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // CORS (allow the Next.js app to call us through the gateway)
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      // Health check
      if (path === '/health' && method === 'GET') {
        return jsonRes({ ok: true, service: 'sivan-mail', port: PORT, time: new Date().toISOString() });
      }

      // Send a new email
      if (path === '/send' && method === 'POST') {
        const body = (await readBody(req)) as SendEmailInput;
        if (!body.to || !body.subject || !body.html) {
          return jsonRes({ ok: false, error: 'فیلدهای to، subject و html الزامی هستند.' }, 400);
        }
        const result = await enqueueAndSend(body);
        return jsonRes({ ok: true, id: result.id, status: result.status });
      }

      // Retry a failed email
      const retryMatch = path.match(/^\/retry\/([\w-]+)$/);
      if (retryMatch && method === 'POST') {
        const result = await retryEmail(retryMatch[1]);
        return jsonRes({ ok: true, id: result.id, status: result.status, error: result.error });
      }

      return jsonRes({ error: 'Not found' }, 404);
    } catch (err) {
      console.error('[mail-service] error:', err);
      return jsonRes({ ok: false, error: (err as Error).message }, 500);
    }
  },
});

console.log(`📧 Sivan mail service listening on http://localhost:${server.port}`);
console.log(`   Mode: relay if configured, otherwise direct MX delivery on port 25`);

// Keep process alive + graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
