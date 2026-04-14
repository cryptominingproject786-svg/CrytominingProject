"use client";

import React, {
    useState,
    useEffect,
    memo,
    lazy,
    Suspense,
} from "react";
import WhatsAppButton from "./WhatsAppButton";
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
// FIX: removed the `visible` state entirely.
// The old pattern (visible=false on server, true on client) caused a guaranteed
// hydration mismatch — server renders nothing, client renders an <Image>.
// Instead we render the first image immediately on both server and client,
// then useEffect handles the interval safely after hydration completes.
const ImageCarousel = memo(function ImageCarousel() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
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
                // overflow-hidden removed — it creates a stacking context that
                // traps position:fixed children (WhatsAppButton) in Chrome/Safari.
                className="relative min-h-screen text-white px-4 py-4 sm:px-6 lg:px-10"
            >
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

                <div aria-hidden="true" className="absolute inset-0 bg-black/50 -z-10" />

                <div className="relative max-w-7xl mx-auto">

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

                    <section
                        aria-label="Platform benefits"
                        className="flex justify-between gap-4 mb-4 sm:mb-6 text-xs sm:text-sm"
                    >
                        <span><span aria-hidden="true">💰 </span>Save money</span>
                        <span><span aria-hidden="true">⏱ </span>Save time</span>
                    </section>

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

                    <ImageCarousel />

                </div>
            </main>

            <Suspense fallback={<SectionSkeleton height="h-64" />}>
                <UserData />
            </Suspense>
            <Suspense fallback={<SectionSkeleton height="h-48" />}>
                <Miners />
            </Suspense>
            <Suspense fallback={<SectionSkeleton height="h-48" />}>
                <MembersList />
            </Suspense>

            {/* Rendered directly — no Suspense, no lazy. Static component. */}
            <WhatsAppButton
                phoneNumber="+923464197241"
                message="Hello, I need help with billing."
            />
        </>
    );
}

export default memo(UserHome);
