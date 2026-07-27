/**
 * Sivan AI Blog Generator
 * ========================
 *
 * Automatically generates and publishes a new blog article (with an AI-generated
 * cover image and justified Persian HTML text) every 6 hours using the
 * z-ai-web-dev-sdk (LLM chat completions + image generation).
 *
 * Runs as a Bun mini-service on port 3005. The Next.js app can trigger an
 * on-demand generation via the gateway: POST /generate?XTransformPort=3005
 *
 * Endpoints:
 *   GET  /health    -> { ok, service, port }
 *   POST /generate  -> triggers generateArticle() immediately (fire-and-forget)
 */

import { PrismaClient } from '@prisma/client';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const PORT = 3005;
const DB_URL = 'file:/home/z/my-project/db/custom.db';
const BLOG_IMG_DIR = '/home/z/my-project/public/images/blog';
const GENERATION_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MIN_POSTS_FOR_IMMEDIATE_SKIP = 3;

const db = new PrismaClient({ datasources: { db: { url: DB_URL } } });
let zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

// Rotating list of blog topics related to VIP taxi travel in Iran.
const TOPICS = [
  'نکات ایمنی سفر بین شهری با خودروی شخصی versus تاکسی VIP',
  'بهترین مسیرهای سفر از تهران به شمال ایران',
  'چگونه خودروی مناسب برای سفر خانوادگی انتخاب کنیم',
  'مزایای تاکسی VIP نسبت به رانندگی شخصی در سفرهای طولانی',
  'راهنمای سفر راحت با خانواده و کودکان',
  'صرفه‌جویی در زمان و انرژی با تاکسی دربستی',
  'تجهیزات و امکانات یک خودروی لوکس حرفه‌ای',
  'مدیریت خستگی در سفرهای طولانی بین شهری',
  'بهترین زمان و فصل سفر به مشهد',
  'سفر ایمن در شب؛ نکاتی که باید بدانید',
  'تاریخچه و تکامل تاکسی‌های VIP در ایران',
  'معیارهای انتخاب راننده حرفه‌ای برای سفر',
  'تأثیر راحتی خودرو بر کیفیت سفر',
  'راهنمای بسته‌بندی چمدان برای سفر بین شهری',
  'چرا تاکسی ویژه سیوان انتخاب هوشمندانه‌ای است',
];
let topicIndex = 0;

function pickTopic(): string {
  const t = TOPICS[topicIndex % TOPICS.length];
  topicIndex++;
  return t;
}

