import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const routes = [
  { origin: 'تهران', destination: 'مشهد', distanceKm: 900, duration: '~۹ ساعت', tripType: 'vip', sortOrder: 1 },
  { origin: 'تهران', destination: 'اصفهان', distanceKm: 436, duration: '~۴ ساعت', tripType: 'vip', sortOrder: 2 },
  { origin: 'تهران', destination: 'تبریز', distanceKm: 628, duration: '~۶ ساعت', tripType: 'vip', sortOrder: 3 },
  { origin: 'تهران', destination: 'شیراز', distanceKm: 934, duration: '~۸ ساعت', tripType: 'luxury', sortOrder: 4 },
  { origin: 'تهران', destination: 'رشت', distanceKm: 375, duration: '~۵ ساعت', tripType: 'economy', sortOrder: 5 },
  { origin: 'تهران', destination: 'کرمانشاه', distanceKm: 525, duration: '~۶ ساعت', tripType: 'vip', sortOrder: 6 },
];

async function main() {
  const existing = await db.popularRoute.count();
  if (existing === 0) {
    for (const r of routes) {
      await db.popularRoute.create({ data: { ...r, price: 0, isPopular: true } });
    }
    console.log('Seeded ' + routes.length + ' popular routes');
  } else {
    const all = await db.popularRoute.findMany();
    for (const r of all) {
      const match = routes.find(m => m.origin === r.origin && m.destination === r.destination);
      if (match) {
        await db.popularRoute.update({ where: { id: r.id }, data: { distanceKm: match.distanceKm, duration: match.duration || r.duration, tripType: match.tripType } });
      }
    }
    console.log('Updated ' + all.length + ' existing popular routes');
  }
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
