'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowLeft, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatJalaaliDate, toPersianDigits } from '@/lib/jalaali';
import { BlogPostModal } from './BlogPostModal';

interface FallbackPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
  image: string;
  isStatic: true;
}

interface ApiPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string | null;
  publishedAt: string;
  status: string;
  tags: string;
  viewCount: number;
  category?: { name: string } | null;
  author?: { fullName: string } | null;
}

type DisplayPost = (ApiPost & { isStatic?: false }) | (FallbackPost & { slug?: undefined });

const staticBlogPosts: FallbackPost[] = [
  {
    id: 1,
    title: 'تاکسی VIP چیست و چه تفاوتی با تاکسی معمولی دارد؟',
    excerpt: 'در این مقاله به بررسی تفاوت‌های تاکسی VIP با تاکسی معمولی می‌پردازیم و مزایای استفاده از خدمات تاکسی VIP را بررسی می‌کنیم...',
    date: '۲۵ آذر ۱۴۰۳',
    author: 'تیم سیوان',
    category: 'راهنما',
    readTime: '۵ دقیقه',
    image: '/images/vip-car.png',
    isStatic: true,
  },
  {
    id: 2,
    title: 'چرا تاکسی ویژه سیوان بهترین انتخاب برای سفر است',
    excerpt: 'سیوان با ناوگان لوکس، رانندگان حرفه‌ای و قیمت شفاف، بهترین گزینه برای سفرهای بین شهری شماست...',
    date: '۲۰ آذر ۱۴۰۳',
    author: 'تیم سیوان',
    category: 'اخبار',
    readTime: '۳ دقیقه',
    image: '/images/luxury-car.png',
    isStatic: true,
  },
  {
    id: 3,
    title: 'نکات مهم برای سفر ایمن بین شهری',
    excerpt: 'برای داشتن سفری ایمن و راحت، باید به چند نکته مهم توجه کنید. در این مقاله این نکات را مرور می‌کنیم...',
    date: '۱۵ آذر ۱۴۰۳',
    author: 'تیم سیوان',
    category: 'ایمنی',
    readTime: '۴ دقیقه',
    image: '/images/economy-car.png',
    isStatic: true,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function estimateReadTime(content: string): string {
  const plainText = content.replace(/<[^>]*>/g, '');
  const wordsPerMinute = 200;
  const wordCount = plainText.length / 2;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${toPersianDigits(minutes)} دقیقه`;
}

function SkeletonCard() {
  return (
    <Card className="bg-[#1a1a1a] border-[#333] overflow-hidden h-full">
      <div className="h-48 bg-[#222] animate-pulse" />
      <CardContent className="p-5 sm:p-6 flex flex-col gap-3">
        <div className="h-3 w-16 bg-[#222] rounded animate-pulse" />
        <div className="h-5 w-3/4 bg-[#222] rounded animate-pulse" />
        <div className="h-4 w-full bg-[#222] rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-[#222] rounded animate-pulse" />
        <div className="flex justify-between mt-4 pt-4 border-t border-[#333]">
          <div className="h-3 w-24 bg-[#222] rounded animate-pulse" />
          <div className="h-3 w-16 bg-[#222] rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function BlogPreview() {
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<DisplayPost | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blog?status=published&limit=6');
      if (!res.ok) throw new Error('fetch failed');
      const data: ApiPost[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setPosts(data.map((p) => ({ ...p, isStatic: false })));
      } else {
        setPosts(staticBlogPosts);
      }
    } catch {
      setPosts(staticBlogPosts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostClick = (post: DisplayPost) => {
    setSelectedPost(post);
    setModalOpen(true);
  };

  const getPostDisplayDate = (post: DisplayPost): string => {
    if (post.isStatic) return post.date;
    return formatJalaaliDate(post.publishedAt);
  };

  const getPostReadTime = (post: DisplayPost): string => {
    if (post.isStatic) return post.readTime;
    return estimateReadTime(post.content || post.excerpt || '');
  };

  const getPostCategory = (post: DisplayPost): string => {
    if (post.isStatic) return post.category;
    return post.category?.name || '';
  };

  const getPostImage = (post: DisplayPost): string => {
    if (post.isStatic) return post.image;
    return post.featuredImageUrl || '/images/vip-car.png';
  };

  return (
    <section id="blog" className="py-20 sm:py-24 bg-[#111111] relative">
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
            <span className="text-gold-gradient">بلاگ</span> سیوان
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            جدیدترین مقالات و راهنمای سفر بین شهری
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          >
            {posts.map((post) => (
              <motion.div key={post.isStatic ? `static-${post.id}` : post.id} variants={itemVariants}>
                <Card
                  className="bg-[#1a1a1a] border-[#333] hover:border-[#D4AF37]/30 card-gold-glow group overflow-hidden h-full cursor-pointer"
                  onClick={() => handlePostClick(post)}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
                    <img
                      src={getPostImage(post)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                    {getPostCategory(post) && (
                      <Badge className="absolute top-3 right-3 bg-[#D4AF37] text-[#0a0a0a] border-0 text-xs">
                        {getPostCategory(post)}
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-5 sm:p-6 flex flex-col flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-[#fafafa] mb-3 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-[#a1a1aa] text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-[#333]">
                      <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getPostDisplayDate(post)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getPostReadTime(post)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#D4AF37] hover:bg-[#D4AF37]/10 p-0 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostClick(post);
                        }}
                      >
                        ادامه مطلب
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Blog Post Modal */}
      <BlogPostModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPost(null);
        }}
        slug={!selectedPost?.isStatic ? (selectedPost as ApiPost)?.slug ?? null : null}
        fallbackPost={
          selectedPost?.isStatic
            ? {
                title: selectedPost.title,
                excerpt: selectedPost.excerpt,
                image: selectedPost.image,
                date: selectedPost.date,
                category: selectedPost.category,
                author: selectedPost.author,
              }
            : null
        }
      />
    </section>
  );
}
