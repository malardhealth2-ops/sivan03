'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, LogOut, User, MapPin, Calendar, Star, Phone, Mail, Car,
  Loader2, Shield, Clock, CheckCircle2, AlertTriangle, Wallet,
  Edit2, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { formatJalaaliDate, toPersianDigits } from '@/lib/jalaali';
import { toast } from 'sonner';

type UserTrip = {
  id: string;
  originAddress: string;
  destAddress: string;
  tripType: string;
  status: string;
  scheduledFor: string | null;
  totalFare: number;
  distanceKm: number | null;
  passengerCount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
};

type UserProfile = {
  id: string;
  username: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  passenger: {
    walletBalance: number;
    rating: number;
    totalTrips: number;
    referralCode: string;
  } | null;
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  economy: 'اقتصادی',
  vip: 'ویژه',
  luxury: 'لوکس',
  van: 'وان',
  electric: 'سوپر لوکس',
};

const TRIP_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار',
  accepted: 'پذیرفته شد',
  driver_arrived: 'راننده رسید',
  in_progress: 'در حال سفر',
  completed: 'تکمیل شد',
  cancelled: 'لغو شد',
  no_show: 'حضور نداشت',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'نقدی',
  online: 'آنلاین',
  wallet: 'کیف پول',
};

export function UserPanel() {
  const { userPanelOpen, setUserPanelOpen, auth, authLogout } = useAppStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trips, setTrips] = useState<UserTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!auth.user?.id) return;
    setLoading(true);
    try {
      const [profileRes, tripsRes] = await Promise.all([
        fetch('/api/user/profile', { cache: 'no-store' }),
        fetch('/api/user/trips', { cache: 'no-store' }),
      ]);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
        setNameValue(data.fullName || '');
      }
      if (tripsRes.ok) {
        const data = await tripsRes.json();
        setTrips(Array.isArray(data.trips) ? data.trips : []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [auth.user?.id]);

  useEffect(() => {
    if (userPanelOpen && auth.user?.id) {
      fetchProfile();
    }
  }, [userPanelOpen, auth.user?.id, fetchProfile]);

  const handleLogout = () => {
    authLogout();
    setUserPanelOpen(false);
    toast.success('از حساب کاربری خارج شدید');
  };

  const handleSaveName = async () => {
    if (!auth.user?.id || nameValue.trim().length < 2) return;
    setSavingName(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: nameValue.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditingName(false);
        toast.success('نام شما به‌روزرسانی شد');
      } else {
        toast.error('خطا در به‌روزرسانی نام');
      }
    } catch {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSavingName(false);
    }
  };

  const formatPrice = (price: number) => {
    return toPersianDigits(price.toLocaleString('en-US')) + ' تومان';
  };

  return (
    <AnimatePresence>
      {userPanelOpen && auth.user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-[#0a0a0a] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#D4AF37]/20">
            <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="سیوان" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover ring-2 ring-[#D4AF37]/40" />
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-[#fafafa]">پنل کاربری</h1>
                  <p className="text-[10px] sm:text-xs text-[#a1a1aa]">تاکسی ویژه سیوان</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 h-9 px-3 text-sm"
                >
                  <LogOut className="h-4 w-4 ml-1.5" />
                  خروج
                </Button>
                <button
                  onClick={() => setUserPanelOpen(false)}
                  className="p-2 rounded-lg hover:bg-[#1a1a1a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Welcome banner */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6 sm:p-8"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-l from-transparent via-[#D4AF37] to-transparent" />
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
                      <User className="h-8 w-8 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingName ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Input
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-9 max-w-[200px]"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                          />
                          <Button
                            onClick={handleSaveName}
                            disabled={savingName || nameValue.trim().length < 2}
                            size="sm"
                            className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-9 px-3"
                          >
                            {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            onClick={() => { setEditingName(false); setNameValue(profile?.fullName || ''); }}
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 text-[#a1a1aa]"
                          >
                            لغو
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#fafafa]">
                            {profile?.fullName || auth.user.fullName}
                          </h2>
                          <button
                            onClick={() => setEditingName(true)}
                            className="p-1.5 rounded-md text-[#a1a1aa] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                            title="ویرایش نام"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-[#a1a1aa] text-sm mt-1">
                        نام کاربری: <span dir="ltr" className="text-[#D4AF37]">@{auth.user.username}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard
                    icon={<Car className="h-5 w-5" />}
                    label="کل سفرها"
                    value={toPersianDigits(profile?.passenger?.totalTrips ?? 0)}
                  />
                  <StatCard
                    icon={<Star className="h-5 w-5" />}
                    label="امتیاز شما"
                    value={toPersianDigits((profile?.passenger?.rating ?? 5).toFixed(1))}
                  />
                  <StatCard
                    icon={<Wallet className="h-5 w-5" />}
                    label="کیف پول"
                    value={formatPrice(profile?.passenger?.walletBalance ?? 0)}
                  />
                  <StatCard
                    icon={<Clock className="h-5 w-5" />}
                    label="عضو از"
                    value={profile?.createdAt ? formatJalaaliDate(new Date(profile.createdAt)) : '—'}
                  />
                </div>

                {/* Account info */}
                <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-5 sm:p-6">
                  <h3 className="text-[#fafafa] font-bold text-sm sm:text-base mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#D4AF37]" />
                    اطلاعات حساب
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <InfoRow icon={<User className="h-4 w-4" />} label="نام کاربری" value={`@${auth.user.username}`} ltr />
                    <InfoRow icon={<User className="h-4 w-4" />} label="نام کامل" value={profile?.fullName || auth.user.fullName} />
                    <InfoRow icon={<Phone className="h-4 w-4" />} label="شماره موبایل" value={profile?.phone || 'ثبت نشده'} ltr />
                    <InfoRow icon={<Mail className="h-4 w-4" />} label="ایمیل" value={profile?.email || 'ثبت نشده'} ltr />
                    {profile?.passenger?.referralCode && (
                      <InfoRow
                        icon={<Star className="h-4 w-4" />}
                        label="کد معرف"
                        value={profile.passenger.referralCode}
                        ltr
                      />
                    )}
                  </div>
                </div>

                {/* Trips history */}
                <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-5 sm:p-6">
                  <h3 className="text-[#fafafa] font-bold text-sm sm:text-base mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#D4AF37]" />
                    سفرهای من
                    {trips.length > 0 && (
                      <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 text-[10px] mr-auto">
                        {toPersianDigits(trips.length)} سفر
                      </Badge>
                    )}
                  </h3>
                  {trips.length === 0 ? (
                    <div className="text-center py-10">
                      <Car className="h-12 w-12 text-[#333] mx-auto mb-3" />
                      <p className="text-[#a1a1aa] text-sm">هنوز سفری ثبت نشده است</p>
                      <Button
                        onClick={() => setUserPanelOpen(false)}
                        className="mt-4 bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-9 px-4 text-sm"
                      >
                        رزرو اولین سفر
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {trips.map((trip) => (
                        <TripCard key={trip.id} trip={trip} formatPrice={formatPrice} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-4 text-center">
      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-2 text-[#D4AF37]">
        {icon}
      </div>
      <div className="text-[#fafafa] font-bold text-sm sm:text-base truncate">{value}</div>
      <div className="text-[#a1a1aa] text-[10px] sm:text-xs mt-0.5">{label}</div>
    </div>
  );
}

function InfoRow({ icon, label, value, ltr }: { icon: React.ReactNode; label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-[#888]">{label}</div>
        <div className={`text-[#fafafa] text-sm truncate ${ltr ? 'dir-ltr text-left' : ''}`} dir={ltr ? 'ltr' : undefined}>
          {value}
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, formatPrice }: { trip: UserTrip; formatPrice: (n: number) => string }) {
  const statusColor =
    trip.status === 'completed'
      ? 'text-green-400 bg-green-500/10 border-green-500/30'
      : trip.status === 'cancelled'
        ? 'text-red-400 bg-red-500/10 border-red-500/30'
        : 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30';

  return (
    <div className="rounded-lg border border-[#333] hover:border-[#D4AF37]/30 bg-[#0a0a0a] p-4 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#fafafa] font-medium truncate">{trip.originAddress}</span>
            <span className="text-[#D4AF37]">←</span>
            <span className="text-[#fafafa] font-medium truncate">{trip.destAddress}</span>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColor}`}>
          {TRIP_STATUS_LABELS[trip.status] || trip.status}
        </span>
      </div>
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#a1a1aa]">
        <span className="flex items-center gap-1">
          <Car className="h-3 w-3 text-[#D4AF37]" />
          {TRIP_TYPE_LABELS[trip.tripType] || trip.tripType}
        </span>
        {trip.distanceKm && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-[#D4AF37]" />
            {toPersianDigits(trip.distanceKm.toFixed(0))} کیلومتر
          </span>
        )}
        {trip.scheduledFor && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[#D4AF37]" />
            {formatJalaaliDate(new Date(trip.scheduledFor))}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Wallet className="h-3 w-3 text-[#D4AF37]" />
          {formatPrice(trip.totalFare)}
        </span>
        <span className="flex items-center gap-1">
          <CreditCardLabel method={trip.paymentMethod} status={trip.paymentStatus} />
        </span>
      </div>
    </div>
  );
}

function CreditCardLabel({ method, status }: { method: string; status: string }) {
  return (
    <span className="flex items-center gap-1">
      {PAYMENT_LABELS[method] || method}
      {status === 'paid' && <CheckCircle2 className="h-3 w-3 text-green-400" />}
      {status === 'pending' && <Clock className="h-3 w-3 text-[#D4AF37]" />}
    </span>
  );
}
