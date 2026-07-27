/**
 * Sivan AI Blog Generator (v2)
 * =============================
 *
 * Automatically generates and publishes a new SEO-optimized blog article (with
 * an AI-generated cover image and justified Persian HTML text) every 6 hours
 * using the z-ai-web-dev-sdk (LLM chat completions + image generation).
 *
 * Runs as a Bun mini-service on port 3005. The Next.js app can trigger an
 * on-demand generation via the gateway: POST /generate?XTransformPort=3005
 *
 * Endpoints:
 *   GET  /health    -> { ok, service, port, lastGeneratedAt, totalPosts }
 *   POST /generate  -> triggers generateArticle() immediately (fire-and-forget)
 *   GET  /status    -> { running, lastGeneratedAt, lastError, totalPosts }
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

// Runtime status (visible to admin via /status)
let isGenerating = false;
let lastGeneratedAt: string | null = null;
let lastError: string | null = null;

// Rotating list of blog topics related to VIP taxi travel in Iran.
// Each topic is SEO-oriented (targets a real user search intent) and maps to
// a focus keyword that the LLM is instructed to weave into the article.
const TOPICS: { title: string; keyword: string }[] = [
  { title: 'نکات ایمنی سفر بین شهری با تاکسی VIP', keyword: 'ایمنی سفر بین شهری' },
  { title: 'بهترین مسیرهای سفر از تهران به شمال ایران', keyword: 'مسیر سفر تهران به شمال' },
  { title: 'چگونه خودروی مناسب برای سفر خانوادگی انتخاب کنیم', keyword: 'خودروی مناسب سفر خانوادگی' },
  { title: 'مزایای تاکسی VIP نسبت به رانندگی شخصی در سفرهای طولانی', keyword: 'مزایای تاکسی VIP' },
  { title: 'راهنمای سفر راحت با خانواده و کودکان', keyword: 'سفر با کودکان' },
  { title: 'صرفه‌جویی در زمان و انرژی با تاکسی دربستی', keyword: 'تاکسی دربستی بین شهری' },
  { title: 'تجهیزات و امکانات یک خودروی لوکس حرفه‌ای', keyword: 'امکانات خودرو لوکس' },
  { title: 'مدیریت خستگی در سفرهای طولانی بین شهری', keyword: 'خستگی در سفر بین شهری' },
  { title: 'بهترین زمان و فصل سفر به مشهد', keyword: 'سفر به مشهد' },
  { title: 'سفر ایمن در شب؛ نکاتی که باید بدانید', keyword: 'سفر شب ایمن' },
  { title: 'تاریخچه و تکامل تاکسی‌های VIP در ایران', keyword: 'تاکسی VIP در ایران' },
  { title: 'معیارهای انتخاب راننده حرفه‌ای برای سفر', keyword: 'راننده حرفه‌ای سفر' },
  { title: 'تأثیر راحتی خودرو بر کیفیت سفر', keyword: 'راحتی خودرو در سفر' },
  { title: 'راهنمای بسته‌بندی چمدان برای سفر بین شهری', keyword: 'بسته‌بندی چمدان سفر' },
  { title: 'چرا تاکسی ویژه سیوان انتخاب هوشمندانه‌ای است', keyword: 'تاکسی ویژه سیوان' },
  { title: 'هزینه سفر با تاکسی VIP چگونه محاسبه می‌شود', keyword: 'هزینه تاکسی VIP' },
  { title: 'تفاوت تاکسی اقتصادی و لوکس در سفر بین شهری', keyword: 'تاکسی اقتصادی یا لوکس' },
  { title: 'راهنمای سفر تهران به اصفهان با خودروی VIP', keyword: 'سفر تهران به اصفهان' },
  { title: 'سفر تهران به شیراز؛ راهنمای کامل مسیر', keyword: 'سفر تهران به شیراز' },
  { title: 'نکات بهداشتی در سفرهای بین شهری', keyword: 'بهداشت در سفر' },
  { title: 'اپلیکیشن رزرو تاکسی VIP چگونه کار می‌کند', keyword: 'رزرو تاکسی VIP' },
  { title: 'مقایسه هزینه سفر با خودرو شخصی و تاکسی دربستی', keyword: 'هزینه سفر شخصی یا دربستی' },
  { title: 'راهنمای انتخاب بهترین سرویس سفر بین شهری', keyword: 'بهترین سرویس سفر بین شهری' },
  { title: 'نکات رانندگی در جاده‌های کوهستانی ایران', keyword: 'رانندگی در جاده کوهستانی' },
];
let topicIndex = 0;

function pickTopic(): { title: string; keyword: string } {
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
  metaDescription: string;
} | null {
  if (!raw) return null;
  const lines = raw.split('\n');

  let title = '';
  let excerpt = '';
  let metaDescription = '';
  let tags: string[] = [];
  const htmlLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('عنوان:')) {
      title = trimmed.slice(6).trim().replace(/^["'«]|["'»]$/g, '');
    } else if (trimmed.startsWith('خلاصه:')) {
      excerpt = trimmed.slice(6).trim().replace(/^["'«]|["'»]$/g, '');
    } else if (trimmed.startsWith('متا:')) {
      metaDescription = trimmed.slice(4).trim().replace(/^["'«]|["'»]$/g, '');
    } else if (trimmed.startsWith('برچسب‌ها:')) {
      const rest = trimmed.replace(/^برچسب‌ها:\s*/, '');
      tags = rest
        .split(',')
        .map((t) => t.trim().replace(/^["'«]|["'»]$/g, ''))
        .filter(Boolean)
        .slice(0, 6);
    } else {
      htmlLines.push(trimmed);
    }
  }

  // Reconstruct content HTML.
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
    const h = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    title = h ? h[1].replace(/<[^>]+>/g, '').trim() : html.slice(0, 60).replace(/<[^>]+>/g, '');
  }
  if (!excerpt) {
    const firstP = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    excerpt = firstP ? firstP[1].replace(/<[^>]+>/g, '').trim().slice(0, 180) : title;
  }
  if (!metaDescription) {
    metaDescription = excerpt.slice(0, 155);
  }
  if (tags.length === 0) {
    tags = ['سفر', 'تاکسی VIP', 'سیوان'];
  }

  return { title, excerpt, html, tags, metaDescription };
}

