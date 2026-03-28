"use server";

import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import Investment from "../../../models/Investment";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    try {
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const userId = token.id;

        // 🔥 PARALLEL FETCH (faster)
        const [user, investments] = await Promise.all([
            User.findById(userId)
                .select("username email balance referralCode referralCount")
                .lean(),

            Investment.find({
                user: userId,
                status: "active",
            })
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

            const totalProfit =
                inv.totalProfit || inv.dailyProfit * inv.cycleDays;

            const claimed = inv.claimedProfit || 0;

            const last = new Date(inv.lastProfitAt || inv.startDate).getTime();
            const secondsPassed = (now - last) / 1000;

            const profit =
                secondsPassed * (inv.dailyProfit / DAY_SECONDS);

            const updatedClaimed = claimed + profit;

            // 🔥 Increasing profit (UI friendly)
            totalLockedProfit += updatedClaimed;
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