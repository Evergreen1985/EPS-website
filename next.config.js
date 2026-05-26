/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["twilio", "web-push", "sharp", "ffmpeg-static"],
    outputFileTracingIncludes: {
      "/api/reels/generate": ["./node_modules/ffmpeg-static/**/*"],
    },
  },
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
    // Only expose keys that are intentionally public (Google Maps is used in browser widgets)
    GOOGLE_MAPS_API_KEY:            process.env.GOOGLE_MAPS_API_KEY,
    GOOGLE_PLACE_ID:                process.env.GOOGLE_PLACE_ID,
    NEXT_PUBLIC_SUPABASE_URL:       process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // ANTHROPIC_API_KEY and GOOGLE_VISION_API_KEY must remain server-side only.
    // Access them via process.env inside API routes — do NOT add them here.
  },
};

module.exports = nextConfig;
