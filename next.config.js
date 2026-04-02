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

const nextConfig = {
  images: {
    remotePatterns,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;