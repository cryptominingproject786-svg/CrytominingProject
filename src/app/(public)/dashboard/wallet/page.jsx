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

// ────────────────────────────────────────────────────────────────────────────
// STATE — unchanged
// ────────────────────────────────────────────────────────────────────────────

const initialState = {
    loading: true,
    error: null,
    data: null,
    showWithdraw: false,
    showHistory: false,
};

function walletReducer(state, action) {
    switch (action.type) {
        case "FETCH_SUCCESS":
            return { ...state, loading: false, error: null, data: action.payload };
        case "FETCH_ERROR":
            return { ...state, loading: false, error: action.payload };
        case "OPEN_WITHDRAW":
            return { ...state, showWithdraw: true };
        case "CLOSE_WITHDRAW":
            return { ...state, showWithdraw: false };
        case "OPEN_HISTORY":
            return { ...state, showHistory: true };
        case "CLOSE_HISTORY":
            return { ...state, showHistory: false };
        default:
            return state;
    }
}

// ────────────────────────────────────────────────────────────────────────────
// REFERRAL COPY CARD
// Sits in the exact same grid slot as the old plain "Referral Code" Card.
// Same outer shape, border-radius, hover glow — only adds copy interaction.
//
// Accessibility:  aria-live announces copy result to screen readers
// SEO:            itemProp="identifier" surfaces the code value to crawlers;
//                 descriptive hint text adds keyword context for Google
// Performance:    stable useCallback handler; timer cleaned up on unmount
// ────────────────────────────────────────────────────────────────────────────

