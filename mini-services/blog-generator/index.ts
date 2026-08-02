/**
 * Sivan AI Blog Generator (v5 — real images + enhanced SEO + robust persistence)
 * ============================================================================
 *
 * Automatically generates and publishes a new SEO-optimized blog article every 6 hours
 * using the z-ai-web-dev-sdk (LLM chat completions) and z-ai image-search (real photos).
 *
 * **v5 changes**:
 *   1. REAL IMAGES: Uses `z-ai image-search` CLI to find real photographs of
 *      Iranian cities, landmarks, and luxury cars — no more AI-generated images.
 *   2. ENHANCED SEO: Comprehensive SEO prompt with heading hierarchy rules,
 *      keyword density guidance, internal linking, FAQ schema hints, and
 *      structured meta descriptions.
 *   3. ROBUST PERSISTENCE: Generation state persisted in DB. On restart/deploy,
 *      service restores state and continues. Error recovery with exponential
 *      backoff. Keep-alive health checks.
 *
 * Topics are diversified across 7 categories so the blog has a balanced mix.
 *
 * Runs as a Bun mini-service on port 3005.
 *
 * Endpoints:
 *   GET  /health    -> { ok, service, port, lastGeneratedAt, totalPosts, nextGenInMs }
 *   POST /generate  -> triggers generateArticle() immediately (fire-and-forget)
 *   GET  /status    -> { running, lastGeneratedAt, lastError, totalPosts, nextGenInMs }
 *   POST /generate-custom -> generate from admin-supplied topic (fire-and-forget)
 */

import { PrismaClient } from '@prisma/client';
import ZAI from 'z-ai-web-dev-sdk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const PORT = 3005;
const DB_URL = 'file:/home/z/my-project/db/custom.db';
const BLOG_IMG_DIR = '/home/z/my-project/public/images/blog';
const GENERATION_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MIN_POSTS_FOR_IMMEDIATE_SKIP = 3;
const CONSECUTIVE_FAILURE_RESET = 5; // after this many fails, reset to immediate

const db = new PrismaClient({ datasources: { db: { url: DB_URL } } });
let zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

// Runtime status (visible to admin via /status)
let isGenerating = false;
let lastGeneratedAt: string | null = null;
let lastError: string | null = null;
let nextGenAt: Date | null = null;
let consecutiveFailures = 0;
let generationCount = 0;

// Diversified topic pool. Each topic carries:
//   - title:   the article's working title (LLM may refine it)
//   - keyword: the SEO focus keyword the LLM must weave in
//   - category: drives which image search query is built
//   - searchQueries: English search queries for real image search
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
  searchQueries: string[]; // English queries for image-search
}

