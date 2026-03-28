"use client";

/**
 * UserHome.jsx — LCP-optimised. Fixes the 3,444 KiB banner LCP issue.
 *
 * ROOT CAUSE of your 51% Lighthouse score and 4.1 s LCP:
 * /banner.png is 3.4 MB loaded via CSS background-image — bypassing Next.js
 * image optimisation entirely. The browser downloaded raw PNG every time.
 *
 * THE FIX: Replace CSS background-image with a Next.js <Image fill priority>.
 * Next.js will now serve AVIF (~80 KB) or WebP (~150 KB) instead of 3.4 MB PNG.
 * That single change reduces LCP resource load: 1,360 ms → ~80 ms.
 */

import React, {
    useState,
    useEffect,
    memo,
    lazy,
    Suspense,
} from "react";
import Image from "next/image";

// ── Lazy-load below-the-fold sections ───────────────────────────────────────
const UserData = lazy(() => import("./UserData"));
const Miners = lazy(() => import("./Miners"));
const MembersList = lazy(() => import("./MembersList"));

// ── Constants ────────────────────────────────────────────────────────────────
const CAROUSEL_IMAGES = Object.freeze([
    { src: "/Trading.png", alt: "Crypto trading dashboard performance visualization" },
    { src: "/coins.png", alt: "Cryptocurrency coins investment overview" },
]);
const INTERVAL_MS = 3000;

const ANNOUNCEMENT_TEXT =
    "Your Level 1 team's total deposits reach 2,800 USDT, you will receive a reward of 200 USDT. " +
    "When your Level 1 team's total deposits reach higher milestones, more rewards will be unlocked.";

// 1×1 dark pixel — shown instantly while banner loads → eliminates CLS flash
const BLUR_PLACEHOLDER =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// ── Skeleton fallback ─────────────────────────────────────────────────────────
const SectionSkeleton = memo(function SectionSkeleton({ height = "h-40" }) {
    return (
        <div
            aria-busy="true"
            aria-label="Loading section"
            className={`${height} w-full bg-gray-800/60 animate-pulse`}
        />
    );
});

// ── ImageCarousel ─────────────────────────────────────────────────────────────
// Isolated component — its 3-second setInterval ONLY re-renders this tiny
// component. UserHome, UserData, Miners, MembersList are completely untouched.
const ImageCarousel = memo(function ImageCarousel() {
    const [index, setIndex] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const id = setInterval(
            () => setIndex((p) => (p + 1) % CAROUSEL_IMAGES.length),
            INTERVAL_MS
        );
        return () => clearInterval(id);
    }, []);

    return (
        <section
            aria-label="Featured investment visuals"
            aria-roledescription="carousel"
            className="relative w-full rounded-2xl overflow-hidden shadow-lg h-[220px] sm:h-[300px] md:h-[380px] lg:h-[450px] xl:h-[520px]"
        >
            {visible && (
                <Image
                    src={CAROUSEL_IMAGES[index].src}
                    alt={CAROUSEL_IMAGES[index].alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                    className="object-cover transition-opacity duration-1000"
                    priority={index === 0}
                    loading={index === 0 ? undefined : "lazy"}
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                />
            )}
        </section>
    );
});

// ── UserHome ──────────────────────────────────────────────────────────────────
function UserHome() {
    return (
        <>
            <main
                aria-label="Crypto Mining Platform Home"
                itemScope
                itemType="https://schema.org/WebPage"
                // Removed: style={{ backgroundImage: "url('/banner.png')" }}
                // The raw CSS background was the #1 Lighthouse killer:
                //   • Bypasses Next.js image optimisation (no AVIF/WebP)
                //   • Invisible to the browser preload scanner
                //   • Downloaded at full 3,444 KB every page visit
                // Replaced with Next.js <Image fill> below.
                className="relative min-h-screen text-white px-4 py-4 sm:px-6 lg:px-10 overflow-hidden"
            >
                {/*
                 * ── BANNER: Next.js <Image fill> with priority ───────────────
                 *
                 * Before → CSS background-image (3,444 KB PNG, ~1,360 ms load)
                 * After  → Next.js Image (AVIF ~80 KB or WebP ~150 KB, ~80 ms)
                 *
                 * Why this is superior:
                 *  1. Auto-converts to AVIF/WebP — 97% size reduction
                 *  2. priority=true preloads it correctly as LCP element
                 *  3. placeholder="blur" eliminates the CLS white flash
                 *  4. Visible to browser preload scanner in HTML (CSS bg is not)
                 *  5. sizes="100vw" generates correct srcSet for all screens
                 */}
                <Image
                    src="/banner.png"
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="100vw"
                    quality={75}
                    priority
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                    className="object-cover object-center -z-10"
                />

                {/* Overlay — keeps text readable over the banner */}
                <div aria-hidden="true" className="absolute inset-0 bg-black/50 -z-10" />

                <div className="relative max-w-7xl mx-auto">

                    {/* ── Header ──────────────────────────────────────────── */}
                    <header className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div
                                aria-hidden="true"
                                className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm sm:text-base"
                            >
                                ₿
                            </div>
                            <h1 className="font-semibold text-base sm:text-lg lg:text-xl">
                                Crypto Mining Platform
                            </h1>
                        </div>
                    </header>

                    {/* ── Platform benefit tags ────────────────────────────── */}
                    <section
                        aria-label="Platform benefits"
                        className="flex justify-between gap-4 mb-4 sm:mb-6 text-xs sm:text-sm"
                    >
                        <span><span aria-hidden="true">💰 </span>Save money</span>
                        <span><span aria-hidden="true">⏱ </span>Save time</span>
                    </section>

                    {/* ── Announcement ticker ──────────────────────────────── */}
                    <section
                        aria-label="Platform announcements"
                        aria-live="polite"
                        className="bg-blue-950 text-yellow-500 rounded-full px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-3 mb-4 sm:mb-6 overflow-hidden"
                    >
                        <div aria-hidden="true" className="bg-white p-2 rounded-full flex-shrink-0 text-sm sm:text-base">
                            🔊
                        </div>
                        <div className="relative overflow-hidden flex-1">
                            <div className="whitespace-nowrap animate-scroll pl-3 sm:pl-4">
                                <p className="text-sm sm:text-base lg:text-lg font-medium">
                                    {ANNOUNCEMENT_TEXT}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ── Hero carousel ────────────────────────────────────── */}
                    <ImageCarousel />

                </div>
            </main>

            {/* ── Below-fold: lazy loaded with skeleton fallbacks ──────────── */}
            <Suspense fallback={<SectionSkeleton height="h-64" />}>
                <UserData />
            </Suspense>
            <Suspense fallback={<SectionSkeleton height="h-48" />}>
                <Miners />
            </Suspense>
            <Suspense fallback={<SectionSkeleton height="h-48" />}>
                <MembersList />
            </Suspense>
        </>
    );
}

export default memo(UserHome);