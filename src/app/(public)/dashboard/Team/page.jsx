"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ─────────────────────────────────────────────
   StatCard
───────────────────────────────────────────── */
const StatCard = React.memo(function StatCard({ label, value }) {
    return (
        <article className="group relative rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-2xl hover:shadow-yellow-500/20 transition duration-300">
            <div
                className="absolute inset-0 rounded-3xl bg-yellow-400/10 opacity-0 group-hover:opacity-100 blur-xl transition"
                aria-hidden="true"
            />
            <div className="relative z-10">
                <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                <h3 className="mt-3 text-3xl font-extrabold text-white">{value}</h3>
            </div>
        </article>
    );
});

/* ─────────────────────────────────────────────
   Node status constants
───────────────────────────────────────────── */
const STATUS = {
    ROOT: "root",
    QUALIFIED: "qualified",
    PENDING: "pending",
    ZERO: "zero",
    GHOST: "ghost",
    EMPTY: "empty",
};

/* ─────────────────────────────────────────────
   PersonIcon — inline SVG silhouette
───────────────────────────────────────────── */
function PersonIcon({ color = "currentColor", size = 22 }) {
    return (
        <svg
            aria-hidden="true"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="12" cy="7" r="4" />
            <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
        </svg>
    );
}

/* ─────────────────────────────────────────────
   CheckBadge — small green check overlay
───────────────────────────────────────────── */
function CheckBadge() {
    return (
        <span
            aria-label="Qualified"
            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 border border-slate-950"
        >
            <svg
                aria-hidden="true"
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M2 6.5l3 3 5-5"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
}

/* ─────────────────────────────────────────────
   ReferralNode — single circle node
   
   Status colour map:
   • root      → amber-500  (you)
   • qualified → emerald-500 (active referral)
   • pending   → white/slate (joined, no investment yet)
   • ghost     → slate-700   (slot exists, unfilled — BRIGHTER than before)
   • empty     → dashed border only (capacity placeholder)
───────────────────────────────────────────── */
const NODE_STYLES = {
    [STATUS.ROOT]: "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/25",
    [STATUS.QUALIFIED]: "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30",
    [STATUS.PENDING]: "bg-white border-slate-300 text-slate-950 shadow-sm",
    [STATUS.ZERO]: "bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/30",
    [STATUS.GHOST]: "bg-slate-900 border-slate-800 text-slate-500 border-dashed",
    [STATUS.EMPTY]: "bg-slate-950/90 border-slate-800 border-dashed text-slate-500",
};

const ReferralNode = React.memo(function ReferralNode({
    status,
    label,
    showCheck = false,
}) {
    const isVisible = status !== STATUS.EMPTY;
    const isGhost = status === STATUS.GHOST;

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div
                className={`
          relative flex h-14 w-14 items-center justify-center
          rounded-full border-2 transition-all duration-500
          ${NODE_STYLES[status] ?? NODE_STYLES[STATUS.EMPTY]}
        `}
            >
                {isVisible && (
                    <PersonIcon
                        color={
                            status === STATUS.ROOT || status === STATUS.QUALIFIED || status === STATUS.ZERO
                                ? "#ffffff"
                                : status === STATUS.PENDING
                                    ? "#0f172a"
                                    : status === STATUS.GHOST
                                        ? "#94a3b8"
                                        : "#64748b"
                        }
                        size={22}
                    />
                )}
                {showCheck && <CheckBadge />}
            </div>

            {label ? (
                <p className="max-w-[72px] truncate text-center text-[11px] text-slate-400 leading-tight">
                    {label}
                </p>
            ) : isGhost ? (
                /* Ghost slot hint — helps users understand open positions */
                <p className="text-[10px] text-slate-600 leading-tight">open</p>
            ) : null}
        </div>
    );
});

/* ─────────────────────────────────────────────
   ReferralRow — one level of the pyramid
───────────────────────────────────────────── */
const ReferralRow = React.memo(function ReferralRow({
    title,
    filled,
    capacity,
    nodes,
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)] items-center">
            {/* Level label */}
            <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 font-semibold">
                    {title}
                </p>
                <p className="mt-1 text-sm font-semibold text-white tabular-nums">
                    {filled}
                    <span className="text-slate-600">/{capacity}</span>
                </p>
            </div>

            {/* Nodes — wrap on mobile */}
            <div className="flex flex-wrap gap-3">
                {nodes.map((node, idx) => (
                    <ReferralNode key={`${title}-${idx}`} {...node} />
                ))}
            </div>
        </div>
    );
});

/* ─────────────────────────────────────────────
   buildNodes — helper to fill a row
───────────────────────────────────────────── */
function buildNodes(count, capacity, filledStatus, qualifiedUpTo = 0) {
    return Array.from({ length: capacity }, (_, idx) => {
        if (idx >= count) {
            return { status: STATUS.GHOST };
        }
        const isQualified = idx < qualifiedUpTo;
        return {
            status: isQualified ? STATUS.QUALIFIED : filledStatus,
            showCheck: isQualified,
        };
    });
}

