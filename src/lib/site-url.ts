import { db } from '@/lib/db';

/**
 * Default site URL fallback used when the SiteSettings row is missing or the
 * siteUrl field is empty. Mirrors the Prisma default value for SiteSettings.siteUrl.
 */
export const DEFAULT_SITE_URL = 'https://sivantaxi.com';

let cachedSiteUrl: string | null = null;
let inflight: Promise<string> | null = null;

/**
 * Returns the absolute base URL of the site (no trailing slash).
 *
 * Reads `siteUrl` from the SiteSettings DB row (id='main') and caches the
 * result in a module-level variable so repeated calls during a single render
 * pass (and for the rest of the process lifetime) don't hit the DB again.
 *
 * Falls back to DEFAULT_SITE_URL on any error or missing value.
 */
export async function getSiteUrl(): Promise<string> {
  if (cachedSiteUrl) return cachedSiteUrl;

  if (!inflight) {
    inflight = (async () => {
      try {
        const settings = await db.siteSettings.findUnique({ where: { id: 'main' } });
        const url = (settings?.siteUrl || DEFAULT_SITE_URL).trim().replace(/\/+$/, '');
        cachedSiteUrl = url;
        return url;
      } catch {
        cachedSiteUrl = DEFAULT_SITE_URL;
        return DEFAULT_SITE_URL;
      } finally {
        // Allow subsequent independent calls to re-use the cache; clear only
        // the in-flight promise tracker so a new call after a cache miss can
        // run again if needed (it won't, because cachedSiteUrl is now set).
        inflight = null;
      }
    })();
  }

  return inflight;
}

/**
 * Build an absolute URL from a path that may be relative or absolute.
 * Uses getSiteUrl() as the base when the path is relative.
 */
export async function absoluteUrl(path: string): Promise<string> {
  const base = await getSiteUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
