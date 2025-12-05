/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '18600',
        pathname: '/static/**',
      },
      {
        protocol: 'https',
        hostname: 'demo-wedding-backend.hoangdieuit.io.vn',
        pathname: '/static/**',
      },
    ],
  },
}

module.exports = nextConfig
