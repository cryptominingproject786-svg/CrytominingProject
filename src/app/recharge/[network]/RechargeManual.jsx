"use client";

import { useState, useRef, useCallback, useId, memo } from "react";
import Image from "next/image";
import Script from "next/script";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

// ── Lazy-load the modal so it's excluded from the initial JS bundle ────────
const ConfirmingRecharge = dynamic(() => import("./ConfirmingRecharge"), {
    ssr: false,
});

// ── Hoisted outside component — never re-created on renders ───────────────
const MIN_AMOUNT = 50;

// ── Structured data for SEO (WebPage schema) ──────────────────────────────
const STRUCTURED_DATA = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Confirm Recharge — USDT Deposit",
    description:
        "Submit your USDT deposit proof by uploading a payment slip and amount for fast confirmation.",
});

// ── Pure sub-component — avoids re-rendering the upload area on amount/txId change ──
const SlipUpload = memo(function SlipUpload({
    slip,
    submitting,
    onChange,
    labelId,
    hintId,
}) {
    return (
        <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label
                id={labelId}
                className="text-sm font-semibold text-slate-300"
            >
                Upload Recharge Slip
            </label>

            <label
                htmlFor="slip-upload"
                aria-labelledby={labelId}
                aria-describedby={hintId}
                className={[
                    "flex flex-col items-center justify-center",
                    "w-full min-h-[160px] sm:min-h-[180px]",
                    "border-2 border-dashed rounded-2xl cursor-pointer",
                    "transition-colors duration-200",
                    slip
                        ? "border-yellow-400/60 bg-yellow-400/5"
                        : "border-yellow-400/30 bg-black/40 hover:bg-black/60",
                    submitting ? "opacity-50 pointer-events-none" : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <input
                    id="slip-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    onChange={onChange}
                    className="sr-only"
                    aria-describedby={hintId}
                    disabled={submitting}
                />

                {slip ? (
                    <div className="flex flex-col items-center gap-2 px-4 text-center">
                        <svg
                            aria-hidden="true"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M5 13l4 4L19 7"
                                stroke="#facc15"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="text-sm text-yellow-400 font-medium break-all">
                            {slip.name}
                        </span>
                        <span id={hintId} className="text-xs text-slate-500">
                            Tap to change
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 px-4 text-center">
                        <svg
                            aria-hidden="true"
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12"
                                stroke="#facc15"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="text-sm text-slate-400">
                            Tap to upload slip image
                        </span>
                        <span id={hintId} className="text-xs text-slate-600">
                            JPG, PNG, WEBP accepted
                        </span>
                    </div>
                )}
            </label>
        </div>
    );
});

// ── Spinner icon — stable reference, never recreated ─────────────────────
const SpinnerIcon = (
    <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
    >
        <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="28 56"
            strokeLinecap="round"
        />
    </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function RechargeManual({ network }) {
    const { data: session } = useSession();

    // Stable, SSR-safe IDs — avoids hydration mismatch from Math.random()
    const amountId = useId();
    const errorId = useId();
    const slipLabelId = useId();
    const slipHintId = useId();

    const [form, setForm] = useState({ amount: "" });
    const [slip, setSlip] = useState(null);
    const [error, setError] = useState("");
    const submittingRef = useRef(false);
    const [submitting, setSubmitting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitted, setSubmitted] = useState({ amount: "", network: "" });

    // Derived — computed once, not on every keystroke
    const networkKey = network?.toUpperCase() ?? "";

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleAmountChange = useCallback((e) => {
        setForm((prev) => ({ ...prev, amount: e.target.value }));
    }, []);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files?.[0] ?? null;
        setSlip(file);
        setError("");
    }, []);

    const handleModalClose = useCallback(() => {
        setModalOpen(false);
        setForm({ amount: "" });
        setSlip(null);
        setError("");
    }, []);

    const handleBack = useCallback(() => {
        window.history.back();
    }, []);

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            setError("");

            if (submittingRef.current) return;

            const amount = form.amount.trim();

            // ── Validation ─────────────────────────────────────────────────
            if (!amount || Number(amount) < MIN_AMOUNT) {
                setError(`Amount must be at least ${MIN_AMOUNT} USDT.`);
                return;
            }
            if (!slip) {
                setError("Please upload a slip image.");
                return;
            }

            submittingRef.current = true;
            setSubmitting(true);

            try {
                const dataUrl = await new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.onload = () => resolve(fr.result);
                    fr.onerror = () => reject(new Error("File read failed"));
                    fr.readAsDataURL(slip);
                });

                const payload = {
                    network,
                    amount,
                    email: session?.user?.email ?? null,
                    userId: session?.user?.id ?? null,
                    name: session?.user?.name ?? null,
                    slip: {
                        filename: slip.name,
                        contentType: slip.type,
                        data: dataUrl,
                    },
                };

                const res = await fetch("/api/recharge", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const json = await res.json().catch(() => ({}));

                if (!res.ok) {
                    setError(json?.error || "Upload failed. Please try again.");
                    return;
                }

                setSubmitted({ amount, network });
                setModalOpen(true);
            } catch {
                setError(
                    "Network error. Please check your connection and try again."
                );
            } finally {
                submittingRef.current = false;
                setSubmitting(false);
            }
        },
        [form, slip, network, session]
    );

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            {/* JSON-LD structured data for SEO */}
            <Script
                id="recharge-schema"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }}
            />

            {/* Modal — only loaded when first opened (lazy) */}
            {modalOpen && (
                <ConfirmingRecharge
                    isOpen={modalOpen}
                    onClose={handleModalClose}
                    network={submitted.network}
                    amount={submitted.amount}
                />
            )}

            {/* ── Page ──────────────────────────────────────────────────── */}
            <main
                id="main-content"
                className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white"
            >
                {/* Skip-to-content for keyboard / screen-reader users */}
                <a
                    href="#recharge-form"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-yellow-400 focus:text-black focus:rounded-lg focus:font-bold"
                >
                    Skip to form
                </a>

                {/* Top Bar */}
                <header
                    role="banner"
                    className="w-full flex items-center justify-center relative px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10"
                >
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label="Go back to previous page"
                        className="
              absolute left-4 sm:left-6
              text-yellow-400 text-3xl font-bold
              w-10 h-10 flex items-center justify-center
              hover:scale-110 transition-transform
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400 focus-visible:rounded
            "
                    >
                        ‹
                    </button>
                    {/* h1 here so crawlers immediately identify the page topic */}
                    <h1 className="text-lg sm:text-2xl font-extrabold tracking-wide">
                        Confirm Recharge
                    </h1>
                </header>

                {/* Content */}
                <section
                    aria-label="Recharge deposit form"
                    className="w-full flex justify-center px-4 sm:px-6 lg:px-10 py-8 sm:py-10"
                >
                    <div className="w-full max-w-3xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12">

                        {/* Network Badge */}
                        <div
                            role="status"
                            aria-label={`Selected network: ${networkKey} USDT`}
                            className="flex justify-center mb-8"
                        >
                            <div className="flex items-center gap-3 bg-yellow-400/10 px-5 py-2 rounded-full border border-yellow-400/20">
                                <Image
                                    src="/TRC.png"
                                    alt={`${networkKey} network logo`}
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                    // priority — above the fold, contributes to LCP
                                    priority
                                    sizes="24px"
                                />
                                <span className="font-semibold text-yellow-400 uppercase text-sm sm:text-base">
                                    {networkKey}-USDT
                                </span>
                            </div>
                        </div>

                        {/* Form */}
                        <form
                            id="recharge-form"
                            onSubmit={handleSubmit}
                            noValidate
                            aria-label="Recharge proof submission"
                            aria-describedby={error ? errorId : undefined}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
                        >
                            {/* ── Amount ─────────────────────────────────── */}
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor={amountId}
                                    className="text-sm font-semibold text-slate-300"
                                >
                                    Recharge Amount{" "}
                                    <abbr title="Tether USD">USDT</abbr>
                                </label>
                                <input
                                    id={amountId}
                                    name="amount"
                                    type="number"
                                    inputMode="decimal"
                                    min={MIN_AMOUNT}
                                    step="any"
                                    required
                                    value={form.amount}
                                    onChange={handleAmountChange}
                                    placeholder={`Min. ${MIN_AMOUNT} USDT`}
                                    disabled={submitting}
                                    aria-required="true"
                                    aria-invalid={
                                        error.includes("Amount")
                                            ? "true"
                                            : undefined
                                    }
                                    aria-describedby={
                                        error.includes("Amount")
                                            ? errorId
                                            : undefined
                                    }
                                    className="
                    w-full rounded-xl px-4 py-3.5
                    bg-black/70 border border-white/10
                    focus:border-yellow-400 focus:outline-none
                    aria-[invalid=true]:border-red-500
                    text-white placeholder:text-slate-600
                    disabled:opacity-50
                    transition-colors
                  "
                                />
                            </div>


                            {/* ── Slip Upload ───────────────────────────── */}
                            <SlipUpload
                                slip={slip}
                                submitting={submitting}
                                onChange={handleFileChange}
                                labelId={slipLabelId}
                                hintId={slipHintId}
                            />

                            {/* ── Error region ──────────────────────────── */}
                            {/* aria-live so screen readers announce errors immediately */}
                            <div
                                id={errorId}
                                role="alert"
                                aria-live="assertive"
                                aria-atomic="true"
                                className="sm:col-span-2"
                            >
                                {error && (
                                    <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                                        <svg
                                            aria-hidden="true"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className="mt-0.5 shrink-0"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="9"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                            />
                                            <path
                                                d="M12 8v4M12 16h.01"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        {error}
                                    </div>
                                )}
                            </div>

                            {/* ── Submit ────────────────────────────────── */}
                            <div className="sm:col-span-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    aria-disabled={submitting}
                                    aria-busy={submitting}
                                    className="
                    w-full
                    bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500
                    disabled:opacity-60 disabled:cursor-not-allowed
                    text-black font-bold
                    py-4 rounded-xl text-base sm:text-lg
                    transition-colors duration-150
                    flex items-center justify-center gap-2
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400 focus-visible:outline-offset-2
                  "
                                >
                                    {submitting ? (
                                        <>{SpinnerIcon} Submitting…</>
                                    ) : (
                                        "Submit Recharge Proof"
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Tips */}
                        <aside
                            aria-label="Recharge instructions"
                            className="mt-8 bg-black/60 rounded-2xl p-4 sm:p-5 border border-yellow-400/20"
                        >
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                                Important
                            </p>
                            <ul className="space-y-1.5 text-sm text-slate-400 list-disc list-inside">
                                <li>
                                    Minimum recharge:{" "}
                                    <strong className="font-semibold text-white">
                                        {MIN_AMOUNT} USDT
                                    </strong>
                                </li>
                                <li>
                                    Only{" "}
                                    <strong className="text-yellow-400 font-semibold">
                                        {networkKey}
                                    </strong>{" "}
                                    transactions are accepted
                                </li>
                                <li>
                                    Upload your deposit slip and amount only — TXID is not required.
                                </li>
                                <li>
                                    Incorrect details may delay confirmation
                                </li>
                            </ul>
                        </aside>
                    </div>
                </section>
            </main>
        </>
    );
}