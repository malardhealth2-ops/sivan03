import { NextRequest, NextResponse } from 'next/server';
import cityCoords from '@/data/city-coords.json';

// In-memory caches
const geoCache = new Map<string, { lat: number; lng: number }>();
const distCache = new Map<string, { distanceKm: number; durationMin: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiter for Nominatim (max 1 req/sec)
let lastNominatimCall = 0;
const NOMINATIM_MIN_INTERVAL = 1200; // ms

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rateLimitedFetch(url: string, timeoutMs = 8000): Promise<Response> {
  // Rate limit: wait at least NOMINATIM_MIN_INTERVAL since last call
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

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDrivingDistance(haversineKm: number): number {
  // Driving distance is typically 1.2-1.4x straight-line distance
  return haversineKm * 1.3;
}

async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number } | null> {
  // 1. Check pre-loaded coordinates
  const preloaded = (cityCoords as Record<string, { lat: number; lng: number }>)[cityName];
  if (preloaded) return preloaded;

  // 2. Check runtime cache
  const cached = geoCache.get(cityName);
  if (cached) return cached;

  // 3. Try Nominatim
  try {
    const query = encodeURIComponent(cityName + ', ایران');
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&accept-language=fa`;

    const response = await rateLimitedFetch(url, 8000);

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };

    geoCache.set(cityName, result);
    return result;
  } catch {
    return null;
  }
}

async function calculateRouteDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<{ distanceKm: number; durationMin: number } | null> {
  // Check cache
  const key = `${originLat.toFixed(2)},${originLng.toFixed(2)}-${destLat.toFixed(2)},${destLng.toFixed(2)}`;
  const cached = distCache.get(key);
  if (cached) return cached;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SivanVIPTaxi/1.0' },
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const result = {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round(route.duration / 60),
    };

    distCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours} ساعت${mins > 0 ? ` و ${mins} دقیقه` : ''}`;
  }
  return `${mins} دقیقه`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (!origin || !destination) {
      return NextResponse.json({ error: 'مبدا و مقصد باید مشخص شود' }, { status: 400 });
    }

    if (origin === destination) {
      return NextResponse.json({ error: 'مبدا و مقصد نباید یکسان باشد' }, { status: 400 });
    }

    // Geocode both cities
    const [originGeo, destGeo] = await Promise.all([
      geocodeCity(origin),
      geocodeCity(destination),
    ]);

    if (!originGeo) {
      return NextResponse.json({ error: `موقعیت "${origin}" یافت نشد` }, { status: 404 });
    }
    if (!destGeo) {
      return NextResponse.json({ error: `موقعیت "${destination}" یافت نشد` }, { status: 404 });
    }

    // Try OSRM routing first
    const routeResult = await calculateRouteDistance(
      originGeo.lat,
      originGeo.lng,
      destGeo.lat,
      destGeo.lng
    );

    let distanceKm: number;
    let durationMin: number;
    let source: string;

    if (routeResult) {
      distanceKm = routeResult.distanceKm;
      durationMin = routeResult.durationMin;
      source = 'osrm';
    } else {
      // Fallback to Haversine estimate
      const haversineKm = haversineDistance(
        originGeo.lat,
        originGeo.lng,
        destGeo.lat,
        destGeo.lng
      );
      distanceKm = Math.round(estimateDrivingDistance(haversineKm) * 10) / 10;
      durationMin = Math.round((distanceKm / 80) * 60); // assume avg 80 km/h
      source = 'estimate';
    }

    return NextResponse.json({
      origin: { name: origin, lat: originGeo.lat, lng: originGeo.lng },
      destination: { name: destination, lat: destGeo.lat, lng: destGeo.lng },
      distanceKm,
      durationMin,
      durationFormatted: formatDuration(durationMin),
      source,
    });
  } catch {
    return NextResponse.json({ error: 'خطا در محاسبه فاصله' }, { status: 500 });
  }
}
