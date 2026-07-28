'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

// ─── OTP Step tracking ─────────────────────────────────────────────

type OTPStep = 'phone' | 'code' | 'register' | 'success';

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
  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when modal opens/closes
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
      // Focus phone input after mount
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [auth.isOpen]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
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
        // New user — go to registration step
        setStep('register');
        setLoading(false);
      } else {
        // Existing user — login directly
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

        // Admin handling
        if (data.user?.role === 'admin') {
          adminLogin(data.user.username, '');
          setTimeout(() => {
            setAdminOpen(true);
            closeAuth();
          }, 1200);
        } else {
          setTimeout(() => {
            closeAuth();
            setUserPanelOpen(true);
          }, 1200);
        }

        toast.success(`خوش آمدید، ${data.user?.fullName || 'کاربر'} عزیز`);
      }
    } catch {
      setLocalError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Complete Registration ──────────────────────────

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
          password: `pass_${Date.now()}`, // Auto-generated since auth is OTP-based
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
      setTimeout(() => {
        closeAuth();
        setUserPanelOpen(true);
      }, 1200);
    } catch {
      setLocalError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // ─── Legacy login via username/password ─────────────────────

  const [legacyMode, setLegacyMode] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
      setTimeout(() => {
        closeAuth();
        setUserPanelOpen(true);
      }, 900);
    } catch {
      setLocalError('خطا در ارتباط با سرور');
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setLocalError('');
    closeAuth();
  };

  const formatCountdown = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={auth.isOpen} onOpenChange={(val) => { if (!val) resetAndClose(); }}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right text-[#fafafa]">
            {step === 'success'
              ? 'خوش آمدید!'
              : step === 'register'
                ? 'تکمیل ثبت‌نام'
                : step === 'code'
                  ? 'تأیید شماره موبایل'
                  : legacyMode
                    ? 'ورود با نام کاربری'
                    : 'ورود / ثبت‌نام'}
          </DialogTitle>
          <DialogDescription className="text-right text-[#a1a1aa]">
            {step === 'success'
              ? 'حساب شما با موفقیت تأیید شد'
              : step === 'register'
                ? 'برای تکمیل ثبت‌نام، نام خود را وارد کنید'
                : step === 'code'
                  ? `کد تأیید ارسال شده به ${auth.phone} را وارد کنید`
                  : legacyMode
                    ? 'نام کاربری و رمز عبور خود را وارد کنید'
                    : 'شماره موبایل خود را وارد کنید تا کد تأیید ارسال شود'}
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
                  <Check className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-[#fafafa] font-medium">
                  {auth.user?.fullName ? `${auth.user.fullName} عزیز، خوش آمدید!` : 'خوش آمدید!'}
                </p>
                <p className="text-[#a1a1aa] text-xs">در حال ورود به پنل کاربری...</p>
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
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setAuthPhone(val);
                      setLocalError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12 text-lg tracking-wider"
                    dir="ltr"
                    autoFocus
                    maxLength={11}
                  />
                  <p className="text-[10px] text-[#666]">
                    کد تأیید به این شماره ارسال می‌شود
                  </p>
                </div>

                {localError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {localError}
                  </motion.div>
                )}

                <Button
                  onClick={handleSendOTP}
                  disabled={loading || auth.phone.length !== 11}
                  className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Fingerprint className="h-4 w-4 ml-2" />
                      ارسال کد تأیید
                    </>
                  )}
                </Button>

                {/* Switch to legacy login */}
                <div className="text-center text-xs text-[#a1a1aa] pt-1">
                  ورود با نام کاربری؟{' '}
                  <button
                    type="button"
                    onClick={() => { setLegacyMode(true); setLocalError(''); }}
                    className="text-[#D4AF37] hover:text-[#E5C76B] font-medium underline-offset-2 hover:underline"
                  >
                    کلیک کنید
                  </button>
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
                  <Label className="text-[#fafafa] text-sm text-center">
                    کد تأیید ۶ رقمی
                  </Label>
                  <InputOTP
                    maxLength={6}
                    onComplete={(code) => handleVerifyOTP(code)}
                    disabled={loading}
                    containerClassName="justify-center"
                    dir="ltr"
                  >
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

                  {/* Demo OTP display */}
                  {isDemo && demoOtp && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-center">
                      <p className="text-amber-400 text-xs mb-1">حالت آزمایشی — کد تأیید:</p>
                      <p className="text-amber-300 font-mono text-lg tracking-widest font-bold">{demoOtp}</p>
                    </div>
                  )}

                  {/* Countdown / Resend */}
                  <div className="flex items-center gap-2 text-xs">
                    {countdown > 0 ? (
                      <>
                        <Timer className="h-3 w-3 text-[#a1a1aa]" />
                        <span className="text-[#a1a1aa]">
                          ارسال مجدد تا {formatCountdown(countdown)}
                        </span>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="text-[#D4AF37] hover:text-[#E5C76B] font-medium"
                      >
                        ارسال مجدد کد تأیید
                      </button>
                    )}
                  </div>
                </div>

                {localError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {localError}
                  </motion.div>
                )}

                {loading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-[#a1a1aa]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
                    در حال تأیید...
                  </div>
                )}

                {/* Back button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setStep('phone'); setLocalError(''); }}
                  className="w-full text-[#a1a1aa] hover:text-[#fafafa]"
                >
                  <ArrowLeft className="h-4 w-4 ml-1" />
                  تغییر شماره موبایل
                </Button>
              </motion.div>
            )}

            {/* ─── Registration (New User) ────────────────── */}
            {step === 'register' && (
              <motion.div
                key="register"
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

                {localError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {localError}
                  </motion.div>
                )}

                <Button
                  onClick={handleCompleteRegistration}
                  disabled={loading || !auth.fullName.trim() || auth.fullName.trim().length < 2}
                  className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 ml-2" />
                      تکمیل ثبت‌نام
                    </>
                  )}
                </Button>
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
                  <Label className="text-[#fafafa] text-sm">
                    <User className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37] inline" />
                    نام کاربری
                  </Label>
                  <Input
                    placeholder="نام کاربری خود را وارد کنید"
                    value={auth.username}
                    onChange={(e) => { setAuthUsername(e.target.value); setLocalError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLegacyLogin()}
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12"
                    dir="ltr"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#fafafa] text-sm">
                    رمز عبور
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder="رمز عبور"
                      value={auth.password}
                      onChange={(e) => { setAuthPassword(e.target.value); setLocalError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleLegacyLogin()}
                      className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#fafafa]"
                    >
                      {showPass ? <Check className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {localError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {localError}
                  </motion.div>
                )}

                <Button
                  onClick={handleLegacyLogin}
                  disabled={loading || !auth.username || !auth.password}
                  className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 ml-2" />
                      ورود به حساب
                    </>
                  )}
                </Button>

                {/* Switch back to OTP */}
                <div className="text-center text-xs text-[#a1a1aa] pt-1">
                  ورود با شماره موبایل؟{' '}
                  <button
                    type="button"
                    onClick={() => { setLegacyMode(false); setLocalError(''); }}
                    className="text-[#D4AF37] hover:text-[#E5C76B] font-medium underline-offset-2 hover:underline"
                  >
                    کلیک کنید
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
