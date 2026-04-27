/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  env: {
    GOOGLE_MAPS_API_KEY:            process.env.GOOGLE_MAPS_API_KEY,
    GOOGLE_PLACE_ID:                process.env.GOOGLE_PLACE_ID,
    NEXT_PUBLIC_SUPABASE_URL:       process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ANTHROPIC_API_KEY:              process.env.ANTHROPIC_API_KEY,
    GOOGLE_VISION_API_KEY:          process.env.GOOGLE_VISION_API_KEY,
  },
};

module.exports = nextConfig;
