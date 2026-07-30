'use client';

import dynamic from 'next/dynamic';

const TripDetailMapInner = dynamic(() => import('./TripDetailMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] rounded-xl bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-[#a1a1aa] text-xs">در حال بارگذاری نقشه...</span>
      </div>
    </div>
  ),
});

export function TripDetailMap({
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
  return (
    <TripDetailMapInner
      originLat={originLat}
      originLng={originLng}
      originName={originName}
      destLat={destLat}
      destLng={destLng}
      destName={destName}
    />
  );
}