async function generateCoverImage(title: string, slug: string, topic: string): Promise<string | null> {
  if (!zai) return null;
  // NOTE: The image generation API has a content filter that sometimes flags
  // prompts containing non-English text or certain words. So we keep the
  // prompt purely English, generic, and safe — no article title, no Persian.
  // We rotate through a few scene variants for visual variety.
  const scenes = [
    'a sleek black luxury sedan parked on an Iranian highway at golden hour, dramatic orange sky, mountains in background, professional automotive photography, cinematic, moody dark tones, elegant, high quality, no text, no watermark',
    'a black luxury Mercedes sedan driving on a desert highway at sunset, warm golden light, distant mountains, cinematic travel photography, professional, elegant, no text, no watermark',
    'a black luxury BMW car on a mountain road at dawn, soft mist, dramatic sky, professional automotive photography, cinematic, moody, elegant, no text, no watermark',
    'a black luxury sedan on a coastal highway at twilight, ocean in background, cinematic lighting, professional travel photography, elegant, moody, no text, no watermark',
    'a black luxury car on a winding mountain road at golden hour, autumn trees, cinematic photography, professional, elegant, high quality, no text, no watermark',
  ];
  const scene = scenes[Math.floor(Math.random() * scenes.length)];
  try {
    const response = await zai.images.generations.create({
      prompt: scene,
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
    // Fallback to an existing default car image so the post isn't imageless.
    return '/images/luxury-car.png';
  }
}

async function generateArticle(): Promise<{ ok: boolean; title?: string; slug?: string; error?: string }> {
  if (!zai) {
    return { ok: false, error: 'ZAI SDK not initialized' };
  }
  if (isGenerating) {
    return { ok: false, error: 'Generation already in progress' };
  }
  isGenerating = true;
  lastError = null;

  const topic = pickTopic();
  console.log(`[blog-generator] generating article for topic: ${topic.title} (keyword: ${topic.keyword})`);

  const systemPrompt =
    'تو یک نویسنده حرفه‌ای محتوای سفر و متخصص سئو (SEO) هستی که برای وب‌سایت «تاکسی ویژه سیوان» (یک سرویس تاکسی VIP بین شهری در ایران با ناوگان خودروهای لوکس) مطلب می‌نویسی. لحن تو حرفه‌ای، صمیمی و قابل اعتماد است. مقاله‌هایی که می‌نویسی باکیفیت، مفید، خوانا و سئو-بهینه هستند و به مسافران در سفرهای بین شهری کمک می‌کنند. تو قوانین سئو (کلمه کلیدی، ساختار هدینگ، متا دیسکریپشن) را به‌خوبی می‌دانی.';

  const userPrompt = `یک مقاله کامل، باکیفیت و سئو-بهینه درباره موضوع زیر بنویس:

موضوع: ${topic.title}
کلمه کلیدی هدف (SEO): ${topic.keyword}

الزامات سئو:
- کلمه کلیدی هدف باید به‌طور طبیعی در عنوان، پاراگراف اول، چند جای بدنه و برچسب‌ها تکرار شود (بدون کیورد استافینگ).
- متا دیسکریپشن: ۱۵۰ تا ۱۶۰ کاراکتر، جذاب و شامل کلمه کلیدی.
- ساختار هدینگ‌ها: یک <h2> اصلی برای عنوان بخش اول، سپس <h2> برای سایر بخش‌ها و <h3> برای زیربخش‌ها.

الزامات محتوایی:
- محتوا باید فارسی روان و خوانا باشد.
- بدنه مقاله باید ۷۰۰ تا ۱۰۰۰ کلمه باشد و شامل ۳ تا ۴ بخش با تگ <h2> و پاراگراف‌های کامل با تگ <p> باشد. هر پاراگراف حداقل ۳ جمله باشد.
- متن پاراگراف‌ها کامل و منسجم باشد تا وقتی justify می‌شود زیبا به نظر برسد (پاراگراف‌های طولانی و متعادل).
- از <h3> برای زیربخش‌ها استفاده کن.
- حداقل در یک جای مقاله یک فهرست با <ul> و <li> بیاور (مثلاً نکات کلیدی).
- حداقل یک بلوک نقل‌قول با <blockquote> برای تاکید بر یک نکته مهم استفاده کن.
- در پایان یک بخش «نتیجه‌گیری» کوتاه با <h2> اضافه کن.
- ۴ تا ۵ برچسب مرتبط معرفی کن (شامل کلمه کلیدی هدف).

قالب خروجی (دقیقاً همین ترتیب، بدون علامت‌گذاری اضافه مثل markdown یا \`\`\`):
عنوان: <عنوان جذاب مقاله — حاوی کلمه کلیدی>
خلاصه: <خلاصه ۱-۲ جمله‌ای مقاله>
متا: <متا دیسکریپشن ۱۵۰-۱۶۰ کاراکتر با کلمه کلیدی>
<بدنه HTML مقاله اینجا — فقط تگ‌های h2, h3, p, ul, li, blockquote, strong>
برچسب‌ها: <tag1>, <tag2>, <tag3>, <tag4>

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
      lastError = 'LLM generation failed';
      isGenerating = false;
      return { ok: false, error: 'LLM generation failed' };
    }
  }

  const parsed = parseArticle(raw);
  if (!parsed || !parsed.title) {
    console.error('[blog-generator] failed to parse article from:\n', raw.slice(0, 500));
    lastError = 'Could not parse article';
    isGenerating = false;
    return { ok: false, error: 'Could not parse article' };
  }

  const slug = makeSlug(parsed.title);
  const featuredImageUrl = await generateCoverImage(parsed.title, slug, topic.title);

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
    lastGeneratedAt = new Date().toISOString();
    console.log(`[blog-generator] ✓ published: "${post.title}" (slug: ${post.slug}, image: ${featuredImageUrl || 'none'})`);
    isGenerating = false;
    return { ok: true, title: post.title, slug: post.slug };
  } catch (err) {
    console.error('[blog-generator] DB save failed:', err);
    lastError = 'DB save failed';
    isGenerating = false;
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

async function getTotalPosts(): Promise<number> {
  try {
    return await db.blogPost.count({ where: { status: 'published' } });
  } catch {
    return 0;
  }
}

// ---- HTTP server (Bun.serve) ----
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS preflight for cross-origin admin requests through the gateway
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/status')) {
      const totalPosts = await getTotalPosts();
      return Response.json(
        {
          ok: true,
          service: 'blog-generator',
          port: PORT,
          running: isGenerating,
          lastGeneratedAt,
          lastError,
          totalPosts,
          nextScheduledInMs: GENERATION_INTERVAL_MS,
        },
        { headers: corsHeaders }
      );
    }
    if (req.method === 'POST' && url.pathname === '/generate') {
      // Fire-and-forget; return immediately so the caller isn't blocked by the
      // (slow) LLM + image generation. Admin UI can poll /status afterwards.
      if (isGenerating) {
        return Response.json({ started: false, message: 'Generation already in progress' }, { headers: corsHeaders });
      }
      generateArticle().catch((e) => console.error('[blog-generator] on-demand error:', e));
      return Response.json({ started: true }, { headers: corsHeaders });
    }
    return new Response('Not Found', { status: 404, headers: corsHeaders });
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
