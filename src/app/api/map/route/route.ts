import { NextRequest, NextResponse } from 'next/server';

// In-memory caches
const routeCache = new Map<string, unknown>();
const reverseGeoCache = new Map<string, string>();

// Rate limiter for Nominatim
let lastNominatimCall = 0;
const NOMINATIM_MIN_INTERVAL = 1100;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rateLimitedFetch(url: string, timeoutMs = 10000): Promise<Response> {
  const now = Date.now();
  const timeSinceLastCall = now - lastNominatimCall;
  if (timeSinceLastCall < NOMINATIM_MIN_INTERVAL) {
    await wait(NOMINATIM_MIN_INTERVAL - timeSinceLastCall);
  }
  lastNominatimCall = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SivanVIPTaxi/1.0',
        'Accept-Language': 'fa',
      },
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} ساعت${mins > 0 ? ` و ${mins} دقیقه` : ''}`;
  }
  return `${mins} دقیقه`;
}

function formatDistance(meters: number): number {
  return Math.round((meters / 1000) * 10) / 10;
}

// Reverse geocode coordinates to get place name using Nominatim
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = reverseGeoCache.get(key);
  if (cached) return cached;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fa&zoom=14`;
    const res = await rateLimitedFetch(url, 8000);

    if (!res.ok) return `${lat.toFixed(4)}، ${lng.toFixed(4)}`;

    const data = await res.json();
    if (!data || !data.display_name) return `${lat.toFixed(4)}، ${lng.toFixed(4)}`;

    const parts = data.display_name.split(',').map((s: string) => s.trim());
    const displayName = parts.slice(0, 3).join('، ');

    reverseGeoCache.set(key, displayName);
    return displayName;
  } catch {
    return `${lat.toFixed(4)}، ${lng.toFixed(4)}`;
  }
}

// Fetch route from OSRM with retry and fallback
async function fetchOSRMRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<Response | null> {
  const maxRetries = 3;
  const baseDelay = 800;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Try with alternatives first
    try {
      const urlWithAlts = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(urlWithAlts, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SivanVIPTaxi/1.0',
          'Accept-Encoding': 'gzip, deflate',
        },
      }).finally(() => clearTimeout(timeout));
      if (res.ok) return res;
      // If OSRM returns 4xx/5xx, wait and retry
      if (attempt < maxRetries - 1) {
        await wait(baseDelay * (attempt + 1));
        continue;
      }
    } catch {
      if (attempt < maxRetries - 1) {
        await wait(baseDelay * (attempt + 1));
        continue;
      }
    }
  }

  // Final fallback without alternatives
  try {
    const urlNoAlts = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(urlNoAlts, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SivanVIPTaxi/1.0',
        'Accept-Encoding': 'gzip, deflate',
      },
    }).finally(() => clearTimeout(timeout));
    if (res.ok) return res;
  } catch {
    // Failed
  }

  return null;
}

// GET /api/map/route?originLat=&originLng=&destLat=&destLng=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const originLat = parseFloat(searchParams.get('originLat') || '');
    const originLng = parseFloat(searchParams.get('originLng') || '');
    const destLat = parseFloat(searchParams.get('destLat') || '');
    const destLng = parseFloat(searchParams.get('destLng') || '');

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      return NextResponse.json({ error: 'مختصات مبدا و مقصد نامعتبر است' }, { status: 400 });
    }

    // Check cache
    const cacheKey = `${originLat.toFixed(3)},${originLng.toFixed(3)}-${destLat.toFixed(3)},${destLng.toFixed(3)}`;
    const cached = routeCache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Fetch route from OSRM with retry
    const response = await fetchOSRMRoute(originLat, originLng, destLat, destLng);

    if (!response) {
      return NextResponse.json(
        { error: 'خطا در اتصال به سرویس مسیریابی. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید.' },
        { status: 503 }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch {
      return NextResponse.json({ error: 'خطا در پردازش پاسخ مسیریابی.' }, { status: 500 });
    }

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json({ error: 'مسیری بین این دو نقطه یافت نشد' }, { status: 404 });
    }

    // Reverse geocode origin and destination
    const [originName, destName] = await Promise.all([
      reverseGeocode(originLat, originLng),
      reverseGeocode(destLat, destLng),
    ]);

    // Process routes
    const routes = data.routes.map((route: {
      distance: number;
      duration: number;
      geometry: { coordinates: number[][] };
    }, index: number) => {
      const path = route.geometry.coordinates.map(
        (coord: number[]) => [coord[1], coord[0]] as [number, number]
      );

      return {
        index,
        distanceKm: formatDistance(route.distance),
        durationMin: Math.round(route.duration / 60),
        durationFormatted: formatDuration(route.duration),
        path,
        steps: [] as { instruction: string; type: string; modifier?: string }[],
      };
    });

    const result = {
      origin: { lat: originLat, lng: originLng, name: originName },
      destination: { lat: destLat, lng: destLng, name: destName },
      routes,
      totalRoutes: routes.length,
    };

    routeCache.set(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Route API error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'خطا در محاسبه مسیر. لطفاً دوباره تلاش کنید.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'خطای ناشناخته' }, { status: 500 });
  }
}
