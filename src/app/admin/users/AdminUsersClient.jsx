"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";

const PAGE_SIZE = 20;

const formatNumber = (value) => Number(value ?? 0).toLocaleString();
const formatUsd = (value) => `$${Number(value ?? 0).toFixed(2)}`;
const formatDate = (value) =>
    value
        ? new Date(value).toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "—";

function UserCard({ user, onDelete }) {
    return (
        <article className="rounded-3xl border border-slate-800 bg-slate-950/95 p-5 shadow-2xl shadow-black/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-yellow-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-yellow-300">
                            Joined {formatDate(user.createdAt)}
                        </span>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-300">
                            Referrals: {user.referralCount}
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-400">{user.username || "Unknown user"}</h3>
                    <p className="text-sm text-slate-400">{user.email}</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl bg-slate-900/80 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500">Balance</p>
                            <p className="mt-1 text-sm font-semibold text-white">{formatUsd(user.balance)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/80 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500">Invested</p>
                            <p className="mt-1 text-sm font-semibold text-white">{formatUsd(user.investedAmount)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/80 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500">Deposited</p>
                            <p className="mt-1 text-sm font-semibold text-white">{formatUsd(user.depositedAmount)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/80 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500">Children</p>
                            <p className="mt-1 text-sm font-semibold text-white">{formatNumber(user.referralCount)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                    <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                        <p className="font-semibold text-slate-100">Referral code</p>
                        <p className="mt-1 break-all">{user.referralCode || "—"}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onDelete(user._id)}
                        className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                    >
                        Delete user
                    </button>
                </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-200">Recent referred users</p>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Showing up to 4
                    </span>
                </div>
                {user.referrals.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">No direct referrals yet.</p>
                ) : (
                    <div className="mt-3 grid gap-3">
                        {user.referrals.map((child) => (
                            <div
                                key={child._id}
                                className="grid gap-2 rounded-2xl border border-slate-800 bg-slate-950/90 p-3"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                    <p className="font-semibold text-white">{child.username}</p>
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Joined {formatDate(child.createdAt)}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm text-slate-400">
                                    <span>Email: {child.email || "—"}</span>
                                    <span>Deposited: {formatUsd(child.depositedAmount)}</span>
                                    <span>Invested: {formatUsd(child.investedAmount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}

function SkeletonCard() {
    return (
        <div className="animate-pulse rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
            <div className="h-5 w-3/5 rounded-full bg-slate-800" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-16 rounded-2xl bg-slate-800" />
                ))}
            </div>
            <div className="mt-5 space-y-3">
                <div className="h-4 w-2/5 rounded-full bg-slate-800" />
                <div className="h-4 w-full rounded-full bg-slate-800" />
            </div>
        </div>
    );
}

export default function AdminUsersClient() {
    const { data: session, status } = useSession();
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isAdmin = status === "authenticated" && session?.user?.role === "admin";

    const fetchPage = useCallback(async (pageIndex) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/users?page=${pageIndex}&limit=${PAGE_SIZE}`, {
                cache: "no-store",
                credentials: "include",
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Unable to load users");
            setUsers(json.data.users || []);
            setPage(json.data.page || 1);
            setPageCount(json.data.pageCount || 1);
            setTotalUsers(json.data.totalUsers || 0);
        } catch (err) {
            console.error("AdminUsersClient fetch error", err);
            setError(err.message || "Unable to load users");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAdmin) return;
        fetchPage(1);
    }, [fetchPage, isAdmin]);

    const handleDelete = useCallback(
        async (userId) => {
            if (!window.confirm("Delete this user? This will deactivate the account and remove it from the active user list.")) {
                return;
            }
            try {
                const res = await fetch(`/api/admin/user/${userId}`, {
                    method: "DELETE",
                    cache: "no-store",
                    credentials: "include",
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "Unable to delete user");
                setUsers((current) => current.filter((user) => user._id !== userId));
                setTotalUsers((count) => Math.max(0, count - 1));
            } catch (err) {
                console.error("Delete user failed", err);
                window.alert(err.message || "Delete failed");
            }
        },
        []
    );

    const handlePrev = useCallback(() => {
        if (page > 1) fetchPage(page - 1);
    }, [fetchPage, page]);

    const handleNext = useCallback(() => {
        if (page < pageCount) fetchPage(page + 1);
    }, [fetchPage, page, pageCount]);

    const userCountLabel = useMemo(
        () => `${formatNumber(totalUsers)} total active users`,
        [totalUsers]
    );

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-yellow-400 text-base font-bold">
                Loading admin session…
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-red-400 text-base font-bold">
                Unauthorized
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black px-3 py-6 sm:px-5 lg:px-10 lg:py-12 text-white">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-yellow-400">User Management</h1>
                    <p className="mt-1 text-sm text-slate-500">Fast access to user onboarding, deposits, referral tree, and account actions.</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <p className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                        {userCountLabel}
                    </p>
                    <button
                        type="button"
                        onClick={() => fetchPage(1)}
                        className="rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4">
                {loading && Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)}
                {!loading && users.length === 0 && (
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 text-center text-slate-400">
                        No users found. Try refreshing or adjust the page selection.
                    </div>
                )}
                {!loading && users.map((user) => (
                    <UserCard key={user._id} user={user} onDelete={handleDelete} />
                ))}
            </section>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-400">
                    Page {page} of {pageCount} · {formatNumber(totalUsers)} users
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={page <= 1 || loading}
                        className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        ← Previous
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={page >= pageCount || loading}
                        className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </main>
    );
}
