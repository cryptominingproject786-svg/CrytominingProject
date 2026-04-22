import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";
import WhatsAppButton from "./components/WhatsAppButton";
import Footer from "./components/Footer";
import Providers from "../Redux/Provider";
const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// ─── Site constants ───────────────────────────────────────────────────────────
const SITE_URL = "https://bittxs.com";
const SITE_NAME = "BittXS";
const OG_IMAGE = "https://bittxs.com/og-image.png";
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BittXS — Earn Daily with Secure Crypto Mining",
    template: `%s | ${SITE_NAME}`,  // e.g. "About | BittXS" on child pages
  },
  description:
    "Join 50,000+ investors on BittXS — the UK-based crypto-mining platform " +
    "delivering real-time mining insights, AES-256 encrypted security, and " +
    "daily payouts via ASIC and GPU/CPU hardware infrastructure worldwide.",

  keywords: [
    "crypto mining",
    "bitcoin mining",
    "passive income crypto",
    "ASIC mining platform",
    "GPU mining",
    "daily crypto earnings",
    "BittXS",
    "UK crypto mining",
    "secure mining platform",
    "crypto investment UK",
    "mining hardware",
    "cloud mining platform",
    "bitcoin cloud mining 2026",
    "earn passive income crypto",
    "crypto staking vs mining",
    "best crypto mining site UK",
    "legit cloud mining platform",
    "AI crypto mining",
    "green crypto mining",
    "low cost bitcoin mining",
    "crypto yield platforms",
  ],

  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "finance",

  // ── Canonical — prevents duplicate-content penalties ────────────────────────
  alternates: {
    canonical: SITE_URL,
  },

  // ── Robots ──────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph — Facebook, LinkedIn, WhatsApp, iMessage ─────────────────────
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "BittXS — Earn Daily with Secure Crypto Mining",
    description:
      "UK-based platform trusted by 50,000+ investors. Daily crypto payouts, " +
      "transparent earnings reports, and bank-grade AES-256 security.",
    locale: "en_GB",   // UK-registered business
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "BittXS Mining Platform — Earn Daily",
      },
    ],
  },

  // ── Twitter / X Card ────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "BittXS — Earn Daily with Secure Crypto Mining",
    description:
      "Join 50,000+ investors. Daily payouts, real-time mining dashboard, " +
      "and bank-grade security. UK-registered. Start earning today.",
    images: [OG_IMAGE],
    // Add your Twitter/X handle here if you create one:
    // site:     "@BittXS",
    // creator:  "@BittXS",
  },

  // ── Icons ───────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/LogoWeb.png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/LogoWeb.png",
    apple: "/LogoWeb.png",
  },

  // ── PWA / mobile app hints ───────────────────────────────────────────────────
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,  // prevents iOS auto-linking number strings as call links
  },
  verification: {
    google: "REPLACE_WITH_YOUR_GOOGLE_SEARCH_CONSOLE_TOKEN",
    // yandex: "REPLACE_WITH_YANDEX_TOKEN",
  },
};

// ─── Viewport — required as a separate export in Next.js 14+ ──────────────────
export const viewport = {
  themeColor: "#FACC15",      // yellow-400 — shown in mobile Chrome tab bar
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,              // allow pinch-zoom (accessibility best practice)
};

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }) {
  return (

    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "BittXS",
              url: "https://bittxs.com",
              logo: "https://bittxs.com/LogoWeb.png",
              sameAs: [
                "https://twitter.com/",
                "https://linkedin.com/"
              ]
            })
          }}
        />
        <Providers>
          <Navbar />
          <main>
            {children}
          </main>
          <Footer />
          <WhatsAppButton
            phoneNumber="+447988596249"
            message="Hi! I need help with the Mining Platform."
          />
        </Providers>
      </body>
    </html>
  );
}