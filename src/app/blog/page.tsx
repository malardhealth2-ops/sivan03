import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { db } from '@/lib/db';
import { formatJalaaliDate, toPersianDigits } from '@/lib/jalaali';
import { Navbar } from '@/components/sivan/Navbar';
import { Footer } from '@/components/sivan/Footer';

export const metadata: Metadata = {
  title: 'بلاگ سیوان | مقالات سفر و گردشگری',
  description:
    'جدیدترین مقالات سفر بین شهری، گردشگری ایران، معرفی خودروهای لوکس و راهنماهای کاربردی برای مسافران تاکسی ویژه سیوان.',
  keywords: [
    'بلاگ سیوان',
    'مقالات سفر',
    'گردشگری ایران',
    'تاکسی VIP',
    'سفر لوکس',
    'راهنمای سفر بین شهری',
  ],
  openGraph: {
    title: 'بلاگ سیوان | مقالات سفر و گردشگری',
    description:
      'جدیدترین مقالات سفر بین شهری، گردشگری ایران، معرفی خودروهای لوکس و راهنماهای کاربردی برای مسافران تاکسی ویژه سیوان.',
    type: 'website',
    url: '/blog',
  },
  alternates: { canonical: '/blog' },
  robots: { index: true, follow: true },
};

type BlogListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
  tags: string;
  publishedAt: Date | null;
  viewCount: number;
  category: { name: string } | null;
  author: { fullName: string } | null;
};

function estimateReadTime(content: string): string {
  const plainText = content.replace(/<[^>]*>/g, '');
  // Persian words average ~2 chars per word for our counting heuristic.
  const wordCount = plainText.length / 2;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${toPersianDigits(minutes)} دقیقه`;
}

function safeExcerpt(post: BlogListItem): string {
  if (post.excerpt && post.excerpt.trim()) return post.excerpt;
  const plain = post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.slice(0, 155) + (plain.length > 155 ? '…' : '');
}

export default async function BlogPage() {
  let posts: BlogListItem[] = [];
  try {
    posts = await db.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 24,
      include: {
        category: { select: { name: true } },
        author: { select: { fullName: true } },
      },
    });
  } catch {
    posts = [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28">
        {/* Hero */}
        <header className="relative overflow-hidden border-b border-[#222]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 relative">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-[#D4AF37] transition-colors mb-6"
            >
              <Home className="h-4 w-4" />
              بازگشت به خانه
            </Link>

            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block px-4 py-1 rounded-full text-xs bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 mb-4">
                مجله سفر سیوان
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#fafafa] mb-4">
                <span className="text-gold-gradient">بلاگ</span> سیوان
              </h1>
              <p className="text-[#a1a1aa] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                جدیدترین مقالات سفر بین شهری، راهنمای گردشگری ایران، معرفی خودروهای لوکس و
                نکات کاربردی برای مسافران تاکسی ویژه سیوان.
              </p>
            </div>
          </div>
        </header>

        {/* Posts grid */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {posts.length === 0 ? (
            <div className="text-center py-20 text-[#a1a1aa]">
              <p className="text-lg">هنوز مقاله‌ای منتشر نشده است.</p>
              <p className="text-sm mt-2">به‌زودی مقالات جدید اضافه خواهد شد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((post) => {
                const category = post.category?.name;
                const image = post.featuredImageUrl || '/images/vip-car.png';
                return (
                  <article
                    key={post.id}
                    className="group bg-[#1a1a1a] border border-[#333] hover:border-[#D4AF37]/30 rounded-xl overflow-hidden flex flex-col transition-colors"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      prefetch={false}
                      className="flex flex-col h-full"
                      aria-label={post.title}
                    >
                      {/* Cover image */}
                      <div className="relative h-48 overflow-hidden bg-[#222]">
                        { }
                        <img
                          src={image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                        {category && (
                          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs bg-[#D4AF37] text-[#0a0a0a] font-medium">
                            {category}
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-5 sm:p-6 flex flex-col flex-1">
                        <h2 className="text-base sm:text-lg font-bold text-[#fafafa] mb-3 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                          {post.title}
                        </h2>
                        <p className="text-[#a1a1aa] text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                          {safeExcerpt(post)}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-[#333] text-xs text-[#a1a1aa]">
                          <div className="flex items-center gap-3">
                            {post.publishedAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <time dateTime={post.publishedAt.toISOString()}>
                                  {formatJalaaliDate(post.publishedAt)}
                                </time>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {estimateReadTime(post.content)}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-[#D4AF37]">
                            ادامه مطلب
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}

          {/* Back to home CTA */}
          <div className="text-center mt-12 sm:mt-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#333] hover:border-[#D4AF37]/40 text-[#a1a1aa] hover:text-[#D4AF37] transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
