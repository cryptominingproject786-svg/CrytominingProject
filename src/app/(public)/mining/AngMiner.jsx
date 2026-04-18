"use client";

import Image from "next/image";
import { useDispatch } from "react-redux";
import { openPurchaseModal } from "../../../Redux/Slices/MiningSlice";
import InvestModal from "./InvestModal";

/* ─────────────────────────────────────────────────────────────
   Static data — module-level, zero re-render cost
───────────────────────────────────────────────────────────── */
const MINERS = Object.freeze([
    {
        name: "Mining Machine S15",
        image: "/ANG.png",
        returnRate: "2%",
        cycle: "Daily",
        progress: 82.75,
        price: 10,
        badge: "Popular",
    },
    {
        name: "Mining RIG-819",
        image: "/Rig.png",
        returnRate: "2%",
        cycle: "1 Day",
        progress: 56.30,
        price: 10,
        badge: null,
    },
    {
        name: "Minerbase Machine L11",
        image: "/ANG.png",
        returnRate: "2%",
        cycle: "1 Day",
        progress: 40.84,
        price: 10,
        badge: null,
    },
    {
        name: "Mining Machine D9",
        image: "/D9.png",
        returnRate: "2%",
        cycle: "5 Days",
        progress: 44.30,
        price: 5,
        badge: "Value",
    },
    {
        name: "Mining RIG S21",
        image: "/S21.png",
        returnRate: "2%",
        cycle: "1 Day",
        progress: 38.41,
        price: 5,
        badge: null,
    },
    {
        name: "Full Mining Machine L9",
        image: "/L9.png",
        returnRate: "2%",
        cycle: "1 Day",
        progress: 39.76,
        price: 5,
        badge: null,
    },
]);

