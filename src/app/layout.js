import { Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";
import WhatsAppButton from "./components/WhatsAppButton"; // ← import
import Footer from "./components/Footer";
import Providers from "../Redux/Provider";

const geistSans = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = JetBrains_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Mining Platform",
  description: "Modern crypto mining platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          <main>
            <Suspense fallback={null}>{children}</Suspense>
          </main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>

          {/* ✅ Rendered once, visible on every page */}
          <WhatsAppButton
            phoneNumber="+447988596249"
            message="Hi! I need help with the Mining Platform."
          />
        </Providers>
      </body>
    </html>
  );
}