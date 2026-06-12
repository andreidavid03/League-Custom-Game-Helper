/** @type {import('next').NextConfig} */

// Set NEXT_PUBLIC_BASE_PATH (e.g. "/League-Custom-Game-Helper") when hosting
// under a subpath such as GitHub Pages. Empty for Vercel/Netlify/Tauri.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig = {
  // Static export: the app is fully client-side (local-first storage),
  // so it can be hosted anywhere and wrapped by Tauri/Capacitor.
  output: 'export',
  basePath,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
