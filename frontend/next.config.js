const path = require('path')
const { loadEnvConfig } = require('@next/env')

const frontendDir = __dirname
const repoRoot = path.join(frontendDir, '..')

// Monorepo: Next may treat the repo root as the project; load env from both places.
loadEnvConfig(repoRoot)
loadEnvConfig(frontendDir)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? '',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  turbopack: {
    root: frontendDir,
  },
  async redirects() {
    return [
      {
        source: '/dashboard/lessons',
        destination: '/lessons',
        permanent: true,
      },
      {
        source: '/dashboard/lessons/:slug',
        destination: '/lessons/:slug',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig

