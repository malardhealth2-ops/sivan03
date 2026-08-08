'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock, Loader2 } from 'lucide-react';
import { formatJalaaliDate, toPersianDigits } from '@/lib/jalaali';

interface FallbackPost {
  title: string;
  excerpt?: string;
  content?: string;
  image?: string;
  date?: string;
  category?: string;
  author?: string;
}

interface BlogPostFull {
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

interface BlogPostModalProps {
  open: boolean;
  onClose: () => void;
  slug?: string | null;
  fallbackPost?: FallbackPost | null;
}

function estimateReadTime(content: string): string {
  const plainText = content.replace(/<[^>]*>/g, '');
  const wordsPerMinute = 200;
  const wordCount = plainText.length / 2; // rough estimate for Persian
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${toPersianDigits(minutes)} دقیقه`;
}

export function BlogPostModal({ open, onClose, slug, fallbackPost }: BlogPostModalProps) {
  const [post, setPost] = useState<BlogPostFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error('خطا در دریافت مقاله');
      const data = await res.json();
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (open && slug) {
      setPost(null);
      fetchPost();
    } else if (!open) {
      setPost(null);
      setError(null);
    }
  }, [open, slug, fetchPost]);

  const isFallback = !slug && !!fallbackPost;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-[#D4AF37]/30 p-0"
        showCloseButton={false}
      >
        {/* Custom close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 rounded-full bg-black/60 hover:bg-black/80 text-white/70 hover:text-white p-2 transition-colors"
          aria-label="بستن"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        {loading && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <p className="text-[#ef4444] text-lg mb-2">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 text-[#D4AF37] hover:underline text-sm"
            >
              بستن
            </button>
          </div>
        )}

        {/* Fallback post (static) */}
        {isFallback && !loading && !error && fallbackPost && (
          <div>
            {fallbackPost.image && (
              <div className="relative h-56 sm:h-72 overflow-hidden rounded-t-lg">
                <img
                  src={fallbackPost.image}
                  alt={fallbackPost.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
              </div>
            )}
            <div className="p-6 sm:p-8">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {fallbackPost.category && (
                    <Badge className="bg-[#D4AF37] text-[#0a0a0a] border-0 text-xs">
                      {fallbackPost.category}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#fafafa] leading-relaxed">
                  {fallbackPost.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {fallbackPost.excerpt || fallbackPost.title}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#a1a1aa] mb-6 pb-4 border-b border-[#333]">
                {fallbackPost.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {fallbackPost.author}
                  </span>
                )}
                {fallbackPost.date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {fallbackPost.date}
                  </span>
                )}
              </div>

              <div
                className="prose prose-invert max-w-none text-[#d4d4d8] leading-8 text-justify [&_p]:text-justify [&_p]:my-3 [&_h2]:text-[#fafafa] [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-[#D4AF37] [&_img]:rounded-lg [&_a]:text-[#D4AF37]"
                dangerouslySetInnerHTML={{
                  __html:
                    fallbackPost.content ||
                    `<p>${fallbackPost.excerpt || ''}</p><p>برای مشاهده متن کامل این مقاله، لطفاً بعداً مراجعه فرمایید.</p>`,
                }}
              />
            </div>
          </div>
        )}

        {/* Full post from API */}
        {!isFallback && post && !loading && !error && (
          <div>
            {post.featuredImageUrl && (
              <div className="relative h-56 sm:h-72 overflow-hidden rounded-t-lg">
                <img
                  src={post.featuredImageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
              </div>
            )}
            <div className="p-6 sm:p-8">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {post.category?.name && (
                    <Badge className="bg-[#D4AF37] text-[#0a0a0a] border-0 text-xs">
                      {post.category.name}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#fafafa] leading-relaxed">
                  {post.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {post.excerpt}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#a1a1aa] mb-6 pb-4 border-b border-[#333]">
                {post.author?.fullName && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {post.author.fullName}
                  </span>
                )}
                {post.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatJalaaliDate(post.publishedAt)}
                  </span>
                )}
                {post.content && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {estimateReadTime(post.content)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  {toPersianDigits(post.viewCount)} بازدید
                </span>
              </div>

              <div
                className="prose prose-invert max-w-none text-[#d4d4d8] leading-8 text-justify [&_p]:text-justify [&_p]:my-3 [&_h2]:text-[#fafafa] [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-[#D4AF37] [&_img]:rounded-lg [&_a]:text-[#D4AF37]"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
