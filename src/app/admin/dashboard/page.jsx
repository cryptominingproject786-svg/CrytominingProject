import { Suspense } from "react";

import connectDB from "../../lib/mongoDb";
import "../../models/User";
import Recharge from "../../models/Recharge";
import AdminClient from "../dashbord/AdminClient";

export const dynamic = "force-dynamic";

// ── Data-fetching component (runs dynamically inside Suspense) ────────────────
async function AdminData() {
    await connectDB();  // ← was commented out; required so Mongoose is connected
    //   before Recharge.find() runs on a cold serverless start

    const recharges = await Recharge.find({})
        .select("-slip.data")
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("user", "email username phone balance investedAmount")
        .lean();

    const safeData = recharges.map(r => ({
        _id: r._id.toString(),
        user: r.user
            ? { ...r.user, _id: r.user._id.toString(), phone: r.user.phone || null }
            : null,
        network: r.network,
        amount: r.amount,
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