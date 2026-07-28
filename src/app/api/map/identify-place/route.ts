import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for identified places
const placeCache = new Map<string, { name: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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

// Identify place using VLM (z-ai-web-dev-sdk)
async function identifyPlaceWithVLM(mapImageUrl: string, lat: number, lng: number): Promise<string | null> {
  try {
    // Dynamic import to avoid issues
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `این یک تصویر نقشه OpenStreetMap است. مختصات نقطه مرکزی تقریباً ${lat.toFixed(4)} عرض شمالی و ${lng.toFixed(4)} طول شرقی است. این نقطه در کجای ایران قرار دارد؟ لطفاً نام دقیق شهر، محله یا منطقه را به زبان فارسی بنویس. فقط یک نام کوتاه و دقیق بنویس (مثلاً: "میدان نقش جهان، اصفهان" یا "خیابان ولیعصر، تهران"). اگر نام دقیق مشخص نیست، نام شهر و استان را بنویس. فقط نام مکان را بنویس و چیز اضافی ننویس.`
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
    if (placeName && placeName.length > 1 && placeName.length < 100) {
      return placeName;
    }
    return null;
  } catch (error) {
    console.error('VLM identify error:', error);
    return null;
  }
}

// Reverse geocode using Nominatim as fallback
async function reverseGeocodeNominatim(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fa&zoom=16`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

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

    const parts = data.display_name.split(',').map((s: string) => s.trim());
    return parts.slice(0, 3).join('، ');
  } catch {
    return '';
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

    // Fetch map tile for VLM analysis
    const mapImageUrl = await fetchMapTileAsBase64(lat, lng, 15);

    let placeName: string | null = null;

    // Try VLM first if map tile is available
    if (mapImageUrl) {
      placeName = await identifyPlaceWithVLM(mapImageUrl, lat, lng);
    }

    // Fallback to Nominatim
    if (!placeName) {
      placeName = await reverseGeocodeNominatim(lat, lng);
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
