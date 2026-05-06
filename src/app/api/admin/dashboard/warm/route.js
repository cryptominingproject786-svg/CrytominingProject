import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoDb";
import Recharge from "../../../../models/Recharge";
import User from "../../../../models/User";
import Investment from "../../../../models/Investment";
import Withdraw from "../../../../models/Withdraw";
import { getToken } from "next-auth/jwt";
import { getCachedJson, setCachedJson } from "../../../../lib/cache";
import { measureAsync } from "../../../../lib/performanceLogger";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
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

        const force = new URL(req.url).searchParams.get("force") === "true";

        const pageCacheKey = "admin:dashboard:page:1";
        const rechargeCacheKey = "admin:recharges:p1:l20";
        const statsCacheKey = "admin:stats";

        const cachedPage = await getCachedJson(pageCacheKey);
        const cachedRecharge = await getCachedJson(rechargeCacheKey);
        const cachedStats = await getCachedJson(statsCacheKey);

        const results = {
            page: { warmed: !!cachedPage, cacheKey: pageCacheKey },
            recharge: { warmed: !!cachedRecharge, cacheKey: rechargeCacheKey },
            stats: { warmed: !!cachedStats, cacheKey: statsCacheKey },
        };

        if (!force && cachedPage && cachedRecharge && cachedStats) {
            return NextResponse.json({ message: "Caches are already warm.", results }, { status: 200 });
        }

        await connectDB();

        const [{ result: total }, { result: recharges }] = await Promise.all([
            measureAsync("warm-dashboard-count", () => Recharge.estimatedDocumentCount()),
            measureAsync("warm-dashboard-page-1", () =>
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

        const pageData = recharges.map((r) => ({
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
            network: r.network,
            amount: r.amount,
            status: r.status,
            createdAt: r.createdAt,
            slip: { hasData: !!r.slip?.data },
        }));

        const pagePayload = {
            data: pageData,
            pagination: { page, limit, total, pageCount, hasMore: page < pageCount },
        };

        await setCachedJson(pageCacheKey, pagePayload, 60);
        results.page = { warmed: true, cacheKey: pageCacheKey };

        const statsStart = Date.now();
        const [totalUsers, investmentStats, pendingRecharge, pendingWithdraw, totalDeposited] = await Promise.all([
            measureAsync("warm-stats-users", () => User.countDocuments({ role: "user" })),
            measureAsync("warm-stats-investments", () =>
                Investment.aggregate([
                    { $match: { status: "active" } },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: "$amount" },
                            totalDailyProfit: { $sum: "$dailyProfit" },
                            count: { $sum: 1 },
                            avgAmount: { $avg: "$amount" },
                        },
                    },
                ])
            ),
            measureAsync("warm-stats-pending-recharge", () =>
                Recharge.aggregate([
                    { $match: { status: "pending" } },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ])
            ),
            measureAsync("warm-stats-pending-withdraw", () =>
                Withdraw.aggregate([
                    { $match: { status: "pending" } },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ])
            ),
            measureAsync("warm-stats-total-deposited", () =>
                Recharge.aggregate([
                    { $match: { status: "confirmed" } },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ])
            ),
        ]);

        const statsPayload = {
            totalUsers: totalUsers.result || 0,
            totalInvestment: investmentStats.result[0]?.totalAmount || 0,
            totalDailyProfit: investmentStats.result[0]?.totalDailyProfit || 0,
            totalPendingRecharge: pendingRecharge.result[0]?.total || 0,
            totalPendingWithdraw: pendingWithdraw.result[0]?.total || 0,
            totalDeposited: totalDeposited.result[0]?.total || 0,
            activeInvestments: investmentStats.result[0]?.count || 0,
            avgInvestmentAmount: investmentStats.result[0]?.avgAmount || 0,
        };

        await setCachedJson(statsCacheKey, statsPayload, 30);
        results.stats = { warmed: true, cacheKey: statsCacheKey, durationMs: Date.now() - statsStart };

        const rechargePayload = {
            data: pageData,
            page,
            limit,
            total,
            pageCount,
            hasMore: page < pageCount,
        };
        await setCachedJson(rechargeCacheKey, rechargePayload, 60);
        results.recharge = { warmed: true, cacheKey: rechargeCacheKey };

        return NextResponse.json({ message: "Admin warm cache updated.", results }, { status: 200 });
    } catch (err) {
        console.error("GET /api/admin/dashboard/warm error:", err);
        return NextResponse.json({ error: "Warm endpoint failed" }, { status: 500 });
    }
}
