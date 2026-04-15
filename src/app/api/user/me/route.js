// ❌ Remove "use server" — NEVER use this on route handlers
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import Investment from "../../../models/Investment";
import { getAuthToken, getAuthUserId } from "../../../lib/authToken";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const token = await getAuthToken(req);
        const userId = getAuthUserId(token);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const [user, investments] = await Promise.all([
            User.findById(userId)
                .select("username email balance referralCode referralCount")
                .lean(),
            Investment.find({ user: userId, status: "active" })
                .select("amount dailyProfit cycleDays claimedProfit lastProfitAt startDate maturityDate")
                .lean(),
        ]);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const now = Date.now();
        const DAY_SECONDS = 86400;

        let activeInvestedAmount = 0;
        let totalLockedProfit = 0;

        for (const inv of investments) {
            const maturityTime = new Date(inv.maturityDate).getTime();
            if (now >= maturityTime) continue;

            activeInvestedAmount += inv.amount;

            const claimed = inv.claimedProfit || 0;
            const last = new Date(inv.lastProfitAt || inv.startDate).getTime();
            const secondsPassed = (now - last) / 1000;
            const profit = secondsPassed * (inv.dailyProfit / DAY_SECONDS);

            totalLockedProfit += claimed + profit;
        }

        return NextResponse.json({
            data: {
                username: user.username,
                email: user.email,
                balance: Math.round(user.balance * 100) / 100,
                investedAmount: Math.round(activeInvestedAmount * 100) / 100,
                lockedProfit: Math.round(totalLockedProfit * 100) / 100,
                referralCode: user.referralCode || null,
                referralCount: user.referralCount || 0,
            },
        });
    } catch (err) {
        console.error("user/me error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}