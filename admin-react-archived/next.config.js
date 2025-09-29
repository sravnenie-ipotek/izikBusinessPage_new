/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/admin',
  output: 'export',
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig