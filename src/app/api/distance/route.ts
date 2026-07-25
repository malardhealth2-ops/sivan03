import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for geocoding results
const geoCache = new Map<string, { lat: number; lng: number }>();
// In-memory cache for distance results
const distCache = new Map<string, { distanceKm: number; durationMin: number }>();

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function geocode(cityName: string): Promise<{ lat: number; lng: number }> {
  // Check cache
  const cached = geoCache.get(cityName);
  if (cached) return cached;

  const query = encodeURIComponent(cityName + ', ایران');
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&accept-language=fa`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SivanVIPTaxi/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('Geocoding service unavailable');
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    throw new Error(`City "${cityName}" not found`);
  }

  const result = {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };

  geoCache.set(cityName, result);
  return result;
}

async function calculateRouteDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<{ distanceKm: number; durationMin: number }> {
  // Create cache key from rounded coordinates
  const key = `${originLat.toFixed(2)},${originLng.toFixed(2)}-${destLat.toFixed(2)},${destLng.toFixed(2)}`;

  const cached = distCache.get(key);
  if (cached) return cached;

  const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SivanVIPTaxi/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('Routing service unavailable');
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found between the two cities');
  }

  const route = data.routes[0];
  const distanceKm = route.distance / 1000; // meters to km
  const durationMin = route.duration / 60; // seconds to minutes

  const result = {
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMin: Math.round(durationMin),
  };

  distCache.set(key, result);
  return result;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours} ساعت ${mins > 0 ? `و ${mins} دقیقه` : ''}`;
  }
  return `${mins} دقیقه`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'مبدا و مقصد باید مشخص شود' },
        { status: 400 }
      );
    }

    if (origin === destination) {
      return NextResponse.json(
        { error: 'مبدا و مقصد نباید یکسان باشد' },
        { status: 400 }
      );
    }

    // Geocode both cities
    const [originGeo, destGeo] = await Promise.all([
      geocode(origin),
      geocode(destination),
    ]);

    // Calculate distance via OSRM
    const routeData = await calculateRouteDistance(
      originGeo.lat,
      originGeo.lng,
      destGeo.lat,
      destGeo.lng
    );

    return NextResponse.json({
      origin: {
        name: origin,
        lat: originGeo.lat,
        lng: originGeo.lng,
      },
      destination: {
        name: destination,
        lat: destGeo.lat,
        lng: destGeo.lng,
      },
      distanceKm: routeData.distanceKm,
      durationMin: routeData.durationMin,
      durationFormatted: formatDuration(routeData.durationMin),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'خطا در محاسبه فاصله';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
