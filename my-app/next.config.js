/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Make sure cache is disabled for development
  webpack: (config) => {
    // Disable Webpack caching
    config.cache = false;
    return config;
  },
}

module.exports = nextConfig 