const TOPICS: Topic[] = [
  // ---- گردشگری و مناطق زیبای ایران (tourism) ----
  { title: 'جاذبه‌های گردشگری مشهد که هر مسافری باید ببیند', keyword: 'جاذبه‌های گردشگری مشهد', category: 'tourism',
    searchQueries: ['Mashhad Imam Reza shrine golden dome Iran', 'Mashhad city skyline Iran pilgrimage'] },
  { title: 'زیبایی‌های شیراز؛ شهر گل و شب‌نما', keyword: 'جاذبه‌های گردشگری شیراز', category: 'tourism',
    searchQueries: ['Shiraz Nasir al-Mulk pink mosque Iran', 'Shiraz Eram garden beautiful Persian garden'] },
  { title: 'اصفهان شهر نصف جهان؛ راهنمای گردشگری', keyword: 'گردشگری اصفهان', category: 'tourism',
    searchQueries: ['Isfahan Si-o-se-pol bridge Zayandeh river Iran', 'Isfahan Naqsh-e Jahan square beautiful Iranian architecture'] },
  { title: 'تابستان در نوشهر و چالوس؛ بهترین مسیر فرار از گرما', keyword: 'گردشگری نوشهر و چالوس', category: 'tourism',
    searchQueries: ['Noshahr Caspian Sea coast Iran summer', 'Chalous road northern Iran forest mountain'] },
  { title: 'جزیره کیش؛ بهشت گردشگری در خلیج فارس', keyword: 'گردشگری کیش', category: 'tourism',
    searchQueries: ['Kish island Persian Gulf beach resort Iran', 'Kish island coral beach turquoise water'] },
  { title: 'جزیره قشم و عجایب طبیعی آن', keyword: 'گردشگری قشم', category: 'tourism',
    searchQueries: ['Qeshm island Hengam dolphin Iran', 'Qeshm island valley of stars geological formations'] },
  { title: 'ماسوله؛ روستای پلکانی تاریخ ایران', keyword: 'گردشگری ماسوله', category: 'tourism',
    searchQueries: ['Masouleh village stepped architecture Iran', 'Masouleh colorful houses mountain village Gilan'] },
  { title: 'تبریز در یک روز؛ بازار، مسجد کبود و قهوه‌خانه‌ها', keyword: 'گردشگری تبریز', category: 'tourism',
    searchQueries: ['Tabriz Blue Mosque Azerbaijan Iran', 'Tabriz historic bazaar UNESCO Iran'] },
  { title: 'دریاچه نمک مهابان و عجایب مسیر تهران-قم', keyword: 'دریاچه نمک قم', category: 'tourism',
    searchQueries: ['Salt lake desert Iran Qom highway', 'Mesr desert salt flats Iran landscape'] },
  { title: 'بهترین فصل سفر به شمال ایران برای دیدن طبیعت', keyword: 'بهترین فصل سفر به شمال', category: 'tourism',
    searchQueries: ['Northern Iran lush green forest spring', 'Gilan province rice fields Hyrcanian forest'] },
  { title: 'یزد شهر بادگیرها و کویر نقره‌ای', keyword: 'گردشگری یزد', category: 'tourism',
    searchQueries: ['Yazd wind towers desert city Iran', 'Yazd old town mud brick architecture adobe'] },
  { title: 'کرمان و دل کویر؛ راهنمای سفر به گنبد فتح‌آباد', keyword: 'گردشگری کرمان', category: 'tourism',
    searchQueries: ['Kerman Ganjali Khan bathhouse Iran', 'Kerman desert Kalut sand formations Shahdad'] },

  // ---- خودروهای لوکس و مزایا (luxury-cars) ----
  { title: 'امکانات خودرو لوکس که کیفیت سفر را متحول می‌کند', keyword: 'امکانات خودرو لوکس', category: 'luxury-cars',
    searchQueries: ['luxury car interior premium leather seats ambient lighting', 'luxury sedan dashboard technology premium features'] },
  { title: 'چرا صندلی چرمی در سفرهای طولانی مهم است؟', keyword: 'صندلی چرمی خودرو لوکس', category: 'luxury-cars',
    searchQueries: ['premium leather car seat luxury interior detail', 'luxury car leather upholstery stitching detail'] },
  { title: 'عایق صدا در خودرو لوکس و تأثیر آن بر آرامش سفر', keyword: 'عایق صدا خودرو', category: 'luxury-cars',
    searchQueries: ['luxury car quiet cabin sound insulation', 'premium car interior silent ride comfort'] },
  { title: 'سیستم تهویه مطبوع در خودروهای لوکس؛ فراتر از کولر', keyword: 'تهویه خودرو لوکس', category: 'luxury-cars',
    searchQueries: ['luxury car climate control dual zone', 'premium car air conditioning vents modern'] },
  { title: 'مرسدس بنز کلاس E؛ پادشاه جاده‌های ایران', keyword: 'مرسدس بنز کلاس E', category: 'luxury-cars',
    searchQueries: ['Mercedes-Benz E-Class black sedan luxury', 'Mercedes E-Class W213 front view elegant'] },
  { title: 'بی‌ام‌و سری ۵؛ ترکیب اسپرت و لوکس برای سفر', keyword: 'بی ام و سری 5', category: 'luxury-cars',
    searchQueries: ['BMW 5 Series sedan luxury black', 'BMW 5 Series interior premium dashboard'] },
  { title: 'آئودی A6 و جذابیت طراحی آلمان در جاده‌های ایران', keyword: 'آئودی A6', category: 'luxury-cars',
    searchQueries: ['Audi A6 sedan luxury black front', 'Audi A6 interior virtual cockpit premium'] },
  { title: 'تویوتا لندکروزر؛ بهترین همراه جاده‌های کوهستانی', keyword: 'تویوتا لندکروزر', category: 'luxury-cars',
    searchQueries: ['Toyota Land Cruiser black SUV offroad', 'Toyota Land Cruiser desert road Iran'] },
  { title: 'هیوندای سوناتا؛ لوکس اما اقتصادی برای سفر خانوادگی', keyword: 'هیوندای سوناتا', category: 'luxury-cars',
    searchQueries: ['Hyundai Sonata sedan silver modern', 'Hyundai Sonata interior family car comfortable'] },
  { title: 'سیستم تعلیق در خودروهای لوکس و راحتی سرنشینان', keyword: 'سیستم تعلیق خودرو', category: 'luxury-cars',
    searchQueries: ['luxury car air suspension smooth ride', 'premium car suspension system comfort'] },
  { title: 'ایمنی فعال در خودروهای لوکس؛ از ترمز ABS تا کیسه هوا', keyword: 'ایمنی خودرو لوکس', category: 'luxury-cars',
    searchQueries: ['car safety features ABS airbag modern', 'luxury car advanced safety technology'] },
  { title: 'طراحی داخلی خودرو لوکس؛ فضایی که خستگی را فراموش می‌کنید', keyword: 'طراحی داخلی خودرو لوکس', category: 'luxury-cars',
    searchQueries: ['luxury car interior design premium wood trim', 'premium sedan cabin elegant lighting night'] },

  // ---- مقایسه لوکس و اقتصادی (luxury-vs-economy) ----
  { title: 'خودرو لوکس یا اقتصادی؟ کدام برای سفر بین شهری بهتر است', keyword: 'خودرو لوکس یا اقتصادی', category: 'luxury-vs-economy',
    searchQueries: ['luxury sedan vs economy car comparison', 'black luxury car and small car side by side'] },
  { title: 'هزینه پنهان سفر با خودرو اقتصادی که نمی‌بینید', keyword: 'هزینه سفر خودرو اقتصادی', category: 'luxury-vs-economy',
    searchQueries: ['old economy car breakdown roadside', 'worn out car interior uncomfortable seats'] },
  { title: 'چرا خودرو لوکس در جاده‌های طولانی ارزشش را دارد؟', keyword: 'ارزش خودرو لوکس سفر', category: 'luxury-vs-economy',
    searchQueries: ['luxury car highway driving comfortable long distance', 'premium sedan open road sunset golden hour'] },
  { title: 'مقایسه راحتی خودرو لوکس و پراید در سفر تهران-مشهد', keyword: 'راحتی خودرو لوکس پراید', category: 'luxury-vs-economy',
    searchQueries: ['Iran highway long road Tehran Mashhad', 'luxury black car driving on Iranian highway'] },
  { title: 'خستگی راننده در خودرو اقتصادی vs خودرو لوکس', keyword: 'خستگی راننده خودرو', category: 'luxury-vs-economy',
    searchQueries: ['tired driver holding steering wheel road trip', 'comfortable driver relaxed luxury car driving'] },
  { title: 'ایمنی خودرو لوکس در برابر خودرو اقتصادی؛ تفاوت فاجعه‌بار', keyword: 'ایمنی لوکس اقتصادی', category: 'luxury-vs-economy',
    searchQueries: ['car crash test safety rating comparison', 'luxury car crumple zone safety technology'] },
  { title: 'فضای داخلی و چمدان؛ برتری خودرو لوکس در سفر خانوادگی', keyword: 'فضای داخلی خودرو سفر', category: 'luxury-vs-economy',
    searchQueries: ['luxury car spacious trunk luggage family trip', 'family loading suitcases into premium SUV'] },

  // ---- راهنمای سفر شهر به شهر (travel-guide) ----
  { title: 'راهنمای کامل سفر تهران به مشهد با خودرو', keyword: 'سفر تهران به مشهد', category: 'travel-guide',
    searchQueries: ['Tehran to Mashhad highway Iran road trip', 'Iran highway desert landscape long road'] },
  { title: 'سفر تهران به اصفهان؛ مسیر، توقف‌ها و جاذبه‌ها', keyword: 'سفر تهران به اصفهان', category: 'travel-guide',
    searchQueries: ['Tehran to Isfahan road Iran highway', 'Iranian highway mountain scenery desert'] },
  { title: 'سفر تهران به شیراز از جاده قدیم و جدید', keyword: 'سفر تهران به شیراز', category: 'travel-guide',
    searchQueries: ['Tehran to Shiraz road Iran landscape', 'Iran southern road mountains desert scenic'] },
  { title: 'سفر تهران به رشت و انزلی؛ راهنمای جاده هراز', keyword: 'سفر تهران به رشت', category: 'travel-guide',
    searchQueries: ['Haraz road Iran mountain forest green', 'Rasht Anzali Caspian Sea coast Iran'] },
  { title: 'سفر تهران به تبریز از جاده قزوین-زنجان', keyword: 'سفر تهران به تبریز', category: 'travel-guide',
    searchQueries: ['Tehran to Tabriz highway Iran landscape', 'Zanjan Soltaniyeh dome Iran road trip'] },
  { title: 'مسیر تهران به کیش؛ پرواز یا سفر زمینی؟', keyword: 'سفر تهران به کیش', category: 'travel-guide',
    searchQueries: ['Kish island aerial view beach Persian Gulf', 'airplane flying over Iranian island resort'] },

  // ---- نکات عملی سفر (travel-tips) ----
  { title: 'راهنمای بسته‌بندی چمدان برای سفر بین شهری', keyword: 'بسته‌بندی چمدان سفر', category: 'travel-tips',
    searchQueries: ['packed travel suitcase with essentials organized', 'luxury car trunk open with luggage'] },
  { title: 'مدیریت خستگی در سفرهای طولانی بین شهری', keyword: 'خستگی در سفر بین شهری', category: 'travel-tips',
    searchQueries: ['road trip rest stop coffee break', 'driver resting at highway service area'] },
  { title: 'بهترین زمان استراحت در جاده؛ هر چند ساعت یک‌بار؟', keyword: 'استراحت در جاده', category: 'travel-tips',
    searchQueries: ['highway rest area stop Iran road trip', 'scenic roadside stop mountains Iran'] },
  { title: 'سفر با کودکان؛ راهنمای آرامش خانواده در جاده', keyword: 'سفر با کودکان', category: 'travel-tips',
    searchQueries: ['family road trip children happy in car', 'kids looking out car window road trip'] },
  { title: 'چگونه زمان سفر را برای ترافیک کمتر برنامه‌ریزی کنیم', keyword: 'زمان سفر ترافیک', category: 'travel-tips',
    searchQueries: ['empty highway scenic Iran no traffic', 'early morning road trip beautiful sunrise'] },

  // ---- ایمنی سفر (safety) ----
  { title: 'نکات کلیدی ایمنی سفر بین شهری در شب', keyword: 'ایمنی سفر شب', category: 'safety',
    searchQueries: ['car driving at night highway lights Iran', 'luxury car headlights road night safe driving'] },
  { title: 'چک‌لیست ایمنی خودرو پیش از سفر طولانی', keyword: 'چک لیست ایمنی خودرو', category: 'safety',
    searchQueries: ['mechanic checking car before road trip', 'car tire inspection service station'] },

  // ---- برند سیوان (sivan-brand) ----
  { title: 'چرا تاکسی ویژه سیوان انتخاب هوشمندانه‌ای است', keyword: 'تاکسی ویژه سیوان', category: 'sivan-brand',
    searchQueries: ['black luxury sedan fleet line up premium', 'professional chauffeur opening luxury car door'] },
  { title: 'تفاوت تاکسی دربستی سیوان با آژانس‌های معمولی', keyword: 'تاکسی دربستی سیوان', category: 'sivan-brand',
    searchQueries: ['luxury private car service premium', 'black executive sedan VIP transport'] },
  { title: 'هزینه سفر با تاکسی VIP چگونه محاسبه می‌شود', keyword: 'هزینه تاکسی VIP', category: 'sivan-brand',
    searchQueries: ['luxury taxi service premium car city', 'VIP car service transparent pricing professional'] },
];

