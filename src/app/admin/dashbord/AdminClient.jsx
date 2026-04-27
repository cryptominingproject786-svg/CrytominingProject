"use client";

/**
 * AdminClient – Production-grade admin dashboard
 *
 * FIXES (v2):
 *  1. STATUS BUG — Root cause: status values from DB may arrive with leading/
 *     trailing whitespace, mixed-case, or as null/undefined on rows that come
 *     from `initialData` before the first API response. Fixed by:
 *       a. `normalizeStatus()` now trims + lowercases (was already doing this,
 *          but we also guard the render condition with an explicit truthy check).
 *       b. Approve/Reject buttons now rendered when
 *          `isPending(r)` is true — extracted to a named predicate so there
 *          is ONE place to change the logic.
 *       c. Added a debug-friendly `data-status` attribute on each row/card so
 *          you can inspect the raw value in DevTools instantly.
 *
 *  2. slip.hasData — The list API (/api/recharge/admin) must project
 *     `slip.hasData` (a virtual boolean set server-side). If it is absent the
 *     "View Slip" button is permanently disabled. We now fall back to checking
 *     `r.slip != null` so the button is enabled whenever ANY slip object exists.
 *
 *  3. initialData bypass — Previously initialData was written directly into
 *     INIT_STATE, skipping RECHARGES_OK and leaving pageCount/total/hasMore at
 *     their defaults. Now initialData is dispatched through RECHARGES_OK on
 *     first render via a one-shot useEffect.
 *
 *  4. canNextPage guard — unchanged from v1 but now also respects the fixed
 *     total/pageCount values populated from initialData.
 *
 *  5. Action buttons — Approve/Reject are rendered with an accessible
 *     aria-label that includes the recharge ID, improving screen-reader UX.
 */

