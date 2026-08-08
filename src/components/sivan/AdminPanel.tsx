'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LogOut, LayoutDashboard, Car, Users, UserCheck, Settings, X,
  TrendingUp, MapPin, Phone, Star, ChevronDown, Eye, EyeOff, Loader2,
  Calendar, Clock, CreditCard, Check, AlertTriangle, Ban, CheckCircle2,
  FileText, Pencil, Plus, Trash2, Image, Send, Save, Calculator, Mail, KeyRound,
  Inbox, RefreshCw, Bell, BellOff, Smartphone, Volume2,
  Sparkles, Wand2, PenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { formatJalaaliDate, getTehranTimeString, getTehranTime, toPersianDigits } from '@/lib/jalaali';
import { toast } from 'sonner';
import { TripDetailMap } from './TripDetailMap';

type TabId = 'dashboard' | 'trips' | 'passengers' | 'drivers' | 'content' | 'blog' | 'pricing' | 'emails' | 'notifications' | 'settings';
type BlogPostForm = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string;
  status: string;
  tags: string[];
};

// ─── Admin Login ───
function AdminLoginScreen() {
  const { adminLogin, admin, setAdminOpen, setLoginError } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'نام کاربری یا رمز عبور اشتباه است');
        setLoading(false);
        return;
      }
      if (data.user?.role !== 'admin') {
        setLoginError('این حساب کاربری دسترسی مدیریت ندارد');
        setLoading(false);
        return;
      }
      adminLogin(username, password);
    } catch {
      setLoginError('خطا در ارتباط با سرور');
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-[#0a0a0a] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />
      <button onClick={() => setAdminOpen(false)} className="absolute top-6 left-6 p-2 rounded-lg hover:bg-[#2d2d2d] text-[#a1a1aa] hover:text-[#fafafa] transition-colors z-10">
        <X className="h-6 w-6" />
      </button>
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="سیوان" className="h-16 w-16 rounded-2xl mx-auto mb-4 ring-2 ring-[#D4AF37]/40" />
            <h1 className="text-2xl font-bold text-[#fafafa] mb-2">پنل مدیریت سیوان</h1>
            <p className="text-[#a1a1aa] text-sm">نام کاربری و رمز عبور خود را وارد کنید</p>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[#a1a1aa] text-sm">نام کاربری</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="نام کاربری" className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12" dir="ltr" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            </div>
            <div className="space-y-2">
              <Label className="text-[#a1a1aa] text-sm">رمز عبور</Label>
              <div className="relative">
                <Input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="رمز عبور" className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12" dir="ltr" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#fafafa]">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            {admin.loginError && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertTriangle className="h-4 w-4 shrink-0" />{admin.loginError}</motion.div>
            )}
            <Button onClick={handleLogin} disabled={loading || !username || !password} className="w-full h-12 bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold text-base rounded-xl">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'ورود به پنل مدیریت'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Admin Dashboard ───
function AdminDashboard() {
  const { admin, adminLogout, setAdminOpen, setAdminActiveTab } = useAppStore();
  const [jalaliClock, setJalaliClock] = useState('');

  useEffect(() => {
    const update = () => {
      setJalaliClock(getTehranTimeString() + ' - ' + formatJalaaliDate(getTehranTime()));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  // ── Live email polling: foreground toast + background SW notification ──
  // Polls /api/admin/emails every 25s; when a NEW email arrives (unseen id),
  // shows a toast (foreground) + a service-worker notification (background)
  // + a short notification sound. This complements the web-push system
  // (which works even when the tab is fully closed).
  useEffect(() => {
    let seenIds = new Set<string>();
    let firstLoad = true;

    const checkNewEmails = async () => {
      try {
        const res = await fetch('/api/admin/emails?limit=5');
        if (!res.ok) return;
        const data = await res.json();
        const items: { id: string; subject: string; toEmail: string; source: string; refId?: string }[] = data.items || [];
        if (items.length === 0) return;

        if (firstLoad) {
          items.forEach((it) => seenIds.add(it.id));
          firstLoad = false;
          return;
        }

        const fresh = items.filter((it) => !seenIds.has(it.id));
        if (fresh.length === 0) return;

        fresh.forEach((it) => seenIds.add(it.id));

        const isBooking = it.source === 'booking';
        const title = isBooking ? `🚕 رزرو جدید: ${it.refId || ''}` : `📧 ایمیل جدید: ${it.subject}`;
        const body = isBooking ? `کد رهگیری ${it.refId || ''} — برای مشاهده کلیک کنید` : `${it.subject} — برای ${it.toEmail}`;

        // Foreground: toast + sound
        toast(title, { description: body, duration: 8000 });
        playNotifSound();

        // Background: service worker notification (shows even if tab is not focused)
        if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const reg = await navigator.serviceWorker.ready;
            reg.showNotification(title, {
              body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: `email-${it.id}`,
              renotify: true,
              dir: 'rtl',
              lang: 'fa',
              data: { url: '/' },
              actions: [{ action: 'open', title: 'مشاهده' }, { action: 'close', title: 'بستن' }],
              vibrate: [120, 60, 120],
            });
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    };

    checkNewEmails();
    const iv = setInterval(checkNewEmails, 25000);
    return () => clearInterval(iv);
  }, []);

  const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'trips', label: 'سفرها', icon: Car },
    { id: 'passengers', label: 'مسافران', icon: Users },
    { id: 'drivers', label: 'رانندگان', icon: UserCheck },
    { id: 'content', label: 'مدیریت محتوا', icon: Pencil },
    { id: 'blog', label: 'بلاگ', icon: FileText },
    { id: 'pricing', label: 'قیمت‌گذاری', icon: Calculator },
    { id: 'emails', label: 'ایمیل‌ها', icon: Mail },
    { id: 'notifications', label: 'اعلان‌ها', icon: Bell },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-[#0a0a0a] flex">
      <aside className="hidden md:flex w-64 bg-[#111111] border-l border-[#333] flex-col">
        <div className="p-5 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="سیوان" className="h-10 w-10 rounded-xl ring-1 ring-[#D4AF37]/30" />
            <div><h3 className="text-[#fafafa] font-bold text-sm">پنل مدیریت</h3><p className="text-[#a1a1aa] text-xs">سیوان VIP</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setAdminActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${admin.activeTab === tab.id ? 'bg-[#D4AF37] text-[#0a0a0a] font-bold shadow-lg shadow-[#D4AF37]/20' : 'text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#2d2d2d]'}`}>
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#333]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center"><span className="text-[#D4AF37] text-xs font-bold">A</span></div>
            <div><p className="text-[#fafafa] text-sm">{admin.adminUsername}</p><p className="text-[#a1a1aa] text-[10px]">مدیر سیستم</p></div>
          </div>
          <Button onClick={adminLogout} variant="ghost" className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start gap-2"><LogOut className="h-4 w-4" />خروج</Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[#111111] border-b border-[#333] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-[#fafafa] font-bold">مدیریت سیوان</span>
            <Separator orientation="vertical" className="h-6 bg-[#333]" />
            <span className="text-[#a1a1aa] text-xs">{jalaliClock}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Select value={admin.activeTab} onValueChange={(v) => setAdminActiveTab(v as TabId)}>
                <SelectTrigger className="w-36 bg-[#1a1a1a] border-[#333] text-[#fafafa] h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333]">
                  {tabs.map((t) => (<SelectItem key={t.id} value={t.id} className="text-[#fafafa]">{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <button onClick={adminLogout} className="md:hidden p-2 rounded-lg hover:bg-[#2d2d2d] text-[#a1a1aa] hover:text-red-400 transition-colors"><LogOut className="h-5 w-5" /></button>
            <button onClick={() => setAdminOpen(false)} className="p-2 rounded-lg hover:bg-[#2d2d2d] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"><X className="h-5 w-5" /></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {admin.activeTab === 'dashboard' && <DashboardTab key="dash" />}
            {admin.activeTab === 'trips' && <TripsTab key="trips" />}
            {admin.activeTab === 'passengers' && <PassengersTab key="pass" />}
            {admin.activeTab === 'drivers' && <DriversTab key="drivers" />}
            {admin.activeTab === 'content' && <ContentTab key="content" />}
            {admin.activeTab === 'blog' && <BlogTab key="blog" />}
            {admin.activeTab === 'pricing' && <PricingTab key="pricing" />}
            {admin.activeTab === 'emails' && <EmailsTab key="emails" />}
            {admin.activeTab === 'notifications' && <NotificationsTab key="notif" />}
            {admin.activeTab === 'settings' && <SettingsTab key="settings" />}
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
}

// ─── Dashboard Tab ───
function DashboardTab() {
  const stats = [
    { label: 'کل مسافران', value: '۱,۲۵۰', icon: Users, color: '#D4AF37', change: '+۱۲٪' },
    { label: 'رانندگان فعال', value: '۸۵', icon: UserCheck, color: '#10B981', change: '+۵٪' },
    { label: 'سفرهای امروز', value: '۴۲', icon: Car, color: '#3B82F6', change: '+۸٪' },
    { label: 'درآمد امروز', value: '۸۵,۰۰۰,۰۰۰', icon: CreditCard, color: '#F59E0B', suffix: 'تومان', change: '+۱۵٪' },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <h2 className="text-xl font-bold text-[#fafafa]">داشبورد</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-[#1a1a1a] border border-[#333] p-5">
            <div className="flex items-start justify-between">
              <div><p className="text-[#a1a1aa] text-sm mb-2">{stat.label}</p><p className="text-2xl font-bold text-[#fafafa]">{stat.value}{stat.suffix && <span className="text-sm text-[#a1a1aa] mr-1">{stat.suffix}</span>}</p></div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}><stat.icon className="h-5 w-5" style={{ color: stat.color }} /></div>
            </div>
            <div className="flex items-center gap-1 mt-3"><TrendingUp className="h-3 w-3 text-green-400" /><span className="text-green-400 text-xs">{stat.change}</span><span className="text-[#888] text-xs mr-1">نسبت به ماه قبل</span></div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Trips Tab ───
function TripsTab() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  useEffect(() => {
    fetch('/api/booking').then(r => r.json()).then(data => { setTrips(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = statusFilter === 'all' ? trips : trips.filter((t: any) => t.status === statusFilter);

  const hasMapCoords = (t: any) => t.originLat && t.originLng && t.destLat && t.destLng;

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-[#fafafa]">مدیریت سفرها ({toPersianDigits(trips.length)})</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-[#1a1a1a] border-[#333] text-[#fafafa] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#333]">
            <SelectItem value="all" className="text-[#fafafa]">همه</SelectItem>
            <SelectItem value="pending" className="text-[#fafafa]">در انتظار</SelectItem>
            <SelectItem value="completed" className="text-[#fafafa]">تکمیل شده</SelectItem>
            <SelectItem value="cancelled" className="text-[#fafafa]">لغو شده</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card className="bg-[#1a1a1a] border border-[#333] overflow-hidden">
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <Table><TableHeader><TableRow className="border-[#333]"><TableHead className="text-[#a1a1aa]">کد</TableHead><TableHead className="text-[#a1a1aa]">مسیر</TableHead><TableHead className="text-[#a1a1aa]">وضعیت</TableHead><TableHead className="text-[#a1a1aa]">مبلغ</TableHead><TableHead className="text-[#a1a1aa]">تاریخ</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow className="border-[#333]"><TableCell colSpan={5} className="text-center text-[#a1a1aa] py-8">سفری ثبت نشده است</TableCell></TableRow>}
              {filtered.map((trip: any) => (
                <TableRow key={trip.id} className="border-[#333] hover:bg-[#2d2d2d]/50 cursor-pointer" onClick={() => setSelectedTrip(trip)}>
                  <TableCell className="text-[#fafafa] font-mono text-xs" dir="ltr">{trip.bookingCode}{hasMapCoords(trip) && <MapPin className="inline h-3 w-3 text-[#D4AF37] mr-1" />}</TableCell>
                  <TableCell className="text-[#fafafa] text-sm">{trip.originAddress} → {trip.destAddress}</TableCell>
                  <TableCell>{getStatusBadge(trip.status)}</TableCell>
                  <TableCell className="text-[#fafafa] text-sm" dir="ltr">{new Intl.NumberFormat('fa-IR').format(trip.totalFare || 0)} تومان</TableCell>
                  <TableCell className="text-[#a1a1aa] text-sm">{formatJalaaliDate(trip.createdAt || new Date())}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Trip Detail Overlay with Map */}
      <AnimatePresence>
        {selectedTrip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
            onClick={() => setSelectedTrip(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="relative bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setSelectedTrip(null)} className="absolute top-4 left-4 p-2 rounded-lg hover:bg-[#2d2d2d] text-[#a1a1aa] hover:text-[#fafafa] transition-colors z-10">
                <X className="h-5 w-5" />
              </button>

              <div className="p-6">
                <h3 className="text-[#fafafa] font-bold text-lg mb-1 flex items-center gap-2">
                  <Car className="h-5 w-5 text-[#D4AF37]" />
                  جزئیات سفر
                </h3>
                <p className="text-[#a1a1aa] text-sm font-mono mb-4" dir="ltr">{selectedTrip.bookingCode}</p>

                <div className="mb-4">{getStatusBadge(selectedTrip.status)}</div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#333]">
                    <div className="text-[10px] text-[#a1a1aa] mb-1">مسافر</div>
                    <div className="text-[#fafafa] text-sm font-medium">{selectedTrip.passengerName || '-'}</div>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#333]">
                    <div className="text-[10px] text-[#a1a1aa] mb-1">تلفن</div>
                    <div className="text-[#fafafa] text-sm font-medium" dir="ltr">{selectedTrip.passengerPhone || '-'}</div>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#333]">
                    <div className="text-[10px] text-[#a1a1aa] mb-1">مبلغ</div>
                    <div className="text-[#D4AF37] text-sm font-bold">{new Intl.NumberFormat('fa-IR').format(selectedTrip.totalFare || 0)} تومان</div>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#333]">
                    <div className="text-[10px] text-[#a1a1aa] mb-1">فاصله</div>
                    <div className="text-[#fafafa] text-sm font-medium">{selectedTrip.distanceKm ? new Intl.NumberFormat('fa-IR').format(selectedTrip.distanceKm) + ' km' : '-'}</div>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#333] mb-4">
                  <div className="text-[10px] text-[#a1a1aa] mb-2">مسیر سفر</div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] flex-shrink-0" />
                    <span className="text-[#fafafa]">{selectedTrip.originAddress}</span>
                  </div>
                  <div className="mr-1 my-1 border-r border-[#333] h-3" />
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] flex-shrink-0" />
                    <span className="text-[#fafafa]">{selectedTrip.destAddress}</span>
                  </div>
                </div>

                {hasMapCoords(selectedTrip) && (
                  <div className="mb-4">
                    <div className="text-[10px] text-[#a1a1aa] mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      نقشه مبدا و مقصد
                    </div>
                    <TripDetailMap
                      originLat={selectedTrip.originLat}
                      originLng={selectedTrip.originLng}
                      originName={selectedTrip.originAddress}
                      destLat={selectedTrip.destLat}
                      destLng={selectedTrip.destLng}
                      destName={selectedTrip.destAddress}
                    />
                  </div>
                )}

                {selectedTrip.notes && (
                  <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#333]">
                    <div className="text-[10px] text-[#a1a1aa] mb-1">توضیحات</div>
                    <div className="text-[#fafafa] text-sm">{selectedTrip.notes}</div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Passengers Tab ───
function PassengersTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <h2 className="text-xl font-bold text-[#fafafa]">مدیریت مسافران</h2>
      <Card className="bg-[#1a1a1a] border border-[#333] p-8 text-center"><p className="text-[#a1a1aa]">لیست مسافران از دیتابیس بارگذاری می‌شود</p></Card>
    </motion.div>
  );
}

// ─── Drivers Tab ───
function DriversTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <h2 className="text-xl font-bold text-[#fafafa]">مدیریت رانندگان</h2>
      <Card className="bg-[#1a1a1a] border border-[#333] p-8 text-center"><p className="text-[#a1a1aa]">لیست رانندگان از دیتابیس بارگذاری می‌شود</p></Card>
    </motion.div>
  );
}

// ─── Content Editor Tab ───
type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'list';
  placeholder?: string;
  hint?: string;
};

type SectionDef = {
  id: string;
  label: string;
  icon: string;
  description: string;
  fields: FieldDef[];
};

const SECTION_DEFS: SectionDef[] = [
  {
    id: 'hero', label: 'هدر اصلی', icon: '🏠', description: 'بخش بالای صفحه - اولین چیزی که کاربر می‌بیند',
    fields: [
      { key: 'badge', label: 'متن نشان (Badge)', type: 'text', placeholder: 'تاکسی VIP بین شهری', hint: 'نشان طلایی بالای عنوان' },
      { key: 'title', label: 'عنوان اصلی', type: 'text', placeholder: 'سفری لوکس، راحت و ایمن با سیوان' },
      { key: 'subtitle', label: 'توضیحات', type: 'textarea', placeholder: 'با ناوگان لوکس و رانندگان حرفه‌ای...' },
      { key: 'bgImage', label: 'آدرس تصویر پس‌زمینه', type: 'text', placeholder: '/images/hero-bg.png', hint: 'مسیر تصویر پس‌زمینه هدر' },
    ],
  },
  {
    id: 'services', label: 'خدمات', icon: '🚗', description: 'بخش معرفی انواع خدمات سفر',
    fields: [
      { key: 'title', label: 'عنوان بخش', type: 'text', placeholder: 'انواع خدمات سفر' },
      { key: 'subtitle', label: 'زیرعنوان', type: 'text', placeholder: 'خدمات متنوع برای نیازهای شما' },
      { key: 'items', label: 'لیست خدمات', type: 'list', hint: 'هر خط: عنوان | توضیحات | آیکون (مثل: تاکسی VIP لوکس | هیوندای سوناتا | ✨)' },
    ],
  },
  {
    id: 'whyUs', label: 'چرا سیوان', icon: '✅', description: 'بخش مزایا و دلایل انتخاب سیوان',
    fields: [
      { key: 'title', label: 'عنوان بخش', type: 'text', placeholder: 'چرا سیوان؟' },
      { key: 'subtitle', label: 'زیرعنوان', type: 'text', placeholder: 'مزایای سفر با ما' },
      { key: 'items', label: 'لیست مزایا', type: 'list', hint: 'هر خط: عنوان | توضیحات | آیکون (مثل: امنیت بالا | رانندگان تأیید شده | 🛡️)' },
    ],
  },
  {
    id: 'fleet', label: 'ناوگان', icon: '🏎️', description: 'بخش نمایش ناوگان خودروها',
    fields: [
      { key: 'title', label: 'عنوان بخش', type: 'text', placeholder: 'ناوگان لوکس سیوان' },
      { key: 'subtitle', label: 'زیرعنوان', type: 'text', placeholder: 'بهترین خودروها برای سفر شما' },
      { key: 'description', label: 'توضیحات ناوگان', type: 'textarea', placeholder: 'توضیحات کامل درباره ناوگان خودروها...' },
    ],
  },
  {
    id: 'cta', label: 'دعوت به اقدام', icon: '📞', description: 'بخش تشویق به رزرو سفر',
    fields: [
      { key: 'title', label: 'عنوان', type: 'text', placeholder: 'آماده سفر هستید؟' },
      { key: 'subtitle', label: 'زیرعنوان', type: 'text', placeholder: 'همین حالا رزرو کنید' },
      { key: 'buttonText', label: 'متن دکمه', type: 'text', placeholder: 'رزرو تاکسی ویژه' },
      { key: 'phone', label: 'شماره تماس', type: 'text', placeholder: '09109419743', hint: 'شماره نمایش داده شده در دکمه تماس' },
    ],
  },
  {
    id: 'footer', label: 'فوتر', icon: '📋', description: 'بخش پایین صفحه',
    fields: [
      { key: 'brandName', label: 'نام برند', type: 'text', placeholder: 'تاکسی ویژه سیوان' },
      { key: 'description', label: 'توضیحات برند', type: 'textarea', placeholder: 'توضیحات کوتاه درباره سیوان...' },
      { key: 'copyright', label: 'متن کپی‌رایت', type: 'text', placeholder: '© ۱۴۰۴ سیوان - تمامی حقوق محفوظ است' },
      { key: 'address', label: 'آدرس', type: 'text', placeholder: 'تهران، ایران' },
    ],
  },
  {
    id: 'about', label: 'درباره ما', icon: 'ℹ️', description: 'بخش معرفی شرکت',
    fields: [
      { key: 'title', label: 'عنوان', type: 'text', placeholder: 'درباره سیوان' },
      { key: 'subtitle', label: 'زیرعنوان', type: 'text', placeholder: 'تاریخچه و ماموریت ما' },
      { key: 'body', label: 'متن کامل', type: 'textarea', placeholder: 'متن کامل درباره ما (می‌تواند HTML باشد)...' },
    ],
  },
];

function parseSectionData(raw: { title?: string; subtitle?: string; body?: string } | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw) return result;
  result.title = raw.title || '';
  result.subtitle = raw.subtitle || '';
  if (raw.body) {
    try {
      const parsed = JSON.parse(raw.body);
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') result[k] = v;
          else if (Array.isArray(v)) result[k] = (v as string[]).join('\n');
        }
      } else {
        result.body = raw.body;
      }
    } catch {
      result.body = raw.body;
    }
  }
  return result;
}

function serializeSectionData(data: Record<string, string>): { title: string; subtitle: string; body: string } {
  const title = data.title || '';
  const subtitle = data.subtitle || '';
  const extra: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === 'title' || k === 'subtitle') continue;
    if (k === 'items' || k === 'body') {
      extra[k] = v;
    } else {
      extra[k] = v;
    }
  }
  const hasExtra = Object.keys(extra).length > 0;
  return { title, subtitle, body: hasExtra ? JSON.stringify(extra) : '' };
}

function ContentTab() {
  const [sections, setSections] = useState<Record<string, { title: string; subtitle: string; body: string }>>({});
  const [activeSection, setActiveSection] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/content').then(r => r.json()).then(data => { setSections(data || {}); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const sectionDef = SECTION_DEFS.find(s => s.id === activeSection)!;
  const rawData = sections[activeSection];
  const fieldValues = parseSectionData(rawData);

  const setField = (key: string, value: string) => {
    const updated = { ...fieldValues, [key]: value };
    const serialized = serializeSectionData(updated);
    setSections({ ...sections, [activeSection]: serialized });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sections }) });
      if (!res.ok) throw new Error();
      toast.success('محتوا با موفقیت ذخیره شد', { duration: 3000 });
    } catch {
      toast.error('خطا در ذخیره محتوا');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#fafafa]">مدیریت محتوا</h2>
          <p className="text-[#a1a1aa] text-sm mt-1">ویرایش متون و تنظیمات هر بخش از سایت</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold h-10 px-6 rounded-xl">
          {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
          ذخیره تغییرات
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Section selector */}
        <div className="w-full md:w-60 shrink-0">
          <Card className="bg-[#1a1a1a] border border-[#333] p-3">
            <p className="text-[#a1a1aa] text-xs mb-3 px-2">بخش مورد نظر را انتخاب کنید</p>
            <div className="space-y-1">
              {SECTION_DEFS.map((s) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${activeSection === s.id ? 'bg-[#D4AF37] text-[#0a0a0a] font-bold' : 'text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#2d2d2d]'}`}>
                  <span className="text-base">{s.icon}</span>{s.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Editor */}
        <div className="flex-1 space-y-5">
          <Card className="bg-[#1a1a1a] border border-[#333] p-6 space-y-5">
            <div className="pb-4 border-b border-[#333]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{sectionDef.icon}</span>
                <h3 className="text-[#D4AF37] font-bold text-lg">{sectionDef.label}</h3>
              </div>
              <p className="text-[#a1a1aa] text-xs">{sectionDef.description}</p>
            </div>
            <div className="space-y-4">
              {sectionDef.fields.map((field) => {
                const value = fieldValues[field.key] || '';
                if (field.type === 'textarea') {
                  return (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-[#a1a1aa] text-sm">{field.label}</Label>
                      <textarea value={value} onChange={(e) => setField(field.key, e.target.value)} className="w-full min-h-[100px] bg-[#0a0a0a] border border-[#333] text-[#fafafa] placeholder:text-[#888] rounded-lg p-3 text-sm resize-y focus:outline-none focus:border-[#D4AF37]/50" placeholder={field.placeholder} dir="rtl" />
                      {field.hint && <p className="text-[10px] text-[#888]">{field.hint}</p>}
                    </div>
                  );
                }
                if (field.type === 'list') {
                  return (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-[#a1a1aa] text-sm">{field.label}</Label>
                      <textarea value={value} onChange={(e) => setField(field.key, e.target.value)} className="w-full min-h-[140px] bg-[#0a0a0a] border border-[#333] text-[#fafafa] placeholder:text-[#888] rounded-lg p-3 text-sm resize-y focus:outline-none focus:border-[#D4AF37]/50 font-mono" placeholder={field.hint || 'هر خط یک مورد...'} dir="rtl" />
                      {field.hint && <p className="text-[10px] text-[#888]">{field.hint}</p>}
                    </div>
                  );
                }
                return (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-[#a1a1aa] text-sm">{field.label}</Label>
                    <Input value={value} onChange={(e) => setField(field.key, e.target.value)} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" placeholder={field.placeholder} dir={field.key === 'phone' || field.key === 'bgImage' ? 'ltr' : 'rtl'} />
                    {field.hint && <p className="text-[10px] text-[#888]">{field.hint}</p>}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// ─── AI Blog Generator Panel ───
// Controls the AI auto-blog mini-service (port 3005 via gateway):
// - Shows current status (running / last generated / total posts)
// - "Generate now" button triggers immediate generation
// - Explains the 6-hour automatic schedule
function AIBlogGenerator({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<{
    running: boolean;
    lastGeneratedAt: string | null;
    lastError: string | null;
    totalPosts: number;
  } | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [customTriggering, setCustomTriggering] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/blog-generator/status', { cache: 'no-store' });
      if (!res.ok) throw new Error('status fetch failed');
      const data = await res.json();
      setStatus({
        running: !!data.running,
        lastGeneratedAt: data.lastGeneratedAt || null,
        lastError: data.lastError || null,
        totalPosts: data.totalPosts ?? 0,
      });
      return data;
    } catch {
      setStatus(null);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 5000);
    return () => clearInterval(t);
  }, [fetchStatus]);

  // When generation finishes (running transitions true->false), refresh posts.
  const prevRunning = React.useRef(false);
  useEffect(() => {
    if (!status) return;
    if (prevRunning.current && !status.running) {
      onComplete();
    }
    prevRunning.current = status.running;
  }, [status, onComplete]);

  const handleGenerate = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/blog-generator/generate', { method: 'POST' });
      const data = await res.json();
      if (data.started) {
        toast.success('تولید مقاله با هوش مصنوعی شروع شد — چند دقیقه طول می‌کشد');
        // Immediately refresh status so the "generating" state shows.
        setTimeout(fetchStatus, 500);
      } else {
        toast.info(data.message || 'تولید قبلی هنوز در حال انجام است');
      }
    } catch {
      toast.error('خطا در ارتباط با سرویس تولید مقاله');
    } finally {
      setTriggering(false);
    }
  };

  const handleCustomGenerate = async () => {
    const topic = customTopic.trim();
    if (!topic) {
      toast.error('لطفاً موضوع مقاله را وارد کنید');
      return;
    }
    if (topic.length < 3) {
      toast.error('موضوع مقاله باید حداقل ۳ کاراکتر باشد');
      return;
    }
    if (topic.length > 200) {
      toast.error('موضوع مقاله نباید بیشتر از ۲۰۰ کاراکتر باشد');
      return;
    }
    setCustomTriggering(true);
    try {
      const res = await fetch('/api/blog-generator/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data.started) {
        toast.success(`تولید مقاله با موضوع «${topic.slice(0, 40)}${topic.length > 40 ? '…' : ''}» شروع شد`);
        setCustomTopic('');
        setTimeout(fetchStatus, 500);
      } else {
        toast.info(data.message || 'تولید قبلی هنوز در حال انجام است');
      }
    } catch {
      toast.error('خطا در ارتباط با سرویس تولید مقاله');
    } finally {
      setCustomTriggering(false);
    }
  };

  const lastGeneratedText = (() => {
    if (!status?.lastGeneratedAt) return 'هنوز تولید نشده';
    try {
      const d = new Date(status.lastGeneratedAt);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'همین الان';
      if (mins < 60) return `${toPersianDigits(mins)} دقیقه پیش`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${toPersianDigits(hrs)} ساعت پیش`;
      return formatJalaaliDate(d);
    } catch {
      return 'نامشخص';
    }
  })();

  return (
    <Card className="bg-gradient-to-l from-[#1a1a1a] to-[#1f1a0f] border border-[#D4AF37]/25 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-[#fafafa] font-bold text-sm sm:text-base flex items-center gap-2">
                تولید خودکار مقاله با هوش مصنوعی
                <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 text-[10px] px-2 py-0.5">هر ۶ ساعت</Badge>
              </h3>
              <p className="text-[#a1a1aa] text-xs mt-1 leading-relaxed">
                هوش مصنوعی هر ۶ ساعت یک مقاله سئو-بهینه جدید با عکس و متن جاستیفای منتشر می‌کند. موضوعات مرتبط با سفر VIP، تاکسی بین شهری و اهداف سایت سیوان هستند.
              </p>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={triggering || status?.running}
            className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-9 px-4 rounded-lg text-sm font-bold flex-shrink-0"
          >
            {status?.running ? (
              <><Loader2 className="h-4 w-4 ml-1.5 animate-spin" />در حال تولید...</>
            ) : (
              <><Wand2 className="h-4 w-4 ml-1.5" />تولید فوری مقاله</>
            )}
          </Button>
        </div>

        {/* Status row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#333]">
          <div className="text-center">
            <div className="text-[10px] text-[#888] mb-1">وضعیت</div>
            <div className={`text-xs font-bold flex items-center justify-center gap-1 ${status?.running ? 'text-[#D4AF37]' : 'text-green-400'}`}>
              {status === null ? (
                <span className="text-[#888]">قطع</span>
              ) : status.running ? (
                <><Loader2 className="h-3 w-3 animate-spin" />در حال تولید</>
              ) : (
                <><CheckCircle2 className="h-3 w-3" />آماده</>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-[#888] mb-1">آخرین تولید</div>
            <div className="text-xs text-[#fafafa]">{lastGeneratedText}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-[#888] mb-1">کل مقالات</div>
            <div className="text-xs text-[#fafafa]">{status ? toPersianDigits(status.totalPosts) : '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-[#888] mb-1">زمان‌بندی</div>
            <div className="text-xs text-[#fafafa]">هر ۶ ساعت</div>
          </div>
        </div>

        {status?.lastError && (
          <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>خطای آخرین تولید: {status.lastError}</span>
          </div>
        )}

        {/* Custom topic generation — independent of the 6h auto schedule */}
        <div className="mt-4 pt-4 border-t border-[#333]">
          <div className="flex items-center gap-2 mb-2">
            <PenLine className="h-4 w-4 text-[#D4AF37]" />
            <Label className="text-[#fafafa] text-xs sm:text-sm font-bold cursor-pointer">
              تولید مقاله با موضوع دلخواه
            </Label>
            <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-[9px] px-1.5 py-0.5 mr-auto">
              بدون تأثیر روی زمان‌بندی ۶ ساعته
            </Badge>
          </div>
          <p className="text-[#a1a1aa] text-[11px] mb-2.5 leading-relaxed">
            موضوعی مرتبط با سفر، گردشگری یا خودروهای لوکس وارد کنید. هوش مصنوعی یک مقاله سئو-بهینه با عکس روی همان موضوع می‌نویسد. این تولید، زمان‌بندی خودکار را تغییر نمی‌دهد.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Textarea
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="مثال: جاذبه‌های گردشگری جزیره هرمز و دره ستارگان"
              className="bg-[#0a0a0a] border-[#333] focus:border-[#D4AF37]/50 text-[#fafafa] text-sm resize-none placeholder:text-[#555] min-h-[44px] flex-1"
              rows={2}
              maxLength={200}
              disabled={customTriggering || status?.running}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleCustomGenerate();
                }
              }}
            />
            <Button
              onClick={handleCustomGenerate}
              disabled={customTriggering || status?.running || customTopic.trim().length < 3}
              className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-9 px-4 rounded-lg text-sm font-bold flex-shrink-0 sm:self-end"
            >
              {customTriggering ? (
                <><Loader2 className="h-4 w-4 ml-1.5 animate-spin" />در حال ارسال...</>
              ) : (
                <><Sparkles className="h-4 w-4 ml-1.5" />تولید با این موضوع</>
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#666]">
            <span className="hidden sm:inline">Ctrl+Enter برای ارسال سریع</span>
            <span className="mr-auto">{toPersianDigits(customTopic.length)} / ۲۰۰</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Blog Management Tab ───
function BlogTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);

  const loadPosts = useCallback(() => {
    setLoading(true);
    const q = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
    fetch(`/api/admin/blog${q}`).then(r => r.json()).then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }, [statusFilter]);

  const handleGenerateComplete = useCallback(() => {
    // Refresh the post list after AI generation completes.
    loadPosts();
  }, [loadPosts]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleNew = () => {
    setEditingPost({ title: '', slug: '', excerpt: '', content: '', featuredImageUrl: '', status: 'draft', tags: [] });
    setShowEditor(true);
  };

  const handleEdit = (post: any) => {
    setEditingPost({ ...post, tags: JSON.parse(post.tags || '[]') });
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئنید؟')) return;
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    loadPosts();
    toast.success('مقاله حذف شد');
  };

  const handleSavePost = async (data: any) => {
    try {
      if (data.id) {
        await fetch('/api/admin/blog', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        toast.success('مقاله ویرایش شد');
      } else {
        await fetch('/api/admin/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        toast.success('مقاله جدید ایجاد شد');
      }
      setShowEditor(false);
      loadPosts();
    } catch {
      toast.error('خطا در ذخیره مقاله');
    }
  };

  const handleUpload = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.url;
  };

  if (showEditor) {
    return <BlogEditor post={editingPost} onSave={handleSavePost} onCancel={() => setShowEditor(false)} onUpload={handleUpload} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-[#fafafa]">مدیریت بلاگ</h2>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-[#1a1a1a] border-[#333] text-[#fafafa] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#333]">
              <SelectItem value="all" className="text-[#fafafa]">همه</SelectItem>
              <SelectItem value="published" className="text-[#fafafa]">منتشر شده</SelectItem>
              <SelectItem value="draft" className="text-[#fafafa]">پیش‌نویس</SelectItem>
              <SelectItem value="archived" className="text-[#fafafa]">بایگانی</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleNew} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-9 px-4 rounded-lg text-sm font-bold">
            <Plus className="h-4 w-4 ml-1.5" />مقاله جدید
          </Button>
        </div>
      </div>

      <AIBlogGenerator onComplete={handleGenerateComplete} />

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>
      ) : (
        <Card className="bg-[#1a1a1a] border border-[#333] overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <Table><TableHeader><TableRow className="border-[#333]"><TableHead className="text-[#a1a1aa]">عنوان</TableHead><TableHead className="text-[#a1a1aa]">وضعیت</TableHead><TableHead className="text-[#a1a1aa]">تصویر</TableHead><TableHead className="text-[#a1a1aa]">تاریخ</TableHead><TableHead className="text-[#a1a1aa] text-left">عملیات</TableHead></TableRow></TableHeader>
              <TableBody>
                {posts.length === 0 && <TableRow className="border-[#333]"><TableCell colSpan={5} className="text-center text-[#a1a1aa] py-8">مقاله‌ای وجود ندارد</TableCell></TableRow>}
                {posts.map((post: any) => (
                  <TableRow key={post.id} className="border-[#333] hover:bg-[#2d2d2d]/50">
                    <TableCell className="text-[#fafafa] text-sm font-medium max-w-xs truncate">{post.title}</TableCell>
                    <TableCell>{getBlogStatusBadge(post.status)}</TableCell>
                    <TableCell>{post.featuredImageUrl ? <img src={post.featuredImageUrl} alt={post.title} className="h-8 w-12 object-cover rounded" /> : <span className="text-[#888] text-xs">بدون تصویر</span>}</TableCell>
                    <TableCell className="text-[#a1a1aa] text-sm">{formatJalaaliDate(post.createdAt)}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(post)} className="text-[#D4AF37] hover:bg-[#D4AF37]/10 h-8 px-2"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} className="text-red-400 hover:bg-red-500/10 h-8 px-2"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </motion.div>
  );
}

// Blog Editor
function BlogEditor(props) {
  const { post, onSave, onCancel, onUpload } = props;
  const [form, setForm] = useState(post);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = (typeof window !== 'undefined') ? React.createRef<HTMLInputElement>() : null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      setForm({ ...form, featuredImageUrl: url });
    } catch (err: any) {
      toast.error(err.message || 'خطا در آپلود');
    }
    setUploading(false);
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || (form.tags || []).includes(tagInput.trim())) return;
    setForm({ ...form, tags: [...(form.tags || []), tagInput.trim()] });
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setForm({ ...form, tags: (form.tags || []).filter((t: string) => t !== tag) });
  };

  const handleSave = () => {
    if (!form.title || !form.slug) {
      toast.error('عنوان و slug الزامی است');
      return;
    }
    setSaving(true);
    onSave(form);
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#fafafa]">{form.id ? 'ویرایش مقاله' : 'مقاله جدید'}</h2>
        <Button variant="ghost" onClick={onCancel} className="text-[#a1a1aa] hover:text-[#fafafa]">انصراف</Button>
      </div>

      <Card className="bg-[#1a1a1a] border border-[#333] p-6 space-y-5">
        {/* Featured Image */}
        <div className="space-y-2">
          <Label className="text-[#a1a1aa] text-sm"><Image className="h-3.5 w-3.5 ml-1.5 inline" />تصویر شاخص</Label>
          <div className="flex items-center gap-4">
            {form.featuredImageUrl && <img src={form.featuredImageUrl} alt={form.title || 'تصویر شاخص'} className="h-24 w-40 object-cover rounded-lg border border-[#333]" />}
            <div className="space-y-2">
              <input type="file" ref={fileRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <Button variant="outline" onClick={() => fileRef?.current?.click()} disabled={uploading} className="border-[#333] text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#2d2d2d]">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin ml-1.5" /> : <Image className="h-4 w-4 ml-1.5" />}
                آپلود تصویر
              </Button>
              <Input value={form.featuredImageUrl || ''} onChange={(e) => setForm({ ...form, featuredImageUrl: e.target.value })} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-9 text-xs" placeholder="یا وارد کنید URL تصویر..." dir="ltr" />
            </div>
          </div>
        </div>

        {/* Title & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[#fafafa] text-sm">عنوان *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" placeholder="عنوان مقاله..." />
          </div>
          <div className="space-y-2">
            <Label className="text-[#fafafa] text-sm">Slug *</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-ا-ی]/g, '') })} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" placeholder="slug-maqaleh" dir="ltr" />
          </div>
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label className="text-[#fafafa] text-sm">خلاصه</Label>
          <textarea value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="w-full min-h-[60px] bg-[#0a0a0a] border border-[#333] text-[#fafafa] placeholder:text-[#888] rounded-lg p-3 text-sm resize-y focus:outline-none focus:border-[#D4AF37]/50" placeholder="خلاصه کوتاه مقاله..." dir="rtl" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label className="text-[#fafafa] text-sm">محتوای اصلی</Label>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full min-h-[300px] bg-[#0a0a0a] border border-[#333] text-[#fafafa] placeholder:text-[#888] rounded-lg p-3 text-sm resize-y focus:outline-none focus:border-[#D4AF37]/50" placeholder="محتوای مقاله (می‌تواند HTML باشد)..." dir="rtl" />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-[#fafafa] text-sm">برچسب‌ها</Label>
          <div className="flex items-center gap-2 flex-wrap">
            {(form.tags || []).map((tag: string) => (
              <Badge key={tag} className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 gap-1">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-9 text-sm flex-1" placeholder="برچسب جدید..." />
            <Button variant="outline" onClick={handleAddTag} className="border-[#333] text-[#a1a1aa] hover:text-[#fafafa] h-9 px-3">افزودن</Button>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-[#fafafa] text-sm">وضعیت</Label>
          <Select value={form.status || 'draft'} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="w-full bg-[#0a0a0a] border-[#333] text-[#fafafa] h-11"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#333]">
              <SelectItem value="draft" className="text-[#fafafa]">پیش‌نویس</SelectItem>
              <SelectItem value="published" className="text-[#fafafa]">منتشر شده</SelectItem>
              <SelectItem value="archived" className="text-[#fafafa]">بایگانی</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold h-11 px-8 rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
            ذخیره
          </Button>
          {form.status === 'draft' && (
            <Button onClick={() => { setForm({ ...form, status: 'published' }); }} variant="outline" className="border-[#333] text-[#10B981] hover:bg-[#10B981]/10 h-11 px-6 rounded-xl">
              <Send className="h-4 w-4 ml-2" />انتشار
            </Button>
          )}
          <Button variant="ghost" onClick={onCancel} className="text-[#a1a1aa] hover:text-[#fafafa] h-11 px-6 rounded-xl">انصراف</Button>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Pricing Tab ───
function PricingTab() {
  const [form, setForm] = useState({
    baseFare: '50000',
    minFare: '100000',
    economyPerKm: '2000',
    vipPerKm: '3000',
    luxuryPerKm: '5000',
    vanPerKm: '2500',
    electricPerKm: '3500',
    roundTripDiscount: '0',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<{ tripType: string; distanceKm: string }>({ tripType: 'vip', distanceKm: '100' });

  useEffect(() => {
    fetch('/api/admin/pricing').then(r => r.json()).then(data => {
      if (data && typeof data.baseFare === 'number') {
        setForm({
          baseFare: String(data.baseFare),
          minFare: String(data.minFare),
          economyPerKm: String(data.economyPerKm),
          vipPerKm: String(data.vipPerKm),
          luxuryPerKm: String(data.luxuryPerKm),
          vanPerKm: String(data.vanPerKm),
          electricPerKm: String(data.electricPerKm),
          roundTripDiscount: String(data.roundTripDiscount),
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseFare: parseFloat(form.baseFare) || 0,
          minFare: parseFloat(form.minFare) || 0,
          economyPerKm: parseFloat(form.economyPerKm) || 0,
          vipPerKm: parseFloat(form.vipPerKm) || 0,
          luxuryPerKm: parseFloat(form.luxuryPerKm) || 0,
          vanPerKm: parseFloat(form.vanPerKm) || 0,
          electricPerKm: parseFloat(form.electricPerKm) || 0,
          roundTripDiscount: parseFloat(form.roundTripDiscount) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('قیمت‌گذاری با موفقیت ذخیره شد');
    } catch {
      toast.error('خطا در ذخیره قیمت‌گذاری');
    }
    setSaving(false);
  };

  const rateForType = (t: string) => {
    switch (t) {
      case 'economy': return parseFloat(form.economyPerKm) || 0;
      case 'vip': return parseFloat(form.vipPerKm) || 0;
      case 'luxury': return parseFloat(form.luxuryPerKm) || 0;
      case 'van': return parseFloat(form.vanPerKm) || 0;
      case 'electric': return parseFloat(form.electricPerKm) || 0;
      default: return 0;
    }
  };

  const previewPrice = (() => {
    const dist = parseFloat(preview.distanceKm) || 0;
    const base = parseFloat(form.baseFare) || 0;
    const min = parseFloat(form.minFare) || 0;
    let p = base + dist * rateForType(preview.tripType);
    if (p < min) p = min;
    return Math.round(p);
  })();

  const vehicleCategories = [
    { id: 'economy', label: 'اقتصادی', desc: 'خودرو معمولی - قیمت مناسب', icon: '🚗', color: '#10B981' },
    { id: 'vip', label: 'لوکس', desc: 'هیوندای سوناتا - لوکس و راحت', icon: '✨', color: '#D4AF37' },
    { id: 'luxury', label: 'دربستی ویژه', desc: 'مرسدس بنز - اختصاصی و لوکس', icon: '👑', color: '#F59E0B' },
    { id: 'van', label: 'ون', desc: 'ون ۸ نفره - مناسب گروهی', icon: '🚐', color: '#3B82F6' },
    { id: 'electric', label: 'سوپر لوکس', desc: 'خودرو لوکس پریمیوم - بهترین تجربه', icon: '💎', color: '#22C55E' },
  ];

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#fafafa]">مدیریت قیمت‌گذاری</h2>
          <p className="text-[#a1a1aa] text-sm mt-1">تعیین هزینه پایه و نرخ هر کیلومتر برای هر دسته‌بندی خودرو</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold h-10 px-6 rounded-xl">
          {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
          ذخیره قیمت‌ها
        </Button>
      </div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
          <Check className="h-4 w-4" />قیمت‌گذاری جدید اعمال شد و از این پس در محاسبه سفرها استفاده می‌شود.
        </motion.div>
      )}

      {/* Base fares */}
      <Card className="bg-[#1a1a1a] border border-[#333] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-[#D4AF37]" />
          <h3 className="text-[#fafafa] font-bold">هزینه‌های پایه</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PF label="هزینه پایه (ورود به سفر)" value={form.baseFare} onChange={(v) => setForm({ ...form, baseFare: v })} hint="مبلغ ثابت شروع هر سفر" />
          <PF label="حداقل کرایه" value={form.minFare} onChange={(v) => setForm({ ...form, minFare: v })} hint="کمترین مبلغ قابل دریافت" />
          <PF label="تخفیف رفت و برگشت (٪)" value={form.roundTripDiscount} onChange={(v) => setForm({ ...form, roundTripDiscount: v })} hint="درصد تخفیف سفر دو طرفه" max="100" />
        </div>
      </Card>

      {/* Per-vehicle-category rates */}
      <Card className="bg-[#1a1a1a] border border-[#333] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-[#D4AF37]" />
            <h3 className="text-[#fafafa] font-bold">نرخ هر کیلومتر بر اساس دسته‌بندی خودرو</h3>
          </div>
          <span className="text-[#a1a1aa] text-xs">تومان بر کیلومتر</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicleCategories.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-[#333] bg-[#0a0a0a] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${cat.color}15` }}>
                  {cat.icon}
                </div>
                <div>
                  <p className="text-[#fafafa] font-bold text-sm">{cat.label}</p>
                  <p className="text-[#a1a1aa] text-xs">{cat.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={form[`${cat.id}PerKm` as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [`${cat.id}PerKm`]: e.target.value })}
                  className="bg-[#1a1a1a] border-[#333] text-[#fafafa] h-10 text-sm"
                  dir="ltr"
                />
                <span className="text-[#a1a1aa] text-xs whitespace-nowrap">تومان / کیلومتر</span>
              </div>
              <div className="text-[10px] text-[#888]">
                مثال ۱۰۰ کیلومتر: <span className="text-[#D4AF37] font-bold" dir="ltr">{new Intl.NumberFormat('fa-IR').format(Math.round((parseFloat(form.baseFare) || 0) + 100 * (parseFloat(form[`${cat.id}PerKm` as keyof typeof form]) || 0)))}</span> تومان
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Live preview */}
      <Card className="bg-[#1a1a1a] border border-[#333] p-6 space-y-4">
        <h3 className="text-[#fafafa] font-bold flex items-center gap-2"><CreditCard className="h-5 w-5 text-[#D4AF37]" />پیش‌نمایش محاسبه قیمت</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[#a1a1aa] text-sm">دسته‌بندی خودرو</Label>
            <Select value={preview.tripType} onValueChange={(v) => setPreview({ ...preview, tripType: v })}>
              <SelectTrigger className="w-full bg-[#0a0a0a] border-[#333] text-[#fafafa] h-11"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                {vehicleCategories.map((c) => (<SelectItem key={c.id} value={c.id} className="text-[#fafafa]">{c.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[#a1a1aa] text-sm">مسافت (کیلومتر)</Label>
            <Input type="number" value={preview.distanceKm} onChange={(e) => setPreview({ ...preview, distanceKm: e.target.value })} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-11" dir="ltr" />
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-l from-[#D4AF37]/15 to-transparent border border-[#D4AF37]/30 p-5 flex items-center justify-between">
          <div>
            <p className="text-[#a1a1aa] text-xs mb-1">قیمت محاسبه شده</p>
            <p className="text-2xl font-bold text-[#D4AF37]" dir="ltr">{new Intl.NumberFormat('fa-IR').format(previewPrice)}</p>
          </div>
          <div className="text-left text-xs text-[#a1a1aa] space-y-0.5" dir="ltr">
            <div>پایه: {new Intl.NumberFormat('fa-IR').format(Math.round(parseFloat(form.baseFare) || 0))}</div>
            <div>مسافت: {new Intl.NumberFormat('fa-IR').format(Math.round((parseFloat(preview.distanceKm) || 0) * rateForType(preview.tripType)))}</div>
            <div>نرخ: {new Intl.NumberFormat('fa-IR').format(rateForType(preview.tripType))} / کیلومتر</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function PF(props: { label: string; value: string; onChange: (v: string) => void; hint?: string; max?: string }) {
  const { label, value, onChange, hint, max } = props;
  return (
    <div className="space-y-2">
      <Label className="text-[#a1a1aa] text-sm">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-11" dir="ltr" max={max} />
      {hint && <p className="text-[10px] text-[#888]">{hint}</p>}
    </div>
  );
}

// ─── Emails Tab ───
interface EmailItem {
  id: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  toName: string | null;
  subject: string;
  status: string;
  mxHost: string | null;
  attemptCount: number;
  lastError: string | null;
  source: string;
  refId: string | null;
  sentAt: string | null;
  createdAt: string;
}

function EmailsTab() {
  const [items, setItems] = useState<EmailItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [viewing, setViewing] = useState<EmailItem | null>(null);
  const [viewHtml, setViewHtml] = useState<string>('');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/admin/emails' : `/api/admin/emails?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setStats(data.stats || {});
      }
    } catch {
      toast.error('خطا در دریافت ایمیل‌ها');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const to = String(fd.get('to') || '').trim();
    const toName = String(fd.get('toName') || '').trim();
    const subject = String(fd.get('subject') || '').trim();
    const html = String(fd.get('html') || '').trim();
    if (!to || !subject || !html) {
      toast.error('گیرنده، موضوع و متن ایمیل الزامی است');
      return;
    }
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, toName: toName || undefined, subject, html, source: 'manual' }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.status === 'sent' ? 'ایمیل با موفقیت ارسال شد' : 'ایمیل ثبت شد اما ارسال ناموفق بود (پورت 25 ممکن است مسدود باشد)');
        setShowCompose(false);
        load();
      } else {
        toast.error(data.error || 'ارسال ایمیل ناموفق بود');
      }
    } catch {
      toast.error('ارتباط با سرور برقرار نشد');
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await fetch(`/api/admin/emails/${id}?action=retry`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.status === 'sent' ? 'ایمیل با موفقیت ارسال شد' : 'تلاش مجدد ناموفق بود');
        load();
      } else {
        toast.error(data.error || 'تلاش مجدد ناموفق بود');
      }
    } catch {
      toast.error('ارتباط با سرور برقرار نشد');
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('این ایمیل از آرشیو حذف شود؟')) return;
    try {
      await fetch(`/api/admin/emails/${id}`, { method: 'DELETE' });
      toast.success('ایمیل حذف شد');
      load();
    } catch {
      toast.error('حذف ناموفق بود');
    }
  };

  const handleView = async (item: EmailItem) => {
    setViewing(item);
    setViewHtml('');
    try {
      const res = await fetch(`/api/admin/emails/${item.id}`);
      const data = await res.json();
      if (data.htmlBody) setViewHtml(data.htmlBody);
    } catch {
      // ignore
    }
  };

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#fafafa]">سیستم ایمیل داخلی</h2>
          <p className="text-xs text-[#888] mt-1">
            ارسال ایمیل از هویت اختصاصی سایت (noreply@sivantaxi.com) — تحویل مستقیم به سرور مقصد
          </p>
        </div>
        <Button onClick={() => setShowCompose(true)} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold h-11 px-5 rounded-xl">
          <Plus className="h-4 w-4 ml-2" />
          ایمیل جدید
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="کل" value={total} active={filter === 'all'} onClick={() => setFilter('all')} />
        <StatCard label="ارسال شده" value={stats.sent || 0} active={filter === 'sent'} onClick={() => setFilter('sent')} color="green" />
        <StatCard label="ناموفق" value={stats.failed || 0} active={filter === 'failed'} onClick={() => setFilter('failed')} color="red" />
        <StatCard label="در حال ارسال" value={stats.sending || 0} active={filter === 'sending'} onClick={() => setFilter('sending')} color="yellow" />
        <StatCard label="در صف" value={stats.queued || 0} active={filter === 'queued'} onClick={() => setFilter('queued')} color="blue" />
      </div>

      {/* List */}
      <Card className="bg-[#1a1a1a] border border-[#333] overflow-hidden">
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <h3 className="text-[#fafafa] font-bold flex items-center gap-2">
            <Inbox className="h-4 w-4 text-[#D4AF37]" />
            صندوق ارسالی‌ها
          </h3>
          <Button variant="ghost" size="sm" onClick={load} className="text-[#888] hover:text-[#fafafa] h-8">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto custom-scroll">
          {loading ? (
            <div className="p-8 text-center text-[#888]">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              در حال بارگذاری…
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-[#888]">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>هیچ ایمیلی یافت نشد</p>
              <p className="text-xs mt-1">برای ارسال اولین ایمیل، روی «ایمیل جدید» کلیک کنید</p>
            </div>
          ) : (
            <div className="divide-y divide-[#222]">
              {items.map(item => (
                <div key={item.id} className="p-4 hover:bg-[#1f1f1f] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <EmailStatusBadge status={item.status} />
                        <span className="text-sm font-bold text-[#fafafa] truncate">{item.subject}</span>
                        {item.source !== 'manual' && (
                          <Badge variant="outline" className="text-[10px] border-[#555] text-[#888]">{item.source}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-[#888] mt-1.5 flex items-center gap-3 flex-wrap">
                        <span>به: <span dir="ltr" className="text-[#bbb]">{item.toEmail}</span></span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}</span>
                        {item.mxHost && <><span>•</span><span dir="ltr" className="text-[#666]">{item.mxHost}</span></>}
                        {item.attemptCount > 1 && <><span>•</span><span>تلاش: {toPersianDigits(item.attemptCount)}</span></>}
                      </div>
                      {item.lastError && item.status === 'failed' && (
                        <p className="text-xs text-red-400/80 mt-1.5 line-clamp-1" dir="ltr">{item.lastError}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleView(item)} className="h-8 w-8 p-0 text-[#888] hover:text-[#fafafa]">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.status === 'failed' && (
                        <Button variant="ghost" size="sm" onClick={() => handleRetry(item.id)} disabled={retryingId === item.id} className="h-8 w-8 p-0 text-[#D4AF37] hover:text-[#E5C76B]">
                          {retryingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-8 w-8 p-0 text-[#888] hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Compose modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowCompose(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-[#333] flex items-center justify-between">
                <h3 className="text-[#fafafa] font-bold flex items-center gap-2">
                  <Send className="h-4 w-4 text-[#D4AF37]" />
                  ارسال ایمیل جدید
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCompose(false)} className="h-8 w-8 p-0 text-[#888]">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSend} className="p-5 space-y-4 overflow-y-auto custom-scroll flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <Label className="text-[#a1a1aa] text-sm mb-1.5 block">گیرنده *</Label>
                    <Input name="to" type="email" dir="ltr" required placeholder="example@gmail.com" className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-11" />
                  </div>
                  <div>
                    <Label className="text-[#a1a1aa] text-sm mb-1.5 block">نام گیرنده</Label>
                    <Input name="toName" dir="ltr" placeholder="اختیاری" className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-11" />
                  </div>
                </div>
                <div>
                  <Label className="text-[#a1a1aa] text-sm mb-1.5 block">موضوع *</Label>
                  <Input name="subject" required placeholder="موضوع ایمیل" className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-11" />
                </div>
                <div>
                  <Label className="text-[#a1a1aa] text-sm mb-1.5 block">متن (HTML) *</Label>
                  <textarea name="html" required rows={10} placeholder="<p>متن ایمیل</p>" className="w-full bg-[#0a0a0a] border border-[#333] text-[#fafafa] rounded-md p-3 text-sm font-mono" dir="ltr" />
                  <p className="text-[10px] text-[#888] mt-1">می‌توانید از تگ‌های HTML مانند &lt;p&gt;، &lt;strong&gt;، &lt;br&gt; استفاده کنید.</p>
                </div>
                <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-3">
                  <p className="text-xs text-[#888]">
                    <strong className="text-[#D4AF37]">فرستنده:</strong> «تاکسی ویژه سیوان» &lt;noreply@sivantaxi.com&gt;
                    <br />
                    ایمیل از طریق سرور اختصاصی سایت ارسال می‌شود. تحویل به گیرنده به تنظیمات DNS و باز بودن پورت 25 بستگی دارد.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowCompose(false)} className="text-[#888] hover:text-[#fafafa] h-11 px-5">انصراف</Button>
                  <Button type="submit" className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold h-11 px-6">
                    <Send className="h-4 w-4 ml-2" />
                    ارسال
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View modal */}
      <AnimatePresence>
        {viewing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-[#333] flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <EmailStatusBadge status={viewing.status} />
                  </div>
                  <h3 className="text-[#fafafa] font-bold truncate">{viewing.subject}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setViewing(null)} className="h-8 w-8 p-0 text-[#888]">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-5 overflow-y-auto custom-scroll flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-[#888]">از:</span> <span dir="ltr" className="text-[#fafafa]">{viewing.fromName} &lt;{viewing.fromEmail}&gt;</span></div>
                  <div><span className="text-[#888]">به:</span> <span dir="ltr" className="text-[#fafafa]">{viewing.toEmail}</span></div>
                  <div><span className="text-[#888]">زمان:</span> <span className="text-[#fafafa]">{new Date(viewing.createdAt).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}</span></div>
                  {viewing.mxHost && <div><span className="text-[#888]">سرور مقصد:</span> <span dir="ltr" className="text-[#fafafa]">{viewing.mxHost}</span></div>}
                </div>
                {viewing.lastError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-xs text-red-400 font-bold mb-1">خطای آخرین ارسال:</p>
                    <p className="text-xs text-red-300/80" dir="ltr">{viewing.lastError}</p>
                  </div>
                )}
                <div className="border-t border-[#333] pt-4">
                  <p className="text-xs text-[#888] mb-2">پیش‌نمایش:</p>
                  <div className="bg-white rounded-lg p-4 max-h-[50vh] overflow-y-auto" dir="rtl">
                    {viewHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: viewHtml }} />
                    ) : (
                      <p className="text-gray-400 text-sm">در حال بارگذاری…</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard(props: { label: string; value: number; active: boolean; onClick: () => void; color?: 'green' | 'red' | 'yellow' | 'blue' }) {
  const { label, value, active, onClick, color } = props;
  const colorMap = {
    green: 'text-green-400 bg-green-500/10',
    red: 'text-red-400 bg-red-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
  };
  return (
    <button onClick={onClick} className={`text-right p-3 rounded-xl border transition-all ${active ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-[#1a1a1a] border-[#333] hover:border-[#555]'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#888]">{label}</span>
        {color && <span className={`text-[10px] px-1.5 py-0.5 rounded ${colorMap[color]}`}>●</span>}
      </div>
      <div className={`text-xl font-bold mt-1 ${active ? 'text-[#D4AF37]' : 'text-[#fafafa]'}`}>{toPersianDigits(value)}</div>
    </button>
  );
}

function EmailStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    sent: { label: 'ارسال شد', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    failed: { label: 'ناموفق', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    sending: { label: 'در حال ارسال', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    queued: { label: 'در صف', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  };
  const info = map[status] || map.queued;
  return <Badge className={info.cls}>{info.label}</Badge>;
}

// ─── Settings Tab ───
// ─── Notifications Tab (push notifications to admin devices) ───
function NotificationsTab() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [devices, setDevices] = useState<{ id: string; label: string; createdAt: string; userAgent: string | null }[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [pushSupported, setPushSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPushSupported('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);
    if ('Notification' in window) setPermission(Notification.permission);
    // Check existing subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(s => setSubscribed(!!s))
      ).catch(() => {});
    }
    loadDevices();
  }, []);

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const res = await fetch('/api/push/subscriptions');
      const data = await res.json();
      setDevices(data.subscriptions || []);
    } catch { /* ignore */ } finally { setLoadingDevices(false); }
  }, []);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      // 1. Get VAPID public key
      const vapidRes = await fetch('/api/push/vapid-public');
      const vapidData = await vapidRes.json();
      if (!vapidData.configured) {
        toast.error('کلید VAPID روی سرور پیکربندی نشده است');
        setEnabling(false);
        return;
      }

      // 2. Request permission + subscribe via PushManager
      const permission = await Notification.requestPermission();
      setPermission(permission);
      if (permission !== 'granted') {
        toast.error('دسترسی نوتیفیکیشن رد شد. از تنظیمات مرورگر اجازه دهید.');
        setEnabling(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const convertedKey = urlBase64ToUint8Array(vapidData.publicKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // 3. Save subscription on the server
      const subJson = sub.toJSON();
      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          label: getDeviceLabel(),
          userAgent: navigator.userAgent,
        }),
      });
      if (!saveRes.ok) throw new Error('save failed');

      setSubscribed(true);
      toast.success('نوتیفیکیشن روی این دستگاه فعال شد ✅');
      loadDevices();
    } catch (e) {
      console.error(e);
      toast.error('خطا در فعال‌سازی نوتیفیکیشن');
    } finally {
      setEnabling(false);
    }
  };

  const handleDisable = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success('نوتیفیکیشن روی این دستگاه غیرفعال شد');
      loadDevices();
    } catch {
      toast.error('خطا در غیرفعال‌سازی');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message || `به ${data.sent} دستگاه ارسال شد`);
      } else {
        toast.error(data.error || 'ارسال ناموفق');
      }
    } catch {
      toast.error('خطا در ارسال تست');
    } finally {
      setTesting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-[#fafafa] flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#D4AF37]" />
          سیستم نوتیفیکیشن
        </h2>
        <p className="text-[#a1a1aa] text-sm mt-1">
          با فعال‌سازی نوتیفیکیشن، هنگام دریافت رزرو جدید یا ایمیل، روی گوشی و کامپیوترتان اعلان نمایش داده می‌شود — حتی اگر سایت بسته باشد.
        </p>
      </div>

      {!pushSupported && (
        <Card className="bg-red-500/10 border border-red-500/20 p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            مرورگر شما از نوتیفیکیشن push پشتیبانی نمی‌کند. از Chrome، Edge، Firefox یا Safari نسخه جدید استفاده کنید.
          </div>
        </Card>
      )}

      {/* Status card */}
      <Card className="bg-[#1a1a1a] border border-[#333] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${subscribed ? 'bg-green-500/15' : 'bg-[#D4AF37]/15'}`}>
              {subscribed ? <Bell className="h-6 w-6 text-green-400" /> : <BellOff className="h-6 w-6 text-[#D4AF37]" />}
            </div>
            <div>
              <h3 className="text-[#fafafa] font-bold">وضعیت این دستگاه</h3>
              <p className="text-[#a1a1aa] text-xs mt-0.5">
                {subscribed ? 'فعال — نوتیفیکیشن‌ها دریافت می‌شود' : 'غیرفعال — روی دکمه زیر بزنید'}
              </p>
            </div>
          </div>
          <Badge className={
            permission === 'granted' ? 'bg-green-500/15 text-green-400 border-green-500/30'
            : permission === 'denied' ? 'bg-red-500/15 text-red-400 border-red-500/30'
            : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
          }>
            {permission === 'granted' ? 'اجازه داده شده' : permission === 'denied' ? 'مسدود شده' : 'در انتظار'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3">
          {!subscribed ? (
            <Button onClick={handleEnable} disabled={enabling || !pushSupported} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold h-11 px-6 rounded-xl">
              {enabling ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Bell className="h-4 w-4 ml-2" />}
              فعال‌سازی نوتیفیکیشن
            </Button>
          ) : (
            <Button onClick={handleDisable} variant="outline" className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 h-11 px-6 rounded-xl">
              <BellOff className="h-4 w-4 ml-2" />
              غیرفعال‌سازی این دستگاه
            </Button>
          )}
          <Button onClick={handleTest} disabled={testing} variant="outline" className="bg-transparent border-[#333] text-[#fafafa] hover:bg-[#2d2d2d] h-11 px-6 rounded-xl">
            {testing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
            ارسال نوتیفیکیشن تست
          </Button>
        </div>

        {permission === 'denied' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300 leading-relaxed">
            دسترسی نوتیفیکیشن مسدود شده است. برای رفع آن، روی آیکن قفل کنار آدرس سایت کلیک کرده و «Notifications» را روی «Allow» قرار دهید، سپس صفحه را رفرش کنید.
          </div>
        )}
      </Card>

      {/* How it works */}
      <Card className="bg-[#0a0a0a] border border-[#D4AF37]/20 p-5">
        <h4 className="text-[#D4AF37] font-bold text-sm mb-3">چطور کار می‌کند؟</h4>
        <ol className="text-xs text-[#bbb] space-y-2 list-decimal pr-5 leading-relaxed">
          <li>روی «فعال‌سازی نوتیفیکیشن» بزنید و اجازه مرورگر را تایید کنید.</li>
          <li>این دستگاه در سرور ثبت می‌شود تا بتواند اعلان دریافت کند.</li>
          <li>از این پس هر رزرو جدید یا ایمیل دریافتی، فوراً روی این دستگاه اعلان می‌شود — حتی اگر تب مرورگر بسته باشد (تا زمانی که مرورگر در پس‌زمینه اجرا باشد).</li>
          <li>برای نصب دائمی روی دسکتاپ/گوشی، از منوی مرورگر «Install app» را بزنید.</li>
          <li>می‌توانید روی چند دستگاه (گوشی + لپ‌تاپ) همزمان نوتیفیکیشن فعال کنید.</li>
        </ol>
      </Card>

      {/* Devices list */}
      <Card className="bg-[#1a1a1a] border border-[#333] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#fafafa] font-bold flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-[#D4AF37]" />
            دستگاه‌های ثبت‌شده
          </h3>
          <Button onClick={loadDevices} variant="ghost" size="sm" className="text-[#a1a1aa] hover:text-[#fafafa] h-8">
            <RefreshCw className="h-3.5 w-3.5 ml-1" />
            بروزرسانی
          </Button>
        </div>
        {loadingDevices ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-[#888] text-sm">
            هنوز دستگاهی ثبت نشده است. روی «فعال‌سازی نوتیفیکیشن» بزنید.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            {devices.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#333]">
                <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#fafafa] text-sm font-medium truncate">{d.label}</p>
                  <p className="text-[#888] text-xs mt-0.5">{formatJalaaliDate(d.createdAt)}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'دستگاه ناشناخته';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS دستگاه';
  if (/Android/i.test(ua)) return 'اندروید';
  if (/Windows/i.test(ua)) return 'ویندوز';
  if (/Mac/i.test(ua)) return 'مک';
  if (/Linux/i.test(ua)) return 'لینوکس';
  return 'دستگاه';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

/** Plays a short two-tone "ding" using the Web Audio API (no audio file needed). */
function playNotifSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.25, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    };

    // Pleasant two-tone ascending chime (gold/bell-like)
    playTone(880, 0, 0.18);     // A5
    playTone(1318.5, 0.12, 0.3); // E6

    setTimeout(() => { try { ctx.close(); } catch { /* ignore */ } }, 600);
  } catch { /* audio not available — silent */ }
}

// ─── Settings Tab ───
function SettingsTab() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRelayPass, setShowRelayPass] = useState(false);
  const [form, setForm] = useState({
    siteName: '', phone1: '', phone2: '', email: '', address: '',
    commission: '10', minWithdrawal: '500000', workingHours: '',
    notifyEmail: '',
    mailSenderName: '',
    mailSenderEmail: '',
    mailReplyTo: '',
    relayHost: '',
    relayPort: '587',
    relayUser: '',
    relayPass: '',
  });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (!data) return;
      setForm(f => ({
        ...f,
        siteName: data.siteName ?? f.siteName,
        phone1: data.phone1 ?? f.phone1,
        phone2: data.phone2 ?? f.phone2,
        email: data.email ?? f.email,
        address: data.address ?? f.address,
        commission: data.commission != null ? String(data.commission) : f.commission,
        minWithdrawal: data.minWithdrawal != null ? String(data.minWithdrawal) : f.minWithdrawal,
        workingHours: data.workingHours ?? f.workingHours,
        notifyEmail: data.notifyEmail ?? f.notifyEmail,
        mailSenderName: data.mailSenderName ?? '',
        mailSenderEmail: data.mailSenderEmail ?? '',
        mailReplyTo: data.mailReplyTo ?? '',
        relayHost: data.relayHost ?? '',
        relayPort: data.relayPort ?? '587',
        relayUser: data.relayUser ?? '',
        relayPass: data.relayPass ?? '',
      }));
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-[#fafafa]">تنظیمات سیستم</h2>
      {saved && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400"><Check className="h-4 w-4" />تنظیمات ذخیره شد</motion.div>}

      <Card className="bg-[#1a1a1a] border border-[#333] p-6 space-y-5">
        <h3 className="text-[#fafafa] font-bold">اطلاعات پایه</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SF label="نام سایت" value={form.siteName} onChange={(v) => setForm({ ...form, siteName: v })} />
          <SF label="ایمیل" value={form.email} onChange={(v) => setForm({ ...form, email: v })} dir="ltr" />
          <SF label="تلفن ۱" value={form.phone1} onChange={(v) => setForm({ ...form, phone1: v })} dir="ltr" />
          <SF label="تلفن ۲" value={form.phone2} onChange={(v) => setForm({ ...form, phone2: v })} dir="ltr" />
          <SF label="آدرس" value={form.address} onChange={(v) => setForm({ ...form, address: v })} full />
        </div>
      </Card>

      <Card className="bg-[#1a1a1a] border border-[#333] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-[#D4AF37]" />
          <h3 className="text-[#fafafa] font-bold">سیستم ایمیل داخلی</h3>
        </div>
        <p className="text-xs text-[#888] leading-relaxed">
          ایمیل‌ها از هویت اختصاصی سایت ارسال می‌شوند. حالت پیش‌فرض، تحویل مستقیم به سرور گیرنده (MX) است
          — بدون نیاز به Gmail یا سرویس خارجی. برای محیط‌هایی که پورت 25 مسدود است، می‌توان یک
          Relay SMTP دلخواه تنظیم کرد.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SF label="نام فرستنده" value={form.mailSenderName} onChange={(v) => setForm({ ...form, mailSenderName: v })} placeholder="تاکسی ویژه سیوان" />
          <SF label="ایمیل فرستنده" value={form.mailSenderEmail} onChange={(v) => setForm({ ...form, mailSenderEmail: v })} dir="ltr" placeholder="noreply@sivantaxi.com" />
          <SF label="آدرس Reply-To" value={form.mailReplyTo} onChange={(v) => setForm({ ...form, mailReplyTo: v })} dir="ltr" placeholder="info@sivantaxi.com" />
          <SF label="ایمیل مقصد اعلان‌ها" value={form.notifyEmail} onChange={(v) => setForm({ ...form, notifyEmail: v })} dir="ltr" placeholder="admin@sivantaxi.com" />
        </div>

        <details className="bg-[#0a0a0a] border border-[#333] rounded-lg p-4 group">
          <summary className="cursor-pointer text-sm text-[#D4AF37] font-bold flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            تنظیمات Relay SMTP (اختیاری)
          </summary>
          <p className="text-xs text-[#888] mt-3 mb-3 leading-relaxed">
            اگر سرور شما پورت 25 خروجی باز ندارد (مانند اکثر سرویس‌های ابری)، می‌توانید یک سرور Relay
            دلخواه تنظیم کنید. این فیلدها اگر خالی باشند، سیستم مستقیماً به MX گیرنده تحویل می‌دهد.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SF label="Relay Host" value={form.relayHost} onChange={(v) => setForm({ ...form, relayHost: v })} dir="ltr" placeholder="mail.yourserver.com" />
            <SF label="Relay Port" value={form.relayPort} onChange={(v) => setForm({ ...form, relayPort: v })} dir="ltr" placeholder="587" />
            <SF label="Relay Username" value={form.relayUser} onChange={(v) => setForm({ ...form, relayUser: v })} dir="ltr" placeholder="noreply@sivantaxi.com" />
            <div>
              <Label className="text-[#a1a1aa] text-sm mb-2 block">Relay Password</Label>
              <div className="relative">
                <Input
                  type={showRelayPass ? 'text' : 'password'}
                  value={form.relayPass}
                  onChange={(e) => setForm({ ...form, relayPass: e.target.value })}
                  className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11 pl-10"
                  dir="ltr"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowRelayPass(s => !s)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#fafafa] p-1"
                  aria-label={showRelayPass ? 'پنهان' : 'نمایش'}
                >
                  {showRelayPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </details>

        <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg p-4">
          <p className="text-xs text-[#bbb] leading-relaxed">
            <strong className="text-[#D4AF37]">راهنمای تحویل به Gmail:</strong>
            <br />
            برای اینکه ایمیل‌های ارسالی به Inbox گیرنده برسند (نه پوشه Spam)، باید این رکوردهای DNS را
            روی دامنه <span dir="ltr" className="text-[#D4AF37]">sivantaxi.com</span> تنظیم کنید:
          </p>
          <ul className="text-xs text-[#999] mt-2 space-y-1 list-disc pr-5">
            <li><b>SPF:</b> یک رکورد TXT با مقدار <code dir="ltr" className="text-[#D4AF37]">v=spf1 mx a -all</code></li>
            <li><b>DKIM:</b> با راه‌اندازی کلید DKIM روی سرور ایمیل خود</li>
            <li><b>DMARC:</b> یک رکورد TXT با مقدار <code dir="ltr" className="text-[#D4AF37]">v=DMARC1; p=quarantine;</code></li>
            <li><b>rDNS (Reverse DNS):</b> آدرس IP سرور باید به <span dir="ltr" className="text-[#D4AF37]">mail.sivantaxi.com</span> pointing باشد</li>
          </ul>
          <p className="text-xs text-[#888] mt-2 leading-relaxed">
            بدون این تنظیمات، ایمیل‌ها احتمالاً به پوشه Spam گیرنده می‌روند. برای مشاهده وضعیت تحویل،
            به تب «ایمیل‌ها» مراجعه کنید.
          </p>
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold h-12 px-8 rounded-xl">
        {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
        ذخیره تنظیمات
      </Button>
    </motion.div>
  );
}

function SF(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: 'ltr' | 'rtl';
  full?: boolean;
  placeholder?: string;
  type?: string;
}) {
  const { label, value, onChange, dir, full, placeholder, type } = props;
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <Label className="text-[#a1a1aa] text-sm mb-2 block">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" dir={dir} placeholder={placeholder} type={type || 'text'} />
    </div>
  );
}

// ─── Helpers ───
function getStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'در انتظار', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    in_progress: { label: 'در حال انجام', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    completed: { label: 'تکمیل شده', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    cancelled: { label: 'لغو شده', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  };
  const info = map[status] || map.pending;
  return <Badge className={info.cls}>{info.label}</Badge>;
}

function getBlogStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: 'پیش‌نویس', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    published: { label: 'منتشر شده', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    archived: { label: 'بایگانی', cls: 'bg-[#888]/15 text-[#888] border-[#888]/30' },
  };
  const info = map[status] || map.draft;
  return <Badge className={info.cls}>{info.label}</Badge>;
}

// ─── Main Export ───
export function AdminPanel() {
  const { admin } = useAppStore();
  if (!admin.isAdminOpen) return null;
  return <>{!admin.isLoggedIn ? <AdminLoginScreen /> : <AdminDashboard />}</>;
}
