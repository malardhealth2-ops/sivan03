'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Route,
  Clock,
  ArrowUpDown,
  RotateCcw,
  Loader2,
  Search,
  X,
  Waypoints,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ─── Types ───────────────────────────────────────────────────────────────────

type MapPoint = { lat: number; lng: number; name?: string };

type RouteData = {
  index: number;
  distanceKm: number;
  durationMin: number;
  durationFormatted: string;
  path: [number, number][];
  steps: { instruction: string; type: string; modifier?: string }[];
};

type RouteResponse = {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  routes: RouteData[];
  totalRoutes: number;
};

type SelectionStep = 'origin' | 'destination' | 'ready';

// ─── Custom Marker Icons ──────────────────────────────────────────────────────

function createOriginIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="sivan-marker-origin"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m-10-10h4m12 0h4"/></svg></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    tooltipAnchor: [0, -22],
  });
}

function createDestIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="sivan-marker-dest"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    tooltipAnchor: [0, -42],
  });
}

const originIcon = createOriginIcon();
const destIcon = createDestIcon();

// ─── Route Colors ─────────────────────────────────────────────────────────────

const ROUTE_COLORS = [
  '#D4AF37',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
];

const ROUTE_LABELS = ['مسیر اصلی', 'مسیر جایگزین ۱', 'مسیر جایگزین ۲', 'مسیر جایگزین ۳'];

// ─── Click Handler Component ─────────────────────────────────────────────────

function MapClickHandler({
  onSelectPoint,
}: {
  onSelectPoint: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelectPoint(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ─── Fly to Bounds ───────────────────────────────────────────────────────────

// ─── Invalidate Map Size Handler ─────────────────────────────────────────────

function MapInvalidator() {
  const map = useMap();

  useEffect(() => {
    // Force Leaflet to recalculate its size after the container is fully rendered
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  // Also listen for scroll/resize events that might change the container
  useEffect(() => {
    let frameId: number;
    const handleUpdate = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
      });
    };

    window.addEventListener('resize', handleUpdate);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setTimeout(() => map.invalidateSize({ animate: false }), 100);
        }
      }
    }, { threshold: 0.1 });

    const container = map.getContainer();
    if (container) observer.observe(container);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [map]);

  return null;
}

// ─── Fit to Bounds Handler ──────────────────────────────────────────────────

function FitBoundsHandler({
  points,
  routeData,
}: {
  points: { origin: MapPoint | null; destination: MapPoint | null };
  routeData: RouteResponse | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (routeData && routeData.routes.length > 0 && routeData.routes[0].path.length > 0) {
      const polyline = L.polyline(routeData.routes[0].path);
      const bounds = polyline.getBounds().pad(0.15);
      map.flyToBounds(bounds, { duration: 1.2 });
    } else if (points.origin && points.destination) {
      const bounds = L.latLngBounds(
        [points.origin.lat, points.origin.lng],
        [points.destination.lat, points.destination.lng]
      ).pad(0.3);
      map.flyToBounds(bounds, { duration: 1 });
    } else if (points.origin) {
      map.flyTo([points.origin.lat, points.origin.lng], 12, { duration: 1 });
    }
  }, [points, routeData, map]);

  return null;
}

// ─── Search Results Dropdown ───────────────────────────────────────────────────

