"use client";

/**
 * WithdrawDetailClient.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Withdraw detail / action page for admins.
 * • All logic preserved exactly — only UI improved
 * • memo + useCallback on every handler → zero unnecessary re-renders
 * • Semantic HTML + ARIA + Schema.org for SEO & accessibility
 * • Unified design language: matches adminclient + withdrawcard exactly
 */

import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    memo,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ── Static lookup tables (defined once, never re-created) ─────────────────────
const STATUS_CFG = {
    pending: { bar: "from-yellow-500 to-orange-400", badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Pending", icon: "⏳" },
    approved: { bar: "from-green-500  to-emerald-400", badge: "bg-green-500/20  text-green-400  border-green-500/30", label: "Approved", icon: "✅" },
    rejected: { bar: "from-red-500   to-rose-400", badge: "bg-red-500/20   text-red-400   border-red-500/30", label: "Rejected", icon: "❌" },
};

// ── InfoRow ───────────────────────────────────────────────────────────────────
const InfoRow = memo(function InfoRow({ label, value, mono, copy, accent }) {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef(null);

    const handleCopy = useCallback(() => {
        if (!value) return;
        navigator.clipboard.writeText(String(value)).catch(() => { });
        setCopied(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), 1800);
    }, [value]);

    // cleanup timer on unmount
    useEffect(() => () => clearTimeout(timerRef.current), []);

    return (
        <div className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold shrink-0 w-32 pt-0.5">
                {label}
            </span>
            <span className={`text-sm flex-1 text-right break-all leading-relaxed
                ${mono ? "font-mono text-xs text-gray-300" : ""}
                ${accent ? "text-yellow-400 font-bold" : "text-white"}`}
            >
                {value ?? "—"}
            </span>
            {copy && value && (
                <button
                    onClick={handleCopy}
                    aria-label={copied ? "Copied" : `Copy ${label}`}
                    className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-xl transition
                        ${copied
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20"
                        }`}
                >
                    {copied ? "✓ Done" : "COPY"}
                </button>
            )}
        </div>
    );
});

// ── SectionCard ───────────────────────────────────────────────────────────────
const SectionCard = memo(function SectionCard({ title, accent, children }) {
    const accentColor = accent === "green" ? "text-green-400  border-green-500/20"
        : accent === "red" ? "text-red-400    border-red-500/20"
            : accent === "yellow" ? "text-yellow-400 border-yellow-500/20"
                : "text-gray-300    border-white/10";
    return (
        <section className={`bg-gradient-to-tr from-gray-900 to-black border rounded-3xl overflow-hidden shadow-xl ${accentColor.split(" ")[1]}`}>
            <div className={`px-6 pt-5 pb-3 border-b border-white/5 flex items-center gap-2`}>
                <h2 className={`text-xs font-black uppercase tracking-widest ${accentColor.split(" ")[0]}`}>
                    {title}
                </h2>
            </div>
            <div className="px-6 pb-2">{children}</div>
        </section>
    );
});

// ── InvoiceUploader ───────────────────────────────────────────────────────────
const InvoiceUploader = memo(function InvoiceUploader({ onFileReady, disabled }) {
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState("");
    const inputRef = useRef(null);

    const handleChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Only image files are accepted (JPG, PNG, WEBP…)");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be under 5 MB");
            return;
        }

        setError("");
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result;
            setPreview(dataUrl);
            const match = typeof dataUrl === "string" && dataUrl.match(/^data:(.+);base64,(.+)$/);
            if (match) onFileReady({ data: match[2], contentType: match[1], filename: file.name });
        };
        reader.readAsDataURL(file);
    }, [onFileReady]);

    const clearFile = useCallback(() => {
        setPreview(null);
        onFileReady(null);
        if (inputRef.current) inputRef.current.value = "";
    }, [onFileReady]);

    return (
        <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                Admin Invoice Screenshot
                <span className="ml-2 normal-case tracking-normal text-gray-600 font-normal">(optional)</span>
            </p>

            {!preview ? (
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed
                    rounded-2xl p-8 cursor-pointer transition
                    ${disabled
                        ? "border-gray-800 opacity-40 cursor-not-allowed"
                        : "border-yellow-500/30 hover:border-yellow-400/60 hover:bg-yellow-400/3"
                    }`}
                >
                    <span className="text-3xl" aria-hidden="true">📎</span>
                    <span className="text-sm text-gray-400 font-medium">Click to upload or drag &amp; drop</span>
                    <span className="text-xs text-gray-600">JPG · PNG · WEBP · max 5 MB</span>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        disabled={disabled}
                        aria-label="Upload admin invoice"
                        className="sr-only"
                    />
                </label>
            ) : (
                <div className="relative rounded-2xl overflow-hidden border border-yellow-500/30 bg-black">
                    <img src={preview} alt="Invoice preview" className="w-full max-h-64 object-contain" />
                    <button
                        onClick={clearFile}
                        aria-label="Remove invoice"
                        className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white
                                   rounded-full w-7 h-7 flex items-center justify-center text-base transition border border-white/10"
                    >
                        ✕
                    </button>
                </div>
            )}

            {error && (
                <p role="alert" className="text-xs text-red-400 flex items-center gap-1.5">
                    <span aria-hidden="true">⚠</span> {error}
                </p>
            )}
        </div>
    );
});