import React, {
    useReducer,
    useEffect,
    useState,
    useCallback,
    useMemo,
    lazy,
    Suspense,
    memo,
    useRef,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ─── Lazy zoom ────────────────────────────────────────────────────────────────
const TransformWrapper = lazy(() =>
    import("react-zoom-pan-pinch").then((m) => ({ default: m.TransformWrapper }))
);
const TransformComponent = lazy(() =>
    import("react-zoom-pan-pinch").then((m) => ({
        default: m.TransformComponent,
    }))
);

// ─── TTL cache ────────────────────────────────────────────────────────────────
const CACHE_TTL = 60_000;
const _cache = {};

async function cachedFetch(key, url, signal) {
    let entry = _cache[key];
    if (!entry) {
        entry = { data: null, ts: 0 };
        _cache[key] = entry;
    }
    if (entry.data && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    const res = await fetch(url, {
        cache: "no-store",
        credentials: "include",
        signal,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
    entry.data = json;
    entry.ts = Date.now();
    return json;
}

function bustCache(key) {
    if (key === "recharges") {
        Object.keys(_cache).forEach((k) => {
            if (k.startsWith("recharges-")) {
                _cache[k].data = null;
                _cache[k].ts = 0;
            }
        });
        return;
    }
    const entry = _cache[key];
    if (entry) {
        entry.data = null;
        entry.ts = 0;
    }
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtNum = (v) => (Number(v) || 0).toLocaleString();
const fmtUsd = (v) => (v != null ? `$${Number(v).toFixed(2)}` : "—");
const fmtDt = (v) =>
    v
        ? new Date(v).toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "—";
const fmtDtSm = (v) =>
    v
        ? new Date(v).toLocaleDateString([], { month: "short", day: "numeric" })
        : "—";

// ─── FIX 1: Status helpers ────────────────────────────────────────────────────
/**
 * Normalise a raw status value coming from the API.
 * Trims whitespace and lowercases so "Pending ", "PENDING", "pending" all
 * map to "pending". Returns empty string for null/undefined — never throws.
 */
const normalizeStatus = (status) =>
    typeof status === "string" ? status.trim().toLowerCase() : "";

/**
 * Single predicate used in BOTH RechargeCard AND RowActions.
 * Having one place means you can never have a card showing buttons while
 * the table row hides them (or vice-versa).
 */
const isPending = (r) => normalizeStatus(r?.status) === "pending";

/**
 * Returns true when a slip image is available to preview.
 * FIX 2: Falls back to checking whether the slip sub-document exists at all,
 * because some list-API implementations omit the `hasData` virtual field.
 */
const hasSlipData = (r) =>
    r?.slip?.hasData === true || (r?.slip != null && r?.slip?.hasData !== false);

// ─── State ────────────────────────────────────────────────────────────────────
const DEFAULT_STATS = Object.freeze({
    totalUsers: 0,
    totalInvestment: 0,
    totalWithdraw: 0,
    totalDailyProfit: 0,
    totalDeposited: 0,
});

const INIT_STATE = {
    recharges: [],
    stats: DEFAULT_STATS,
    loadingRecharges: false,
    loadingStats: false,
    actionLoading: {},
    previewSlip: null,
    previewLoading: false,
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
    pageCount: 1,
};

function reducer(state, action) {
    switch (action.type) {
        case "RECHARGES_LOADING":
            return { ...state, loadingRecharges: true };

        case "RECHARGES_OK": {
            const page = action.payload.page ?? state.page;
            const limit = action.payload.limit ?? state.pageSize;
            const total = action.payload.total ?? state.total;
            const pageCount =
                total > 0
                    ? Math.max(1, Math.ceil(total / limit))
                    : (action.payload.pageCount ?? state.pageCount);
            const hasMore = page < pageCount;

            return {
                ...state,
                loadingRecharges: false,
                recharges: action.payload.data ?? [],
                page,
                pageSize: limit,
                total,
                pageCount,
                hasMore,
            };
        }

        case "RECHARGES_ERR":
            return { ...state, loadingRecharges: false };

        case "STATS_LOADING":
            return { ...state, loadingStats: true };

        case "STATS_OK":
            return { ...state, loadingStats: false, stats: action.payload };

        case "STATS_ERR":
            return { ...state, loadingStats: false, stats: DEFAULT_STATS };

        case "ACTION_START":
            return {
                ...state,
                actionLoading: { ...state.actionLoading, [action.id]: true },
            };

        case "ACTION_END": {
            const next = { ...state.actionLoading };
            delete next[action.id];
            return { ...state, actionLoading: next };
        }

        case "RECHARGE_UPDATED":
            return {
                ...state,
                recharges: state.recharges.map((r) =>
                    String(r._id) === String(action.payload._id) ? action.payload : r
                ),
            };

        case "USER_BALANCE_UPDATED":
            return {
                ...state,
                recharges: state.recharges.map((r) => {
                    if (!r.user || String(r.user._id) !== String(action.payload.userId))
                        return r;
                    return { ...r, user: { ...r.user, balance: action.payload.balance } };
                }),
            };

        case "PREVIEW_LOADING":
            return { ...state, previewLoading: true, previewSlip: null };

        case "PREVIEW_OPEN":
            return { ...state, previewLoading: false, previewSlip: action.payload };

        case "PREVIEW_ERR":
            return { ...state, previewLoading: false };

        case "PREVIEW_CLOSE":
            return { ...state, previewSlip: null, previewLoading: false };

        default:
            return state;
    }
}

// ─── Hook: admin data ─────────────────────────────────────────────────────────
function useAdminData(dispatch, enabled, page, pageSize) {
    const abortR = useRef(null);
    const abortS = useRef(null);

    const fetchRecharges = useCallback(
        async (pageIndex = 1, bust = false) => {
            abortR.current?.abort();
            abortR.current = new AbortController();
            const key = `recharges-${pageIndex}-${pageSize}`;
            if (bust) bustCache(key);
            dispatch({ type: "RECHARGES_LOADING" });
            try {
                const url = `/api/recharge/admin?page=${pageIndex}&limit=${pageSize}`;
                const json = await cachedFetch(key, url, abortR.current.signal);
                dispatch({ type: "RECHARGES_OK", payload: json });
            } catch (e) {
                if (e.name !== "AbortError") dispatch({ type: "RECHARGES_ERR" });
            }
        },
        [dispatch, pageSize]
    );

    const fetchStats = useCallback(async () => {
        abortS.current?.abort();
        abortS.current = new AbortController();
        dispatch({ type: "STATS_LOADING" });
        try {
            const json = await cachedFetch(
                "stats",
                "/api/admin/stats",
                abortS.current.signal
            );
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
    }, [dispatch]);

    useEffect(() => {
        if (!enabled) return;
        fetchRecharges(page);
        fetchStats();
        return () => {
            abortR.current?.abort();
            abortS.current?.abort();
        };
    }, [enabled, page, fetchRecharges, fetchStats]);

    return { fetchRecharges, fetchStats };
}

// ─── Desktop table columns ────────────────────────────────────────────────────
const TABLE_COLS = [
    { key: "date", label: "Date" },
    { key: "user", label: "User" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "balance", label: "Balance" },
    { key: "invested", label: "Invested" },
    { key: "earnings", label: "Earnings" },
    { key: "dailyProfit", label: "Daily Profit" },
    { key: "amount", label: "Amount" },
    { key: "txid", label: "TXID" },
    { key: "status", label: "Status" },
    { key: "slip", label: "Slip" },
    { key: "actions", label: "Actions" },
];

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = memo(function StatCard({ title, value, loading, onClick }) {
    const Tag = onClick ? "button" : "article";
    return (
        <Tag
            type={onClick ? "button" : undefined}
            onClick={onClick}
            aria-label={`${title}: ${value}`}
            className={[
                "group relative overflow-hidden rounded-2xl border border-yellow-500/15",
                "bg-gradient-to-br from-slate-900 via-slate-900 to-black p-4 sm:p-5 lg:p-6 text-left w-full",
                "shadow-lg transition-all duration-300",
                onClick
                    ? "cursor-pointer hover:border-yellow-500/40 hover:-translate-y-0.5 hover:shadow-yellow-500/10 hover:shadow-2xl"
                    : "",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 32px)," +
                        "repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 32px)",
                }}
            />
            <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-slate-500 leading-tight">
                {title}
            </p>
            <p
                className={[
                    "mt-1.5 text-xl sm:text-2xl lg:text-3xl font-black text-yellow-400 tabular-nums transition-opacity",
                    loading ? "animate-pulse opacity-40" : "",
                ].join(" ")}
            >
                {value}
            </p>
            {onClick && (
                <span
                    aria-hidden="true"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 transition group-hover:text-yellow-500"
                >
                    →
                </span>
            )}
        </Tag>
    );
});

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
    confirmed: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20",
    rejected: "bg-red-500/15 text-red-300 ring-red-500/20",
    pending: "bg-yellow-500/15 text-yellow-300 ring-yellow-500/20",
};

const StatusBadge = memo(function StatusBadge({ status }) {
    const normalized = normalizeStatus(status);
    return (
        <span
            className={[
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 whitespace-nowrap",
                STATUS_STYLES[normalized] ??
                "bg-slate-500/15 text-slate-300 ring-slate-500/20",
            ].join(" ")}
        >
            {/* Display the raw value so admin can see exactly what came from DB */}
            {String(status ?? "").trim() || "unknown"}
        </span>
    );
});

// ─── Skeleton: mobile card ────────────────────────────────────────────────────
const CardSkeleton = memo(function CardSkeleton() {
    return (
        <div
            aria-hidden="true"
            className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
        >
            <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                    <div className="h-3.5 w-28 rounded-full bg-slate-800" />
                    <div className="h-2.5 w-36 rounded-full bg-slate-800/70" />
                </div>
                <div className="h-5 w-16 rounded-full bg-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1">
                {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="space-y-1">
                        <div className="h-2 w-14 rounded-full bg-slate-800/60" />
                        <div className="h-3 w-20 rounded-full bg-slate-800" />
                    </div>
                ))}
            </div>
            <div className="space-y-1 pt-0.5">
                <div className="h-2 w-10 rounded-full bg-slate-800/60" />
                <div className="h-2.5 w-full rounded-full bg-slate-800" />
            </div>
            <div className="flex gap-2 pt-1">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="h-8 flex-1 rounded-xl bg-slate-800" />
                ))}
            </div>
        </div>
    );
});

