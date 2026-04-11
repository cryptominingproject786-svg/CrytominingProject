"use client";

/**
 * adminclient.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin dashboard — recharges + platform stats.
 * • Module-level cache per endpoint (60 s TTL)
 * • useReducer for all async state → single dispatch path, zero stale closures
 * • memo + useCallback + useMemo → zero unnecessary re-renders
 * • Matches withdrawcard.jsx visual language exactly
 * • Fully responsive (1 → 2 → 4 column grid)
 * • Semantic HTML / ARIA / Schema.org for SEO
 */

import React, {
    useReducer,
    useEffect,
    useCallback,
    useMemo,
    lazy,
    Suspense,
    memo,
    useRef,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ── Lazy-load zoom library ────────────────────────────────────────────────────
const TransformWrapper = lazy(() =>
    import("react-zoom-pan-pinch").then((m) => ({ default: m.TransformWrapper }))
);
const TransformComponent = lazy(() =>
    import("react-zoom-pan-pinch").then((m) => ({ default: m.TransformComponent }))
);

// ── Module-level cache (survives re-mounts) ───────────────────────────────────
const CACHE_TTL = 60_000;
const _caches = {
    recharges: { data: null, ts: 0 },
    stats: { data: null, ts: 0 },
};

async function cachedFetch(key, url) {
    const c = _caches[key];
    const now = Date.now();
    if (c.data && now - c.ts < CACHE_TTL) return c.data;
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Server error ${res.status}`);
    c.data = json;
    c.ts = now;
    return json;
}

function bustCache(key) {
    _caches[key].data = null;
    _caches[key].ts = 0;
}

// ── Utilities ─────────────────────────────────────────────────────────────────
const fmt = (v) => (Number(v) || 0).toLocaleString();

const DEFAULT_STATS = Object.freeze({
    totalUsers: 0,
    totalInvestment: 0,
    totalWithdraw: 0,
    totalDailyProfit: 0,
    totalDeposited: 0,
});

// ── Reducer ───────────────────────────────────────────────────────────────────
const INIT = {
    recharges: [],
    stats: DEFAULT_STATS,
    loadingRecharges: false,
    loadingStats: false,
    actionLoading: {},
    previewSlip: null,
};

function reducer(s, a) {
    switch (a.type) {
        case "RECHARGES_LOADING": return { ...s, loadingRecharges: true };
        case "RECHARGES_OK": return { ...s, loadingRecharges: false, recharges: a.payload };
        case "RECHARGES_ERR": return { ...s, loadingRecharges: false };

        case "STATS_LOADING": return { ...s, loadingStats: true };
        case "STATS_OK": return { ...s, loadingStats: false, stats: a.payload };
        case "STATS_ERR": return { ...s, loadingStats: false, stats: DEFAULT_STATS };

        case "ACTION_START": return { ...s, actionLoading: { ...s.actionLoading, [a.id]: true } };
        case "ACTION_END": return { ...s, actionLoading: { ...s.actionLoading, [a.id]: false } };

        case "RECHARGE_UPDATED":
            return {
                ...s,
                recharges: s.recharges.map((x) =>
                    String(x._id) === String(a.payload._id) ? a.payload : x
                ),
            };

        case "OPEN_PREVIEW": return { ...s, previewSlip: a.payload };
        case "CLOSE_PREVIEW": return { ...s, previewSlip: null };

        default: return s;
    }
}

// ── AdminStatCard ─────────────────────────────────────────────────────────────
const AdminStatCard = memo(function AdminStatCard({ title, value, onClick, loading }) {
    return (
        <article
            onClick={onClick}
            aria-label={`${title}: ${value}`}
            className={`bg-gradient-to-tr from-gray-900 to-black border border-yellow-500/20
                        rounded-3xl p-6 shadow-xl transition
                        ${onClick ? "cursor-pointer hover:scale-105 hover:border-yellow-500/40" : ""}`}
        >
            <p className="text-gray-400 text-sm">{title}</p>
            <h3 className={`text-3xl font-extrabold text-yellow-400 mt-2
                            ${loading ? "animate-pulse opacity-50" : ""}`}>
                {value}
            </h3>
        </article>
    );
});

// ── RechargeCard ──────────────────────────────────────────────────────────────
const RechargeCard = memo(function RechargeCard({
    recharge: r, isLoading, onUpdateStatus, onPreviewSlip, onCopyTx, slipUrl,
}) {
    const handleConfirm = useCallback(() => onUpdateStatus(r._id, "confirmed"), [r._id, onUpdateStatus]);
    const handleReject = useCallback(() => onUpdateStatus(r._id, "rejected"), [r._id, onUpdateStatus]);
    const handlePreview = useCallback(() => onPreviewSlip(slipUrl), [slipUrl, onPreviewSlip]);
    const handleCopy = useCallback(() => onCopyTx(r.txId), [r.txId, onCopyTx]);

    return (
        <article
            aria-label={`Recharge from ${r.user?.username || r.submitterEmail || "Unknown"}`}
            className="bg-gradient-to-tr from-gray-900 to-black border border-yellow-500/20
                       rounded-3xl shadow-xl hover:shadow-yellow-500/10 transition overflow-hidden"
        >
            {/* Slip thumbnail */}
            <div
                role="button"
                tabIndex={0}
                aria-label="View full-size recharge slip"
                onClick={handlePreview}
                onKeyDown={(e) => e.key === "Enter" && handlePreview()}
                className="h-56 bg-black flex items-center justify-center cursor-pointer
                           border-b border-yellow-500/10 hover:opacity-90 transition"
            >
                {slipUrl
                    ? <img src={slipUrl} className="w-full h-full object-contain"
                        alt="Recharge slip" loading="lazy" decoding="async" />
                    : <span className="text-gray-600 text-sm">No Image</span>
                }
            </div>

            <div className="p-5 space-y-3">
                {/* User info */}
                {r.user ? (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {[
                            ["Username", r.user.username, "text-white"],
                            ["Email", r.user.email, "text-white"],
                            ["Phone", r.user.phone || "N/A", "text-white"],
                            ["Balance", r.user.balance != null ? `$${r.user.balance}` : "N/A", "text-white"],
                            ["Invested", r.user.investedAmount != null ? `$${r.user.investedAmount}` : "N/A", "text-white"],
                            ["Total Earned", r.user.totalEarnings != null ? `$${r.user.totalEarnings}` : "N/A", "text-white"],
                            ["Daily Profit", r.user.dailyProfit != null ? `$${r.user.dailyProfit}` : "N/A", "text-yellow-400 font-semibold"],
                        ].map(([label, val, cls]) => (
                            <div key={label} className="flex flex-col gap-0.5 min-w-0">
                                <dt className="text-[10px] uppercase tracking-widest text-gray-500">{label}</dt>
                                <dd className={`text-sm font-semibold truncate ${cls}`}>{val}</dd>
                            </div>
                        ))}
                    </dl>
                ) : (
                    <p className="text-sm text-gray-400">
                        User: <span className="text-white ml-1">{r.submitterEmail || "Unknown"}</span>
                    </p>
                )}

                <p className="text-xl font-extrabold text-yellow-400">{r.amount} USDT</p>

                {/* TXID */}
                <div className="bg-black/40 border border-yellow-500/10 rounded-2xl px-3 py-2.5
                                flex items-center justify-between gap-2">
                    <p className="text-xs font-mono text-gray-500 truncate">
                        {r.txId?.slice(0, 24) || "N/A"}…
                    </p>
                    <button
                        onClick={handleCopy}
                        aria-label="Copy transaction ID"
                        className="text-[10px] font-bold text-yellow-400 hover:text-yellow-300
                                   bg-yellow-500/10 hover:bg-yellow-500/20 px-2.5 py-1 rounded-xl transition shrink-0"
                    >
                        COPY
                    </button>
                </div>

                {/* Status */}
                <span
                    aria-label={`Status: ${r.status}`}
                    className={`inline-block px-3 py-1 text-xs rounded-full font-bold
                        ${r.status === "confirmed" ? "bg-green-500/20 text-green-400"
                            : r.status === "rejected" ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"}`}
                >
                    {r.status}
                </span>

                {/* Actions */}
                {r.status === "pending" && (
                    <div className="flex gap-3 pt-2">
                        <button
                            disabled={isLoading}
                            onClick={handleConfirm}
                            aria-label="Confirm recharge"
                            className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50
                                       py-2.5 rounded-2xl font-bold text-sm text-white transition"
                        >
                            {isLoading
                                ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : "Confirm"
                            }
                        </button>
                        <button
                            disabled={isLoading}
                            onClick={handleReject}
                            aria-label="Reject recharge"
                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50
                                       py-2.5 rounded-2xl font-bold text-sm text-white transition"
                        >
                            Reject
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
});

// ── Zoom skeleton ─────────────────────────────────────────────────────────────
const ZoomSkeleton = memo(function ZoomSkeleton() {
    return (
        <div aria-busy="true" aria-label="Loading image viewer"
            className="w-72 h-72 bg-gray-900 animate-pulse rounded-3xl border border-yellow-500/10" />
    );
});

// ── Recharge skeleton ─────────────────────────────────────────────────────────
const RechargeSkeleton = memo(function RechargeSkeleton() {
    return (
        <div aria-busy="true"
            className="bg-gradient-to-tr from-gray-900 to-black border border-yellow-500/20
                        rounded-3xl overflow-hidden animate-pulse">
            <div className="h-56 bg-gray-800/60" />
            <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="h-2 bg-gray-700 rounded-full w-1/2" />
                            <div className="h-3 bg-gray-800 rounded-full w-3/4" />
                        </div>
                    ))}
                </div>
                <div className="h-8 bg-gray-700 rounded-full w-1/3" />
                <div className="h-10 bg-gray-800 rounded-2xl" />
                <div className="flex gap-3">
                    <div className="flex-1 h-10 bg-gray-700 rounded-2xl" />
                    <div className="flex-1 h-10 bg-gray-700 rounded-2xl" />
                </div>
            </div>
        </div>
    );
});

