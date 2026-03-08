"use client";
import React from "react";

import Link from "next/link";

const miners = [
    {
        name: "Mining Machine S15",
        image: "/ANG.png",
        returnRate: "26.00%",
        cycle: "Daily",
        progress: 82.75,
        price: "10 ~ 100 USDT",
    },
    {
        name: "Mining RIG-819",
        image: "/Rig.png",
        returnRate: "28.00%",
        cycle: "7 Days",
        progress: 56.3,
        price: "100 ~ 1,000 USDT",
    },
    {
        name: "Minerbase Machine L11",
        image: "/ANG.png",
        returnRate: "31.00%",
        cycle: "15 Days",
        progress: 40.84,
        price: "500 ~ 1,000 USDT",
    },
    {
        name: "Mining Machine D9",
        image: "/D9.png",
        returnRate: "35.00%",
        cycle: "21 Days",
        progress: 44.3,
        price: "1,000 ~ 10,000 USDT",
    },
    {
        name: "Mining RIG S21",
        image: "/S21.png",
        returnRate: "41.00%",
        cycle: "28 Days",
        progress: 38.41,
        price: "2,000 ~ 20,000 USDT",
    },
    {
        name: "Full Mining Machine L9",
        image: "/L9.png",
        returnRate: "48.00%",
        cycle: "50 Days",
        progress: 39.76,
        price: "5,000 ~ 50,000 USDT",
    },
];

export default function Miners() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 sm:p-6 md:p-10 text-white">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">

                {/* Header */}
                <header className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-yellow-400 tracking-wide uppercase">
                        Mining Hall
                    </h1>
                    <span className="text-xs sm:text-sm text-gray-400">
                        Choose your mining machine
                    </span>
                </header>

                {/* Miner Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {miners.map((m, i) => (
                        <article
                            key={i}
                            className="relative bg-gradient-to-tr from-gray-800 to-black/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-yellow-400/40 hover:scale-105 hover:border-yellow-400 transition-all duration-500"
                        >
                            {/* Return Badge */}
                            <div className="absolute top-4 right-4 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-xs shadow-lg">
                                {m.returnRate}
                            </div>

                            {/* Image */}
                            <div className="h-36 sm:h-40 flex items-center justify-center mb-4">
                                <img
                                    src={m.image}
                                    alt={m.name}
                                    className="object-contain h-full drop-shadow-xl"
                                />
                            </div>

                            {/* Title */}
                            <h3 className="text-lg sm:text-xl font-bold text-white">
                                {m.name}
                            </h3>

                            <p className="text-sm text-gray-400 mt-1">
                                Cycle: <span className="text-yellow-400">{m.cycle}</span>
                            </p>

                            {/* Info */}
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <div>
                                    <div className="text-gray-400 text-xs">Price Range</div>
                                    <div className="font-semibold text-white">{m.price}</div>
                                </div>

                                <div className="text-right">
                                    <div className="text-gray-400 text-xs">Return Rate</div>
                                    <div className="font-bold text-yellow-400">{m.returnRate}</div>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="mt-5">
                                <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
                                    <div
                                        className="bg-yellow-400 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${m.progress}%` }}
                                    />
                                </div>
                                <div className="mt-1 flex justify-between text-xs text-gray-400">
                                    <span>Mining Progress</span>
                                    <span>{m.progress}%</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-5 flex items-center gap-3">
                                <Link href="/mining" className="flex-1">
                                    <button className="w-full py-2.5 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition shadow-lg">
                                        Buy Now
                                    </button>
                                </Link>

                                <button
                                    aria-label="Settings"
                                    className="w-10 h-10 rounded-xl bg-black/70 border border-yellow-400/40 text-yellow-400 hover:bg-yellow-500 hover:text-black transition shadow"
                                >
                                    ⚙️
                                </button>
                            </div>

                            {/* Glow Overlay */}
                            <div className="absolute inset-0 rounded-3xl bg-yellow-400/10 blur-2xl opacity-20 pointer-events-none"></div>
                        </article>
                    ))}
                </section>
            </div>
        </main>
    );
}
