'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Shield, Loader2, Check, Eye, EyeOff, AlertTriangle } from 'lucide-react';
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
import { useAppStore } from '@/lib/store';

export function AuthModal() {
  const { auth, closeAuth, setAuthUsername, setAuthPassword, setAuthVerified, setAuthUser, adminLogin, setAdminOpen } = useAppStore();

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleLogin = async () => {
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

      // Store user info in auth state
      setAuthUser(data.user || null);

      // If the logged-in user is an admin, open the admin panel instead of the welcome screen
      if (data.user?.role === 'admin') {
        adminLogin(auth.username, auth.password);
        setAdminOpen(true);
        closeAuth();
        setLoading(false);
        return;
      }

      setAuthVerified(true);
      setLoading(false);
    } catch {
      setLocalError('خطا در ارتباط با سرور');
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setLocalError('');
    closeAuth();
  };

  return (
    <Dialog open={auth.isOpen} onOpenChange={(val) => { if (!val) resetAndClose(); }}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right text-[#fafafa]">
            {auth.isVerified ? 'خوش آمدید!' : 'ورود به حساب کاربری'}
          </DialogTitle>
          <DialogDescription className="text-right text-[#a1a1aa]">
            {auth.isVerified ? 'حساب شما با موفقیت تأیید شد' : 'نام کاربری و رمز عبور خود را وارد کنید'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <AnimatePresence mode="wait">
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
              <motion.div
                key="login"
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
                  <Label className="text-[#fafafa] text-sm">
                    <User className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37] inline" />
                    نام کاربری
                  </Label>
                  <Input
                    placeholder="نام کاربری"
                    value={auth.username}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-12"
                    dir="ltr"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#fafafa] text-sm">
                    <Lock className="h-3.5 w-3.5 ml-1.5 text-[#D4AF37] inline" />
                    رمز عبور
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder="رمز عبور"
                      value={auth.password}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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

                {(localError) && (
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
                  onClick={handleLogin}
                  disabled={loading || !auth.username || !auth.password}
                  className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-medium"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'ورود به حساب'
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
