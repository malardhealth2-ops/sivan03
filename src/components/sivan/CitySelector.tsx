'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Search, X, Building2, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import provincesData from '@/data/provinces.json';
import tehranDistricts from '@/data/tehran-districts.json';

interface ProvinceData {
  name: string;
  cities: string[];
}

interface DistrictData {
  number: number;
  name: string;
  neighborhoods: string[];
}

interface CitySelectorValue {
  province: string;
  city: string;
  district?: string;
  neighborhood?: string;
}

interface CitySelectorProps {
  label: string;
  iconColor?: string;
  value: CitySelectorValue;
  onChange: (value: CitySelectorValue) => void;
  placeholder?: string;
}

type SelectionPhase = 'province' | 'city' | 'district' | 'neighborhood';

export function CitySelector({
  label,
  iconColor = '#D4AF37',
  value,
  onChange,
  placeholder = 'انتخاب شهر',
}: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<SelectionPhase>('province');
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isTehran = value.province === 'تهران';

  // Display text
  const displayText = useMemo(() => {
    if (value.neighborhood) {
      return `${value.neighborhood}، ${value.district}، ${value.province}`;
    }
    if (value.district) {
      return `${value.district}، ${value.province}`;
    }
    if (value.city) {
      return `${value.city}، ${value.province}`;
    }
    return '';
  }, [value]);

  const handleClose = () => {
    setIsOpen(false);
    setPhase('province');
    setSearch('');
  };

  const handleSelectProvince = (provinceName: string) => {
    if (provinceName === 'تهران') {
      onChange({ province: provinceName, city: provinceName });
      setPhase('district');
    } else {
      // Find first city in province for now, go to city selection
      onChange({ province: provinceName, city: '' });
      setPhase('city');
    }
    setSearch('');
  };

  const handleSelectCity = (cityName: string) => {
    onChange({ ...value, city: cityName });
    setIsOpen(false);
    setPhase('province');
    setSearch('');
  };

  const handleSelectDistrict = (districtName: string) => {
    onChange({ ...value, district: districtName, neighborhood: '' });
    setPhase('neighborhood');
    setSearch('');
  };

  const handleSelectNeighborhood = (neighborhood: string) => {
    onChange({ ...value, neighborhood });
    setIsOpen(false);
    setPhase('province');
    setSearch('');
  };

  const handleGoBack = () => {
    setSearch('');
    if (phase === 'neighborhood') {
      setPhase('district');
    } else if (phase === 'district') {
      setPhase('province');
    } else if (phase === 'city') {
      setPhase('province');
    }
  };

  // Filter provinces
  const filteredProvinces = useMemo(() => {
    if (!search) return provincesData as ProvinceData[];
    const q = search.trim();
    return (provincesData as ProvinceData[]).filter(
      (p) =>
        p.name.includes(q) ||
        p.cities.some((c) => c.includes(q))
    );
  }, [search]);

  // Filter cities for selected province
  const filteredCities = useMemo(() => {
    const province = (provincesData as ProvinceData[]).find(
      (p) => p.name === value.province
    );
    if (!province) return [];
    if (!search) return province.cities;
    const q = search.trim();
    return province.cities.filter((c) => c.includes(q));
  }, [value.province, search]);

  // Tehran districts
  const filteredDistricts = useMemo(() => {
    if (!search) return tehranDistricts as DistrictData[];
    const q = search.trim();
    return (tehranDistricts as DistrictData[]).filter(
      (d) =>
        d.name.includes(q) ||
        d.neighborhoods.some((n) => n.includes(q))
    );
  }, [search]);

  // Neighborhoods for selected district
  const filteredNeighborhoods = useMemo(() => {
    const district = (tehranDistricts as DistrictData[]).find(
      (d) => d.name === value.district
    );
    if (!district) return [];
    if (!search) return district.neighborhoods;
    const q = search.trim();
    return district.neighborhoods.filter((n) => n.includes(q));
  }, [value.district, search]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search when opening
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, phase]);

  const phaseLabels: Record<SelectionPhase, string> = {
    province: 'انتخاب استان',
    city: `شهرهای ${value.province}`,
    district: 'منطقه تهران',
    neighborhood: `محله‌های ${value.district}`,
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[#fafafa] text-sm font-medium mb-2 block">
        <MapPin className="h-3.5 w-3.5 ml-1.5 inline" style={{ color: iconColor }} />
        {label}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setPhase('province');
            setSearch('');
          }
        }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-all ${
          displayText
            ? 'bg-[#0a0a0a] border-[#D4AF37]/30 text-[#fafafa]'
            : 'bg-[#0a0a0a] border-[#333] text-[#888]'
        } hover:border-[#D4AF37]/50 focus:border-[#D4AF37] focus:outline-none`}
      >
        <span className={displayText ? '' : ''}>
          {displayText || placeholder}
        </span>
        <div className="flex items-center gap-2">
          {displayText && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ province: '', city: '' });
              }}
              className="text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 text-[#a1a1aa] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#0a0a0a] border-b border-[#333] px-4 py-3 flex items-center gap-2">
              {phase !== 'province' && (
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="text-[#D4AF37] hover:text-[#E5C76B] transition-colors text-sm font-medium"
                >
                  ← بازگشت
                </button>
              )}
              <span className="text-[#fafafa] text-sm font-medium flex-1 text-right">
                {phaseLabels[phase]}
              </span>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-[#333]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a1a1aa]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجو..."
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pr-9 pl-4 py-2 text-sm text-[#fafafa] placeholder:text-[#888] focus:border-[#D4AF37]/50 focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#fafafa]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {/* Province list */}
              {phase === 'province' && (
                <>
                  {filteredProvinces.length === 0 && (
                    <div className="px-4 py-8 text-center text-[#a1a1aa] text-sm">
                      نتیجه‌ای یافت نشد
                    </div>
                  )}
                  {filteredProvinces.map((province) => (
                    <button
                      key={province.name}
                      type="button"
                      onClick={() => handleSelectProvince(province.name)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#D4AF37]/10 transition-colors text-right border-b border-[#333]/50 last:border-b-0"
                    >
                      <span className="text-[#fafafa] text-sm font-medium">
                        {province.name}
                      </span>
                      <span className="text-[#a1a1aa] text-xs">
                        {province.cities.length} شهر
                      </span>
                    </button>
                  ))}
                </>
              )}

              {/* City list */}
              {phase === 'city' && (
                <>
                  {filteredCities.length === 0 && (
                    <div className="px-4 py-8 text-center text-[#a1a1aa] text-sm">
                      نتیجه‌ای یافت نشد
                    </div>
                  )}
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className="w-full px-4 py-3 flex items-center hover:bg-[#D4AF37]/10 transition-colors text-right border-b border-[#333]/50 last:border-b-0"
                    >
                      <span className="text-[#fafafa] text-sm">{city}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Tehran district list */}
              {phase === 'district' && (
                <>
                  {filteredDistricts.length === 0 && (
                    <div className="px-4 py-8 text-center text-[#a1a1aa] text-sm">
                      نتیجه‌ای یافت نشد
                    </div>
                  )}
                  {filteredDistricts.map((district) => (
                    <button
                      key={district.number}
                      type="button"
                      onClick={() => handleSelectDistrict(district.name)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#D4AF37]/10 transition-colors text-right border-b border-[#333]/50 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#D4AF37]" />
                        <span className="text-[#fafafa] text-sm font-medium">
                          {district.name}
                        </span>
                      </div>
                      <span className="text-[#a1a1aa] text-xs">
                        {district.neighborhoods.length} محله
                      </span>
                    </button>
                  ))}
                </>
              )}

              {/* Neighborhood list */}
              {phase === 'neighborhood' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ ...value, neighborhood: '' });
                      setIsOpen(false);
                      setPhase('province');
                      setSearch('');
                    }}
                    className="w-full px-4 py-3 flex items-center gap-2 hover:bg-[#D4AF37]/10 transition-colors text-right border-b border-[#333]"
                  >
                    <MapPin className="h-4 w-4 text-[#a1a1aa]" />
                    <span className="text-[#a1a1aa] text-sm">
                      بدون انتخاب محله (همان {value.district})
                    </span>
                  </button>
                  {filteredNeighborhoods.length === 0 && (
                    <div className="px-4 py-8 text-center text-[#a1a1aa] text-sm">
                      نتیجه‌ای یافت نشد
                    </div>
                  )}
                  {filteredNeighborhoods.map((nb) => (
                    <button
                      key={nb}
                      type="button"
                      onClick={() => handleSelectNeighborhood(nb)}
                      className="w-full px-4 py-3 flex items-center gap-2 hover:bg-[#D4AF37]/10 transition-colors text-right border-b border-[#333]/50 last:border-b-0"
                    >
                      <Home className="h-3.5 w-3.5 text-[#D4AF37]" />
                      <span className="text-[#fafafa] text-sm">{nb}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
