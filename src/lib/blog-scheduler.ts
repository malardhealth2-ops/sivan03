/**
 * Integrated Blog Scheduler — runs INSIDE the Next.js process
 *
 * Unlike the standalone mini-service (port 3005), this module is imported
 * via instrumentation.ts and starts automatically whenever the Next.js
 * server boots (including after deploy). No separate process to manage.
 *
 * Uses the same generation logic (LLM + z-ai image-search) but with
 * fully-async operations (no execSync) so it never blocks the server.
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { db } from '@/lib/db';

const GENERATION_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MIN_POSTS_FOR_IMMEDIATE_SKIP = 3;
const CONSECUTIVE_FAILURE_RESET = 5;

// ---- Singleton state (persists across requests in the same process) ----
let isGenerating = false;
let lastGeneratedAt: string | null = null;
let lastError: string | null = null;
let nextGenAt: Date | null = null;
let consecutiveFailures = 0;
let generationCount = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;
let zai: any = null;

// ---- Topic pool (same as mini-service) ----
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
  searchQueries: string[];
}

const TOPICS: Topic[] = [
  { title: 'جاذبه‌های گردشگری مشهد که هر مسافری باید ببیند', keyword: 'جاذبه‌های گردشگری مشهد', category: 'tourism', searchQueries: ['Mashhad Imam Reza shrine golden dome Iran', 'Mashhad city skyline Iran pilgrimage'] },
  { title: 'زیبایی‌های شیراز؛ شهر گل و شب‌نما', keyword: 'جاذبه‌های گردشگری شیراز', category: 'tourism', searchQueries: ['Shiraz Nasir al-Mulk pink mosque Iran', 'Shiraz Eram garden beautiful Persian garden'] },
  { title: 'اصفهان شهر نصف جهان؛ راهنمای گردشگری', keyword: 'گردشگری اصفهان', category: 'tourism', searchQueries: ['Isfahan Si-o-se-pol bridge Zayandeh river Iran', 'Isfahan Naqsh-e Jahan square beautiful Iranian architecture'] },
  { title: 'تابستان در نوشهر و چالوس؛ بهترین مسیر فرار از گرما', keyword: 'گردشگری نوشهر و چالوس', category: 'tourism', searchQueries: ['Noshahr Caspian Sea coast Iran summer', 'Chalous road northern Iran forest mountain'] },
  { title: 'جزیره کیش؛ بهشت گردشگری در خلیج فارس', keyword: 'گردشگری کیش', category: 'tourism', searchQueries: ['Kish island Persian Gulf beach resort Iran', 'Kish island coral beach turquoise water'] },
  { title: 'جزیره قشم و عجایب طبیعی آن', keyword: 'گردشگری قشم', category: 'tourism', searchQueries: ['Qeshm island Hengam dolphin Iran', 'Qeshm island valley of stars geological formations'] },
  { title: 'ماسوله؛ روستای پلکانی تاریخ ایران', keyword: 'گردشگری ماسوله', category: 'tourism', searchQueries: ['Masouleh village stepped architecture Iran', 'Masouleh colorful houses mountain village Gilan'] },
  { title: 'تبریز در یک روز؛ بازار، مسجد کبود و قهوه‌خانه‌ها', keyword: 'گردشگری تبریز', category: 'tourism', searchQueries: ['Tabriz Blue Mosque Azerbaijan Iran', 'Tabriz historic bazaar UNESCO Iran'] },
  { title: 'دریاچه نمک مهابان و عجایب مسیر تهران-قم', keyword: 'دریاچه نمک قم', category: 'tourism', searchQueries: ['Salt lake desert Iran Qom highway', 'Mesr desert salt flats Iran landscape'] },
  { title: 'بهترین فصل سفر به شمال ایران برای دیدن طبیعت', keyword: 'بهترین فصل سفر به شمال', category: 'tourism', searchQueries: ['Northern Iran lush green forest spring', 'Gilan province rice fields Hyrcanian forest'] },
  { title: 'یزد شهر بادگیرها و کویر نقره‌ای', keyword: 'گردشگری یزد', category: 'tourism', searchQueries: ['Yazd wind towers desert city Iran', 'Yazd old town mud brick architecture adobe'] },
  { title: 'کرمان و دل کویر؛ راهنمای سفر به گنبد فتح‌آباد', keyword: 'گردشگری کرمان', category: 'tourism', searchQueries: ['Kerman Ganjali Khan bathhouse Iran', 'Kerman desert Kalut sand formations Shahdad'] },
  { title: 'امکانات خودرو لوکس که کیفیت سفر را متحول می‌کند', keyword: 'امکانات خودرو لوکس', category: 'luxury-cars', searchQueries: ['luxury car interior premium leather seats ambient lighting', 'luxury sedan dashboard technology premium features'] },
  { title: 'چرا صندلی چرمی در سفرهای طولانی مهم است؟', keyword: 'صندلی چرمی خودرو لوکس', category: 'luxury-cars', searchQueries: ['premium leather car seat luxury interior detail', 'luxury car leather upholstery stitching detail'] },
  { title: 'عایق صدا در خودرو لوکس و تأثیر آن بر آرامش سفر', keyword: 'عایق صدا خودرو', category: 'luxury-cars', searchQueries: ['luxury car quiet cabin sound insulation', 'premium car interior silent ride comfort'] },
  { title: 'سیستم تهویه مطبوع در خودروهای لوکس؛ فراتر از کولر', keyword: 'تهویه خودرو لوکس', category: 'luxury-cars', searchQueries: ['luxury car climate control dual zone', 'premium car air conditioning vents modern'] },
  { title: 'مرسدس بنز کلاس E؛ پادشاه جاده‌های ایران', keyword: 'مرسدس بنز کلاس E', category: 'luxury-cars', searchQueries: ['Mercedes-Benz E-Class black sedan luxury', 'Mercedes E-Class W213 front view elegant'] },
  { title: 'بی‌ام‌و سری ۵؛ ترکیب اسپرت و لوکس برای سفر', keyword: 'بی ام و سری 5', category: 'luxury-cars', searchQueries: ['BMW 5 Series sedan luxury black', 'BMW 5 Series interior premium dashboard'] },
  { title: 'آئودی A6 و جذابیت طراحی آلمان در جاده‌های ایران', keyword: 'آئودی A6', category: 'luxury-cars', searchQueries: ['Audi A6 sedan luxury black front', 'Audi A6 interior virtual cockpit premium'] },
  { title: 'تویوتا لندکروزر؛ بهترین همراه جاده‌های کوهستانی', keyword: 'تویوتا لندکروزر', category: 'luxury-cars', searchQueries: ['Toyota Land Cruiser black SUV offroad', 'Toyota Land Cruiser desert road Iran'] },
  { title: 'هیوندای سوناتا؛ لوکس اما اقتصادی برای سفر خانوادگی', keyword: 'هیوندای سوناتا', category: 'luxury-cars', searchQueries: ['Hyundai Sonata sedan silver modern', 'Hyundai Sonata interior family car comfortable'] },
  { title: 'سیستم تعلیق در خودروهای لوکس و راحتی سرنشینان', keyword: 'سیستم تعلیق خودرو', category: 'luxury-cars', searchQueries: ['luxury car air suspension smooth ride', 'premium car suspension system comfort'] },
  { title: 'ایمنی فعال در خودروهای لوکس؛ از ترمز ABS تا کیسه هوا', keyword: 'ایمنی خودرو لوکس', category: 'luxury-cars', searchQueries: ['car safety features ABS airbag modern', 'luxury car advanced safety technology'] },
  { title: 'طراحی داخلی خودرو لوکس؛ فضایی که خستگی را فراموش می‌کنید', keyword: 'طراحی داخلی خودرو لوکس', category: 'luxury-cars', searchQueries: ['luxury car interior design premium wood trim', 'premium sedan cabin elegant lighting night'] },
  { title: 'خودرو لوکس یا اقتصادی؟ کدام برای سفر بین شهری بهتر است', keyword: 'خودرو لوکس یا اقتصادی', category: 'luxury-vs-economy', searchQueries: ['luxury sedan vs economy car comparison', 'black luxury car and small car side by side'] },
  { title: 'هزینه پنهان سفر با خودرو اقتصادی که نمی‌بینید', keyword: 'هزینه سفر خودرو اقتصادی', category: 'luxury-vs-economy', searchQueries: ['old economy car breakdown roadside', 'worn out car interior uncomfortable seats'] },
  { title: 'چرا خودرو لوکس در جاده‌های طولانی ارزشش را دارد؟', keyword: 'ارزش خودرو لوکس سفر', category: 'luxury-vs-economy', searchQueries: ['luxury car highway driving comfortable long distance', 'premium sedan open road sunset golden hour'] },
  { title: 'مقایسه راحتی خودرو لوکس و پراید در سفر تهران-مشهد', keyword: 'راحتی خودرو لوکس پراید', category: 'luxury-vs-economy', searchQueries: ['Iran highway long road Tehran Mashhad', 'luxury black car driving on Iranian highway'] },
  { title: 'خستگی راننده در خودرو اقتصادی vs خودرو لوکس', keyword: 'خستگی راننده خودرو', category: 'luxury-vs-economy', searchQueries: ['tired driver holding steering wheel road trip', 'comfortable driver relaxed luxury car driving'] },
  { title: 'ایمنی خودرو لوکس در برابر خودرو اقتصادی؛ تفاوت فاجعه‌بار', keyword: 'ایمنی لوکس اقتصادی', category: 'luxury-vs-economy', searchQueries: ['car crash test safety rating comparison', 'luxury car crumple zone safety technology'] },
  { title: 'فضای داخلی و چمدان؛ برتری خودرو لوکس در سفر خانوادگی', keyword: 'فضای داخلی خودرو سفر', category: 'luxury-vs-economy', searchQueries: ['luxury car spacious trunk luggage family trip', 'family loading suitcases into premium SUV'] },
  { title: 'راهنمای کامل سفر تهران به مشهد با خودرو', keyword: 'سفر تهران به مشهد', category: 'travel-guide', searchQueries: ['Tehran to Mashhad highway Iran road trip', 'Iran highway desert landscape long road'] },
  { title: 'سفر تهران به اصفهان؛ مسیر، توقف‌ها و جاذبه‌ها', keyword: 'سفر تهران به اصفهان', category: 'travel-guide', searchQueries: ['Tehran to Isfahan road Iran highway', 'Iranian highway mountain scenery desert'] },
  { title: 'سفر تهران به شیراز از جاده قدیم و جدید', keyword: 'سفر تهران به شیراز', category: 'travel-guide', searchQueries: ['Tehran to Shiraz road Iran landscape', 'Iran southern road mountains desert scenic'] },
  { title: 'سفر تهران به رشت و انزلی؛ راهنمای جاده هراز', keyword: 'سفر تهران به رشت', category: 'travel-guide', searchQueries: ['Haraz road Iran mountain forest green', 'Rasht Anzali Caspian Sea coast Iran'] },
  { title: 'سفر تهران به تبریز از جاده قزوین-زنجان', keyword: 'سفر تهران به تبریز', category: 'travel-guide', searchQueries: ['Tehran to Tabriz highway Iran landscape', 'Zanjan Soltaniyeh dome Iran road trip'] },
  { title: 'مسیر تهران به کیش؛ پرواز یا سفر زمینی؟', keyword: 'سفر تهران به کیش', category: 'travel-guide', searchQueries: ['Kish island aerial view beach Persian Gulf', 'airplane flying over Iranian island resort'] },
  { title: 'راهنمای بسته‌بندی چمدان برای سفر بین شهری', keyword: 'بسته‌بندی چمدان سفر', category: 'travel-tips', searchQueries: ['packed travel suitcase with essentials organized', 'luxury car trunk open with luggage'] },
  { title: 'مدیریت خستگی در سفرهای طولانی بین شهری', keyword: 'خستگی در سفر بین شهری', category: 'travel-tips', searchQueries: ['road trip rest stop coffee break', 'driver resting at highway service area'] },
  { title: 'بهترین زمان استراحت در جاده؛ هر چند ساعت یک‌بار؟', keyword: 'استراحت در جاده', category: 'travel-tips', searchQueries: ['highway rest area stop Iran road trip', 'scenic roadside stop mountains Iran'] },
  { title: 'سفر با کودکان؛ راهنمای آرامش خانواده در جاده', keyword: 'سفر با کودکان', category: 'travel-tips', searchQueries: ['family road trip children happy in car', 'kids looking out car window road trip'] },
  { title: 'چگونه زمان سفر را برای ترافیک کمتر برنامه‌ریزی کنیم', keyword: 'زمان سفر ترافیک', category: 'travel-tips', searchQueries: ['empty highway scenic Iran no traffic', 'early morning road trip beautiful sunrise'] },
  { title: 'نکات کلیدی ایمنی سفر بین شهری در شب', keyword: 'ایمنی سفر شب', category: 'safety', searchQueries: ['car driving at night highway lights Iran', 'luxury car headlights road night safe driving'] },
  { title: 'چک‌لیست ایمنی خودرو پیش از سفر طولانی', keyword: 'چک لیست ایمنی خودرو', category: 'safety', searchQueries: ['mechanic checking car before road trip', 'car tire inspection service station'] },
  { title: 'چرا تاکسی ویژه سیوان انتخاب هوشمندانه‌ای است', keyword: 'تاکسی ویژه سیوان', category: 'sivan-brand', searchQueries: ['black luxury sedan fleet line up premium', 'professional chauffeur opening luxury car door'] },
  { title: 'تفاوت تاکسی دربستی سیوان با آژانس‌های معمولی', keyword: 'تاکسی دربستی سیوان', category: 'sivan-brand', searchQueries: ['luxury private car service premium', 'black executive sedan VIP transport'] },
  { title: 'هزینه سفر با تاکسی VIP چگونه محاسبه می‌شود', keyword: 'هزینه تاکسی VIP', category: 'sivan-brand', searchQueries: ['luxury taxi service premium car city', 'VIP car service transparent pricing professional'] },
];

const CATEGORY_ORDER: TopicCategory[] = [
  'tourism', 'luxury-cars', 'luxury-vs-economy', 'travel-guide',
  'tourism', 'luxury-cars', 'travel-tips', 'luxury-vs-economy',
  'tourism', 'luxury-cars', 'sivan-brand', 'travel-guide', 'safety',
];

let cycleIndex = 0;
const categoryTopicIndex: Record<TopicCategory, number> = {
  tourism: 0, 'luxury-cars': 0, 'luxury-vs-economy': 0,
  'travel-guide': 0, 'travel-tips': 0, safety: 0, 'sivan-brand': 0,
};

// ---- Helpers ----
const BLOG_IMG_DIR = path.join(process.cwd(), 'public', 'images', 'blog');

async function restoreState() {
  try {
    let state = await db.blogGeneratorState.findUnique({ where: { id: 'main' } });
    if (!state) {
      state = await db.blogGeneratorState.create({ data: { id: 'main' } });
      console.log('[blog-scheduler] created initial DB state row');
    }
    cycleIndex = state.cycleIndex;
    const parsed = JSON.parse(state.categoryTopicIndex || '{}');
    for (const cat of Object.keys(categoryTopicIndex) as TopicCategory[]) {
      if (typeof parsed[cat] === 'number') categoryTopicIndex[cat] = parsed[cat];
    }
    if (state.lastAutoGenAt) lastGeneratedAt = state.lastAutoGenAt.toISOString();
    console.log(`[blog-scheduler] state restored: cycle=${cycleIndex}, lastGen=${lastGeneratedAt || 'never'}, total=${state.totalAutoGenerated}`);
  } catch (err) {
    console.error('[blog-scheduler] restoreState failed:', err);
  }
}

async function saveState() {
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
        id: 'main', cycleIndex,
        categoryTopicIndex: JSON.stringify(categoryTopicIndex),
        lastAutoGenAt: lastGeneratedAt ? new Date(lastGeneratedAt) : null,
      },
    });
  } catch (err) {
    console.error('[blog-scheduler] saveState failed:', err);
  }
}

async function isDuplicateTopic(topic: Topic): Promise<boolean> {
  try {
    const existing = await db.blogPost.findMany({ where: { status: 'published' }, select: { title: true, tags: true } });
    if (!existing.length) return false;
    const tw = new Set(topic.keyword.replace(/[\u00AB\u00BB'!?.,:;()\[\]{}\u060C\u061B\u061F]/g, ' ').split(/\s+/).filter(w => w.length > 2));
    const ttw = new Set(topic.title.replace(/[\u00AB\u00BB'!?.,:;()\[\]{}\u060C\u061B\u061F]/g, ' ').split(/\s+/).filter(w => w.length > 2));
    const all = new Set([...tw, ...ttw]);
    if (!all.size) return false;
    for (const p of existing) {
      const pw = new Set(`${p.title} ${p.tags || ''}`.replace(/[\u00AB\u00BB'!?.,:;()\[\]{}\u060C\u061B\u061F]/g, ' ').split(/\s+/).filter(w => w.length > 2));
      let ov = 0; for (const w of all) if (pw.has(w)) ov++;
      if (ov / all.size >= 0.5 && ov >= 2) return true;
    }
    return false;
  } catch { return false; }
}

function pickTopic(): Topic {
  const cat = CATEGORY_ORDER[cycleIndex % CATEGORY_ORDER.length];
  cycleIndex++;
  const pool = TOPICS.filter(t => t.category === cat);
  const idx = categoryTopicIndex[cat] % pool.length;
  categoryTopicIndex[cat]++;
  return pool[idx];
}

async function pickNonDuplicateTopic(): Promise<Topic> {
  for (let i = 0; i < 20; i++) {
    const t = pickTopic();
    if (!(await isDuplicateTopic(t))) return t;
  }
  return pickTopic();
}

function makeSlug(title: string): string {
  const base = title.replace(/[\u00AB\u00BB'!?.,:;()\[\]{}]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 60);
  return `${base}-${Date.now().toString(36).slice(-6)}`;
}

function parseArticle(raw: string) {
  if (!raw) return null;
  const lines = raw.split('\n');
  let title = '', excerpt = '', metaDescription = '', tags: string[] = [];
  const htmlLines: string[] = [];
  for (const line of lines) {
    const t = line.trim(); if (!t) continue;
    if (t.startsWith('\u0639\u0646\u0648\u0627\u0646:')) title = t.slice(6).trim().replace(/^["'\u00AB]|["'\u00BB]$/g, '');
    else if (t.startsWith('\u062E\u0644\u0627\u0635\u0647:')) excerpt = t.slice(6).trim().replace(/^["'\u00AB]|["'\u00BB]$/g, '');
    else if (t.startsWith('\u0645\u062A\u0627:')) metaDescription = t.slice(4).trim().replace(/^["'\u00AB]|["'\u00BB]$/g, '');
    else if (t.startsWith('\u0628\u0631\u0686\u0633\u0628\u200C\u0647\u0627:')) {
      const rest = t.replace(/^\u0628\u0631\u0686\u0633\u0628\u200C\u0647\u0627:\s*/, '');
      tags = rest.split(',').map(s => s.trim().replace(/^["'\u00AB]|["'\u00BB]$/g, '')).filter(Boolean).slice(0, 6);
    } else htmlLines.push(t);
  }
  let html = htmlLines.join('\n').trim();
  if (!html) return null;
  if (!/<[a-z][\s\S]*>/i.test(html)) html = html.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('\n');
  if (!title) { const h = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i); title = h ? h[1].replace(/<[^>]+>/g, '').trim() : html.slice(0, 60).replace(/<[^>]+>/g, ''); }
  if (!excerpt) { const f = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i); excerpt = f ? f[1].replace(/<[^>]+>/g, '').trim().slice(0, 180) : title; }
  if (!metaDescription) metaDescription = excerpt.slice(0, 155);
  if (!tags.length) tags = ['\u0633\u0641\u0631', '\u062A\u0627\u06A9\u0633\u06CC VIP', '\u0633\u06CC\u0648\u0627\u0646'];
  return { title, excerpt, html, tags, metaDescription };
}

