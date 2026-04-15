"use client";

import React, {
    useState,
    useEffect,
    memo,
    lazy,
    Suspense,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

// ── ClientOnly ────────────────────────────────────────────────────────────────
// Renders children only after mount. Server + first client render both return
// `fallback`, so the HTML is identical and React hydrates without a mismatch.
// After hydration, the real children are swapped in via a normal state update.
function ClientOnly({ children, fallback = null }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const callback = () => setMounted(true);
        const frame = window.requestAnimationFrame(callback);
        return () => window.cancelAnimationFrame(frame);
    }, []);

    return mounted ? children : fallback;
}

// ── ImageCarousel ─────────────────────────────────────────────────────────────
// The <section> shell is rendered on both server and client (stable layout).
// The <img> inside is gated behind ClientOnly so the server never emits it —
// no hydration diff possible for the image element.
//
// We use a plain <img> instead of next/image <Image fill> because Next.js
// Image emits extra SSR markup (<ImagePreload>, link rel=preload) that can
// appear/disappear between server and client renders in Turbopack builds,
// which is exactly what the error diff was showing.
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
            <ClientOnly
                fallback={
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                        }}
                    />
                }
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    key={index}
                    src={CAROUSEL_IMAGES[index].src}
                    alt={CAROUSEL_IMAGES[index].alt}
                    decoding="async"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </ClientOnly>
        </section>
    );
});

// ── UserHome ──────────────────────────────────────────────────────────────────
function UserHome() {
    const router = useRouter();
    const { status } = useSession({
        required: true,
        onUnauthenticated() {
            router.replace("/join");
        },
    });

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Loading dashboard…
            </div>
        );
    }

    return (
        <>
            <main
                aria-label="Crypto Mining Platform Home"
                itemScope
                itemType="https://schema.org/WebPage"
                className="relative min-h-screen text-white px-4 py-4 sm:px-6 lg:px-10"
                // Browser extensions (MetaMask, ad-blockers) inject extra classes
                // like `overflow-hidden` before React loads, causing a className
                // mismatch on this node. suppressHydrationWarning silences it for
                // this single element without masking errors in child components.
                suppressHydrationWarning
            >
                {/*
                  * Plain <img> for the banner background instead of next/image <Image>.
                  * next/image with `fill` + `priority` emits a <link rel="preload">
                  * and an <ImagePreload> component into the SSR stream. In Turbopack
                  * builds these can be present on the server but absent on the client
                  * (or vice-versa), producing the "-  <img>" diff seen in the error.
                  * A plain <img> has no such side-effects and is always stable.
                */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/banner.png"
                    alt=""
                    aria-hidden="true"
                    fetchPriority="high"
                    decoding="async"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        zIndex: -1,
                    }}
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
        </>
    );
}

export default memo(UserHome);