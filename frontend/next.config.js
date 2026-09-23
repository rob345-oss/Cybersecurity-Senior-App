const path = require('path')
const { loadEnvConfig } = require('@next/env')

const frontendDir = __dirname
const repoRoot = path.join(frontendDir, '..')

// Monorepo: Next may treat the repo root as the project; load env from both places.
loadEnvConfig(repoRoot)
loadEnvConfig(frontendDir)

// GitHub Pages static export (set GITHUB_PAGES=true in CI only).
const isGithubPages = process.env.GITHUB_PAGES === 'true'
// Allow empty base path for temporary static hosts (Vercel/local preview).
const githubPagesBasePath =
  process.env.GITHUB_PAGES_BASE_PATH !== undefined
    ? process.env.GITHUB_PAGES_BASE_PATH
    : '/Cybersecurity-Senior-App'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isGithubPages
    ? {
        output: 'export',
        ...(githubPagesBasePath
          ? {
              basePath: githubPagesBasePath,
              assetPrefix: `${githubPagesBasePath}/`,
            }
          : {}),
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
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
}

module.exports = nextConfig

