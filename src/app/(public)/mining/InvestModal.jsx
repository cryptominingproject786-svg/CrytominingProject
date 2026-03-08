"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { closePurchaseModal } from "../../../Redux/Slices/MiningSlice";
import { useState, useMemo, useEffect } from "react";

const CYCLE_MONTHLY_ROR = {
    1: 0.70,
    7: 0.75,
    15: 0.80,
    21: 0.85,
    28: 0.95,
    37: 1.00,
    50: 1.20,
};

function parseCycleDays(cycleStr) {
    if (!cycleStr) return 1;
    if (cycleStr.toLowerCase().includes("daily")) return 1;
    const match = cycleStr.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
}

function getMonthlyRoR(cycleDays) {
    if (CYCLE_MONTHLY_ROR[cycleDays] !== undefined) return CYCLE_MONTHLY_ROR[cycleDays];
    const keys = Object.keys(CYCLE_MONTHLY_ROR).map(Number);
    const closest = keys.reduce((prev, curr) =>
        Math.abs(curr - cycleDays) < Math.abs(prev - cycleDays) ? curr : prev
    );
    return CYCLE_MONTHLY_ROR[closest];
}

export default function InvestModal() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { selectedMiner, isModalOpen } = useSelector((state) => state.mining);

    const [amount, setAmount] = useState("");
    const [balance, setBalance] = useState(null);
    const [balanceError, setBalanceError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [investmentMessage, setInvestmentMessage] = useState(null);

    // ── ALL hooks before any early return ──

    useEffect(() => {
        if (!isModalOpen) return;

        setBalance(null);
        setBalanceError(false);
        setAmount("");
        setIsLoading(false);
        setInvestmentMessage(null);

        const fetchBalance = async () => {
            try {
                const res = await fetch("/api/user/me");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                // ✅ Use the real wallet balance — this is what gets deducted on investment
                setBalance(json.data?.balance ?? 0);
            } catch (err) {
                console.error("InvestModal: could not load balance", err);
                setBalanceError(true);
                setBalance(0);
            }
        };

        fetchBalance();
    }, [isModalOpen]);

    const minAmount = useMemo(() => {
        if (!selectedMiner) return 0;
        return parseFloat(
            selectedMiner.price.replace(/USDT/gi, "").replace(/,/g, "").split("~")[0].trim()
        );
    }, [selectedMiner]);

    const maxAmount = useMemo(() => {
        if (!selectedMiner) return 0;
        return parseFloat(
            selectedMiner.price.replace(/USDT/gi, "").replace(/,/g, "").split("~")[1].trim()
        );
    }, [selectedMiner]);

    const cycleDays = useMemo(() => {
        if (!selectedMiner) return 1;
        return parseCycleDays(selectedMiner.cycle);
    }, [selectedMiner]);

    const monthlyRoR = useMemo(() => getMonthlyRoR(cycleDays), [cycleDays]);
    const dailyRate = useMemo(() => monthlyRoR / 30, [monthlyRoR]);

    const dailyProfit = useMemo(() => {
        const p = parseFloat(amount);
        if (!p || isNaN(p)) return 0;
        return p * dailyRate;
    }, [amount, dailyRate]);

    const totalProfit = useMemo(() => dailyProfit * cycleDays, [dailyProfit, cycleDays]);

    const totalReturn = useMemo(() => {
        const p = parseFloat(amount) || 0;
        return p + totalProfit;
    }, [amount, totalProfit]);

    // ── Early return AFTER all hooks ──
    if (!isModalOpen || !selectedMiner) return null;

    const displayRoR = (monthlyRoR * 100).toFixed(0);

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

            // ✅ Update modal balance with the new balance returned from API
            const newBalance = json.data?.newBalance ?? (balance - numAmount);
            setBalance(newBalance);

            setInvestmentMessage({
                type: "success",
                text: `Investment of $${numAmount.toFixed(2)} created! Remaining balance: $${Number(newBalance).toFixed(2)}`,
            });

            setAmount("");

            // ✅ Fire custom event → UserData listens and re-fetches its balance
            window.dispatchEvent(new Event("investmentSuccess"));

            // Close modal and go to dashboard after 2s
            setTimeout(() => {
                dispatch(closePurchaseModal());
                router.push("/dashboard");
            }, 2000);

        } catch (err) {
            console.error("Investment error:", err);
            setInvestmentMessage({ type: "error", text: "Failed to create investment. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    /* ------------------ UI ------------------ */
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#6d028d] to-[#4a0066] p-4 text-white relative">

                <button
                    onClick={() => dispatch(closePurchaseModal())}
                    className="absolute right-4 top-4 text-xl"
                    aria-label="Close modal"
                >✕</button>

                {/* Image */}
                <div className="flex justify-center mb-4">
                    <div className="w-32 h-32 relative bg-white rounded-xl p-2">
                        <Image src={selectedMiner.image} alt={selectedMiner.name} fill className="object-contain" />
                    </div>
                </div>

                <h2 className="text-lg font-semibold mb-1 text-center">{selectedMiner.name}</h2>
                <p className="text-center text-green-400 font-bold text-sm mb-4">
                    {displayRoR}% Monthly Rate of Return
                </p>

                {/* Price Range */}
                <div className="mb-4">
                    <p className="text-sm opacity-80">Purchase amount range</p>
                    <div className="bg-purple-900 rounded-lg p-3 mt-1">
                        ${minAmount.toLocaleString()} ~ ${maxAmount.toLocaleString()} USDT
                    </div>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                    <label className="text-sm opacity-80">Enter Amount</label>
                    <input
                        type="number"
                        min={minAmount}
                        max={balance ?? maxAmount}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Min $${minAmount} – Max $${maxAmount}`}
                        className="w-full mt-1 rounded-lg bg-purple-900 px-4 py-3 outline-none"
                    />

                    {/* ✅ Real wallet balance — same source as UserData */}
                    <p className="text-xs mt-1 opacity-70">
                        Available Balance:{" "}
                        {balance === null ? (
                            <span className="opacity-50">Loading…</span>
                        ) : balanceError ? (
                            <span className="text-red-400">Unavailable</span>
                        ) : (
                            <span className="text-yellow-300 font-semibold">
                                ${Number(balance).toFixed(2)} USDT
                            </span>
                        )}
                    </p>
                </div>

                {/* Info Panel */}
                <div className="bg-purple-900 rounded-xl p-4 text-sm space-y-2 mb-5">
                    <div className="flex justify-between">
                        <span>Investment cycle</span>
                        <span>{cycleDays} {cycleDays === 1 ? "Day (Daily)" : "Days"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Monthly RoR</span>
                        <span className="text-green-400 font-semibold">{displayRoR}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Daily profit rate</span>
                        <span className="text-green-400">{(dailyRate * 100).toFixed(4)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Daily profit</span>
                        <span>${dailyProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Total profit</span>
                        <span>${totalProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-yellow-300 font-semibold border-t border-purple-700 pt-2">
                        <span>Total return (Principal + Profit)</span>
                        <span>${totalReturn.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Total investments</span>
                        <span>Unlimited</span>
                    </div>
                    <div className="text-xs opacity-80 pt-2">
                        Interest is returned daily and the principal is repaid upon maturity
                    </div>
                </div>

                {/* Message */}
                {investmentMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${investmentMessage.type === "success"
                            ? "bg-green-900/50 text-green-300"
                            : "bg-red-900/50 text-red-300"
                        }`}>
                        {investmentMessage.text}
                    </div>
                )}

                {/* Action */}
                <button
                    onClick={handleStartInvestment}
                    disabled={isLoading || !amount || parseFloat(amount) <= 0}
                    className="w-full bg-purple-500 py-3 rounded-full font-semibold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Processing..." : "Start Now"}
                </button>
            </div>
        </div>
    );
}