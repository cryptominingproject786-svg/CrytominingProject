"use client";

import React, { useEffect, useMemo, useState } from "react";

const StatCard = React.memo(function StatCard({ label, value }) {
    return (
        <article className="group relative rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-2xl hover:shadow-yellow-500/20 transition duration-300">
            <div className="absolute inset-0 rounded-3xl bg-yellow-400/10 opacity-0 group-hover:opacity-100 blur-xl transition" aria-hidden="true" />
            <div className="relative z-10">
                <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                <h3 className="mt-3 text-3xl font-extrabold text-white">{value}</h3>
            </div>
        </article>
    );
});

export default function Team() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const fetchTeam = async () => {
            try {
                const res = await fetch("/api/user/team", { credentials: "include" });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "Failed to load team data");
                if (mounted) {
                    setData(json.data);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.message);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchTeam();
        return () => {
            mounted = false;
        };
    }, []);

    const referralText = useMemo(() => {
        if (!data?.referralCode) return "Use your referral code on signup to start building your team.";
        return `Share your code and invite friends. Any first-level referral who completes their first investment earns you $0.25.`;
    }, [data]);

    const summaryCards = useMemo(() => {
        if (!data) return [];
        return [
            { label: "Referral Code", value: data.referralCode || "—" },
            { label: "Team Members", value: data.teamMembersCount ?? 0 },
            { label: "Qualified Referrals", value: data.qualifiedReferralsCount ?? 0 },
            { label: "Team Earnings", value: `$${(data.teamEarnings ?? 0).toFixed(2)}` },
        ];
    }, [data]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white px-4 py-8">
            <section className="max-w-6xl mx-auto space-y-8">
                <header className="rounded-3xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/20 to-black/20 p-8 shadow-2xl">
                    <p className="text-sm uppercase tracking-[0.4em] text-yellow-300">Team Rewards</p>
                    <h1 className="mt-4 text-4xl font-extrabold text-white">Level 1 Team Dashboard</h1>
                    <p className="mt-3 max-w-2xl text-sm text-gray-300 sm:text-base">
                        Build your team with direct referrals, track first investments, and earn referral rewards automatically.
                    </p>
                </header>

                {loading && (
                    <div className="rounded-3xl bg-slate-900/80 p-8 shadow-xl animate-pulse">
                        <p className="text-gray-400">Loading team data…</p>
                    </div>
                )}

                {error && (
                    <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-red-200 shadow-xl">
                        <p className="font-semibold">Unable to load team data</p>
                        <p className="mt-2 text-sm">{error}</p>
                    </div>
                )}

                {!loading && !error && data && (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {summaryCards.map((card) => (
                                <StatCard key={card.label} label={card.label} value={card.value} />
                            ))}
                        </div>

                        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-2xl">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-white">Referral Brief</h2>
                                    <p className="mt-2 text-sm text-gray-300">{referralText}</p>
                                </div>
                                <div className="rounded-3xl bg-yellow-500 px-5 py-3 text-black font-bold">First-level bonus: $0.25</div>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-3xl border border-slate-800 bg-black/50 p-5">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Your referral code</p>
                                    <p className="mt-3 text-xl font-semibold text-white">{data.referralCode || "—"}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-800 bg-black/50 p-5">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Team milestone</p>
                                    <p className="mt-3 text-xl font-semibold text-white">
                                        {data.qualifiedReferralsCount >= 2 ? "Qualified" : "Pending"}
                                    </p>
                                    <p className="mt-2 text-sm text-gray-400">
                                        {data.qualifiedReferralsCount >= 2
                                            ? "You have at least two direct referrals with first investments. Bonuses are active."
                                            : "Invite at least two referrals and get their first investment to unlock more team rewards."}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-2xl">
                            <h2 className="text-2xl font-extrabold text-white">Direct Referral Activity</h2>
                            <p className="mt-2 text-sm text-gray-400">
                                Each direct referral that completes their first investment earns you a reward.
                            </p>

                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full min-w-[640px] border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-sm text-slate-400">
                                            <th className="py-3 px-4">Referral</th>
                                            <th className="py-3 px-4">Joined</th>
                                            <th className="py-3 px-4">Invested</th>
                                            <th className="py-3 px-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.directReferrals.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="py-8 px-4 text-center text-gray-400">
                                                    No direct referrals yet. Share your referral code to start building your team.
                                                </td>
                                            </tr>
                                        ) : (
                                            data.directReferrals.map((ref) => (
                                                <tr
                                                    key={`${ref.username}-${ref.joinedAt}`}
                                                    className="border-b border-slate-800 transition hover:bg-white/5"
                                                >
                                                    <td className="py-4 px-4 text-white">{ref.username}</td>
                                                    <td className="py-4 px-4 text-sm text-slate-400">
                                                        {new Date(ref.joinedAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-slate-100">${ref.investedAmount.toFixed(2)}</td>
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ref.isQualified ? "bg-emerald-500/15 text-emerald-300" : "bg-yellow-500/15 text-yellow-300"}`}>
                                                            {ref.isQualified ? "First investment complete" : "Awaiting first investment"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </section>
        </main>
    );
}
