import { db } from './lib/db';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // ═══════════════════════════════════════════
    // 1. Site Settings
    // ═══════════════════════════════════════════
    console.log('📋 Seeding SiteSettings...');
    await db.siteSettings.upsert({
      where: { id: 'main' },
      update: {},
      create: {
        id: 'main',
        siteName: 'تاکسی ویژه سیوان',
        phone1: '09109419743',
        phone2: '09368816807',
        email: 'info@sivantaxi.com',
        address: 'تهران، خیابان ولیعصر',
        aboutText:
          'تاکسی ویژه سیوان با بیش از ۵ سال سابقه در ارائه خدمات حمل و نقل بین شهری VIP، بهترین تجربه سفر را برای شما فراهم می‌کند.',
        commissionRate: 10.0,
        minWithdrawal: 500000,
        workingHours: '۲۴ ساعته - ۷ روز هفته',
      },
    });
    console.log('  ✅ SiteSettings seeded');

    // ═══════════════════════════════════════════
    // 2. Popular Routes (clean + re-seed)
    // ═══════════════════════════════════════════
    console.log('🗺️  Seeding PopularRoutes...');
    await db.popularRoute.deleteMany();
    await db.popularRoute.createMany({
      data: [
        { origin: 'تهران', destination: 'تبریز', price: 1200000, duration: '۶ ساعت', isPopular: true, sortOrder: 1 },
        { origin: 'تهران', destination: 'اصفهان', price: 800000, duration: '۴ ساعت', isPopular: true, sortOrder: 2 },
        { origin: 'تهران', destination: 'شیراز', price: 1500000, duration: '۸ ساعت', isPopular: true, sortOrder: 3 },
        { origin: 'تهران', destination: 'مشهد', price: 1800000, duration: '۹ ساعت', isPopular: true, sortOrder: 4 },
        { origin: 'تهران', destination: 'رشت', price: 900000, duration: '۵ ساعت', isPopular: true, sortOrder: 5 },
        { origin: 'تهران', destination: 'کرمانشاه', price: 1100000, duration: '۶ ساعت', isPopular: true, sortOrder: 6 },
      ],
    });
    console.log('  ✅ 6 PopularRoutes seeded');

    // ═══════════════════════════════════════════
    // 3. Testimonials (clean + re-seed)
    // ═══════════════════════════════════════════
    console.log('💬 Seeding Testimonials...');
    await db.testimonial.deleteMany();
    await db.testimonial.createMany({
      data: [
        {
          name: 'علی محمدی',
          rating: 5,
          comment: 'سفر فوق‌العاده‌ای بود. راننده بسیار مؤدب و حرفه‌ای بود. خودرو تمیز و راحت بود.',
          tripRoute: 'تهران - اصفهان',
          isApproved: true,
        },
        {
          name: 'سارا احمدی',
          rating: 5,
          comment: 'بهترین تجربه سفر بین شهری که داشتم. قیمت مناسب و کیفیت عالی.',
          tripRoute: 'تهران - شیراز',
          isApproved: true,
        },
        {
          name: 'رضا کریمی',
          rating: 4,
          comment: 'خدمات عالی و راننده خوش‌برخورد. حتماً دوباره استفاده می‌کنم.',
          tripRoute: 'تهران - تبریز',
          isApproved: true,
        },
        {
          name: 'مریم حسینی',
          rating: 5,
          comment: 'رزرو آنلاین بسیار راحت بود و ماشین در دقیق آمده بود. ممنون از تیم سیوان.',
          tripRoute: 'تهران - رشت',
          isApproved: true,
        },
        {
          name: 'حسین رضایی',
          rating: 5,
          comment: 'برای سفرهای کاری همیشه از سیوان استفاده می‌کنم. قابل اعتماد و حرفه‌ای.',
          tripRoute: 'تهران - مشهد',
          isApproved: true,
        },
        {
          name: 'فاطمه نوری',
          rating: 4,
          comment: 'اولین تجربه سفر با تاکسی VIP بود و واقعاً لذت بردم. پیشنهاد می‌کنم.',
          tripRoute: 'تهران - کرمانشاه',
          isApproved: true,
        },
      ],
    });
    console.log('  ✅ 6 Testimonials seeded');

    // ═══════════════════════════════════════════
    // 4. Blog Categories (clean + re-seed)
    // ═══════════════════════════════════════════
    console.log('📂 Seeding BlogCategories...');
    await db.blogCategory.deleteMany();
    const categories = await db.blogCategory.createMany({
      data: [
        { name: 'راهنمای سفر', slug: 'travel-guide' },
        { name: 'معرفی شهرها', slug: 'city-guide' },
        { name: 'نکات ایمنی', slug: 'safety-tips' },
      ],
    });
    console.log('  ✅ 3 BlogCategories seeded');

    // ═══════════════════════════════════════════
    // 5. Blog Posts (clean + re-seed)
    // ═══════════════════════════════════════════
    console.log('📝 Seeding BlogPosts...');
    await db.blogPost.deleteMany();

    const travelGuideCat = await db.blogCategory.findUnique({ where: { slug: 'travel-guide' } });
    const safetyTipsCat = await db.blogCategory.findUnique({ where: { slug: 'safety-tips' } });
    const adminUser = await db.user.findFirst({ where: { role: 'admin' } });

    const blogPosts = [
      {
        title: 'تاکسی VIP چیست و چه تفاوتی با تاکسی معمولی دارد؟',
        slug: 'what-is-vip-taxi',
        excerpt: 'در این مقاله با مفهوم تاکسی VIP و تفاوت‌های آن با تاکسی معمولی آشنا می‌شوید.',
        content: `# تاکسی VIP چیست و چه تفاوتی با تاکسی معمولی دارد؟

تاکسی VIP یا تاکسی ویژه یکی از خدمات حمل و نقل مدرن است که با هدف ارائه تجربه سفر لوکس و راحت به مسافران طراحی شده است. در سال‌های اخیر، با افزایش تقاضا برای سفرهای بین شهری با کیفیت بالا، خدمات تاکسی VIP به یکی از پرطرفدارترین گزینه‌های سفر تبدیل شده است.

## تفاوت‌های اصلی تاکسی VIP با تاکسی معمولی

### ۱. کیفیت خودرو
در تاکسی VIP، خودروهای استفاده شده معمولاً از برندهای لوکس و نیمه‌لوکس مانند سوناتا، کمری، مرسدس بنز و بی‌ام‌و هستند. این خودروها همواره در بهترین وضعیت فنی و ظاهری قرار دارند و امکاناتی مانند صندلی‌های چرمی، سیستم تهویه مطبوع پیشرفته و پنل‌های سرگرمی دارند.

### ۲. مهارت و تخصص راننده
رانندگان تاکسی VIP آموزش‌های تخصصی دیده‌اند و تجربه زیادی در سفرهای بین شهری دارند. آن‌ها با مسیرهای مختلف آشنا هستند، به قوانین رانندگی پایبندند و برخورد بسیار حرفه‌ای و محترمانه‌ای با مسافران دارند.

### ۳. راحتی و امنیت
تاکسی‌های VIP مجهز به سیستم‌های ایمنی پیشرفته هستند و بیمه‌نامه‌های جامعی دارند. همچنین امکان ردیابی آنلاین مسیر سفر و ارتباط مستقیم با پشتیبانی وجود دارد.

### ۴. قیمت‌گذاری شفاف
یکی از مزایای مهم تاکسی VIP، قیمت‌گذاری شفاف و مشخص از ابتدای سفر است. هیچ هزینه پنهانی وجود ندارد و مسافر دقیقاً می‌داند چه مبلغی باید پرداخت کند.

### ۵. رزرو آسان
با استفاده از اپلیکیشن یا وب‌سایت تاکسی VIP، می‌توانید در کمتر از چند دقیقه سفر خود را رزرو کنید و زمان و محل دقیق Pickup را مشخص نمایید.

## چرا تاکسی ویژه سیوان؟

تاکسی ویژه سیوان با بیش از ۵ سال سابقه در ارائه خدمات حمل و نقل بین شهری VIP، بهترین تجربه سفر را برای شما فراهم می‌کند. ما با تیمی از رانندگان حرفه‌ای و ناوگان مدرن، آماده خدمت‌رسانی به شما هستیم. رزرو آنلاین آسان، پشتیبانی ۲۴ ساعته و قیمت‌گذاری رقابتی از مزایای اصلی ماست.

اگر به دنبال یک سفر راحت، ایمن و لوکس هستید، همین حالا سفر خود را با سیوان رزرو کنید.`,
        categoryId: travelGuideCat?.id,
        authorId: adminUser?.id,
        status: 'published',
        publishedAt: new Date(),
      },
      {
        title: 'چرا تاکسی ویژه سیوان بهترین انتخاب برای سفر است',
        slug: 'why-choose-sivan',
        excerpt: 'با مزایای استفاده از تاکسی ویژه سیوان آشنا شوید و دلیل انتخاب هزاران مسافر را بدانید.',
        content: `# چرا تاکسی ویژه سیوان بهترین انتخاب برای سفر است

انتخاب وسیله نقلیه مناسب برای سفرهای بین شهری همیشه یکی از دغدغه‌های اصلی مسافران است. با توجه به گزینه‌های مختلفی که وجود دارد، از اتوبوس و قطار تا هواپیما و خودروی شخصی، تاکسی ویژه سیوان به عنوان یک گزینه متمایز شناخته می‌شود.

## مزایای انتخاب تاکسی ویژه سیوان

### ۱. ناوگان مدرن و متنوع
سیوان با ناوگانی از خودروهای لوکس شامل سوناتا، کمری، مرسدس بنز و خودروهای برقی، گزینه‌های متنوعی برای سلیقه‌ها و بودجه‌های مختلف ارائه می‌دهد. تمامی خودروها به صورت منظم سرویس و بازرسی می‌شوند.

### ۲. رانندگان حرفه‌ای و قابل اعتماد
تمام رانندگان سیوان پس از طی فرآیند سخت‌گیرانه استخدام، آموزش‌های تخصصی دیده‌اند. بررسی سوابق، آزمون‌های رانندگی و ارزیابی‌های دوره‌ای از جمله اقداماتی است که برای تضمین کیفیت خدمات انجام می‌دهیم.

### ۳. رزرو آنلاین در چند مرحله ساده
با سیستم رزرو آنلاین سیوان، تنها در ۵ مرحله ساده می‌توانید سفر خود را ثبت کنید. انتخاب مبدا و مقصد، تعیین زمان، انتخاب نوع خودرو، وارد کردن اطلاعات و در نهایت پرداخت آنلاین یا نقدی.

### ۴. پشتیبانی ۲۴ ساعته
تیم پشتیبانی سیوان در تمام ساعات شبانه‌روز آماده پاسخگویی به سوالات و رفع مشکلات شماست. از لحظه رزرو تا پایان سفر، ما در کنار شما هستیم.

### ۵. قیمت‌گذاری رقابتی و شفاف
سیوان با حذف واسطه‌ها و بهینه‌سازی مسیرها، قیمت‌های رقابتی ارائه می‌دهد. تمام هزینه‌ها از ابتدا مشخص هستند و هیچ هزینه اضافه‌ای نخواهید پرداخت.

### ۶. بیمه جامع مسافری
تمامی سفرهای سیوان تحت پوشش بیمه جامع مسافری هستند و در صورت بروز هرگونه مشکل، خسارت شما جبران خواهد شد.

### ۷. راحتی درب به درب
برخلاف سایر وسایل نقلیه، تاکسی VIP سیوان شما را از درب منزل تا مقصد مورد نظرتان حمل می‌کند. نیازی به رفتن به ایستگاه یا فرودگاه نیست.

## نظرات مسافران ما
بیش از ۱۵,۰۰۰ مسافر راضی، میانگین امتیاز ۴.۹ از ۵ و پوشش بیش از ۵۰ شهر، نشان‌دهنده اعتماد هزاران مسافر به خدمات سیوان است.

همین حالا اولین سفر خود را با سیوان تجربه کنید و تفاوت را احساس نمایید.`,
        categoryId: travelGuideCat?.id,
        authorId: adminUser?.id,
        status: 'published',
        publishedAt: new Date(),
      },
      {
        title: 'نکات مهم برای سفر ایمن بین شهری',
        slug: 'intercity-travel-safety-tips',
        excerpt: 'با رعایت این نکات مهم، سفر ایمن و مطمئنی بین شهری داشته باشید.',
        content: `# نکات مهم برای سفر ایمن بین شهری

سفر بین شهری همواره نیازمند برنامه‌ریزی و رعایت نکات ایمنی است. چه با تاکسی VIP، چه با خودروی شخصی و چه با وسایل نقلیه عمومی، رعایت اصول ایمنی می‌تواند تجربه سفر شما را بسیار بهتر کند.

## نکات ایمنی قبل از سفر

### ۱. برنامه‌ریزی مسیر
قبل از شروع سفر، مسیر خود را بررسی کنید. از وضعیت جاده‌ها و آب‌وهوا مطلع شوید و در صورت لزوم مسیر جایگزین انتخاب نمایید. استفاده از اپلیکیشن‌های مسیریاب می‌تواند بسیار کمک‌کننده باشد.

### ۲. آماده‌سازی وسایل ضروری
همیشه یک کیت اضطراری شامل آب، خوراکی، داروی مورد نیاز، شارژر موبایل و لباس گرم همراه داشته باشید. در سفرهای زمستانی، زنجیر چرخ و ملحفه اضطراری نیز ضروری است.

### ۳. اطلاع‌رسانی به خانواده
قبل از حرکت، مقصد و زمان تقریبی رسیدن خود را به اعضای خانواده یا دوستان اطلاع دهید.

## نکات ایمنی حین سفر

### ۴. استفاده از کمربند ایمنی
استفاده از کمربند ایمنی برای تمام سرنشینان، چه در صندلی جلو و چه در صندلی عقب، الزامی است. این کار خطر آسیب در تصادفات را به میزان قابل توجهی کاهش می‌دهد.

### ۵. استراحت منظم
در سفرهای طولانی، هر ۲ ساعت یک‌بار توقف کنید و کمی قدم بزنید. خستگی راننده یکی از عوامل اصلی حوادث جاده‌ای است.

### ۶. انتخاب شرکت معتبر
هنگام رزرو تاکسی بین شهری، حتماً از شرکت‌های معتبر و دارای مجوز استفاده کنید. بررسی نظرات مسافران قبلی و اطمینان از بیمه بودن سفر بسیار مهم است.

### ۷. رعایت قوانین راهنمایی و رانندگی
سرعت مطمئنه، فاصله طولی مناسب با خودروی جلویی و رعایت تابلوها از اصول اساسی ایمنی جاده‌ای هستند.

## نکات ویژه برای سفر با تاکسی VIP

### ۸. بررسی هویت راننده
قبل از سوار شدن، مطمئن شوید که راننده با اطلاعات ثبت شده در سیستم مطابقت دارد.

### ۹. اشتراک‌گذاری موقعیت
از قابلیت اشتراک‌گذاری مسیر زنده با خانواده استفاده کنید تا آن‌ها بتوانند سفر شما را پیگیری کنند.

### ۱۰. تماس با پشتیبانی
در هرگونه مشکل یا نگرانی، بلافاصله با خط پشتیبانی شرکت تماس بگیرید. تیم پشتیبانی سیوان به صورت ۲۴ ساعته در خدمت شماست.

با رعایت این نکات ساده اما مهم، می‌توانید سفر ایمن و لذت‌بخشی را تجربه کنید. تیم سیوان تلاش می‌کند تا هر سفر شما تجربه‌ای فراموش‌نشدنی باشد.`,
        categoryId: safetyTipsCat?.id,
        authorId: adminUser?.id,
        status: 'published',
        publishedAt: new Date(),
      },
    ];

    for (const post of blogPosts) {
      await db.blogPost.create({ data: post });
    }
    console.log('  ✅ 3 BlogPosts seeded');

    // ═══════════════════════════════════════════
    // 6. Sample Users (clean + re-seed)
    // ═══════════════════════════════════════════
    console.log('👤 Seeding Users...');
    // Delete dependent records first
    const driverUser = await db.user.findFirst({ where: { phone: '09987654321' } });
    if (driverUser) {
      await db.vehicle.deleteMany({ where: { driverId: driverUser.driver?.id } });
      await db.driver.deleteMany({ where: { userId: driverUser.id } });
    }
    const passengerUser = await db.user.findFirst({ where: { phone: '09123456789' } });
    if (passengerUser) {
      await db.passenger.deleteMany({ where: { userId: passengerUser.id } });
    }

    await db.user.deleteMany({
      where: {
        OR: [
          { phone: '09123456789' },
          { phone: '09987654321' },
          { phone: '09111111111' },
        ],
      },
    });

    // Create passenger
    const userPassenger = await db.user.create({
      data: {
        phone: '09123456789',
        fullName: 'علی محمدی',
        role: 'passenger',
        isVerified: true,
        passenger: {
          create: {
            referralCode: 'ALI-MOH-001',
          },
        },
      },
    });

    // Create driver with vehicle
    const userDriver = await db.user.create({
      data: {
        phone: '09987654321',
        fullName: 'رضا کریمی',
        role: 'driver',
        isVerified: true,
        driver: {
          create: {
            nationalId: '1234567890',
            verificationStatus: 'approved',
            vehicle: {
              create: {
                brand: 'هیوندای',
                model: 'سوناتا',
                year: 2022,
                color: 'مشکی',
                plateNumber: '11الف123',
                type: 'sedan',
              },
            },
          },
        },
      },
    });

    // Create admin
    const userAdmin = await db.user.create({
      data: {
        phone: '09111111111',
        fullName: 'مدیر سیستم',
        role: 'admin',
        isVerified: true,
      },
    });

    console.log('  ✅ 3 Users seeded (passenger, driver, admin)');
    console.log('  ✅ Driver vehicle created (هیوندای سوناتا)');

    // ═══════════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════════
    console.log('\n✅ Seed completed successfully!');
    console.log('   - 1 SiteSettings');
    console.log('   - 6 PopularRoutes');
    console.log('   - 6 Testimonials');
    console.log('   - 3 BlogCategories');
    console.log('   - 3 BlogPosts (published)');
    console.log('   - 3 Users (passenger, driver, admin)');
    console.log('   - 1 Vehicle (هیوندای سوناتا)');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

seed();
