'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Phone, Mail, MessageSquare, Loader2, Check } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';

export function ContactModal() {
  const { contactOpen, setContactOpen } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(true);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSuccess(false);
      setForm({ name: '', phone: '', email: '', subject: '', message: '' });
    }
    setContactOpen(val);
  };

  return (
    <Dialog open={contactOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right text-[#fafafa]">
            تماس با ما
          </DialogTitle>
          <DialogDescription className="text-right text-[#a1a1aa]">
            پیام خود را ارسال کنید. تیم ما در اسرع وقت پاسخ خواهد داد.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-[#fafafa] font-medium">
              پیام شما با موفقیت ارسال شد!
            </p>
            <p className="text-[#a1a1aa] text-sm">
              به زودی با شما تماس خواهیم گرفت.
            </p>
            <Button
              onClick={() => handleClose(false)}
              className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B]"
            >
              بستن
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#fafafa] text-sm">
                  <User className="h-3 w-3 ml-1 text-[#D4AF37]" />
                  نام
                </Label>
                <Input
                  placeholder="نام شما"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#fafafa] text-sm">
                  <Phone className="h-3 w-3 ml-1 text-[#D4AF37]" />
                  موبایل
                </Label>
                <Input
                  placeholder="شماره موبایل"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-10"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#fafafa] text-sm">
                <Mail className="h-3 w-3 ml-1 text-[#D4AF37]" />
                ایمیل (اختیاری)
              </Label>
              <Input
                type="email"
                placeholder="ایمیل شما"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-10"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#fafafa] text-sm">
                <MessageSquare className="h-3 w-3 ml-1 text-[#D4AF37]" />
                موضوع
              </Label>
              <Input
                placeholder="موضوع پیام"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="bg-[#0a0a0a] border-[#333] text-[#fafafa] h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#fafafa] text-sm">
                <Send className="h-3 w-3 ml-1 text-[#D4AF37]" />
                پیام
              </Label>
              <Textarea
                placeholder="پیام خود را بنویسید..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                className="bg-[#0a0a0a] border-[#333] text-[#fafafa] min-h-[100px]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !form.name || !form.message}
              className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-11 font-medium"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  ارسال پیام
                  <Send className="h-4 w-4 mr-1" />
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
