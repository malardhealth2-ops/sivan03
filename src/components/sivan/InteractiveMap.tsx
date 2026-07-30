'use client';

import dynamic from 'next/dynamic';

const InteractiveMapInner = dynamic(() => import('./InteractiveMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] sm:h-[600px] rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-[#a1a1aa] text-sm">در حال بارگذاری نقشه...</span>
      </div>
    </div>
  ),
});

export function InteractiveMap() {
  return <InteractiveMapInner />;
}
