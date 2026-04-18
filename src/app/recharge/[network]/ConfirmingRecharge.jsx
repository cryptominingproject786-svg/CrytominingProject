"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";

/**
 * ConfirmingRecharge
 * ------------------
 * Success modal shown after a recharge proof is submitted.
 *
 * Props:
 *  - isOpen     {boolean}  Controls visibility
 *  - onClose    {function} Called when user dismisses to submit another
 *  - network    {string}   e.g. "TRC20"
 *  - amount     {string}   The submitted USDT amount
 */
export default function ConfirmingRecharge({ isOpen, onClose, network, amount }) {
    // Close on Escape key — accessibility best practice
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Escape") onClose?.();
        },
        [onClose]
    );

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener("keydown", handleKeyDown);
        // Lock body scroll while modal is open
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = prev;
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rcm-title"
            aria-describedby="rcm-desc"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
            style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
        >
            {/* Backdrop — clicking it does NOT close (intentional: user must choose an action) */}
            <div className="absolute inset-0" aria-hidden="true" />

            {/* Modal panel */}
            <div
                className="
          relative w-full max-w-md
          bg-[#0f172a] text-white
          border border-yellow-400/20
          rounded-2xl
          px-6 py-8 sm:px-8
          text-center
          animate-[fadeSlideUp_0.2s_ease-out]
        "
            >
                {/* Success icon */}
                <div
                    aria-hidden="true"
                    className="
            mx-auto mb-5 flex items-center justify-center
            w-16 h-16 rounded-full
            bg-yellow-400/10 border-2 border-yellow-400/40
          "
                >
                    <svg
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M5 13l4 4L19 7"
                            stroke="#facc15"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                {/* Status badge */}
                <span
                    className="
            inline-block mb-4
            bg-yellow-400/10 border border-yellow-400/30
            text-yellow-400 text-xs font-semibold tracking-widest uppercase
            px-3 py-1 rounded-full
          "
                >
                    Submitted
                </span>

                <h2
                    id="rcm-title"
                    className="text-xl sm:text-2xl font-extrabold text-white mb-3"
                >
                    Request Submitted!
                </h2>

                <p
                    id="rcm-desc"
                    className="text-slate-400 text-sm sm:text-base leading-relaxed mb-5"
                >
                    Your deposit request for{" "}
                    <span className="text-yellow-400 font-semibold">
                        {amount} USDT
                    </span>{" "}
                    via{" "}
                    <span className="text-yellow-400 font-semibold">
                        {network?.toUpperCase()}
                    </span>{" "}
                    has been submitted successfully. Upon approval, the balance will be
                    added to your account shortly.
                </p>

                {/* Info box */}
                <div
                    className="
            mb-6 text-left
            bg-yellow-400/5 border border-yellow-400/15
            rounded-xl px-4 py-3
          "
                >
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest mb-1">
                        What happens next?
                    </p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Our team will review your proof within 1–24 hours and credit
                        your account automatically.
                    </p>
                </div>

                {/* CTA — go to dashboard */}
                <Link
                    href="/dashboard"
                    className="
            block w-full
            bg-yellow-400 hover:bg-yellow-300
            text-black font-bold text-base
            py-3.5 rounded-xl
            transition-colors duration-150
            mb-3
          "
                >
                    Go to Dashboard
                </Link>

                {/* Secondary — submit another */}
                <button
                    type="button"
                    onClick={onClose}
                    className="
            block w-full
            bg-transparent hover:bg-white/5
            border border-white/10
            text-slate-400 hover:text-white
            text-sm font-medium
            py-3 rounded-xl
            transition-colors duration-150
          "
                >
                    Submit Another Request
                </button>
            </div>
        </div>
    );
}