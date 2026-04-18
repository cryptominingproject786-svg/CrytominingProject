"use client";
import React, {
    useReducer,
    useEffect,
    useCallback,
    useRef,
    useMemo,
    useState,
    lazy,
    Suspense,
} from "react";

const WithdrawModal = lazy(() => import("./withdrawmodal"));

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
    loading: true,
    error: null,
    data: null,
    showWithdraw: false,
    showHistory: false,
};

function walletReducer(state, action) {
    switch (action.type) {
        case "FETCH_SUCCESS":  return { ...state, loading: false, error: null, data: action.payload };
        case "FETCH_ERROR":    return { ...state, loading: false, error: action.payload };
        case "OPEN_WITHDRAW":  return { ...state, showWithdraw: true };
        case "CLOSE_WITHDRAW": return { ...state, showWithdraw: false };
        case "OPEN_HISTORY":   return { ...state, showHistory: true };
        case "CLOSE_HISTORY":  return { ...state, showHistory: false };
        default:               return state;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERRAL COPY CARD
// ─────────────────────────────────────────────────────────────────────────────

const ReferralCopyCard = React.memo(function ReferralCopyCard({ code }) {
    const [copyState, setCopyState] = useState("idle");
    const timerRef = useRef(null);

    const handleCopy = useCallback(async () => {
        if (!code || code === "—") return;

        const scheduleReset = () => {
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopyState("idle"), 2200);
        };

        try {
            await navigator.clipboard.writeText(code);
            setCopyState("copied");
            scheduleReset();
        } catch {
            try {
                const ta = document.createElement("textarea");
                ta.value = code;
                ta.style.cssText = "position:fixed;opacity:0;top:0;left:0;pointer-events:none";
                document.body.appendChild(ta);
                ta.focus(); ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
                setCopyState("copied");
            } catch {
                setCopyState("error");
            }
            scheduleReset();
        }
    }, [code]);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const isCopied = copyState === "copied";
    const isError  = copyState === "error";

    return (
        <article
            aria-label="Referral code — copy and share to earn rewards"
            itemProp="identifier"
            className="group relative rounded-2xl bg-slate-900/70 border border-yellow-400/40 p-5 shadow-xl hover:shadow-yellow-500/20 transition duration-300 hover:-translate-y-1"
        >
            <div aria-hidden="true" className="absolute inset-0 rounded-2xl bg-yellow-400/10 opacity-0 group-hover:opacity-100 blur-xl transition" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full bg-yellow-400/10 blur-2xl" />

            <div className="relative z-10 flex flex-col gap-3 h-full">
                <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Referral Code</p>
                    <span aria-hidden="true" className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-yellow-300 ring-1 ring-yellow-400/25">
                        Earn
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div role="group" aria-label="Your referral code" className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2">
                        <svg aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span itemProp="name" className="select-all truncate font-mono text-sm font-bold tracking-widest text-yellow-300">
                            {code || "—"}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopy}
                        disabled={!code || code === "—"}
                        aria-label={isCopied ? "Referral code copied!" : isError ? "Copy failed — try selecting manually" : "Copy referral code"}
                        className={[
                            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100",
                            isCopied ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-95"
                                : isError ? "bg-red-500 text-white"
                                : "bg-yellow-400 text-slate-950 hover:bg-yellow-300 hover:scale-110 active:scale-95 shadow-md shadow-yellow-400/30",
                        ].join(" ")}
                    >
                        {isCopied ? (
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : isError ? (
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        ) : (
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        )}
                    </button>
                </div>

                <p role="status" aria-live="polite" aria-atomic="true" className={["text-[11px] font-medium leading-none transition-colors duration-300", isCopied ? "text-green-400" : isError ? "text-red-400" : "text-slate-500"].join(" ")}>
                    {isCopied ? "✓ Copied! Share it and start earning." : isError ? "Copy failed — please select the code manually." : "Tap to copy · invite friends · earn rewards"}
                </p>
            </div>
        </article>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

const Card = React.memo(function Card({ label, value }) {
    return (
        <article className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-xl hover:shadow-yellow-500/20 transition duration-300 hover:-translate-y-1">
            <div aria-hidden="true" className="absolute inset-0 rounded-2xl bg-yellow-400/10 opacity-0 group-hover:opacity-100 blur-xl transition" />
            <div className="relative z-10">
                <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{value}</h3>
            </div>
        </article>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// MODAL SKELETON
// ─────────────────────────────────────────────────────────────────────────────

const ModalSkeleton = () => (
    <div aria-busy="true" aria-label="Loading withdrawal form" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="w-80 h-64 rounded-3xl bg-gray-800 animate-pulse" />
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE — extracted to keep table cells clean
// ─────────────────────────────────────────────────────────────────────────────

const StatusBadge = React.memo(function StatusBadge({ status }) {
    const color =
        status === "approved" || status === "bonus"
            ? "bg-green-500/20 text-green-300 ring-green-500/30"
            : status === "rejected"
            ? "bg-red-500/20 text-red-300 ring-red-500/30"
            : "bg-yellow-500/20 text-yellow-300 ring-yellow-500/30";

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold ring-1 whitespace-nowrap ${color}`}>
            {status}
        </span>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPE BADGE
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_STYLES = {
    Recharge:       "bg-blue-500/15 text-blue-300",
    Withdrawal:     "bg-orange-500/15 text-orange-300",
    "Referral bonus": "bg-purple-500/15 text-purple-300",
};

const TypeBadge = React.memo(function TypeBadge({ type }) {
    const cls = TYPE_STYLES[type] ?? "bg-slate-500/15 text-slate-300";
    return (
        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold whitespace-nowrap ${cls}`}>
            {type}
        </span>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY MODAL — REWRITTEN FOR MOBILE
//
// Strategy: semantic <table> inside an overflow-x-auto scroll container.
// This is the industry-standard "Excel on mobile" pattern:
//   • min-w forces horizontal scroll rather than wrapping/collapsing on small screens
//   • sticky <thead> keeps column headers visible while scrolling vertically
//   • whitespace-nowrap prevents cell content from line-breaking mid-word
//   • text-[11px] / sm:text-xs / md:text-sm scales fonts across breakpoints
//   • will-change: transform on the scroll container hints GPU compositing
// ─────────────────────────────────────────────────────────────────────────────

const THEAD_COLS = ["Type", "Amount", "Status", "Date", "Reference"];

const HistoryModal = React.memo(function HistoryModal({ onClose, data }) {
    // Close on Escape key — best practice for modal accessibility
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    // Prevent body scroll while modal is open
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    const rows = useMemo(() => {
        if (!data) return [];

        const rechargeRows = (data.rechargeHistory || []).map((item) => ({
            id: item.id,
            type: "Recharge",
            amount: Number(item.amount ?? 0).toFixed(2),
            status: item.status || "pending",
            date: new Date(item.createdAt).toLocaleString(),
            reference: item.txId || item.network || "—",
            timestamp: new Date(item.createdAt).getTime(),
        }));

        const withdrawRows = (data.withdrawRequests || []).map((item) => ({
            id: item.id,
            type: "Withdrawal",
            amount: Number(item.amount ?? 0).toFixed(2),
            status: item.status || "pending",
            date: new Date(item.requestedAt).toLocaleString(),
            reference: item.txId || item.network || "—",
            timestamp: new Date(item.requestedAt).getTime(),
        }));

        const bonusRows = (data.referralBonuses || []).map((item) => ({
            id: item.id,
            type: "Referral bonus",
            amount: Number(item.amount ?? 0).toFixed(2),
            status: item.type || "bonus",
            date: new Date(item.awardedAt).toLocaleString(),
            reference: item.description || item.type || "Referral",
            timestamp: new Date(item.awardedAt).getTime(),
        }));

        return [...rechargeRows, ...withdrawRows, ...bonusRows].sort(
            (a, b) => b.timestamp - a.timestamp
        );
    }, [data]);

    return (
        /* Backdrop — tap outside closes modal */
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Transaction history"
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/85 p-3 sm:p-5 md:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl ring-1 ring-white/5 overflow-hidden my-auto">

                {/* ── Modal header ────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-900 px-4 sm:px-6 py-4 sm:py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base sm:text-xl font-semibold text-white">
                            Transaction History
                        </h2>
                        <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
                            All recharges, withdrawals, and referral bonuses — newest first.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close transaction history"
                        className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-yellow-400 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-yellow-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                        <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Close
                    </button>
                </div>

                {/* ── Row count pill ───────────────────────────────────────── */}
                <div className="flex items-center gap-2 border-b border-slate-800/60 bg-slate-900/50 px-4 sm:px-6 py-2">
                    <span className="text-[11px] text-slate-400">
                        {rows.length} {rows.length === 1 ? "entry" : "entries"}
                    </span>
                    <span aria-hidden="true" className="h-3 w-px bg-slate-700" />
                    <span className="text-[11px] text-slate-500">Scroll right on mobile →</span>
                </div>

                {/* ── TABLE — overflow-x-auto = horizontal scroll on mobile ─ */}
                {/*
                 *  Key decisions:
                 *  1. overflow-x-auto on the wrapper, NOT the table — avoids
                 *     the sticky-thead-inside-overflow bug in some browsers.
                 *  2. min-w-[640px] on <table> forces scroll rather than wrapping.
                 *  3. position: sticky on <thead> keeps headers visible on
                 *     vertical scroll within max-h container.
                 *  4. will-change: transform on the scroll wrapper promotes it
                 *     to its own compositing layer for GPU-accelerated scrolling.
                 */}
                <div
                    className="max-h-[calc(100svh-14rem)] overflow-y-auto"
                    style={{ WebkitOverflowScrolling: "touch" }}
                >
                    <div
                        className="overflow-x-auto"
                        style={{ willChange: "transform" }}
                    >
                        {rows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                                <span className="text-3xl" aria-hidden="true">📭</span>
                                <p className="text-sm text-slate-400">No transaction entries yet.</p>
                            </div>
                        ) : (
                            <table
                                className="w-full min-w-[640px] border-collapse text-left"
                                aria-label="Transaction history table"
                            >
                                {/* Sticky header */}
                                <thead className="sticky top-0 z-10 bg-slate-900 shadow-[0_1px_0_0_theme(colors.slate.800)]">
                                    <tr>
                                        {THEAD_COLS.map((col) => (
                                            <th
                                                key={col}
                                                scope="col"
                                                className="px-3 sm:px-4 py-2.5 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap"
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-800/60">
                                    {rows.map((row, i) => (
                                        <tr
                                            key={`${row.id}-${row.type}`}
                                            className={`transition-colors duration-100 hover:bg-slate-800/40 ${i % 2 === 0 ? "bg-slate-950" : "bg-slate-900/30"}`}
                                        >
                                            {/* Type */}
                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                                <TypeBadge type={row.type} />
                                            </td>

                                            {/* Amount */}
                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-mono text-[11px] sm:text-xs md:text-sm font-bold text-yellow-300 whitespace-nowrap">
                                                ${row.amount}
                                            </td>

                                            {/* Status */}
                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                                <StatusBadge status={row.status} />
                                            </td>

                                            {/* Date */}
                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">
                                                {row.date}
                                            </td>

                                            {/* Reference — truncated with tooltip for long values */}
                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 max-w-[140px] sm:max-w-[200px]">
                                                <span
                                                    title={row.reference}
                                                    className="block truncate text-[10px] sm:text-xs text-slate-300"
                                                >
                                                    {row.reference}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* ── Modal footer ─────────────────────────────────────────── */}
                <div className="flex flex-col gap-2 border-t border-slate-800 bg-slate-900 px-4 sm:px-6 py-3 sm:py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs sm:text-sm text-slate-300">
                        Referral code:{" "}
                        <span className="font-mono font-semibold text-white">
                            {data?.referralCode || "—"}
                        </span>
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300">
                        Team earnings:{" "}
                        <span className="font-semibold text-yellow-300">
                            ${Number(data?.teamEarnings ?? 0).toFixed(2)}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function WalletPage() {
    const [state, dispatch] = useReducer(walletReducer, initialState);
    const { loading, error, data, showWithdraw, showHistory } = state;
    const isInitialLoad = useRef(true);

    const openWithdraw  = useCallback(() => dispatch({ type: "OPEN_WITHDRAW" }),  []);
    const closeWithdraw = useCallback(() => dispatch({ type: "CLOSE_WITHDRAW" }), []);
    const openHistory   = useCallback(() => dispatch({ type: "OPEN_HISTORY" }),   []);
    const closeHistory  = useCallback(() => dispatch({ type: "CLOSE_HISTORY" }),  []);

    // ── Fetch + auto-refresh every 5 s ──────────────────────────────────────
    useEffect(() => {
        let canceled = false;

        const fetchData = async () => {
            try {
                const res = await fetch("/api/user/wallet");

                let json;
                try {
                    json = await res.json();
                } catch {
                    const text = await res.text().catch(() => "");
                    throw new Error(`Invalid API response (status ${res.status}). Expected JSON but received: ${text.slice(0, 120)}`);
                }

                if (!res.ok) throw new Error(json?.error || `Request failed with status ${res.status}`);
                if (!canceled) dispatch({ type: "FETCH_SUCCESS", payload: json.data });
            } catch (err) {
                if (!canceled) dispatch({ type: "FETCH_ERROR", payload: err.message });
            } finally {
                if (!canceled && isInitialLoad.current) isInitialLoad.current = false;
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => { canceled = true; clearInterval(interval); };
    }, []);

    // ── Derived values ───────────────────────────────────────────────────────
    const displayBalance = useMemo(
        () => `$${Number(data?.balance ?? 0).toFixed(2)}`,
        [data?.balance]
    );

    const isWithdrawDisabled = useMemo(
        () => !data || Number(data.balance) <= 0,
        [data]
    );

    const cardConfigs = useMemo(() => {
        if (!data) return [];
        return [
            { label: "Locked Profit",      value: `$${Number(data.lockedProfit    ?? 0).toFixed(2)}` },
            { label: "Invested Amount",     value: `$${Number(data.investedAmount  ?? 0).toFixed(2)}` },
            { label: "Referral Code",       value: data.referralCode || "—", isReferral: true },
            { label: "Team Members",        value: data.teamMembersCount ?? 0 },
            { label: "Team Earnings",       value: `$${Number(data.teamEarnings    ?? 0).toFixed(2)}` },
            { label: "Total Withdrawals",   value: `$${Number(data.totalWithdrawals ?? 0).toFixed(2)}` },
            { label: "Referral Count",      value: data.referralCount ?? 0 },
        ];
    }, [data]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <main
            aria-label="Wallet Dashboard"
            itemScope
            itemType="https://schema.org/WebPage"
            className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white px-4 py-8"
        >
            <section className="max-w-6xl mx-auto space-y-8">

                {/* ── Page Header ─────────────────────────────────────────── */}
                <header className="flex items-center justify-between">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-400">
                        Wallet Dashboard
                    </h1>
                    <button
                        type="button"
                        onClick={openHistory}
                        className="rounded-3xl bg-slate-900/90 px-6 py-3 text-sm font-semibold text-yellow-300 shadow-lg shadow-yellow-500/10 transition hover:bg-slate-800"
                    >
                        View full transaction history
                    </button>
                </header>

                {/* ── Loading ──────────────────────────────────────────────── */}
                {loading && (
                    <p role="status" className="text-gray-400 animate-pulse">
                        Loading wallet data…
                    </p>
                )}

                {/* ── Error ────────────────────────────────────────────────── */}
                {error && (
                    <p role="alert" className="text-red-400">{error}</p>
                )}

                {/* ── Hero Balance Card ────────────────────────────────────── */}
                {!loading && !error && (
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <p className="text-sm uppercase tracking-wide">Available Balance</p>
                            <h2
                                aria-live="polite"
                                aria-atomic="true"
                                className="text-3xl md:text-5xl font-extrabold mt-2"
                            >
                                {displayBalance}
                            </h2>
                            <div className="mt-2 text-sm text-black/80">
                                Keep growing your investments{" "}
                                <span aria-hidden="true">🚀</span>
                            </div>
                        </div>
                        <div className="flex">
                            <button
                                type="button"
                                aria-label="Withdraw funds"
                                onClick={openWithdraw}
                                disabled={isWithdrawDisabled}
                                className={`bg-black text-yellow-400 font-bold px-5 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg transition duration-300 text-sm sm:text-base md:text-lg ${isWithdrawDisabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-2xl hover:bg-gray-900 hover:scale-105"}`}
                            >
                                Withdraw
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Stats Grid ───────────────────────────────────────────── */}
                {!loading && !error && (
                    <section
                        aria-label="Wallet statistics"
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                    >
                        {cardConfigs.map((cfg) =>
                            cfg.isReferral ? (
                                <ReferralCopyCard key={cfg.label} code={cfg.value} />
                            ) : (
                                <Card key={cfg.label} label={cfg.label} value={cfg.value} />
                            )
                        )}
                    </section>
                )}

                {/* ── Withdraw History ─────────────────────────────────────── */}
                {!loading && !error && data?.withdrawRequests && data.withdrawRequests.length > 0 && (
                    <section aria-label="Withdraw requests" className="mt-8">
                        <h2 className="text-xl font-bold text-yellow-400 mb-4">
                            Recent Withdraw Requests
                        </h2>
                        <div className="grid gap-4">
                            {data.withdrawRequests.slice(0, 8).map((w) => (
                                <article
                                    key={w.id || w._id}
                                    className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl"
                                >
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <p className="text-sm text-gray-300">
                                            {new Date(w.requestedAt).toLocaleString()}
                                        </p>
                                        <StatusBadge status={w.status} />
                                    </div>
                                    <p className="mt-2 text-sm text-gray-100">
                                        {w.network} • {w.amount} USDT • TXID: {w.txId}
                                    </p>
                                    {w.adminInvoice && (
                                        typeof w.adminInvoice === "string" && w.adminInvoice.startsWith("data:") ? (
                                            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-inner">
                                                <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                                                    <p className="text-xs uppercase tracking-wide text-gray-400">Admin Invoice</p>
                                                </div>
                                                <img
                                                    src={w.adminInvoice}
                                                    alt={`Invoice for withdrawal ${w.txId}`}
                                                    className="w-full max-h-72 object-contain bg-black"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <div className="mt-2">
                                                <a href={w.adminInvoice} target="_blank" rel="noreferrer noopener" className="text-blue-400 underline text-sm">
                                                    View admin invoice
                                                </a>
                                            </div>
                                        )
                                    )}
                                </article>
                            ))}
                        </div>
                    </section>
                )}

            </section>

            {/* ── WithdrawModal ────────────────────────────────────────────── */}
            {showWithdraw && data && (
                <Suspense fallback={<ModalSkeleton />}>
                    <WithdrawModal balance={Number(data.balance ?? 0)} onClose={closeWithdraw} />
                </Suspense>
            )}

            {showHistory && data && (
                <HistoryModal onClose={closeHistory} data={data} />
            )}
        </main>
    );
}