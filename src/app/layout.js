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

// ─── Site constants ────────────────────────────────────────────────────────────
const SITE_URL = "https://bittxs.com";
const SITE_NAME = "BittXS";
const OG_IMAGE = "https://bittxs.com/og-image.png";

export const metadata = {
  metadataBase: new URL(SITE_URL), // ✅ Fixed: was new URL(bittxs.com) — must be a string

  title: {
    default: "BittXS — Crypto Mining Dashboard",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "BittXS is a crypto mining platform offering real-time mining insights, " +
    "portfolio tracking, and AES-256 encrypted account security. " +
    "Monitor your mining operations transparently.",
  keywords: [
    "crypto mining",
    "bitcoin mining",
    "mining dashboard",
    "BittXS",
    "crypto portfolio tracker",
    "ASIC mining",
    "GPU mining",
    "crypto mining monitor",
    "mining analytics",
    "UK crypto platform",
  ],

  authors: [{ name: SITE_NAME, url: SITE_URL }], // ✅ Fixed: was url: bittxs.com (not a string)
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "finance",
  alternates: {
    canonical: SITE_URL,
  },
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
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "BittXS — Crypto Mining Dashboard",
    description:
      "BittXS provides real-time crypto mining monitoring, portfolio analytics, " +
      "and AES-256 encrypted account security. Track your mining operations with confidence.",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "BittXS Crypto Mining Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BittXS — Crypto Mining Dashboard",
    description:
      "Real-time crypto mining monitoring, portfolio analytics, " +
      "and AES-256 encrypted security. Track your mining operations on BittXS.",
    images: [OG_IMAGE],
    // Uncomment when you have real social handles:
    // site:    "@BittXS",
    // creator: "@BittXS",
  },

  // ── Icons ─────────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/LogoWeb.png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/LogoWeb.png",
    apple: "/LogoWeb.png",
  },
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },

  // ✅ Fixed: Token is now correctly set (no "google-site-verification=" prefix needed here)
  verification: {
    google: "mWqpne2F8jrqRs0Ly-MrVZlLl4H3zps4BtHevQ_4n80",
  },
};
export const viewport = {
  themeColor: "#FACC15",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
              description:
                "BittXS is a crypto mining platform providing real-time mining " +
                "insights, portfolio tracking, and AES-256 encrypted security.",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+447988596249",
                contactType: "customer support",
                availableLanguage: "English",
              },
            }),
          }}
        />

        <Providers>
          <Navbar />
          <main>{children}</main>
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