"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function AdminClient() {
    const { data: session, status } = useSession();

    const [recharges, setRecharges] = useState([]);
    const [loadingRecharges, setLoadingRecharges] = useState(false);
    const [actionLoading, setActionLoading] = useState({});

    // Load admin data ONLY when fully authenticated as admin
    useEffect(() => {
        if (status === "authenticated" && session?.user?.role === "admin") {
            fetchRecharges();
        }
    }, [status, session]);
    console.log("ADMIN SESSION:", { status, session });


    const fetchRecharges = async () => {
        setLoadingRecharges(true);
        try {
            const res = await fetch("/api/recharge/admin");
            const json = await res.json();
            if (res.ok) setRecharges(json.data || []);
        } catch (e) {
            console.error("fetchRecharges error", e);
        } finally {
            setLoadingRecharges(false);
        }
    };

    const updateStatus = async (id, status) => {
        setActionLoading((s) => ({ ...s, [id]: true }));
        try {
            const res = await fetch(`/api/recharge/admin/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const json = await res.json();
            if (res.ok && json.data) {
                setRecharges((r) =>
                    r.map((x) => (String(x._id) === String(id) ? json.data : x))
                );
            }
        } catch (e) {
            console.error("updateStatus error", e);
        } finally {
            setActionLoading((s) => ({ ...s, [id]: false }));
        }
    };

    // ⏳ Session loading
    if (status === "loading") {
        return <div className="p-10">Loading admin panel...</div>;
    }

    // ⛔ Middleware already redirected non-admins
    if (status !== "authenticated" || session?.user?.role !== "admin") {
        return <div className="p-10">Unauthorized</div>;
    }

    // ✅ Safe admin render
    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

            <div className="grid md:grid-cols-2 gap-6">
                <AdminCard title="Total Users" value="1,245" />
                <AdminCard title="Total Invested" value="$2.4M" />
            </div>

            <section className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Recent Recharges</h2>

                {loadingRecharges ? (
                    <div>Loading recharges...</div>
                ) : (
                    <div className="space-y-4">
                        {recharges.length === 0 && <div>No recharges</div>}
                        {recharges.map((r) => (
                            <div key={r._id} className="flex gap-4 bg-white p-4 rounded-lg">
                                <div className="w-28 h-20 bg-gray-100 rounded flex items-center justify-center">
                                    {r.slip?.dataUrl ? (
                                        <img
                                            src={r.slip.dataUrl}
                                            alt="slip"
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-500">No image</span>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="text-sm text-gray-500">
                                        User: {r.user?.email || r.submitterEmail || "unknown"}
                                    </div>
                                    <div className="font-medium">
                                        Amount: {r.amount} USDT
                                    </div>
                                    <div className="text-sm">TxID: {r.txId}</div>
                                    <div className="text-sm">
                                        Status: <strong>{r.status}</strong>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        disabled={actionLoading[r._id]}
                                        onClick={() => updateStatus(r._id, "confirmed")}
                                        className="bg-green-500 text-white px-3 py-2 rounded"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        disabled={actionLoading[r._id]}
                                        onClick={() => updateStatus(r._id, "rejected")}
                                        className="bg-red-500 text-white px-3 py-2 rounded"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function AdminCard({ title, value }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">{title}</p>
            <h2 className="text-2xl font-bold">{value}</h2>
        </div>
    );
}
