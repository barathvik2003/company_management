/** @type {import('next').NextConfig} */

// If you browse the dev server from another machine on the LAN (e.g. a RHEL
// box you SSH into), Next.js blocks its hot-reload requests from that origin
// by default. Set ALLOWED_DEV_ORIGINS to a comma-separated list of the IPs or
// hostnames you browse from, e.g. ALLOWED_DEV_ORIGINS=192.168.1.42
const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  // The shared package ships TypeScript source; Next compiles it with the app.
  transpilePackages: ['@cms/shared'],
  poweredByHeader: false,
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
