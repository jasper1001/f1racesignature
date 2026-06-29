import type { NextConfig } from 'next'
import path from 'path'

// next/font/google serves fonts locally at build time — no external font CDN needed in CSP
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  // Amazon product images (affiliate shelf) are served from the Amazon media CDN
  "img-src 'self' data: blob: https://m.media-amazon.com",
  // Supabase: REST + auth over https, realtime over wss (leaderboards)
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://api.jolpi.ca https://*.supabase.co wss://*.supabase.co",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  // Prevents the site being embedded in iframes (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stops browsers guessing MIME types from content
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Legacy XSS filter for older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Only send origin (no path/query) in Referer header to third parties
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down hardware APIs the site doesn't use
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Force HTTPS for 2 years, include subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
