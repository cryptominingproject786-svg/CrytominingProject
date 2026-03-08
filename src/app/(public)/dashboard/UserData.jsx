"use client";
import React from "react";
import RechargeModal from "./RechargeModal";
import { useState, useEffect, useCallback } from "react";

const activities = [
    {
        id: 1,
        title: "Invite 5 Level 1 users, each of whom must deposit at least 8 USDT, to receive a reward of 5.88 USDT.",
        note: "Invite others to deposit 168 USDT or more to participate in a lucky draw, with a top prize of 6666 USDT.",
        invited: 0,
        need: 5,
        reward: "+5.88 USDT",
        tag: "0/1",
    },
    {
        id: 2,
        title: "Invite 10 Level 1 users, each of whom deposits at least 200 USDT, and receive a reward of 188 USDT.",
        note: "",
        invited: 0,
        need: 10,
        reward: "+188.00 USDT",
        tag: "0/1",
    },
];

function UserData() {
    const [showRecharge, setShowRecharge] = useState(false);
    const [balance, setBalance] = useState(0);
    const [lastConfirmedAmount, setLastConfirmedAmount] = useState(null);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch("/api/user/me");
            const json = await res.json();
            if (res.ok) {
                setBalance(json.data?.balance ?? 0);
                if (json.data?.lastConfirmedAmount != null) {
                    setLastConfirmedAmount(json.data.lastConfirmedAmount);
                }
            }
        } catch (err) {
            console.error("Failed to fetch user:", err);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // ✅ Listen for investment success event fired by InvestModal
    // This re-fetches balance so UserData always shows post-investment balance
    useEffect(() => {
        const handleInvestmentSuccess = () => fetchUser();
        window.addEventListener("investmentSuccess", handleInvestmentSuccess);
        return () => window.removeEventListener("investmentSuccess", handleInvestmentSuccess);
    }, [fetchUser]);

    const ActionCard = React.memo(function ActionCard({ icon, label, color }) {
        const textColor =
            label === "Company Profile" || label === "Premium Features"
                ? "text-white"
                : "text-black";
        return (
            <article
                aria-label={label}
                className={`relative ${color} rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center ${textColor} font-bold cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-500`}
            >
                <span className="text-4xl sm:text-5xl mb-3 sm:mb-4" aria-hidden="true">{icon}</span>
                <h3 className="text-base sm:text-lg md:text-xl tracking-wide text-center">{label}</h3>
                <div className="absolute inset-0 rounded-3xl bg-white/10 blur-xl opacity-30 pointer-events-none" />
            </article>
        );
    });

    const ActivityCard = React.memo(function ActivityCard({ a }) {
        const percent = Math.min(100, Math.round((a.invited / Math.max(1, a.need)) * 100));
        return (
            <article
                aria-labelledby={`activity-title-${a.id}`}
                role="region"
                className="relative bg-gradient-to-tr from-gray-800 to-black/70 backdrop-blur-md rounded-3xl p-4 sm:p-6 md:p-6 shadow-2xl border border-yellow-400 hover:scale-105 transform transition duration-500 cursor-pointer"
            >
                <div className="absolute right-3 sm:right-4 top-3 sm:top-4 inline-flex items-center justify-center bg-yellow-500 text-black font-bold px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm shadow-lg">
                    {a.reward}
                </div>
                <div className="absolute right-3 sm:right-4 bottom-3 sm:bottom-4 flex flex-col gap-2 sm:gap-3">
                    <button aria-label="View calendar" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow hover:scale-110 transition">📅</button>
                    <button aria-label="View gifts" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow hover:scale-110 transition">🎁</button>
                </div>
                <div className="flex flex-col gap-3 sm:gap-4">
                    <h3 id={`activity-title-${a.id}`} className="text-sm sm:text-base md:text-lg font-bold text-white">{a.title}</h3>
                    {a.note && <p className="text-gray-300 text-xs sm:text-sm md:text-base">{a.note}</p>}
                    <div className="mt-3 sm:mt-4">
                        <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3 md:h-4 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-2 sm:h-3 md:h-4 bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="mt-1 text-right text-xs sm:text-sm text-gray-300">{a.invited}/{a.need}</div>
                    </div>
                    <span className="mt-2 inline-block bg-black/70 text-yellow-400 font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm shadow">{a.tag}</span>
                </div>
            </article>
        );
    });

    const openRecharge = React.useCallback(() => setShowRecharge(true), []);

    return (
        <>
            <main aria-label="User Dashboard" className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 sm:p-6 md:p-10 text-white flex justify-center items-start">
                <div className="w-full max-w-7xl flex flex-col gap-8 md:gap-10">

                    {/* Balance / Recharge Section */}
                    <section
                        aria-labelledby="recharge-section"
                        className="relative bg-yellow-500 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-2xl transform transition duration-500 hover:scale-105 cursor-pointer"
                    >
                        <div className="mb-4 sm:mb-0">
                            <h2
                                id="recharge-section"
                                className="text-black font-extrabold text-xl sm:text-2xl md:text-3xl tracking-wider uppercase"
                            >
                                {/* ✅ Shows confirmed recharge context + live wallet balance */}
                                {lastConfirmedAmount !== null
                                    ? `Last Recharge: ${lastConfirmedAmount} USDT`
                                    : "My Balance"}
                            </h2>

                            {/* ✅ Always show the real spendable balance */}
                            <p className="text-black font-extrabold text-2xl sm:text-3xl mt-1">
                                ${Number(balance).toFixed(2)} USDT
                            </p>

                            <p className="text-black/70 mt-1 text-sm sm:text-base">
                                Top up your balance instantly
                            </p>
                        </div>
                        <button
                            aria-label="Go to recharge"
                            onClick={openRecharge}
                            className="bg-black text-yellow-500 font-bold px-5 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-2xl hover:bg-gray-900 transition duration-300 text-sm sm:text-base md:text-lg cursor-pointer"
                        >
                            GO &gt;
                        </button>
                    </section>

                    {/* Action Cards */}
                    <section aria-label="User action cards" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {[
                            { icon: "💸", label: "Withdraw", color: "bg-gradient-to-tr from-yellow-400 to-yellow-500" },
                            { icon: "🏢", label: "Company Profile", color: "bg-gradient-to-tr from-gray-800 to-gray-900" },
                            { icon: "👥", label: "Invite Friends", color: "bg-gradient-to-tr from-yellow-400 to-yellow-500" },
                            { icon: "⚡", label: "Premium Features", color: "bg-gradient-to-tr from-black via-gray-800 to-black" },
                        ].map((card, index) => (
                            <ActionCard key={index} {...card} />
                        ))}
                    </section>

                    {/* Activities */}
                    <section aria-labelledby="activities-section" className="flex flex-col gap-6">
                        <h2 id="activities-section" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-yellow-400 uppercase tracking-wide">
                            Activities
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
                            {activities.map((a) => (
                                <ActivityCard key={a.id} a={a} />
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            {showRecharge && (
                <RechargeModal onClose={() => setShowRecharge(false)} />
            )}
        </>
    );
}

export default React.memo(UserData);