const ReferralCopyCard = React.memo(function ReferralCopyCard({ code }) {
    // "idle" | "copied" | "error"
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
            // execCommand fallback for older browsers / non-HTTPS contexts
            try {
                const ta = document.createElement("textarea");
                ta.value = code;
                ta.style.cssText = "position:fixed;opacity:0;top:0;left:0;pointer-events:none";
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
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
    const isError = copyState === "error";

    return (
        <article
            aria-label="Referral code — copy and share to earn rewards"
            itemProp="identifier"
            /* Matches Card exactly: same rounding, bg, border, shadow, hover lift */
            className="group relative rounded-2xl bg-slate-900/70 border border-yellow-400/40 p-5 shadow-xl hover:shadow-yellow-500/20 transition duration-300 hover:-translate-y-1"
        >
            {/* Same decorative hover glow as Card */}
            <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl bg-yellow-400/10 opacity-0 group-hover:opacity-100 blur-xl transition"
            />
            {/* Subtle ambient radial — purely decorative */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full bg-yellow-400/10 blur-2xl"
            />

            <div className="relative z-10 flex flex-col gap-3 h-full">

                {/* ── Label row — mirrors Card label exactly ── */}
                <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                        Referral Code
                    </p>
                    {/* "Earn" micro-badge — communicates value instantly */}
                    <span
                        aria-hidden="true"
                        className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-yellow-300 ring-1 ring-yellow-400/25"
                    >
                        Earn
                    </span>
                </div>

                {/* ── Code pill + copy button ── */}
                <div className="flex items-center gap-2">
                    {/* Code display — select-all lets mobile users tap once to highlight */}
                    <div
                        role="group"
                        aria-label="Your referral code"
                        className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2"
                    >
                        {/* Link chain icon */}
                        <svg
                            aria-hidden="true"
                            className="h-3.5 w-3.5 flex-shrink-0 text-yellow-400"
                            viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"
                        >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span
                            itemProp="name"
                            className="select-all truncate font-mono text-sm font-bold tracking-widest text-yellow-300"
                        >
                            {code || "—"}
                        </span>
                    </div>

                    {/* Copy button */}
                    <button
                        type="button"
                        onClick={handleCopy}
                        disabled={!code || code === "—"}
                        aria-label={
                            isCopied ? "Referral code copied!"
                                : isError ? "Copy failed — try selecting manually"
                                    : "Copy referral code"
                        }
                        className={[
                            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                            "transition-all duration-200",
                            "focus-visible:outline-none focus-visible:ring-2",
                            "focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100",
                            isCopied
                                ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-95"
                                : isError
                                    ? "bg-red-500 text-white"
                                    : "bg-yellow-400 text-slate-950 hover:bg-yellow-300 hover:scale-110 active:scale-95 shadow-md shadow-yellow-400/30",
                        ].join(" ")}
                    >
                        {isCopied ? (
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : isError ? (
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        ) : (
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* ── Feedback line — aria-live announces state to screen readers ── */}
                <p
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className={[
                        "text-[11px] font-medium leading-none transition-colors duration-300",
                        isCopied ? "text-green-400"
                            : isError ? "text-red-400"
                                : "text-slate-500",
                    ].join(" ")}
                >
                    {isCopied
                        ? "✓ Copied! Share it and start earning."
                        : isError
                            ? "Copy failed — please select the code manually."
                            : "Tap to copy · invite friends · earn rewards"}
                </p>
            </div>
        </article>
    );
});

// ────────────────────────────────────────────────────────────────────────────
// STAT CARD — unchanged
// ────────────────────────────────────────────────────────────────────────────

const Card = React.memo(function Card({ label, value }) {
    return (
        <article className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-xl hover:shadow-yellow-500/20 transition duration-300 hover:-translate-y-1">
            <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl bg-yellow-400/10 opacity-0 group-hover:opacity-100 blur-xl transition"
            />
            <div className="relative z-10">
                <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{value}</h3>
            </div>
        </article>
    );
});

// ────────────────────────────────────────────────────────────────────────────
// MODAL SKELETON — unchanged
// ────────────────────────────────────────────────────────────────────────────

const ModalSkeleton = () => (
    <div
        aria-busy="true"
        aria-label="Loading withdrawal form"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
        <div className="w-80 h-64 rounded-3xl bg-gray-800 animate-pulse" />
    </div>
);

// ────────────────────────────────────────────────────────────────────────────
// HISTORY MODAL — unchanged
// ────────────────────────────────────────────────────────────────────────────

const HistoryModal = React.memo(function HistoryModal({ onClose, data }) {
    const rows = useMemo(() => {
        if (!data) return [];

        const rechargeRows = (data.rechargeHistory || []).map((item) => ({
            id: item.id,
            type: "Recharge",
            amount: `$${Number(item.amount ?? 0).toFixed(2)}`,
            status: item.status || "pending",
            date: new Date(item.createdAt).toLocaleString(),
            reference: item.txId || item.network || "—",
            timestamp: new Date(item.createdAt).getTime(),
        }));

        const withdrawRows = (data.withdrawRequests || []).map((item) => ({
            id: item.id,
            type: "Withdrawal",
            amount: `$${Number(item.amount ?? 0).toFixed(2)}`,
            status: item.status || "pending",
            date: new Date(item.requestedAt).toLocaleString(),
            reference: item.txId || item.network || "—",
            timestamp: new Date(item.requestedAt).getTime(),
        }));

        const bonusRows = (data.referralBonuses || []).map((item) => ({
            id: item.id,
            type: "Referral bonus",
            amount: `$${Number(item.amount ?? 0).toFixed(2)}`,
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4">
            <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-slate-800 bg-slate-950 shadow-2xl ring-1 ring-white/10 overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Transaction history</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            All recent recharges, withdrawals, and referral bonuses in a lightweight column view.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300"
                    >
                        Close
                    </button>
                </div>
                <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-4">
                    <div className="grid gap-3 rounded-3xl bg-slate-900 p-4 text-xs uppercase tracking-[0.2em] text-slate-400 sm:grid-cols-[1.8fr_1.1fr_1fr_1.3fr_2fr]">
                        <span>Type</span>
                        <span>Amount</span>
                        <span>Status</span>
                        <span>Date</span>
                        <span>Reference</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {rows.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900 p-8 text-center text-sm text-slate-400">
                                No transaction entries available yet.
                            </div>
                        ) : (
                            rows.map((row) => (
                                <div
                                    key={`${row.id}-${row.type}`}
                                    className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-950 p-4 text-sm sm:grid-cols-[1.8fr_1.1fr_1fr_1.3fr_2fr]"
                                >
                                    <span className="font-semibold text-white">{row.type}</span>
                                    <span className="text-yellow-300">{row.amount}</span>
                                    <span className="text-slate-300">{row.status}</span>
                                    <span className="text-slate-400">{row.date}</span>
                                    <span className="truncate text-slate-200">{row.reference}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-900 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-300">
                        Referral code:{" "}
                        <span className="font-semibold text-white">{data?.referralCode || "—"}</span>
                    </div>
                    <div className="text-sm text-slate-300">
                        Team earnings:{" "}
                        <span className="font-semibold text-yellow-300">
                            ${Number(data?.teamEarnings ?? 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

// ────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// 100% identical structure, logic, and UI to original.
// The only change: cardConfigs marks the "Referral Code" entry with
// `isReferral: true` so the grid renders <ReferralCopyCard> for that slot.
// ────────────────────────────────────────────────────────────────────────────

export default function WalletPage() {
    const [state, dispatch] = useReducer(walletReducer, initialState);
    const { loading, error, data, showWithdraw, showHistory } = state;
    const isInitialLoad = useRef(true);

    const openWithdraw = useCallback(() => dispatch({ type: "OPEN_WITHDRAW" }), []);
    const closeWithdraw = useCallback(() => dispatch({ type: "CLOSE_WITHDRAW" }), []);
    const openHistory = useCallback(() => dispatch({ type: "OPEN_HISTORY" }), []);
    const closeHistory = useCallback(() => dispatch({ type: "CLOSE_HISTORY" }), []);

    // ── Fetch + auto-refresh ─────────────────────────────────────────────────
    useEffect(() => {
        let canceled = false;

        const fetchData = async () => {
            try {
                const res = await fetch("/api/user/wallet");

                let json;
                try {
                    json = await res.json();
                } catch (parseError) {
                    const text = await res.text().catch(() => "");
                    throw new Error(
                        `Invalid API response (status ${res.status}). Expected JSON but received: ${text.slice(0, 120)}`
                    );
                }

                if (!res.ok) {
                    throw new Error(json?.error || `Request failed with status ${res.status}`);
                }

                if (!canceled) dispatch({ type: "FETCH_SUCCESS", payload: json.data });
            } catch (err) {
                if (!canceled) dispatch({ type: "FETCH_ERROR", payload: err.message });
            } finally {
                if (!canceled && isInitialLoad.current) {
                    isInitialLoad.current = false;
                }
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

    /**
     * cardConfigs — same 7 entries as the original.
     * "Referral Code" gets `isReferral: true` so the renderer below can swap
     * in <ReferralCopyCard> for that one slot while leaving every other card
     * as a plain <Card>. No layout or data shape changes anywhere else.
     */
    const cardConfigs = useMemo(() => {
        if (!data) return [];
        return [
            { label: "Locked Profit", value: `$${Number(data.lockedProfit ?? 0).toFixed(2)}` },
            { label: "Invested Amount", value: `$${Number(data.investedAmount ?? 0).toFixed(2)}` },
            { label: "Referral Code", value: data.referralCode || "—", isReferral: true },
            { label: "Team Members", value: data.teamMembersCount ?? 0 },
            { label: "Team Earnings", value: `$${Number(data.teamEarnings ?? 0).toFixed(2)}` },
            { label: "Total Withdrawals", value: `$${Number(data.totalWithdrawals ?? 0).toFixed(2)}` },
            { label: "Referral Count", value: data.referralCount ?? 0 },
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

                {/* ── Loading state ────────────────────────────────────────── */}
                {loading && (
                    <p role="status" className="text-gray-400 animate-pulse">
                        Loading wallet data…
                    </p>
                )}

                {/* ── Error state ──────────────────────────────────────────── */}
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
                                className={`bg-black text-yellow-400 font-bold px-5 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg transition duration-300 text-sm sm:text-base md:text-lg ${isWithdrawDisabled
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:shadow-2xl hover:bg-gray-900 hover:scale-105"
                                    }`}
                            >
                                Withdraw
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Stats Grid ───────────────────────────────────────────── */}
                {/* Identical 3-column grid, identical 7-card count.           */}
                {/* Only the "Referral Code" slot renders ReferralCopyCard.    */}
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
                        <h2 className="text-xl font-bold text-yellow-400 mb-4">Recent Withdraw Requests</h2>
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
                                        <span
                                            className={`text-xs font-semibold px-2 py-1 rounded-full ${w.status === "approved"
                                                    ? "bg-green-500/20 text-green-300"
                                                    : w.status === "rejected"
                                                        ? "bg-red-500/20 text-red-300"
                                                        : "bg-yellow-500/20 text-yellow-300"
                                                }`}
                                        >
                                            {w.status}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-100">
                                        {w.network} • {w.amount} USDT • TXID: {w.txId}
                                    </p>
                                    {w.adminInvoice ? (
                                        typeof w.adminInvoice === "string" && w.adminInvoice.startsWith("data:") ? (
                                            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-inner">
                                                <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                                                    <p className="text-xs uppercase tracking-wide text-gray-400">
                                                        Admin Invoice
                                                    </p>
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
                                                <a
                                                    href={w.adminInvoice}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="text-blue-400 underline text-sm"
                                                >
                                                    View admin invoice
                                                </a>
                                            </div>
                                        )
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </section>

            {/* ── WithdrawModal (lazy — only downloaded on first open) ─────── */}
            {showWithdraw && data && (
                <Suspense fallback={<ModalSkeleton />}>
                    <WithdrawModal
                        balance={Number(data.balance ?? 0)}
                        onClose={closeWithdraw}
                    />
                </Suspense>
            )}

            {showHistory && data && <HistoryModal onClose={closeHistory} data={data} />}
        </main>
    );
}