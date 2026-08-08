'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Simple SVG pin markers - matching the main map style
function createPinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:28px;height:40px;">
        <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
          <circle cx="14" cy="13" r="5" fill="white" opacity="0.9"/>
          <circle cx="14" cy="13" r="2.5" fill="${color === '#D4AF37' ? '#B8941F' : '#991B1B'}"/>
        </svg>
      </div>
    `,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
  });
}

const originIcon = createPinIcon('#D4AF37');
const destIcon = createPinIcon('#EF4444');

// Component to fit map bounds to show both markers
function FitBounds({
  originLat,
  originLng,
  destLat,
  destLng,
}: {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (originLat && originLng && destLat && destLng) {
      const bounds = L.latLngBounds(
        [originLat, originLng],
        [destLat, destLng]
      ).pad(0.3);
      map.fitBounds(bounds, { duration: 0.5, maxZoom: 14 });
    }
  }, [map, originLat, originLng, destLat, destLng]);

  return null;
}

export default function TripDetailMapInner({
  originLat,
  originLng,
  originName,
  destLat,
  destLng,
  destName,
}: {
  originLat: number;
  originLng: number;
  originName?: string;
  destLat: number;
  destLng: number;
  destName?: string;
}) {
  // Draw a straight line between origin and destination
  const linePositions = useMemo(() => {
    if (!originLat || !originLng || !destLat || !destLng) return [];
    return [
      [originLat, originLng] as [number, number],
      [destLat, destLng] as [number, number],
    ];
  }, [originLat, originLng, destLat, destLng]);

  return (
    <MapContainer
      center={[originLat || 32.65, originLng || 51.67]}
      zoom={10}
      className="w-full h-[250px] rounded-xl"
      zoomControl={false}
      attributionControl={false}
      dragging={true}
      scrollWheelZoom={true}
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds originLat={originLat} originLng={originLng} destLat={destLat} destLng={destLng} />

      {originLat && originLng && (
        <Marker position={[originLat, originLng]} icon={originIcon}>
          <L.ToolTip direction="top" offset={[0, -20]}>
            <span style={{ color: '#fafafa' }}>{originName || 'مبدا'}</span>
          </L.ToolTip>
        </Marker>
      )}

      {destLat && destLng && (
        <Marker position={[destLat, destLng]} icon={destIcon}>
          <L.ToolTip direction="top" offset={[0, -20]}>
            <span style={{ color: '#fafafa' }}>{destName || 'مقصد'}</span>
          </L.ToolTip>
        </Marker>
      )}

      {linePositions.length === 2 && (
        <Polyline
          positions={linePositions}
          pathOptions={{
            color: '#3B82F6',
            weight: 3,
            opacity: 0.7,
            dashArray: '8, 6',
          }}
        />
      )}
    </MapContainer>
  );
}
