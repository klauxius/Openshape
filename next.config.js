/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  output: 'export', // Set output to export static files for Electron
  // Required for Next.js static export
  distDir: 'out',
}

module.exports = nextConfig 