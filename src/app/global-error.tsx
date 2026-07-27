'use client';

/**
 * Global error boundary (must be a client component).
 * Catches uncaught client-side exceptions that take down the whole React tree
 * — e.g. when a stale service worker serves /_next/* chunks with outdated
 * hashes after a Turbopack recompile. Instead of the scary blank
 * "Application error: a client-side exception has occurred" page, we show a
 * friendly Persian message and attempt to self-heal by unregistering any
 * stale service worker + clearing caches, then reload automatically.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Self-heal: unregister stale SW + clear caches, then reload once.
  const selfHeal = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  // Try to self-heal automatically on first mount (best effort).
  if (typeof window !== 'undefined') {
    selfHeal();
  }

  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#fafafa',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Tahoma, "Vazirmatn", sans-serif',
          padding: '1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div
            style={{
              fontSize: 40,
              marginBottom: 16,
              color: '#D4AF37',
            }}
          >
            ⚠️
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 12,
              color: '#D4AF37',
            }}
          >
            خطای نمایش صفحه
          </h1>
          <p
            style={{
              color: '#a1a1aa',
              fontSize: 14,
              lineHeight: 1.8,
              marginBottom: 24,
            }}
          >
            در بارگذاری صفحه مشکلی رخ داد. این مشکل معمولاً به‌دلیل نسخه کش‌شده
            قدیمی برنامه رخ می‌دهد و در حال رفع خودکار است…
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: '#D4AF37',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            تلاش مجدد
          </button>
          <button
            type="button"
            onClick={selfHeal}
            style={{
              background: 'transparent',
              color: '#a1a1aa',
              border: '1px solid #333',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              marginRight: 8,
            }}
          >
            پاک‌سازی و بارگذاری مجدد
          </button>
          {error?.message && (
            <pre
              style={{
                marginTop: 24,
                padding: 12,
                background: '#111',
                border: '1px solid #333',
                borderRadius: 8,
                color: '#888',
                fontSize: 11,
                textAlign: 'left' as const,
                direction: 'ltr' as const,
                overflow: 'auto',
                maxWidth: '100%',
              }}
            >
              {error.message}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
