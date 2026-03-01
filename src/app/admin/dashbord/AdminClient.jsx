"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"; // import zoom library

export default function AdminClient({ initialData }) {
    const [recharges, setRecharges] = useState(initialData || []);
    const { data: session, status } = useSession();
    const [loadingRecharges, setLoadingRecharges] = useState(false);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        if (status !== "authenticated") return;
        if (session?.user?.role !== "admin") return;

        fetchRecharges();
    }, [status]);

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

            if (!res.ok) {
                console.warn("updateStatus failed", { status: res.status, body: json });
                // if the status hasn't changed we still update to the returned doc
                if (json.data) {
                    setRecharges((r) =>
                        r.map((x) => (String(x._id) === String(id) ? json.data : x))
                    );
                }
                return;
            }

            if (json.data) {
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

    if (status === "loading") return <div className="p-10">Loading admin panel...</div>;
    if (status !== "authenticated" || session?.user?.role !== "admin") return <div className="p-10">Unauthorized</div>;

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <AdminCard title="Total Users" value="1,245" />
                <AdminCard title="Total Invested" value="$2.4M" />
            </div>

            <section>
                <h2 className="text-xl font-semibold mb-4">Recent Recharges</h2>

                {loadingRecharges ? (
                    <div>Loading recharges...</div>
                ) : (
                    <div className="space-y-6">
                        {recharges.length === 0 && <div>No recharges</div>}
                        {recharges.map((r) => (
                            <div
                                key={r._id}
                                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden max-w-md"
                            >
                                {/* Zoomable Image */}
                                <div className="w-full bg-gray-100 overflow-hidden rounded-t-2xl">
                                    {r.slip?.dataUrl ? (
                                        <TransformWrapper
                                            defaultScale={1}
                                            defaultPositionX={0}
                                            defaultPositionY={0}
                                            wheel={{ step: 0.1 }}
                                            pinch={{ step: 5 }}
                                        >
                                            <TransformComponent>
                                                <img
                                                    src={r.slip.dataUrl}
                                                    alt="Recharge Slip"
                                                    className="w-full max-h-96 object-contain cursor-pointer"
                                                />
                                            </TransformComponent>
                                        </TransformWrapper>
                                    ) : (
                                        <span className="text-gray-400 p-10">No image</span>
                                    )}
                                </div>

                                {/* Content Below Image */}
                                <div className="p-5 space-y-2">
                                    <div className="text-sm text-gray-500">
                                        User: {r.user?.email || r.submitterEmail || "unknown"}
                                    </div>

                                    <div className="text-lg font-semibold">
                                        Amount: {r.status === "confirmed" ? `${r.amount} USDT` : "RECHARGE"}
                                    </div>

                                    <div className="text-sm break-all text-gray-600">TxID: {r.txId}</div>

                                    <div>
                                        <span
                                            className={`px-3 py-1 text-xs rounded-full font-medium ${r.status === "confirmed"
                                                ? "bg-green-100 text-green-600"
                                                : r.status === "rejected"
                                                    ? "bg-red-100 text-red-600"
                                                    : "bg-yellow-100 text-yellow-600"
                                                }`}
                                        >
                                            {r.status}
                                        </span>
                                    </div>

                                    {/* Action Buttons (only while pending) */}
                                    {r.status === "pending" && (
                                        <div className="flex gap-3 pt-3">
                                            <button
                                                disabled={actionLoading[r._id]}
                                                onClick={() => updateStatus(r._id, "confirmed")}
                                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition disabled:opacity-50"
                                            >
                                                Confirm
                                            </button>

                                            <button
                                                disabled={actionLoading[r._id]}
                                                onClick={() => updateStatus(r._id, "rejected")}
                                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
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