// ---- Async image search (non-blocking) ----
function execFileAsync(cmd: string, args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

function downloadFile(url: string, filepath: string): Promise<boolean> {
  return new Promise(resolve => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 30000 }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, filepath).then(resolve);
        return;
      }
      if (res.statusCode !== 200) { resolve(false); return; }
      const ws = fs.createWriteStream(filepath);
      res.pipe(ws);
      ws.on('finish', () => { ws.close(); resolve(true); });
      ws.on('error', () => { try { fs.unlinkSync(filepath); } catch {} resolve(false); });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function buildImageSearchQuery(title: string, topic: Topic): Promise<string> {
  if (!zai) return topic.searchQueries[0] || title;
  try {
    const c = await zai.chat.completions.create({
      messages: [{ role: 'user', content: `You are a search engine optimizer. Given a Persian article title, produce ONE English search query (5-15 words) for finding a REAL photograph.
Rules: translate Persian place names to English, be specific. Output ONLY the query, nothing else.

Title: ${title}
Keyword: ${topic.keyword}

English search query:` }],
      thinking: { type: 'disabled' },
    });
    const raw = (c?.choices?.[0]?.message?.content || '').trim().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').replace(/^["']|["']$/g, '').replace(/^(query|search|image):\s*/i, '').trim();
    return (raw.length >= 5 && raw.length <= 100) ? raw : topic.searchQueries[0] || title;
  } catch { return topic.searchQueries[0] || title; }
}