function makeSlug(title: string): string {
  // Persian-safe slug: keep Persian letters/digits, replace spaces with dashes,
  // strip punctuation, append a short unique suffix.
  const base = title
    .replace(/[«»"'!?.,:;()\[\]{}]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 60);
  const suffix = Date.now().toString(36).slice(-6);
  return `${base}-${suffix}`;
}

function parseArticle(raw: string): {
  title: string;
  excerpt: string;
  html: string;
  tags: string[];
} | null {
  if (!raw) return null;
  const lines = raw.split('\n');

  let title = '';
  let excerpt = '';
  let tags: string[] = [];
  const htmlLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('عنوان:')) {
      title = trimmed.slice(6).trim().replace(/^["'«]|["'»]$/g, '');
    } else if (trimmed.startsWith('خلاصه:')) {
      excerpt = trimmed.slice(6).trim().replace(/^["'«]|["'»]$/g, '');
    } else if (trimmed.startsWith('برچسب‌ها:') || trimmed.startsWith('برچسب‌ها:')) {
      const rest = trimmed.replace(/^برچسب‌ها:\s*/, '');
      tags = rest
        .split(',')
        .map((t) => t.trim().replace(/^["'«]|["'»]$/g, ''))
        .filter(Boolean)
        .slice(0, 5);
    } else {
      htmlLines.push(trimmed);
    }
  }

  // Reconstruct content HTML. The model is asked to output pure HTML, so just
  // join the remaining lines. If the model produced no tags, wrap paragraphs.
  let html = htmlLines.join('\n').trim();
  if (!html) return null;

  // If the model didn't use HTML tags, wrap lines in <p>.
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    html = html
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('\n');
  }

  if (!title) {
    // Fallback title from first heading or first 60 chars
    const h = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    title = h ? h[1].replace(/<[^>]+>/g, '').trim() : html.slice(0, 60).replace(/<[^>]+>/g, '');
  }
  if (!excerpt) {
    const firstP = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    excerpt = firstP ? firstP[1].replace(/<[^>]+>/g, '').trim().slice(0, 180) : title;
  }
  if (tags.length === 0) {
    tags = ['سفر', 'تاکسی VIP', 'سیوان'];
  }

  return { title, excerpt, html, tags };
}

async function generateCoverImage(title: string, slug: string): Promise<string | null> {
  if (!zai) return null;
  try {
    const prompt =
      'cinematic luxury travel photograph, a sleek black luxury sedan on an Iranian highway at golden hour, dramatic sky, professional automotive photography, moody dark tones, high quality, no text';
    const response = await zai.images.generations.create({
      prompt,
      size: '1344x768',
    });
    const base64 = response?.data?.[0]?.base64;
    if (!base64) return null;
    if (!fs.existsSync(BLOG_IMG_DIR)) fs.mkdirSync(BLOG_IMG_DIR, { recursive: true });
    const filename = `${slug}.png`;
    const filepath = path.join(BLOG_IMG_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
    return `/images/blog/${filename}`;
  } catch (err) {
    console.error('[blog-generator] image generation failed:', err);
    return null;
  }
}

async function generateArticle(): Promise<{ ok: boolean; title?: string; slug?: string; error?: string }> {
  if (!zai) {
    return { ok: false, error: 'ZAI SDK not initialized' };
  }
  const topic = pickTopic();
  console.log(`[blog-generator] generating article for topic: ${topic}`);

  const systemPrompt =
    'تو یک نویسنده حرفه‌ای محتوای سفر هستی که برای وب‌سایت «تاکسی ویژه سیوان» (یک سرویس تاکسی VIP بین شهری در ایران) مطلب می‌نویسی. لحن تو حرفه‌ای، صمیمی و قابل اعتماد است. مقاله‌هایی که می‌نویسی باکیفیت، مفید و خوانا هستند و به مسافران در سفرهای بین شهری کمک می‌کنند.';

  const userPrompt = `یک مقاله کامل و باکیفیت درباره موضوع زیر بنویس:

موضوع: ${topic}

الزامات:
- محتوا باید فارسی روان و خوانا باشد.
- ساختار مقاله: یک عنوان جذاب، یک خلاصه ۱-۲ جمله‌ای، و بدنه مقاله به صورت HTML خالص (بدون markdown).
- بدنه مقاله باید ۶۰۰ تا ۹۰۰ کلمه باشد و شامل ۲ تا ۳ بخش با تگ <h2> و پاراگراف‌های کامل با تگ <p> باشد. هر پاراگراف حداقل ۳ جمله باشد.
- متن پاراگراف‌ها کامل و جاستیفای-پسند باشد (پاراگراف‌های منسجم و طولانی).
- در صورت نیاز از <h3> برای زیربخش‌ها و از <ul>/<li> برای فهرست‌ها استفاده کن.
- در پایان مقاله، ۳ برچسب مرتبط معرفی کن.

قالب خروجی (دقیقاً همین ترتیب، بدون علامت‌گذاری اضافه):
عنوان: <عنوان مقاله>
خلاصه: <خلاصه مقاله>
<بدنه HTML مقاله اینجا>
برچسب‌ها: <tag1>, <tag2>, <tag3>

مقاله را بنویس:`;

  let raw = '';
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    });
    raw = completion?.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('[blog-generator] LLM call failed, retrying once:', err);
    try {
      const retry = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
      });
      raw = retry?.choices?.[0]?.message?.content || '';
    } catch (err2) {
      console.error('[blog-generator] LLM retry failed:', err2);
      return { ok: false, error: 'LLM generation failed' };
    }
  }

  const parsed = parseArticle(raw);
  if (!parsed || !parsed.title) {
    console.error('[blog-generator] failed to parse article from:\n', raw.slice(0, 500));
    return { ok: false, error: 'Could not parse article' };
  }

  const slug = makeSlug(parsed.title);
  const featuredImageUrl = await generateCoverImage(parsed.title, slug);

  try {
    const post = await db.blogPost.create({
      data: {
        title: parsed.title,
        slug,
        excerpt: parsed.excerpt,
        content: parsed.html,
        featuredImageUrl,
        status: 'published',
        publishedAt: new Date(),
        tags: JSON.stringify(parsed.tags),
        authorId: null,
        categoryId: null,
      },
    });
    console.log(`[blog-generator] ✓ published: "${post.title}" (slug: ${post.slug}, image: ${featuredImageUrl || 'none'})`);
    return { ok: true, title: post.title, slug: post.slug };
  } catch (err) {
    console.error('[blog-generator] DB save failed:', err);
    return { ok: false, error: 'DB save failed' };
  }
}

async function maybeGenerateOnStartup() {
  try {
    const count = await db.blogPost.count({ where: { status: 'published' } });
    if (count < MIN_POSTS_FOR_IMMEDIATE_SKIP) {
      console.log(`[blog-generator] only ${count} published posts; generating one now...`);
      setTimeout(() => generateArticle().catch((e) => console.error(e)), 5000);
      return;
    }
    // If the most recent post is older than 6h, generate one now.
    const latest = await db.blogPost.findFirst({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      select: { publishedAt: true },
    });
    if (latest?.publishedAt) {
      const ageMs = Date.now() - new Date(latest.publishedAt).getTime();
      if (ageMs > GENERATION_INTERVAL_MS) {
        console.log(`[blog-generator] last post is ${Math.round(ageMs / 3600000)}h old; generating one now...`);
        setTimeout(() => generateArticle().catch((e) => console.error(e)), 5000);
      } else {
        console.log(`[blog-generator] last post is recent; next auto-generation in 6h.`);
      }
    }
  } catch (err) {
    console.error('[blog-generator] startup check failed:', err);
  }
}

// ---- HTTP server (Bun.serve) ----
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/health') {
      return Response.json({ ok: true, service: 'blog-generator', port: PORT });
    }
    if (req.method === 'POST' && url.pathname === '/generate') {
      // Fire-and-forget; return immediately so the caller isn't blocked by the
      // (slow) LLM + image generation.
      generateArticle().catch((e) => console.error('[blog-generator] on-demand error:', e));
      return Response.json({ started: true });
    }
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`[blog-generator] listening on http://localhost:${PORT}`);

// ---- Bootstrap ----
(async () => {
  try {
    zai = await ZAI.create();
    console.log('[blog-generator] ZAI SDK initialized');
  } catch (err) {
    console.error('[blog-generator] ZAI SDK init failed:', err);
  }

  // Schedule recurring generation every 6 hours.
  setInterval(() => {
    generateArticle().catch((e) => console.error('[blog-generator] scheduled error:', e));
  }, GENERATION_INTERVAL_MS);
  console.log(`[blog-generator] scheduled auto-generation every ${GENERATION_INTERVAL_MS / 3600000}h`);

  // Decide whether to generate one shortly after startup.
  maybeGenerateOnStartup();
})();

// Keep the process alive and handle shutdown.
process.on('SIGINT', async () => {
  console.log('[blog-generator] shutting down...');
  await db.$disconnect();
  server.stop();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await db.$disconnect();
  server.stop();
  process.exit(0);
});
