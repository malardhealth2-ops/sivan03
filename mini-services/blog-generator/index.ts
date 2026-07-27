/**
 * Sivan AI Blog Generator (v3 — diversified topics)
 * ================================================
 *
 * Automatically generates and publishes a new SEO-optimized blog article (with
 * an AI-generated cover image and justified Persian HTML text) every 6 hours
 * using the z-ai-web-dev-sdk (LLM chat completions + image generation).
 *
 * Topics are diversified across 5 categories so the blog isn't only about
 * travel safety — it also covers Iranian tourism & scenic destinations, luxury
 * cars & their features, luxury-vs-economy car comparisons, city travel guides,
 * and a smaller set of travel-safety pieces.
 *
 * Cover images are category-aware: tourist destinations get landscape/scenery
 * prompts, luxury-car articles get interior/detail shots, etc.
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

// Diversified topic pool. Each topic carries:
//   - title:   the article's working title (LLM may refine it)
//   - keyword: the SEO focus keyword the LLM must weave in
//   - category: drives which cover-image scene pool is used
//
// Categories & weights (so the blog isn't dominated by one theme):
//   tourism          -> Iranian scenic destinations, travel seasons, hidden gems
//   luxury-cars      -> features & benefits of luxury vehicles (interior, ride quality, options)
//   luxury-vs-economy-> direct comparisons: why a luxury car beats an economy car on long trips
//   travel-guide     -> city-to-city route guides (Tehran→Mashhad, etc.)
//   travel-tips      -> packing, comfort, fatigue, booking — practical traveller advice
//   safety           -> a SMALL set of travel-safety pieces (kept, but no longer the majority)
//   sivan-brand      -> why Sivan VIP taxi is the smart choice (conversion-focused)
type TopicCategory =
  | 'tourism'
  | 'luxury-cars'
  | 'luxury-vs-economy'
  | 'travel-guide'
  | 'travel-tips'
  | 'safety'
  | 'sivan-brand';

interface Topic {
  title: string;
  keyword: string;
  category: TopicCategory;
}

const TOPICS: Topic[] = [
  // ---- گردشگری و مناطق زیبای ایران (tourism) ----
  { title: 'جاذبه‌های گردشگری مشهد که هر مسافری باید ببیند', keyword: 'جاذبه‌های گردشگری مشهد', category: 'tourism' },
  { title: 'زیبایی‌های شیراز؛ شهر گل و شب‌نما', keyword: 'جاذبه‌های گردشگری شیراز', category: 'tourism' },
  { title: 'اصفهان شهر نصف جهان؛ راهنمای گردشگری', keyword: 'گردشگری اصفهان', category: 'tourism' },
  { title: 'تابستان در نوشهر و چالوس؛ بهترین مسیر فرار از گرما', keyword: 'گردشگری نوشهر و چالوس', category: 'tourism' },
  { title: 'جزیره کیش؛ بهشت گردشگری در خلیج فارس', keyword: 'گردشگری کیش', category: 'tourism' },
  { title: 'جزیره قشم و عجایب طبیعی آن', keyword: 'گردشگری قشم', category: 'tourism' },
  { title: 'ماسوله؛ روستای پلکانی تاریخ ایران', keyword: 'گردشگری ماسوله', category: 'tourism' },
  { title: 'تبریز در یک روز؛ بازار، مسجد کبود و قهوه‌خانه‌ها', keyword: 'گردشگری تبریز', category: 'tourism' },
  { title: 'دریاچه نمک مهابان و عجایب مسیر تهران-قم', keyword: 'دریاچه نمک قم', category: 'tourism' },
  { title: 'بهترین فصل سفر به شمال ایران برای دیدن طبیعت', keyword: 'بهترین فصل سفر به شمال', category: 'tourism' },
  { title: 'یزد شهر بادگیرها و کویر نقره‌ای', keyword: 'گردشگری یزد', category: 'tourism' },
  { title: 'کرمان و دل کویر؛ راهنمای سفر به گنبد فتح‌آباد', keyword: 'گردشگری کرمان', category: 'tourism' },

  // ---- خودروهای لوکس و مزایا (luxury-cars) ----
  { title: 'امکانات خودرو لوکس که کیفیت سفر را متحول می‌کند', keyword: 'امکانات خودرو لوکس', category: 'luxury-cars' },
  { title: 'چرا صندلی چرمی در سفرهای طولانی مهم است؟', keyword: 'صندلی چرمی خودرو لوکس', category: 'luxury-cars' },
  { title: 'عایق صدا در خودرو لوکس و تأثیر آن بر آرامش سفر', keyword: 'عایق صدا خودرو', category: 'luxury-cars' },
  { title: 'سیستم تهویه مطبوع در خودروهای لوکس؛ فراتر از کولر', keyword: 'تهویه خودرو لوکس', category: 'luxury-cars' },
  { title: 'مرسدس بنز کلاس E؛ پادشاه جاده‌های ایران', keyword: 'مرسدس بنز کلاس E', category: 'luxury-cars' },
  { title: 'بی‌ام‌و سری ۵؛ ترکیب اسپرت و لوکس برای سفر', keyword: 'بی ام و سری 5', category: 'luxury-cars' },
  { title: 'آئودی A6 و جذابیت طراحی آلمان در جاده‌های ایران', keyword: 'آئودی A6', category: 'luxury-cars' },
  { title: 'تویوتا لندکروزر؛ بهترین همراه جاده‌های کوهستانی', keyword: 'تویوتا لندکروزر', category: 'luxury-cars' },
  { title: 'هیوندای سوناتا؛ لوکس اما اقتصادی برای سفر خانوادگی', keyword: 'هیوندای سوناتا', category: 'luxury-cars' },
  { title: 'سیستم تعلیق در خودروهای لوکس و راحتی سرنشینان', keyword: 'سیستم تعلیق خودرو', category: 'luxury-cars' },
  { title: 'ایمنی فعال در خودروهای لوکس؛ از ترمز ABS تا کیسه هوا', keyword: 'ایمنی خودرو لوکس', category: 'luxury-cars' },
  { title: 'طراحی داخلی خودرو لوکس؛ فضایی که خستگی را فراموش می‌کنید', keyword: 'طراحی داخلی خودرو لوکس', category: 'luxury-cars' },

  // ---- مقایسه لوکس و اقتصادی (luxury-vs-economy) ----
  { title: 'خودرو لوکس یا اقتصادی؟ کدام برای سفر بین شهری بهتر است', keyword: 'خودرو لوکس یا اقتصادی', category: 'luxury-vs-economy' },
  { title: 'هزینه پنهان سفر با خودرو اقتصادی که نمی‌بینید', keyword: 'هزینه سفر خودرو اقتصادی', category: 'luxury-vs-economy' },
  { title: 'چرا خودرو لوکس در جاده‌های طولانی ارزشش را دارد؟', keyword: 'ارزش خودرو لوکس سفر', category: 'luxury-vs-economy' },
  { title: 'مقایسه راحتی خودرو لوکس و پراید در سفر تهران-مشهد', keyword: 'راحتی خودرو لوکس پراید', category: 'luxury-vs-economy' },
  { title: 'خستگی راننده در خودرو اقتصادی vs خودرو لوکس', keyword: 'خستگی راننده خودرو', category: 'luxury-vs-economy' },
  { title: 'ایمنی خودرو لوکس در برابر خودرو اقتصادی؛ تفاوت فاجعه‌بار', keyword: 'ایمنی لوکس اقتصادی', category: 'luxury-vs-economy' },
  { title: 'فضای داخلی و چمدان؛ برتری خودرو لوکس در سفر خانوادگی', keyword: 'فضای داخلی خودرو سفر', category: 'luxury-vs-economy' },

  // ---- راهنمای سفر شهر به شهر (travel-guide) ----
  { title: 'راهنمای کامل سفر تهران به مشهد با خودرو', keyword: 'سفر تهران به مشهد', category: 'travel-guide' },
  { title: 'سفر تهران به اصفهان؛ مسیر، توقف‌ها و جاذبه‌ها', keyword: 'سفر تهران به اصفهان', category: 'travel-guide' },
  { title: 'سفر تهران به شیراز از جاده قدیم و جدید', keyword: 'سفر تهران به شیراز', category: 'travel-guide' },
  { title: 'سفر تهران به رشت و انزلی؛ راهنمای جاده هراز', keyword: 'سفر تهران به رشت', category: 'travel-guide' },
  { title: 'سفر تهران به تبریز از جاده قزوین-زنجان', keyword: 'سفر تهران به تبریز', category: 'travel-guide' },
  { title: 'مسیر تهران به کیش؛ پرواز یا سفر زمینی؟', keyword: 'سفر تهران به کیش', category: 'travel-guide' },

  // ---- نکات عملی سفر (travel-tips) ----
  { title: 'راهنمای بسته‌بندی چمدان برای سفر بین شهری', keyword: 'بسته‌بندی چمدان سفر', category: 'travel-tips' },
  { title: 'مدیریت خستگی در سفرهای طولانی بین شهری', keyword: 'خستگی در سفر بین شهری', category: 'travel-tips' },
  { title: 'بهترین زمان استراحت در جاده؛ هر چند ساعت یک‌بار؟', keyword: 'استراحت در جاده', category: 'travel-tips' },
  { title: 'سفر با کودکان؛ راهنمای آرامش خانواده در جاده', keyword: 'سفر با کودکان', category: 'travel-tips' },
  { title: 'چگونه زمان سفر را برای ترافیک کمتر برنامه‌ریزی کنیم', keyword: 'زمان سفر ترافیک', category: 'travel-tips' },

  // ---- ایمنی سفر (safety — intentionally small) ----
  { title: 'نکات کلیدی ایمنی سفر بین شهری در شب', keyword: 'ایمنی سفر شب', category: 'safety' },
  { title: 'چک‌لیست ایمنی خودرو پیش از سفر طولانی', keyword: 'چک لیست ایمنی خودرو', category: 'safety' },

  // ---- برند سیوان (sivan-brand) ----
  { title: 'چرا تاکسی ویژه سیوان انتخاب هوشمندانه‌ای است', keyword: 'تاکسی ویژه سیوان', category: 'sivan-brand' },
  { title: 'تفاوت تاکسی دربستی سیوان با آژانس‌های معمولی', keyword: 'تاکسی دربستی سیوان', category: 'sivan-brand' },
  { title: 'هزینه سفر با تاکسی VIP چگونه محاسبه می‌شود', keyword: 'هزینه تاکسی VIP', category: 'sivan-brand' },
];

// Weighted category rotation so the blog has a balanced mix.
// Each cycle picks the next category from this weighted list, then picks the
// next unused topic within that category. This avoids topic-clumping.
const CATEGORY_ORDER: TopicCategory[] = [
  'tourism',
  'luxury-cars',
  'luxury-vs-economy',
  'travel-guide',
  'tourism',
  'luxury-cars',
  'travel-tips',
  'luxury-vs-economy',
  'tourism',
  'luxury-cars',
  'sivan-brand',
  'travel-guide',
  'safety', // intentionally rare: ~1 in 13
];
let cycleIndex = 0;
const categoryTopicIndex: Record<TopicCategory, number> = {
  tourism: 0,
  'luxury-cars': 0,
  'luxury-vs-economy': 0,
  'travel-guide': 0,
  'travel-tips': 0,
  safety: 0,
  'sivan-brand': 0,
};

function pickTopic(): Topic {
  const category = CATEGORY_ORDER[cycleIndex % CATEGORY_ORDER.length];
  cycleIndex++;
  const pool = TOPICS.filter((t) => t.category === category);
  const idx = categoryTopicIndex[category] % pool.length;
  categoryTopicIndex[category]++;
  return pool[idx];
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

// Category-aware cover-image scene pools. All prompts are kept purely English
// (no Persian) to avoid the image API's content filter. Each category has its
// own visual identity so a tourism article doesn't get a car-only cover, etc.
const COVER_SCENES: Record<TopicCategory, string[]> = {
  tourism: [
    'a breathtaking aerial view of an Iranian tourist destination at golden hour, mountains and traditional Persian architecture, warm cinematic light, professional travel photography, no text, no watermark',
    'a scenic Iranian mountain road winding through lush green forests in spring, soft morning mist, cinematic landscape photography, vibrant, professional, no text, no watermark',
    'a beautiful Persian historic mosque and garden at sunset, golden light reflecting on tile work, cinematic travel photography, professional, elegant, no text, no watermark',
    'a coastal road along the Persian Gulf at twilight, palm trees, calm sea, cinematic warm tones, professional travel photography, no text, no watermark',
    'a desert landscape in central Iran at sunset, sand dunes and distant mountains, dramatic orange sky, cinematic travel photography, professional, no text, no watermark',
  ],
  'luxury-cars': [
    'a luxurious black leather car interior with ambient golden lighting, premium dashboard, elegant stitching, professional automotive photography, cinematic, moody, high quality, no text, no watermark',
    'a close-up of a luxury car front grille and LED headlights at night, rain droplets, cinematic lighting, professional automotive photography, elegant, no text, no watermark',
    'a sleek black luxury sedan parked in a dimly lit upscale setting, dramatic side lighting, reflective floor, professional automotive photography, cinematic, no text, no watermark',
    'a luxury car wheel and leather seat detail shot, warm ambient lighting, professional automotive photography, cinematic, elegant, no text, no watermark',
  ],
  'luxury-vs-economy': [
    'a side-by-side comparison of a sleek black luxury sedan and a small white economy car on a clean showroom floor, dramatic lighting, professional automotive photography, cinematic, no text, no watermark',
    'a split-image of a luxury car premium interior versus a basic economy car interior, warm vs cool lighting, professional automotive photography, cinematic, no text, no watermark',
    'a black luxury sedan overtaking a small economy car on an open highway at sunset, motion blur, cinematic automotive photography, professional, no text, no watermark',
  ],
  'travel-guide': [
    'a scenic Iranian highway stretching toward distant mountains at golden hour, a luxury sedan driving, cinematic travel photography, professional, warm tones, no text, no watermark',
    'a winding mountain road in northern Iran with a black luxury car, lush green forest, soft morning light, cinematic travel photography, professional, no text, no watermark',
    'a long open desert highway in central Iran at sunset, a luxury sedan in the distance, dramatic sky, cinematic travel photography, professional, no text, no watermark',
  ],
  'travel-tips': [
    'a neatly packed travel suitcase with essentials beside a luxury car trunk, warm soft lighting, professional lifestyle photography, cinematic, elegant, no text, no watermark',
    'a family loading luggage into a luxury SUV in front of a modern home, warm morning light, professional lifestyle photography, cinematic, no text, no watermark',
    'a steaming cup of coffee and a map on a luxury car dashboard, road trip mood, warm cinematic lighting, professional photography, no text, no watermark',
  ],
  safety: [
    'a black luxury sedan parked safely at a highway rest stop at dusk, warm interior light, calm mood, professional automotive photography, cinematic, no text, no watermark',
    'a dashboard view of a luxury car at night showing modern safety dashboard lights, cinematic moody lighting, professional automotive photography, no text, no watermark',
  ],
  'sivan-brand': [
    'a fleet of sleek black luxury sedans lined up at night under golden lights, professional automotive photography, cinematic, elegant, premium, no text, no watermark',
    'a professional chauffeur opening the door of a black luxury sedan for a passenger, upscale setting, warm cinematic lighting, professional photography, elegant, no text, no watermark',
    'a black luxury sedan with a subtle gold accent parked in front of an elegant modern building at dusk, cinematic lighting, professional automotive photography, premium, no text, no watermark',
  ],
};

// Ask the LLM to produce ONE specific, English-language image prompt that
// visually represents the article's ACTUAL subject (not just its category).
// This makes every cover image topically relevant — e.g. an article about
// Hormuz Island gets a Hormuz-specific cover (red soil, rainbow mountains),
// an article about a Mercedes E-Class gets a Mercedes-specific cover, etc.
// Falls back to null on any failure so the caller uses the category scene pool.
async function generateImagePrompt(title: string, topic: Topic): Promise<string | null> {
  if (!zai) return null;
  // A category-specific style hint so the model keeps the right "look".
  const styleHint =
    topic.category === 'luxury-cars' || topic.category === 'luxury-vs-economy'
      ? 'professional automotive photography, moody cinematic lighting'
      : topic.category === 'tourism'
        ? 'professional travel photography, golden-hour cinematic lighting'
        : topic.category === 'sivan-brand'
          ? 'professional automotive photography, premium elegant cinematic lighting'
          : 'professional travel photography, cinematic lighting';
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `You are a professional art director for a luxury Persian travel & taxi blog. I will give you the title of a Persian article. Produce ONE single English sentence describing a striking, topic-specific cover photo that visually matches the article's ACTUAL subject.

Rules (very important):
- The image MUST visually depict the specific subject of the article (the exact place, exact car model, or exact concept) — NOT a generic scene.
- Translate any Persian place/car name into its English equivalent so the image model understands it (e.g. "Hormuz Island", "Mercedes-Benz E-Class", "Tehran to Mashhad highway").
- Photorealistic scene description only. No abstract art, no illustrations.
- Absolutely NO text, words, letters, logos or watermark in the image.
- Do NOT show clearly visible human faces.
- Do NOT wrap the answer in quotes or markdown. Do NOT add any explanation or label. Output ONLY the one sentence.
- Keep the sentence between 20 and 80 words.

Article title (Persian): ${title}
Article focus keyword (Persian): ${topic.keyword}

End your sentence with exactly: ", ${styleHint}, high quality, no text, no watermark".

Write the one-sentence English image prompt now:`,
        },
      ],
      thinking: { type: 'disabled' },
    });
    const raw = (completion?.choices?.[0]?.message?.content || '').trim();
    if (!raw) return null;
    // Clean up any wrapping the model might add despite instructions.
    const cleaned = raw
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/\n?```$/i, '')
      .replace(/^["'«]|["'»]$/g, '')
      .replace(/^(prompt|image prompt|description|cover photo)\s*:\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length < 15 || cleaned.length > 600) return null;
    // Guarantee the quality/no-text suffix is present.
    if (!/no text/i.test(cleaned)) {
      return `${cleaned}, ${styleHint}, high quality, no text, no watermark`;
    }
    return cleaned;
  } catch (err) {
    console.error('[blog-generator] image-prompt LLM call failed:', err);
    return null;
  }
}

async function generateCoverImage(
  title: string,
  slug: string,
  topic: Topic
): Promise<string | null> {
  if (!zai) return null;
  // First, ask the LLM for a topic-specific image prompt so the cover actually
  // matches the article's subject (not just its broad category).
  let prompt = await generateImagePrompt(title, topic);
  if (prompt) {
    console.log(`[blog-generator] topic-specific image prompt: "${prompt.slice(0, 120)}${prompt.length > 120 ? '…' : ''}"`);
  } else {
    // Fallback: pick a generic scene from the category-aware pool.
    const scenes = COVER_SCENES[topic.category] || COVER_SCENES['travel-guide'];
    prompt = scenes[Math.floor(Math.random() * scenes.length)];
    console.log(`[blog-generator] LLM prompt failed; using fallback ${topic.category} scene`);
  }
  try {
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
    // Fallback to an existing default car image so the post isn't imageless.
    return '/images/luxury-car.png';
  }
}

// Derive a keyword from a free-form custom topic: take the most meaningful
// words (skip very common Persian stopwords), join with space. Falls back to
// the whole topic if filtering removes everything.
function deriveKeyword(topic: string): string {
  const stopwords = new Set([
    'در', 'از', 'به', 'با', 'و', 'یا', 'را', 'است', 'نیست', 'برای', 'تا', 'که',
    'این', 'آن', 'هر', 'چه', 'چگونه', 'چرا', 'کی', 'کجا', 'کدام', 'هم', 'تاکنون',
    'یک', 'دو', 'سه', 'نه', 'بله', 'خیر', 'اما', 'اگر', 'چون', 'بنابراین', 'پس',
    'ترین', 'ها', 'های', 'ای', 'هایی', 'شود', 'شده', 'می', 'کرد', 'کند', 'باشد',
    'هستند', 'بود', 'بودن', 'ما', 'شما', 'او', 'آنها', 'خود', 'همین', 'مانند',
  ]);
  const words = topic
    .replace(/[«»"'!?.,:;()\[\]{}،؛؟]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopwords.has(w));
  const kw = words.slice(0, 5).join(' ').trim();
  return kw || topic.slice(0, 40);
}

// Heuristically classify a free-form custom topic into one of the cover-image
// categories, so the generated cover matches the article's theme. Falls back to
// 'travel-guide' which has generic scenic-highway scenes.
function classifyTopic(topic: string): TopicCategory {
  const t = topic.toLowerCase();
  if (/(گردشگري|گردشگری|جاذبه|ديدني|دیدنی|طبيعت|طبیعت|تاريخي|تاریخی|معبد|مسجد|كليسا|کلیسا|موزه|بازار|روستا|جزيره|جزیره|ساحل|دريا|دریا|كوه|کوه|جنگل|كوير|کویر|شمال|جنوب|كیش|کیش|قشم|مشهد|شيراز|شیراز|اصفهان|تبريز|تبریز|يزد|رشت|نوشهر|چالوس|كرمان|کرمان|ماسوله)/.test(t)) {
    return 'tourism';
  }
  if (/(مرسدس|بنز|بي ام و|بی ام و|bmw|آئودي|آئودی|audi|تويوتا|تویوتا|لندکروز|لند كروزر|هیونداي|هیوندای|سوناتا|خودروي لوكس|خودروی لوکس|خودرو لوكس|خودرو لوکس|ماشين لوكس|ماشین لوکس|صندلي|صندلی|چرمي|چرمی|تعليق|تعلیق|ايمني فعال|ایمنی فعال|ترمز|كيسه هوا|کیسه هوا|داخلي|داخلی|كابين|کابین|طراحی داخل|امكانات خودرو)/.test(t)) {
    return 'luxury-cars';
  }
  if (/(اقتصادي|اقتصادی|لوكس در برابر|لوکس در برابر|مقايده|مقایسه|پرايد|پراید|تيبا|سايپا|سایپا|ايران خودرو|ایران خودرو|هزينه پنهان|هزینه پنهان|ارزشش|ارزش خودرو|خستگي راننده|خستگی راننده|برتري|برتری)/.test(t)) {
    return 'luxury-vs-economy';
  }
  if (/(بسته بندي|بسته‌بندی|چمدان|خستگي|خستگی|استراحت در جاده|كودكان|کودکان|زمان سفر|ترافيك|ترافیک|نكات عملي|نکات عملی|راهنماي سفر|راهنمای سفر|آمادگي|آمادگی)/.test(t)) {
    return 'travel-tips';
  }
  if (/(امني|ایمنی|بي خطر|بی‌خطر|خطر|تصادف|كاكسه|کاسه|كمربند|کمربند| ايمني سفر|ایمنی سفر|شب|چك ليست|چک‌لیست|چک ليست)/.test(t)) {
    return 'safety';
  }
  if (/(سيوان|سرويس دربستي|سرویس دربستی|آژانس|هزينه تاكسيمون|هزینه تاکسی|قيمت|قیمت|رزرو|اپليكيشن|اپلیکیشن|برند سيوان|برند سوان)/.test(t)) {
    return 'sivan-brand';
  }
  return 'travel-guide';
}

async function generateArticle(customTopic?: string): Promise<{ ok: boolean; title?: string; slug?: string; error?: string; custom?: boolean }> {
  if (!zai) {
    return { ok: false, error: 'ZAI SDK not initialized' };
  }
  if (isGenerating) {
    return { ok: false, error: 'Generation already in progress' };
  }
  isGenerating = true;
  lastError = null;

  // For custom-topic generations we build a Topic from the admin's input and
  // do NOT call pickTopic() — this keeps the 6-hour auto-rotation untouched
  // (cycleIndex / categoryTopicIndex are only advanced by scheduled/on-demand
  // auto-pick generations, never by custom ones).
  const isCustom = !!customTopic && customTopic.trim().length > 0;
  const topic: Topic = isCustom
    ? {
        title: customTopic!.trim().slice(0, 200),
        keyword: deriveKeyword(customTopic!),
        category: classifyTopic(customTopic!),
      }
    : pickTopic();
  console.log(`[blog-generator] generating article for topic: ${topic.title} (keyword: ${topic.keyword}, category: ${topic.category}${isCustom ? ', CUSTOM' : ''})`);

  const systemPrompt =
    'تو یک نویسنده حرفه‌ای محتوای سفر، گردشگری و خودرو هستی که برای وب‌سایت «تاکسی ویژه سیوان» (یک سرویس تاکسی VIP بین شهری در ایران با ناوگان خودروهای لوکس) مطلب می‌نویسی. موضوعات مقاله‌های تو متنوع است: گردشگری و معرفی مناطق زیبای ایران، معرفی خودروهای لوکس و امکانات آن‌ها، مقایسه خودرو لوکس با خودرو اقتصادی، راهنمای سفر بین شهرهای ایران، نکات عملی سفر و گاهی مسائل ایمنی. لحن تو حرفه‌ای، صمیمی و قابل اعتماد است و با مخاطب ایرانی صحبت می‌کنی. مقاله‌هایی که می‌نویسی باکیفیت، مفید، خوانا و سئو-بهینه هستند. تو قوانین سئو (کلمه کلیدی، ساختار هدینگ، متا دیسکریپشن) را به‌خوبی می‌دانی. در هر مقاله، در صورت مرتبط بودن، می‌توانی به‌طور طبیعی و غیرتبلیغاتی به سرویس «تاکسی ویژه سیوان» اشاره کنی.';

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
  const featuredImageUrl = await generateCoverImage(parsed.title, slug, topic);

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
    console.log(`[blog-generator] ✓ published${isCustom ? ' (CUSTOM)' : ''}: "${post.title}" (slug: ${post.slug}, image: ${featuredImageUrl || 'none'})`);
    isGenerating = false;
    return { ok: true, title: post.title, slug: post.slug, custom: isCustom };
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
    if (req.method === 'POST' && url.pathname === '/generate-custom') {
      // Custom-topic generation. Reads { topic: string } from the JSON body.
      // This does NOT advance the 6-hour auto-rotation — generateArticle()
      // skips pickTopic() when a customTopic is supplied, so the scheduled
      // setInterval cycle continues with its next topic as if nothing happened.
      if (isGenerating) {
        return Response.json({ started: false, message: 'تولید دیگری در حال انجام است؛ لطفاً صبر کنید' }, { headers: corsHeaders });
      }
      let body: any = null;
      try {
        body = await req.json();
      } catch {
        return Response.json({ started: false, message: 'بدنه درخواست نامعتبر است' }, { status: 400, headers: corsHeaders });
      }
      const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';
      if (!topic || topic.length < 3) {
        return Response.json({ started: false, message: 'موضوع مقاله باید حداقل ۳ کاراکتر باشد' }, { status: 400, headers: corsHeaders });
      }
      if (topic.length > 200) {
        return Response.json({ started: false, message: 'موضوع مقاله نباید بیشتر از ۲۰۰ کاراکتر باشد' }, { status: 400, headers: corsHeaders });
      }
      console.log(`[blog-generator] admin requested custom topic: "${topic}"`);
      generateArticle(topic).catch((e) => console.error('[blog-generator] custom on-demand error:', e));
      return Response.json({ started: true, custom: true, topic }, { headers: corsHeaders });
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
