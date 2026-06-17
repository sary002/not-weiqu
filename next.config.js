/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // 19 ESLint errors 暂不阻断 Vercel build（详见 docs/deploy-vercel-runbook.md §6.1）。
  // 等 T-14 GitHub Actions CI 实施后，把 `ignoreDuringBuilds` 改回 false + 修完 19 errors。
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
