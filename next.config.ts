import type { NextConfig } from "next";
import withPWA from 'next-pwa';

// Initialize next-pwa
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' ? false : false, // Set both to false to test in development
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ucarecdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.vimeocdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vumbnail.com',
        pathname: '/**',
      },
    ],
  },
  // Removed HTTP to HTTPS redirect to prevent conflicts with hosting platform
  /*
  async redirects() {
    return [
      // Redirect from HTTP to HTTPS
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://:host/:path*',
        permanent: true,
      },
    ];
  },
  */
};

// Export the configuration with PWA support applied
export default pwaConfig(nextConfig);