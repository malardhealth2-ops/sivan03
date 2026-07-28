import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for identified places
const placeCache = new Map<string, { name: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiter for Nominatim
let lastNominatimCall = 0;
const NOMINATIM_MIN_INTERVAL = 1200;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reverse geocode using Nominatim - PRIMARY method (reliable)
async function reverseGeocodeNominatim(lat: number, lng: number): Promise<string> {
  const now = Date.now();
  const timeSinceLastCall = now - lastNominatimCall;
  if (timeSinceLastCall < NOMINATIM_MIN_INTERVAL) {
    await wait(NOMINATIM_MIN_INTERVAL - timeSinceLastCall);
  }
  lastNominatimCall = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fa&zoom=16&addressdetails=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SivanVIPTaxi/1.0',
        'Accept-Language': 'fa',
      },
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return '';

    const data = await res.json();
    if (!data || !data.display_name) return '';

    // Build a clean Persian name from address details if available
    const addr = data.address || {};
    const parts: string[] = [];

    // Priority: road/locality > neighbourhood > city > state
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

    // Fallback to display_name parsing if address details aren't useful
    if (parts.length === 0) {
      const displayName = data.display_name.split(',').map((s: string) => s.trim());
      // Take first 3 meaningful parts
      return displayName.slice(0, 3).join('، ');
    }

    return parts.slice(0, 3).join('، ');
  } catch {
    return '';
  }
}

// Lat/lng to tile coordinates at given zoom level
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

// Fetch a map tile image and return as base64
async function fetchMapTileAsBase64(lat: number, lng: number, zoom: number = 15): Promise<string | null> {
  try {
    const { x, y } = latLngToTile(lat, lng, zoom);
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(tileUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SivanVIPTaxi/1.0',
      },
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

// Identify place using VLM (z-ai-web-dev-sdk) - FALLBACK only
async function identifyPlaceWithVLM(mapImageUrl: string, lat: number, lng: number): Promise<string | null> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `مختصات این نقطه: عرض=${lat.toFixed(4)} طول=${lng.toFixed(4)}. این نقطه روی نقشه ایران کجاست؟ فقط نام مکان را به فارسی بنویس (مثلاً: تهران، اصفهان، شیراز). حداکثر ۳ کلمه.`
            },
            {
              type: 'image_url',
              image_url: { url: mapImageUrl }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    });

    const placeName = response.choices[0]?.message?.content?.trim();
    if (placeName && placeName.length > 1 && placeName.length < 80) {
      return placeName;
    }
    return null;
  } catch {
    return null;
  }
}

// GET /api/map/identify-place?lat=&lng=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'مختصات نامعتبر' }, { status: 400 });
    }

    // Check cache
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = placeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ name: cached.name });
    }

    let placeName: string | null = null;

    // PRIMARY: Nominatim reverse geocoding (coordinates-based, reliable)
    placeName = await reverseGeocodeNominatim(lat, lng);

    // FALLBACK: VLM if Nominatim fails
    if (!placeName) {
      const mapImageUrl = await fetchMapTileAsBase64(lat, lng, 15);
      if (mapImageUrl) {
        placeName = await identifyPlaceWithVLM(mapImageUrl, lat, lng);
      }
    }

    // Ultimate fallback
    if (!placeName) {
      placeName = `${lat.toFixed(2)}، ${lng.toFixed(2)}`;
    }

    // Cache result
    placeCache.set(cacheKey, { name: placeName, timestamp: Date.now() });

    return NextResponse.json({ name: placeName });
  } catch (error) {
    console.error('Identify place error:', error);
    return NextResponse.json({ error: 'خطا در شناسایی مکان' }, { status: 500 });
  }
}
