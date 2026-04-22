"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

function useFadeIn(threshold = 0.15) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(element);
                }
            },
            { threshold }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, isVisible };
}

const CardSkeleton = () => (
    <div
        aria-hidden="true"
        className="w-72 h-96 rounded-2xl bg-slate-800 animate-pulse"
    />
);

const MiningCard = dynamic(() => import("./MiningCard"), {
    loading: () => <CardSkeleton />,
});

function AnimatedStat({ value, label }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-yellow-400 text-3xl sm:text-4xl font-extrabold tracking-tight">
                {value}
            </span>
            <span className="text-slate-400 text-sm uppercase tracking-widest font-medium">
                {label}
            </span>
        </div>
    );
}

function TrustBadge({ icon, text }) {
    return (
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-4 backdrop-blur-sm">
            <span className="text-2xl" role="img" aria-label={text}>
                {icon}
            </span>
            <span className="text-slate-200 text-sm font-semibold tracking-wide">{text}</span>
        </div>
    );
}

export default function HomeClient() {
    const hero = useFadeIn(0.05);
    const stats = useFadeIn(0.2);
    const cards = useFadeIn(0.2);
    const trust = useFadeIn(0.2);

    return (
        <>
            <section
                ref={hero.ref}
                aria-label="Hero — Start earning with crypto mining"
                className={`
          relative h-screen min-h-[600px] flex flex-col items-center justify-center
          text-center px-6 gap-8 overflow-hidden
          transition-all duration-1000 ease-out
          ${hero.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
            >
                <Image
                    src="/banner.png"
                    alt="BittXS mining platform hero banner"
                    aria-hidden="false"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                    quality={85}
                />

                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/90"
                />

                <div
                    aria-hidden="true"
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[600px] h-[600px] rounded-full
                     bg-yellow-400/10 blur-[120px] pointer-events-none"
                />

                <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl">
                    <p className="text-yellow-400 text-sm sm:text-base uppercase tracking-[0.3em] font-semibold">
                        Passive Income Made Simple
                    </p>
                    <h1 className="text-white text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
                        Earn Daily with <span className="text-yellow-400">BittXS Mining</span>
                    </h1>

                    <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
                        Join thousands of investors using BittXS — the secure, transparent platform engineered for consistent daily returns.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mt-2">
                        <Link
                            href="/signup"
                            className="bg-yellow-400 text-black px-10 py-4 rounded-full text-base font-bold tracking-wide hover:bg-yellow-300 active:scale-95 transition-all duration-200 shadow-lg shadow-yellow-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400"
                        >
                            Start Earning Today
                        </Link>
                        <Link
                            href="/about"
                            className="border border-white/30 text-white px-10 py-4 rounded-full text-base font-semibold tracking-wide hover:bg-white/10 active:scale-95 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                        >
                            Learn More
                        </Link>
                    </div>
                </div>

                <div
                    aria-hidden="true"
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
                >
                    <span className="text-white text-xs tracking-widest uppercase">Scroll</span>
                    <div className="w-px h-10 bg-gradient-to-b from-white to-transparent" />
                </div>
            </section>

            <section
                ref={stats.ref}
                aria-label="Platform statistics"
                className={`
          bg-slate-900 border-y border-slate-800 py-12 px-6
          transition-all duration-700 ease-out delay-100
          ${stats.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        `}
            >
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
                    <AnimatedStat value="50K+" label="Active Miners" />
                    <AnimatedStat value="$2M+" label="Paid Out Daily" />
                    <AnimatedStat value="99.9%" label="Uptime" />
                    <AnimatedStat value="256-bit" label="Encryption" />
                </div>
            </section>

            <section
                ref={cards.ref}
                aria-label="Mining hardware options"
                className={`
          bg-slate-950 py-28 px-6
          transition-all duration-1000 ease-out
          ${cards.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        `}
            >
                <div className="max-w-5xl mx-auto mb-20 text-center">
                    <h2 className="text-white text-3xl sm:text-4xl font-extrabold mb-4">
                        Choose Your Mining Path
                    </h2>
                    <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                        Build long-term wealth with a <strong className="text-white">secure</strong>, <strong className="text-white">transparent</strong>, and <strong className="text-white">high-performance</strong> platform — engineered for <strong className="text-yellow-400">daily earnings</strong> with confidence.
                    </p>
                </div>

                <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0">
                    <MiningCard title="ASIC" image="/asic.png" description="Mining with" />

                    <div
                        aria-hidden="true"
                        className="z-20 flex-shrink-0 w-24 h-24 rounded-full bg-yellow-400 text-black flex items-center justify-center text-sm font-extrabold text-center leading-tight shadow-2xl shadow-yellow-400/30 md:-mx-4"
                    >
                        OR<br />AND
                    </div>

                    <MiningCard title="GPU / CPU" image="/gpu.png" description="Mining with" />
                </div>
            </section>

            <section
                ref={trust.ref}
                aria-label="Why investors trust BittXS"
                className={`
          bg-slate-900 py-28 px-6
          transition-all duration-1000 ease-out
          ${trust.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        `}
            >
                <div className="max-w-5xl mx-auto flex flex-col items-center gap-16">
                    <div className="text-center max-w-3xl">
                        <h2 className="text-white text-3xl sm:text-4xl font-extrabold mb-4">
                            Built for Serious Investors
                        </h2>
                        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                            Trusted by thousands of investors worldwide, BittXS provides <strong className="text-white">real-time mining insights</strong>, <strong className="text-white">secure daily payouts</strong>, and <strong className="text-white">bank-grade security</strong> — so your capital works for you while you stay in control.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                        <TrustBadge icon="🔒" text="Bank-Grade AES-256 Security" />
                        <TrustBadge icon="⚡" text="Real-Time Mining Dashboard" />
                        <TrustBadge icon="💸" text="Secure Daily Payouts" />
                        <TrustBadge icon="🌐" text="Global Mining Infrastructure" />
                        <TrustBadge icon="📊" text="Transparent Earnings Reports" />
                        <TrustBadge icon="🛡️" text="24/7 Fraud Monitoring" />
                    </div>

                    <Link
                        href="/signup"
                        className="bg-yellow-400 text-black px-12 py-4 rounded-full text-base font-bold tracking-wide hover:bg-yellow-300 active:scale-95 transition-all duration-200 shadow-lg shadow-yellow-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400"
                    >
                        Join BittXS Now
                    </Link>
                </div>
            </section>
        </>
    );
}