/* ─────────────────────────────────────────────────────────────
   StatPill — small key/value chip inside a card
───────────────────────────────────────────────────────────── */
function StatPill({ label, value, highlight = false }) {
    return (
        <div className="flex flex-col items-center gap-1 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 min-w-0">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-semibold whitespace-nowrap">
                {label}
            </span>
            <span
                className={`text-sm sm:text-base font-bold tabular-nums ${highlight ? "text-yellow-400" : "text-white"
                    }`}
            >
                {value}
            </span>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   ProgressBar — accessible progress indicator
───────────────────────────────────────────────────────────── */
function ProgressBar({ value }) {
    const clamped = Math.min(100, Math.max(0, value));
    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
                    Capacity
                </span>
                <span className="text-xs font-bold text-yellow-400 tabular-nums">
                    {clamped.toFixed(2)}%
                </span>
            </div>
            <div
                role="progressbar"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Mining capacity: ${clamped.toFixed(2)}%`}
                className="relative h-2.5 sm:h-3 w-full rounded-full bg-white/10 overflow-hidden"
            >
                {/* Glow track */}
                <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-700"
                    style={{ width: `${clamped}%` }}
                />
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   MinerCard — single mining plan card
───────────────────────────────────────────────────────────── */
function MinerCard({ miner, onBuy, priority }) {
    return (
        <article
            itemScope
            itemType="https://schema.org/Product"
            className="
        group relative
        flex flex-col sm:flex-row
        items-center sm:items-stretch
        gap-6 sm:gap-0
        bg-white/5 backdrop-blur-xl
        border border-white/10
        hover:border-yellow-400/40
        rounded-3xl
        p-5 sm:p-6 lg:p-8
        shadow-xl hover:shadow-yellow-400/10
        transition-all duration-300
        overflow-hidden
      "
        >
            {/* Subtle hover glow */}
            <div
                aria-hidden="true"
                className="
          absolute inset-0 rounded-3xl
          bg-gradient-to-br from-yellow-400/5 to-transparent
          opacity-0 group-hover:opacity-100
          transition-opacity duration-500 pointer-events-none
        "
            />

            {/* ── Badge ─────────────────────────────────────────── */}
            {miner.badge && (
                <div
                    aria-label={miner.badge}
                    className="
            absolute top-4 left-4
            bg-yellow-400 text-black
            text-[10px] font-extrabold uppercase tracking-widest
            px-3 py-1 rounded-full shadow-lg shadow-yellow-400/30
          "
                >
                    {miner.badge}
                </div>
            )}

            {/* ── Machine image ─────────────────────────────────── */}
            <div className="relative flex-shrink-0 flex items-center justify-center w-32 h-32 sm:w-36 sm:h-36 lg:w-44 lg:h-44">
                {/* Circular glow behind image */}
                <div
                    aria-hidden="true"
                    className="
            absolute inset-0 rounded-full
            bg-yellow-400/10
            group-hover:bg-yellow-400/20
            transition-colors duration-500
          "
                />
                <Image
                    src={miner.image}
                    alt={`${miner.name} crypto mining hardware`}
                    fill
                    sizes="(max-width: 640px) 128px, (max-width: 1024px) 144px, 176px"
                    priority={priority}
                    className="object-contain drop-shadow-2xl relative z-10"
                />
            </div>

            {/* ── Card body ─────────────────────────────────────── */}
            <div className="relative z-10 flex flex-col flex-1 sm:pl-6 lg:pl-8 w-full gap-4">

                {/* Name + price row */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <h3
                        itemProp="name"
                        className="text-base sm:text-lg lg:text-xl font-extrabold text-white leading-snug"
                    >
                        {miner.name}
                    </h3>

                    {/* Price pill */}
                    <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5">
                        <span className="text-yellow-400 font-extrabold text-sm sm:text-base tabular-nums">
                            {miner.price} USDT
                        </span>
                    </div>

                    {/* Schema.org meta — invisible */}
                    <meta itemProp="priceCurrency" content="USDT" />
                    <meta itemProp="price" content={String(miner.price)} />
                </div>

                {/* Stat pills row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatPill label="Return" value={miner.returnRate} highlight />
                    <StatPill label="Cycle" value={miner.cycle} />
                    <StatPill label="Per Day" value="Unlimited" />
                    <StatPill label="Total Invest" value="Unlimited" />
                </div>

                {/* Progress bar */}
                <ProgressBar value={miner.progress} />

                {/* CTA row */}
                <div className="flex items-center justify-end mt-1">
                    <button
                        type="button"
                        aria-label={`Buy ${miner.name} mining plan for ${miner.price} USDT`}
                        onClick={() => onBuy(miner)}
                        className="
              relative overflow-hidden
              bg-yellow-400 hover:bg-yellow-300
              active:scale-95
              text-black font-extrabold
              px-7 py-2.5 rounded-full
              text-sm sm:text-base
              shadow-lg shadow-yellow-400/30
              hover:shadow-yellow-400/50
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]
              transition-all duration-200
            "
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </article>
    );
}

/* ─────────────────────────────────────────────────────────────
   MiningOptions — main export
───────────────────────────────────────────────────────────── */
export default function MiningOptions() {
    const dispatch = useDispatch();

    const handleBuy = (miner) => dispatch(openPurchaseModal(miner));

    return (
        <section
            aria-labelledby="mining-options-heading"
            className="
        w-full min-h-screen
        bg-gradient-to-br from-[#0f172a] via-[#020617] to-black
        py-12 sm:py-16 px-4 sm:px-6 lg:px-10 xl:px-16
      "
        >
            {/* ── Section header ────────────────────────────────── */}
            <header className="max-w-4xl mx-auto mb-10 sm:mb-14 text-center">
                <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-yellow-400 font-semibold mb-3">
                    Investment Plans
                </p>
                <h2
                    id="mining-options-heading"
                    className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight"
                >
                    Crypto Mining{" "}
                    <span className="text-yellow-400">Machines</span>
                </h2>
                <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                    Choose a mining plan, deposit USDT, and start earning daily returns
                    automatically. All plans offer unlimited investments per day.
                </p>
            </header>

            {/* ── Card grid ─────────────────────────────────────── */}
            <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 sm:gap-6">
                {MINERS.map((miner, index) => (
                    <MinerCard
                        key={miner.name}
                        miner={miner}
                        onBuy={handleBuy}
                        priority={index < 2}
                    />
                ))}
            </div>

            {/* ── Invest modal ──────────────────────────────────── */}
            <InvestModal />
        </section>
    );
}