// ── Avatar initials ───────────────────────────────────────────────────────────
const Avatar = memo(function Avatar({ name, email }) {
    const initials = ((name || email || "?")
        .split(/[\s@.]/).filter(Boolean).slice(0, 2)
        .map((s) => s[0].toUpperCase()).join(""));
    return (
        <div aria-hidden="true"
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500
                        flex items-center justify-center text-black font-black text-base
                        shadow-lg shadow-yellow-500/20 shrink-0">
            {initials}
        </div>
    );
});

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = memo(function Spinner({ size = "sm", color = "white" }) {
    const s = size === "sm" ? "w-4 h-4 border-2" : "w-6 h-6 border-2";
    const c = color === "yellow" ? "border-yellow-400/30 border-t-yellow-400" : "border-white/30 border-t-white";
    return <span className={`inline-block rounded-full animate-spin ${s} ${c}`} aria-hidden="true" />;
});

// ── WithdrawDetailClient ──────────────────────────────────────────────────────
export default function WithdrawDetailClient({ withdrawId }) {
    const router = useRouter();
    const { data: session, status: authStatus } = useSession();

    const [withdraw, setWithdraw] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [pendingInvoice, setPendingInvoice] = useState(null);

    // ── Fetch withdrawal ──────────────────────────────────────────────────────
    useEffect(() => {
        if (authStatus !== "authenticated") return;
        let canceled = false;

        (async () => {
            setLoading(true);
            setFetchError("");
            try {
                const res = await fetch(`/api/withdraw/admin/${withdrawId}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Failed to load withdrawal");
                if (!canceled) setWithdraw(json.data);
            } catch (e) {
                if (!canceled) setFetchError(e.message);
            } finally {
                if (!canceled) setLoading(false);
            }
        })();

        return () => { canceled = true; };
    }, [withdrawId, authStatus]);

    // ── Action handler ────────────────────────────────────────────────────────
    const handleAction = useCallback(async (newStatus) => {
        setActionError("");
        setSuccessMsg("");
        setActionLoading(true);
        try {
            const body = { status: newStatus };
            if (newStatus === "approved" && pendingInvoice) body.adminInvoice = pendingInvoice;

            const res = await fetch(`/api/withdraw/admin/${withdrawId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Action failed");

            setWithdraw(json.data);
            setSuccessMsg(newStatus === "approved"
                ? "Withdrawal approved — balance deducted from user."
                : "Withdrawal rejected."
            );
        } catch (e) {
            setActionError(e.message);
        } finally {
            setActionLoading(false);
        }
    }, [withdrawId, pendingInvoice]);

    const handleApprove = useCallback(() => handleAction("approved"), [handleAction]);
    const handleReject = useCallback(() => handleAction("rejected"), [handleAction]);
    const goBack = useCallback(() => router.back(), [router]);

    // ── Auth guards ───────────────────────────────────────────────────────────
    const isAuthLoading = authStatus === "loading";
    const isUnauth = authStatus !== "authenticated" || session?.user?.role !== "admin";

    if (isAuthLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center gap-3 text-yellow-400 font-bold">
            <Spinner color="yellow" /> Loading…
        </div>
    );

    if (isUnauth) return (
        <div role="alert"
            className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center text-red-400 font-bold">
            Unauthorized
        </div>
    );

    const cfg = STATUS_CFG[withdraw?.status] ?? STATUS_CFG.pending;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <main
            aria-label="Withdraw Request Detail"
            itemScope
            itemType="https://schema.org/WebPage"
            className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white px-4 py-10"
        >
            <div className="max-w-2xl mx-auto space-y-6">

                {/* ── Back ── */}
                <button
                    onClick={goBack}
                    aria-label="Go back"
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-yellow-400 transition font-medium"
                >
                    ← Back
                </button>

                {/* ── Page header ── */}
                <header>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-400 tracking-tight">
                        Withdrawal Request
                    </h1>
                    <p className="text-xs text-gray-600 font-mono mt-1 break-all">ID: {withdrawId}</p>
                </header>

                {/* ── Loading ── */}
                {loading && (
                    <div role="status" className="flex items-center gap-3 text-gray-400 animate-pulse py-6">
                        <Spinner color="yellow" /> Loading withdrawal details…
                    </div>
                )}

                {/* ── Fetch error ── */}
                {fetchError && (
                    <div role="alert"
                        className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        <span className="text-xl" aria-hidden="true">⚠</span>
                        {fetchError}
                    </div>
                )}

                {/* ── Main content ── */}
                {!loading && withdraw && (() => {
                    const username = withdraw.user?.username;
                    const email = withdraw.user?.email;
                    return (
                        <>
                            {/* Status + user identity hero */}
                            <div className="bg-gradient-to-tr from-gray-900 to-black border border-yellow-500/20
                                            rounded-3xl overflow-hidden shadow-xl">
                                {/* Accent bar */}
                                <div className={`h-[3px] bg-gradient-to-r ${cfg.bar}`} aria-hidden="true" />
                                <div className="p-6 flex items-center gap-4">
                                    {withdraw.user && <Avatar name={username} email={email} />}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-lg truncate leading-tight">
                                            {username || "Unknown user"}
                                        </p>
                                        <p className="text-gray-500 text-sm truncate">{email || "No email"}</p>
                                    </div>
                                    <span
                                        aria-label={`Status: ${cfg.label}`}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border shrink-0 ${cfg.badge}`}
                                    >
                                        <span aria-hidden="true">{cfg.icon}</span>
                                        {cfg.label}
                                    </span>
                                </div>
                            </div>

                            {/* Withdraw details */}
                            <SectionCard title="Withdrawal Details" accent="yellow">
                                <InfoRow label="Network" value={withdraw.network} />
                                <InfoRow label="Amount" value={`${withdraw.amount} USDT`} accent />
                                <InfoRow label="TXID" value={withdraw.txId} mono copy />
                                <InfoRow
                                    label="Requested"
                                    value={withdraw.requestedAt
                                        ? new Date(withdraw.requestedAt).toLocaleString()
                                        : null}
                                />
                                {withdraw.processedAt && (
                                    <InfoRow
                                        label="Processed"
                                        value={new Date(withdraw.processedAt).toLocaleString()}
                                    />
                                )}
                            </SectionCard>

                            {/* User info */}
                            {withdraw.user && (
                                <SectionCard title="User Details" accent="yellow">
                                    <InfoRow label="Username" value={username} />
                                    <InfoRow label="Email" value={email} />
                                    <InfoRow
                                        label="Balance"
                                        value={`$${Number(withdraw.user.balance ?? 0).toFixed(2)}`}
                                        accent
                                    />
                                    <InfoRow
                                        label="Invested"
                                        value={`$${Number(withdraw.user.investedAmount ?? 0).toFixed(2)}`}
                                    />
                                </SectionCard>
                            )}

                            {/* Existing admin invoice */}
                            {withdraw.adminInvoice && (
                                <SectionCard title="Admin Invoice" accent="green">
                                    <div className="py-3">
                                        <img
                                            src={withdraw.adminInvoice}
                                            alt="Admin invoice"
                                            className="w-full rounded-2xl border border-white/10 object-contain max-h-80"
                                        />
                                    </div>
                                </SectionCard>
                            )}

                            {/* Success message */}
                            {successMsg && (
                                <div
                                    role="status"
                                    className="flex items-center gap-3 p-4 rounded-2xl
                                               bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium"
                                >
                                    <span className="text-lg" aria-hidden="true">✅</span>
                                    {successMsg}
                                </div>
                            )}

                            {/* Action error */}
                            {actionError && (
                                <div
                                    role="alert"
                                    className="flex items-center gap-3 p-4 rounded-2xl
                                               bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                                >
                                    <span className="text-lg" aria-hidden="true">⚠</span>
                                    {actionError}
                                </div>
                            )}

                            {/* Action panel — pending only */}
                            {withdraw.status === "pending" && (
                                <SectionCard title="Admin Action" accent="yellow">
                                    <div className="py-4 space-y-5">

                                        {/* Invoice uploader */}
                                        <InvoiceUploader
                                            onFileReady={setPendingInvoice}
                                            disabled={actionLoading}
                                        />

                                        {/* Warning note */}
                                        <p className="text-xs text-gray-500 bg-yellow-400/5 border border-yellow-400/10 rounded-2xl p-4 leading-relaxed">
                                            ℹ Approving will immediately deduct{" "}
                                            <strong className="text-yellow-400">{withdraw.amount} USDT</strong>{" "}
                                            from the user's balance. This action cannot be undone.
                                        </p>

                                        {/* Approve / Reject */}
                                        <div className="flex gap-3">
                                            <button
                                                disabled={actionLoading}
                                                onClick={handleApprove}
                                                aria-label="Approve withdrawal"
                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl
                                                           font-bold text-sm bg-green-500 hover:bg-green-400 text-white
                                                           transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading ? <Spinner /> : <span aria-hidden="true">✅</span>}
                                                Approve
                                            </button>
                                            <button
                                                disabled={actionLoading}
                                                onClick={handleReject}
                                                aria-label="Reject withdrawal"
                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl
                                                           font-bold text-sm bg-red-500 hover:bg-red-400 text-white
                                                           transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading ? <Spinner /> : <span aria-hidden="true">❌</span>}
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </SectionCard>
                            )}
                        </>
                    );
                })()}
            </div>
        </main>
    );
}