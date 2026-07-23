'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, Shield, Loader2, Check, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { useAppStore } from '@/lib/store';

export function AuthModal() {
  const {
    auth,
    closeAuth,
    setAuthPhone,
    setAuthOtp,
    setAuthFullName,
    setAuthVerified,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async () => {
    if (auth.phone.length < 10) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setOtpSent(true);
  };

  const handleVerifyOtp = async () => {
    if (auth.otpCode.length < 4) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setAuthVerified(true);
  };

  const handleRegister = async () => {
    if (!auth.fullName || auth.phone.length < 10) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setAuthVerified(true);
  };

  const resetAndClose = () => {
    setOtpSent(false);
    closeAuth();
  };

  return (
    <Dialog open={auth.isOpen} onOpenChange={(val) => { if (!val) resetAndClose(); }}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right text-[#fafafa]">
            {auth.isVerified ? 'خوش آمدید!' : auth.mode === 'login' ? 'ورود به حساب' : 'ثبت‌نام'}
          </DialogTitle>
          <DialogDescription className="text-right text-[#a1a1aa]">
            {auth.isVerified
              ? 'حساب شما با موفقیت تأیید شد'
              : 'برای ادامه، شماره موبایل خود را وارد کنید'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <AnimatePresence mode="wait">
            {/* OTP Success */}
            {auth.isVerified ? (
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
                  {auth.fullName ? `${auth.fullName} عزیز، خوش آمدید!` : 'خوش آمدید!'}
                </p>
                <Button
                  onClick={resetAndClose}
                  className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B]"
                >
                  شروع سفر
                </Button>
              </motion.div>
            ) : (
              <>
                {/* Phone Input */}
                {!otpSent && (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                        <Shield className="h-8 w-8 text-[#D4AF37]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#fafafa]">
                        <Phone className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37]" />
                        شماره موبایل
                      </Label>
                      <Input
                        placeholder="۰۹۱۲XXXXXXX"
                        value={auth.phone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        className="bg-[#0a0a0a] border-[#333] text-[#fafafa] text-center text-lg tracking-widest h-12"
                        dir="ltr"
                        maxLength={11}
                      />
                      <p className="text-xs text-[#a1a1aa] text-center">
                        کد تأیید به این شماره ارسال خواهد شد
                      </p>
                    </div>
                    <Button
                      onClick={handleSendOtp}
                      disabled={auth.phone.length < 10 || loading}
                      className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          ارسال کد تأیید
                          <ArrowLeft className="h-4 w-4 mr-1" />
                        </>
                      )}
                    </Button>

                    {auth.mode === 'login' && (
                      <p className="text-center text-xs text-[#a1a1aa]">
                        حساب ندارید؟{' '}
                        <button
                          onClick={() => { setOtpSent(false); }}
                          className="text-[#D4AF37] hover:underline"
                        >
                          ثبت‌نام کنید
                        </button>
                      </p>
                    )}
                  </motion.div>
                )}

                {/* OTP Input */}
                {otpSent && !auth.isVerified && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    <div className="text-center mb-2">
                      <p className="text-[#a1a1aa] text-sm">
                        کد تأیید ارسال شده به شماره
                      </p>
                      <p className="text-[#fafafa] font-bold mt-1" dir="ltr">{auth.phone}</p>
                    </div>

                    <div className="flex justify-center py-4">
                      <InputOTP
                        value={auth.otpCode}
                        onChange={(val) => setAuthOtp(val)}
                        maxLength={5}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="bg-[#0a0a0a] border-[#333] text-[#fafafa]" />
                          <InputOTPSlot index={1} className="bg-[#0a0a0a] border-[#333] text-[#fafafa]" />
                          <InputOTPSeparator className="text-[#333]" />
                          <InputOTPSlot index={2} className="bg-[#0a0a0a] border-[#333] text-[#fafafa]" />
                          <InputOTPSlot index={3} className="bg-[#0a0a0a] border-[#333] text-[#fafafa]" />
                          <InputOTPSlot index={4} className="bg-[#0a0a0a] border-[#333] text-[#fafafa]" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <Button
                      onClick={handleVerifyOtp}
                      disabled={auth.otpCode.length < 4 || loading}
                      className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'تأیید و ورود'
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
                      <button
                        onClick={() => setOtpSent(false)}
                        className="text-[#D4AF37] hover:underline"
                      >
                        تغییر شماره
                      </button>
                      <button className="hover:text-[#fafafa]">
                        ارسال مجدد کد
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
