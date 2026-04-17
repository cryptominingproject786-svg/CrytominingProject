"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ─────────────────────────────────────────────
   StatCard — unchanged, memoised for perf
───────────────────────────────────────────── */
const StatCard = React.memo(function StatCard({ label, value }) {
    return (
        <article className="group relative rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-2xl hover:shadow-yellow-500/20 transition duration-300">
            <div className="absolute inset-0 rounded-3xl bg-yellow-400/10 opacity-0 group-hover:opacity-100 blur-xl transition" aria-hidden="true" />
            <div className="relative z-10">
                <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                <h3 className="mt-3 text-3xl font-extrabold text-white">{value}</h3>
            </div>
        </article>
    );
});

/* ─────────────────────────────────────────────
   UserSilhouette — person icon inside a circle
───────────────────────────────────────────── */
function UserSilhouette({ cx, cy, r, color }) {
    const headR = r * 0.30;
    const headCy = cy - r * 0.20;
    const shoulderW = r * 0.48;
    const shoulderTopY = cy + r * 0.06;
    const shoulderBotY = cy + r * 0.50;
    return (
        <g style={{ pointerEvents: "none" }}>
            <circle cx={cx} cy={headCy} r={headR} fill={color} />
            <path
                d={`M ${cx - shoulderW} ${shoulderBotY}
                    Q ${cx - shoulderW} ${shoulderTopY} ${cx} ${shoulderTopY}
                    Q ${cx + shoulderW} ${shoulderTopY} ${cx + shoulderW} ${shoulderBotY} Z`}
                fill={color}
            />
        </g>
    );
}

/* ─────────────────────────────────────────────
   TreeNode — single node (root / level-1 / ghost)
   `revealed` drives the white→green transition
───────────────────────────────────────────── */
const TRANSITION = "fill 0.85s ease, stroke 0.85s ease, opacity 0.85s ease";

const TreeNode = React.memo(function TreeNode({
    cx, cy, r,
    isRoot = false,
    isGhost = false,
    isQualified = false,
    revealed = false,
    label = null,
}) {
    /* Color logic ─────────────────────────── */
    let circleFill, circleStroke, iconColor;

    if (isGhost) {
        circleFill = "rgba(255,255,255,0.04)";
        circleStroke = "rgba(255,255,255,0.10)";
        iconColor = "transparent";
    } else if (isRoot) {
        circleFill = "#f59e0b";
        circleStroke = "#d97706";
        iconColor = "#ffffff";
    } else if (revealed && isQualified) {
        circleFill = "#10b981";   // emerald-500
        circleStroke = "#059669"; // emerald-600
        iconColor = "#ffffff";
    } else {
        // pre-animation OR unqualified
        circleFill = "#ffffff";
        circleStroke = "#94a3b8"; // slate-400
        iconColor = "#1e293b";    // slate-800
    }

    return (
        <g>
            {/* Glow ring around root */}
            {isRoot && (
                <circle
                    cx={cx} cy={cy}
                    r={r + 7}
                    fill="rgba(245,158,11,0.18)"
                    style={{ transition: TRANSITION }}
                />
            )}

            {/* Main circle */}
            <circle
                cx={cx} cy={cy} r={r}
                fill={circleFill}
                stroke={circleStroke}
                strokeWidth={isGhost ? 1 : 2}
                strokeDasharray={isGhost ? "3 3" : undefined}
                style={{ transition: TRANSITION }}
            />

            {/* Person silhouette */}
            {!isGhost && (
                <UserSilhouette cx={cx} cy={cy} r={r} color={iconColor} />
            )}

            {/* Green check badge for qualified nodes */}
            {!isRoot && !isGhost && revealed && isQualified && (
                <g style={{ transition: "opacity 0.85s ease" }}>
                    <circle
                        cx={cx + r * 0.68}
                        cy={cy - r * 0.68}
                        r={7}
                        fill="#10b981"
                        stroke="#0f172a"
                        strokeWidth={1.5}
                    />
                    {/* Checkmark */}
                    <polyline
                        points={`${cx + r * 0.68 - 3.5},${cy - r * 0.68 + 0.5} ${cx + r * 0.68 - 0.5},${cy - r * 0.68 + 3.5} ${cx + r * 0.68 + 3.5},${cy - r * 0.68 - 3}`}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>
            )}

            {/* Label */}
            {label && (
                <text
                    x={cx}
                    y={cy + r + 15}
                    textAnchor="middle"
                    fill={isRoot ? "#f59e0b" : "#64748b"}
                    fontSize={10}
                    fontWeight={isRoot ? "700" : "400"}
                    style={{ userSelect: "none", transition: "fill 0.85s ease" }}
                >
                    {label}
                </text>
            )}
        </g>
    );
});

