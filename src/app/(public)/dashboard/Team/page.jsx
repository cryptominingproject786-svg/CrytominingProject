"use client";

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const STATUS = Object.freeze({
    ROOT: "root",
    QUALIFIED: "qualified",
    PENDING: "pending",
    ZERO: "zero",
    GHOST: "ghost",
});

/** Max slots per pyramid level (index = level number) */
const LEVEL_CAPACITY = [1, 2, 4, 8, 16, 32];

const COPY_STATE = Object.freeze({
    IDLE: "idle",
    COPIED: "copied",
    ERROR: "error",
});

const COPY_RESET_MS = 2200;

/* ─────────────────────────────────────────────────────────────────────────────
   UTILITY HOOKS
───────────────────────────────────────────────────────────────────────────── */

function useCopyLink(url) {
    const [state, setState] = useState(COPY_STATE.IDLE);
    const timerRef = useRef(null);

    const scheduleReset = useCallback(() => {
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(
            () => setState(COPY_STATE.IDLE),
            COPY_RESET_MS,
        );
    }, []);

    const copy = useCallback(async () => {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setState(COPY_STATE.COPIED);
        } catch {
            setState(COPY_STATE.ERROR);
        } finally {
            scheduleReset();
        }
    }, [url, scheduleReset]);

    useEffect(() => () => window.clearTimeout(timerRef.current), []);

    return { copyState: state, copy };
}

/* ─────────────────────────────────────────────────────────────────────────────
   UTILITY FUNCTIONS
───────────────────────────────────────────────────────────────────────────── */

function buildLevelNodes(filledCount, capacity, qualifiedCount = 0) {
    return Array.from({ length: capacity }, (_, i) => {
        if (i >= filledCount) return { status: STATUS.GHOST };
        if (i < qualifiedCount) return { status: STATUS.QUALIFIED, showCheck: true };
        return { status: STATUS.PENDING };
    });
}

function distributeLevels(directCount, totalTeam) {
    const l1 = Math.min(LEVEL_CAPACITY[1], directCount);
    let remaining = Math.max(0, totalTeam - l1);

    return LEVEL_CAPACITY.slice(2).reduce(
        (acc, cap) => {
            const filled = Math.min(cap, remaining);
            remaining -= filled;
            acc.push(filled);
            return acc;
        },
        [l1],
    );
}