// ─── Skeleton: desktop row ────────────────────────────────────────────────────
const RowSkeleton = memo(function RowSkeleton() {
    return (
        <tr
            className="animate-pulse border-b border-slate-800/40"
            aria-hidden="true"
        >
            {TABLE_COLS.map((col) => (
                <td key={col.key} className="px-3 py-3">
                    <div className="h-2.5 rounded-full bg-slate-800 w-3/4" />
                </td>
            ))}
        </tr>
    );
});

// ─── PaginationControls ───────────────────────────────────────────────────────
const PaginationControls = memo(function PaginationControls({
    page,
    pageCount,
    total,
    itemCount,
    canPrev,
    canNext,
    loading,
    onPrev,
    onNext,
    className = "",
}) {
    return (
        <nav
            aria-label="Recharge list pagination"
            className={[
                "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-slate-400 text-xs",
                className,
            ].join(" ")}
        >
            <p aria-live="polite" aria-atomic="true">
                Page <strong className="text-slate-300">{page}</strong> of{" "}
                <strong className="text-slate-300">{pageCount}</strong>
                {total > 0 && (
                    <>
                        {" "}
                        ·{" "}
                        <strong className="text-slate-300">
                            {total.toLocaleString()}
                        </strong>{" "}
                        total ·{" "}
                    </>
                )}
                {itemCount} shown
            </p>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={!canPrev || loading}
                    aria-label="Go to previous page"
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-semibold transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    ← Previous
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canNext || loading}
                    aria-label="Go to next page"
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-semibold transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next →
                </button>
            </div>
        </nav>
    );
});

