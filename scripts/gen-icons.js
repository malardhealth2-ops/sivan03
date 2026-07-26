/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const path = require('path');

const pub = path.join(process.cwd(), 'public');
const logo = path.join(pub, 'logo.png');

async function gen() {
  // 512x512 standard
  await sharp(logo)
    .resize(460, 460, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .flatten({ background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .extend({ top: 26, bottom: 26, left: 26, right: 26, background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .resize(512, 512, { fit: 'fill' })
    .png()
    .toFile(path.join(pub, 'icon-512.png'));
  console.log('icon-512.png done');

  // 192x192 standard
  await sharp(logo)
    .resize(172, 172, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .flatten({ background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .extend({ top: 10, bottom: 10, left: 10, right: 10, background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .resize(192, 192, { fit: 'fill' })
    .png()
    .toFile(path.join(pub, 'icon-192.png'));
  console.log('icon-192.png done');

  // Maskable 512 (logo ~60% centered, safe zone)
  const r512 = await sharp(logo).resize(300, 300, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } }).flatten({ background: { r: 10, g: 10, b: 10, alpha: 1 } }).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } } })
    .composite([{ input: r512, gravity: 'center' }])
    .png()
    .toFile(path.join(pub, 'icon-maskable-512.png'));
  console.log('icon-maskable-512.png done');

  // Maskable 192
  const r192 = await sharp(logo).resize(115, 115, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } }).flatten({ background: { r: 10, g: 10, b: 10, alpha: 1 } }).png().toBuffer();
  await sharp({ create: { width: 192, height: 192, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } } })
    .composite([{ input: r192, gravity: 'center' }])
    .png()
    .toFile(path.join(pub, 'icon-maskable-192.png'));
  console.log('icon-maskable-192.png done');

  // Apple touch icon 180x180
  await sharp(logo)
    .resize(160, 160, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .flatten({ background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .extend({ top: 10, bottom: 10, left: 10, right: 10, background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .resize(180, 180, { fit: 'fill' })
    .png()
    .toFile(path.join(pub, 'apple-touch-icon.png'));
  console.log('apple-touch-icon.png done');

  // Favicon 32x32
  await sharp(logo).resize(32, 32, { fit: 'cover' }).png().toFile(path.join(pub, 'favicon-32.png'));
  console.log('favicon-32.png done');

  console.log('ALL ICONS GENERATED');
}
gen().catch(e => { console.error(e); process.exit(1); });
