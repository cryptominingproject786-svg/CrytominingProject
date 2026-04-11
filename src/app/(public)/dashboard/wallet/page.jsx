"use client";
import React, {
    useReducer,
    useEffect,
    useCallback,
    useRef,
    useMemo,
    lazy,
    Suspense,
} from "react";
const WithdrawModal = lazy(() => import("./withdrawmodal"));
const initialState = {
    loading: true,
    error: null,
    data: null,
    showWithdraw: false,
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
        default:
            return state;
    }
}
const Card = React.memo(function Card({ label, value }) {
    return (
        <article className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-xl hover:shadow-yellow-500/20 transition duration-300 hover:-translate-y-1">
            {/* Decorative glow — aria-hidden so crawlers ignore it */}
            <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl bg-yellow-400/10 opacity-0 group-hover:opacity-100 blur-xl transition"
            />
            <div className="relative z-10">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                    {label}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                    {value}
                </h3>
            </div>
        </article>
    );
});

// ── Skeleton fallback for WithdrawModal ──────────────────────────────────────
const ModalSkeleton = () => (
    <div
        aria-busy="true"
        aria-label="Loading withdrawal form"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
        <div className="w-80 h-64 rounded-3xl bg-gray-800 animate-pulse" />
    </div>
);
export default function WalletPage() {
    const [state, dispatch] = useReducer(walletReducer, initialState);
    const { loading, error, data, showWithdraw } = state;
    const isInitialLoad = useRef(true);
    const openWithdraw = useCallback(() => dispatch({ type: "OPEN_WITHDRAW" }), []);
    const closeWithdraw = useCallback(() => dispatch({ type: "CLOSE_WITHDRAW" }), []);

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
                        `Invalid API response (status ${res.status}). Expected JSON but received: ${text.slice(0, 120)
                        }`
                    );
                }

                if (!res.ok) {
                    throw new Error(json?.error || `Request failed with status ${res.status}`);
                }

                if (!canceled) {
                    dispatch({ type: "FETCH_SUCCESS", payload: json.data });
                }
            } catch (err) {
                if (!canceled) {
                    dispatch({ type: "FETCH_ERROR", payload: err.message });
                }
            } finally {
                // Only flip loading→false on the very first fetch.
                // Interval refreshes are silent background updates.
                if (!canceled && isInitialLoad.current) {
                    isInitialLoad.current = false;
                    // loading is already set to false inside FETCH_SUCCESS / FETCH_ERROR
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);

        return () => {
            canceled = true;
            clearInterval(interval);
        };
    }, []);
    const displayBalance = useMemo(
        () => `$${Number(data?.balance ?? 0).toFixed(2)}`,
        [data?.balance]
    );

    const isWithdrawDisabled = useMemo(
        () => !data || Number(data.balance) <= 0,
        [data]
    );

    // Pre-build all card configs once per `data` change instead of inline JSX.
    const cardConfigs = useMemo(() => {
        if (!data) return [];
        return [
            { label: "Locked Profit", value: `$${(data.lockedProfit ?? 0).toFixed(2)}` },
            { label: "Invested Amount", value: `$${(data.investedAmount ?? 0).toFixed(2)}` },
            { label: "Referral Code", value: data.referralCode || "—" },
            { label: "Team Members", value: data.teamMembersCount ?? 0 },
            { label: "Team Earnings", value: `$${(data.teamEarnings ?? 0).toFixed(2)}` },
            { label: "Total Withdrawals", value: `$${(data.totalWithdrawals ?? 0).toFixed(2)}` },
            { label: "Referral Count", value: data.referralCount ?? 0 },
        ];
    }, [data]);

    // ── Render ────────────────────────────────────────────────────────────────
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
                </header>

                {/* ── Loading state ────────────────────────────────────────── */}
                {loading && (
                    <p role="status" className="text-gray-400 animate-pulse">
                        Loading wallet data…
                    </p>
                )}

                {/* ── Error state ──────────────────────────────────────────── */}
                {error && (
                    <p role="alert" className="text-red-400">
                        {error}
                    </p>
                )}

                {/* ── Hero Balance Card ────────────────────────────────────── */}
                {!loading && !error && (
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                        {/* Balance */}
                        <div>
                            <p className="text-sm uppercase tracking-wide">
                                Available Balance
                            </p>
                            {/*
                             * aria-live="polite" tells screen readers & bots this
                             * value updates automatically (auto-refresh every 5s).
                             */}
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

                        {/* Withdraw button */}
                        <div>
                            <button
                                aria-label="Withdraw funds"
                                onClick={openWithdraw}
                                disabled={isWithdrawDisabled}
                                className={`bg-black text-yellow-400 font-bold px-5 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg transition duration-300 text-sm sm:text-base md:text-lg
                                    ${isWithdrawDisabled
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
                {!loading && !error && (
                    <section
                        aria-label="Wallet statistics"
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                    >
                        {cardConfigs.map((cfg) => (
                            // Stable string key from label — no index-based churn
                            <Card key={cfg.label} label={cfg.label} value={cfg.value} />
                        ))}
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
                                        <p className="text-sm text-gray-300">{new Date(w.requestedAt).toLocaleString()}</p>
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
                                                />
                                            </div>
                                        ) : (
                                            <div className="mt-2">
                                                <a
                                                    href={w.adminInvoice}
                                                    target="_blank"
                                                    rel="noreferrer"
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
                    {/*
                     * closeWithdraw is a stable useCallback ref.
                     * WithdrawModal will NEVER re-render due to this prop changing.
                     */}
                    <WithdrawModal
                        balance={Number(data.balance ?? 0)}
                        onClose={closeWithdraw}
                    />
                </Suspense>
            )}
        </main>
    );
}