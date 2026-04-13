"use client";

import Image from "next/image";
import { useMemo, useCallback, useState } from "react";
import RechargeManual from "./RechargeManual";

// ─── Network config ────────────────────────────────────────────────────────────
const NETWORK_CONFIG = {
    TRC20: {
        address: "TFyLapV8rYyp155f7ZQNDxasZhAvFUy8eG",
        logo: "/TRC.png",
        label: "TRC20-USDT",
        color: "text-red-400",
        bg: "bg-red-400/10",
        qr: "/TR20QR.jpeg",
    },
    BEP20: {
        address: "0xff2222bd53be58e8900e84e9e7fd54e647cc5d02",
        logo: "/TRC.png",          // add your BEP20 logo to /public
        label: "BEP20-USDT",
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
        qr: "/Bep20QR.jpeg",       // add your BEP20 QR to /public
    },
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function RechargeClient({ network = "TRC20" }) {
    const [copied, setCopied] = useState(false);

    // Normalise prop to uppercase key; fallback to TRC20
    const key = useMemo(() => (network?.toUpperCase() in NETWORK_CONFIG
        ? network.toUpperCase()
        : "TRC20"
    ), [network]);

    const config = NETWORK_CONFIG[key];

    // Copy address with visual feedback
    const copyAddress = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(config.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const el = document.createElement("textarea");
            el.value = config.address;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [config.address]);

    const goBack = useCallback(() => window.history.back(), []);

    return (
        <main
            className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white"
        // Semantic landmark improves SEO / screen readers
        >
            {/* ── Top Bar ─────────────────────────────────────────── */}
            <header className="w-full flex items-center justify-center relative px-6 py-5 border-b border-white/10">
                <button
                    onClick={goBack}
                    aria-label="Go back"
                    className="absolute left-6 text-yellow-400 text-3xl font-bold hover:scale-110 transition"
                >
                    ‹
                </button>
                {/* h1 carries the network name for SEO page title context */}
                <h1 className="text-2xl font-extrabold tracking-wide">
                    {key} Recharge
                </h1>
            </header>

            {/* ── Main Content ─────────────────────────────────────── */}
            <section
                aria-label={`${key} USDT recharge details`}
                className="w-full flex justify-center px-4 py-8"
            >
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* ── Left: QR Card ──────────────────────────────── */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center">

                        {/* Network badge */}
                        <div className={`flex items-center gap-3 mb-6 ${config.bg} px-5 py-2 rounded-full`}>
                            {/* Fixed: both width + height declared → no aspect-ratio warning */}
                            <Image
                                src={config.logo}
                                alt={`${key} network logo`}
                                width={28}
                                height={28}
                                // Prevents layout shift; logo is small so no lazy load needed
                                priority
                            />
                            <span className={`font-semibold ${config.color} uppercase`}>
                                {config.label}
                            </span>
                        </div>

                        {/* QR code */}
                        <div className="bg-white rounded-3xl p-5 shadow-xl mb-6">
                            {/*
                             * Fixed image warning:
                             *   - Explicit width + height props set the intrinsic size
                             *   - style={{ height: "auto" }} lets CSS scale it while keeping ratio
                             *   - unoptimized keeps the JPEG pixel-perfect (no WebP conversion)
                             */}
                            <Image
                                src={config.qr}
                                alt={`${key} USDT deposit QR code`}
                                width={220}
                                height={220}
                                style={{ width: "100%", height: "auto" }}
                                priority
                                unoptimized
                            />
                        </div>

                        <p className="text-sm text-gray-400 text-center">
                            Scan with your wallet app to recharge via{" "}
                            <span className={`font-semibold ${config.color}`}>{key}</span>
                        </p>
                    </div>

                    {/* ── Right: Address Card ─────────────────────────── */}
                    <div className="bg-white rounded-3xl p-6 text-black shadow-xl flex flex-col justify-between">

                        <div>
                            <h2 className="text-lg font-bold mb-1">Recharge Address</h2>
                            <p className="text-xs text-gray-500 mb-3">
                                Only send <strong>{key} USDT</strong> to this address
                            </p>

                            {/* Address row */}
                            <div className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3 gap-3">
                                {/*
                                 * break-all prevents long hex addresses from overflowing
                                 * on small mobile screens
                                 */}
                                <span className="text-sm break-all font-medium leading-relaxed">
                                    {config.address}
                                </span>
                                <button
                                    onClick={copyAddress}
                                    aria-label="Copy recharge address"
                                    className={`
                                        shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition
                                        ${copied
                                            ? "bg-green-500 text-white"
                                            : "bg-black text-white hover:opacity-80"
                                        }
                                    `}
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>

                            <button
                                type="button"
                                className="mt-6 w-full bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-black font-bold py-4 rounded-xl text-lg transition"
                            >
                                I Have Completed Recharge
                            </button>
                        </div>

                        {/* Tips */}
                        <div className="mt-6 bg-black rounded-2xl p-4 text-sm text-gray-300 border border-yellow-400/40">
                            <ul className="space-y-2 list-disc list-inside">
                                <li>
                                    Use only{" "}
                                    <span className="text-yellow-400 font-semibold">
                                        {key}
                                    </span>{" "}
                                    network
                                </li>
                                <li>
                                    Minimum recharge:{" "}
                                    <span className="font-semibold">2 USDT</span>
                                </li>
                                <li>
                                    Funds arrive within{" "}
                                    <span className="font-semibold">1–3 minutes</span>
                                </li>
                                <li>
                                    Wrong network = <span className="text-red-400 font-semibold">permanent loss</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <RechargeManual network={key} />
        </main>
    );
}