/* ─────────────────────────────────────────────
   Legend — explains the colour coding
───────────────────────────────────────────── */
function Legend() {
    const items = [
        { cls: "bg-amber-600 border-amber-500", label: "You (root)" },
        { cls: "bg-emerald-600 border-emerald-500", label: "Invested" },
        { cls: "bg-white border-slate-300", label: "Referred sign-up" },
        { cls: "bg-red-600 border-red-500", label: "Zero balance" },
        { cls: "bg-slate-900 border-slate-800 border-dashed", label: "Open slot" },
    ];
    return (
        <div className="flex flex-wrap gap-4 mt-2">
            {items.map(({ cls, label }) => (
                <div key={label} className="flex items-center gap-2">
                    <span className={`inline-block h-4 w-4 rounded-full border-2 ${cls}`} aria-hidden="true" />
                    <span className="text-[11px] text-slate-400">{label}</span>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────
   ReferralNetwork — full pyramid section
───────────────────────────────────────────── */
const ReferralNetwork = React.memo(function ReferralNetwork({ data }) {
    const directRefs = useMemo(() => data?.directReferrals ?? [], [data?.directReferrals]);
    const totalTeam = data?.teamMembersCount ?? 0;
    const qualifiedCount = data?.qualifiedReferralsCount ?? 0;
    const referralCode = data?.referralCode ?? null;
    const teamEarnings = data?.teamEarnings ?? 0;

    const directQualified = useMemo(() => directRefs.filter((r) => r.isQualified).length, [directRefs]);

    /* Distribute totalTeam across levels */
    const [l1, l2, l3, l4, l5] = useMemo(() => {
        const d1 = Math.min(2, directRefs.length);
        let rem = Math.max(0, totalTeam - d1);
        const d2 = Math.min(4, rem); rem -= d2;
        const d3 = Math.min(8, rem); rem -= d3;
        const d4 = Math.min(16, rem); rem -= d4;
        const d5 = Math.min(32, rem);
        return [d1, d2, d3, d4, d5];
    }, [directRefs.length, totalTeam]);

    const l2Qualified = Math.min(l2, Math.max(0, qualifiedCount - directQualified));

    /* Level-1: one node per direct referral slot (max 2) */
    const level1Nodes = useMemo(
        () =>
            Array.from({ length: 2 }, (_, idx) => {
                if (idx >= directRefs.length) return { status: STATUS.GHOST, label: "" };
                const ref = directRefs[idx];
                return {
                    status: ref.status === "qualified"
                        ? STATUS.QUALIFIED
                        : ref.status === "zero"
                            ? STATUS.ZERO
                            : STATUS.PENDING,
                    showCheck: ref.status === "qualified",
                    label: ref.username?.slice(0, 9) || "",
                };
            }),
        [directRefs]
    );

    /* 
     * KEY FIX — green logic:
     * When referralCode is used (any user in the tree), the node turns QUALIFIED (green).
     * Levels 2-5 use buildNodes which marks nodes green up to `qualifiedUpTo`.
     */
    const level2Nodes = useMemo(
        () => buildNodes(l2, 4, STATUS.PENDING, l2Qualified),
        [l2, l2Qualified]
    );
    const level3Nodes = useMemo(() => buildNodes(l3, 8, STATUS.PENDING, 0), [l3]);
    const level4Nodes = useMemo(() => buildNodes(l4, 16, STATUS.PENDING, 0), [l4]);
    const level5Nodes = useMemo(() => buildNodes(l5, 32, STATUS.GHOST, 0), [l5]);

    const statCards = [
        { label: "Referral Code", value: referralCode || "—" },
        { label: "Team Members", value: totalTeam },
        { label: "Qualified", value: qualifiedCount, accent: "emerald" },
        { label: "Team Earnings", value: `$${teamEarnings.toFixed(2)}` },
    ];

    return (
        <section
            aria-labelledby="referral-network-heading"
            className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 shadow-2xl"
        >
            {/* Header row */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2
                        id="referral-network-heading"
                        className="text-2xl font-extrabold text-white"
                    >
                        Referral Network
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 max-w-xl leading-relaxed">
                        Nodes turn{" "}
                        <span className="text-emerald-400 font-semibold">green</span> when a
                        referral completes their first investment. Share your referral code
                        to earn automatic rewards.
                    </p>
                    <Legend />
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:w-auto w-full">
                    {statCards.map(({ label, value, accent }) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center"
                        >
                            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 font-semibold leading-snug">
                                {label}
                            </p>
                            <p
                                className={`mt-2 text-lg font-bold tabular-nums truncate ${accent === "emerald" ? "text-emerald-400" : "text-white"
                                    }`}
                            >
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pyramid rows */}
            <div className="space-y-5 divide-y divide-slate-800/50">
                {[
                    { title: "Root", filled: 1, capacity: 1, nodes: [{ status: STATUS.ROOT, label: "You", showCheck: false }] },
                    { title: "Level 1", filled: l1, capacity: 2, nodes: level1Nodes },
                    { title: "Level 2", filled: l2, capacity: 4, nodes: level2Nodes },
                    { title: "Level 3", filled: l3, capacity: 8, nodes: level3Nodes },
                    { title: "Level 4", filled: l4, capacity: 16, nodes: level4Nodes },
                    { title: "Level 5", filled: l5, capacity: 32, nodes: level5Nodes },
                ].map((row) => (
                    <div key={row.title} className="pt-5 first:pt-0">
                        <ReferralRow {...row} />
                    </div>
                ))}
            </div>
        </section>
    );
});

/* ─────────────────────────────────────────────
   Team page — data fetching shell
───────────────────────────────────────────── */
export default function Team() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        async function fetchTeam() {
            try {
                const res = await fetch("/api/user/team");
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "Failed to load team data");
                if (mounted) setData(json.data);
            } catch (err) {
                if (mounted) setError(err.message);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchTeam();
        return () => { mounted = false; };
    }, []);

    return (
        <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* ── Hero header ───────────────────────────────── */}
                <header
                    aria-labelledby="team-dashboard-heading"
                    className="rounded-3xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/20 to-black/20 p-8 shadow-2xl"
                >
                    <p className="text-sm uppercase tracking-[0.4em] text-yellow-300 font-semibold">
                        Team Rewards
                    </p>
                    <h1
                        id="team-dashboard-heading"
                        className="mt-4 text-3xl sm:text-4xl font-extrabold text-white"
                    >
                        Team Dashboard
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm sm:text-base text-gray-300 leading-relaxed">
                        Build your team with direct referrals, track first investments, and
                        earn referral rewards automatically.
                    </p>
                </header>

                {/* ── Loading skeleton ──────────────────────────── */}
                {loading && (
                    <div
                        aria-live="polite"
                        aria-label="Loading team data"
                        className="rounded-3xl bg-slate-900/80 p-8 shadow-xl animate-pulse space-y-4"
                    >
                        <div className="h-4 w-48 rounded-full bg-slate-700" />
                        <div className="h-4 w-72 rounded-full bg-slate-800" />
                        <div className="h-4 w-36 rounded-full bg-slate-800" />
                    </div>
                )}

                {/* ── Error banner ──────────────────────────────── */}
                {error && (
                    <div
                        role="alert"
                        className="rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-red-200 shadow-xl"
                    >
                        <p className="font-semibold">Unable to load team data</p>
                        <p className="mt-2 text-sm">{error}</p>
                    </div>
                )}

                {/* ── Main content ──────────────────────────────── */}
                {!loading && !error && data && (
                    <>
                        <ReferralNetwork data={data} />

                        {/* ── Direct referral activity table ──────────── */}
                        <section
                            aria-labelledby="referral-activity-heading"
                            className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 shadow-2xl"
                        >
                            <h2
                                id="referral-activity-heading"
                                className="text-2xl font-extrabold text-white"
                            >
                                Direct Referral Activity
                            </h2>
                            <p className="mt-2 text-sm text-gray-400">
                                Each direct referral that completes their first investment earns
                                you a reward.
                            </p>

                            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-800">
                                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/60">
                                            <th scope="col" className="py-3 px-5 text-xs uppercase tracking-widest text-slate-500 font-semibold">
                                                Referral
                                            </th>
                                            <th scope="col" className="py-3 px-5 text-xs uppercase tracking-widest text-slate-500 font-semibold">
                                                Joined
                                            </th>
                                            <th scope="col" className="py-3 px-5 text-xs uppercase tracking-widest text-slate-500 font-semibold">
                                                Invested
                                            </th>
                                            <th scope="col" className="py-3 px-5 text-xs uppercase tracking-widest text-slate-500 font-semibold">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.directReferrals.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="py-10 px-5 text-center text-slate-500"
                                                >
                                                    No direct referrals yet. Share your referral code to
                                                    start building your team.
                                                </td>
                                            </tr>
                                        ) : (
                                            data.directReferrals.map((ref) => (
                                                <tr
                                                    key={`${ref.username}-${ref.joinedAt}`}
                                                    className="border-b border-slate-800/70 transition-colors hover:bg-white/[0.03]"
                                                >
                                                    <td className="py-4 px-5 font-medium text-white">
                                                        {ref.username}
                                                    </td>
                                                    <td className="py-4 px-5 text-slate-400">
                                                        {new Date(ref.joinedAt).toLocaleDateString(undefined, {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </td>
                                                    <td className="py-4 px-5 text-slate-100 tabular-nums">
                                                        ${ref.investedAmount.toFixed(2)}
                                                    </td>
                                                    <td className="py-4 px-5">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ref.isQualified
                                                                    ? "bg-emerald-500/15 text-emerald-300"
                                                                    : "bg-yellow-500/15 text-yellow-300"
                                                                }`}
                                                        >
                                                            {/* Status dot */}
                                                            <span
                                                                aria-hidden="true"
                                                                className={`inline-block h-1.5 w-1.5 rounded-full ${ref.isQualified
                                                                        ? "bg-emerald-400"
                                                                        : "bg-yellow-400"
                                                                    }`}
                                                            />
                                                            {ref.isQualified
                                                                ? "First investment complete"
                                                                : "Awaiting first investment"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}