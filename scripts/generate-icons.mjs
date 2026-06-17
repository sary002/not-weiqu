// scripts/generate-icons.mjs
// v2.0.7.8 (ADR-004 PWA) 生成多尺寸 PNG 图标
// 来自 logo.svg → 各尺寸 PNG（含 apple-touch-icon）
// 运行：node scripts/generate-icons.mjs

import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// 各平台 / 设备需要的尺寸
const ICON_SIZES = [
  // PWA 标准
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  // Apple Touch Icon (iOS 主屏)
  { size: 180, name: 'apple-touch-icon.png' },
  // Android Chrome
  { size: 36, name: 'icon-36.png' },
  { size: 48, name: 'icon-48.png' },
  { size: 72, name: 'icon-72.png' },
  { size: 96, name: 'icon-96.png' },
  { size: 144, name: 'icon-144.png' },
  { size: 152, name: 'icon-152.png' },
  { size: 256, name: 'icon-256.png' },
  { size: 384, name: 'icon-384.png' },
  { size: 1024, name: 'icon-1024.png' },
];

async function main() {
  console.log('[generate-icons] Reading logo.svg...');
  const logoSvg = await readFile(join(PUBLIC_DIR, 'logo.svg'), 'utf-8');

  console.log('[generate-icons] Generating PNG icons...');
  let count = 0;
  for (const { size, name } of ICON_SIZES) {
    const buffer = await sharp(Buffer.from(logoSvg), {
      density: 384, // 高密度渲染保证锐利
    })
      .resize(size, size, { fit: 'contain', background: { r: 250, g: 247, b: 242, alpha: 0 } })
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();

    await writeFile(join(PUBLIC_DIR, name), buffer);
    console.log(`  ✓ ${name} (${size}x${size}, ${(buffer.length / 1024).toFixed(1)}KB)`);
    count++;
  }

  // Maskable icon（带 safe zone padding，Logo 缩放到 80%）
  console.log('[generate-icons] Generating maskable icon (512x512 with 80% safe zone)...');
  const maskableSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 100 120">
      <rect width="100" height="120" fill="#FAF7F2"/>
      <g transform="translate(10, 12) scale(0.8)">
        ${logoSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
      </g>
    </svg>
  `;
  const maskableBuf = await sharp(Buffer.from(maskableSvg), { density: 384 })
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  await writeFile(join(PUBLIC_DIR, 'icon-maskable.png'), maskableBuf);
  console.log(`  ✓ icon-maskable.png (512x512, ${(maskableBuf.length / 1024).toFixed(1)}KB)`);

  console.log(`\n[generate-icons] Done. Generated ${count + 1} PNG icons.`);
}

main().catch((e) => {
  console.error('[generate-icons] Failed:', e);
  process.exit(1);
});