async function searchAndDownloadImage(title: string, slug: string, topic: Topic): Promise<string | null> {
  const llmQuery = await buildImageSearchQuery(title, topic);
  const queries = [llmQuery, ...(topic.searchQueries || [])];
  const seen = new Set<string>();
  const unique = queries.filter(q => { const l = q.toLowerCase(); if (seen.has(l)) return false; seen.add(l); return true; });
  if (!fs.existsSync(BLOG_IMG_DIR)) fs.mkdirSync(BLOG_IMG_DIR, { recursive: true });
  const ext = 'jpg';
  const filepath = path.join(BLOG_IMG_DIR, `${slug}.${ext}`);
  for (let i = 0; i < Math.min(unique.length, 3); i++) {
    const q = unique[i];
    console.log(`[blog-scheduler] image search ${i + 1}: "${q}"`);
    try {
      const result = await execFileAsync('z-ai', ['image-search', '-q', q, '--count', '3', '--gl', 'us', '--no-rank'], 120000);
      const lines = result.split('\n');
      let jsonStr = ''; let started = false;
      for (const line of lines) { if (line.trim().startsWith('{')) started = true; if (started) jsonStr += line; }
      const parsed = JSON.parse(jsonStr);
      if (!parsed.success || !parsed.results?.length) continue;
      for (const img of parsed.results) {
        if (!img.original_url) continue;
        const ok = await downloadFile(img.original_url, filepath);
        if (ok) {
          const stat = fs.statSync(filepath);
          if (stat.size < 5000 || stat.size > 5 * 1024 * 1024) { try { fs.unlinkSync(filepath); } catch {} continue; }
          console.log(`[blog-scheduler] ✓ real image: ${img.original_url} (${stat.size}b)`);
          return `/images/blog/${slug}.${ext}`;
        }
      }
    } catch (err) {
      console.error(`[blog-scheduler] image search failed for "${q}":`, err);
    }
  }
  return null;
}