function buildReferralUrl(code) {
    if (!code) return null;
    const origin =
        (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_NEXTAUTH_URL) ||
        (typeof window !== "undefined" ? window.location.origin : "");
    return `${origin.replace(/\/$/, "")}/signup?referral=${encodeURIComponent(code)}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SVG ICONS
───────────────────────────────────────────────────────────────────────────── */

const BASE_SVG = {
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

function IconPerson({ size = 22, color = "currentColor" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
            <circle cx="12" cy="7" r="4" />
            <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
        </svg>
    );
}
function IconLink({ size = 17 }) {
    return (
        <svg {...BASE_SVG} width={size} height={size} viewBox="0 0 24 24" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    );
}
function IconCopy({ size = 14 }) {
    return (
        <svg {...BASE_SVG} width={size} height={size} viewBox="0 0 24 24" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    );
}
function IconCheck({ size = 14, strokeWidth = 2.5 }) {
    return (
        <svg {...BASE_SVG} width={size} height={size} viewBox="0 0 24 24" strokeWidth={strokeWidth}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
function IconGlobe({ size = 13 }) {
    return (
        <svg {...BASE_SVG} width={size} height={size} viewBox="0 0 24 24" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}
function IconUsers({ size = 20 }) {
    return (
        <svg {...BASE_SVG} width={size} height={size} viewBox="0 0 24 24" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}
function IconShield({ size = 20 }) {
    return (
        <svg {...BASE_SVG} width={size} height={size} viewBox="0 0 24 24" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
        </svg>
    );
}
function IconDollar({ size = 20 }) {
    return (
        <svg {...BASE_SVG} width={size} height={size} viewBox="0 0 24 24" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 0 0 7H6" />
        </svg>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NODE COLOUR MAP
───────────────────────────────────────────────────────────────────────────── */

const NODE_CLS = {
    [STATUS.ROOT]: "bg-amber-600   border-amber-500   shadow-lg shadow-amber-500/25",
    [STATUS.QUALIFIED]: "bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/30",
    [STATUS.PENDING]: "bg-white       border-slate-300   shadow-sm",
    [STATUS.ZERO]: "bg-red-600     border-red-500     shadow-lg shadow-red-500/30",
    [STATUS.GHOST]: "bg-slate-900   border-slate-700   border-dashed",
};

const NODE_ICON_COLOR = {
    [STATUS.ROOT]: "#fff",
    [STATUS.QUALIFIED]: "#fff",
    [STATUS.ZERO]: "#fff",
    [STATUS.PENDING]: "#0f172a",
    [STATUS.GHOST]: "#475569",
};

/* ─────────────────────────────────────────────────────────────────────────────
   CHECK BADGE
───────────────────────────────────────────────────────────────────────────── */

function CheckBadge() {
    return (
        <span
            aria-label="Qualified"
            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border border-slate-950 shadow-lg shadow-emerald-500/40"
        >
            <IconCheck size={10} strokeWidth={2.2} />
        </span>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   REFERRAL NODE
   Fix: consistent, touch-friendly sizing; removed double-class sm: variants
   that caused layout shifts; tighter label truncation with explicit maxWidth.
───────────────────────────────────────────────────────────────────────────── */

const ReferralNode = React.memo(function ReferralNode({ status, label, showCheck = false }) {
    const isGhost = status === STATUS.GHOST;

    return (
        // flex-col + gap: keeps node + label vertically aligned even in wrapping rows
        <div className="flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
            <div
                className={[
                    // 44 px min touch-target on mobile (Apple HIG / WCAG 2.5.5)
                    "relative flex items-center justify-center",
                    "h-11 w-11 sm:h-12 sm:w-12",
                    "rounded-full border-2 transition-all duration-300 flex-shrink-0",
                    NODE_CLS[status] ?? NODE_CLS[STATUS.GHOST],
                ].join(" ")}
            >
                <IconPerson
                    color={NODE_ICON_COLOR[status] ?? "#475569"}
                    size={16}
                />
                {showCheck && <CheckBadge />}
            </div>

            {/* Label: clamp to 52 px so nodes don't widen in wrapped rows */}
            <p
                className="text-[9px] text-slate-400 leading-tight text-center truncate"
                style={{ maxWidth: 52 }}
            >
                {label || (isGhost ? "open" : "")}
            </p>
        </div>
    );
});

/* ─────────────────────────────────────────────────────────────────────────────
   PYRAMID ROW
   Fix: On very wide levels (L4 = 16 nodes, L5 = 32 nodes) a flex-wrap layout
   overflows on mobile. We cap visible nodes per row to keep things readable
   and add a "+N more" badge for the rest. The label column is narrowed on
   mobile with a fixed pixel width so the node area gets the most space.
───────────────────────────────────────────────────────────────────────────── */

/** Max nodes to render on mobile before collapsing to "+N more" */
const MOBILE_NODE_LIMIT = 8;

function PyramidRow({ title, filled, capacity, nodes }) {
    // Detect mobile via window width (SSR-safe: default to false / show all)
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 639px)");
        const handler = (e) => setIsMobile(e.matches);
        setIsMobile(mq.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const visibleNodes = isMobile && nodes.length > MOBILE_NODE_LIMIT
        ? nodes.slice(0, MOBILE_NODE_LIMIT)
        : nodes;
    const hiddenCount = nodes.length - visibleNodes.length;

    return (
        // Two-column grid: fixed label col | flexible node area
        // Using inline style for the label column width so it can be px-precise
        <div className="flex items-start gap-3 sm:gap-4 py-4">
            {/* Label column — fixed, won't shrink */}
            <div className="flex-shrink-0 w-16 sm:w-32 pt-1">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold leading-snug">
                    {title}
                </p>
                <p className="mt-1 text-xs sm:text-sm font-bold text-white tabular-nums">
                    {filled}
                    <span className="font-normal text-slate-600">/{capacity}</span>
                </p>
            </div>

            {/* Node area — wraps freely, no overflow */}
            <div className="flex-1 min-w-0 flex flex-wrap gap-2">
                {visibleNodes.map((node, idx) => (
                    <ReferralNode key={idx} {...node} />
                ))}
                {hiddenCount > 0 && (
                    <div className="flex items-center justify-center h-11 w-11 rounded-full border-2 border-dashed border-slate-700 bg-slate-900 flex-shrink-0">
                        <span className="text-[9px] font-semibold text-slate-500">+{hiddenCount}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LEGEND
───────────────────────────────────────────────────────────────────────────── */

const LEGEND_ITEMS = [
    { cls: "bg-amber-600   border-amber-500", label: "You (root)" },
    { cls: "bg-emerald-600 border-emerald-500", label: "Invested" },
    { cls: "bg-white       border-slate-300", label: "Signed up" },
    { cls: "bg-red-600     border-red-500", label: "Zero balance" },
    { cls: "bg-slate-900   border-slate-700 border-dashed", label: "Open slot" },
];

function Legend() {
    return (
        // 2-col grid on the narrowest phones so items don't wrap awkwardly
        <div
            className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-4 gap-y-2 mt-3"
            role="list"
            aria-label="Node colour legend"
        >
            {LEGEND_ITEMS.map(({ cls, label }) => (
                <div key={label} className="flex items-center gap-1.5 min-w-0" role="listitem">
                    <span
                        className={`flex-shrink-0 h-3 w-3 rounded-full border-2 ${cls}`}
                        aria-hidden="true"
                    />
                    <span className="text-[11px] text-slate-400 truncate">{label}</span>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAT CARD
   Fix: Ensure value never clips. Use word-break so long dollar strings wrap
   gracefully rather than overflow on narrow cards.
───────────────────────────────────────────────────────────────────────────── */

function StatCard({ label, value, accent = false, Icon }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold leading-snug">
                    {label}
                </p>
                {Icon && (
                    <span
                        className={`flex-shrink-0 ${accent ? "text-emerald-500" : "text-slate-600"}`}
                        aria-hidden="true"
                    >
                        <Icon size={15} />
                    </span>
                )}
            </div>
            <p
                className={[
                    "text-lg sm:text-2xl font-extrabold tabular-nums leading-none break-all",
                    accent ? "text-emerald-400" : "text-white",
                ].join(" ")}
            >
                {value}
            </p>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   REFERRAL LINK CARD
   Fixes:
   - URL pill: overflow-hidden + text-ellipsis prevents URL from blowing layout
   - Button: full-width at all breakpoints; icon and text never wrap separately
   - Referral code badge: shrinks with truncation, won't push heading off-screen
───────────────────────────────────────────────────────────────────────────── */

function ReferralLinkCard({ referralCode, referralUrl, copyState, onCopy }) {
    const isCopied = copyState === COPY_STATE.COPIED;
    const isError = copyState === COPY_STATE.ERROR;
    const isActive = Boolean(referralUrl);

    const btnCls = [
        "w-full inline-flex items-center justify-center gap-2",
        "min-h-[48px] rounded-xl px-4 text-sm font-semibold",
        "transition-all duration-200 touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
        isError ? "bg-red-500/90 text-white" :
            isCopied ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" :
                isActive ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300 active:scale-[0.98] shadow-md shadow-yellow-400/20" :
                    "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60",
    ].join(" ");

    return (
        <div className="w-full rounded-2xl border border-slate-700/50 bg-slate-900 overflow-hidden">
            {/* Accent stripe */}
            <div
                className="h-[3px] w-full bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500"
                aria-hidden="true"
            />

            <div className="p-4 sm:p-6 flex flex-col gap-4">

                {/* Icon + title row */}
                <div className="flex items-start gap-3 min-w-0">
                    <div
                        className="flex-shrink-0 mt-0.5 h-8 w-8 flex items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                        aria-hidden="true"
                    >
                        <IconLink size={15} />
                    </div>

                    <div className="min-w-0 flex-1">
                        {/* Title + badge: wrap vertically on tiny phones */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className="text-sm font-bold text-white leading-snug">
                                Your Referral Link
                            </h3>
                            {referralCode && (
                                <span
                                    className="inline-flex items-center rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-mono font-semibold text-yellow-300 tracking-widest uppercase select-all"
                                    style={{ maxWidth: "min(120px, 100%)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                >
                                    {referralCode}
                                </span>
                            )}
                        </div>
                        <p className="mt-1.5 text-[12px] text-slate-400 leading-relaxed">
                            Share this link to invite friends. Earn rewards when they invest.
                        </p>
                    </div>
                </div>

                {/* URL pill — overflow-hidden + min-w-0 chain prevents layout blow-out */}
                <div
                    className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-3 hover:border-slate-700 transition-colors overflow-hidden"
                    aria-label="Referral URL"
                >
                    <span className="flex-shrink-0 text-slate-500" aria-hidden="true">
                        <IconGlobe size={13} />
                    </span>
                    {/*
                     * overflow-hidden + text-ellipsis on the <p> itself rather
                     * than relying solely on `truncate` (which needs a parent with
                     * overflow:hidden already established — we have that now).
                     */}
                    <p
                        className="flex-1 min-w-0 text-[11px] sm:text-[13px] font-mono text-slate-300 select-all"
                        style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            direction: "ltr",
                        }}
                        title={referralUrl || referralCode || "—"}
                    >
                        {referralUrl || referralCode || "No link available"}
                    </p>
                </div>

                {/* CTA — touch-manipulation for snappier mobile tap response */}
                <button
                    type="button"
                    onClick={onCopy}
                    disabled={!isActive}
                    aria-label={
                        isCopied ? "Referral link copied" :
                            isError ? "Copy failed — select manually" :
                                "Copy referral link"
                    }
                    aria-live="polite"
                    className={btnCls}
                >
                    {isCopied ? (
                        <><IconCheck size={14} /><span>Copied to clipboard</span></>
                    ) : isError ? (
                        <span>Copy failed — select manually</span>
                    ) : (
                        <><IconCopy size={14} /><span>Copy referral link</span></>
                    )}
                </button>

            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   REFERRAL NETWORK
───────────────────────────────────────────────────────────────────────────── */

const ReferralNetwork = React.memo(function ReferralNetwork({ data }) {
    const directRefs = data?.directReferrals ?? [];
    const totalTeam = data?.teamMembersCount ?? 0;
    const qualifiedCount = data?.qualifiedReferralsCount ?? 0;
    const referralCode = data?.referralCode ?? null;
    const teamEarnings = data?.teamEarnings ?? 0;

    const referralUrl = useMemo(() => buildReferralUrl(referralCode), [referralCode]);
    const { copyState, copy } = useCopyLink(referralUrl);

    const [l1, l2, l3, l4, l5] = useMemo(
        () => distributeLevels(directRefs.length, totalTeam),
        [directRefs.length, totalTeam],
    );

    const directQualified = useMemo(
        () => directRefs.filter((r) => r.isQualified).length,
        [directRefs],
    );
    const l2Qualified = Math.min(l2, Math.max(0, qualifiedCount - directQualified));

    const level1Nodes = useMemo(
        () => Array.from({ length: LEVEL_CAPACITY[1] }, (_, i) => {
            if (i >= directRefs.length) return { status: STATUS.GHOST };
            const { status, username } = directRefs[i];
            return {
                status: status === "qualified" ? STATUS.QUALIFIED
                    : status === "zero" ? STATUS.ZERO
                        : STATUS.PENDING,
                showCheck: status !== "pending",
                label: username?.slice(0, 9) || "",
            };
        }),
        [directRefs],
    );

    const level2Nodes = useMemo(() => buildLevelNodes(l2, LEVEL_CAPACITY[2], l2Qualified), [l2, l2Qualified]);
    const level3Nodes = useMemo(() => buildLevelNodes(l3, LEVEL_CAPACITY[3]), [l3]);
    const level4Nodes = useMemo(() => buildLevelNodes(l4, LEVEL_CAPACITY[4]), [l4]);
    const level5Nodes = useMemo(() => buildLevelNodes(l5, LEVEL_CAPACITY[5]), [l5]);

    const pyramidRows = [
        { title: "Root", filled: 1, capacity: LEVEL_CAPACITY[0], nodes: [{ status: STATUS.ROOT, label: "You" }] },
        { title: "Level 1", filled: l1, capacity: LEVEL_CAPACITY[1], nodes: level1Nodes },
        { title: "Level 2", filled: l2, capacity: LEVEL_CAPACITY[2], nodes: level2Nodes },
        { title: "Level 3", filled: l3, capacity: LEVEL_CAPACITY[3], nodes: level3Nodes },
        { title: "Level 4", filled: l4, capacity: LEVEL_CAPACITY[4], nodes: level4Nodes },
        { title: "Level 5", filled: l5, capacity: LEVEL_CAPACITY[5], nodes: level5Nodes },
    ];

    const statCards = [
        { label: "Team Members", value: totalTeam, Icon: IconUsers, accent: false },
        { label: "Qualified", value: qualifiedCount, Icon: IconShield, accent: true },
        { label: "Team Earnings", value: `$${teamEarnings.toFixed(2)}`, Icon: IconDollar, accent: false },
    ];

    return (
        <section
            aria-labelledby="referral-network-heading"
            className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4 sm:p-8 shadow-2xl"
        >
            {/*
             * Layout:
             * Mobile (default): single column — stats above, link card below
             * lg+: two columns side-by-side
             * The link card column is fixed at 300px on lg, 340px on xl,
             * so the left column gets all remaining space.
             */}
            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] lg:gap-6 mb-8">

                {/* Left: heading + legend + stat cards */}
                <div className="flex flex-col gap-4 sm:gap-5">
                    <div>
                        <h2
                            id="referral-network-heading"
                            className="text-xl sm:text-2xl font-extrabold text-white"
                        >
                            Referral Network
                        </h2>
                        <p className="mt-2 text-[13px] sm:text-sm text-slate-400 leading-relaxed">
                            Nodes turn{" "}
                            <span className="text-emerald-400 font-semibold">green</span>{" "}
                            when a referral completes their first investment.
                        </p>
                        <Legend />
                    </div>

                    {/*
                     * 3-col grid for stat cards.
                     * Falls back to single col below ~380 px where 3 cards would clip.
                     * Uses a 380 px custom breakpoint (Tailwind JIT arbitrary value).
                     */}
                    <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2 sm:gap-3">
                        {statCards.map((card) => (
                            <StatCard key={card.label} {...card} />
                        ))}
                    </div>
                </div>

                {/* Right: link card */}
                <div className="w-full lg:self-start">
                    <ReferralLinkCard
                        referralCode={referralCode}
                        referralUrl={referralUrl}
                        copyState={copyState}
                        onCopy={copy}
                    />
                </div>
            </div>

            {/* Pyramid */}
            <div
                role="list"
                aria-label="Referral pyramid levels"
                className="divide-y divide-slate-800/50"
            >
                {pyramidRows.map((row) => (
                    <div key={row.title} role="listitem">
                        <PyramidRow {...row} />
                    </div>
                ))}
            </div>
        </section>
    );
});

/* ─────────────────────────────────────────────────────────────────────────────
   ACTIVITY TABLE
   Fix: horizontal scroll wrapper ensures table never breaks the page layout.
   Added -webkit-overflow-scrolling for smooth momentum scroll on iOS.
   Min-width on the table so it's readable when scrolled horizontally.
───────────────────────────────────────────────────────────────────────────── */

function ActivityTable({ referrals }) {
    if (referrals.length === 0) {
        return (
            <div className="py-14 flex flex-col items-center gap-3 text-slate-500">
                <span aria-hidden="true"><IconUsers size={32} /></span>
                <p className="text-sm font-medium">No direct referrals yet</p>
                <p className="text-xs text-slate-600 text-center px-4">
                    Share your referral link to start building your team.
                </p>
            </div>
        );
    }

    return (
        /*
         * overflow-x-auto + -webkit-overflow-scrolling: touch gives iOS momentum
         * scrolling. The table itself has a min-width so it stays readable and
         * never forces the outer page to scroll.
         */
        <div
            className="overflow-x-auto rounded-2xl border border-slate-800"
            style={{ WebkitOverflowScrolling: "touch" }}
        >
            <table className="w-full border-collapse text-left text-sm" style={{ minWidth: 480 }}>
                <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60">
                        {["Referral", "Joined", "Invested", "Status"].map((col) => (
                            <th
                                key={col}
                                scope="col"
                                className="py-3 px-3 sm:px-5 text-[10px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {referrals.map((ref) => (
                        <tr
                            key={`${ref.username}-${ref.joinedAt}`}
                            className="border-b border-slate-800/60 last:border-0 transition-colors hover:bg-white/[0.025]"
                        >
                            <td className="py-3 px-3 sm:px-5 font-medium text-white whitespace-nowrap">
                                {ref.username}
                            </td>
                            <td className="py-3 px-3 sm:px-5 text-slate-400 whitespace-nowrap">
                                {new Date(ref.joinedAt).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </td>
                            <td className="py-3 px-3 sm:px-5 text-slate-100 tabular-nums whitespace-nowrap">
                                ${ref.investedAmount.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 sm:px-5">
                                <span
                                    className={[
                                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
                                        ref.isQualified
                                            ? "bg-emerald-500/15 text-emerald-300"
                                            : "bg-yellow-500/15 text-yellow-300",
                                    ].join(" ")}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${ref.isQualified ? "bg-emerald-400" : "bg-yellow-400"
                                            }`}
                                    />
                                    {ref.isQualified ? "Invested" : "Pending"}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────────────────────────────────────────────── */

