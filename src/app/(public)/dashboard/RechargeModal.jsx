"use client";

import React, {
    useCallback,
    useEffect,
    useRef,
    memo,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
const OPTIONS = Object.freeze([
    {
        id: "bep20",
        label: "BEP20-USDT",
        image: "/TRC.png",
        path: "/recharge/bep20",
    },
    {
        id: "trc20",
        label: "TRC20-USDT",
        image: "/TRC.png",
        path: "/recharge/trc20",
    },
]);


const OptionButton = memo(function OptionButton({ id, label, image, path, onNavigate }) {

    const handleClick = useCallback(() => {
        onNavigate(path);
    }, [onNavigate, path]); // both are stable refs → this is created once

    return (
        <button
            key={id}
            type="button"
            onClick={handleClick}
            aria-label={`Select ${label} recharge method`}
            className="w-full flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-yellow-50 active:bg-yellow-100 transition focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none"
        >
            <div className="flex items-center gap-3 min-w-0">
                <Image
                    src={image}
                    alt={`${label} network logo`}
                    width={28}
                    height={28}
                    loading="lazy"
                    className="object-contain flex-shrink-0"
                />
                <span className="font-semibold text-gray-900 truncate">
                    {label}
                </span>
            </div>

            {/* Decorative chevron — aria-hidden keeps it off the a11y tree */}
            <span aria-hidden="true" className="text-gray-400 text-xl select-none">
                ›
            </span>
        </button>
    );
});

// ── RechargeModal ─────────────────────────────────────────────────────────────
function RechargeModal({ onClose }) {
    const router = useRouter();
    const dialogRef = useRef(null);
    const handleNavigate = useCallback((path) => {
        onClose();
        router.push(path);
    }, [onClose, router]);

    // ── Escape key + focus trap + scroll lock ─────────────────────────────────
    useEffect(() => {
        // 1. Lock background scroll while modal is open (UX + a11y)
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // 2. Escape key closes the modal (WCAG 2.1.2 requirement)
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }

            // 3. Focus trap — keep Tab/Shift-Tab inside the dialog
            if (e.key !== "Tab") return;

            const dialog = dialogRef.current;
            if (!dialog) return;

            const focusable = dialog.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                // Shift+Tab: if on first element → wrap to last
                if (document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                }
            } else {
                // Tab: if on last element → wrap to first
                if (document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        // 4. Auto-focus the dialog on open (WCAG 2.4.3 focus order)
        dialogRef.current?.focus();

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]); // onClose is a stable useCallback ref from parent

    return (
        <>
            {/* Backdrop — aria-hidden so screen readers only see the dialog */}
            <div
                aria-hidden="true"
                onClick={onClose}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />

            {/* Dialog — sits above the backdrop in the stacking context */}
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6 pointer-events-none">
                <div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="recharge-title"
                    tabIndex={-1}  // makes the dialog focusable for auto-focus on open
                    className="bg-white text-black rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col pointer-events-auto focus:outline-none"
                >
                    {/* Header */}
                    <header className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-200">
                        <h2
                            id="recharge-title"
                            className="text-lg sm:text-xl font-extrabold"
                        >
                            Recharge
                        </h2>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close recharge modal"
                            className="text-gray-500 hover:text-black text-xl focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none rounded"
                        >
                            <span aria-hidden="true">✕</span>
                        </button>
                    </header>

                    {/* Options list */}
                    <section
                        aria-label="Recharge network options"
                        className="divide-y divide-dashed divide-gray-300 overflow-y-auto"
                    >
                        {OPTIONS.map((item) => (

                            <OptionButton
                                key={item.id}
                                id={item.id}
                                label={item.label}
                                image={item.image}
                                path={item.path}
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </section>
                </div>
            </div>
        </>
    );
}

export default memo(RechargeModal);