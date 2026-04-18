"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { closePurchaseModal } from "../../../Redux/Slices/MiningSlice";
import { useState, useMemo, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────
   Pure utility functions — module-level, zero re-render cost
───────────────────────────────────────────────────────────── */
const CYCLE_MONTHLY_ROR = Object.freeze({
    1: 0.70, 7: 0.75, 15: 0.80,
    21: 0.85, 28: 0.95, 37: 1.00, 50: 1.20,
});

function parseReturnRate(returnRate) {
    if (!returnRate) return NaN;
    return parseFloat(String(returnRate).replace(/%/g, ""));
}

function parsePriceRange(priceStr) {
    if (!priceStr) return [0, 0];
    const normalized = String(priceStr)
        .replace(/USDT/gi, "")
        .replace(/,/g, "")
        .trim();
    const parts = normalized.split("~").map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return [0, 0];
    if (parts.length === 1) {
        const v = parseFloat(parts[0]);
        return [isNaN(v) ? 0 : v, isNaN(v) ? 0 : v];
    }
    const min = parseFloat(parts[0]);
    const max = parseFloat(parts[1]);
    return [isNaN(min) ? 0 : min, isNaN(max) ? (isNaN(min) ? 0 : min) : max];
}

function parseCycleDays(cycleStr) {
    if (!cycleStr) return 1;
    if (cycleStr.toLowerCase().includes("daily")) return 1;
    const match = cycleStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
}

function getMonthlyRoR(cycleDays) {
    if (CYCLE_MONTHLY_ROR[cycleDays] !== undefined) return CYCLE_MONTHLY_ROR[cycleDays];
    const keys = Object.keys(CYCLE_MONTHLY_ROR).map(Number);
    return CYCLE_MONTHLY_ROR[
        keys.reduce((prev, curr) =>
            Math.abs(curr - cycleDays) < Math.abs(prev - cycleDays) ? curr : prev
        )
    ];
}

const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/* ─────────────────────────────────────────────────────────────
   InfoRow — single key/value row in the summary panel
───────────────────────────────────────────────────────────── */
function InfoRow({ label, value, valueClass = "text-white", border = false }) {
    return (
        <div
            className={`flex items-center justify-between gap-4 py-2.5 ${border ? "border-t border-white/10 mt-1 pt-3.5" : ""
                }`}
        >
            <span className="text-sm text-slate-400 leading-snug">{label}</span>
            <span className={`text-sm font-semibold tabular-nums text-right ${valueClass}`}>
                {value}
            </span>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   AlertBox — lock period / maturity notice
───────────────────────────────────────────────────────────── */
function AlertBox({ type, children }) {
    const styles = {
        warning: "bg-yellow-400/8 border-yellow-400/20 text-yellow-200",
        success: "bg-emerald-500/8 border-emerald-500/20 text-emerald-300",
    };
    const icons = {
        warning: (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        success: (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    };
    return (
        <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${styles[type]}`}>
            {icons[type]}
            <span>{children}</span>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   InvestModal — main export
   All hooks are called unconditionally; early return is AFTER hooks.
───────────────────────────────────────────────────────────── */
export default function InvestModal() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { selectedMiner, isModalOpen } = useSelector((s) => s.mining);

    const [amount, setAmount] = useState("");
    const [balance, setBalance] = useState(null);
    const [balanceError, setBalanceError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [investmentMessage, setInvestmentMessage] = useState(null);
    const [liveProfit, setLiveProfit] = useState(null);

    /* ── Fetch wallet balance when modal opens ─────────────────── */
    useEffect(() => {
        if (!isModalOpen) return;
        setBalance(null);
        setBalanceError(false);
        setAmount("");
        setIsLoading(false);
        setInvestmentMessage(null);

        (async () => {
            try {
                const res = await fetch("/api/user/me", { method: "GET", credentials: "include", cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setBalance(json.data?.balance ?? 0);
            } catch (err) {
                console.error("InvestModal: balance fetch failed", err);
                setBalanceError(true);
                setBalance(0);
            }
        })();
    }, [isModalOpen]);

    /* ── Live profit polling — 1 s interval ───────────────────── */
    useEffect(() => {
        if (!isModalOpen) return;
        const id = setInterval(async () => {
            try {
                const res = await fetch("/api/invest/profit");
                if (!res.ok) return;
                const data = await res.json();
                setLiveProfit(data.totalLiveProfit ?? 0);
            } catch (err) {
                console.error("Profit fetch error", err);
            }
        }, 1000);
        return () => clearInterval(id);
    }, [isModalOpen]);

    /* ── Derived values (all memoised) ────────────────────────── */
    const [minAmount, maxAmount] = useMemo(
        () => (selectedMiner ? parsePriceRange(selectedMiner.price) : [0, 0]),
        [selectedMiner]
    );

    const cycleDays = useMemo(
        () => (selectedMiner ? parseCycleDays(selectedMiner.cycle) : 1),
        [selectedMiner]
    );

    const dailyRate = useMemo(() => {
        const parsed = parseReturnRate(selectedMiner?.returnRate);
        return !isNaN(parsed) ? parsed / 100 : getMonthlyRoR(cycleDays) / 30;
    }, [selectedMiner, cycleDays]);

    const monthlyRoR = useMemo(() => {
        const parsed = parseReturnRate(selectedMiner?.returnRate);
        return !isNaN(parsed) ? (parsed / 100) * 30 : getMonthlyRoR(cycleDays);
    }, [selectedMiner, cycleDays]);

    const dailyProfit = useMemo(() => {
        const p = parseFloat(amount);
        return !p || isNaN(p) ? 0 : roundMoney(p * dailyRate);
    }, [amount, dailyRate]);

    const totalProfit = useMemo(() => roundMoney(dailyProfit * cycleDays), [dailyProfit, cycleDays]);

    const totalReturn = useMemo(() => {
        const p = parseFloat(amount) || 0;
        return roundMoney(p + totalProfit);
    }, [amount, totalProfit]);

    /* ── Stable close handler ──────────────────────────────────── */
    const handleClose = useCallback(() => dispatch(closePurchaseModal()), [dispatch]);

    /* ── Keyboard: Escape closes modal ────────────────────────── */
    useEffect(() => {
        if (!isModalOpen) return;
        const onKey = (e) => { if (e.key === "Escape") handleClose(); };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [isModalOpen, handleClose]);

    /* ── Early return AFTER all hooks ─────────────────────────── */
    if (!isModalOpen || !selectedMiner) return null;

    const displayRoR = (monthlyRoR * 100).toFixed(0);
    const amountNum = parseFloat(amount) || 0;
    const canSubmit = !isLoading && amountNum > 0;

    /* ── Submit handler ────────────────────────────────────────── */
    const handleStartInvestment = async () => {
        try {
            setIsLoading(true);
            setInvestmentMessage(null);

            const numAmount = parseFloat(amount);

            if (isNaN(numAmount) || numAmount <= 0) {
                setInvestmentMessage({ type: "error", text: "Please enter a valid investment amount." });
                return;
            }
            if (numAmount < minAmount) {
                setInvestmentMessage({ type: "error", text: `Minimum investment is $${minAmount}.` });
                return;
            }
            if (numAmount > maxAmount) {
                setInvestmentMessage({ type: "error", text: `Maximum investment is $${maxAmount}.` });
                return;
            }
            if (balance !== null && numAmount > balance) {
                setInvestmentMessage({
                    type: "error",
                    text: `Insufficient balance. Available: $${Number(balance).toFixed(2)}`,
                });
                return;
            }

            const res = await fetch("/api/invest", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    minerName: selectedMiner.name,
                    amount: numAmount,
                    investmentCycle: cycleDays,
                    monthlyRoR,
                    dailyProfit: Number(dailyProfit.toFixed(2)),
                    totalProfit: Number(totalProfit.toFixed(2)),
                    totalReturn: Number(totalReturn.toFixed(2)),
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setInvestmentMessage({ type: "error", text: json.error || "Investment failed." });
                return;
            }

            const newBalance =
                typeof json.data?.newBalance === "number" ? json.data.newBalance : balance;
            setBalance(newBalance);

            setInvestmentMessage({
                type: "success",
                text: `Investment of $${numAmount.toFixed(2)} created! Remaining balance: $${Number(newBalance).toFixed(2)}`,
            });

            setAmount("");
            window.dispatchEvent(new Event("investmentSuccess"));
            dispatch(closePurchaseModal());
            router.push("/dashboard");
        } catch (err) {
            console.error("Investment error:", err);
            setInvestmentMessage({ type: "error", text: "Failed to create investment. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    /* ── Render ────────────────────────────────────────────────── */
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invest-modal-title"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />

            {/* Panel — slides up on mobile, centred on sm+ */}
            <div
                className="
          relative z-10 w-full sm:max-w-lg
          max-h-[95dvh] sm:max-h-[90vh]
          overflow-y-auto overscroll-contain
          bg-[#0f172a]
          border border-white/10
          rounded-t-3xl sm:rounded-3xl
          shadow-2xl shadow-black/60
        "
            >
                {/* ── Drag handle (mobile) ───────────────────────────── */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4 bg-[#0f172a] border-b border-white/10">
                    <div className="flex items-center gap-3">
                        {/* Miner thumbnail */}
                        <div className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0">
                            <Image
                                src={selectedMiner.image}
                                alt={selectedMiner.name}
                                fill
                                sizes="40px"
                                className="object-contain p-1"
                            />
                        </div>
                        <div>
                            <h2
                                id="invest-modal-title"
                                className="text-sm sm:text-base font-extrabold text-white leading-tight line-clamp-1"
                            >
                                {selectedMiner.name}
                            </h2>
                            <p className="text-xs text-emerald-400 font-semibold">
                                {displayRoR}% Monthly Return
                            </p>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close investment modal"
                        className="
              flex items-center justify-center
              w-8 h-8 rounded-full
              border border-white/10 bg-white/5
              text-slate-400 hover:text-white hover:border-white/20
              transition-colors
            "
                    >
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* ── Scrollable body ────────────────────────────────── */}
                <div className="px-5 sm:px-6 py-5 space-y-5">

                    {/* Live profit ticker (when active) */}
                    {liveProfit !== null && liveProfit > 0 && (
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3">
                            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                                Live Profit
                            </span>
                            <span className="text-emerald-400 font-extrabold tabular-nums text-sm">
                                +${liveProfit.toFixed(4)} USDT
                            </span>
                        </div>
                    )}

                    {/* ── Price range banner ─────────────────────────────── */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between">
                        <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                            Amount Range
                        </span>
                        <span className="text-white font-bold tabular-nums text-sm">
                            ${minAmount.toLocaleString()} – ${maxAmount.toLocaleString()} USDT
                        </span>
                    </div>

                    {/* ── Amount input ────────────────────────────────────── */}
                    <div className="space-y-2">
                        <label
                            htmlFor="invest-amount"
                            className="text-sm font-semibold text-slate-300"
                        >
                            Investment Amount
                        </label>

                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">
                                $
                            </span>
                            <input
                                id="invest-amount"
                                type="number"
                                inputMode="decimal"
                                min={minAmount}
                                max={balance ?? maxAmount}
                                step="any"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    setInvestmentMessage(null);
                                }}
                                placeholder={`${minAmount} – ${maxAmount}`}
                                disabled={isLoading}
                                className="
                  w-full rounded-xl
                  bg-white/5 border border-white/10
                  hover:border-yellow-400/30
                  focus:border-yellow-400 focus:outline-none
                  text-white placeholder:text-slate-600
                  pl-8 pr-16 py-3.5
                  text-sm sm:text-base tabular-nums
                  disabled:opacity-50
                  transition-colors
                "
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                                USDT
                            </span>
                        </div>

                        {/* Available balance */}
                        <p className="text-xs text-slate-500 flex items-center justify-between">
                            <span>Available balance</span>
                            {balance === null ? (
                                <span className="text-slate-600">Loading…</span>
                            ) : balanceError ? (
                                <span className="text-red-400">Unavailable</span>
                            ) : (
                                <span className="text-yellow-400 font-semibold">
                                    ${Number(balance).toFixed(2)} USDT
                                </span>
                            )}
                        </p>
                    </div>

                    {/* ── Summary panel ──────────────────────────────────── */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-1 divide-y divide-white/5">
                        <InfoRow
                            label="Investment cycle"
                            value={`${cycleDays} ${cycleDays === 1 ? "Day (Daily)" : "Days"}`}
                            valueClass="text-yellow-400"
                        />
                        <InfoRow
                            label="Monthly RoR"
                            value={`${displayRoR}%`}
                            valueClass="text-emerald-400"
                        />
                        <InfoRow
                            label="Daily profit rate"
                            value={`${(dailyRate * 100).toFixed(4)}%`}
                            valueClass="text-emerald-400"
                        />
                        <InfoRow
                            label="Daily profit"
                            value={`$${dailyProfit.toFixed(2)}`}
                            valueClass="text-white"
                        />
                        <InfoRow
                            label="Total profit"
                            value={`$${totalProfit.toFixed(2)}`}
                            valueClass="text-emerald-400"
                        />
                        <InfoRow
                            label="Total investments"
                            value="Unlimited"
                            valueClass="text-slate-300"
                        />
                        <InfoRow
                            label="Total return (Principal + Profit)"
                            value={`$${totalReturn.toFixed(2)}`}
                            valueClass="text-yellow-400 text-base"
                            border
                        />
                    </div>

                    {/* ── Lock period + maturity notices ─────────────────── */}
                    <div className="space-y-2.5">
                        <AlertBox type="warning">
                            <strong>Lock Period:</strong> Your ${amountNum || 0} will be locked
                            for {cycleDays} {cycleDays === 1 ? "day" : "days"}. You cannot
                            reinvest or withdraw during this period.
                        </AlertBox>
                        <AlertBox type="success">
                            <strong>Maturity:</strong> After {cycleDays}{" "}
                            {cycleDays === 1 ? "day" : "days"}, your principal ($
                            {amountNum || 0}) plus total profit (${totalProfit.toFixed(2)})
                            will be automatically returned to your wallet.
                        </AlertBox>
                    </div>

                    {/* ── Feedback message ───────────────────────────────── */}
                    {investmentMessage && (
                        <div
                            role="alert"
                            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${investmentMessage.type === "success"
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                }`}
                        >
                            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5">
                                {investmentMessage.type === "success" ? (
                                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                ) : (
                                    <>
                                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                                        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </>
                                )}
                            </svg>
                            {investmentMessage.text}
                        </div>
                    )}

                    {/* ── CTA ─────────────────────────────────────────────── */}
                    <button
                        type="button"
                        onClick={handleStartInvestment}
                        disabled={!canSubmit}
                        aria-disabled={!canSubmit}
                        className="
              w-full
              bg-yellow-400 hover:bg-yellow-300
              active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              text-black font-extrabold
              py-4 rounded-2xl
              text-base sm:text-lg
              shadow-lg shadow-yellow-400/20
              hover:shadow-yellow-400/40
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-yellow-400
              focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]
              transition-all duration-200
              flex items-center justify-center gap-2
            "
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    aria-hidden="true"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="animate-spin"
                                >
                                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="28 56" strokeLinecap="round" />
                                </svg>
                                Processing…
                            </>
                        ) : (
                            "Start Investment"
                        )}
                    </button>

                    {/* Safe-area spacer for iOS home indicator */}
                    <div className="h-safe-area-inset-bottom sm:hidden" aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}