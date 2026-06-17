// public/sw.js
// v2.0.7.8 (ADR-004 PWA) Service Worker
// 来自 docs/decisions/adr-004-pwa-mobile.md
// 关键不变量：危机页（/crisis）必须离线可达（S-3 红线）

const CACHE_VERSION = 'nw-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// 预缓存：app shell + 危机页 + Logo + Manifest
const PRECACHE_URLS = [
  '/',
  '/today',
  '/crisis',         // ← 关键：危机页必须预缓存
  '/logo.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-maskable.svg',
  '/manifest.webmanifest',
];

// ============ 安装：预缓存 ============
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // 用 addAll 预缓存；个别失败不阻断整个 SW
      return Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(url).catch((e) => {
          console.warn('[SW] precache failed:', url, e);
        }))
      );
    }).then(() => self.skipWaiting())
  );
});

// ============ 激活：清理旧缓存 ============
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ============ fetch：缓存策略 ============

// 危机页：network-first，失败 fallback cache（确保永远可达）
async function crisisStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // 最后兜底：返回内嵌的危机 HTML（完全离线）
    return new Response(OFFLINE_CRISIS_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

// 静态资源：cache-first
async function staticStrategy(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || new Response('', { status: 504 });
  }
}

// 页面：network-first，失败 fallback cache
async function pageStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // 离线 fallback：返回首页
    return caches.match('/today') || caches.match('/');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源 GET 请求
  if (url.origin !== self.location.origin || request.method !== 'GET') return;

  // 危机页（关键路径）
  if (url.pathname.startsWith('/crisis')) {
    event.respondWith(crisisStrategy(request));
    return;
  }

  // 静态资源（_next/static / icon / logo / manifest）
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname === '/sw.js'
  ) {
    event.respondWith(staticStrategy(request));
    return;
  }

  // 页面（HTML）
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(pageStrategy(request));
    return;
  }

  // 其他：尝试网络
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ============ 离线危机 HTML 兜底 ============
const OFFLINE_CRISIS_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>不委屈 — 紧急支持</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
           background: #FAF7F2; color: #5A4A36; margin: 0; padding: 2rem;
           max-width: 32rem; margin: 0 auto; line-height: 1.7; }
    h1 { color: #2A2118; font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { margin: 1rem 0; }
    .phone { display: block; background: #fff; padding: 1rem; margin: 0.5rem 0;
             border-radius: 0.5rem; text-decoration: none; color: #D67D6A;
             font-size: 1.25rem; font-weight: 600; }
  </style>
</head>
<body>
  <h1>你现在不太好。</h1>
  <p>我们想先陪着你。</p>
  <p>24 小时心理援助热线：</p>
  <a href="tel:010-82951332" class="phone">📞 北京心理危机研究与干预中心<br>010-82951332</a>
  <a href="tel:400-161-9995" class="phone">📞 全国心理援助热线<br>400-161-9995</a>
  <p>也可以：联系你信任的人 / 就近医院精神科</p>
  <p style="font-size: 0.75rem; color: #888; margin-top: 2rem;">
    不委屈是成长陪伴，不替代专业心理咨询与诊疗。
  </p>
</body>
</html>`;
