"use client";

import React, { memo, lazy, Suspense, useState, useEffect } from "react";
import Image from "next/image";
import UserData from "./UserData";
import InvestmentSection from "../User/InvestmentSection";

const Miners = lazy(() => import("./Miners"));
const MembersList = lazy(() => import("./MembersList"));

const CAROUSEL_IMAGES = Object.freeze([
    { src: "/Trading.png", alt: "Crypto trading dashboard performance visualization" },
    { src: "/coins.png", alt: "Cryptocurrency coins investment overview" },
]);

const INTERVAL_MS = 3000;

const ANNOUNCEMENT_TEXT =
    "🎉 Welcome Bonus: Deposit $50 and get 10% FREE — that's $5 added instantly! " +
    "💰 Earn $0.25 every day per active user in your network — auto credited. " +
    "👥 Referral Bonus: Earn 10% on every deposit your friends make — no limit! " +
    "🏆 Invite 5 friends who deposit $8+ and earn a $25 bonus instantly. " +
    "📈 Team Earning: Get 1.25% daily on your entire referral team's deposits. " +
    "🎯 More deposit = more daily income. Start with just $50 USDT today! " +
    "🍀 Lucky Draw: Refer deposits of $168+ to enter — top prize $6,666 USDT!";

function SectionSkeleton({ height = "h-40" }) {
    return (
        <div
            aria-busy="true"
            aria-label="Loading section"
            className={`${height} w-full bg-gray-800/60 animate-pulse`}
        />
    );
}

function ImageCarousel() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(
            () => setIndex((current) => (current + 1) % CAROUSEL_IMAGES.length),
            INTERVAL_MS
        );
        return () => clearInterval(id);
    }, []);

    return (
        <section
            aria-label="Featured investment visuals"
            aria-roledescription="carousel"
            className="relative w-full rounded-2xl overflow-hidden shadow-lg h-55 sm:h-75 md:h-95 lg:h-112.5 xl:h-130"
        >
            <Image
                key={index}
                src={CAROUSEL_IMAGES[index].src}
                alt={CAROUSEL_IMAGES[index].alt}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index === 0}
            />
        </section>
    );
}

export default memo(function DashboardClientShell({ initialUserData, initialInvestments }) {
    return (
        <main
            aria-label="BittXs Dashboard"
            itemScope
            itemType="https://schema.org/WebPage"
            className="relative min-h-screen text-white"
            suppressHydrationWarning
        >
            <Image
                src="/banner.png"
                alt=""
                aria-hidden="true"
                fill
                priority
                sizes="100vw"
                className="object-cover"
                style={{ zIndex: -1, objectPosition: "center" }}
            />

            <div aria-hidden="true" className="absolute inset-0 bg-black/50 -z-10" />

            <div className="relative mx-auto w-full max-w-8xl">
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
                    <div aria-hidden="true" className="bg-white p-2 rounded-full shrink-0 text-sm sm:text-base">
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

                <UserData initialUserData={initialUserData} />

                <Suspense fallback={<SectionSkeleton height="h-48" />}>
                    <InvestmentSection initialInvestments={initialInvestments} />
                </Suspense>

                <Suspense fallback={<SectionSkeleton height="h-48" />}>
                    <Miners />
                </Suspense>

                <Suspense fallback={<SectionSkeleton height="h-48" />}>
                    <MembersList />
                </Suspense>
            </div>
        </main>
    );
});
