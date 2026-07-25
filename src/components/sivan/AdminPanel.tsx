'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LogOut, LayoutDashboard, Car, Users, UserCheck, Settings, X,
  TrendingUp, MapPin, Phone, Star, ChevronDown, Eye, EyeOff, Loader2,
  Calendar, Clock, CreditCard, Check, AlertTriangle, Ban, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { formatJalaaliDate, getTehranTime, toPersianDigits } from '@/lib/jalaali';

// ─── Admin Login ───
function AdminLoginScreen() {
  const { adminLogin, admin, setAdminOpen } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    adminLogin(username, password);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-[#0a0a0a] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />

      <button
        onClick={() => setAdminOpen(false)}
        className="absolute top-6 left-6 p-2 rounded-lg hover:bg-[#2d2d2d] text-[#a1a1aa] hover:text-[#fafafa] transition-colors z-10"
      >
        <X className="h-6 w-6" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-[#D4AF37]" />
            </div>
            <h1 className="text-2xl font-bold text-[#fafafa] mb-2">پنل مدیریت سیوان</h1>
            <p className="text-[#a1a1aa] text-sm">برای ورود نام کاربری و رمز عبور خود را وارد کنید</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[#a1a1aa] text-sm">نام کاربری</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری"
                className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#a1a1aa] text-sm">رمز عبور</Label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور"
                  className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#fafafa]"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {admin.loginError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {admin.loginError}
              </motion.div>
            )}

            <Button
              onClick={handleLogin}
              disabled={loading || !username || !password}
              className="w-full h-12 bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold text-base rounded-xl"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'ورود به پنل مدیریت'}
            </Button>

            <div className="text-center pt-3">
              <p className="text-[#888] text-xs">اطلاعات پیش‌فرض دمو:</p>
              <p className="text-[#a1a1aa] text-xs mt-1" dir="ltr">admin / sivan2024</p>
            </div>
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
      const now = getTehranTime();
      const time = toPersianDigits(
        now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0') + ':' + now.getSeconds().toString().padStart(2, '0')
      );
      setJalaliClock(time + ' - ' + formatJalaaliDate(now));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  });

  const tabs = [
    { id: 'dashboard' as const, label: 'داشبورد', icon: LayoutDashboard },
    { id: 'trips' as const, label: 'سفرها', icon: Car },
    { id: 'passengers' as const, label: 'مسافران', icon: Users },
    { id: 'drivers' as const, label: 'رانندگان', icon: UserCheck },
    { id: 'settings' as const, label: 'تنظیمات', icon: Settings },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#111111] border-l border-[#333] flex-col">
        <div className="p-5 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
              <Shield className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-[#fafafa] font-bold text-sm">پنل مدیریت</h3>
              <p className="text-[#a1a1aa] text-xs">سیوان VIP</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAdminActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                admin.activeTab === tab.id
                  ? 'bg-[#D4AF37] text-[#0a0a0a] font-bold shadow-lg shadow-[#D4AF37]/20'
                  : 'text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#2d2d2d]'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#333]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
              <span className="text-[#D4AF37] text-xs font-bold">A</span>
            </div>
            <div>
              <p className="text-[#fafafa] text-sm">{admin.adminUsername}</p>
              <p className="text-[#a1a1aa] text-[10px]">مدیر سیستم</p>
            </div>
          </div>
          <Button
            onClick={adminLogout}
            variant="ghost"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-[#111111] border-b border-[#333] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-[#fafafa] font-bold">مدیریت سیوان</span>
            <Separator orientation="vertical" className="h-6 bg-[#333]" />
            <span className="text-[#a1a1aa] text-xs">{jalaliClock}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile tabs dropdown */}
            <div className="md:hidden">
              <Select value={admin.activeTab} onValueChange={(v) => setAdminActiveTab(v as typeof admin.activeTab)}>
                <SelectTrigger className="w-36 bg-[#1a1a1a] border-[#333] text-[#fafafa] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333]">
                  {tabs.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-[#fafafa]">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={adminLogout}
              className="md:hidden p-2 rounded-lg hover:bg-[#2d2d2d] text-[#a1a1aa] hover:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <button
              onClick={() => setAdminOpen(false)}
              className="p-2 rounded-lg hover:bg-[#2d2d2d] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {admin.activeTab === 'dashboard' && <DashboardTab key="dash" />}
            {admin.activeTab === 'trips' && <TripsTab key="trips" />}
            {admin.activeTab === 'passengers' && <PassengersTab key="pass" />}
            {admin.activeTab === 'drivers' && <DriversTab key="drivers" />}
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

  const quickStats = [
    { label: '۵۰+ شهر تحت پوشش', icon: MapPin },
    { label: '۹۹٪ رضایت مشتری', icon: Star },
    { label: '۱۰,۰۰۰+ سفر موفق', icon: CheckCircle2 },
    { label: 'پشتیبانی ۲۴/۷', icon: Clock },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <h2 className="text-xl font-bold text-[#fafafa]">داشبورد</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-[#1a1a1a] border border-[#333] p-5 card-gold-glow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#a1a1aa] text-sm mb-2">{stat.label}</p>
                <p className="text-2xl font-bold text-[#fafafa]">
                  {stat.value}
                  {stat.suffix && <span className="text-sm text-[#a1a1aa] mr-1">{stat.suffix}</span>}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-green-400 text-xs">{stat.change}</span>
              <span className="text-[#888] text-xs mr-1">نسبت به ماه قبل</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickStats.map((s) => (
          <div key={s.label} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 flex items-center gap-3">
            <s.icon className="h-5 w-5 text-[#D4AF37] shrink-0" />
            <span className="text-[#fafafa] text-sm">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <Card className="bg-[#1a1a1a] border border-[#333] p-6">
        <h3 className="text-[#fafafa] font-bold mb-4">آخرین سفرها</h3>
        <Table>
          <TableHeader>
            <TableRow className="border-[#333]">
              <TableHead className="text-[#a1a1aa]">کد</TableHead>
              <TableHead className="text-[#a1a1aa]">مسیر</TableHead>
              <TableHead className="text-[#a1a1aa]">وضعیت</TableHead>
              <TableHead className="text-[#a1a1aa]">مبلغ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTrips.slice(0, 5).map((trip) => (
              <TableRow key={trip.id} className="border-[#333]">
                <TableCell className="text-[#fafafa] font-mono text-xs" dir="ltr">{trip.code}</TableCell>
                <TableCell className="text-[#fafafa] text-sm">{trip.route}</TableCell>
                <TableCell>{getStatusBadge(trip.status)}</TableCell>
                <TableCell className="text-[#fafafa] text-sm" dir="ltr">{trip.amount} تومان</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}

// ─── Trips Tab ───
function TripsTab() {
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = statusFilter === 'all' ? recentTrips : recentTrips.filter((t) => t.status === statusFilter);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-[#fafafa]">مدیریت سفرها</h2>
        <div className="flex items-center gap-2">
          <span className="text-[#a1a1aa] text-sm">فیلتر:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-[#1a1a1a] border-[#333] text-[#fafafa] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#333]">
              <SelectItem value="all" className="text-[#fafafa]">همه</SelectItem>
              <SelectItem value="pending" className="text-[#fafafa]">در انتظار</SelectItem>
              <SelectItem value="in_progress" className="text-[#fafafa]">در حال انجام</SelectItem>
              <SelectItem value="completed" className="text-[#fafafa]">تکمیل شده</SelectItem>
              <SelectItem value="cancelled" className="text-[#fafafa]">لغو شده</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-[#1a1a1a] border border-[#333] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#333]">
                <TableHead className="text-[#a1a1aa]">کد رزرو</TableHead>
                <TableHead className="text-[#a1a1aa]">مسیر</TableHead>
                <TableHead className="text-[#a1a1aa]">وضعیت</TableHead>
                <TableHead className="text-[#a1a1aa]">نوع خودرو</TableHead>
                <TableHead className="text-[#a1a1aa]">مبلغ (تومان)</TableHead>
                <TableHead className="text-[#a1a1aa]">تاریخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((trip) => (
                <TableRow key={trip.id} className="border-[#333] hover:bg-[#2d2d2d]/50">
                  <TableCell className="text-[#fafafa] font-mono text-xs" dir="ltr">{trip.code}</TableCell>
                  <TableCell className="text-[#fafafa] text-sm">{trip.route}</TableCell>
                  <TableCell>{getStatusBadge(trip.status)}</TableCell>
                  <TableCell className="text-[#fafafa] text-sm">{trip.carType}</TableCell>
                  <TableCell className="text-[#fafafa] text-sm" dir="ltr">{trip.amount}</TableCell>
                  <TableCell className="text-[#a1a1aa] text-sm">{trip.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Passengers Tab ───
function PassengersTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <h2 className="text-xl font-bold text-[#fafafa]">مدیریت مسافران</h2>
      <Card className="bg-[#1a1a1a] border border-[#333] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#333]">
                <TableHead className="text-[#a1a1aa]">نام</TableHead>
                <TableHead className="text-[#a1a1aa]">شماره تلفن</TableHead>
                <TableHead className="text-[#a1a1aa]">تعداد سفر</TableHead>
                <TableHead className="text-[#a1a1aa]">امتیاز</TableHead>
                <TableHead className="text-[#a1a1aa]">وضعیت</TableHead>
                <TableHead className="text-[#a1a1aa]">تاریخ عضویت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passengers.map((p) => (
                <TableRow key={p.id} className="border-[#333] hover:bg-[#2d2d2d]/50">
                  <TableCell className="text-[#fafafa] text-sm">{p.name}</TableCell>
                  <TableCell className="text-[#fafafa] text-sm font-mono" dir="ltr">{p.phone}</TableCell>
                  <TableCell className="text-[#fafafa] text-sm">{p.trips}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                      <span className="text-[#fafafa] text-sm">{p.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={p.status === 'فعال' ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#a1a1aa] text-sm">{p.joinDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Drivers Tab ───
function DriversTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <h2 className="text-xl font-bold text-[#fafafa]">مدیریت رانندگان</h2>
      <Card className="bg-[#1a1a1a] border border-[#333] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#333]">
                <TableHead className="text-[#a1a1aa]">نام</TableHead>
                <TableHead className="text-[#a1a1aa]">خودرو</TableHead>
                <TableHead className="text-[#a1a1aa]">امتیاز</TableHead>
                <TableHead className="text-[#a1a1aa]">سفرها</TableHead>
                <TableHead className="text-[#a1a1aa]">نرخ تکمیل</TableHead>
                <TableHead className="text-[#a1a1aa]">وضعیت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((d) => (
                <TableRow key={d.id} className="border-[#333] hover:bg-[#2d2d2d]/50">
                  <TableCell className="text-[#fafafa] text-sm">{d.name}</TableCell>
                  <TableCell className="text-[#fafafa] text-sm">{d.car}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                      <span className="text-[#fafafa] text-sm">{d.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#fafafa] text-sm">{d.trips}</TableCell>
                  <TableCell className="text-[#fafafa] text-sm">{d.completionRate}%</TableCell>
                  <TableCell>{getDriverStatusBadge(d.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Settings Tab ───
function SettingsTab() {
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({
    siteName: 'تاکسی ویژه سیوان',
    phone1: '09109419743',
    phone2: '09368816807',
    email: 'info@sivantaxi.com',
    address: 'تهران، خیابان ولیعصر',
    commission: '10',
    minWithdrawal: '500000',
    workingHours: '۲۴ ساعته - ۷ روز هفته',
    // Email notification settings
    notifyEmail: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
  });

  // Load settings from API on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.notifyEmail) setForm(f => ({ ...f, notifyEmail: data.notifyEmail }));
        if (data.smtpHost) setForm(f => ({ ...f, smtpHost: data.smtpHost }));
        if (data.smtpPort) setForm(f => ({ ...f, smtpPort: data.smtpPort }));
        if (data.smtpUser) setForm(f => ({ ...f, smtpUser: data.smtpUser }));
        if (data.smtpPass) setForm(f => ({ ...f, smtpPass: data.smtpPass }));
        if (data.siteName) setForm(f => ({ ...f, siteName: data.siteName }));
        if (data.phone1) setForm(f => ({ ...f, phone1: data.phone1 }));
        if (data.phone2) setForm(f => ({ ...f, phone2: data.phone2 }));
        if (data.email) setForm(f => ({ ...f, email: data.email }));
        if (data.address) setForm(f => ({ ...f, address: data.address }));
        if (data.commission) setForm(f => ({ ...f, commission: String(data.commission) }));
        if (data.minWithdrawal) setForm(f => ({ ...f, minWithdrawal: String(data.minWithdrawal) }));
        if (data.workingHours) setForm(f => ({ ...f, workingHours: data.workingHours }));
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaveError('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'خطا' }));
        throw new Error(d.error || 'خطا در ذخیره');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'خطا');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-[#fafafa]">تنظیمات سیستم</h2>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400"
        >
          <Check className="h-4 w-4" />
          تنظیمات با موفقیت ذخیره شد
        </motion.div>
      )}

      <Card className="bg-[#1a1a1a] border border-[#333] p-6">
        <h3 className="text-[#fafafa] font-bold mb-6">اطلاعات پایه</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SettingsField label="نام سایت" value={form.siteName} onChange={(v) => setForm({ ...form, siteName: v })} />
          <SettingsField label="ایمیل" value={form.email} onChange={(v) => setForm({ ...form, email: v })} dir="ltr" />
          <SettingsField label="شماره تلفن ۱" value={form.phone1} onChange={(v) => setForm({ ...form, phone1: v })} dir="ltr" />
          <SettingsField label="شماره تلفن ۲" value={form.phone2} onChange={(v) => setForm({ ...form, phone2: v })} dir="ltr" />
          <SettingsField label="آدرس" value={form.address} onChange={(v) => setForm({ ...form, address: v })} full />
        </div>
      </Card>

      <Card className="bg-[#1a1a1a] border border-[#333] p-6">
        <h3 className="text-[#fafafa] font-bold mb-2">تنظیمات اعلان ایمیلی</h3>
        <p className="text-[#a1a1aa] text-xs mb-6">پس از ثبت رزرو جدید، ایمیل اعلان به این آدرس ارسال می‌شود</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SettingsField label="ایمیل دریافت اعلان" value={form.notifyEmail} onChange={(v) => setForm({ ...form, notifyEmail: v })} dir="ltr" placeholder="admin@gmail.com" />
          <SettingsField label="سرور SMTP" value={form.smtpHost} onChange={(v) => setForm({ ...form, smtpHost: v })} dir="ltr" />
          <SettingsField label="پورت SMTP" value={form.smtpPort} onChange={(v) => setForm({ ...form, smtpPort: v })} dir="ltr" />
          <SettingsField label="نام کاربری SMTP (ایمیل)" value={form.smtpUser} onChange={(v) => setForm({ ...form, smtpUser: v })} dir="ltr" placeholder="your@gmail.com" />
          <SettingsField label="رمز عبور SMTP" value={form.smtpPass} onChange={(v) => setForm({ ...form, smtpPass: v })} dir="ltr" placeholder="app-password" type="password" />
        </div>
        <div className="mt-4 p-3 rounded-lg bg-[#0a0a0a] border border-[#333]">
          <p className="text-[#a1a1aa] text-xs leading-relaxed">
            <span className="text-[#D4AF37]">راهنمای Gmail:</span> برای استفاده از Gmail، باید App Password بسازید.
            به Google Account → Security → 2-Step Verification → App passwords بروید و یک رمز جدید بسازید.
          </p>
        </div>
      </Card>

      <Card className="bg-[#1a1a1a] border border-[#333] p-6">
        <h3 className="text-[#fafafa] font-bold mb-6">تنظیمات مالی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SettingsField label="نرخ کمیسیون (%)" value={form.commission} onChange={(v) => setForm({ ...form, commission: v })} />
          <SettingsField label="حداقل تسویه (تومان)" value={form.minWithdrawal} onChange={(v) => setForm({ ...form, minWithdrawal: v })} />
          <SettingsField label="ساعات کاری" value={form.workingHours} onChange={(v) => setForm({ ...form, workingHours: v })} full />
        </div>
      </Card>

      <Button
        onClick={handleSave}
        className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold h-12 px-8 rounded-xl"
      >
        ذخیره تنظیمات
      </Button>
    </motion.div>
  );
}

function SettingsField({ label, value, onChange, dir, full, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; dir?: string; full?: boolean; placeholder?: string; type?: string }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <Label className="text-[#a1a1aa] text-sm mb-2 block">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11"
        dir={dir}
        placeholder={placeholder}
        type={type || 'text'}
      />
    </div>
  );
}

// ─── Helpers ───
function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'در انتظار', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    in_progress: { label: 'در حال انجام', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    completed: { label: 'تکمیل شده', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
    cancelled: { label: 'لغو شده', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  };
  const info = map[status] || map.pending;
  return <Badge className={info.className}>{info.label}</Badge>;
}

function getDriverStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    approved: { label: 'تأیید شده', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
    pending: { label: 'در انتظار بررسی', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    rejected: { label: 'رد شده', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
    suspended: { label: 'تعلیق شده', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  };
  const info = map[status] || map.pending;
  return <Badge className={info.className}>{info.label}</Badge>;
}

// ─── Sample Data ───
const recentTrips = [
  { id: 1, code: 'SV-A3F2K1', route: 'تهران → اصفهان', status: 'completed', carType: 'VIP - سوناتا', amount: '۸۵۰,۰۰۰', date: '۲۵ آذر ۱۴۰۳' },
  { id: 2, code: 'SV-B7H4M2', route: 'تهران → شیراز', status: 'in_progress', carType: 'لوکس - مرسدس', amount: '۱,۵۰۰,۰۰۰', date: '۲۵ آذر ۱۴۰۳' },
  { id: 3, code: 'SV-C9K5N3', route: 'تهران → تبریز', status: 'pending', carType: 'اقتصادی', amount: '۱,۲۰۰,۰۰۰', date: '۲۶ آذر ۱۴۰۳' },
  { id: 4, code: 'SV-D2L6P4', route: 'تهران → مشهد', status: 'completed', carType: 'VIP - سوناتا', amount: '۱,۸۰۰,۰۰۰', date: '۲۴ آذر ۱۴۰۳' },
  { id: 5, code: 'SV-E5M7Q5', route: 'اصفهان → شیراز', status: 'cancelled', carType: 'اقتصادی', amount: '۱,۱۰۰,۰۰۰', date: '۲۴ آذر ۱۴۰۳' },
  { id: 6, code: 'SV-F8N8R6', route: 'تهران → رشت', status: 'completed', carType: 'ون', amount: '۹۵۰,۰۰۰', date: '۲۳ آذر ۱۴۰۳' },
  { id: 7, code: 'SV-G1O9S7', route: 'تهران → کرج', status: 'completed', carType: 'برقی', amount: '۴۵۰,۰۰۰', date: '۲۳ آذر ۱۴۰۳' },
  { id: 8, code: 'SV-H4P1T8', route: 'تهران → کرمانشاه', status: 'in_progress', carType: 'VIP - سوناتا', amount: '۱,۱۰۰,۰۰۰', date: '۲۶ آذر ۱۴۰۳' },
  { id: 9, code: 'SV-J7Q2U9', route: 'تبریز → تهران', status: 'pending', carType: 'لوکس - مرسدس', amount: '۱,۳۰۰,۰۰۰', date: '۲۷ آذر ۱۴۰۳' },
  { id: 10, code: 'SV-K0R3V0', route: 'تهران → اصفهان', status: 'completed', carType: 'اقتصادی', amount: '۸۰۰,۰۰۰', date: '۲۲ آذر ۱۴۰۳' },
];

const passengers = [
  { id: 1, name: 'علی محمدی', phone: '09123456789', trips: 12, rating: 4.8, status: 'فعال', joinDate: '۱۰ مهر ۱۴۰۳' },
  { id: 2, name: 'سارا احمدی', phone: '09118765432', trips: 8, rating: 4.9, status: 'فعال', joinDate: '۱۵ آبان ۱۴۰۳' },
  { id: 3, name: 'محمد رضایی', phone: '09351234567', trips: 25, rating: 4.5, status: 'فعال', joinDate: '۵ شهریور ۱۴۰۳' },
  { id: 4, name: 'فاطمه حسینی', phone: '09199876543', trips: 5, rating: 5.0, status: 'فعال', joinDate: '۲۰ آذر ۱۴۰۳' },
  { id: 5, name: 'حسین کریمی', phone: '09361112233', trips: 15, rating: 4.7, status: 'فعال', joinDate: '۱ اردیبهشت ۱۴۰۳' },
  { id: 6, name: 'مریم نوری', phone: '09125556677', trips: 3, rating: 4.3, status: 'غیرفعال', joinDate: '۱۰ آذر ۱۴۰۳' },
  { id: 7, name: 'رضا عباسی', phone: '09378889900', trips: 20, rating: 4.6, status: 'فعال', joinDate: '۱ فروردین ۱۴۰۳' },
  { id: 8, name: 'زهرا صادقی', phone: '09164445566', trips: 7, rating: 4.9, status: 'فعال', joinDate: '۳۰ مهر ۱۴۰۳' },
];

const drivers = [
  { id: 1, name: 'رضا کریمی', car: 'هیوندای سوناتا ۲۰۲۲ - مشکی', rating: 4.8, trips: 320, completionRate: 98, status: 'approved' },
  { id: 2, name: 'احمد یوسفی', car: 'مرسدس بنز E220 - نقرهای', rating: 4.9, trips: 180, completionRate: 99, status: 'approved' },
  { id: 3, name: 'مهدی شریفی', car: 'تویوتا کمری ۲۰۲۱ - سفید', rating: 4.5, trips: 95, completionRate: 96, status: 'approved' },
  { id: 4, name: 'حسین جعفری', car: 'تسلا مدل ۳ - قرمز', rating: 4.7, trips: 45, completionRate: 97, status: 'pending' },
  { id: 5, name: 'علی باقری', car: 'ون تویوتا هایس - سفید', rating: 4.6, trips: 210, completionRate: 95, status: 'approved' },
  { id: 6, name: 'سعید رحیمی', car: 'پژو پارس - آبی', rating: 4.2, trips: 15, completionRate: 88, status: 'rejected' },
];

// ─── Main Export ───
export function AdminPanel() {
  const { admin } = useAppStore();

  if (!admin.isAdminOpen) return null;

  return (
    <>
      {!admin.isLoggedIn ? <AdminLoginScreen /> : <AdminDashboard />}
    </>
  );
}