// ---- Article generation ----
async function generateArticle(customTopic?: string): Promise<{ ok: boolean; title?: string; error?: string }> {
  if (!zai) return { ok: false, error: 'ZAI SDK not initialized' };
  if (isGenerating) return { ok: false, error: 'Generation in progress' };
  isGenerating = true;
  lastError = null;

  const isCustom = !!customTopic?.trim();
  let topic: Topic;
  if (isCustom) {
    topic = { title: customTopic!.trim().slice(0, 200), keyword: deriveKeyword(customTopic!), category: classifyTopic(customTopic!), searchQueries: [] };
    if (await isDuplicateTopic(topic)) { isGenerating = false; return { ok: false, error: 'موضوع مشابهی قبلاً منتشر شده' }; }
  } else {
    topic = await pickNonDuplicateTopic();
  }
  console.log(`[blog-scheduler] generating: ${topic.title} (${topic.category}${isCustom ? ', CUSTOM' : ''})`);

  const systemPrompt = 'تو یک نویسنده حرفه‌ای سئو و محتوای سفر، گردشگری و خودرو هستی که برای وب‌سایت «تاکسی ویژه سیوان» (یک سرویس تاکسی VIP بین شهری در ایران با ناوگان خودروهای لوکس) مطلب می‌نویسی. لحن تو حرفه‌ای، صمیمی و قابل اعتماد است و با مخاطب ایرانی صحبت می‌کنی.';
  const userPrompt = `یک مقاله کامل، باکیفیت و سئو-بهینه درباره موضوع زیر بنویس:

موضوع: ${topic.title}
کلمه کلیدی هدف (SEO): ${topic.keyword}

قوانین سئو (الزامی):
۱. ساختار هدینگ: فقط <h2> (حداقل ۳ عدد) و <h3> (حداقل ۱ عدد) — از <h1> استفاده نکن.
۲. کلمه کلیدی در عنوان، پاراگراف اول، حداقل ۲ هدینگ و ۲-۳ جای بدنه. تراکم ۱-۲.۵٪.
۳. متا دیسکریپشن: دقیقاً ۱۵۰-۱۶۰ کاراکتر شامل کلمه کلیدی.
۴. بدنه: ۸۰۰-۱۲۰۰ کلمه. هر پاراگراف ۳-۶ جمله.
۵. حداقل یک <ul> با ۴-۶ آیتم، یک <blockquote>، حداقل ۳ <strong>.
۶. حداقل یک <a href="/">تاکسی ویژه سیوان</a>.
۷. ۴-۵ برچسب مرتبط (اولی = کلمه کلیدی).

قالب خروجی:
عنوان: <عنوان جذاب حداکثر ۷۰ کاراکتر>
خلاصه: <خلاصه ۱-۲ جمله شامل کلمه کلیدی>
متا: <متا دیسکریپشن ۱۵۰-۱۶۰ کاراکتر>
<بدنه HTML: فقط h2, h3, p, ul, li, blockquote, strong, a>
برچسب‌ها: <tag1>, <tag2>, <tag3>, <tag4>, <tag5>

مقاله را بنویس:`;

  let raw = '';
  try {
    const c = await zai.chat.completions.create({ messages: [{ role: 'assistant', content: systemPrompt }, { role: 'user', content: userPrompt }], thinking: { type: 'disabled' } });
    raw = c?.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('[blog-scheduler] LLM failed, retrying:', err);
    try {
      const r = await zai.chat.completions.create({ messages: [{ role: 'assistant', content: systemPrompt }, { role: 'user', content: userPrompt }], thinking: { type: 'disabled' } });
      raw = r?.choices?.[0]?.message?.content || '';
    } catch (err2) { console.error('[blog-scheduler] LLM retry failed:', err2); lastError = 'LLM failed'; isGenerating = false; consecutiveFailures++; return { ok: false, error: 'LLM failed' }; }
  }

  const parsed = parseArticle(raw);
  if (!parsed?.title) { lastError = 'Parse failed'; isGenerating = false; consecutiveFailures++; return { ok: false, error: 'Parse failed' }; }
  if (await isDuplicateTopic({ title: parsed.title, keyword: topic.keyword, category: topic.category })) { lastError = 'Duplicate'; isGenerating = false; consecutiveFailures++; return { ok: false, error: 'Duplicate' }; }

  const slug = makeSlug(parsed.title);
  const featuredImageUrl = await searchAndDownloadImage(parsed.title, slug, topic);

  try {
    await db.blogPost.create({ data: { title: parsed.title, slug, excerpt: parsed.excerpt, content: parsed.html, featuredImageUrl: featuredImageUrl || '/images/luxury-car.png', status: 'published', publishedAt: new Date(), tags: JSON.stringify(parsed.tags) } });
    lastGeneratedAt = new Date().toISOString();
    generationCount++;
    consecutiveFailures = 0;
    console.log(`[blog-scheduler] ✓ published: "${parsed.title}" (img: ${featuredImageUrl || 'fallback'})`);
    if (!isCustom) { await saveState(); scheduleNext(); }
    isGenerating = false;
    return { ok: true, title: parsed.title };
  } catch (err) {
    console.error('[blog-scheduler] DB save failed:', err);
    lastError = 'DB failed'; isGenerating = false; consecutiveFailures++;
    return { ok: false, error: 'DB failed' };
  }
}

