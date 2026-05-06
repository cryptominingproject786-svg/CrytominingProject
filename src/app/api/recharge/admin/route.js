// app/api/recharge/admin/route.js  (or pages/api/recharge/admin.js — adjust as needed)
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import Recharge from "../../../models/Recharge";
import { getToken } from "next-auth/jwt";
import { getCachedJson, setCachedJson } from "../../../lib/cache";
import { measureAsync } from "../../../lib/performanceLogger";

export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const token = await getToken({
            req,
            secret:
                process.env.AUTH_SECRET ||
                process.env.NEXTAUTH_SECRET ||
                process.env.SECRET,
        });

        if (!token || token.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(
            Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
            100
        );
        const cacheKey = `admin:recharges:p${page}:l${limit}`;
        const cached = await getCachedJson(cacheKey);
        if (cached) {
            return NextResponse.json(cached, {
                status: 200,
                headers: {
                    "Cache-Control": "private, max-age=10, stale-while-revalidate=20",
                },
            });
        }

        const skip = (page - 1) * limit;

        await connectDB();

        const [{ result: total }, { result: recharges }] = await Promise.all([
            measureAsync("admin-recharge-count", () => Recharge.estimatedDocumentCount()),
            measureAsync("admin-recharge-page", () =>
                Recharge.find({})
                    .select("user amount network status createdAt slip")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate(
                        "user",
                        "username email phone balance investedAmount totalEarnings dailyProfit"
                    )
                    .lean()
            ),
        ]);

        const pageCount = Math.max(1, Math.ceil(total / limit));
        const hasMore = page < pageCount;

        const serialized = recharges.map((r) => ({
            _id: String(r._id),
            user: r.user
                ? {
                    _id: String(r.user._id),
                    username: r.user.username,
                    email: r.user.email,
                    phone: r.user.phone || null,
                    balance: r.user.balance ?? 0,
                    investedAmount: r.user.investedAmount ?? 0,
                    totalEarnings: r.user.totalEarnings ?? 0,
                    dailyProfit: r.user.dailyProfit ?? 0,
                }
                : null,
            amount: r.amount,
            network: r.network,
            status: r.status,
            createdAt: r.createdAt,
            slip: { hasData: !!(r.slip?.data) },
        }));

        const payload = {
            data: serialized,
            page,
            limit,
            total,
            pageCount,
            hasMore,
        };

        await setCachedJson(cacheKey, payload, 60);

        return NextResponse.json(payload, {
            status: 200,
            headers: {
                "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
            },
        });
    } catch (err) {
        console.error("GET /api/recharge/admin error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}