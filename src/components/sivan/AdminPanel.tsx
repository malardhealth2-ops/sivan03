'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LogOut, LayoutDashboard, Car, Users, UserCheck, Settings, X,
  TrendingUp, MapPin, Phone, Star, ChevronDown, Eye, EyeOff, Loader2,
  Calendar, Clock, CreditCard, Check, AlertTriangle, Ban, CheckCircle2,
  FileText, Pencil, Plus, Trash2, Image, Send, Save, Calculator,
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
import { formatJalaaliDate, getTehranTimeString, getTehranTime, toPersianDigits } from '@/lib/jalaali';
import { toast } from 'sonner';

type TabId = 'dashboard' | 'trips' | 'passengers' | 'drivers' | 'content' | 'blog' | 'pricing' | 'settings';
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

  const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'trips', label: 'سفرها', icon: Car },
    { id: 'passengers', label: 'مسافران', icon: Users },
    { id: 'drivers', label: 'رانندگان', icon: UserCheck },
    { id: 'content', label: 'مدیریت محتوا', icon: Pencil },
    { id: 'blog', label: 'بلاگ', icon: FileText },
    { id: 'pricing', label: 'قیمت‌گذاری', icon: Calculator },
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

  useEffect(() => {
    fetch('/api/booking').then(r => r.json()).then(data => { setTrips(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = statusFilter === 'all' ? trips : trips.filter((t: any) => t.status === statusFilter);

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
                <TableRow key={trip.id} className="border-[#333] hover:bg-[#2d2d2d]/50">
                  <TableCell className="text-[#fafafa] font-mono text-xs" dir="ltr">{trip.bookingCode}</TableCell>
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
function ContentTab() {
  const [sections, setSections] = useState<Record<string, { title: string; subtitle: string; body: string }>>({});
  const [activeSection, setActiveSection] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sectionList = [
    { id: 'hero', label: 'هدر / قهرمان', icon: '🏠' },
    { id: 'services', label: 'خدمات', icon: '🚗' },
    { id: 'whyUs', label: 'چرا سیوان', icon: '✅' },
    { id: 'fleet', label: 'ناوگان', icon: '🏎️' },
    { id: 'cta', label: 'دعوت به اقدام', icon: '📞' },
    { id: 'footer', label: 'فوتر', icon: '📋' },
    { id: 'about', label: 'درباره ما', icon: 'ℹ️' },
  ];

  useEffect(() => {
    fetch('/api/admin/content').then(r => r.json()).then(data => { setSections(data || {}); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const current = sections[activeSection] || { title: '', subtitle: '', body: '' };

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
        <h2 className="text-xl font-bold text-[#fafafa]">مدیریت محتوا</h2>
        <Button onClick={handleSave} disabled={saving} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold h-10 px-6 rounded-xl">
          {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
          ذخیره تغییرات
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Section selector */}
        <div className="w-full md:w-56 shrink-0">
          <Card className="bg-[#1a1a1a] border border-[#333] p-3">
            <p className="text-[#a1a1aa] text-xs mb-3 px-2">بخش مورد نظر را انتخاب کنید</p>
            <div className="space-y-1">
              {sectionList.map((s) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${activeSection === s.id ? 'bg-[#D4AF37] text-[#0a0a0a] font-bold' : 'text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#2d2d2d]'}`}>
                  <span>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Editor */}
        <div className="flex-1 space-y-5">
          <Card className="bg-[#1a1a1a] border border-[#333] p-6 space-y-5">
            <h3 className="text-[#D4AF37] font-bold text-lg">{sectionList.find(s => s.id === activeSection)?.label}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#a1a1aa] text-sm">عنوان</Label>
                <Input value={current.title} onChange={(e) => setSections({ ...sections, [activeSection]: { ...current, title: e.target.value } })} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" placeholder="عنوان بخش..." />
              </div>
              <div className="space-y-2">
                <Label className="text-[#a1a1aa] text-sm">زیرعنوان</Label>
                <Input value={current.subtitle} onChange={(e) => setSections({ ...sections, [activeSection]: { ...current, subtitle: e.target.value } })} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" placeholder="زیرعنوان بخش..." />
              </div>
              <div className="space-y-2">
                <Label className="text-[#a1a1aa] text-sm">محتوای متنی</Label>
                <textarea value={current.body} onChange={(e) => setSections({ ...sections, [activeSection]: { ...current, body: e.target.value } })} className="w-full min-h-[200px] bg-[#0a0a0a] border border-[#333] text-[#fafafa] placeholder:text-[#888] rounded-lg p-3 text-sm resize-y focus:outline-none focus:border-[#D4AF37]/50" placeholder="محتوای متنی بخش (می‌تواند HTML باشد)..." dir="rtl" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
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
    { id: 'vip', label: 'VIP لوکس', desc: 'هیوندای سوناتا - لوکس و راحت', icon: '✨', color: '#D4AF37' },
    { id: 'luxury', label: 'دربستی ویژه', desc: 'مرسدس بنز - اختصاصی و لوکس', icon: '👑', color: '#F59E0B' },
    { id: 'van', label: 'ون', desc: 'ون ۸ نفره - مناسب گروهی', icon: '🚐', color: '#3B82F6' },
    { id: 'electric', label: 'برقی', desc: 'خودرو برقی - دوستدار محیط زیست', icon: '⚡', color: '#22C55E' },
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

// ─── Settings Tab ───
function SettingsTab() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    siteName: '', phone1: '', phone2: '', email: '', address: '',
    commission: '10', minWithdrawal: '500000', workingHours: '',
    notifyEmail: '', smtpHost: 'smtp.gmail.com', smtpPort: '587', smtpUser: '', smtpPass: '',
  });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.siteName) setForm(f => ({ ...f, siteName: data.siteName }));
      if (data.phone1) setForm(f => ({ ...f, phone1: data.phone1 }));
      if (data.phone2) setForm(f => ({ ...f, phone2: data.phone2 }));
      if (data.email) setForm(f => ({ ...f, email: data.email }));
      if (data.address) setForm(f => ({ ...f, address: data.address }));
      if (data.commission) setForm(f => ({ ...f, commission: String(data.commission) }));
      if (data.minWithdrawal) setForm(f => ({ ...f, minWithdrawal: String(data.minWithdrawal) }));
      if (data.workingHours) setForm(f => ({ ...f, workingHours: data.workingHours }));
      if (data.notifyEmail) setForm(f => ({ ...f, notifyEmail: data.notifyEmail }));
      if (data.smtpHost) setForm(f => ({ ...f, smtpHost: data.smtpHost }));
      if (data.smtpPort) setForm(f => ({ ...f, smtpPort: data.smtpPort }));
      if (data.smtpUser) setForm(f => ({ ...f, smtpUser: data.smtpUser }));
      if (data.smtpPass) setForm(f => ({ ...f, smtpPass: data.smtpPass }));
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('خطا در ذخیره تنظیمات');
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
        <h3 className="text-[#fafafa] font-bold">تنظیمات اعلان ایمیلی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SF label="ایمیل اعلان" value={form.notifyEmail} onChange={(v) => setForm({ ...form, notifyEmail: v })} dir="ltr" placeholder="admin@gmail.com" />
          <SF label="SMTP Host" value={form.smtpHost} onChange={(v) => setForm({ ...form, smtpHost: v })} dir="ltr" />
          <SF label="SMTP Port" value={form.smtpPort} onChange={(v) => setForm({ ...form, smtpPort: v })} dir="ltr" />
          <SF label="SMTP User" value={form.smtpUser} onChange={(v) => setForm({ ...form, smtpUser: v })} dir="ltr" />
          <SF label="SMTP Pass" value={form.smtpPass} onChange={(v) => setForm({ ...form, smtpPass: v })} dir="ltr" type="password" />
        </div>
      </Card>

      <Button onClick={handleSave} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-bold h-12 px-8 rounded-xl">ذخیره تنظیمات</Button>
    </motion.div>
  );
}

function SF(props) {
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
