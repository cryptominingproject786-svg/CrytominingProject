"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStart, fetchSuccess, fetchFailure } from "../../../Redux/Slices/InvestmentSlice"; // correct relative path to Redux slice

const InvestmentCard = ({ inv }) => {
    const start = new Date(inv.startDate);
    const end = new Date(inv.maturityDate);
    const now = new Date();

    const totalSeconds = (end - start) / 1000;
    const passedSeconds = Math.max(0, (now - start) / 1000);

    const percent = Math.min(
        100,
        Math.round((passedSeconds / totalSeconds) * 100)
    );

    const statusColor = inv.status === "active" ? "bg-green-500" : "bg-gray-500";

    return (
        <div className="relative bg-gradient-to-br from-gray-900 to-black border border-yellow-400 rounded-3xl p-6 shadow-xl hover:scale-105 transition-all duration-500">
            <div className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold text-black rounded-full ${statusColor}`}>
                {inv.status}
            </div>

            <h3 className="text-xl font-bold text-yellow-400 mb-3">{inv.minerName}</h3>

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

            <div className="mt-5">
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
        </div>
    );
};

// ✅ Child fetches data, dispatches to Redux, and renders — parent just reads from store
export default function InvestmentSection() {
    const dispatch = useDispatch();
    const { data: investments, loading, error } = useSelector((state) => state.investments);

    useEffect(() => {
        async function fetchInvestments() {
            dispatch(fetchStart());
            try {
                const res = await fetch("/api/invest", { credentials: "include" });
                const json = await res.json();
                console.log("Fetched investments:", json);

                if (res.ok) {
                    const data = Array.isArray(json.data) ? json.data : [];
                    dispatch(fetchSuccess(data));
                } else {
                    dispatch(fetchFailure(json.error || "Failed to fetch investments"));
                }
            } catch (err) {
                dispatch(fetchFailure(err.message));
            }
        }
        fetchInvestments();
    }, []); // runs once on mount

    if (loading) {
        return (
            <section className="flex flex-col gap-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-400 uppercase">Your Investments</h2>
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center text-gray-400 animate-pulse">
                    Loading investments...
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="flex flex-col gap-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-400 uppercase">Your Investments</h2>
                <div className="bg-gray-900 border border-red-500 rounded-2xl p-6 text-center text-red-400">
                    Error: {error}
                </div>
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-400 uppercase">Your Investments</h2>

            {investments.length === 0 ? (
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center text-gray-400">
                    No investments yet
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {investments.map((inv) => (
                        <InvestmentCard key={inv._id} inv={inv} />
                    ))}
                </div>
            )}
        </section>
    );
}