/* ─────────────────────────────────────────────
   Referral Network — the full pyramid visualisation
───────────────────────────────────────────── */
const STATUS = {
    ROOT: "root",
    QUALIFIED: "qualified",
    PENDING: "pending",
    GHOST: "ghost",
    EMPTY: "empty",
};

const ReferralNode = React.memo(function ReferralNode({ status, label, showCheck }) {
    const statusStyles = {
        [STATUS.ROOT]: "bg-amber-500 border-amber-400 text-white",
        [STATUS.QUALIFIED]: "bg-emerald-500 border-emerald-400 text-white",
        [STATUS.PENDING]: "bg-white border-slate-300 text-slate-950",
        [STATUS.GHOST]: "bg-slate-950/40 border-slate-600/30 text-slate-400",
        [STATUS.EMPTY]: "border-dashed border-slate-700/30 text-transparent",
    }[status];

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`relative flex h-14 w-14 items-center justify-center rounded-full border transition duration-300 ${statusStyles}`}>
                {status !== STATUS.EMPTY && (
                    <span aria-hidden="true" className="text-xl">
                        {status === STATUS.GHOST ? "" : "👤"}
                    </span>
                )}
                {showCheck && (
                    <span className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-white shadow-lg">
                        ✓
                    </span>
                )}
            </div>
            {label ? (
                <p className="max-w-17.5 truncate text-center text-[11px] text-slate-400">
                    {label}
                </p>
            ) : null}
        </div>
    );
});

const ReferralRow = React.memo(function ReferralRow({ title, filled, capacity, nodes }) {
    return (
        <div className="grid gap-4 sm:grid-cols-[128px_minmax(0,1fr)] items-center">
            <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{title}</p>
                <p className="mt-1 text-sm font-semibold text-white">{filled}/{capacity}</p>
            </div>
            <div className="flex flex-wrap gap-3">
                {nodes.map((node, index) => (
                    <ReferralNode key={`${title}-${index}`} {...node} />
                ))}
            </div>
        </div>
    );
});

function buildNodes(count, capacity, status, qualifiedCount = 0) {
    return Array.from({ length: capacity }, (_, index) => {
        if (index >= count) {
            return { status: STATUS.GHOST };
        }
        return {
            status,
            showCheck: status === STATUS.QUALIFIED && index < qualifiedCount,
        };
    });
}

