/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: new URL('../', import.meta.url).pathname,
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