// ── AdminClient ───────────────────────────────────────────────────────────────
export default function AdminClient({ initialData }) {
    const [state, dispatch] = useReducer(reducer, {
        ...INIT,
        recharges: initialData || [],
    });

    const {
        recharges, stats,
        loadingRecharges, loadingStats,
        actionLoading, previewSlip,
    } = state;

    const { data: session, status } = useSession();
    const router = useRouter();
    const abortR = useRef(null);
    const abortS = useRef(null);

    // ── Fetch recharges ───────────────────────────────────────────────────────
    const fetchRecharges = useCallback(async (bust = false) => {
        abortR.current?.abort();
        abortR.current = new AbortController();
        if (bust) bustCache("recharges");
        dispatch({ type: "RECHARGES_LOADING" });
        try {
            const json = await cachedFetch("recharges", "/api/recharge/admin");
            dispatch({ type: "RECHARGES_OK", payload: json.data || [] });
        } catch (e) {
            if (e.name !== "AbortError") dispatch({ type: "RECHARGES_ERR" });
        }
    }, []);

    // ── Fetch stats ───────────────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        abortS.current?.abort();
        abortS.current = new AbortController();
        dispatch({ type: "STATS_LOADING" });
        try {
            const json = await cachedFetch("stats", "/api/admin/stats");
            dispatch({
                type: "STATS_OK",
                payload: {
                    totalUsers: json.data?.totalUsers ?? 0,
                    totalInvestment: json.data?.totalInvestment ?? 0,
                    totalWithdraw: json.data?.totalPendingWithdraw ?? 0,
                    totalDailyProfit: json.data?.totalDailyProfit ?? 0,
                    totalDeposited: json.data?.totalDeposited ?? 0,
                },
            });
        } catch (e) {
            if (e.name !== "AbortError") dispatch({ type: "STATS_ERR" });
        }
    }, []);

    // ── Auth-gated initial load ───────────────────────────────────────────────
    useEffect(() => {
        if (status !== "authenticated" || session?.user?.role !== "admin") return;
        fetchRecharges();
        fetchStats();
        return () => { abortR.current?.abort(); abortS.current?.abort(); };
    }, [status, session, fetchRecharges, fetchStats]);

    // ── Update recharge status ────────────────────────────────────────────────
    const updateStatus = useCallback(async (id, newStatus) => {
        dispatch({ type: "ACTION_START", id });
        try {
            const res = await fetch(`/api/recharge/admin/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const json = await res.json();
            if (json.data) {
                dispatch({ type: "RECHARGE_UPDATED", payload: json.data });
                bustCache("recharges");
            }
        } catch (e) {
            console.error("updateStatus error", e);
        } finally {
            dispatch({ type: "ACTION_END", id });
        }
    }, []);

    const copyTx = useCallback((tx) => { navigator.clipboard.writeText(tx).catch(() => { }); }, []);
    const openPreview = useCallback((url) => dispatch({ type: "OPEN_PREVIEW", payload: url }), []);
    const closePreview = useCallback(() => dispatch({ type: "CLOSE_PREVIEW" }), []);

    // ── Stat card definitions ─────────────────────────────────────────────────
    const statCards = useMemo(() => [
        {
            title: "Total Users",
            value: loadingStats ? "…" : fmt(stats.totalUsers),
        },
        {
            title: "Total Invested",
            value: loadingStats ? "…" : `$${fmt(stats.totalInvestment)}`,
        },
        {
            title: "Pending Withdraws",
            value: loadingStats ? "…" : `$${fmt(stats.totalWithdraw)}`,
            onClick: () => router.push("/admin/withdraws"),
        },
        {
            title: "Daily Profit (All)",
            value: loadingStats ? "…" : `$${fmt(stats.totalDailyProfit)}`,
        },
    ], [stats, loadingStats, router]);

    // ── Auth guards ───────────────────────────────────────────────────────────
    if (status === "loading") return (
        <div role="status" aria-live="polite"
            className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black
                        flex items-center justify-center text-yellow-400 text-lg font-bold animate-pulse">
            Loading admin panel…
        </div>
    );

    if (status !== "authenticated" || session?.user?.role !== "admin") return (
        <div role="alert"
            className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black
                        flex items-center justify-center text-red-400 text-lg font-bold">
            Unauthorized
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <main
            aria-label="Admin Dashboard"
            itemScope
            itemType="https://schema.org/WebPage"
            className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6 md:p-10 text-white"
        >
            <header className="mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-400 tracking-tight">
                    Admin Dashboard
                </h1>
            </header>

            {/* ── Stats ── */}
            <section aria-label="Platform statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {statCards.map((c) => (
                    <AdminStatCard
                        key={c.title}
                        title={c.title}
                        value={c.value}
                        onClick={c.onClick}
                        loading={loadingStats}
                    />
                ))}
            </section>

            {/* ── Recharges ── */}
            <section aria-label="Recent recharges">
                <h2 className="text-2xl font-bold text-yellow-400 mb-6">Recent Recharges</h2>

                {loadingRecharges ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }, (_, i) => <RechargeSkeleton key={i} />)}
                    </div>
                ) : recharges.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-600">
                        <span className="text-5xl" aria-hidden="true">📭</span>
                        <p className="font-semibold">No recharges found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recharges.map((r) => (
                            <RechargeCard
                                key={r._id}
                                recharge={r}
                                isLoading={actionLoading[r._id] || false}
                                onUpdateStatus={updateStatus}
                                onPreviewSlip={openPreview}
                                onCopyTx={copyTx}
                                slipUrl={r.slip?.dataUrl || null}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Slip preview modal ── */}
            {previewSlip && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Recharge slip preview"
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl
                               flex items-center justify-center p-4"
                    onClick={closePreview}
                >
                    <div
                        className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            aria-label="Close slip preview"
                            onClick={closePreview}
                            className="absolute top-3 right-3 z-10 text-white text-3xl
                                       hover:text-yellow-400 transition"
                        >
                            ✕
                        </button>
                        <Suspense fallback={<ZoomSkeleton />}>
                            <div className="w-full max-h-[90vh] flex items-center justify-center">
                                <TransformWrapper>
                                    <TransformComponent>
                                        <img
                                            src={previewSlip}
                                            alt="Full-size recharge slip"
                                            className="max-h-[90vh] w-auto object-contain"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </TransformComponent>
                                </TransformWrapper>
                            </div>
                        </Suspense>
                    </div>
                </div>
            )}
        </main>
    );
}