'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, PenLine, X, Loader2, LogIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

type StaticTestimonial = {
  id: number;
  name: string;
  role: string;
  rating: number;
  comment: string;
  trip: string;
};

type DbTestimonial = {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  comment: string;
  tripRoute: string | null;
  isApproved: boolean;
  createdAt: string;
};

type Testimonial = {
  id: string | number;
  name: string;
  role: string;
  rating: number;
  comment: string;
  trip: string;
};

const staticTestimonials: StaticTestimonial[] = [
  {
    id: 1,
    name: 'علی محمدی',
    role: 'مسافر دائمی',
    rating: 5,
    comment:
      'سفر فوق‌العاده‌ای بود. راننده بسیار مؤدب و حرفه‌ای بود. خودرو تمیز و با امکانات کامل. قطعاً دوباره از سیوان استفاده می‌کنم.',
    trip: 'تهران → اصفهان',
  },
  {
    id: 2,
    name: 'سارا احمدی',
    role: 'کارمند شرکتی',
    rating: 5,
    comment:
      'بهترین تجربه سفر بین شهری. خودرو تمیز و راحت. قیمت هم بسیار مناسب بود نسبت به کیفیت ارائه شده. پیشنهاد می‌کنم.',
    trip: 'تهران → شیراز',
  },
  {
    id: 3,
    name: 'رضا کریمی',
    role: 'دانشجو',
    rating: 5,
    comment:
      'قیمت مناسب و کیفیت عالی. از رزرو آنلاین تا پایان سفر همه چیز عالی بود. پشتیبانی هم خیلی سریع جواب داد.',
    trip: 'تهران → مشهد',
  },
  {
    id: 4,
    name: 'مریم حسینی',
    role: 'مدیر فروش',
    rating: 4,
    comment:
      'برای سفرهای کاری از تاکسی VIP سیوان استفاده می‌کنم. همیشه وقت‌شناس هستند و کیفیت خدمات یکدست و عالی است.',
    trip: 'تهران → تبریز',
  },
  {
    id: 5,
    name: 'حسین رضایی',
    role: 'مهندس',
    rating: 5,
    comment:
      'با خانواده سفر کردیم و فوق‌العاده بود. ون بزرگ و راحت بود. راننده صبور و محترمانه رانندگی کرد. ممنون سیوان.',
    trip: 'تهران → رشت',
  },
  {
    id: 6,
    name: 'فاطمه عباسی',
    role: 'پزشک',
    rating: 5,
    comment:
      'بعد از یک روز کاری طولانی، سفر با سیوان واقعاً آرامش‌بخش بود. خودرو تمیز، بوی خوش و فضای دلنشین. عالی بود.',
    trip: 'تهران → کرمانشاه',
  },
  {
    id: 7,
    name: 'مهدی نجفی',
    role: 'کارآفرین',
    rating: 5,
    comment:
      'برای سفرهای تجاری‌ام همیشه سیوان را انتخاب می‌کنم. راننده‌ها حرفه‌ای و مسلط به مسیر بودند و من بدون استرس به مقصد رسیدم.',
    trip: 'تهران → اهواز',
  },
  {
    id: 8,
    name: 'زهرا موسوی',
    role: 'معلم',
    rating: 4,
    comment:
      'سفر امن و راحت برای مسیر طولانی بود. استراحت‌گاه‌ها به‌موقع انتخاب شدند و راننده با لبخند و احترام کامل رفتار کرد. ممنون.',
    trip: 'تهران → کرمان',
  },
  {
    id: 9,
    name: 'نیما صادقی',
    role: 'طراح گرافیک',
    rating: 5,
    comment:
      'از لحظه رزرو آنلاین تا پایان سفر همه‌چیز بی‌نقص بود. ماشین لاکچری و تمیز، راننده خوش‌اخلاق و قیمت منصفانه. تجربه‌ای فراموش‌نشدنی.',
    trip: 'تهران → قم',
  },
  {
    id: 10,
    name: 'الهام رحیمی',
    role: 'پرستار',
    rating: 5,
    comment:
      'شیفت شب تمام شده بود و خسته بودم، ولی سفر با سیوان کلافه‌ای‌ام را برطرف کرد. صندلی راحت، موسیقی ملایم و راننده‌ای ساکت و محترم.',
    trip: 'تهران → اردبیل',
  },
  {
    id: 11,
    name: 'کاوه تهرانی',
    role: 'وکیل',
    rating: 4,
    comment:
      'وقت‌شناسی عالی و خودروی تمیز. باید زود به دادگاه می‌رسیدم و راننده بهترین مسیر را انتخاب کرد. قطعاً مسافر ثابت می‌شوم.',
    trip: 'تهران → قزوین',
  },
  {
    id: 12,
    name: 'سمیرا کاظمی',
    role: 'مدیر بازاریابی',
    rating: 5,
    comment:
      'سفر کاری فوری داشتم و ظرف کمتر از ۲۰ دقیقه ماشین جلوی در بود. خودروی VIP با اینترنت رایگان و نوشیدنی. عالی بود.',
    trip: 'تهران → ساری',
  },
];

