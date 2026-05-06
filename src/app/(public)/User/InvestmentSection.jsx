"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchStart,
    fetchSuccess,
    fetchFailure,
} from "../../../Redux/Slices/InvestmentSlice";

// ── InvestmentCard ────────────────────────────────────────────────────────────
const InvestmentCard = ({ inv, onClaim, nowTime }) => {
    const [claiming, setClaiming] = useState(false);
    const [claimError, setClaimError] = useState(null);

    const start = new Date(inv.startDate);
    const end = new Date(inv.maturityDate);
    const now = new Date(nowTime);

    const totalSeconds = Math.max(1, (end - start) / 1000);
    const passedSeconds = Math.max(0, (now - start) / 1000);
    const percent = Math.min(100, Math.round((passedSeconds / totalSeconds) * 100));

    const status = inv.status ?? "active";

    // ── Is this investment ready to claim? ────────────────────────────────────
    const isMatured = !Number.isNaN(end.getTime()) && now >= end && status === "active";

    const statusColor =
        inv.status === "active"
            ? isMatured
                ? "bg-yellow-500"   // matured → ready to claim
                : "bg-green-500"    // still running
            : "bg-gray-500";        // completed / other

    const statusLabel =
        inv.status === "active" && isMatured ? "Matured" : inv.status;

    // ── Claim handler ─────────────────────────────────────────────────────────
    const handleClaim = async () => {
        setClaiming(true);
        setClaimError(null);
        try {
            const res = await fetch("/api/invest/maturity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ investmentId: inv._id }),
            });

            const json = await res.json();

            if (!res.ok) {
                setClaimError(json.error || "Claim failed");
                return;
            }

            // ✅ Tell UserData to re-fetch balance
            window.dispatchEvent(
                new CustomEvent("investmentClaimed", { detail: json.data.totalReceived })
            );

            // ✅ Bubble up to parent so it can remove the claimed card locally
            onClaim(inv._id);

        } catch (err) {
            setClaimError(err.message || "Network error");
        } finally {
            setClaiming(false);
        }
    };

    return (
        <div className="relative bg-linear-to-br from-gray-900 to-black border border-yellow-400 rounded-3xl p-6 shadow-xl hover:scale-105 transition-all duration-500 flex flex-col gap-4">

            {/* Status badge */}
            <div
                className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold text-black rounded-full ${statusColor}`}
            >
                {statusLabel}
            </div>

            <h3 className="text-xl font-bold text-yellow-400">{inv.minerName}</h3>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-gray-400">Investment</p>
                    <p className="font-bold text-white">{inv.amount} USDT</p>
                </div>
                <div>
                    <p className="text-gray-400">Daily Profit</p>
                    <p className="font-bold text-green-400">{inv.dailyProfit} USDT</p>
                </div>
                <div>
                    <p className="text-gray-400">Total Profit</p>
                    <p className="font-bold text-green-400">{inv.totalProfit} USDT</p>
                </div>
                <div>
                    <p className="text-gray-400">Total Return</p>
                    <p className="font-bold text-yellow-400">{inv.totalReturn} USDT</p>
                </div>
                <div>
                    <p className="text-gray-400">Cycle</p>
                    <p className="font-bold text-white">
                        {Math.ceil((end - start) / (1000 * 60 * 60 * 24))} Days
                    </p>
                </div>
                <div>
                    <p className="text-gray-400">Start</p>
                    <p className="font-bold text-white">{start.toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-gray-400">Maturity</p>
                    <p className="font-bold text-white">{end.toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-gray-400">Withdrawn</p>
                    <p className="font-bold text-white">{inv.claimedProfit} USDT</p>
                </div>
            </div>

            {/* Progress bar */}
            <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Investment Progress</span>
                    <span>{percent}%</span>
                </div>
                <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                    <div
                        className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            {/* ── Claim button — only shown when matured ── */}
            {isMatured && (
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleClaim}
                        disabled={claiming}
                        aria-label={`Claim ${inv.totalReturn} USDT from ${inv.minerName}`}
                        className={`w-full py-3 rounded-2xl font-bold text-black text-base shadow-lg transition-all duration-300
                            ${claiming
                                ? "bg-yellow-300 cursor-not-allowed opacity-70"
                                : "bg-yellow-400 hover:bg-yellow-300 hover:shadow-yellow-400/40 hover:shadow-xl active:scale-95"
                            }`}
                    >
                        {claiming
                            ? "Claiming…"
                            : `Claim ${inv.totalReturn ?? (inv.amount + inv.totalProfit)} USDT`}
                    </button>

                    {claimError && (
                        <p role="alert" className="text-red-400 text-xs text-center">
                            {claimError}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

// ── InvestmentSection ─────────────────────────────────────────────────────────
export default function InvestmentSection({ initialInvestments = [] }) {
    const dispatch = useDispatch();
    const { data: investments, loading, error } = useSelector(
        (state) => state.investments
    );
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (initialInvestments.length > 0 && investments.length === 0) {
            dispatch(fetchSuccess(initialInvestments));
        }
    }, [dispatch, initialInvestments, investments.length]);

    // ── Fetch investments ─────────────────────────────────────────────────────
    const fetchInvestments = useCallback(async () => {
        dispatch(fetchStart());
        try {
            const res = await fetch("/api/invest", { credentials: "include" });
            const json = await res.json();

            if (res.ok) {
                dispatch(fetchSuccess(Array.isArray(json.data) ? json.data : []));
            } else {
                dispatch(fetchFailure(json.error || "Failed to fetch investments"));
            }
        } catch (err) {
            dispatch(fetchFailure(err.message));
        }
    }, [dispatch]);

    useEffect(() => {
        if (initialInvestments.length > 0 && investments.length === 0) {
            return;
        }
        fetchInvestments();
    }, [fetchInvestments, initialInvestments.length, investments.length]);

    // ── Re-fetch when a new investment is created ─────────────────────────────
    useEffect(() => {
        window.addEventListener("investmentSuccess", fetchInvestments);
        return () =>
            window.removeEventListener("investmentSuccess", fetchInvestments);
    }, [fetchInvestments]);

    // ── Remove claimed investment from Redux immediately (optimistic update) ──
    const handleClaimed = useCallback(
        (claimedId) => {
            const updated = investments.filter((inv) => inv._id !== claimedId);
            dispatch(fetchSuccess(updated));
        },
        [dispatch, investments]
    );

    // ── UI states ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <section className="flex flex-col gap-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-400 uppercase">
                    Your Investments
                </h2>
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center text-gray-400 animate-pulse">
                    Loading investments…
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="flex flex-col gap-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-400 uppercase">
                    Your Investments
                </h2>
                <div className="bg-gray-900 border border-red-500 rounded-2xl p-6 text-center text-red-400">
                    Error: {error}
                </div>
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-400 uppercase">
                Your Investments
            </h2>

            {investments.length === 0 ? (
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center text-gray-400">
                    No investments yet
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {investments.map((inv) => (
                        <InvestmentCard
                            key={inv._id}
                            inv={inv}
                            nowTime={now}
                            onClaim={handleClaimed}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}