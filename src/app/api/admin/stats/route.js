import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import Investment from "../../../models/Investment";
import Recharge from "../../../models/Recharge";
import Withdraw from "../../../models/Withdraw";
import { getToken } from "next-auth/jwt";
import { getCachedJson, setCachedJson } from "../../../lib/cache";
export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const cachedStats = await getCachedJson("admin:stats");
        if (cachedStats) {
            return NextResponse.json({ data: cachedStats }, { status: 200 });
        }

        const token = await getToken({
            req,
            secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET,
        });

        if (!token || token.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Get all stats in parallel
        const [totalUsers, investmentStats, pendingRecharge, pendingWithdraw, totalDeposited] = await Promise.all([
            // Total users with role 'user'
            User.countDocuments({ role: "user" }),

            // Investment stats
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
            ]),

            // Pending recharges
            Recharge.aggregate([
                { $match: { status: "pending" } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
            ]),

            // Pending withdraw requests
            Withdraw.aggregate([
                { $match: { status: "pending" } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
            ]),

            // Confirmed recharges
            Recharge.aggregate([
                { $match: { status: "confirmed" } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
            ]),
        ]);

        const result = {
            totalUsers: totalUsers || 0,
            totalInvestment: investmentStats[0]?.totalAmount || 0,
            totalDailyProfit: investmentStats[0]?.totalDailyProfit || 0,
            totalPendingRecharge: pendingRecharge[0]?.total || 0,
            totalPendingWithdraw: pendingWithdraw[0]?.total || 0,
            totalDeposited: totalDeposited[0]?.total || 0,
            activeInvestments: investmentStats[0]?.count || 0,
            avgInvestmentAmount: investmentStats[0]?.avgAmount || 0,
        };

        await setCachedJson("admin:stats", result, 30);
        return NextResponse.json({ data: result }, { status: 200 });
    } catch (err) {
        console.error("/api/admin/stats error", err);
        return NextResponse.json(
            {
                error: "Server error", data: {
                    totalUsers: 0,
                    totalInvestment: 0,
                    totalDailyProfit: 0,
                    totalPendingWithdraw: 0,
                    totalDeposited: 0,
                    activeInvestments: 0,
                    avgInvestmentAmount: 0,
                }
            },
            { status: 500 }
        );
    }
}