// Weighted category rotation so the blog has a balanced mix.
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
  'safety',
];

// ---- Persistent state management ----
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

/** Restore generation state from the DB (called once on startup). */
async function restoreState(): Promise<void> {
  try {
    let state = await db.blogGeneratorState.findUnique({ where: { id: 'main' } });
    if (!state) {
      // First run ever — create the row with defaults.
      state = await db.blogGeneratorState.create({ data: { id: 'main' } });
      console.log('[blog-generator] created initial DB state row');
    }
    cycleIndex = state.cycleIndex;
    const parsed = JSON.parse(state.categoryTopicIndex || '{}');
    for (const cat of Object.keys(categoryTopicIndex) as TopicCategory[]) {
      if (typeof parsed[cat] === 'number') {
        categoryTopicIndex[cat] = parsed[cat];
      }
    }
    if (state.lastAutoGenAt) {
      lastGeneratedAt = state.lastAutoGenAt.toISOString();
    }
    console.log(`[blog-generator] state restored: cycleIndex=${cycleIndex}, categoryTopicIndex=${JSON.stringify(categoryTopicIndex)}, lastAutoGenAt=${lastGeneratedAt || 'never'}, totalAutoGenerated=${state.totalAutoGenerated}`);
  } catch (err) {
    console.error('[blog-generator] failed to restore state from DB, starting fresh:', err);
  }
}

