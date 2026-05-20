/**
 * Regenerate PNG/ICO from public/favicon.svg
 * Run: npm install -D sharp to-ico && node scripts/generate-favicons.mjs
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = join(root, 'public/favicon.svg');

const buf16 = await sharp(svg).resize(16, 16).png().toBuffer();
const buf32 = await sharp(svg).resize(32, 32).png().toBuffer();
const buf180 = await sharp(svg).resize(180, 180).png().toBuffer();

writeFileSync(join(root, 'public/favicon-16.png'), buf16);
writeFileSync(join(root, 'public/favicon-32.png'), buf32);
writeFileSync(join(root, 'public/apple-touch-icon.png'), buf180);

// Minimal ICO: header + two PNG entries (16 + 32) — use sharp's multi-size or to-ico
const { default: toIco } = await import('to-ico');
const ico = await toIco([buf16, buf32]);
writeFileSync(join(root, 'public/favicon.ico'), ico);

console.log('Generated favicon.ico, favicon-16.png, favicon-32.png, apple-touch-icon.png');