function SearchResults({
  results,
  onSelect,
  label,
  visible,
}: {
  results: { display_name: string; lat: string; lon: string }[];
  onSelect: (lat: number, lng: number, name: string) => void;
  label: string;
  visible: boolean;
}) {
  if (!visible || results.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl z-[1100] max-h-60 overflow-y-auto">
      <div className="px-3 py-2 border-b border-[#333]">
        <span className="text-[#a1a1aa] text-xs">نتایج جستجو برای {label}</span>
      </div>
      {results.map((r, i) => {
        const shortName = r.display_name.split(',').slice(0, 3).join('، ');
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              onSelect(parseFloat(r.lat), parseFloat(r.lon), shortName);
            }}
            className="w-full px-4 py-3 text-right hover:bg-[#D4AF37]/10 transition-colors border-b border-[#333]/50 last:border-b-0"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[#D4AF37] flex-shrink-0" />
              <span className="text-[#fafafa] text-sm leading-relaxed">{shortName}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Route Detail Card ─────────────────────────────────────────────────────────

function RouteDetailCard({
  route,
  color,
  label,
  isActive,
  onClick,
}: {
  route: RouteData;
  color: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className="bg-[#0a0a0a]/80 border cursor-pointer transition-all"
      style={{
        borderColor: isActive ? color : '#333',
        boxShadow: isActive ? `0 0 15px ${color}20` : 'none',
      }}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[#fafafa] text-sm font-medium">{label}</span>
          </div>
          <Badge
            className="text-xs"
            style={{
              backgroundColor: `${color}20`,
              color,
              borderColor: `${color}40`,
            }}
          >
            {route.distanceKm} km
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {route.durationFormatted}
          </span>
          <span className="flex items-center gap-1">
            <Waypoints className="h-3 w-3" />
            {route.steps.length > 0 ? route.steps.length : '-'} مرحله
          </span>
        </div>
        {isActive && route.steps.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#333] space-y-1">
            {route.steps.slice(0, 4).map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[#a1a1aa]">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>{step.instruction}</span>
              </div>
            ))}
            {route.steps.length > 4 && (
              <span className="text-xs text-[#666]">
                + {route.steps.length - 4} مرحله دیگر
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main InteractiveMap Component ────────────────────────────────────────────

export default function InteractiveMapInner() {
  const [origin, setOrigin] = useState<MapPoint | null>(null);
  const [destination, setDestination] = useState<MapPoint | null>(null);
  const [selectionStep, setSelectionStep] = useState<SelectionStep>('origin');
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [activeRoute, setActiveRoute] = useState(0);

  // Search state
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [originResults, setOriginResults] = useState<
    { display_name: string; lat: string; lon: string }[]
  >([]);
  const [destResults, setDestResults] = useState<
    { display_name: string; lat: string; lon: string }[]
  >([]);
  const [searchLoading, setSearchLoading] = useState<'origin' | 'dest' | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Handle map click
  const handleSelectPoint = useCallback(
    (lat: number, lng: number) => {
      if (selectionStep === 'origin') {
        setOrigin({ lat, lng });
        setRouteData(null);
        setActiveRoute(0);
        setSelectionStep('destination');
      } else if (selectionStep === 'destination') {
        if (origin && Math.abs(origin.lat - lat) < 0.001 && Math.abs(origin.lng - lng) < 0.001) {
          return;
        }
        setDestination({ lat, lng });
        setSelectionStep('ready');
      } else {
        clearSelection();
      }
    },
    [selectionStep, origin]
  );

  // Search function
  const handleSearch = useCallback(
    (query: string, type: 'origin' | 'dest') => {
      if (searchTimer.current) clearTimeout(searchTimer.current);

      if (!query || query.length < 2) {
        if (type === 'origin') setOriginResults([]);
        else setDestResults([]);
        return;
      }

      setSearchLoading(type);

      searchTimer.current = setTimeout(async () => {
        try {
          const encoded = encodeURIComponent(query + ', ایران');
          const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&accept-language=fa&addressdetails=1`;

          const res = await fetch(url, {
            headers: {
              'User-Agent': 'SivanVIPTaxi/1.0',
            },
          });

          if (!res.ok) return;

          const data = await res.json();
          if (type === 'origin') {
            setOriginResults(data || []);
          } else {
            setDestResults(data || []);
          }
        } catch {
          // ignore search errors
        } finally {
          setSearchLoading(null);
        }
      }, 800);
    },
    []
  );

  // Handle search select
  const handleSearchSelect = useCallback(
    (lat: number, lng: number, name: string, type: 'origin' | 'dest') => {
      if (type === 'origin') {
        setOrigin({ lat, lng, name });
        setOriginSearch(name);
        setOriginResults([]);
        if (!destination) {
          setSelectionStep('destination');
        } else {
          setSelectionStep('ready');
        }
      } else {
        setDestination({ lat, lng, name });
        setDestSearch(name);
        setDestResults([]);
        if (origin) {
          setSelectionStep('ready');
        } else {
          setSelectionStep('origin');
        }
      }
    },
    [origin, destination]
  );

  // Fetch route when both points selected
  useEffect(() => {
    if (origin && destination) {
      setRouteLoading(true);
      setRouteError('');

      const timer = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/map/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`
          );

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'خطا در محاسبه مسیر' }));
            throw new Error(err.error || 'خطا');
          }

          const data = await res.json();
          setRouteData(data);

          if (data.origin?.name && !origin.name) {
            setOrigin((prev) => prev ? { ...prev, name: data.origin.name } : prev);
            setOriginSearch(data.origin.name);
          }
          if (data.destination?.name && !destination.name) {
            setDestination((prev) => prev ? { ...prev, name: data.destination.name } : prev);
            setDestSearch(data.destination.name);
          }
        } catch (err) {
          setRouteError(err instanceof Error ? err.message : 'خطا در محاسبه مسیر');
          setRouteData(null);
        } finally {
          setRouteLoading(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  const clearSelection = () => {
    setOrigin(null);
    setDestination(null);
    setRouteData(null);
    setRouteError('');
    setActiveRoute(0);
    setOriginSearch('');
    setDestSearch('');
    setOriginResults([]);
    setDestResults([]);
    setSelectionStep('origin');
  };

  const swapPoints = () => {
    if (!origin || !destination) return;
    const tmpOrigin = origin;
    const tmpOriginSearch = originSearch;
    setOrigin(destination);
    setDestination(tmpOrigin);
    setOriginSearch(destSearch);
    setDestSearch(tmpOriginSearch);
    setRouteData(null);
    setActiveRoute(0);
  };

  // Build polylines
  const routePolylines = routeData?.routes.map((route) => route.path) || [];

  return (
    <section id="map" className="py-20 sm:py-24 bg-[#0a0a0a] relative">
      {/* Decorative */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-l from-transparent via-[#D4AF37] to-transparent rounded-full" />

      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 mb-4 px-4 py-1.5">
            <Navigation className="h-3.5 w-3.5 ml-1.5" />
            نقشه تعاملی
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#fafafa] mb-4">
            مسیر خود را روی <span className="text-gold-gradient">نقشه</span> انتخاب کنید
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            با کلیک روی نقشه مبدا و مقصد خود را مشخص کنید. مسیر حرکت، فاصله و مسیرهای جایگزین نمایش داده می‌شود
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-6"
        >
          {/* Search & Controls Bar */}
          <div className="relative z-10 bg-[#1a1a1a]/90 backdrop-blur-xl rounded-2xl border border-[#D4AF37]/20 p-4 sm:p-6">
            {/* Selection Step Indicator */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    selectionStep === 'origin'
                      ? 'bg-[#D4AF37] text-[#0a0a0a] shadow-lg shadow-[#D4AF37]/30'
                      : origin
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'bg-[#2d2d2d] text-[#666]'
                  }`}
                >
                  ۱
                </div>
                <span
                  className={`text-sm font-medium ${
                    selectionStep === 'origin' ? 'text-[#fafafa]' : origin ? 'text-[#a1a1aa]' : 'text-[#666]'
                  }`}
                >
                  مبدا
                </span>
              </div>

              <div className="flex-1 h-px bg-[#333]" />

              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    selectionStep === 'destination'
                      ? 'bg-[#EF4444] text-white shadow-lg shadow-red-500/30'
                      : destination
                      ? 'bg-[#EF4444]/20 text-[#EF4444]'
                      : 'bg-[#2d2d2d] text-[#666]'
                  }`}
                >
                  ۲
                </div>
                <span
                  className={`text-sm font-medium ${
                    selectionStep === 'destination'
                      ? 'text-[#fafafa]'
                      : destination
                      ? 'text-[#a1a1aa]'
                      : 'text-[#666]'
                  }`}
                >
                  مقصد
                </span>
              </div>

              <div className="flex-1 h-px bg-[#333]" />

              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    selectionStep === 'ready'
                      ? 'bg-[#10B981] text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-[#2d2d2d] text-[#666]'
                  }`}
                >
                  ۳
                </div>
                <span className={`text-sm font-medium ${selectionStep === 'ready' ? 'text-[#fafafa]' : 'text-[#666]'}`}>
                  مسیر
                </span>
              </div>
            </div>

            {/* Search Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Origin Search */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#D4AF37]" />
                  <label className="text-[#a1a1aa] text-xs">مبدا</label>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a1a1aa]" />
                  <Input
                    value={originSearch}
                    onChange={(e) => {
                      setOriginSearch(e.target.value);
                      handleSearch(e.target.value, 'origin');
                    }}
                    placeholder="جستجوی نام محل مبدا..."
                    className="pr-9 bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#666] h-11 focus:border-[#D4AF37]/50 rounded-xl"
                  />
                  {originSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setOriginSearch('');
                        setOrigin(null);
                        setOriginResults([]);
                        if (!destination) setSelectionStep('origin');
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#fafafa]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {searchLoading === 'origin' && (
                    <Loader2 className="absolute left-10 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#D4AF37] animate-spin" />
                  )}
                </div>
                <SearchResults
                  results={originResults}
                  onSelect={(lat, lng, name) => handleSearchSelect(lat, lng, name, 'origin')}
                  label="مبدا"
                  visible={originResults.length > 0}
                />
              </div>

              {/* Destination Search */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                  <label className="text-[#a1a1aa] text-xs">مقصد</label>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a1a1aa]" />
                  <Input
                    value={destSearch}
                    onChange={(e) => {
                      setDestSearch(e.target.value);
                      handleSearch(e.target.value, 'dest');
                    }}
                    placeholder="جستجوی نام محل مقصد..."
                    className="pr-9 bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#666] h-11 focus:border-[#EF4444]/50 rounded-xl"
                  />
                  {destSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setDestSearch('');
                        setDestination(null);
                        setDestResults([]);
                        if (!origin) setSelectionStep('origin');
                        else setSelectionStep('destination');
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#fafafa]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {searchLoading === 'dest' && (
                    <Loader2 className="absolute left-10 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#D4AF37] animate-spin" />
                  )}
                </div>
                <SearchResults
                  results={destResults}
                  onSelect={(lat, lng, name) => handleSearchSelect(lat, lng, name, 'dest')}
                  label="مقصد"
                  visible={destResults.length > 0}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={swapPoints}
                disabled={!origin || !destination}
                className="text-[#a1a1aa] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:opacity-30"
              >
                <ArrowUpDown className="h-4 w-4 ml-1" />
                جابجایی
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-[#a1a1aa] hover:text-red-400 hover:bg-red-400/10"
              >
                <RotateCcw className="h-4 w-4 ml-1" />
                پاک‌سازی
              </Button>

              <div className="flex-1 text-left">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectionStep}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-end gap-1.5 text-xs"
                  >
                    {selectionStep === 'origin' && (
                      <>
                        <MapPin className="h-3 w-3 text-[#D4AF37]" />
                        <span className="text-[#D4AF37]">روی نقشه کلیک کنید تا مبدا انتخاب شود</span>
                      </>
                    )}
                    {selectionStep === 'destination' && (
                      <>
                        <Navigation className="h-3 w-3 text-[#EF4444]" />
                        <span className="text-[#EF4444]">اکنون مقصد را انتخاب کنید</span>
                      </>
                    )}
                    {selectionStep === 'ready' && (
                      <>
                        <Route className="h-3 w-3 text-[#10B981]" />
                        <span className="text-[#10B981]">کلیک کنید تا دوباره انتخاب کنید</span>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative rounded-2xl overflow-hidden border border-[#333] shadow-2xl shadow-black/40">
            <MapContainer
              center={[32.65, 51.67]}
              zoom={6}
              className="w-full h-[500px] sm:h-[600px] lg:h-[650px]"
              zoomControl={true}
              whenReady={(mapInstance) => {
                // Force recalculate size once map is ready
                setTimeout(() => {
                  mapInstance.target.invalidateSize();
                }, 100);
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              <MapClickHandler onSelectPoint={handleSelectPoint} />
              <MapInvalidator />
              <FitBoundsHandler points={{ origin, destination }} routeData={routeData} />

              {/* Origin Marker */}
              {origin && (
                <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
                  <Tooltip direction="top" offset={[0, -20]} permanent={false}>
                    <span className="text-[#fafafa]">{origin.name || 'مبدا'}</span>
                  </Tooltip>
                </Marker>
              )}

              {/* Destination Marker */}
              {destination && (
                <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
                  <Tooltip direction="top" offset={[0, -40]} permanent={false}>
                    <span className="text-[#fafafa]">{destination.name || 'مقصد'}</span>
                  </Tooltip>
                </Marker>
              )}

              {/* Route Polylines */}
              {routePolylines.map((path, index) => (
                <Polyline
                  key={index}
                  positions={path}
                  pathOptions={{
                    color: ROUTE_COLORS[index] || '#666',
                    weight: index === activeRoute ? 5 : 3,
                    opacity: index === activeRoute ? 1 : 0.5,
                    dashArray: index === 0 ? undefined : '10, 10',
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              ))}
            </MapContainer>

            {/* Loading Overlay */}
            <AnimatePresence>
              {routeLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]"
                >
                  <div className="bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-xl">
                    <Loader2 className="h-6 w-6 text-[#D4AF37] animate-spin" />
                    <span className="text-[#fafafa] text-sm">در حال محاسبه مسیر...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Overlay */}
            <AnimatePresence>
              {routeError && !routeLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[1000]"
                >
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <span className="text-red-300 text-sm">{routeError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Map Legend */}
            {routeData && routeData.routes.length > 1 && (
              <div className="absolute top-4 left-4 bg-[#1a1a1a]/90 backdrop-blur-xl border border-[#333] rounded-xl p-3 z-[1000]">
                <span className="text-[#a1a1aa] text-xs block mb-2">راهنمای مسیرها</span>
                <div className="space-y-1.5">
                  {routeData.routes.map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-6 h-0.5 rounded-full"
                        style={{ backgroundColor: ROUTE_COLORS[i] }}
                      />
                      <span className="text-[#fafafa] text-xs">{ROUTE_LABELS[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Route Info Panel */}
          <AnimatePresence>
            {routeData && routeData.routes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="bg-[#1a1a1a]/90 backdrop-blur-xl rounded-2xl border border-[#D4AF37]/20 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#fafafa] font-bold text-lg flex items-center gap-2">
                      <Route className="h-5 w-5 text-[#D4AF37]" />
                      اطلاعات مسیر
                    </h3>
                    <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30">
                      {routeData.totalRoutes} مسیر یافت شد
                    </Badge>
                  </div>

                  {/* Route Summary Bar */}
                  <div className="flex items-center gap-4 mb-4 p-3 bg-[#0a0a0a] rounded-xl border border-[#333]">
                    <div className="flex-1 text-center">
                      <div className="text-xs text-[#a1a1aa] mb-1">فاصله</div>
                      <div className="text-[#D4AF37] font-bold text-lg">
                        {new Intl.NumberFormat('fa-IR').format(routeData.routes[activeRoute].distanceKm)}{' '}
                        <span className="text-xs text-[#a1a1aa]">کیلومتر</span>
                      </div>
                    </div>
                    <div className="w-px h-10 bg-[#333]" />
                    <div className="flex-1 text-center">
                      <div className="text-xs text-[#a1a1aa] mb-1">زمان تخمینی</div>
                      <div className="text-[#D4AF37] font-bold text-lg">
                        {routeData.routes[activeRoute].durationFormatted}
                      </div>
                    </div>
                  </div>

                  {/* Route Cards */}
                  {routeData.routes.length > 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {routeData.routes.map((route, i) => (
                        <RouteDetailCard
                          key={i}
                          route={route}
                          color={ROUTE_COLORS[i]}
                          label={ROUTE_LABELS[i]}
                          isActive={activeRoute === i}
                          onClick={() => setActiveRoute(i)}
                        />
                      ))}
                    </div>
                  ) : (
                    <RouteDetailCard
                      route={routeData.routes[0]}
                      color={ROUTE_COLORS[0]}
                      label={ROUTE_LABELS[0]}
                      isActive={true}
                      onClick={() => {}}
                    />
                  )}

                  {/* Origin-Destination Names */}
                  <div className="mt-4 flex items-center gap-3 text-sm">
                    <span className="text-[#D4AF37] font-medium truncate">
                      {routeData.origin?.name || 'مبدا'}
                    </span>
                    <ArrowLeft className="h-4 w-4 text-[#a1a1aa] flex-shrink-0 rotate-180" />
                    <span className="text-[#EF4444] font-medium truncate">
                      {routeData.destination?.name || 'مقصد'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