function deriveKeyword(topic: string): string {
  const sw = new Set(['در','از','به','با','و','یا','را','است','نیست','برای','تا','که','این','آن','هر','چه','چگونه','چرا','کی','کجا','کدام','هم','تاکنون','یک','دو','سه','نه','بله','خیر','اما','اگر','چون','بنابراین','پس','ترین','ها','های','ای','هایی','شود','شده','می','کرد','کند','باشد','هستند','بود','بودن','ما','شما','او','آنها','خود','همین','مانند']);
  const w = topic.replace(/[\u00AB\u00BB'!?.,:;()\[\]{}\u060C\u061B\u061F]/g, ' ').split(/\s+/).filter(x => x.length > 1 && !sw.has(x)).slice(0, 5).join(' ').trim();
  return w || topic.slice(0, 40);
}

function classifyTopic(topic: string): TopicCategory {
  const t = topic.toLowerCase();
  if (/(گردشگري|گردشگری|جاذبه|دیدنی|طبیعت|تاریخی|مسجد|بازار|روستا|جزیره|ساحل|کوه|جنگل|کویر|شمال|جنوب|کیش|قشم|مشهد|شیراز|اصفهان|تبریز|یزد|رشت|نوشهر|چالوس|کرمان|ماسوله)/.test(t)) return 'tourism';
  if (/(مرسدس|بنز|بی ام و|bmw|آئودی|audi|تویوتا|لندکروزر|هیوندای|سوناتا|خودرو لوکس|صندلی|چرمی|تعلیق|ایمنی|ترمز|کیسه هوا|داخلی|کابین|امکانات خودرو)/.test(t)) return 'luxury-cars';
  if (/(اقتصادی|لوکس در برابر|مقایسه|پراید|تیبا|سایپا|هزینه پنهان|ارزش خودرو|خستگی راننده|بریتری)/.test(t)) return 'luxury-vs-economy';
  if (/(بسته‌بندی|چمدان|خستگی|استراحت|کودکان|ترافیک|نکات عملی|آمادگی)/.test(t)) return 'travel-tips';
  if (/(ایمنی|بی‌خطر|تصادف|کمربند|ایمنی سفر|شب|چک‌لیست)/.test(t)) return 'safety';
  if (/(سیوان|دربستی|آژانس|هزینه تاکسی|قیمت|رزرو|اپلیکیشن|برند سیوان)/.test(t)) return 'sivan-brand';
  return 'travel-guide';
}

// ---- Scheduling ----
function scheduleNext() {
  const interval = consecutiveFailures >= CONSECUTIVE_FAILURE_RESET ? 30 * 60 * 1000 : GENERATION_INTERVAL_MS;
  nextGenAt = new Date(Date.now() + interval);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    generateArticle().catch(e => console.error('[blog-scheduler] scheduled error:', e));
  }, interval);
  console.log(`[blog-scheduler] next generation in ${Math.round(interval / 60000)}min`);
}

