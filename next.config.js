const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.igdb.com' },
      { protocol: 'https', hostname: 'static-cdn.jtvnw.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@components': path.join(__dirname, 'src/components'),
      '@pages': path.join(__dirname, 'src/pages'),
      '@hooks': path.join(__dirname, 'src/hooks'),
      '@services': path.join(__dirname, 'src/services'),
      '@contexts': path.join(__dirname, 'src/contexts'),
      '@typings': path.join(__dirname, 'src/typings'),
      '@app-types': path.join(__dirname, 'src/types'),
      '@utils': path.join(__dirname, 'src/utils'),
      '@lib': path.join(__dirname, 'src/lib'),
      '@api': path.join(__dirname, 'src/api'),
      '@features': path.join(__dirname, 'src/features'),
      '@server': path.join(__dirname, 'src/server'),
      '@app': path.join(__dirname, 'src/app'),
    };
    return config;
  },
};

module.exports = nextConfig;
