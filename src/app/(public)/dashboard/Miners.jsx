"use client";


import React, { memo } from "react";
import Image from "next/image";
import Link from "next/link";

// ── Static data (module-level frozen constant) ───────────────────────────────
// Object.freeze prevents accidental mutation and signals immutability to V8.
// progress stored as NUMBERS so `width: \`${m.progress}%\`` is correct CSS.
const MINERS = Object.freeze([
    {
        name: "Mining Machine S15",
        image: "/ANG.png",
        returnRate: "2.333%",
        cycle: "Daily",
        progress: 82.75,
        price: "10.00 ~ 100.00 USDT",
    },
    {
        name: "Mining RIG-819",
        image: "/Rig.png",
        returnRate: "2.500%",
        cycle: "7 Days",
        progress: 56.30,
        price: "100.00 ~ 1000.00 USDT",
    },
    {
        name: "Minerbase Machine L11",
        image: "/ANG.png",
        returnRate: "2.700%",
        cycle: "15 Days",
        progress: 40.84,
        price: "500.00 ~ 1000.00 USDT",
    },
    {
        name: "Mining Machine D9",
        image: "/D9.png",
        returnRate: "2.850%",
        cycle: "21 Days",
        progress: 44.30,
        price: "1000.00 ~ 10,000.00 USDT",
    },
    {
        name: "Mining RIG S21",
        image: "/S21.png",
        returnRate: "3.500%",
        cycle: "28 Days",
        progress: 38.41,
        price: "2000.00 ~ 20000.00 USDT",
    },
    {
        name: "Full Mining Machine L9",
        image: "/L9.png",
        returnRate: "4.00%",
        cycle: "50 Days",
        progress: 39.76,
        price: "5000.00 ~ 50000.00 USDT",
    },
]);

// ── MinerCard ────────────────────────────────────────────────────────────────
// Module-scope + React.memo.
// MINERS is a frozen constant → props never change → this component renders
// exactly ONCE per card and never again for the lifetime of the app.
const MinerCard = memo(function MinerCard({ miner, priority }) {
    const { name, image, returnRate, cycle, progress, price } = miner;

    return (
        <article
            aria-label={name}
            className="relative bg-gradient-to-tr from-gray-800 to-black/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-yellow-400/40 hover:scale-105 hover:border-yellow-400 transition-all duration-500"
        >
            {/* Return Rate Badge */}
            <div
                aria-label={`Return rate: ${returnRate}`}
                className="absolute top-4 right-4 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-xs shadow-lg"
            >
                {returnRate}
            </div>

            {/* Machine Image
                • priority=true  on card 0 (above fold, LCP candidate)
                • loading="lazy" on cards 1-5 (below fold on mobile)
                • explicit width/height reserves space → zero CLS
                • sizes matches the 1/2/3 column grid breakpoints             */}
            <div className="h-36 sm:h-40 flex items-center justify-center mb-4 relative">
                <Image
                    src={image}
                    alt={name}
                    width={160}
                    height={160}
                    priority={priority}
                    loading={priority ? undefined : "lazy"}
                    sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 160px"
                    className="object-contain h-full w-auto drop-shadow-xl"
                />
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-white">{name}</h3>

            <p className="text-sm text-gray-400 mt-1">
                Cycle: <span className="text-yellow-400">{cycle}</span>
            </p>

            {/* Price / Return info */}
            <div className="mt-4 flex items-center justify-between text-sm">
                <div>
                    <div className="text-gray-400 text-xs">Price Range</div>
                    <div className="font-semibold text-white">{price}</div>
                </div>
                <div className="text-right">
                    <div className="text-gray-400 text-xs">Return Rate</div>
                    <div className="font-bold text-yellow-400">{returnRate}</div>
                </div>
            </div>

            {/* Progress bar
                FIX: progress is now a NUMBER so width:`${progress}%` = "82.75%" ✓
                     Previously it was a string so it produced "82.75%%" — broken. */}
            <div className="mt-5">
                <div
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Mining progress: ${progress}%`}
                    className="w-full bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden"
                >
                    <div
                        className="bg-yellow-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>Mining Progress</span>
                    <span>{progress}%</span>
                </div>
            </div>

            {/* Actions
                FIX: <Link> rendered directly as the CTA — removes the invalid
                     <button> inside <Link> nesting (fails HTML5 + WCAG 4.1.1). */}
            <div className="mt-5 flex items-center gap-3">
                <Link
                    href="/mining"
                    aria-label={`Buy ${name}`}
                    className="flex-1 block text-center py-2.5 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition shadow-lg"
                >
                    Buy Now
                </Link>

                <button
                    aria-label={`Settings for ${name}`}
                    className="w-10 h-10 rounded-xl bg-black/70 border border-yellow-400/40 text-yellow-400 hover:bg-yellow-500 hover:text-black transition shadow"
                >
                    {/* aria-hidden keeps the emoji out of the accessibility tree */}
                    <span aria-hidden="true">⚙️</span>
                </button>
            </div>

            {/* Decorative glow — aria-hidden so crawlers skip it */}
            <div
                aria-hidden="true"
                className="absolute inset-0 rounded-3xl bg-yellow-400/10 blur-2xl opacity-20 pointer-events-none"
            />
        </article>
    );
});

// ── Miners ────────────────────────────────────────────────────────────────────
// Renders once. Since MINERS is a frozen constant and MinerCard is memoised,
// no card will ever re-render due to parent state changes.
function Miners() {
    return (
        <section
            aria-labelledby="mining-hall-heading"
            itemScope
            itemType="https://schema.org/ItemList"
            className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 sm:p-6 md:p-10 text-white"
        >
            <div className="max-w-7xl mx-auto flex flex-col gap-8">

                {/* Header
                    h2 (not h1) — UserHome already owns the page h1.
                    Using h1 here creates a duplicate landmark and confuses
                    search engine document-outline parsing.                  */}
                <header className="flex items-center justify-between">
                    <h2
                        id="mining-hall-heading"
                        className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-yellow-400 tracking-wide uppercase"
                    >
                        Mining Hall
                    </h2>
                    <span className="text-xs sm:text-sm text-gray-400">
                        Choose your mining machine
                    </span>
                </header>

                {/* Miner grid */}
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    role="list"
                    aria-label="Available mining machines"
                >
                    {MINERS.map((miner, i) => (
                        <MinerCard
                            // Stable string key — no index-based reconciliation churn
                            key={miner.name}
                            miner={miner}
                            // Only the first card is above the fold → gets priority
                            // All others lazy-load to improve initial bundle / LCP
                            priority={i === 0}
                        />
                    ))}
                </div>

            </div>
        </section>
    );
}

export default memo(Miners);