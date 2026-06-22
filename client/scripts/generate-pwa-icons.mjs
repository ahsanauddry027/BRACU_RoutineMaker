/**
 * Generates PWA icons from public/bracu.png.
 * Run with: node scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const src = join(publicDir, 'bracu.png');
const BG = '#0f172a'; // matches the app's dark theme

async function transparentIcon(size, out) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(publicDir, out));
  console.log('✓', out);
}

async function solidIcon(size, out, padRatio = 1) {
  // padRatio < 1 leaves a safe margin (used for maskable icons)
  const inner = Math.round(size * padRatio);
  const logo = await sharp(src)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(join(publicDir, out));
  console.log('✓', out);
}

await transparentIcon(192, 'pwa-192x192.png');
await transparentIcon(512, 'pwa-512x512.png');
await solidIcon(512, 'pwa-maskable-512x512.png', 0.7); // safe-zone padding for Android masks
await solidIcon(180, 'apple-touch-icon.png', 0.85); // iOS home-screen icon (no transparency)
console.log('Done.');
