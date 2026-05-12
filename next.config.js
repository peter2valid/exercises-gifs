/** @type {import('next').NextConfig} */
const remotePatterns = [];

if (process.env.NEXT_PUBLIC_R2_PUBLIC_URL) {
  try {
    const r2Hostname = new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname;
    remotePatterns.push({ protocol: 'https', hostname: r2Hostname });
  } catch {
    // Ignore invalid URL at build time; app still runs without remote image optimization.
  }
}

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
    remotePatterns.push({ protocol: 'https', hostname: supabaseHostname });
  } catch {
    // Ignore invalid URL at build time.
  }
}

if (remotePatterns.length === 0) {
  remotePatterns.push({ protocol: 'https', hostname: '**.r2.dev' });
}

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Force HTTPS for 1 year, include subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Control referrer info sent to third parties
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down browser features not used by the app
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()',
  },
  // Basic XSS filter (legacy browsers) + block page on detection
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

const nextConfig = {
  images: {
    remotePatterns,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    // Once gymapp.fun moves to a dedicated marketing site, remove this block
    // and configure the redirect inside that project instead.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl || appUrl.includes('localhost')) return [];

    return [
      {
        // Redirect bare domain traffic to the canonical app subdomain
        source: '/:path*',
        has: [{ type: 'host', value: 'gymapp.fun' }],
        destination: `${appUrl}/:path*`,
        permanent: false, // keep temporary until marketing site is live
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.gymapp.fun' }],
        destination: `${appUrl}/:path*`,
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
