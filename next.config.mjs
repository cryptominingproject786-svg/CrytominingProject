/** @type {import('next').NextConfig} */

const nextConfig = {

  // ── React Compiler (already enabled — keep it) ───────────────────────────
  // Automatically memoises components and hooks at the compiler level,
  // eliminating the need for manual useMemo/useCallback in most cases.
  reactCompiler: true,

  // ── React strict mode ────────────────────────────────────────────────────
  // Catches side-effects and deprecated API usage in development.
  // Reduces the React production runtime size slightly.
  reactStrictMode: true,

  // ── Image Optimisation ───────────────────────────────────────────────────
  // CRITICAL FIX for your 51% Lighthouse score.
  // /banner.png = 3,444 KB raw PNG. With AVIF → ~80 KB. (97% reduction)
  // Only activates when you use Next.js <Image> (not CSS background-image).
  images: {
    // Serve AVIF first (best compression), WebP as fallback.
    // Without this, Next.js <Image> still serves the original PNG format.
    formats: ["image/avif", "image/webp"],

    // Viewport widths used to generate responsive srcSet.
    // Aligned with Tailwind's sm / md / lg / xl / 2xl breakpoints.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],

    // Sizes for fixed-width images (icons, avatars, thumbnails).
    imageSizes: [16, 32, 48, 64, 96, 128, 160, 256],

    // Cache optimised images for 60 days (default is 60 seconds — too short).
    // Safe: Next.js content-addresses images so stale cache is impossible.
    minimumCacheTTL: 60 * 60 * 24 * 60, // 60 days in seconds
  },

  // ── Compiler Optimisations ───────────────────────────────────────────────
  compiler: {
    // Remove all console.log / console.warn in production builds.
    // Each console call is a synchronous string allocation on the main thread
    // that contributes to TBT. Keep console.error for crash diagnosis only.
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error"] }
      : false,
  },

  // ── Experimental Performance Flags ───────────────────────────────────────
  experimental: {
    // Inline critical above-the-fold CSS into the HTML document.
    // Eliminates the render-blocking CSS request Lighthouse flagged (80 ms).
    // Requires: npm install critters
    optimizeCss: true,

    // Tree-shake large packages — only import what you actually use.
    // Directly reduces the "Reduce unused JavaScript 303 KiB" Lighthouse flag.
    // Add any large package your project imports here.
    optimizePackageImports: [
      "react-zoom-pan-pinch",
      "next-auth",
      "next-auth/react",
      "lucide-react",
      "date-fns",
      "lodash",
    ],

    // Partial Pre-Rendering: renders a static shell at build time,
    // streams dynamic parts (user data, balance) in afterwards.
    // Combines the speed of SSG with the freshness of SSR.
    // NOTE: `ppr` was merged into `cacheComponents` in Next.js 15.x.
    cacheComponents: true,
  },

  // ── HTTP Response Headers ────────────────────────────────────────────────
  async headers() {
    return [

      // ── Static assets — aggressive long-term caching ─────────────────
      // Next.js content-hashes every file in /_next/static/ at build time.
      // "immutable" tells browsers to NEVER revalidate during max-age.
      // Result: zero network requests for unchanged JS/CSS on repeat visits.
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // ── Public folder images (banner.png, coins.png, miner images) ───
      // Cache for 1 year. If you update an image, rename it or bust the
      // cache with a query param (e.g. /banner.png?v=2).
      {
        source: "/:path(.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif)$)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // ── Fonts ────────────────────────────────────────────────────────
      {
        source: "/:path(.*\\.(?:woff|woff2|ttf|otf|eot)$)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // ── API routes — fix the bfcache Lighthouse failure ──────────────
      // YOUR REPORT: "Pages with cache-control:no-store cannot enter
      // back/forward cache" — 5 failure reasons, 1 is actionable.
      //
      // Your API routes returned: Cache-Control: no-store
      // This disables bfcache for the ENTIRE PAGE — every back/forward
      // navigation does a full network reload instead of instant restore.
      //
      // Fix: "private, no-cache" is safe for user data AND allows bfcache:
      //   private  → not stored by CDN / proxy caches
      //   no-cache → browser revalidates before serving (safe for user data)
      //   bfcache  → now works ✓ (no-store was blocking it)
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache",
          },
        ],
      },

      // ── Security headers — fixes Lighthouse Best Practices warnings ───
      // Your report flagged: CSP, HSTS, COOP, XFO, Trusted Types.
      {
        source: "/(.*)",
        headers: [
          // Clickjacking — Lighthouse: "Mitigate clickjacking with XFO or CSP"
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // MIME sniffing prevention
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Origin isolation — Lighthouse: "Ensure proper origin isolation with COOP"
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          // Limits referrer info sent to third parties
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // HSTS — Lighthouse: "Use a strong HSTS policy"
          // ⚠️  Remove this if testing on HTTP localhost — HSTS on localhost
          // will break your dev environment until the max-age expires.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Disable unused browser APIs — reduces attack surface
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },

  // ── Production Source Maps ───────────────────────────────────────────────
  // Lighthouse Best Practices: "Missing source maps for large first-party JS"
  // Maps are only fetched by DevTools — never downloaded by regular users.
  // Enables proper error stack traces in production monitoring (Sentry, etc.).
  productionBrowserSourceMaps: true,

  // ── Server Compression ───────────────────────────────────────────────────
  // Gzip all server responses (HTML, JSON, JS).
  // Reduces payload sizes by ~70% with zero application-level changes.
  compress: true,

  // ── Remove "X-Powered-By: Next.js" header ───────────────────────────────
  // Minor security hardening — don't advertise your stack to attackers.
  poweredByHeader: false,

};

export default nextConfig;
