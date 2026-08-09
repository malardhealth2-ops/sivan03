/**
 * Next.js Instrumentation
 *
 * The `register()` function runs once when the Next.js server starts.
 * This is the standard Next.js hook for server-side initialization.
 * It works in both `next dev` and production builds.
 */

export async function register() {
  // Blog scheduler is temporarily disabled for Vercel Edge compatibility
  // To re-enable, uncomment the code below:
  
  // setTimeout(async () => {
  //   try {
  //     const { init } = await import('@/lib/blog-scheduler');
  //     await init();
  //   } catch (err) {
  //     console.error('[instrumentation] blog-scheduler init failed:', err);
  //   }
  // }, 2000);
  
  console.log('[instrumentation] blog-scheduler disabled for Vercel deployment');
}