// ─── Mobile: full-data recharge card ─────────────────────────────────────────
const RechargeCard = memo(function RechargeCard({
    r,
    onPreview,
    onCopy,
    onUpdate,
    onAdjust,
    busy,
}) {
    // FIX 1: Use the isPending() predicate — single source of truth
    const showActions = isPending(r);
    // FIX 2: Use the hasSlipData() helper
    const slipAvailable = hasSlipData(r);

    return (
        <article
            // FIX 1 debug: data-status lets you inspect the raw DB value instantly
            data-status={r.status}
            aria-label={`Recharge from ${r.user?.username ?? "unknown"}, ${fmtUsd(r.amount)}, status: ${normalizeStatus(r.status) || "unknown"}`}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3.5 text-sm"
        >
            {/* header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-bold text-white text-base leading-snug truncate">
                        {r.user?.username ?? "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{fmtDt(r.createdAt)}</p>
                </div>
                <StatusBadge status={r.status} />
            </div>

            <div className="h-px bg-slate-800/70" />

            {/* 2-column data grid */}
            <dl className="grid grid-cols-2 gap-x-5 gap-y-3">
                <div>
                    <dt className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                        Email
                    </dt>
                    <dd className="text-slate-300 text-xs mt-0.5 break-all">
                        {r.user?.email ?? "—"}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                        Phone
                    </dt>
                    <dd className="text-slate-300 text-xs mt-0.5">
                        {r.user?.phone ?? "—"}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                        Balance
                    </dt>
                    <dd className="text-slate-300 text-xs mt-0.5 font-mono">
                        {fmtUsd(r.user?.balance)}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                        Invested
                    </dt>
                    <dd className="text-slate-300 text-xs mt-0.5 font-mono">
                        {fmtUsd(r.user?.investedAmount)}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                        Earnings
                    </dt>
                    <dd className="text-slate-300 text-xs mt-0.5 font-mono">
                        {fmtUsd(r.user?.totalEarnings)}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                        Daily Profit
                    </dt>
                    <dd className="text-slate-300 text-xs mt-0.5 font-mono">
                        {fmtUsd(r.user?.dailyProfit)}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                        Amount
                    </dt>
                    <dd className="text-yellow-400 text-sm mt-0.5 font-bold">
                        {fmtUsd(r.amount)}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                        Network
                    </dt>
                    <dd className="text-slate-300 text-xs mt-0.5">{r.network ?? "—"}</dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                        Slip
                    </dt>
                    <dd className="text-slate-300 text-xs mt-0.5">
                        {slipAvailable ? "Yes" : "No"}
                    </dd>
                </div>
            </dl>

            {/* TXID full width */}
            {r.txId && (
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                        TXID
                    </p>
                    <p className="font-mono text-xs text-slate-400 break-all mt-0.5">
                        {r.txId}
                    </p>
                </div>
            )}

            <div className="h-px bg-slate-800/70" />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Recharge actions">
                <button
                    type="button"
                    disabled={!slipAvailable}
                    onClick={() => onPreview(r._id)}
                    className="flex-1 min-w-[70px] rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    View Slip
                </button>
                <button
                    type="button"
                    onClick={() => onCopy(r.txId)}
                    className="flex-1 min-w-[70px] rounded-xl bg-yellow-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-yellow-300 active:scale-95"
                >
                    Copy TX
                </button>
                <button
                    type="button"
                    disabled={!r.user?._id}
                    onClick={() =>
                        onAdjust(r.user._id, r.user?.username, r.user?.balance)
                    }
                    className="flex-1 min-w-[70px] rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Adjust
                </button>

                {/* FIX 1: Use isPending() predicate — guaranteed single-source comparison */}
                {showActions && (
                    <>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => onUpdate(r._id, "confirmed")}
                            aria-label={`Approve recharge ${r._id}`}
                            className="flex-1 min-w-[70px] rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                        >
                            {busy ? "…" : "Approve"}
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => onUpdate(r._id, "rejected")}
                            aria-label={`Reject recharge ${r._id}`}
                            className="flex-1 min-w-[70px] rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 active:scale-95 disabled:opacity-50"
                        >
                            {busy ? "…" : "Reject"}
                        </button>
                    </>
                )}
            </div>
        </article>
    );
});

// ─── Desktop: row actions ─────────────────────────────────────────────────────
const RowActions = memo(function RowActions({
    r,
    busy,
    onPreview,
    onCopy,
    onUpdate,
    onAdjust,
}) {
    // FIX 1: Same predicate as RechargeCard — can never drift
    const showActions = isPending(r);
    // FIX 2: Same helper as RechargeCard
    const slipAvailable = hasSlipData(r);

    return (
        <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Row actions"
        >
            <button
                type="button"
                disabled={!slipAvailable}
                onClick={() => onPreview(r._id)}
                title="View slip"
                className="rounded-lg bg-slate-800 px-2 py-1.5 text-[10px] font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
                Slip
            </button>
            <button
                type="button"
                onClick={() => onCopy(r.txId)}
                title="Copy TX ID"
                className="rounded-lg bg-yellow-400 px-2 py-1.5 text-[10px] font-semibold text-slate-950 transition hover:bg-yellow-300"
            >
                Copy TX
            </button>
            <button
                type="button"
                disabled={!r.user?._id}
                onClick={() =>
                    onAdjust(r.user._id, r.user?.username, r.user?.balance)
                }
                title="Adjust user balance"
                className="rounded-lg bg-slate-800 px-2 py-1.5 text-[10px] font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
                Adjust
            </button>

            {/* FIX 1: isPending() predicate — matches RechargeCard exactly */}
            {showActions && (
                <>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => onUpdate(r._id, "confirmed")}
                        title="Approve recharge"
                        aria-label={`Approve recharge ${r._id}`}
                        className="rounded-lg bg-emerald-600 px-2 py-1.5 text-[10px] font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                        {busy ? "…" : "Approve"}
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => onUpdate(r._id, "rejected")}
                        title="Reject recharge"
                        aria-label={`Reject recharge ${r._id}`}
                        className="rounded-lg bg-red-600 px-2 py-1.5 text-[10px] font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                    >
                        {busy ? "…" : "Reject"}
                    </button>
                </>
            )}
        </div>
    );
});

