/**
 * Next.js Instrumentation
 *
 * The `register()` function runs once when the Next.js server starts.
 * This is the standard Next.js hook for server-side initialization.
 * It works in both `next dev` and production builds.
 *
 * Here we start the integrated blog scheduler so that article generation
 * resumes automatically after every deploy/restart — no separate mini-service needed.
 */

export async function register() {
  // Defer the import so the heavy blog-scheduler module is only loaded
  // after the Next.js server is ready to accept requests.
  setTimeout(async () => {
    try {
      const { init } = await import('@/lib/blog-scheduler');
      await init();
    } catch (err) {
      console.error('[instrumentation] blog-scheduler init failed:', err);
    }
  }, 2000); // 2s delay to let the server fully boot
}
