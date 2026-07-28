'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Loader2,
  Check,
  AlertTriangle,
  UserPlus,
  LogIn,
  Shield,
  Phone,
  Smartphone,
  KeyRound,
  ArrowLeft,
  Timer,
  Fingerprint,
  Car,
  IdCard,
  UserCheck,
  CreditCard,
  BadgeCheck,
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

// ─── Step tracking ──────────────────────────────────────────────

type OTPStep = 'phone' | 'code' | 'register' | 'success';
type RegisterMode = 'passenger' | 'driver';
type DriverSubStep = 'select-type' | 'shahkar' | 'info' | 'vehicle';

export function AuthModal() {
  const {
    auth,
    closeAuth,
    setAuthUsername,
    setAuthFullName,
    setAuthPhone,
    setAuthUser,
    setAuthVerified,
    adminLogin,
    setAdminOpen,
    openAuth,
    setUserPanelOpen,
  } = useAppStore();

  const [step, setStep] = useState<OTPStep>('phone');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingUser, setExistingUser] = useState<{ id: string; fullName: string; username: string; role: string } | null>(null);

  // Legacy login
  const [legacyMode, setLegacyMode] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Driver registration state
  const [registerMode, setRegisterMode] = useState<RegisterMode>('passenger');
  const [driverSubStep, setDriverSubStep] = useState<DriverSubStep>('select-type');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [shebaNumber, setShebaNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('sedan');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when modal opens
  useEffect(() => {
    if (auth.isOpen) {
      setStep('phone');
      setLocalError('');
      setOtpSent(false);
      setIsDemo(false);
      setDemoOtp('');
      setCountdown(0);
      setIsExistingUser(false);
      setExistingUser(null);
      setLegacyMode(false);
      setShowPass(false);
      setRegisterMode('passenger');
      setDriverSubStep('select-type');
      setNationalId('');
      setBirthDate('');
      setFatherName('');
      setLicenseNumber('');
      setShebaNumber('');
      setVehicleType('sedan');
      setVehicleBrand('');
      setVehicleModel('');
      setVehicleYear('');
      setVehicleColor('');
      setPlateNumber('');
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [auth.isOpen]);

  // Countdown timer
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

  // ─── Step 1: Send OTP ──────────────────────────────────────

  const handleSendOTP = async () => {
    const phone = auth.phone.trim();
    if (!phone || !/^09[0-9]{9}$/.test(phone)) {
      setLocalError('شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹)');
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

      if (!res.ok) {
        setLocalError(data.error || 'خطا در ارسال کد تأیید');
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setIsDemo(!!data.isDemo);
      if (data.isDemo && data.otp) {
        setDemoOtp(data.otp);
      }
      setCountdown(120);
      setStep('code');
      toast.success('کد تأیید ارسال شد');
    } catch {
      setLocalError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ─────────────────────────────────────

  const handleVerifyOTP = async (code: string) => {
    if (!code || code.length !== 6) return;
    setLocalError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: auth.phone, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLocalError(data.error || 'کد تأیید نامعتبر');
        setLoading(false);
        return;
      }

      if (data.isNewUser) {
        setStep('register');
        setDriverSubStep('select-type');
        setLoading(false);
      } else {
        setIsExistingUser(true);
        setExistingUser(data.user);
        setAuthUser({
          id: data.user.id,
          username: data.user.username || data.user.phone,
          fullName: data.user.fullName,
          role: data.user.role,
        });
        setAuthVerified(true);
        setStep('success');

        if (data.user?.role === 'admin') {
          adminLogin(data.user.username, '');
          setTimeout(() => { setAdminOpen(true); closeAuth(); }, 1200);
        } else {
          setTimeout(() => { closeAuth(); setUserPanelOpen(true); }, 1200);
        }

        toast.success(`خوش آمدید، ${data.user?.fullName || 'کاربر'} عزیز`);
      }
    } catch {
      setLocalError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3a: Select Registration Type ──────────────────────

  const handleSelectRegisterMode = (mode: RegisterMode) => {
    setRegisterMode(mode);
    setLocalError('');
    if (mode === 'passenger') {
      // Just show name input — no sub-step change needed
    } else {
      setDriverSubStep('shahkar');
    }
  };

  // ─── Step 3b: Shahkar Verification (Driver) ─────────────────

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
        body: JSON.stringify({ nationalId, phone: auth.phone, birthDate: birthDate || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error || 'خطا در تأیید شاهکار');
        setLoading(false);
        return;
      }
      if (!data.verified) {
        setLocalError('تطبیق شاهکار انجام نشد. شماره موبایل با کد ملی مطابقت ندارد.');
        setLoading(false);
        return;
      }
      if (data.personInfo) {
        if (data.personInfo.firstName || data.personInfo.lastName) {
          setAuthFullName(`${data.personInfo.firstName || ''} ${data.personInfo.lastName || ''}`.trim());
        }
        if (data.personInfo.fatherName) {
          setFatherName(data.personInfo.fatherName);
        }
      }
      setDriverSubStep('info');
      toast.success(data.isDemo ? 'تأیید شاهکار موفق (آزمایشی)' : 'تأیید شاهکار موفق');
    } catch {
      setLocalError('خطا در ارتباط');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3c: Driver Personal Info ──────────────────────────

  const handleDriverInfoSubmit = () => {
    const fullName = auth.fullName.trim();
    if (!fullName || fullName.length < 2) {
      setLocalError('نام و نام خانوادگی را کامل وارد کنید');
      return;
    }
    setLocalError('');
    setDriverSubStep('vehicle');
  };

  // ─── Step 3d: Vehicle Info + Final Submit ───────────────────

  const handleDriverSubmit = async () => {
    if (!vehicleBrand || !vehicleModel || !vehicleYear || !plateNumber) {
      setLocalError('اطلاعات خودرو را کامل وارد کنید');
      return;
    }
    setLocalError('');
    setLoading(true);

    try {
      // First register as user
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `driver_${auth.phone}`,
          fullName: auth.fullName.trim(),
          password: `pass_${Date.now()}`,
          phone: auth.phone,
        }),
      });

      const regData = await regRes.json();

      // Then submit driver application
      const driverRes = await fetch('/api/auth/register-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: auth.phone,
          nationalId,
          fullName: auth.fullName.trim(),
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

      const driverData = await driverRes.json();

      if (!driverRes.ok) {
        setLocalError(driverData.error || 'خطا در ثبت‌نام راننده');
        setLoading(false);
        return;
      }

      // Set authenticated user
      if (regRes.ok && regData.user) {
        setAuthUser({
          id: regData.user.id,
          username: regData.user.username,
          fullName: regData.user.fullName,
          role: regData.user.role,
        });
        setAuthVerified(true);
      }

      setStep('success');
      toast.success('درخواست ثبت‌نام راننده با موفقیت ثبت شد');
      setTimeout(() => {
        closeAuth();
        if (regRes.ok) setUserPanelOpen(true);
      }, 1200);
    } catch {
      setLocalError('خطا در ارتباط');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3e: Complete Passenger Registration ──────────────

  const handleCompleteRegistration = async () => {
    const fullName = auth.fullName.trim();
    if (!fullName || fullName.length < 2) {
      setLocalError('نام و نام خانوادگی را کامل وارد کنید');
      return;
    }
    setLocalError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `user_${auth.phone}`,
          fullName,
          password: `pass_${Date.now()}`,
          phone: auth.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLocalError(data.error || 'خطا در ثبت‌نام');
        setLoading(false);
        return;
      }

      setAuthUser({
        id: data.user.id,
        username: data.user.username,
        fullName: data.user.fullName,
        role: data.user.role,
      });
      setAuthVerified(true);
      setStep('success');

      toast.success(`ثبت‌نام موفق! خوش آمدید، ${data.user.fullName} عزیز`);
      setTimeout(() => { closeAuth(); setUserPanelOpen(true); }, 1200);
    } catch {
      setLocalError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // ─── Legacy login via username/password ─────────────────────

  const handleLegacyLogin = async () => {
    if (!auth.username || !auth.password) {
      setLocalError('نام کاربری و رمز عبور را وارد کنید');
      return;
    }
    setLocalError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: auth.username, password: auth.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLocalError(data.error || 'خطا در ورود');
        setLoading(false);
        return;
      }

      setAuthUser(data.user || null);

      if (data.user?.role === 'admin') {
        adminLogin(auth.username, auth.password);
        setAdminOpen(true);
        closeAuth();
        setLoading(false);
        return;
      }

      setAuthVerified(true);
      setLoading(false);
      toast.success(`خوش آمدید، ${data.user?.fullName || 'کاربر'} عزیز`);
      setTimeout(() => { closeAuth(); setUserPanelOpen(true); }, 900);
    } catch {
      setLocalError('خطا در ارتباط با سرور');
      setLoading(false);
    }
  };

  const resetAndClose = () => { setLocalError(''); closeAuth(); };

  const formatCountdown = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Driver step labels
  const driverStepLabels = ['موبایل', 'کد تأیید', 'شاهکار', 'اطلاعات', 'خودرو'];
  const getDriverStepIndex = () => {
    switch (driverSubStep) {
      case 'shahkar': return 2;
      case 'info': return 3;
      case 'vehicle': return 4;
      default: return 2;
    }
  };

  return (
    <Dialog open={auth.isOpen} onOpenChange={(val) => { if (!val) resetAndClose(); }}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right text-[#fafafa]">
            {step === 'success'
              ? 'خوش آمدید!'
              : step === 'register' && registerMode === 'driver' && driverSubStep === 'vehicle'
                ? 'اطلاعات خودرو'
              : step === 'register' && registerMode === 'driver' && driverSubStep === 'info'
                ? 'اطلاعات شخصی راننده'
              : step === 'register' && registerMode === 'driver' && driverSubStep === 'shahkar'
                ? 'تأیید شاهکار'
                : step === 'register'
                  ? 'تکمیل ثبت‌نام'
                : step === 'code'
                  ? 'تأیید شماره موبایل'
                  : legacyMode
                    ? 'ورود با نام کاربری'
                    : 'ورود / ثبت‌نام'}
          </DialogTitle>
          <DialogDescription className="text-right text-[#a1a1aa]">
            {step === 'success' && 'حساب شما با موفقیت تأیید شد'}
            {step === 'register' && registerMode === 'driver' && driverSubStep === 'select-type' && 'نوع حساب کاربری خود را انتخاب کنید'}
            {step === 'register' && registerMode === 'driver' && driverSubStep === 'shahkar' && 'تأیید هویت شاهکار — تطبیق کد ملی با شماره موبایل'}
            {step === 'register' && registerMode === 'driver' && driverSubStep === 'info' && 'اطلاعات شخصی راننده'}
            {step === 'register' && registerMode === 'driver' && driverSubStep === 'vehicle' && 'اطلاعات خودرو'}
            {step === 'register' && registerMode === 'passenger' && 'برای تکمیل ثبت‌نام، نام خود را وارد کنید'}
            {step === 'code' && `کد تأیید ارسال شده به ${auth.phone} را وارد کنید`}
            {step === 'phone' && !legacyMode && 'شماره موبایل خود را وارد کنید تا کد تأیید ارسال شود'}
            {step === 'phone' && legacyMode && 'نام کاربری و رمز عبور خود را وارد کنید'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <AnimatePresence mode="wait">
            {/* ─── Success State ─────────────────────────── */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  {registerMode === 'driver' ? (
                    <BadgeCheck className="h-8 w-8 text-green-400" />
                  ) : (
                    <Check className="h-8 w-8 text-green-400" />
                  )}
                </div>
                <p className="text-[#fafafa] font-medium">
                  {registerMode === 'driver'
                    ? 'درخواست ثبت‌نام راننده شما ثبت شد'
                    : auth.user?.fullName
                      ? `${auth.user.fullName} عزیز، خوش آمدید!`
                      : 'خوش آمدید!'}
                </p>
                {registerMode === 'driver' && (
                  <p className="text-[#a1a1aa] text-xs">پس از بررسی اطلاعات، نتیجه از طریق پیامک اطلاع‌رسانی خواهد شد</p>
                )}
                <Button onClick={resetAndClose} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B]">
                  بستن
                </Button>
              </motion.div>
            )}

            {/* ─── Phone Entry ───────────────────────────── */}
            {step === 'phone' && !legacyMode && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-[#D4AF37]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#fafafa] text-sm">
                    <Phone className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37] inline" />
                    شماره موبایل
                  </Label>
                  <Input
                    ref={inputRef}
                    type="tel"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={auth.phone}
                    onChange={(e) => { setAuthPhone(e.target.value.replace(/[^0-9]/g, '')); setLocalError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12 text-lg tracking-wider"
                    dir="ltr"
                    autoFocus
                    maxLength={11}
                  />
                  <p className="text-[10px] text-[#666]">کد تأیید به این شماره ارسال می‌شود</p>
                </div>

                {localError && <ErrorBox msg={localError} />}

                <Button
                  onClick={handleSendOTP}
                  disabled={loading || auth.phone.length !== 11}
                  className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Fingerprint className="h-4 w-4 ml-2" />ارسال کد تأیید</>}
                </Button>

                <div className="text-center text-xs text-[#a1a1aa] pt-1">
                  ورود با نام کاربری؟{' '}
                  <button type="button" onClick={() => { setLegacyMode(true); setLocalError(''); }} className="text-[#D4AF37] hover:text-[#E5C76B] font-medium underline-offset-2 hover:underline">کلیک کنید</button>
                </div>
              </motion.div>
            )}

            {/* ─── OTP Code Entry ─────────────────────────── */}
            {step === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <KeyRound className="h-8 w-8 text-[#D4AF37]" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <Label className="text-[#fafafa] text-sm text-center">کد تأیید ۶ رقمی</Label>
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
                      <button type="button" onClick={handleSendOTP} disabled={loading} className="text-[#D4AF37] hover:text-[#E5C76B] font-medium">ارسال مجدد کد تأیید</button>
                    )}
                  </div>
                </div>

                {localError && <ErrorBox msg={localError} />}
                {loading && <div className="flex items-center justify-center gap-2 text-sm text-[#a1a1aa]"><Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />در حال تأیید...</div>}

                <Button variant="ghost" size="sm" onClick={() => { setStep('phone'); setLocalError(''); }} className="w-full text-[#a1a1aa] hover:text-[#fafafa]">
                  <ArrowLeft className="h-4 w-4 ml-1" />تغییر شماره موبایل
                </Button>
              </motion.div>
            )}

            {/* ─── Registration: Select Type (New User) ────── */}
            {step === 'register' && driverSubStep === 'select-type' && (
              <motion.div
                key="select-type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-[#D4AF37]" />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-sm">
                  <Check className="h-4 w-4 text-green-400 shrink-0" />
                  <span className="text-green-300">شماره موبایل {auth.phone} تأیید شد</span>
                </div>

                <p className="text-[#a1a1aa] text-sm text-center">نوع حساب کاربری خود را انتخاب کنید</p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Passenger */}
                  <button
                    type="button"
                    onClick={() => handleSelectRegisterMode('passenger')}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      registerMode === 'passenger'
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-[#0a0a0a] border-[#333] text-[#a1a1aa] hover:border-[#555] hover:text-[#fafafa]'
                    }`}
                  >
                    <User className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm font-medium block">مسافر</span>
                    <span className="text-[10px] block mt-1 opacity-70">ثبت‌نام سریع</span>
                  </button>

                  {/* Driver */}
                  <button
                    type="button"
                    onClick={() => handleSelectRegisterMode('driver')}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      registerMode === 'driver'
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-[#0a0a0a] border-[#333] text-[#a1a1aa] hover:border-[#555] hover:text-[#fafafa]'
                    }`}
                  >
                    <Car className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm font-medium block">راننده</span>
                    <span className="text-[10px] block mt-1 opacity-70">ثبت‌نام با احراز هویت</span>
                  </button>
                </div>

                {/* Passenger quick register (shown immediately when passenger selected) */}
                {registerMode === 'passenger' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-2">
                    <div className="space-y-2">
                      <Label className="text-[#fafafa] text-sm">
                        <User className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37] inline" />
                        نام و نام خانوادگی
                      </Label>
                      <Input
                        placeholder="مثال: علی رضایی"
                        value={auth.fullName}
                        onChange={(e) => { setAuthFullName(e.target.value); setLocalError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleCompleteRegistration()}
                        className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12"
                        autoFocus
                      />
                    </div>
                    {localError && <ErrorBox msg={localError} />}
                    <Button
                      onClick={handleCompleteRegistration}
                      disabled={loading || !auth.fullName.trim() || auth.fullName.trim().length < 2}
                      className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 ml-2" />تکمیل ثبت‌نام</>}
                    </Button>
                  </motion.div>
                )}

                <Button variant="ghost" size="sm" onClick={() => { setStep('code'); setLocalError(''); }} className="w-full text-[#a1a1aa] hover:text-[#fafafa]">
                  <ArrowLeft className="h-4 w-4 ml-1" />بازگشت
                </Button>
              </motion.div>
            )}

            {/* ─── Driver: Shahkar Verification ─────────────── */}
            {step === 'register' && registerMode === 'driver' && driverSubStep === 'shahkar' && (
              <motion.div
                key="driver-shahkar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <IdCard className="h-7 w-7 text-[#D4AF37]" />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-sm">
                  <Check className="h-4 w-4 text-green-400 shrink-0" />
                  <span className="text-green-300">شماره موبایل <span className="font-bold">{auth.phone}</span> تأیید شد</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">کد ملی (۱۰ رقم) *</Label>
                    <Input type="text" placeholder="کد ملی ۱۰ رقمی" value={nationalId} onChange={(e) => { setNationalId(e.target.value.replace(/[^0-9]/g, '')); setLocalError(''); }} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" dir="ltr" maxLength={10} autoFocus />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">تاریخ تولد شمسی (اختیاری)</Label>
                    <Input type="text" placeholder="مثال: ۱۳۷۰/۰۱/۰۱" value={birthDate} onChange={(e) => { setBirthDate(e.target.value); setLocalError(''); }} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" dir="ltr" />
                  </div>
                </div>

                {localError && <ErrorBox msg={localError} />}
                <Button onClick={handleShahkarVerify} disabled={loading || nationalId.length !== 10} className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Shield className="h-4 w-4 ml-2" />تأیید شاهکار</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setDriverSubStep('select-type'); setRegisterMode('passenger'); setLocalError(''); }} className="w-full text-[#a1a1aa] hover:text-[#fafafa]">
                  <ArrowLeft className="h-4 w-4 ml-1" />بازگشت
                </Button>
                <StepIndicator current={getDriverStepIndex()} steps={driverStepLabels} />
              </motion.div>
            )}

            {/* ─── Driver: Personal Info ───────────────────── */}
            {step === 'register' && registerMode === 'driver' && driverSubStep === 'info' && (
              <motion.div
                key="driver-info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <UserCheck className="h-7 w-7 text-[#D4AF37]" />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-sm">
                  <Check className="h-4 w-4 text-green-400 shrink-0" />
                  <span className="text-green-300">تأیید هویت شاهکار انجام شد</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[#fafafa] text-xs">نام و نام خانوادگی *</Label>
                    <Input placeholder="نام کامل" value={auth.fullName} onChange={(e) => { setAuthFullName(e.target.value); setLocalError(''); }} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11" autoFocus />
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
                <Button onClick={handleDriverInfoSubmit} disabled={loading || !auth.fullName.trim()} className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium">
                  مرحله بعد — اطلاعات خودرو
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setDriverSubStep('shahkar'); setLocalError(''); }} className="w-full text-[#a1a1aa] hover:text-[#fafafa]">
                  <ArrowLeft className="h-4 w-4 ml-1" />بازگشت
                </Button>
                <StepIndicator current={getDriverStepIndex()} steps={driverStepLabels} />
              </motion.div>
            )}

            {/* ─── Driver: Vehicle Info ────────────────────── */}
            {step === 'register' && registerMode === 'driver' && driverSubStep === 'vehicle' && (
              <motion.div
                key="driver-vehicle"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Car className="h-7 w-7 text-[#D4AF37]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[#fafafa] text-xs">نوع خودرو</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'sedan', label: 'سدان' },
                      { value: 'suv', label: 'شاسی‌بلند' },
                      { value: 'van', label: 'ون' },
                      { value: 'electric', label: 'برقی' },
                    ].map((vt) => (
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
                <Button onClick={handleDriverSubmit} disabled={loading || !vehicleBrand || !vehicleModel || !vehicleYear || !plateNumber} className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 ml-2" />ثبت درخواست راننده</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setDriverSubStep('info'); setLocalError(''); }} className="w-full text-[#a1a1aa] hover:text-[#fafafa]">
                  <ArrowLeft className="h-4 w-4 ml-1" />بازگشت
                </Button>
                <StepIndicator current={getDriverStepIndex()} steps={driverStepLabels} />
              </motion.div>
            )}

            {/* ─── Legacy Username Login ───────────────────── */}
            {step === 'phone' && legacyMode && (
              <motion.div
                key="legacy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-[#D4AF37]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#fafafa] text-sm"><User className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37] inline" />نام کاربری</Label>
                  <Input placeholder="نام کاربری" value={auth.username} onChange={(e) => { setAuthUsername(e.target.value); setLocalError(''); }} onKeyDown={(e) => e.key === 'Enter' && handleLegacyLogin()} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12" dir="ltr" autoFocus />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#fafafa] text-sm">رمز عبور</Label>
                  <div className="relative">
                    <Input type={showPass ? 'text' : 'password'} placeholder="رمز عبور" value={auth.password} onChange={(e) => { setAuthPassword(e.target.value); setLocalError(''); }} onKeyDown={(e) => e.key === 'Enter' && handleLegacyLogin()} className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12" dir="ltr" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#fafafa]">
                      {showPass ? <Check className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {localError && <ErrorBox msg={localError} />}

                <Button onClick={handleLegacyLogin} disabled={loading || !auth.username || !auth.password} className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4 ml-2" />ورود به حساب</>}
                </Button>

                <div className="text-center text-xs text-[#a1a1aa] pt-1">
                  ورود با شماره موبایل؟{' '}
                  <button type="button" onClick={() => { setLegacyMode(false); setLocalError(''); }} className="text-[#D4AF37] hover:text-[#E5C76B] font-medium underline-offset-2 hover:underline">کلیک کنید</button>
                </div>
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