// ─── Slip preview modal ───────────────────────────────────────────────────────
const SlipModal = memo(function SlipModal({ src, loading, onClose }) {
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        if (!src && !loading) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [src, loading, onClose]);

    if (!src && !loading) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Recharge slip preview"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl"
            onClick={onClose}
        >
            <div
                className="relative flex w-full max-w-4xl max-h-[90vh] items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    aria-label="Close slip preview"
                    onClick={onClose}
                    className="absolute -top-10 right-0 z-10 rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-300 transition hover:text-yellow-400"
                >
                    ✕ Close
                </button>
                {loading && (
                    <div
                        aria-busy="true"
                        className="h-72 w-72 animate-pulse rounded-2xl border border-yellow-500/10 bg-slate-900"
                    />
                )}
                {src && !loadError && (
                    <Suspense
                        fallback={
                            <div className="h-72 w-72 animate-pulse rounded-2xl border border-yellow-500/10 bg-slate-900" />
                        }
                    >
                        <TransformWrapper
                            defaultScale={1}
                            minScale={0.5}
                            maxScale={5}
                            centerOnInit={true}
                            wheel={{ step: 0.1 }}
                            pinch={{ step: 5 }}
                            doubleClick={{ step: 1.2 }}
                            alignmentAnimation={{ sizeX: 0.8, sizeY: 0.8 }}
                            wrapperStyle={{ width: "100%", touchAction: "none" }}
                        >
                            <TransformComponent>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={src}
                                    alt="Recharge slip"
                                    className="max-h-[85vh] max-w-full rounded-2xl object-contain"
                                    loading="lazy"
                                    decoding="async"
                                    onError={() => setLoadError(true)}
                                />
                            </TransformComponent>
                        </TransformWrapper>
                    </Suspense>
                )}
                {src && loadError && (
                    <div className="flex min-h-[18rem] min-w-[18rem] max-w-full flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-slate-950 px-6 py-8 text-center text-sm text-slate-300">
                        <p className="font-semibold text-red-300">
                            Unable to load slip image.
                        </p>
                        <p className="text-slate-500">
                            The image may be corrupted or the stored file metadata is missing.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300"
                        >
                            Close preview
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

// ─── Balance modal ────────────────────────────────────────────────────────────
const BalanceModal = memo(function BalanceModal({
    modal,
    onClose,
    onChange,
    onSubmit,
}) {
    if (!modal.open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Adjust user balance"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-white">
                            Adjust balance for {modal.username}
                        </p>
                        <p className="text-xs text-slate-500">
                            Current balance: {fmtUsd(modal.currentBalance)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close balance modal"
                        className="rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                    >
                        ✕
                    </button>
                </div>

                {/* NOTE: using <form> here is correct — it's a self-contained dialog form */}
                <form
                    className="mt-5 space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit();
                    }}
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-2 text-xs text-slate-400">
                            Operation
                            <select
                                value={modal.operation}
                                onChange={(e) => onChange("operation", e.target.value)}
                                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-yellow-500"
                            >
                                <option value="increase">Increase</option>
                                <option value="decrease">Decrease</option>
                            </select>
                        </label>
                        <label className="space-y-2 text-xs text-slate-400">
                            Amount
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={modal.amount}
                                onChange={(e) => onChange("amount", e.target.value)}
                                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-yellow-500"
                                placeholder="0.00"
                            />
                        </label>
                    </div>

                    {modal.error && (
                        <p
                            role="alert"
                            className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200"
                        >
                            {modal.error}
                        </p>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={modal.loading}
                            className="rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {modal.loading
                                ? "Saving..."
                                : `${modal.operation === "increase" ? "Increase" : "Decrease"} balance`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportToCsv(recharges) {
    const HEADERS = [
        "Date",
        "Username",
        "Email",
        "Phone",
        "Balance",
        "Invested",
        "Total Earned",
        "Daily Profit",
        "Amount",
        "Network",
        "TXID",
        "Status",
        "Slip",
    ];
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = recharges.map((r) => [
        fmtDt(r.createdAt),
        r.user?.username ?? "",
        r.user?.email ?? "",
        r.user?.phone ?? "",
        r.user?.balance ?? "",
        r.user?.investedAmount ?? "",
        r.user?.totalEarnings ?? "",
        r.user?.dailyProfit ?? "",
        r.amount ?? "",
        r.network ?? "",
        r.txId ?? "",
        r.status ?? "",
        hasSlipData(r) ? "Yes" : "No",
    ]);
    const csv = [HEADERS, ...rows]
        .map((row) => row.map(escape).join(","))
        .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `recharges-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = memo(function EmptyState({ colSpan }) {
    const inner = (
        <div
            role="status"
            className="flex flex-col items-center justify-center gap-2 py-14 text-slate-600"
        >
            <span aria-hidden="true" className="text-4xl">
                📭
            </span>
            <p
                className={
                    colSpan ? "text-xs font-semibold" : "text-sm font-semibold"
                }
            >
                No recharges found
            </p>
        </div>
    );
    if (colSpan) {
        return (
            <tr>
                <td colSpan={colSpan}>{inner}</td>
            </tr>
        );
    }
    return inner;
});

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminClient({ initialData }) {
    const [state, dispatch] = useReducer(reducer, INIT_STATE);

    const {
        recharges,
        stats,
        loadingRecharges,
        loadingStats,
        actionLoading,
        previewSlip,
        previewLoading,
    } = state;

    const { data: session, status } = useSession();
    const router = useRouter();

    // FIX 3: Seed initialData through RECHARGES_OK so pagination fields are set.
    // The one-shot ref prevents re-seeding on every render.
    const seededRef = useRef(false);
    useEffect(() => {
        if (seededRef.current || !initialData) return;
        seededRef.current = true;
        dispatch({
            type: "RECHARGES_OK",
            payload: {
                data: initialData,
                page: 1,
                // Let the reducer infer pageCount/hasMore from total.
                // If initialData carries these fields already, they'll be used.
                total: initialData.length,
                limit: INIT_STATE.pageSize,
            },
        });
    }, [initialData]);

    const [balanceModal, setBalanceModal] = useState({
        open: false,
        userId: null,
        username: "",
        currentBalance: 0,
        operation: "increase",
        amount: "",
        error: null,
        loading: false,
    });

    const isAdmin =
        status === "authenticated" && session?.user?.role === "admin";

    const { fetchRecharges } = useAdminData(
        dispatch,
        isAdmin,
        state.page,
        state.pageSize
    );

    // ── Pagination booleans ──────────────────────────────────────────────────────
    const canPrevPage = state.page > 1;
    const canNextPage = state.hasMore || state.page < state.pageCount;

    // ── Balance modal helpers ────────────────────────────────────────────────────
    const openBalanceModal = useCallback((userId, username, currentBalance) => {
        setBalanceModal({
            open: true,
            userId,
            username: username || "User",
            currentBalance: Number(currentBalance) || 0,
            operation: "increase",
            amount: "",
            error: null,
            loading: false,
        });
    }, []);

    const closeBalanceModal = useCallback(() => {
        setBalanceModal((prev) => ({
            ...prev,
            open: false,
            amount: "",
            error: null,
            loading: false,
        }));
    }, []);

    const updateBalanceField = useCallback((field, value) => {
        setBalanceModal((prev) => ({ ...prev, [field]: value, error: null }));
    }, []);

    const submitBalanceAdjustment = useCallback(async () => {
        if (!balanceModal.userId) return;
        const amount = Number(balanceModal.amount);
        if (!amount || amount <= 0) {
            setBalanceModal((prev) => ({
                ...prev,
                error: "Enter a valid positive amount.",
            }));
            return;
        }

        setBalanceModal((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const res = await fetch(
                `/api/admin/user/${balanceModal.userId}/balance`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        operation: balanceModal.operation,
                        amount,
                    }),
                }
            );
            const json = await res.json();
            if (!res.ok)
                throw new Error(json?.error || "Failed to update balance.");
            dispatch({
                type: "USER_BALANCE_UPDATED",
                payload: {
                    userId: balanceModal.userId,
                    balance: Number(json.data.balance),
                },
            });
            setBalanceModal((prev) => ({
                ...prev,
                loading: false,
                open: false,
                amount: "",
                error: null,
            }));
        } catch (error) {
            console.error("submitBalanceAdjustment:", error);
            setBalanceModal((prev) => ({
                ...prev,
                loading: false,
                error: error.message || "Unable to update balance.",
            }));
        }
    }, [balanceModal, dispatch]);

    // ── Recharge actions ─────────────────────────────────────────────────────────
    const updateStatus = useCallback(async (id, newStatus) => {
        dispatch({ type: "ACTION_START", id });
        try {
            const res = await fetch(`/api/recharge/admin/${id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const json = await res.json();
            if (res.ok && json.data) {
                dispatch({ type: "RECHARGE_UPDATED", payload: json.data });
                bustCache("recharges");
            }
        } catch (e) {
            console.error("updateStatus:", e);
        } finally {
            dispatch({ type: "ACTION_END", id });
        }
    }, []);

    const openPreview = useCallback(async (id) => {
        dispatch({ type: "PREVIEW_LOADING" });
        try {
            const res = await fetch(`/api/recharge/admin/${id}`, {
                cache: "no-store",
                credentials: "include",
            });
            const json = await res.json();
            if (res.ok && json.data?.slip?.dataUrl) {
                dispatch({ type: "PREVIEW_OPEN", payload: json.data.slip.dataUrl });
            } else {
                dispatch({ type: "PREVIEW_ERR" });
            }
        } catch {
            dispatch({ type: "PREVIEW_ERR" });
        }
    }, []);

    const closePreview = useCallback(
        () => dispatch({ type: "PREVIEW_CLOSE" }),
        []
    );

    const copyTx = useCallback((tx) => {
        if (tx) navigator.clipboard.writeText(tx).catch(() => { });
    }, []);

    const handleExport = useCallback(() => exportToCsv(recharges), [recharges]);

    const handlePrevPage = useCallback(() => {
        if (canPrevPage) fetchRecharges(state.page - 1);
    }, [fetchRecharges, state.page, canPrevPage]);

    const handleNextPage = useCallback(() => {
        if (canNextPage) fetchRecharges(state.page + 1);
    }, [fetchRecharges, state.page, canNextPage]);

    const statCards = useMemo(
        () => [
            {
                title: "Total Users",
                value: loadingStats ? "…" : fmtNum(stats.totalUsers),
            },
            {
                title: "Total Invested",
                value: loadingStats ? "…" : `$${fmtNum(stats.totalInvestment)}`,
            },
            {
                title: "Pending Withdraws",
                value: loadingStats ? "…" : `$${fmtNum(stats.totalWithdraw)}`,
                onClick: () => router.push("/admin/withdraws"),
            },
            {
                title: "Daily Profit (All)",
                value: loadingStats ? "…" : `$${fmtNum(stats.totalDailyProfit)}`,
            },
        ],
        [stats, loadingStats, router]
    );

    const paginationProps = {
        page: state.page,
        pageCount: state.pageCount,
        total: state.total,
        itemCount: recharges.length,
        canPrev: canPrevPage,
        canNext: canNextPage,
        loading: loadingRecharges,
        onPrev: handlePrevPage,
        onNext: handleNextPage,
    };

    // ── Auth guards ──────────────────────────────────────────────────────────────
    if (status === "loading") {
        return (
            <div
                role="status"
                aria-live="polite"
                className="flex min-h-screen items-center justify-center bg-black text-yellow-400 text-base font-bold animate-pulse"
            >
                Loading admin panel…
            </div>
        );
    }
    if (!isAdmin) {
        return (
            <div
                role="alert"
                className="flex min-h-screen items-center justify-center bg-black text-red-400 text-base font-bold"
            >
                Unauthorized
            </div>
        );
    }

    return (
        <main
            aria-label="Admin Dashboard"
            className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black px-3 py-6 sm:px-5 lg:px-10 lg:py-12 text-white"
        >
            {/* ── Header ── */}
            <header className="mb-7 lg:mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-yellow-400">
                        Admin Dashboard
                    </h1>
                    <p className="mt-1 text-xs text-slate-600">
                        Manage recharges, stats, and withdrawals.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchRecharges(state.page, true)}
                    aria-label="Refresh recharge data"
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white active:scale-95"
                >
                    ↻ Refresh
                </button>
            </header>

            {/* ── Stats ── */}
            <section
                aria-label="Platform statistics"
                className="mb-8 lg:mb-12 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4"
            >
                {statCards.map((c) => (
                    <StatCard key={c.title} loading={loadingStats} {...c} />
                ))}
            </section>

            {/* ── Recharges ── */}
            <section aria-label="Recent recharges">
                {/* toolbar */}
                <div className="mb-4 lg:mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-yellow-400">
                            Recent Recharges
                        </h2>
                        <p className="mt-0.5 text-[10px] sm:text-xs text-slate-600">
                            Live · cached 60 s · CSV export
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        aria-label="Export all recharges to CSV"
                        className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-yellow-400 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-yellow-400/10 transition hover:bg-yellow-300 active:scale-95"
                    >
                        ↓ Export CSV
                    </button>
                </div>

                {/* Pagination — TOP */}
                <PaginationControls {...paginationProps} className="mb-4" />

                {/* ── Mobile cards (< lg) ── */}
                <div
                    className="lg:hidden space-y-3"
                    aria-live="polite"
                    aria-busy={loadingRecharges}
                >
                    {loadingRecharges ? (
                        Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)
                    ) : recharges.length === 0 ? (
                        <EmptyState />
                    ) : (
                        recharges.map((r) => (
                            <RechargeCard
                                key={r._id}
                                r={r}
                                onPreview={openPreview}
                                onCopy={copyTx}
                                onUpdate={updateStatus}
                                onAdjust={openBalanceModal}
                                busy={!!actionLoading[r._id]}
                            />
                        ))
                    )}
                </div>

                {/* ── Desktop table (≥ lg) ── */}
                <div className="hidden lg:block w-full rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
                    <table
                        className="w-full table-fixed text-left"
                        aria-label="Recharges data table"
                    >
                        <colgroup>
                            <col style={{ width: "4%" }} />   {/* Date         */}
                            <col style={{ width: "6%" }} />   {/* User         */}
                            <col style={{ width: "8%" }} />   {/* Email        */}
                            <col style={{ width: "8%" }} />   {/* Phone        */}
                            <col style={{ width: "6%" }} />   {/* Balance      */}
                            <col style={{ width: "6%" }} />   {/* Invested     */}
                            <col style={{ width: "5%" }} />   {/* Earnings     */}
                            <col style={{ width: "6%" }} />   {/* Daily Profit */}
                            <col style={{ width: "4%" }} />   {/* Amount       */}
                            <col style={{ width: "7%" }} />  {/* TXID         */}
                            <col style={{ width: "5%" }} />   {/* Status       */}
                            <col style={{ width: "4%" }} />   {/* Slip         */}
                            <col style={{ width: "12%" }} />  {/* Actions      */}
                        </colgroup>

                        <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
                            <tr>
                                {TABLE_COLS.map((col) => (
                                    <th
                                        key={col.key}
                                        scope="col"
                                        className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate"
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody
                            className="divide-y divide-slate-800/40"
                            aria-live="polite"
                            aria-busy={loadingRecharges}
                        >
                            {loadingRecharges ? (
                                Array.from({ length: 6 }, (_, i) => <RowSkeleton key={i} />)
                            ) : recharges.length === 0 ? (
                                <EmptyState colSpan={TABLE_COLS.length} />
                            ) : (
                                recharges.map((r) => (
                                    <tr
                                        key={r._id}
                                        // FIX 1 debug: inspect raw status in DevTools easily
                                        data-status={r.status}
                                        className="transition-colors hover:bg-slate-900/50 text-xs"
                                    >
                                        <td className="px-3 py-3 text-slate-500 truncate">
                                            <span title={fmtDt(r.createdAt)}>
                                                {fmtDtSm(r.createdAt)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 font-semibold text-white truncate">
                                            {r.user?.username ?? "Unknown"}
                                        </td>
                                        <td
                                            className="px-3 py-3 text-slate-400 truncate"
                                            title={r.user?.email}
                                        >
                                            {r.user?.email ?? "—"}
                                        </td>
                                        <td className="px-3 py-3 text-slate-400 truncate">
                                            {r.user?.phone ?? "—"}
                                        </td>
                                        <td className="px-3 py-3 text-slate-300 truncate font-mono">
                                            {fmtUsd(r.user?.balance)}
                                        </td>
                                        <td className="px-3 py-3 text-slate-300 truncate font-mono">
                                            {fmtUsd(r.user?.investedAmount)}
                                        </td>
                                        <td className="px-3 py-3 text-slate-300 truncate font-mono">
                                            {fmtUsd(r.user?.totalEarnings)}
                                        </td>
                                        <td className="px-3 py-3 text-slate-300 truncate font-mono">
                                            {fmtUsd(r.user?.dailyProfit)}
                                        </td>
                                        <td className="px-3 py-3 font-bold text-yellow-400 truncate">
                                            {fmtUsd(r.amount)}
                                        </td>
                                        <td
                                            className="px-3 py-3 font-mono text-slate-500 truncate"
                                            title={r.txId}
                                        >
                                            {r.txId ? `${r.txId.slice(0, 10)}…` : "—"}
                                        </td>
                                        <td className="px-3 py-3">
                                            <StatusBadge status={r.status} />
                                        </td>
                                        <td className="px-3 py-3 text-slate-500 text-[11px]">
                                            {hasSlipData(r) ? "Yes" : "No"}
                                        </td>
                                        <td className="px-3 py-3">
                                            <RowActions
                                                r={r}
                                                busy={!!actionLoading[r._id]}
                                                onPreview={openPreview}
                                                onCopy={copyTx}
                                                onUpdate={updateStatus}
                                                onAdjust={openBalanceModal}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Pagination — BOTTOM */}
            <PaginationControls {...paginationProps} className="mt-4" />

            {/* ── Modals ── */}
            <SlipModal
                key={previewSlip || "slip-preview"}
                src={previewSlip}
                loading={previewLoading}
                onClose={closePreview}
            />
            <BalanceModal
                modal={balanceModal}
                onClose={closeBalanceModal}
                onChange={updateBalanceField}
                onSubmit={submitBalanceAdjustment}
            />
        </main>
    );
}