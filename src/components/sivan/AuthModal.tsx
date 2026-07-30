'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Loader2,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
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
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export function AuthModal() {
  const {
    auth,
    closeAuth,
    setAuthUser,
    setAuthVerified,
    openAuth,
  } = useAppStore();

  const isLogin = auth.mode === 'login';
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Local form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setUsername('');
    setFullName('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (mode: 'login' | 'register') => {
    resetForm();
    openAuth(mode);
  };

  const handleLogin = async () => {
    setError('');
    if (!username.trim()) {
      setError('نام کاربری را وارد کنید');
      return;
    }
    if (!password) {
      setError('رمز عبور را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'خطا در ورود');
        return;
      }

      // Check if admin
      if (data.user.role === 'admin') {
        closeAuth();
        toast.success('خوش آمدید، مدیر سیستم');
        return;
      }

      setAuthUser({
        id: data.user.id,
        username: data.user.username,
        fullName: data.user.fullName,
        role: data.user.role,
      });
      setAuthVerified(true);
      closeAuth();
      toast.success(`خوش آمدید ${data.user.fullName || data.user.username}`);
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!username.trim()) {
      setError('نام کاربری را وارد کنید');
      return;
    }
    if (username.trim().length < 3) {
      setError('نام کاربری باید حداقل ۳ کاراکتر باشد');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      setError('نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و _ . - باشد');
      return;
    }
    if (!fullName.trim()) {
      setError('نام و نام خانوادگی را وارد کنید');
      return;
    }
    if (!password) {
      setError('رمز عبور را وارد کنید');
      return;
    }
    if (password.length < 4) {
      setError('رمز عبور باید حداقل ۴ کاراکتر باشد');
      return;
    }
    if (password !== confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          fullName: fullName.trim(),
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'خطا در ثبت نام');
        return;
      }

      setAuthUser({
        id: data.user.id,
        username: data.user.username,
        fullName: data.user.fullName,
        role: data.user.role,
      });
      setAuthVerified(true);
      closeAuth();
      toast.success('ثبت نام با موفقیت انجام شد');
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) handleLogin();
    else handleRegister();
  };

  return (
    <Dialog open={auth.isOpen} onOpenChange={(open) => { if (!open) { resetForm(); closeAuth(); } }}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#D4AF37]/30 text-[#fafafa] p-0 overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-l from-[#D4AF37]/20 to-[#B8941F]/10 px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
                {isLogin ? (
                  <LogIn className="h-5 w-5 text-[#D4AF37]" />
                ) : (
                  <UserPlus className="h-5 w-5 text-[#D4AF37]" />
                )}
              </div>
              <div>
                <DialogTitle className="text-[#fafafa] text-lg font-bold">
                  {isLogin ? 'ورود به حساب کاربری' : 'ثبت‌نام مسافر'}
                </DialogTitle>
                <DialogDescription className="text-[#a1a1aa] text-xs">
                  {isLogin ? 'نام کاربری و رمز عبور خود را وارد کنید' : 'حساب کاربری جدید بسازید'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={auth.mode}
            initial={{ opacity: 0, x: isLogin ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? -20 : 20 }}
            transition={{ duration: 0.2 }}
            className="px-6 pb-6"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label className="text-[#a1a1aa] text-sm">نام کاربری</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: ali123"
                    className="pr-10 bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#555] h-11 focus:border-[#D4AF37]/50 rounded-xl"
                    dir="ltr"
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Full Name (register only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label className="text-[#a1a1aa] text-sm">نام و نام خانوادگی</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="علی محمدی"
                    className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#555] h-11 focus:border-[#D4AF37]/50 rounded-xl"
                    disabled={loading}
                  />
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-[#a1a1aa] text-sm">رمز عبور</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#555] h-11 focus:border-[#D4AF37]/50 rounded-xl"
                    dir="ltr"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#a1a1aa] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (register only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label className="text-[#a1a1aa] text-sm">تکرار رمز عبور</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#555] h-11 focus:border-[#D4AF37]/50 rounded-xl"
                      dir="ltr"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#a1a1aa] transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-12 font-bold text-base rounded-xl transition-all hover:shadow-lg hover:shadow-[#D4AF37]/20"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn className="h-5 w-5 ml-2" />
                    ورود
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 ml-2" />
                    ثبت‌نام
                  </>
                )}
              </Button>

              {/* Switch mode */}
              <div className="text-center text-sm text-[#a1a1aa]">
                {isLogin ? (
                  <>
                    حساب کاربری ندارید؟{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-[#D4AF37] hover:text-[#E5C76B] font-medium transition-colors"
                    >
                      ثبت‌نام کنید
                    </button>
                  </>
                ) : (
                  <>
                    قبلاً ثبت‌نام کرده‌اید؟{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-[#D4AF37] hover:text-[#E5C76B] font-medium transition-colors"
                    >
                      وارد شوید
                    </button>
                  </>
                )}
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
