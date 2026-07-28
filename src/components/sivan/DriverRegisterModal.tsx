'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  User,
  Loader2,
  Check,
  AlertTriangle,
  Phone,
  Fingerprint,
  KeyRound,
  ArrowLeft,
  Timer,
  Shield,
  CreditCard,
  FileText,
  Camera,
  BadgeCheck,
  IdCard,
  UserCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

type DriverStep = 'phone' | 'code' | 'shahkar' | 'info' | 'vehicle' | 'success';

export function DriverRegisterModal() {
  const { driverRegister, closeDriverRegister } = useAppStore();

  const [step, setStep] = useState<DriverStep>('phone');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Form data
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [shebaNumber, setShebaNumber] = useState('');

  // Vehicle
  const [vehicleType, setVehicleType] = useState('sedan');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (driverRegister.isOpen) {
      setStep('phone');
      setLocalError('');
      setDemoOtp('');
      setIsDemo(false);
      setCountdown(0);
      setPhone('');
      setNationalId('');
      setBirthDate('');
      setFullName('');
      setFatherName('');
      setLicenseNumber('');
      setShebaNumber('');
      setVehicleType('sedan');
      setVehicleBrand('');
      setVehicleModel('');
      setVehicleYear('');
      setVehicleColor('');
      setPlateNumber('');
    }
  }, [driverRegister.isOpen]);

  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(countdownRef.current); return 0; }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(countdownRef.current);
    }
  }, [countdown]);

  const formatCountdown = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // ─── Step 1: Send OTP ───────────────────────────────────

  const handleSendOTP = async () => {
    if (!phone || !/^09[0-9]{9}$/.test(phone)) {
      setLocalError('شماره موبایل معتبر وارد کنید');
      return;
    }
    setLocalError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setLocalError(data.error || 'خطا'); setLoading(false); return; }
      setIsDemo(!!data.isDemo);
      if (data.isDemo && data.otp) setDemoOtp(data.otp);
      setCountdown(120);
      setStep('code');
    } catch { setLocalError('خطا در ارتباط'); }
    finally { setLoading(false); }
  };

  // ─── Step 2: Verify OTP ─────────────────────────────────

  const handleVerifyOTP = async (code: string) => {
    if (!code || code.length !== 6) return;
    setLocalError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) { setLocalError(data.error || 'کد نامعتبر'); setLoading(false); return; }
      setStep('shahkar');
      toast.success('شماره موبایل تأیید شد');
    } catch { setLocalError('خطا در تأیید'); }
    finally { setLoading(false); }
  };

  // ─── Step 3: Shahkar Verification ──────────────────────

  const handleShahkarVerify = async () => {
    if (!nationalId || !/^[0-9]{10}$/.test(nationalId)) {
      setLocalError('کد ملی باید ۱۰ رقم باشد');
      return;
    }
    setLocalError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/shahkar-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId, phone, birthDate: birthDate || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setLocalError(data.error || 'خطا در تأیید شاهکار'); setLoading(false); return; }
      if (!data.verified) {
        setLocalError('تطبیق شاهکار انجام نشد. شماره موبایل با کد ملی مطابقت ندارد.');
        setLoading(false);
        return;
      }
      // If shahkar returned person info, pre-fill name
      if (data.personInfo) {
        if (data.personInfo.firstName || data.personInfo.lastName) {
          setFullName(`${data.personInfo.firstName || ''} ${data.personInfo.lastName || ''}`.trim());
        }
        if (data.personInfo.fatherName) {
          setFatherName(data.personInfo.fatherName);
        }
      }
      setStep('info');
      toast.success(data.isDemo ? 'تأیید شاهکار موفق (آزمایشی)' : 'تأیید شاهکار موفق');
    } catch { setLocalError('خطا در ارتباط'); }
    finally { setLoading(false); }
  };

  // ─── Step 4: Personal Info ──────────────────────────────

  const handleInfoSubmit = () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setLocalError('نام و نام خانوادگی را کامل وارد کنید');
      return;
    }
    setLocalError('');
    setStep('vehicle');
  };

  // ─── Step 5: Vehicle & Submit ───────────────────────────

  const handleSubmit = async () => {
    if (!vehicleBrand || !vehicleModel || !vehicleYear || !plateNumber) {
      setLocalError('اطلاعات خودرو را کامل وارد کنید');
      return;
    }
    setLocalError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          nationalId,
          fullName: fullName.trim(),
          fatherName: fatherName.trim(),
          birthDate: birthDate || undefined,
          licenseNumber: licenseNumber || undefined,
          shebaNumber: shebaNumber || undefined,
          vehicle: {
            type: vehicleType,
            brand: vehicleBrand,
            model: vehicleModel,
            year: parseInt(vehicleYear) || 1402,
            color: vehicleColor,
            plateNumber,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error || 'خطا در ثبت‌نام');
        setLoading(false);
        return;
      }
      setStep('success');
      toast.success('درخواست ثبت‌نام راننده با موفقیت ثبت شد');
    } catch {
      setLocalError('خطا در ارتباط');
    }
    finally { setLoading(false); }
  };

  const resetAndClose = () => { setLocalError(''); closeDriverRegister(); };

  const vehicleTypes = [
    { value: 'sedan', label: 'سدان' },
    { value: 'suv', label: 'شاسی‌بلند' },
    { value: 'van', label: 'ون' },
    { value: 'electric', label: 'برقی' },
  ];

  return (
    <Dialog open={driverRegister.isOpen} onOpenChange={(val) => { if (!val) resetAndClose(); }}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right text-[#fafafa]">
            {step === 'success' ? 'درخواست ثبت شد!' : 'ثبت‌نام راننده'}
          </DialogTitle>
          <DialogDescription className="text-right text-[#a1a1aa]">
            {step === 'success' && 'درخواست شما بررسی خواهد شد'}
            {step === 'phone' && 'برای ثبت‌نام راننده، ابتدا شماره موبایل خود را تأیید کنید'}
            {step === 'code' && `کد تأیید ارسال شده به ${phone} را وارد کنید`}
            {step === 'shahkar' && 'تأیید هویت شاهکار — تطبیق کد ملی با شماره موبایل'}
            {step === 'info' && 'اطلاعات شخصی راننده'}
            {step === 'vehicle' && 'اطلاعات خودرو'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <AnimatePresence mode="wait">
            {/* ─── Success ──────────────────────────── */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <BadgeCheck className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-[#fafafa] font-medium">درخواست ثبت‌نام راننده شما ثبت شد</p>
                <p className="text-[#a1a1aa] text-xs">پس از بررسی اطلاعات، نتیجه از طریق پیامک اطلاع‌رسانی خواهد شد</p>
                <Button onClick={resetAndClose} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B]">
                  بستن
                </Button>
              </motion.div>
            )}

            {/* ─── Phone Entry ──────────────────────── */}
            {step === 'phone' && (
              <motion.div key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Car className="h-8 w-8 text-[#D4AF37]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#fafafa] text-sm"><Phone className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37] inline" />شماره موبایل</Label>
                  <Input type="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, '')); setLocalError(''); }} onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12" dir="ltr" autoFocus maxLength={11} />
                </div>
                {localError && <ErrorBox msg={localError} />}
                <Button onClick={handleSendOTP} disabled={loading || phone.length !== 11} className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Fingerprint className="h-4 w-4 ml-2" />ارسال کد تأیید</>}
                </Button>
                {/* Steps indicator */}
                <StepIndicator current={0} steps={['موبایل', 'کد تأیید', 'شاهکار', 'اطلاعات', 'خودرو']} />
              </motion.div>
            )}

            {/* ─── OTP Code ──────────────────────────── */}
            {step === 'code' && (
              <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center"><KeyRound className="h-8 w-8 text-[#D4AF37]" /></div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Label className="text-[#fafafa] text-sm">کد تأیید ۶ رقمی</Label>
                  <InputOTP maxLength={6} onComplete={(code) => handleVerifyOTP(code)} disabled={loading} containerClassName="justify-center" dir="ltr">
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-12 w-12" />
                      <InputOTPSlot index={1} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-12 w-12" />
                      <InputOTPSlot index={2} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-12 w-12" />
                    </InputOTPGroup>
                    <InputOTPSeparator className="text-[#666]" />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-12 w-12" />
                      <InputOTPSlot index={4} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-12 w-12" />
                      <InputOTPSlot index={5} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-12 w-12" />
                    </InputOTPGroup>
                  </InputOTP>
                  {isDemo && demoOtp && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-center">
                      <p className="text-amber-400 text-xs mb-1">حالت آزمایشی — کد تأیید:</p>
                      <p className="text-amber-300 font-mono text-lg tracking-widest font-bold">{demoOtp}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    {countdown > 0 ? (
                      <><Timer className="h-3 w-3 text-[#a1a1aa]" /><span className="text-[#a1a1aa]">ارسال مجدد تا {formatCountdown(countdown)}</span></>
                    ) : (
                      <button type="button" onClick={handleSendOTP} disabled={loading} className="text-[#D4AF37] hover:text-[#E5C76B] font-medium">ارسال مجدد</button>
                    )}
                  </div>
                </div>
                {localError && <ErrorBox msg={localError} />}
                {loading && <div className="flex items-center justify-center gap-2 text-sm text-[#a1a1aa]"><Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />در حال تأیید...</div>}
                <Button variant="ghost" size="sm" onClick={() => { setStep('phone'); setLocalError(''); }} className="w-full text-[#a1a1aa] hover:text-[#fafafa]"><ArrowLeft className="h-4 w-4 ml-1" />بازگشت</Button>
                <StepIndicator current={1} steps={['موبایل', 'کد تأیید', 'شاهکار', 'اطلاعات', 'خودرو']} />
              </motion.div>
            )}

            {/* ─── Shahkar Verification ───────────────── */}
            {step === 'shahkar' && (
              <motion.div key="shahkar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center"><IdCard className="h-8 w-8 text-[#D4AF37]" /></div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-sm text-blue-300">
                  <p>📱 شماره موبایل <span className="font-bold">{phone}</span> تأیید شد</p>
                </div>
                <p className="text-xs text-[#a1a1aa] text-center">تأیید هویت شاهکار — تطبیق کد ملی با شماره موبایل</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">کد ملی (۱۰ رقم)</Label>
                    <Input type="text" placeholder="کد ملی ۱۰ رقمی" value={nationalId} onChange={(e) => { setNationalId(e.target.value.replace(/[^0-9]/g, '')); setLocalError(''); }} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" dir="ltr" maxLength={10} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">تاریخ تولد (اختیاری)</Label>
                    <Input type="text" placeholder="مثال: ۱۳۷۰/۰۱/۰۱" value={birthDate} onChange={(e) => { setBirthDate(e.target.value); setLocalError(''); }} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" dir="ltr" />
                  </div>
                </div>
                {localError && <ErrorBox msg={localError} />}
                <Button onClick={handleShahkarVerify} disabled={loading || nationalId.length !== 10} className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Shield className="h-4 w-4 ml-2" />تأیید شاهکار</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setStep('code'); setLocalError(''); }} className="w-full text-[#a1a1aa] hover:text-[#fafafa]"><ArrowLeft className="h-4 w-4 ml-1" />بازگشت</Button>
                <StepIndicator current={2} steps={['موبایل', 'کد تأیید', 'شاهکار', 'اطلاعات', 'خودرو']} />
              </motion.div>
            )}

            {/* ─── Personal Info ──────────────────────── */}
            {step === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center"><UserCheck className="h-8 w-8 text-[#D4AF37]" /></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-sm">
                  <Check className="h-4 w-4 text-green-400 shrink-0" />
                  <span className="text-green-300">تأیید هویت شاهکار انجام شد</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">نام و نام خانوادگی *</Label>
                    <Input placeholder="نام کامل" value={fullName} onChange={(e) => { setFullName(e.target.value); setLocalError(''); }} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" autoFocus />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">نام پدر</Label>
                    <Input placeholder="نام پدر" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">شماره گواهینامه</Label>
                    <Input placeholder="شماره گواهینامه رانندگی" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">شماره شبا (اختیاری)</Label>
                    <Input placeholder="IR..." value={shebaNumber} onChange={(e) => setShebaNumber(e.target.value.replace(/[^0-9IR]/g, ''))} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" dir="ltr" />
                  </div>
                </div>
                {localError && <ErrorBox msg={localError} />}
                <Button onClick={handleInfoSubmit} disabled={loading || !fullName.trim()} className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium">
                  مرحله بعد — اطلاعات خودرو
                </Button>
                <StepIndicator current={3} steps={['موبایل', 'کد تأیید', 'شاهکار', 'اطلاعات', 'خودرو']} />
              </motion.div>
            )}

            {/* ─── Vehicle Info ───────────────────────── */}
            {step === 'vehicle' && (
              <motion.div key="vehicle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center"><Car className="h-8 w-8 text-[#D4AF37]" /></div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[#fafafa] text-xs">نوع خودرو</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {vehicleTypes.map((vt) => (
                      <button
                        key={vt.value}
                        type="button"
                        onClick={() => setVehicleType(vt.value)}
                        className={`p-2 rounded-lg border text-xs text-center transition-all ${
                          vehicleType === vt.value
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                            : 'bg-[#0a0a0a] border-[#333] text-[#a1a1aa] hover:border-[#555]'
                        }`}
                      >
                        {vt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">مارک *</Label>
                    <Input placeholder="مثال: پژو" value={vehicleBrand} onChange={(e) => { setVehicleBrand(e.target.value); setLocalError(''); }} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">مدل *</Label>
                    <Input placeholder="مثال: ۲۰۶" value={vehicleModel} onChange={(e) => { setVehicleModel(e.target.value); setLocalError(''); }} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">سال *</Label>
                    <Input type="text" placeholder="مثال: ۱۴۰۲" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-10" dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">رنگ</Label>
                    <Input placeholder="مثال: سفید" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-10" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[#fafafa] text-xs">پلاک *</Label>
                  <Input placeholder="شماره پلاک" value={plateNumber} onChange={(e) => { setPlateNumber(e.target.value); setLocalError(''); }} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-10" dir="ltr" />
                </div>

                {localError && <ErrorBox msg={localError} />}
                <Button onClick={handleSubmit} disabled={loading || !vehicleBrand || !vehicleModel || !vehicleYear || !plateNumber} className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 ml-2" />ثبت درخواست</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setStep('info'); setLocalError(''); }} className="w-full text-[#a1a1aa] hover:text-[#fafafa]"><ArrowLeft className="h-4 w-4 ml-1" />بازگشت</Button>
                <StepIndicator current={4} steps={['موبایل', 'کد تأیید', 'شاهکار', 'اطلاعات', 'خودرو']} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function ErrorBox({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      {msg}
    </motion.div>
  );
}

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
            i < current ? 'bg-green-500 text-white' :
            i === current ? 'bg-[#D4AF37] text-[#0a0a0a]' :
            'bg-[#2d2d2d] text-[#666]'
          }`}>
            {i < current ? <Check className="h-3 w-3" /> : i + 1}
          </div>
          {i < steps.length - 1 && <div className={`w-3 h-px ${i < current ? 'bg-green-500' : 'bg-[#333]'}`} />}
        </div>
      ))}
    </div>
  );
}
