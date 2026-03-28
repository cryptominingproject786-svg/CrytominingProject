import { Suspense } from "react";
import { connection } from "next/server";

import connectDB from "../../lib/mongoDb";
import Recharge from "../../models/Recharge";
import AdminClient from "../dashbord/AdminClient";

// ── Data-fetching component (runs dynamically inside Suspense) ────────────────
async function AdminData() {
    await connection(); // marks this subtree as dynamic — safe inside Suspense
    await connectDB();  // ← was commented out; required so Mongoose is connected
    //   before Recharge.find() runs on a cold serverless start

    const recharges = await Recharge.find({})
        .select("-slip.data")
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("user", "email username balance investedAmount")
        .lean();

    const safeData = recharges.map(r => ({
        _id: r._id.toString(),
        user: r.user
            ? { ...r.user, _id: r.user._id.toString() }
            : null,
        network: r.network,
        amount: r.amount,
        txId: r.txId,
        status: r.status,
        createdAt: r.createdAt?.toISOString(),
        slip: { hasImage: !!r.slip?.contentType },
    }));

    return <AdminClient initialData={safeData} />;
}

// ── Page shell — renders instantly, streams AdminData in ──────────────────────
export default function AdminPage() {
    return (
        <Suspense fallback={<div className="p-10 text-white animate-pulse">Loading dashboard…</div>}>
            <AdminData />
        </Suspense>
    );
}