const ReferralNetwork = React.memo(function ReferralNetwork({ data }) {
    const directRefs = data?.directReferrals ?? [];
    const totalTeam = data?.teamMembersCount ?? 0;
    const qualifiedCount = data?.qualifiedReferralsCount ?? 0;
    const directQualified = directRefs.filter((ref) => ref.isQualified).length;

    const [level1Count, level2Count, level3Count, level4Count, level5Count] = useMemo(() => {
        const directCount = Math.min(2, directRefs.length);
        let remaining = Math.max(0, totalTeam - directCount);
        const level2 = Math.min(4, remaining);
        remaining -= level2;
        const level3 = Math.min(8, remaining);
        remaining -= level3;
        const level4 = Math.min(16, remaining);
        remaining -= level4;
        const level5 = Math.min(32, remaining);
        return [directCount, level2, level3, level4, level5];
    }, [directRefs.length, totalTeam]);

    const level2Qualified = Math.min(level2Count, Math.max(0, qualifiedCount - directQualified));

    const level1Nodes = useMemo(
        () =>
            Array.from({ length: 2 }, (_, idx) => {
                if (idx >= directRefs.length) {
                    return { status: STATUS.EMPTY, label: "" };
                }
                const ref = directRefs[idx];
                return {
                    status: ref.isQualified ? STATUS.QUALIFIED : STATUS.PENDING,
                    showCheck: ref.isQualified,
                    label: ref.username?.slice(0, 9) || "",
                };
            }),
        [directRefs]
    );

    const level2Nodes = useMemo(() => buildNodes(level2Count, 4, STATUS.PENDING, 0).map((node, idx) => {
        if (idx >= level2Count) return node;
        return {
            status: idx < level2Qualified ? STATUS.QUALIFIED : STATUS.PENDING,
            showCheck: idx < level2Qualified,
        };
    }), [level2Count, level2Qualified]);

    const level3Nodes = useMemo(() => buildNodes(level3Count, 8, STATUS.PENDING), [level3Count]);
    const level4Nodes = useMemo(() => buildNodes(level4Count, 16, STATUS.PENDING), [level4Count]);
    const level5Nodes = useMemo(() => buildNodes(level5Count, 32, STATUS.GHOST), [level5Count]);

    return (
        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-white">Referral Network</h2>
                    <p className="mt-2 text-sm text-slate-400 max-w-xl">
                        Nodes turn <span className="text-emerald-400 font-semibold">green</span> when a referral
                        completes their first investment.
                    </p>
                </div>
                <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-center">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Referral Code</p>
                        <p className="mt-2 text-lg font-semibold text-white">{data.referralCode || "—"}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-center">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Team Members</p>
                        <p className="mt-2 text-lg font-semibold text-white">{totalTeam}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-center">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Qualified</p>
                        <p className="mt-2 text-lg font-semibold text-emerald-400">{qualifiedCount}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-center">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Team Earnings</p>
                        <p className="mt-2 text-lg font-semibold text-white">${(data.teamEarnings ?? 0).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <ReferralRow title="ROOT" filled={1} capacity={1} nodes={[{ status: STATUS.ROOT, label: "You" }]} />
                <ReferralRow title="LEVEL 1" filled={level1Count} capacity={2} nodes={level1Nodes} />
                <ReferralRow title="LEVEL 2" filled={level2Count} capacity={4} nodes={level2Nodes} />
                <ReferralRow title="LEVEL 3" filled={level3Count} capacity={8} nodes={level3Nodes} />
                <ReferralRow title="LEVEL 4" filled={level4Count} capacity={16} nodes={level4Nodes} />
                <ReferralRow title="LEVEL 5" filled={level5Count} capacity={32} nodes={level5Nodes} />
            </div>
        </section>
    );
});

/* ─────────────────────────────────────────────
   Main Team page
───────────────────────────────────────────── */
export default function Team() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const fetchTeam = async () => {
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
        };
        fetchTeam();
        return () => { mounted = false; };
    }, []);

    const referralText = useMemo(() => {
        if (!data?.referralCode)
            return "Use your referral code on signup to start building your team.";
        return "Share your code and invite friends. Any first-level referral who completes their first investment earns you $0.25.";
    }, [data?.referralCode]);
    return (
        <main className="min-h-screen bg-linear-to-br from-black via-gray-900 to-black text-white px-4 py-8">
            <section className="max-w-6xl mx-auto space-y-8">

                {/* ── Hero header ────────────────────────────── */}
                <header className="rounded-3xl border border-yellow-500/20 bg-linear-to-r from-yellow-500/20 to-black/20 p-8 shadow-2xl">
                    <p className="text-sm uppercase tracking-[0.4em] text-yellow-300">Team Rewards</p>
                    <h1 className="mt-4 text-4xl font-extrabold text-white">Team Dashboard</h1>
                    <p className="mt-3 max-w-2xl text-sm text-gray-300 sm:text-base">
                        Build your team with direct referrals, track first investments, and earn
                        referral rewards automatically.
                    </p>
                </header>

                {/* ── Loading skeleton ────────────────────────── */}
                {loading && (
                    <div className="rounded-3xl bg-slate-900/80 p-8 shadow-xl animate-pulse">
                        <p className="text-gray-400">Loading team data…</p>
                    </div>
                )}

                {/* ── Error banner ─────────────────────────────── */}
                {error && (
                    <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-red-200 shadow-xl">
                        <p className="font-semibold">Unable to load team data</p>
                        <p className="mt-2 text-sm">{error}</p>
                    </div>
                )}

                {!loading && !error && data && (
                    <>
                        <ReferralNetwork data={data} />

                        {/* ── Direct referral activity table ──────── */}
                        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-2xl">
                            <h2 className="text-2xl font-extrabold text-white">Direct Referral Activity</h2>
                            <p className="mt-2 text-sm text-gray-400">
                                Each direct referral that completes their first investment earns you a reward.
                            </p>

                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full min-w-160 border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-sm text-slate-400">
                                            <th className="py-3 px-4">Referral</th>
                                            <th className="py-3 px-4">Joined</th>
                                            <th className="py-3 px-4">Invested</th>
                                            <th className="py-3 px-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.directReferrals.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="py-8 px-4 text-center text-gray-400">
                                                    No direct referrals yet. Share your referral code to start building your team.
                                                </td>
                                            </tr>
                                        ) : (
                                            data.directReferrals.map((ref) => (
                                                <tr
                                                    key={`${ref.username}-${ref.joinedAt}`}
                                                    className="border-b border-slate-800 transition hover:bg-white/5"
                                                >
                                                    <td className="py-4 px-4 text-white">{ref.username}</td>
                                                    <td className="py-4 px-4 text-sm text-slate-400">
                                                        {new Date(ref.joinedAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-slate-100">
                                                        ${ref.investedAmount.toFixed(2)}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ref.isQualified
                                                                ? "bg-emerald-500/15 text-emerald-300"
                                                                : "bg-yellow-500/15 text-yellow-300"
                                                                }`}
                                                        >
                                                            {ref.isQualified ? "First investment complete" : "Awaiting first investment"}
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
            </section>
        </main>
    );
}