async function scheduleOnStartup() {
  try {
    const count = await db.blogPost.count({ where: { status: 'published' } });
    console.log(`[blog-scheduler] published posts: ${count}`);
    const interval = consecutiveFailures >= CONSECUTIVE_FAILURE_RESET ? 30 * 60 * 1000 : GENERATION_INTERVAL_MS;

    if (count < MIN_POSTS_FOR_IMMEDIATE_SKIP) {
      console.log(`[blog-scheduler] < ${MIN_POSTS_FOR_IMMEDIATE_SKIP} posts, generating now (10s delay)...`);
      setTimeout(() => generateArticle().catch(e => console.error(e)), 10000);
      scheduleNext();
      return;
    }
    if (lastGeneratedAt) {
      const elapsed = Date.now() - new Date(lastGeneratedAt).getTime();
      if (elapsed >= GENERATION_INTERVAL_MS) {
        console.log(`[blog-scheduler] overdue (${Math.round(elapsed / 3600000)}h), generating now (10s delay)...`);
        setTimeout(() => generateArticle().catch(e => console.error(e)), 10000);
      } else {
        const remaining = GENERATION_INTERVAL_MS - elapsed;
        console.log(`[blog-scheduler] next in ${Math.round(remaining / 60000)}min`);
        nextGenAt = new Date(Date.now() + remaining);
        timer = setTimeout(() => {
          generateArticle().catch(e => console.error(e));
          scheduleNext();
        }, remaining);
        return;
      }
    }
    console.log(`[blog-scheduler] fresh start, interval ${Math.round(interval / 3600000)}h`);
    scheduleNext();
  } catch (err) {
    console.error('[blog-scheduler] startup scheduling failed:', err);
    scheduleNext();
  }
}

// ---- Public API ----
export function getStatus() {
  return {
    ok: true, service: 'blog-scheduler', version: 'integrated', running: isGenerating,
    lastGeneratedAt, lastError, generationCount, consecutiveFailures, imageMode: 'real-photos',
    nextGenInMs: nextGenAt ? Math.max(0, nextGenAt.getTime() - Date.now()) : GENERATION_INTERVAL_MS,
  };
}

export async function triggerGenerate(customTopic?: string) {
  return generateArticle(customTopic);
}

// ---- Init (called from instrumentation.ts) ----
export async function init() {
  if (started) { console.log('[blog-scheduler] already started, skipping'); return; }
  started = true;
  console.log('[blog-scheduler] initializing integrated blog scheduler...');
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    zai = await ZAI.create();
    console.log('[blog-scheduler] ZAI SDK ready');
  } catch (err) {
    console.error('[blog-scheduler] ZAI SDK init failed:', err);
  }
  await restoreState();
  await scheduleOnStartup();
  console.log('[blog-scheduler] ✓ started — articles will be generated automatically');
}
