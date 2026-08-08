import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import {
  Calendar,
  Clock,
  Eye,
  Phone,
  ArrowRight,
  ArrowLeft,
  Home,
  ChevronLeft,
} from 'lucide-react';
import { db } from '@/lib/db';
import { formatJalaaliDate, toPersianDigits } from '@/lib/jalaali';
import { Navbar } from '@/components/sivan/Navbar';
import { Footer } from '@/components/sivan/Footer';
import { getSiteUrl, absoluteUrl } from '@/lib/site-url';

type PostWithRelations = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
  tags: string;
  status: string;
  publishedAt: Date | null;
  updatedAt: Date;
  viewCount: number;
  createdAt: Date;
  category: { name: string; slug: string } | null;
  author: { fullName: string } | null;
};

type RelatedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  publishedAt: Date | null;
};

const BOT_PATTERN = /(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|facebookexternalhit|twitterbot|linkedinbot|semrushbot|ahrefsbot|mj12bot|rogerbot|dotbot|petalbot|bytespider|applebot|crawler|spider|bot)/i;

function estimateReadTime(content: string): string {
  const plainText = content.replace(/<[^>]*>/g, '');
  const wordCount = plainText.length / 2;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${toPersianDigits(minutes)} دقیقه`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeExcerpt(post: PostWithRelations): string {
  if (post.excerpt && post.excerpt.trim()) return post.excerpt;
  const plain = stripHtml(post.content);
  return plain.slice(0, 155) + (plain.length > 155 ? '…' : '');
}

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
    }
  } catch {
    /* ignore */
  }
  return [];
}

async function getPost(slug: string): Promise<PostWithRelations | null> {
  // Next.js sometimes passes the dynamic route param still percent-encoded
  // (especially for non-ASCII slugs in dev / Turbopack). Normalise it.
  let normalizedSlug = slug;
  try {
    if (slug.includes('%')) normalizedSlug = decodeURIComponent(slug);
  } catch {
    /* leave as-is */
  }
  try {
    const post = await db.blogPost.findUnique({
      where: { slug: normalizedSlug },
      include: {
        category: { select: { name: true, slug: true } },
        author: { select: { fullName: true } },
      },
    });
    if (!post) return null;
    if (post.status !== 'published') return null;
    return post as PostWithRelations;
  } catch {
    return null;
  }
}

async function getRelatedPosts(currentId: string): Promise<RelatedPost[]> {
  try {
    const posts = await db.blogPost.findMany({
      where: {
        status: 'published',
        id: { not: currentId },
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImageUrl: true,
        publishedAt: true,
      },
    });
    return posts as RelatedPost[];
  } catch {
    return [];
  }
}

/**
 * Pre-render every published post at build time. In dev mode pages are SSR'd
 * on demand, but having generateStaticParams also means Next.js knows the
 * valid slug universe for type-safe routing.
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const posts = await db.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true },
    });
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return {
      title: 'مقاله یافت نشد | بلاگ سیوان',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = await getSiteUrl();
  const description = safeExcerpt(post);
  const tags = parseTags(post.tags);
  const keywords = Array.from(
    new Set([...tags, 'تاکسی VIP', 'سیوان', 'سفر', 'سفر لوکس', 'تاکسی بین شهری']),
  );
  const cover = post.featuredImageUrl
    ? await absoluteUrl(post.featuredImageUrl)
    : `${siteUrl}/images/vip-car.png`;
  const canonical = `/blog/${post.slug}`;
  const publishedTime = post.publishedAt ? post.publishedAt.toISOString() : undefined;

  return {
    title: post.title,
    description,
    keywords,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: `${siteUrl}/blog/${post.slug}`,
      images: [{ url: cover, width: 1200, height: 630, alt: post.title }],
      publishedTime,
      authors: post.author?.fullName ? [post.author.fullName] : ['تاکسی ویژه سیوان'],
      siteName: 'تاکسی ویژه سیوان',
      locale: 'fa_IR',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [cover],
    },
    authors: post.author?.fullName
      ? [{ name: post.author.fullName }]
      : [{ name: 'تاکسی ویژه سیوان' }],
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // After the notFound() narrowing above TS still thinks post can be null in
  // some flow-analysis paths; bind a non-null reference for the rest of the
  // component so JSX is happy.
  const p = post;

  // Determine if this request is from a crawler so we don't inflate view
  // counts when Googlebot/Bingbot fetch the page for indexing.
  const headerList = await headers();
  const userAgent = headerList.get('user-agent') || '';
  const isBot = BOT_PATTERN.test(userAgent);

  if (!isBot) {
    try {
      await db.blogPost.update({
        where: { id: p.id },
        data: { viewCount: { increment: 1 } },
      });
    } catch {
      /* view-count increment is best-effort */
    }
  }

  const siteUrl = await getSiteUrl();
  const tags = parseTags(p.tags);
  const excerpt = safeExcerpt(p);
  const coverUrl = p.featuredImageUrl
    ? await absoluteUrl(p.featuredImageUrl)
    : `${siteUrl}/images/vip-car.png`;
  const coverSrc = p.featuredImageUrl || '/images/vip-car.png';
  const canonicalUrl = `${siteUrl}/blog/${p.slug}`;
  const publishedISO = p.publishedAt ? p.publishedAt.toISOString() : null;
  const updatedISO = p.updatedAt.toISOString();
  const logoUrl = `${siteUrl}/logo.png`;

  const related = await getRelatedPosts(p.id);

  // JSON-LD Article schema for Google rich results.
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: excerpt,
    image: [coverUrl],
    datePublished: publishedISO || updatedISO,
    dateModified: updatedISO,
    author: {
      '@type': 'Organization',
      name: 'تاکسی ویژه سیوان',
    },
    publisher: {
      '@type': 'Organization',
      name: 'تاکسی ویژه سیوان',
      logo: { '@type': 'ImageObject', url: logoUrl },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    keywords: tags.join(', '),
    articleSection: p.category?.name || 'سفر و گردشگری',
  };

  // JSON-LD BreadcrumbList schema.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'خانه',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'بلاگ',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: p.title,
        item: canonicalUrl,
      },
    ],
  };

  const jsonLd = [articleLd, breadcrumbLd];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Navbar />

      <main className="flex-1 pt-20 sm:pt-24">
        {/* Breadcrumb */}
        <nav
          aria-label="مسیر"
          className="container mx-auto px-4 sm:px-6 py-4 border-b border-[#222]"
        >
          <ol className="flex items-center flex-wrap gap-1 text-xs text-[#a1a1aa]">
            <li>
              <Link href="/" className="hover:text-[#D4AF37] inline-flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                خانه
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronLeft className="h-3.5 w-3.5 text-[#444]" />
            </li>
            <li>
              <Link href="/blog" className="hover:text-[#D4AF37]">
                بلاگ
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronLeft className="h-3.5 w-3.5 text-[#444]" />
            </li>
            <li className="text-[#fafafa] truncate max-w-[60vw] sm:max-w-xs" aria-current="page">
              {p.title}
            </li>
          </ol>
        </nav>

        <article className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Back to blog */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-[#D4AF37] transition-colors mb-6"
          >
            <ArrowRight className="h-4 w-4" />
            همه مقالات
          </Link>

          {/* Header */}
          <header className="max-w-3xl mx-auto mb-8 text-center">
            {p.category?.name && (
              <Link
                href="/blog"
                className="inline-block px-3 py-1 rounded-full text-xs bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 mb-4"
              >
                {p.category.name}
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#fafafa] leading-tight mb-4">
              {p.title}
            </h1>
            <p className="text-[#a1a1aa] text-sm sm:text-base leading-relaxed">{excerpt}</p>

            {/* Meta row */}
            <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2 mt-6 text-xs text-[#a1a1aa]">
              {p.author?.fullName && (
                <span className="flex items-center gap-1.5">
                  <span className="w-7 h-7 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center text-[10px] font-bold">
                    {p.author.fullName.slice(0, 1)}
                  </span>
                  {p.author.fullName}
                </span>
              )}
              {publishedISO && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <time dateTime={publishedISO}>{formatJalaaliDate(p.publishedAt!)}</time>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
                {estimateReadTime(p.content)}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-[#D4AF37]" />
                {toPersianDigits(p.viewCount)} بازدید
              </span>
            </div>
          </header>

          {/* Cover image */}
          {p.featuredImageUrl && (
            <div className="max-w-4xl mx-auto mb-8 rounded-xl overflow-hidden border border-[#333]">
              { }
              <img
                src={coverSrc}
                alt={p.title}
                className="w-full h-auto object-cover max-h-[460px]"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="max-w-3xl mx-auto text-[#d4d4d8] text-justify leading-8 text-sm sm:text-base
                       [&_p]:text-justify [&_p]:my-3 [&_p]:leading-8
                       [&_h2]:text-[#fafafa] [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3
                       [&_h3]:text-[#D4AF37] [&_h3]:text-lg [&_h3]:sm:text-xl [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2
                       [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pr-6 [&_ul]:space-y-2
                       [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pr-6 [&_ol]:space-y-2
                       [&_li]:leading-7 [&_li]:text-justify
                       [&_blockquote]:border-r-4 [&_blockquote]:border-[#D4AF37]/60 [&_blockquote]:bg-[#1a1a1a] [&_blockquote]:py-3 [&_blockquote]:pr-4 [&_blockquote]:pl-3 [&_blockquote]:my-5 [&_blockquote]:rounded-l-md [&_blockquote]:text-[#e4e4e7]
                       [&_a]:text-[#D4AF37] [&_a]:underline [&_a]:hover:text-[#E5C76B]
                       [&_img]:rounded-lg [&_img]:my-4
                       [&_strong]:text-[#fafafa] [&_strong]:font-bold"
            dangerouslySetInnerHTML={{ __html: p.content }}
          />

          {/* Tags */}
          {tags.length > 0 && (
            <section className="max-w-3xl mx-auto mt-10 pt-8 border-t border-[#333]" aria-label="برچسب‌ها">
              <h2 className="text-sm font-bold text-[#a1a1aa] mb-3">برچسب‌ها</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* CTA box */}
          <section className="max-w-3xl mx-auto mt-10">
            <div className="relative overflow-hidden rounded-xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6 sm:p-8 text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-gradient-to-l from-transparent via-[#D4AF37] to-transparent" />
              <h2 className="text-lg sm:text-xl font-bold text-[#fafafa] mb-2">
                برای رزرو سفر لوکس با سیوان تماس بگیرید
              </h2>
              <p className="text-[#a1a1aa] text-sm mb-5 max-w-xl mx-auto">
                ناوگان لوکس، رانندگان حرفه‌ای و قیمت شفاف — همین حالا سفر خود را رزرو کنید.
              </p>
              <div className="flex items-center justify-center flex-wrap gap-3">
                <a
                  href="tel:09109419743"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4AF37] text-[#0a0a0a] font-bold hover:bg-[#E5C76B] transition-colors"
                  dir="ltr"
                >
                  <Phone className="h-4 w-4" />
                  0910-941-9743
                </a>
                <a
                  href="tel:09368816807"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                  dir="ltr"
                >
                  <Phone className="h-4 w-4" />
                  0936-881-6807
                </a>
              </div>
            </div>
          </section>

          {/* Related posts */}
          {related.length > 0 && (
            <section className="max-w-5xl mx-auto mt-16" aria-label="مقالات مرتبط">
              <h2 className="text-xl sm:text-2xl font-bold text-[#fafafa] mb-6 flex items-center gap-2">
                <span className="text-gold-gradient">مقالات مرتبط</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((rp) => {
                  const img = rp.featuredImageUrl || '/images/vip-car.png';
                  return (
                    <article
                      key={rp.id}
                      className="group bg-[#1a1a1a] border border-[#333] hover:border-[#D4AF37]/30 rounded-xl overflow-hidden flex flex-col transition-colors"
                    >
                      <Link
                        href={`/blog/${rp.slug}`}
                        prefetch={false}
                        className="flex flex-col h-full"
                        aria-label={rp.title}
                      >
                        <div className="relative h-36 overflow-hidden bg-[#222]">
                          { }
                          <img
                            src={img}
                            alt={rp.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                        </div>
                        <div className="p-4 sm:p-5 flex flex-col flex-1">
                          <h3 className="text-sm sm:text-base font-bold text-[#fafafa] mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                            {rp.title}
                          </h3>
                          {rp.excerpt && rp.excerpt.trim() && (
                            <p className="text-[#a1a1aa] text-xs leading-relaxed line-clamp-2 flex-1">
                              {rp.excerpt}
                            </p>
                          )}
                          {rp.publishedAt && (
                            <div className="flex items-center gap-1 text-xs text-[#a1a1aa] mt-3 pt-3 border-t border-[#333]">
                              <Calendar className="h-3 w-3" />
                              <time dateTime={rp.publishedAt.toISOString()}>
                                {formatJalaaliDate(rp.publishedAt)}
                              </time>
                            </div>
                          )}
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>

              <div className="text-center mt-8">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#E5C76B] transition-colors"
                >
                  مشاهده همه مقالات
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </section>
          )}
        </article>

        {/* JSON-LD structured data */}
        {jsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </main>

      <Footer />
    </div>
  );
}
