/**
 * Icon Generator for PWA / Google Play Store
 *
 * Usage: node scripts/generate-icons.js [path-to-source-icon.png]
 *
 * If no source icon is provided, generates placeholder icons with the DeMar logo.
 * For production, provide a high-resolution (512x512+) PNG source icon.
 *
 * Requirements: npm install sharp
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

if (!existsSync(ICONS_DIR)) {
  mkdirSync(ICONS_DIR, { recursive: true });
}

// Try to use sharp if available, otherwise generate SVG-based placeholders
async function generateIcons() {
  const sourceIcon = process.argv[2];

  try {
    const sharp = (await import('sharp')).default;

    if (sourceIcon) {
      console.log(`Generating icons from: ${sourceIcon}`);
      for (const size of SIZES) {
        await sharp(sourceIcon)
          .resize(size, size)
          .png()
          .toFile(join(ICONS_DIR, `icon-${size}x${size}.png`));
        console.log(`  ✓ icon-${size}x${size}.png`);
      }
    } else {
      console.log('No source icon provided. Generating placeholder icons...');
      console.log('For production, run: node scripts/generate-icons.js path/to/logo.png');
      await generatePlaceholders(sharp);
    }
  } catch {
    console.log('sharp not installed. Generating SVG placeholders...');
    console.log('For proper icons, run: npm install sharp && node scripts/generate-icons.js logo.png');
    generateSvgPlaceholders();
  }
}

async function generatePlaceholders(sharp) {
  for (const size of SIZES) {
    const fontSize = Math.round(size * 0.3);
    const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#1a1a2e"/>
      <text x="50%" y="55%" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">DM</text>
    </svg>`;

    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(join(ICONS_DIR, `icon-${size}x${size}.png`));
    console.log(`  ✓ icon-${size}x${size}.png`);
  }
}

function generateSvgPlaceholders() {
  // Generate minimal valid PNGs using a simple approach
  for (const size of SIZES) {
    const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#1a1a2e"/>
      <text x="50%" y="55%" font-family="Arial,sans-serif" font-size="${Math.round(size * 0.3)}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">DM</text>
    </svg>`;
    writeFileSync(join(ICONS_DIR, `icon-${size}x${size}.svg`), svg);
    console.log(`  ✓ icon-${size}x${size}.svg (SVG placeholder - convert to PNG for production)`);
  }
}

generateIcons().catch(console.error);
