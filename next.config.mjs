/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Optimize package imports for Vercel
  experimental: {
    optimizePackageImports: ['@vercel/analytics', 'sonner'],
  },
}

// Disable @tailwindcss/oxide on Vercel to avoid native binding compilation errors
if (process.env.VERCEL) {
  process.env.TAILWIND_OXIDE_DISABLE = 'true'
}

export default nextConfig