function normalizeDbItem(item: DbTestimonial): Testimonial {
  return {
    id: item.id,
    name: item.name,
    role: 'مسافر سیوان',
    rating: item.rating,
    comment: item.comment,
    trip: item.tripRoute || 'سفر با سیوان',
  };
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#333]'}`}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { auth, openAuth } = useAppStore();
  const [api, setApiState] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    staticTestimonials
  );
  const pauseRef = useRef(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    pauseRef.current = paused;
  }, [paused]);

  // Capture embla API + initialize tracking state (done in callback to avoid
  // synchronous setState inside effect bodies)
  const handleSetApi = useCallback((nextApi: CarouselApi) => {
    setApiState(nextApi);
    setCount(nextApi.scrollSnapList().length);
    setCurrent(nextApi.selectedScrollSnap());
  }, []);

  // Fetch DB-backed approved testimonials and merge (DB first, then static)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/testimonials')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load testimonials');
        return res.json();
      })
      .then((data: DbTestimonial[]) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        const normalized = data.map(normalizeDbItem);
        setTestimonials([...normalized, ...staticTestimonials]);
      })
      .catch(() => {
        // Fall back to static list silently
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Track current slide + total snaps via event listeners (no setState in body)
  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };
    const onReInit = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };
    api.on('select', onSelect);
    api.on('reInit', onReInit);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onReInit);
    };
  }, [api]);

  // Autoplay every 5s (pauses on hover via pauseRef)
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      if (pauseRef.current) return;
      api.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [api]);

  const refreshTestimonials = useCallback(() => {
    fetch('/api/testimonials')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: DbTestimonial[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials([...data.map(normalizeDbItem), ...staticTestimonials]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 sm:py-24 bg-[#0a0a0a] relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-l from-transparent via-[#D4AF37] to-transparent rounded-full" />

      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#fafafa] mb-4">
            نظرات <span className="text-gold-gradient">مسافران</span>
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            ببینید مسافران ما درباره سفر با سیوان چه می‌گویند
          </p>
          <Button
            onClick={() => {
              if (auth.user) {
                setReviewOpen(true);
              } else {
                toast.info('برای ثبت نظر، ابتدا وارد حساب کاربری خود شوید');
                openAuth('login');
              }
            }}
            className="mt-5 bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] font-medium rounded-lg px-5 h-10 text-sm inline-flex items-center gap-2"
          >
            <PenLine className="h-4 w-4" />
            {auth.user ? 'ثبت نظر شما' : 'برای ثبت نظر وارد شوید'}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div
            className="relative px-2 sm:px-8"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              setApi={handleSetApi}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {testimonials.map((testimonial) => (
                  <CarouselItem
                    key={testimonial.id}
                    className="pl-4 sm:basis-1/2 lg:basis-1/3"
                  >
                    <Card className="bg-[#1a1a1a] border-[#333] hover:border-[#D4AF37]/20 card-gold-glow h-full">
                      <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                        {/* Quote icon */}
                        <Quote className="h-8 w-8 text-[#D4AF37]/20 mb-3 self-start" />

                        {/* Comment */}
                        <p className="text-[#a1a1aa] text-sm leading-relaxed flex-1 mb-4">
                          &ldquo;{testimonial.comment}&rdquo;
                        </p>

                        {/* Rating */}
                        <RatingStars rating={testimonial.rating} />

                        {/* Author */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#333]">
                          <div>
                            <div className="font-bold text-[#fafafa] text-sm">
                              {testimonial.name}
                            </div>
                            <div className="text-[#a1a1aa] text-xs">
                              {testimonial.role}
                            </div>
                          </div>
                          <span className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded-full">
                            {testimonial.trip}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious
                variant="ghost"
                className="text-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:opacity-30"
              />
              <CarouselNext
                variant="ghost"
                className="text-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:opacity-30"
              />
            </Carousel>

            {/* Dots indicator */}
            {count > 0 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {Array.from({ length: count }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`رفتن به اسلاید ${i + 1}`}
                    onClick={() => api?.scrollTo(i)}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      i === current
                        ? 'bg-[#D4AF37] w-6'
                        : 'bg-[#333] w-2 hover:bg-[#D4AF37]/50'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
        >
          {[
            { value: '+۱۵,۰۰۰', label: 'مسافر راضی' },
            { value: '۴.۹', label: 'امتیاز میانگین' },
            { value: '+۵۰', label: 'شهر تحت پوشش' },
            { value: '۹۹٪', label: 'رضایت مشتری' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 sm:p-6 bg-[#1a1a1a] border border-[#333] rounded-xl"
            >
              <div className="text-2xl sm:text-3xl font-bold text-[#D4AF37] mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-[#a1a1aa]">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Review submission modal — only logged-in passengers can submit */}
      <ReviewFormModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        user={auth.user}
        onSubmitted={refreshTestimonials}
      />
    </section>
  );
}

function ReviewFormModal({
  open,
  onOpenChange,
  user,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: { id: string; fullName: string; username: string } | null;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tripRoute, setTripRoute] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setRating(5);
    setComment('');
    setTripRoute('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (comment.trim().length < 10) {
      setError('حداقل ۱۰ کاراکتر بنویسید');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fullName: user.fullName,
          rating,
          comment: comment.trim(),
          tripRoute: tripRoute.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در ثبت نظر');
        setSubmitting(false);
        return;
      }
      toast.success('نظر شما با موفقیت ثبت شد. ممنون از همراهی شما!');
      reset();
      onOpenChange(false);
      onSubmitted();
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right text-[#fafafa]">ثبت نظر شما</DialogTitle>
          <DialogDescription className="text-right text-[#a1a1aa]">
            تجربه سفر خود را با سایر مسافران به اشتراک بگذارید
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-[#fafafa] text-sm">امتیاز شما</Label>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className="p-1 hover:scale-110 transition-transform"
                  aria-label={`امتیاز ${i + 1} ستاره`}
                >
                  <Star
                    className={cn(
                      'h-7 w-7 transition-colors',
                      i < rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#333]'
                    )}
                  />
                </button>
              ))}
              <span className="text-[#D4AF37] text-sm font-bold mr-2">
                {rating} از ۵
              </span>
            </div>
          </div>

          {/* Trip route (optional) */}
          <div className="space-y-2">
            <Label className="text-[#fafafa] text-sm">
              مسیر سفر <span className="text-[#888] text-xs">(اختیاری)</span>
            </Label>
            <Input
              placeholder="مثال: تهران → اصفهان"
              value={tripRoute}
              onChange={(e) => setTripRoute(e.target.value)}
              className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] h-11"
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label className="text-[#fafafa] text-sm">متن نظر</Label>
            <Textarea
              placeholder="تجربه سفر خود را بنویسید (حداقل ۱۰ کاراکتر)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-[#0a0a0a] border-[#333] text-[#fafafa] placeholder:text-[#888] min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-left text-[10px] text-[#666]">{comment.length} / ۵۰۰</div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[#a1a1aa] pt-1">
            <span>ثبت شده به نام: {user?.fullName}</span>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || comment.trim().length < 10}
            className="w-full bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#E5C76B] h-11 font-medium"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'ثبت نظر'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
