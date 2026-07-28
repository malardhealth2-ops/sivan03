import { NextRequest, NextResponse } from 'next/server';
import { getPricingConfig, calculateFare, rateForTripType } from '@/lib/pricing';

// In-memory caches
// NOTE: Route cache disabled to prevent stale 2-point fallbacks from being served.
// Previously, a failed OSRM call would cache a 2-point direct-distance path, and subsequent
// requests for the same coordinates would return the stale cached response instead of retrying OSRM.
// const routeCache = new Map<string, unknown>();
const reverseGeoCache = new Map<string, string>();

// Rate limiter for Nominatim
let lastNominatimCall = 0;
const NOMINATIM_MIN_INTERVAL = 1200;

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

// Haversine formula for direct distance between two points
function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Reverse geocode coordinates to get place name using Nominatim
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = reverseGeoCache.get(key);
  if (cached) return cached;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fa&zoom=16&addressdetails=1`;
    const res = await rateLimitedFetch(url, 8000);

    if (!res.ok) return `${lat.toFixed(4)}، ${lng.toFixed(4)}`;

    const data = await res.json();
    if (!data || !data.display_name) return `${lat.toFixed(4)}، ${lng.toFixed(4)}`;

    const addr = data.address || {};
    const parts: string[] = [];
    if (addr.road || addr.pedestrian || addr.residential || addr.suburb || addr.neighbourhood) {
      const localName = addr.road || addr.pedestrian || addr.residential || addr.suburb || addr.neighbourhood;
      if (localName) parts.push(localName);
    }
    if (addr.city || addr.town || addr.village) {
      const cityName = addr.city || addr.town || addr.village;
      if (!parts.includes(cityName)) parts.push(cityName);
    }
    if (addr.state || addr.province) {
      const stateName = addr.state || addr.province;
      if (!parts.includes(stateName)) parts.push(stateName);
    }

    if (parts.length === 0) {
      const displayName = data.display_name.split(',').map((s: string) => s.trim());
      const displayNameClean = displayName.slice(0, 3).join('، ');
      reverseGeoCache.set(key, displayNameClean);
      return displayNameClean;
    }

    const cleanName = parts.slice(0, 3).join('، ');
    reverseGeoCache.set(key, cleanName);
    return cleanName;
  } catch {
    return `${lat.toFixed(4)}، ${lng.toFixed(4)}`;
  }
}

// OSRM server list for redundancy
const OSRM_SERVERS = [
  'https://router.project-osrm.org',
  'https://routing.openstreetmap.de/routed-car/route/v1',
];

// Fetch route from OSRM with retry across multiple servers
async function fetchOSRMRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<Response | null> {
  const maxRetries = 2;
  const baseDelay = 600;

  for (const server of OSRM_SERVERS) {
    // Try with alternatives first
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const urlWithAlts = `${server}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(urlWithAlts, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'SivanVIPTaxi/1.0',
            'Accept-Encoding': 'gzip, deflate',
          },
        }).finally(() => clearTimeout(timeout));
        if (res.ok) return res;
        if (attempt < maxRetries - 1) {
          await wait(baseDelay * (attempt + 1));
        }
      } catch {
        if (attempt < maxRetries - 1) {
          await wait(baseDelay * (attempt + 1));
        }
      }
    }

    // Try without alternatives
    try {
      const urlNoAlts = `${server}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(urlNoAlts, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SivanVIPTaxi/1.0',
          'Accept-Encoding': 'gzip, deflate',
        },
      }).finally(() => clearTimeout(timeout));
      if (res.ok) return res;
    } catch {
      // Try next server
    }
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

    // Route cache is disabled — see note above
    // const cacheKey = `${originLat.toFixed(3)},${originLng.toFixed(3)}-${destLat.toFixed(3)},${destLng.toFixed(3)}`;
    // const cached = routeCache.get(cacheKey);
    // if (cached) return NextResponse.json(cached);

    // Calculate direct distance always (as fallback and for pricing)
    const directDistanceKm = haversineDistanceKm(originLat, originLng, destLat, destLng);

    // Fetch route from OSRM
    const response = await fetchOSRMRoute(originLat, originLng, destLat, destLng);

    // Reverse geocode origin and destination (independent of route success)
    const [originName, destName] = await Promise.all([
      reverseGeocode(originLat, originLng),
      reverseGeocode(destLat, destLng),
    ]);

    // Get pricing config
    const pricingConfig = await getPricingConfig();

    let result: Record<string, unknown>;

    if (response) {
      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (data && data.routes && data.routes.length > 0) {
        // OSRM route found - use real road distance
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

        const roadDistanceKm = routes[0].distanceKm;
        console.log('[Route] Routes returned:', routes.length, 'path coords:', routes[0]?.path?.length);

        result = {
          origin: { lat: originLat, lng: originLng, name: originName },
          destination: { lat: destLat, lng: destLng, name: destName },
          routes,
          totalRoutes: routes.length,
          directDistanceKm,
          distanceSource: 'road', // road distance from OSRM
        };
      } else {
        // OSRM returned but no routes - use direct distance with direct line on map
        const estimatedDurationMin = Math.round((directDistanceKm / 80) * 60);
        result = {
          origin: { lat: originLat, lng: originLng, name: originName },
          destination: { lat: destLat, lng: destLng, name: destName },
          routes: [{
            index: 0,
            distanceKm: directDistanceKm,
            durationMin: estimatedDurationMin,
            durationFormatted: formatDuration(estimatedDurationMin * 60),
            path: [[originLat, originLng], [destLat, destLng]] as [number, number][],
            steps: [],
          }],
          totalRoutes: 1,
          directDistanceKm,
          distanceSource: 'direct',
        };
      }
    } else {
      // OSRM completely failed - use direct distance with direct line on map
      const estimatedDurationMin = Math.round((directDistanceKm / 80) * 60);
      result = {
        origin: { lat: originLat, lng: originLng, name: originName },
        destination: { lat: destLat, lng: destLng, name: destName },
        routes: [{
          index: 0,
          distanceKm: directDistanceKm,
          durationMin: estimatedDurationMin,
          durationFormatted: formatDuration(estimatedDurationMin * 60),
          path: [[originLat, originLng], [destLat, destLng]] as [number, number][],
          steps: [],
        }],
        totalRoutes: 1,
        directDistanceKm,
        distanceSource: 'direct',
      };
    }

    // Calculate pricing for all trip types based on distance
    const usedDistance = result.routes[0].distanceKm as number;
    const prices: Record<string, { price: number; ratePerKm: number }> = {};
    for (const type of ['economy', 'vip', 'luxury', 'van', 'electric']) {
      const fare = calculateFare(pricingConfig, type, usedDistance);
      prices[type] = { price: fare.price, ratePerKm: fare.ratePerKm };
    }
    result.pricing = prices;
    result.minFare = pricingConfig.minFare;

    // Route cache disabled — do NOT cache results
    // routeCache.set(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Route API error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'خطا در محاسبه مسیر. لطفاً دوباره تلاش کنید.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'خطای ناشناخته' }, { status: 500 });
  }
}
