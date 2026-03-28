"use client";

import React, {
    memo,
    useCallback,
    useState,
    useEffect,
    useMemo,
    useRef,
} from "react";
import { useRouter } from "next/navigation";

// ── Module-level fetch cache (survives component re-mounts) ───────────────────
const CACHE_TTL_MS = 60_000; // 60 s
const _cache = { data: null, ts: 0 };

async function fetchWithdrawsFromAPI() {
    const now = Date.now();
    if (_cache.data && now - _cache.ts < CACHE_TTL_MS) return _cache.data;
    const res = await fetch("/api/withdraw/admin", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Server error ${res.status}`);
    const data = json.data ?? json.withdraws ?? json;
    _cache.data = data;
    _cache.ts = now;
    return data;
}

function invalidateCache() {
    _cache.data = null;
    _cache.ts = 0;
}

// ── Static config — defined once outside render cycle ────────────────────────
const STATUS_CFG = {
    approved: {
        label: "Approved",
        bar: "from-green-500 to-emerald-400",
        badge: "bg-green-500/20 text-green-400",
        dot: "bg-green-400",
    },
    rejected: {
        label: "Rejected",
        bar: "from-red-500 to-rose-400",
        badge: "bg-red-500/20 text-red-400",
        dot: "bg-red-400",
    },
    pending: {
        label: "Pending",
        bar: "from-yellow-500 to-orange-400",
        badge: "bg-yellow-500/20 text-yellow-400",
        dot: "bg-yellow-400",
    },
};

const FILTER_TABS = ["all", "pending", "approved", "rejected"];

// ── Pure sub-components ───────────────────────────────────────────────────────

const Avatar = memo(function Avatar({ name, email }) {
    const initials = useMemo(() =>
        (name || email || "?")
            .split(/[\s@.]/)
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0].toUpperCase())
            .join(""),
        [name, email]
    );
    return (
        <div
            aria-hidden="true"
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500
                       flex items-center justify-center text-black font-black text-sm
                       shrink-0 shadow-lg shadow-yellow-500/20"
        >
            {initials}
        </div>
    );
});

const InfoCell = memo(function InfoCell({ label, value, accent }) {
    return (
        <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                {label}
            </span>
            <span className={`text-sm font-semibold truncate ${accent ? "text-yellow-400" : "text-white"}`}>
                {value ?? "—"}
            </span>
        </div>
    );
});

// ── WithdrawItem — one card ───────────────────────────────────────────────────
const WithdrawItem = memo(function WithdrawItem({ withdraw: w, isLoading, onUpdateStatus }) {
    const router = useRouter();
    const cfg = STATUS_CFG[w.status] ?? STATUS_CFG.pending;

    const handleApprove = useCallback(() => onUpdateStatus(w._id, "approved"), [w._id, onUpdateStatus]);
    const handleReject = useCallback(() => onUpdateStatus(w._id, "rejected"), [w._id, onUpdateStatus]);
    const goToDetail = useCallback(() => router.push(`/admin/withdraws/${w._id}`), [router, w._id]);

    const copyTxid = useCallback(() => {
        if (!w.txId) return;
        navigator.clipboard.writeText(w.txId).catch(() => { });
    }, [w.txId]);

    const username = w.user?.username;
    const email = w.user?.email;

    return (
        <article
            aria-label={`Withdraw request from ${username || email || "Unknown"}`}
            className="bg-gradient-to-tr from-gray-900 to-black border border-yellow-500/20
                       rounded-3xl shadow-xl hover:shadow-yellow-500/10
                       flex flex-col overflow-hidden transition-shadow duration-300"
        >
            {/* Status accent bar */}
            <div className={`h-[3px] w-full bg-gradient-to-r ${cfg.bar}`} aria-hidden="true" />

            <div className="p-5 flex flex-col gap-4 flex-1">

                {/* ── User identity ── */}
                <div className="flex items-center gap-3">
                    <Avatar name={username} email={email} />
                    <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-sm leading-tight truncate">
                            {username || "Unknown user"}
                        </p>
                        <p className="text-gray-500 text-xs truncate mt-0.5">
                            {email || "No email"}
                        </p>
                    </div>
                    {/* Status badge */}
                    <span
                        aria-label={`Status: ${cfg.label}`}
                        className={`flex items-center gap-1.5 text-[11px] font-bold
                                    px-2.5 py-1 rounded-full shrink-0 ${cfg.badge}`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
                        {cfg.label}
                    </span>
                </div>

                {/* ── Stats grid ── */}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-yellow-500/10 pt-4">
                    <InfoCell label="Amount" value={`${w.amount} USDT`} accent />
                    <InfoCell label="Network" value={w.network} />
                    <InfoCell label="Balance" value={w.user?.balance != null ? `$${w.user.balance}` : null} />
                    <InfoCell label="Invested" value={w.user?.investedAmount != null ? `$${w.user.investedAmount}` : null} />
                    <InfoCell label="Daily Profit" value={w.user?.dailyProfit != null ? `$${w.user.dailyProfit}` : null} accent />
                    <InfoCell label="Total Earned" value={w.user?.totalEarnings != null ? `$${w.user.totalEarnings}` : null} />
                </dl>

                {/* ── TXID row ── */}
                <div className="bg-black/40 border border-yellow-500/10 rounded-2xl px-3 py-2.5
                                flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-0.5">
                            Transaction ID
                        </p>
                        <p className="text-xs font-mono text-gray-400 truncate">
                            {w.txId ? `${w.txId.slice(0, 26)}…` : "N/A"}
                        </p>
                    </div>
                    {w.txId && (
                        <button
                            onClick={copyTxid}
                            aria-label="Copy transaction ID"
                            className="shrink-0 text-[10px] font-bold text-yellow-400 hover:text-yellow-300
                                       bg-yellow-500/10 hover:bg-yellow-500/20 px-2.5 py-1 rounded-xl transition"
                        >
                            COPY
                        </button>
                    )}
                </div>

                {/* ── Spacer ── */}
                <div className="flex-1" />

                {/* ── Action buttons ── */}
                <div className="flex gap-2 pt-1">
                    {w.status === "pending" && (
                        <>
                            <button
                                disabled={isLoading}
                                onClick={handleApprove}
                                aria-label="Approve withdraw"
                                className="flex-1 flex items-center justify-center gap-1.5
                                           bg-green-500 hover:bg-green-600 disabled:opacity-50
                                           py-2.5 rounded-2xl text-xs font-bold text-white transition"
                            >
                                {isLoading
                                    ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : "✓"
                                }
                                Approve
                            </button>
                            <button
                                disabled={isLoading}
                                onClick={handleReject}
                                aria-label="Reject withdraw"
                                className="flex-1 flex items-center justify-center gap-1.5
                                           bg-red-500 hover:bg-red-600 disabled:opacity-50
                                           py-2.5 rounded-2xl text-xs font-bold text-white transition"
                            >
                                {isLoading
                                    ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : "✕"
                                }
                                Reject
                            </button>
                        </>
                    )}
                    <button
                        onClick={goToDetail}
                        aria-label="View withdraw details"
                        className={`${w.status === "pending" ? "px-4" : "flex-1"}
                                    flex items-center justify-center gap-1
                                    border border-yellow-500/20 hover:border-yellow-500/50
                                    text-yellow-400 hover:text-yellow-300
                                    py-2.5 rounded-2xl text-xs font-bold transition`}
                    >
                        Details →
                    </button>
                </div>
            </div>
        </article>
    );
});

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = memo(function SkeletonCard() {
    return (
        <div aria-busy="true" aria-label="Loading"
            className="bg-gradient-to-tr from-gray-900 to-black border border-yellow-500/20
                        rounded-3xl overflow-hidden animate-pulse">
            <div className="h-[3px] bg-yellow-500/20" />
            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gray-800" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-800 rounded-full w-3/4" />
                        <div className="h-2.5 bg-gray-800/60 rounded-full w-1/2" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="h-2 bg-gray-800/60 rounded-full w-2/3" />
                            <div className="h-3 bg-gray-800 rounded-full w-4/5" />
                        </div>
                    ))}
                </div>
                <div className="h-10 bg-gray-800/60 rounded-2xl" />
                <div className="flex gap-2">
                    <div className="flex-1 h-9 bg-gray-800 rounded-2xl" />
                    <div className="flex-1 h-9 bg-gray-800 rounded-2xl" />
                </div>
            </div>
        </div>
    );
});

// ── Filter tab ────────────────────────────────────────────────────────────────
const FilterTab = memo(function FilterTab({ label, count, active, onClick }) {
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={`px-4 py-1.5 rounded-2xl text-xs font-bold border transition
                ${active
                    ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                    : "bg-gray-900/60 border-yellow-500/10 text-gray-500 hover:text-gray-300 hover:border-yellow-500/20"
                }`}
        >
            {label}
            <span className={`ml-1.5 text-[10px] ${active ? "text-yellow-500" : "text-gray-600"}`}>
                {count}
            </span>
        </button>
    );
});

// ── WithdrawCard — default export ─────────────────────────────────────────────
export default function WithdrawCard() {
    const [withdraws, setWithdraws] = useState(_cache.data ?? []);
    const [loading, setLoading] = useState(!_cache.data);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [filter, setFilter] = useState("all");
    const abortRef = useRef(null);

    const loadData = useCallback(async (bust = false) => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        if (bust) invalidateCache();
        setLoading(true);
        setError("");
        try {
            const data = await fetchWithdrawsFromAPI();
            setWithdraws(data);
        } catch (err) {
            if (err.name !== "AbortError") setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        return () => abortRef.current?.abort();
    }, [loadData]);

    const handleUpdateStatus = useCallback(async (id, status) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/withdraw/admin/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json?.error || `Failed: ${res.status}`);
            }
            await loadData(true); // bust cache after mutation
        } catch (err) {
            alert(err.message);
        } finally {
            setUpdatingId(null);
        }
    }, [loadData]);

    // Derived counts — recomputed only when withdraws array reference changes
    const counts = useMemo(() => ({
        all: withdraws.length,
        pending: withdraws.filter((w) => w.status === "pending").length,
        approved: withdraws.filter((w) => w.status === "approved").length,
        rejected: withdraws.filter((w) => w.status === "rejected").length,
    }), [withdraws]);

    const filtered = useMemo(() =>
        filter === "all" ? withdraws : withdraws.filter((w) => w.status === filter),
        [withdraws, filter]
    );

    // ── Error state ───────────────────────────────────────────────────────────
    if (error) return (
        <div
            role="alert"
            className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black
                       flex flex-col items-center justify-center gap-4 p-10 text-white"
        >
            <span className="text-5xl" aria-hidden="true">⚠</span>
            <p className="text-red-400 font-semibold text-center">{error}</p>
            <button
                onClick={() => loadData(true)}
                className="px-6 py-2.5 rounded-2xl bg-yellow-500/20 border border-yellow-500/30
                           text-yellow-400 font-bold hover:bg-yellow-500/30 transition"
            >
                Retry
            </button>
        </div>
    );

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <main
            aria-label="Withdraw Requests"
            itemScope
            itemType="https://schema.org/WebPage"
            className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6 md:p-10 text-white"
        >
            {/* Page header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-400 tracking-tight">
                        Withdraw Requests
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {counts.all} total · {counts.pending} pending
                    </p>
                </div>
                <button
                    onClick={() => loadData(true)}
                    disabled={loading}
                    aria-label="Refresh withdraw requests"
                    className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5
                               rounded-2xl border border-yellow-500/20 text-yellow-400
                               hover:border-yellow-500/40 hover:bg-yellow-500/10
                               text-xs font-bold transition disabled:opacity-40"
                >
                    <span className={loading ? "inline-block animate-spin" : ""} aria-hidden="true">↻</span>
                    Refresh
                </button>
            </header>

            {/* Filter tabs */}
            <nav aria-label="Filter withdraw requests" className="flex flex-wrap gap-2 mb-8">
                {FILTER_TABS.map((key) => (
                    <FilterTab
                        key={key}
                        label={key.charAt(0).toUpperCase() + key.slice(1)}
                        count={counts[key]}
                        active={filter === key}
                        onClick={() => setFilter(key)}
                    />
                ))}
            </nav>

            {/* Card grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-600">
                    <span className="text-5xl" aria-hidden="true">📭</span>
                    <p className="font-semibold">
                        No {filter === "all" ? "" : filter} requests found
                    </p>
                </div>
            ) : (
                <section
                    aria-label={`${filter} withdraw requests`}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filtered.map((w) => (
                        <WithdrawItem
                            key={w._id}
                            withdraw={w}
                            isLoading={updatingId === w._id}
                            onUpdateStatus={handleUpdateStatus}
                        />
                    ))}
                </section>
            )}
        </main>
    );
}