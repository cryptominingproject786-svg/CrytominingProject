import { Suspense } from "react";
import connectDB from "../../lib/mongoDb";
import { getCachedJson, setCachedJson } from "../../lib/cache";
import { measureAsync } from "../../lib/performanceLogger";
import "../../models/User";
import Recharge from "../../models/Recharge";
import AdminClient from "../dashbord/AdminClient";

export const dynamic = "force-dynamic";

async function AdminData() {
    const CACHE_KEY = "admin:dashboard:page:1";
    const cached = await getCachedJson(CACHE_KEY);
    if (cached?.data && cached?.pagination) {
        return (
            <AdminClient
                initialData={cached.data}
                initialPagination={cached.pagination}
            />
        );
    }

    await connectDB();

    const [{ result: total }, { result: recharges }] = await Promise.all([
        measureAsync("admin-dashboard-count", () => Recharge.estimatedDocumentCount()),
        measureAsync("admin-dashboard-page-1", () =>
            Recharge.find({})
                .select("user amount network status createdAt slip")
                .sort({ createdAt: -1 })
                .limit(20)
                .populate(
                    "user",
                    "email username phone balance investedAmount totalEarnings dailyProfit"
                )
                .lean()
        ),
    ]);

    const page = 1;
    const limit = 20;
    const pageCount = Math.max(1, Math.ceil(total / limit));

    const safeData = recharges.map((r) => ({
        _id: r._id.toString(),
        user: r.user
            ? { ...r.user, _id: r.user._id.toString(), phone: r.user.phone || null }
            : null,
        network: r.network,
        amount: r.amount,
        status: r.status,
        createdAt: r.createdAt?.toISOString(),
        slip: { hasData: !!r.slip?.data },
    }));

    const payload = {
        data: safeData,
        pagination: { page, limit, total, pageCount, hasMore: page < pageCount },
    };

    await setCachedJson(CACHE_KEY, payload, 60);

    return <AdminClient initialData={safeData} initialPagination={payload.pagination} />;
}

// ── Page shell — renders instantly, streams AdminData in ──────────────────────
export default function AdminPage() {
    return (
        <Suspense fallback={<div className="p-10 text-white animate-pulse">Loading dashboard…</div>}>
            <AdminData />
        </Suspense>
    );
}