"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { memo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function AdminClient({ initialData }) {

    const [recharges, setRecharges] = useState(initialData || []);
    const { data: session, status } = useSession();

    const [loadingRecharges, setLoadingRecharges] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [actionLoading, setActionLoading] = useState({});
    const [previewSlip, setPreviewSlip] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalInvestment: 0,
        totalWithdraw: 0,
        totalDailyProfit: 0,
        totalDeposited: 0,
    });

    useEffect(() => {
        if (status !== "authenticated") return;
        if (session?.user?.role !== "admin") return;

        fetchRecharges();
        fetchStats();
    }, [status]);

    const fetchRecharges = useCallback(async () => {
        setLoadingRecharges(true);

        try {
            const res = await fetch("/api/recharge/admin");
            const json = await res.json();
            if (res.ok) {
                console.log("fetched recharges sample", json.data && json.data[0]);
                setRecharges(json.data || []);
            } else {
                console.warn("recharge fetch failed", json);
            }
        } catch (e) {
            console.error("fetchRecharges error", e);
        } finally {
            setLoadingRecharges(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);

        try {
            const res = await fetch("/api/admin/stats");
            const json = await res.json();
            if (res.ok && json.data) {
                console.log("fetched admin stats", json.data);
                const safeStats = {
                    totalUsers: json.data.totalUsers ?? 0,
                    totalInvestment: json.data.totalInvestment ?? 0,
                    totalWithdraw: json.data.totalPendingWithdraw ?? 0,
                    totalDailyProfit: json.data.totalDailyProfit ?? 0,
                    totalDeposited: json.data.totalDeposited ?? 0,
                };
                setStats(safeStats);
            } else {
                console.warn("stats fetch failed", json);
                setStats({
                    totalUsers: 0,
                    totalInvestment: 0,
                    totalWithdraw: 0,
                    totalDailyProfit: 0,
                    totalDeposited: 0,
                });
            }
        } catch (e) {
            console.error("fetchStats error", e);
            setStats({
                totalUsers: 0,
                totalInvestment: 0,
                totalWithdraw: 0,
                totalDailyProfit: 0,
                totalDeposited: 0,
            });
        } finally {
            setLoadingStats(false);
        }
    }, []);

    const updateStatus = useCallback(async (id, newStatus) => {

        setActionLoading((s) => ({ ...s, [id]: true }));

        try {
            const res = await fetch(`/api/recharge/admin/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            const json = await res.json();

            if (json.data) {
                setRecharges((r) =>
                    r.map((x) =>
                        String(x._id) === String(id) ? json.data : x
                    )
                );
            }

        } catch (e) {
            console.error("updateStatus error", e);
        } finally {
            setActionLoading((s) => ({ ...s, [id]: false }));
        }
    }, []);

    const copyTx = useCallback((tx) => {
        navigator.clipboard.writeText(tx);
        alert("TXID copied");
    }, []);

    const formatNumber = (value) => {
        const num = Number(value) || 0;
        return num.toLocaleString();
    };

    if (status === "loading")
        return <div className="p-10 text-white">Loading admin panel...</div>;

    if (status !== "authenticated" || session?.user?.role !== "admin")
        return <div className="p-10 text-white">Unauthorized</div>;

    return (

        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-10 text-white">

            {/* Header */}
            <h1 className="text-4xl font-extrabold text-yellow-400 mb-10">
                Admin Dashboard
            </h1>

            {/* Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

                <MemoAdminCard
                    title="Total Users"
                    value={loadingStats ? "..." : formatNumber(stats.totalUsers)}
                />
                <MemoAdminCard
                    title="Total Invested"
                    value={loadingStats ? "..." : `$${formatNumber(stats.totalInvestment)}`}
                />
                <MemoAdminCard
                    title="Total Pending Withdraw"
                    value={loadingStats ? "..." : `$${formatNumber(stats.totalWithdraw)}`}
                />
                <MemoAdminCard
                    title="Daily Profit (All Users)"
                    value={loadingStats ? "..." : `$${formatNumber(stats.totalDailyProfit)}`}
                />

            </div>

            {/* Recharge Section */}

            <section>

                <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                    Recent Recharges
                </h2>

                {loadingRecharges ? (
                    <div>Loading recharges...</div>
                ) : (

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

                        {recharges.length === 0 && <div>No recharges</div>}

                        {recharges.map((r) => (
                            <RechargeCard
                                key={r._id}
                                recharge={r}
                                isLoading={actionLoading[r._id] || false}
                                onUpdateStatus={updateStatus}
                                onPreviewSlip={() => setPreviewSlip(r.slip?.dataUrl)}
                                onCopyTx={copyTx}
                            />
                        ))}

                    </div>

                )}

            </section>

            {/* FULLSCREEN SLIP MODAL */}

            {previewSlip && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
                    onClick={() => setPreviewSlip(null)}
                >
                    <div
                        className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setPreviewSlip(null)}
                            className="absolute top-3 right-3 text-white text-3xl z-10"
                        >
                            ✕
                        </button>

                        {/* Image Container */}
                        <div className="w-full max-h-[90vh] flex items-center justify-center">
                            <TransformWrapper>
                                <TransformComponent>
                                    <img
                                        src={previewSlip}
                                        alt="Slip Preview"
                                        className="max-h-[90vh] w-auto object-contain"
                                    />
                                </TransformComponent>
                            </TransformWrapper>
                        </div>
                    </div>
                </div>
            )}

        </div>

    );
}

function AdminCard({ title, value }) {

    return (

        <div className="bg-gradient-to-tr from-gray-900 to-black border border-yellow-500/20 rounded-3xl p-6 shadow-xl hover:scale-105 transition">

            <p className="text-gray-400">{title}</p>

            <h2 className="text-3xl font-extrabold text-yellow-400 mt-2">
                {value}
            </h2>

        </div>

    );
}

const MemoAdminCard = memo(AdminCard);

const RechargeCard = memo(function RechargeCard({ recharge: r, isLoading, onUpdateStatus, onPreviewSlip, onCopyTx }) {
    return (
        <div className="bg-gradient-to-tr from-gray-900 to-black border border-yellow-500/30 rounded-3xl shadow-xl hover:shadow-yellow-500/20 transition overflow-hidden">

            {/* Image */}
            <div
                className="h-64 bg-black flex items-center justify-center cursor-pointer"
                onClick={onPreviewSlip}
            >
                {r.slip?.dataUrl ? (
                    <img
                        src={r.slip.dataUrl}
                        className="w-full h-full object-contain"
                        alt="Recharge slip"
                    />
                ) : (
                    <span className="text-gray-500">
                        No Image
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">

                {/* user details section (populated by backend) */}
                {r.user ? (
                    <div className="text-sm text-gray-400 space-y-1">
                        <p>
                            Username:
                            <span className="text-white ml-1">
                                {r.user.username}
                            </span>
                        </p>
                        <p>
                            Email:
                            <span className="text-white ml-1">
                                {r.user.email}
                            </span>
                        </p>
                        <p>
                            Balance:
                            <span className="text-white ml-1">
                                {r.user.balance != null ? `$${r.user.balance}` : "N/A"}
                            </span>
                        </p>
                        <p>
                            Invested:
                            <span className="text-white ml-1">
                                {r.user.investedAmount != null ? `$${r.user.investedAmount}` : "N/A"}
                            </span>
                        </p>
                        <p>
                            Total Earnings:
                            <span className="text-white ml-1">
                                {r.user.totalEarnings != null ? `$${r.user.totalEarnings}` : "N/A"}
                            </span>
                        </p>
                        <p>
                            Daily Profit:
                            <span className="text-yellow-400 ml-1 font-semibold">
                                {r.user.dailyProfit != null ? `$${r.user.dailyProfit}` : "N/A"}
                            </span>
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">
                        User:
                        <span className="text-white ml-1">
                            {r.submitterEmail || "Unknown"}
                        </span>
                    </p>
                )}

                <p className="text-xl font-bold text-yellow-400">
                    {r.amount} USDT
                </p>

                <div className="text-xs break-all text-gray-400 flex items-center gap-2">
                    <span>
                        TXID: {r.txId?.slice(0, 20) || "N/A"}...
                    </span>

                    <button
                        onClick={() => onCopyTx(r.txId)}
                        className="text-yellow-400 hover:text-yellow-300"
                    >
                        Copy
                    </button>
                </div>

                {/* Status */}
                <span
                    className={`inline-block px-3 py-1 text-xs rounded-full font-bold
                    ${r.status === "confirmed"
                            ? "bg-green-500/20 text-green-400"
                            : r.status === "rejected"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                        }`}
                >
                    {r.status}
                </span>

                {/* Actions */}
                {r.status === "pending" && (
                    <div className="flex gap-3 pt-3">
                        <button
                            disabled={isLoading}
                            onClick={() => onUpdateStatus(r._id, "confirmed")}
                            className="flex-1 bg-green-500 hover:bg-green-600 py-2 rounded-xl font-semibold transition disabled:opacity-50"
                        >
                            Confirm
                        </button>

                        <button
                            disabled={isLoading}
                            onClick={() => onUpdateStatus(r._id, "rejected")}
                            className="flex-1 bg-red-500 hover:bg-red-600 py-2 rounded-xl font-semibold transition disabled:opacity-50"
                        >
                            Reject
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
});