function LoadingSkeleton() {
    return (
        <div
            aria-live="polite"
            aria-busy="true"
            aria-label="Loading team data"
            className="rounded-3xl bg-slate-900/80 p-6 sm:p-8 animate-pulse space-y-4 sm:space-y-5"
        >
            <div className="h-5 w-48 rounded-full bg-slate-700" />
            <div className="h-4 w-64 rounded-full bg-slate-800" />
            <div className="h-4 w-36 rounded-full bg-slate-800" />
            <div className="grid grid-cols-3 gap-3 pt-2">
                {[0, 1, 2].map((n) => (
                    <div key={n} className="h-16 sm:h-20 rounded-2xl bg-slate-800" />
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ERROR BANNER
───────────────────────────────────────────────────────────────────────────── */

function ErrorBanner({ message }) {
    return (
        <div
            role="alert"
            className="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 sm:p-6 text-red-200 shadow-xl"
        >
            <p className="font-semibold">Unable to load team data</p>
            <p className="mt-1.5 text-sm text-red-300/80 break-words">{message}</p>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE ROOT
   Fix: safe-area insets for notched / gesture-bar phones (iOS / Android).
   Reduced px padding on mobile from px-4 to px-3 so panels don't crowd edges.
───────────────────────────────────────────────────────────────────────────── */

export default function Team() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    const fetchTeamData = useCallback(async () => {
        if (!mountedRef.current) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/user/team", { cache: "no-store" });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Failed to load team data");
            if (mountedRef.current) setData(json.data);
        } catch (err) {
            if (mountedRef.current) setError(err?.message || "Unable to load team data");
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        fetchTeamData();

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchTeamData();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            mountedRef.current = false;
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [fetchTeamData]);

    return (
        /*
         * env(safe-area-inset-*): respects notch / home-indicator on iOS &
         * newer Android. px-3 on mobile, px-4 sm+, px-6 md+.
         * max-w-6xl centres content on wide screens.
         */
        <main
            className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-6 sm:py-12"
            style={{
                paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
                paddingRight: "max(0.75rem, env(safe-area-inset-right))",
                paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
        >
            <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">

                {/* Hero header */}
                <header
                    aria-labelledby="team-dashboard-heading"
                    className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/15 via-yellow-500/5 to-transparent p-5 sm:p-10 shadow-2xl"
                >
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-yellow-300 font-semibold">
                        Team Rewards
                    </p>
                    <h1
                        id="team-dashboard-heading"
                        className="mt-2 sm:mt-3 text-2xl sm:text-4xl font-extrabold text-white"
                    >
                        Team Dashboard
                    </h1>
                    <p className="mt-2 sm:mt-3 max-w-2xl text-[13px] sm:text-base text-gray-300 leading-relaxed">
                        Build your team, track first investments, and earn referral rewards automatically.
                    </p>
                </header>

                {loading && <LoadingSkeleton />}
                {!loading && error && <ErrorBanner message={error} />}

                {!loading && !error && data && (
                    <>
                        <ReferralNetwork data={data} />

                        <section
                            aria-labelledby="activity-heading"
                            className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4 sm:p-8 shadow-2xl"
                        >
                            <div className="mb-5 sm:mb-6">
                                <h2
                                    id="activity-heading"
                                    className="text-xl sm:text-2xl font-extrabold text-white"
                                >
                                    Direct Referral Activity
                                </h2>
                                <p className="mt-1.5 text-[13px] sm:text-sm text-slate-400">
                                    Each qualified referral earns you a reward automatically.
                                </p>
                            </div>

                            <ActivityTable referrals={data.directReferrals} />
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}