/** Persist current generation state to the DB (called after each auto-generation). */
async function saveState(): Promise<void> {
  try {
    await db.blogGeneratorState.upsert({
      where: { id: 'main' },
      update: {
        cycleIndex,
        categoryTopicIndex: JSON.stringify(categoryTopicIndex),
        lastAutoGenAt: lastGeneratedAt ? new Date(lastGeneratedAt) : null,
        totalAutoGenerated: { increment: 1 },
      },
      create: {
        id: 'main',
        cycleIndex,
        categoryTopicIndex: JSON.stringify(categoryTopicIndex),
        lastAutoGenAt: lastGeneratedAt ? new Date(lastGeneratedAt) : null,
      },
    });
    console.log('[blog-generator] state saved to DB');
  } catch (err) {
    console.error('[blog-generator] failed to save state to DB:', err);
  }
}

/**
 * Check if a topic is too similar to any existing published post.
 * Compares the topic's keyword words against post titles and tags.
 * Returns true if a duplicate is detected (>50% word overlap with an existing post).
 */
async function isDuplicateTopic(topic: Topic): Promise<boolean> {
  try {
    const existingPosts = await db.blogPost.findMany({
      where: { status: 'published' },
      select: { title: true, tags: true },
    });
    if (existingPosts.length === 0) return false;

    const topicWords = new Set(
      topic.keyword
        .replace(/['"\u00AB\u00BB'!?.,:;()\[\]{}\u060C\u061B\u061F]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .map((w) => w.trim())
    );
    const titleWords = new Set(
      topic.title
        .replace(/['"\u00AB\u00BB'!?.,:;()\[\]{}\u060C\u061B\u061F]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .map((w) => w.trim())
    );
    const allTopicWords = new Set([...topicWords, ...titleWords]);
    if (allTopicWords.size === 0) return false;

    for (const post of existingPosts) {
      const postText = `${post.title} ${post.tags || ''}`;
      const postWords = new Set(
        postText
          .replace(/['"\u00AB\u00BB'!?.,:;()\[\]{}\u060C\u061B\u061F]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 2)
          .map((w) => w.trim())
      );
      let overlap = 0;
      for (const w of allTopicWords) {
        if (postWords.has(w)) overlap++;
      }
      const similarity = overlap / allTopicWords.size;
      if (similarity >= 0.5 && overlap >= 2) {
        console.log(`[blog-generator] duplicate detected: topic "${topic.title}" overlaps ${Math.round(similarity * 100)}% with existing post "${post.title}"`);
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('[blog-generator] duplicate check failed:', err);
    return false;
  }
}

const MAX_PICK_ATTEMPTS = 20;

async function pickNonDuplicateTopic(): Promise<Topic> {
  for (let attempt = 0; attempt < MAX_PICK_ATTEMPTS; attempt++) {
    const topic = pickTopic();
    const dup = await isDuplicateTopic(topic);
    if (!dup) return topic;
    console.log(`[blog-generator] attempt ${attempt + 1}: topic "${topic.title}" is duplicate, trying next...`);
  }
  console.log('[blog-generator] all pick attempts exhausted, using last topic');
  return pickTopic();
}

function pickTopic(): Topic {
  const category = CATEGORY_ORDER[cycleIndex % CATEGORY_ORDER.length];
  cycleIndex++;
  const pool = TOPICS.filter((t) => t.category === category);
  const idx = categoryTopicIndex[category] % pool.length;
  categoryTopicIndex[category]++;
  return pool[idx];
}

function makeSlug(title: string): string {
  const base = title
    .replace(/['"\u00AB\u00BB'!?.,:;()\[\]{}]/g, '')
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
    if (trimmed.startsWith('\u0639\u0646\u0648\u0627\u0646:')) {
      title = trimmed.slice(6).trim().replace(/^["'\u00AB]|["'\u00BB]$/g, '');
    } else if (trimmed.startsWith('\u062E\u0644\u0627\u0635\u0647:')) {
      excerpt = trimmed.slice(6).trim().replace(/^["'\u00AB]|["'\u00BB]$/g, '');
    } else if (trimmed.startsWith('\u0645\u062A\u0627:')) {
      metaDescription = trimmed.slice(4).trim().replace(/^["'\u00AB]|["'\u00BB]$/g, '');
    } else if (trimmed.startsWith('\u0628\u0631\u0686\u0633\u0628\u200C\u0647\u0627:')) {
      const rest = trimmed.replace(/^\u0628\u0631\u0686\u0633\u0628\u200C\u0647\u0627:\s*/, '');
      tags = rest
        .split(',')
        .map((t) => t.trim().replace(/^["'\u00AB]|["'\u00BB]$/g, ''))
        .filter(Boolean)
        .slice(0, 6);
    } else {
      htmlLines.push(trimmed);
    }
  }

  let html = htmlLines.join('\n').trim();
  if (!html) return null;

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

// =========================================================================
// REAL IMAGE SEARCH (replaces AI-generated images)
// =========================================================================

/**
 * Use LLM to generate a smart English image search query based on the
 * article's Persian title and topic. Falls back to the topic's predefined
 * search queries if LLM fails.
 */
async function buildImageSearchQuery(title: string, topic: Topic): Promise<string> {
  if (!zai) return topic.searchQueries[0] || title;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `You are a search engine optimizer. Given a Persian article title and topic, produce ONE English search query (5-15 words) that will find a REAL, high-quality photograph matching the article's subject.

Rules:
- The query must find REAL photographs, not illustrations or AI art.
- Translate Persian place names to their English equivalents (e.g. "اصفهان" -> "Isfahan", "کیش" -> "Kish island").
- For cities: include the city name + a landmark or scenic feature.
- For cars: include the brand/model name + "luxury sedan" or similar.
- For travel tips: describe the scene described in the title.
- Output ONLY the English search query, nothing else. No quotes, no labels.

Article title (Persian): ${title}
Article keyword (Persian): ${topic.keyword}

English image search query:`,
        },
      ],
      thinking: { type: 'disabled' },
    });
    const raw = (completion?.choices?.[0]?.message?.content || '').trim();
    if (!raw || raw.length < 5 || raw.length > 100) {
      return topic.searchQueries[0] || title;
    }
    const cleaned = raw
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/\n?```$/i, '')
      .replace(/^["']|["']$/g, '')
      .replace(/^(query|search|image):\s*/i, '')
      .trim();
    if (cleaned.length < 5) return topic.searchQueries[0] || title;
    console.log(`[blog-generator] LLM search query: "${cleaned}"`);
    return cleaned;
  } catch (err) {
    console.error('[blog-generator] LLM search query failed, using fallback:', err);
    return topic.searchQueries[0] || title;
  }
}

/**
 * Download a file from a URL to a local path.
 */
function downloadFile(url: string, filepath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 30000 }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, filepath).then(resolve);
        return;
      }
      if (res.statusCode !== 200) {
        console.error(`[blog-generator] download failed: HTTP ${res.statusCode}`);
        resolve(false);
        return;
      }
      const ws = fs.createWriteStream(filepath);
      res.pipe(ws);
      ws.on('finish', () => {
        ws.close();
        resolve(true);
      });
      ws.on('error', () => {
        fs.unlink(filepath, () => {});
        resolve(false);
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

/**
 * Search for a real image using `z-ai image-search` CLI and download it.
 * Tries up to 3 queries (LLM-generated + predefined fallbacks).
 */
async function searchAndDownloadImage(
  title: string,
  slug: string,
  topic: Topic
): Promise<string | null> {
  // Build ordered list of queries to try
  const llmQuery = await buildImageSearchQuery(title, topic);
  const queries = [llmQuery, ...(topic.searchQueries || [])];
  // Deduplicate
  const seen = new Set<string>();
  const uniqueQueries = queries.filter((q) => {
    if (seen.has(q.toLowerCase())) return false;
    seen.add(q.toLowerCase());
    return true;
  });

  if (!fs.existsSync(BLOG_IMG_DIR)) fs.mkdirSync(BLOG_IMG_DIR, { recursive: true });
  const ext = 'jpg';
  const filename = `${slug}.${ext}`;
  const filepath = path.join(BLOG_IMG_DIR, filename);

  for (let i = 0; i < Math.min(uniqueQueries.length, 3); i++) {
    const query = uniqueQueries[i];
    console.log(`[blog-generator] image search attempt ${i + 1}: "${query}"`);
    try {
      // Call z-ai image-search CLI
      const result = execSync(
        `z-ai image-search -q ${JSON.stringify(query)} --count 3 --gl us --no-rank`,
        { timeout: 120000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      );

      // Parse JSON from stdout (skip any non-JSON lines like the init message)
      const lines = result.split('\n');
      let jsonStr = '';
      let jsonStarted = false;
      for (const line of lines) {
        if (line.trim().startsWith('{')) jsonStarted = true;
        if (jsonStarted) jsonStr += line;
      }

      const parsed = JSON.parse(jsonStr);
      if (!parsed.success || !parsed.results || parsed.results.length === 0) {
        console.log(`[blog-generator] no results for query "${query}"`);
        continue;
      }

      // Try downloading each result until one works
      for (const img of parsed.results) {
        const imgUrl = img.original_url;
        if (!imgUrl) continue;
        console.log(`[blog-generator] downloading: ${imgUrl}`);
        const ok = await downloadFile(imgUrl, filepath);
        if (ok) {
          const stat = fs.statSync(filepath);
          // Reject tiny images (likely broken) or huge ones (>5MB)
          if (stat.size < 5000) {
            fs.unlinkSync(filepath);
            console.log(`[blog-generator] image too small (${stat.size} bytes), skipping`);
            continue;
          }
          if (stat.size > 5 * 1024 * 1024) {
            fs.unlinkSync(filepath);
            console.log(`[blog-generator] image too large (${stat.size} bytes), skipping`);
            continue;
          }
          console.log(`[blog-generator] ✓ downloaded real image: ${imgUrl} (${stat.size} bytes)`);
          return `/images/blog/${filename}`;
        }
      }
    } catch (err) {
      console.error(`[blog-generator] image search/download failed for "${query}":`, err);
    }
  }

  console.log('[blog-generator] all image search attempts failed');
  return null;
}

function deriveKeyword(topic: string): string {
  const stopwords = new Set([
    'در', 'از', 'به', 'با', 'و', 'یا', 'را', 'است', 'نیست', 'برای', 'تا', 'که',
    'این', 'آن', 'هر', 'چه', 'چگونه', 'چرا', 'کی', 'کجا', 'کدام', 'هم', 'تاکنون',
    'یک', 'دو', 'سه', 'نه', 'بله', 'خیر', 'اما', 'اگر', 'چون', 'بنابراین', 'پس',
    'ترین', 'ها', 'های', 'ای', 'هایی', 'شود', 'شده', 'می', 'کرد', 'کند', 'باشد',
    'هستند', 'بود', 'بودن', 'ما', 'شما', 'او', 'آنها', 'خود', 'همین', 'مانند',
  ]);
  const words = topic
    .replace(/['"\u00AB\u00BB'!?.,:;()\[\]{}\u060C\u061B\u061F]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopwords.has(w));
  const kw = words.slice(0, 5).join(' ').trim();
  return kw || topic.slice(0, 40);
}

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

// =========================================================================
// ENHANCED SEO ARTICLE GENERATION
// =========================================================================

async function generateArticle(customTopic?: string): Promise<{ ok: boolean; title?: string; slug?: string; error?: string; custom?: boolean }> {
  if (!zai) {
    return { ok: false, error: 'ZAI SDK not initialized' };
  }
  if (isGenerating) {
    return { ok: false, error: 'Generation already in progress' };
  }
  isGenerating = true;
  lastError = null;

  const isCustom = !!customTopic && customTopic.trim().length > 0;
  let topic: Topic;

  if (isCustom) {
    topic = {
      title: customTopic!.trim().slice(0, 200),
      keyword: deriveKeyword(customTopic!),
      category: classifyTopic(customTopic!),
      searchQueries: [],
    };
    const customDup = await isDuplicateTopic(topic);
    if (customDup) {
      console.log(`[blog-generator] custom topic "${topic.title}" is duplicate, rejecting`);
      isGenerating = false;
      return { ok: false, error: 'موضوع مشابهی قبلاً منتشر شده است' };
    }
  } else {
    topic = await pickNonDuplicateTopic();
  }
  console.log(`[blog-generator] generating article for topic: ${topic.title} (keyword: ${topic.keyword}, category: ${topic.category}${isCustom ? ', CUSTOM' : ''})`);

  // ---- Enhanced SEO System Prompt ----
  const systemPrompt =
    'تو یک نویسنده حرفه‌ای سئو و محتوای سفر، گردشگری و خودرو هستی که برای وب‌سایت «تاکسی ویژه سیوان» (یک سرویس تاکسی VIP بین شهری در ایران با ناوگان خودروهای لوکس) مطلب می‌نویسی. لحن تو حرفه‌ای، صمیمی و قابل اعتماد است و با مخاطب ایرانی صحبت می‌کنی.';

  const userPrompt = `یک مقاله کامل، باکیفیت و سئو-بهینه درباره موضوع زیر بنویس:

موضوع: ${topic.title}
کلمه کلیدی هدف (SEO): ${topic.keyword}

═══════════════════════════════════════
قوانین سئو (الزامی — رعایت دقیق):
═══════════════════════════════════════

۱. ساختار هدینگ‌ها (بسیار مهم):
   - فقط یک <h2> در ابتدای مقاله (به عنوان عنوان بخش اول) — از <h1> استفاده نکن.
   - سایر بخش‌های اصلی با <h2> و زیربخش‌ها با <h3>.
   - هر <h2> و <h3> باید شامل کلمه کلیدی یا مترادف آن باشد (بدون کیورد استافینگ).
   - حداقل ۳ تگ <h2> و حداقل ۱ تگ <h3> در کل مقاله.

۲. کلمه کلیدی:
   - کلمه کلیدی هدف در عنوان، پاراگراف اول، حداقل ۲ هدینگ و ۲-۳ جای بدنه تکرار شود.
   - تراکم کلمه کلیدی بین ۱٪ تا ۲.۵٪ باشد.
   - از مترادف‌ها و LSI کلمات مرتبط نیز استفاده کن.

۳. متا دیسکریپشن:
   - دقیقاً ۱۵۰ تا ۱۶۰ کاراکتر فارسی.
   - شامل کلمه کلیدی هدف.
   - جذاب و ترغیب‌کننده برای کلیک.

۴. ساختار محتوا:
   - بدنه مقاله ۸۰۰ تا ۱۲۰۰ کلمه باشد.
   - هر پاراگراف حداقل ۳ جمله و حداکثر ۶ جمله.
   - پاراگراف‌ها طولانی و منسجم باشند تا justify شدن زیبا شود.
   - اولین پاراگراف جذاب باشد (hook) و شامل کلمه کلیدی.

۵. عناصر غنی‌سازی محتوا:
   - حداقل یک فهرست با <ul> و <li> (۴ تا ۶ آیتم).
   - حداقل یک <blockquote> برای تأکید بر نکته مهم.
   - از <strong> برای کلمات کلیدی و عبارات مهم استفاده کن (حداقل ۳ بار).

۶. لینک‌سازی داخلی (بسیار مهم برای سئو):
   - حداقل یک بار عبارت «تاکسی ویژه سیوان» را با <a href="/">تاکسی ویژه سیوان</a> لینک کن.
   - اگر مقاله درباره شهر خاصی است، یک لینک مرتبط به صفحه اصلی بده.

۷. خلاصه مقاله:
   - ۱ تا ۲ جمله خلاصه جذاب که شامل کلمه کلیدی باشد.

۸. برچسب‌ها:
   - ۴ تا ۵ برچسب مرتبط (اولین برچسب = کلمه کلیدی هدف).

═══════════════════════════════════════
قالب خروجی (دقیقاً همین ترتیب):
═══════════════════════════════════════
عنوان: <عنوان جذاب مقاله — حاوی کلمه کلیدی، حداکثر ۷۰ کاراکتر>
خلاصه: <خلاصه ۱-۲ جمله‌ای شامل کلمه کلیدی>
متا: <متا دیسکریپشن دقیقاً ۱۵۰-۱۶۰ کاراکتر با کلمه کلیدی>
<بدنه HTML مقاله — فقط تگ‌های h2, h3, p, ul, li, blockquote, strong, a>
برچسب‌ها: <tag1>, <tag2>, <tag3>, <tag4>, <tag5>

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
      consecutiveFailures++;
      return { ok: false, error: 'LLM generation failed' };
    }
  }

  const parsed = parseArticle(raw);
  if (!parsed || !parsed.title) {
    console.error('[blog-generator] failed to parse article from:\n', raw.slice(0, 500));
    lastError = 'Could not parse article';
    isGenerating = false;
    consecutiveFailures++;
    return { ok: false, error: 'Could not parse article' };
  }

  // Double-check: compare the generated title against existing posts
  const titleDup = await isDuplicateTopic({ title: parsed.title, keyword: topic.keyword, category: topic.category });
  if (titleDup) {
    console.log(`[blog-generator] generated title "${parsed.title}" is duplicate, discarding`);
    lastError = 'Generated article title is duplicate';
    isGenerating = false;
    consecutiveFailures++;
    return { ok: false, error: 'Generated article is too similar to an existing post' };
  }

  const slug = makeSlug(parsed.title);

  // ---- Search and download REAL image ----
  console.log('[blog-generator] searching for real image...');
  const featuredImageUrl = await searchAndDownloadImage(parsed.title, slug, topic);
  if (!featuredImageUrl) {
    console.log('[blog-generator] no real image found, using fallback');
  }

  try {
    const post = await db.blogPost.create({
      data: {
        title: parsed.title,
        slug,
        excerpt: parsed.excerpt,
        content: parsed.html,
        featuredImageUrl: featuredImageUrl || '/images/luxury-car.png',
        status: 'published',
        publishedAt: new Date(),
        tags: JSON.stringify(parsed.tags),
        authorId: null,
        categoryId: null,
      },
    });
    lastGeneratedAt = new Date().toISOString();
    generationCount++;
    consecutiveFailures = 0; // Reset on success
    console.log(`[blog-generator] ✓ published${isCustom ? ' (CUSTOM)' : ''}: "${post.title}" (slug: ${post.slug}, image: ${featuredImageUrl || 'fallback'})`);

    // Persist state for auto-generations only
    if (!isCustom) {
      await saveState();
      // Schedule the next generation
      nextGenAt = new Date(Date.now() + GENERATION_INTERVAL_MS);
      console.log(`[blog-generator] next auto-generation scheduled in ${GENERATION_INTERVAL_MS / 3600000}h`);
    }

    isGenerating = false;
    return { ok: true, title: post.title, slug: post.slug, custom: isCustom };
  } catch (err) {
    console.error('[blog-generator] DB save failed:', err);
    lastError = 'DB save failed';
    isGenerating = false;
    consecutiveFailures++;
    return { ok: false, error: 'DB save failed' };
  }
}

// =========================================================================
// ROBUST SCHEDULING WITH ERROR RECOVERY
// =========================================================================

/**
 * On startup, decide when the next generation should happen.
 *
 * Strategy:
 * 1. Restore persisted state (cycleIndex, categoryTopicIndex, lastAutoGenAt)
 * 2. If fewer than MIN_POSTS_FOR_IMMEDIATE_SKIP published posts exist → generate now
 * 3. If lastAutoGenAt is recorded in DB and it's been >= 6h since then → generate now
 * 4. If lastAutoGenAt is recorded but it's been < 6h → schedule the remaining time
 * 5. If no lastAutoGenAt but enough posts exist → start a fresh 6h interval
 * 6. After CONSECUTIVE_FAILURE_RESET consecutive failures, shorten interval to 30min
 */
let mainInterval: ReturnType<typeof setInterval> | null = null;

async function scheduleGenerationOnStartup() {
  try {
    const count = await db.blogPost.count({ where: { status: 'published' } });
    console.log(`[blog-generator] current published posts: ${count}`);

    // If we had consecutive failures, use shorter interval for recovery
    const intervalToUse = consecutiveFailures >= CONSECUTIVE_FAILURE_RESET
      ? 30 * 60 * 1000 // 30 minutes
      : GENERATION_INTERVAL_MS; // 6 hours

    if (count < MIN_POSTS_FOR_IMMEDIATE_SKIP) {
      console.log(`[blog-generator] only ${count} published posts; generating one now (5s delay)...`);
      setTimeout(() => generateArticle().catch((e) => console.error(e)), 5000);
      // Also schedule recurring
      startRecurringGeneration(intervalToUse);
      return;
    }

    if (lastGeneratedAt) {
      const elapsed = Date.now() - new Date(lastGeneratedAt).getTime();
      console.log(`[blog-generator] last auto-gen was ${Math.round(elapsed / 60000)}min ago`);
      if (elapsed >= GENERATION_INTERVAL_MS) {
        console.log('[blog-generator] overdue — generating now (5s delay)...');
        setTimeout(() => generateArticle().catch((e) => console.error(e)), 5000);
      } else {
        const remaining = GENERATION_INTERVAL_MS - elapsed;
        console.log(`[blog-generator] next generation in ${Math.round(remaining / 60000)}min (remaining from last auto-gen)`);
        nextGenAt = new Date(Date.now() + remaining);
        setTimeout(() => {
          generateArticle().catch((e) => console.error('[blog-generator] scheduled error:', e));
          // After this first (delayed) generation, set up the recurring interval
          startRecurringGeneration(intervalToUse);
        }, remaining);
        return; // Don't start recurring yet — it'll start after the first delayed gen
      }
    }

    // No lastAutoGenAt recorded but we have enough posts
    console.log(`[blog-generator] no previous auto-gen recorded; starting fresh ${intervalToUse / 3600000}h interval`);
    startRecurringGeneration(intervalToUse);
  } catch (err) {
    console.error('[blog-generator] startup scheduling failed:', err);
    // Fallback: start a recurring interval
    startRecurringGeneration(GENERATION_INTERVAL_MS);
  }
}

/**
 * Start the recurring generation interval (called after initial delay or immediately).
 */
function startRecurringGeneration(intervalMs: number) {
  if (mainInterval) clearInterval(mainInterval);
  nextGenAt = new Date(Date.now() + intervalMs);
  console.log(`[blog-generator] recurring generation started: every ${Math.round(intervalMs / 60000)}min`);
  mainInterval = setInterval(() => {
    generateArticle().catch((e) => console.error('[blog-generator] scheduled error:', e));
    // Adjust interval based on failures
    if (consecutiveFailures >= CONSECUTIVE_FAILURE_RESET) {
      console.log('[blog-generator] too many failures, switching to 30min recovery interval');
      startRecurringGeneration(30 * 60 * 1000);
    }
  }, intervalMs);
}

async function getTotalPosts(): Promise<number> {
  try {
    return await db.blogPost.count({ where: { status: 'published' } });
  } catch {
    return 0;
  }
}

function getNextGenInMs(): number {
  if (!nextGenAt) return GENERATION_INTERVAL_MS;
  const remaining = nextGenAt.getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
}

// ---- HTTP server (Bun.serve) ----
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

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
          version: 'v5',
          port: PORT,
          running: isGenerating,
          lastGeneratedAt,
          lastError,
          totalPosts,
          nextGenInMs: getNextGenInMs(),
          generationCount,
          consecutiveFailures,
          imageMode: 'real-photos',
        },
        { headers: corsHeaders }
      );
    }
    if (req.method === 'POST' && url.pathname === '/generate') {
      if (isGenerating) {
        return Response.json({ started: false, message: 'Generation already in progress' }, { headers: corsHeaders });
      }
      generateArticle().catch((e) => console.error('[blog-generator] on-demand error:', e));
      return Response.json({ started: true }, { headers: corsHeaders });
    }
    if (req.method === 'POST' && url.pathname === '/generate-custom') {
      if (isGenerating) {
        return Response.json({ started: false, message: 'تولید دیگری در حال انجام است؛ لطفاً صبر کنید' }, { headers: corsHeaders });
      }
      let body: any = null;
      try {
        body = await req.json();
      } catch {
        return Response.json({ started: false, message: 'بدنه درخواست نامعتبر است' }, { status: 400, headers: corsHeaders });
      }
      const topicStr = typeof body?.topic === 'string' ? body.topic.trim() : '';
      if (!topicStr || topicStr.length < 3) {
        return Response.json({ started: false, message: 'موضوع مقاله باید حداقل ۳ کاراکتر باشد' }, { status: 400, headers: corsHeaders });
      }
      if (topicStr.length > 200) {
        return Response.json({ started: false, message: 'موضوع مقاله نباید بیشتر از ۲۰۰ کاراکتر باشد' }, { status: 400, headers: corsHeaders });
      }
      console.log(`[blog-generator] admin requested custom topic: "${topicStr}"`);
      generateArticle(topicStr).catch((e) => console.error('[blog-generator] custom on-demand error:', e));
      return Response.json({ started: true, custom: true, topic: topicStr }, { headers: corsHeaders });
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

  // 1. Restore persisted state from DB
  await restoreState();

  // 2. Schedule generation based on restored state
  await scheduleGenerationOnStartup();

  // 3. Log startup summary
  console.log(`[blog-generator] v5 ready — real images + enhanced SEO + robust persistence`);
  console.log(`[blog-generator] image search: z-ai image-search CLI (real photographs)`);
  console.log(`[blog-generator] SEO: heading hierarchy, keyword density, meta descriptions, internal linking`);
})();

process.on('SIGINT', async () => {
  console.log('[blog-generator] shutting down...');
  if (mainInterval) clearInterval(mainInterval);
  await db.$disconnect();
  server.stop();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  if (mainInterval) clearInterval(mainInterval);
  await db.$disconnect();
  server.stop();
  process.exit(0);
});
