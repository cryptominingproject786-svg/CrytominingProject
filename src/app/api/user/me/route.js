"use server";

import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import Recharge from "../../../models/Recharge";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // ✅ Explicitly select balance field
        const user = await User.findById(token.id || token.sub)
            .select("username email balance role investedAmount totalEarnings dailyProfit")
            .lean();

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // ✅ Ensure balance is always a number and properly rounded to 2 decimals
        const balance = typeof user.balance === "number"
            ? Math.round(user.balance * 100) / 100
            : 0;

        // Fetch last confirmed recharge for display context
        let lastConfirmedAmount = null;
        try {
            const last = await Recharge.findOne({ user: user._id, status: "confirmed" })
                .sort({ confirmedAt: -1 })
                .select("amount")
                .lean();
            if (last) lastConfirmedAmount = last.amount;
        } catch (e) {
            console.warn("user/me: failed to lookup last confirmed recharge", e);
        }

        return NextResponse.json({
            data: {
                ...user,
                balance,           // ✅ real spendable wallet balance
                lastConfirmedAmount, // for display context only
            }
        });

    } catch (err) {
        console.error("user/me error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}