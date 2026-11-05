/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export: the app is client-only (IndexedDB), so the same `out/` folder serves the web
  // deployment and the Capacitor Android shell (webDir: out).
  output: 'export',
  // Emits /foods/index.html instead of /foods.html, which is what Android's asset server resolves.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Security/cache headers used to live in headers(), which static export does not support.
  // They are now in vercel.json (same values).
}

export default nextConfig
