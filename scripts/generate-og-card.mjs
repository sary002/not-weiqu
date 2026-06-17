// scripts/generate-og-card.mjs
// v2.0.7.8 (ADR-004 PWA + 社交分享) 生成 OG / Twitter 卡片
// 尺寸 1200×630（OG 标准）
// 设计：鼠尾草绿背景 + 仙人掌 Logo + Slogan + 短描述
// 运行：node scripts/generate-og-card.mjs

import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// 设计 SVG（1200×630）
// 鼠尾草绿背景 + 仙人掌 Logo + Slogan
const ogCardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <!-- 鼠尾草绿渐变背景 -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#9CAF88"/>
      <stop offset="100%" stop-color="#7E9863"/>
    </linearGradient>
    <!-- 仙人掌阴影 -->
    <radialGradient id="shadow" cx="0.5" cy="0.5">
      <stop offset="0%" stop-color="#000" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- 背景 -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- 装饰圆点（左下，右上） -->
  <circle cx="80" cy="560" r="40" fill="#FAF7F2" opacity="0.08"/>
  <circle cx="160" cy="500" r="20" fill="#FAF7F2" opacity="0.1"/>
  <circle cx="1120" cy="80" r="60" fill="#FAF7F2" opacity="0.06"/>
  <circle cx="1040" cy="140" r="25" fill="#FAF7F2" opacity="0.08"/>

  <!-- 仙人掌 Logo（放大版，居中偏左） -->
  <g transform="translate(150, 165) scale(2.5)">
    <!-- 阴影 -->
    <ellipse cx="50" cy="115" rx="35" ry="6" fill="url(#shadow)"/>
    <!-- 主体柱身 -->
    <rect x="33" y="22" width="34" height="84" rx="14" ry="14" fill="#FAF7F2"/>
    <!-- 顶部红果 -->
    <circle cx="50" cy="18" r="8" fill="#D67D6A"/>
    <!-- 高光 -->
    <rect x="38" y="30" width="4" height="60" rx="2" ry="2" fill="#B7C9A3" opacity="0.6"/>
    <!-- 刺点 -->
    <circle cx="50" cy="48" r="1.4" fill="#7E9863" opacity="0.55"/>
    <circle cx="50" cy="62" r="1.4" fill="#7E9863" opacity="0.55"/>
    <circle cx="50" cy="76" r="1.4" fill="#7E9863" opacity="0.55"/>
    <circle cx="50" cy="90" r="1.4" fill="#7E9863" opacity="0.55"/>
  </g>

  <!-- 品牌名 -->
  <text x="500" y="240" font-family="'Source Han Serif SC', 'Songti SC', serif"
        font-size="96" font-weight="700" fill="#FAF7F2">不委屈</text>

  <!-- Slogan -->
  <text x="500" y="340" font-family="'Source Han Sans SC', 'PingFang SC', sans-serif"
        font-size="42" font-weight="500" fill="#FAF7F2" opacity="0.95">
    帮善良的人学会有锋芒
  </text>

  <!-- 短描述 -->
  <text x="500" y="410" font-family="'Source Han Sans SC', 'PingFang SC', sans-serif"
        font-size="24" font-weight="400" fill="#FAF7F2" opacity="0.8">
    AI 成长陪伴 · 12 步刻意练习 · 温和连击 · 低压力模式
  </text>

  <!-- URL -->
  <text x="500" y="540" font-family="monospace" font-size="22"
        fill="#FAF7F2" opacity="0.7">notwei.quotwait.me</text>

  <!-- 右下角品牌标记 -->
  <g transform="translate(1050, 560)" opacity="0.6">
    <circle cx="0" cy="0" r="6" fill="#D67D6A"/>
  </g>
</svg>`;

async function main() {
  console.log('[generate-og-card] Rendering OG card (1200x630)...');
  const buf = await sharp(Buffer.from(ogCardSvg), { density: 192 })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  await writeFile(join(PUBLIC_DIR, 'og-card.png'), buf);
  console.log(`  ✓ og-card.png (1200x630, ${(buf.length / 1024).toFixed(1)}KB)`);

  // 方形版本（Twitter / 部分平台偏好方形）
  console.log('[generate-og-card] Rendering square variant (1200x1200)...');
  const squareSvg = ogCardSvg
    .replace('width="1200" height="630" viewBox="0 0 1200 630"', 'width="1200" height="1200" viewBox="0 0 1200 1200"')
    .replace(/<rect width="1200" height="630"/, '<rect width="1200" height="1200"')
    .replace(/<circle cx="80" cy="560"/, '')
    .replace(/<circle cx="160" cy="500"/, '')
    .replace(/<circle cx="1120" cy="80"/, '<circle cx="1120" cy="1080"')
    .replace(/<circle cx="1040" cy="140"/, '')
    .replace(/<text x="500" y="240"/, '<text x="600" y="540" text-anchor="middle"')
    .replace(/<text x="500" y="340"/, '<text x="600" y="640" text-anchor="middle"')
    .replace(/<text x="500" y="410"/, '<text x="600" y="720" text-anchor="middle"')
    .replace(/<text x="500" y="540"/, '<text x="600" y="900" text-anchor="middle"')
    .replace(/translate\(150, 165\) scale\(2.5\)/, 'translate(450, 165) scale(2.5)')
    .replace(/translate\(1050, 560\)/, 'translate(1080, 1080)');

  const squareBuf = await sharp(Buffer.from(squareSvg), { density: 192 })
    .resize(1200, 1200)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  await writeFile(join(PUBLIC_DIR, 'og-card-square.png'), squareBuf);
  console.log(`  ✓ og-card-square.png (1200x1200, ${(squareBuf.length / 1024).toFixed(1)}KB)`);

  console.log('\n[generate-og-card] Done.');
}

main().catch((e) => {
  console.error('[generate-og-card] Failed:', e);
  process.exit(1);
});
