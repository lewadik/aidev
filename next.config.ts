import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Native/node-only modules used by the SSH terminal server & storage
  // providers must not be bundled by webpack on the server side.
  serverExternalPackages: ['ssh2', 'node-pty', 'ws', 'formidable'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/photos/**',
      },
    ],
  },
}

export default nextConfig
