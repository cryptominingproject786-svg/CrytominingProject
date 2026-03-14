"use server";

import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import Recharge from "../../../models/Recharge";
import Investment from "../../../models/Investment";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    try {

        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const userId = token.id || token.sub;

        const user = await User.findById(userId)
            .select("username email balance role investedAmount totalEarnings dailyProfit")
            .lean();

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 🔹 Get active investments
        const investments = await Investment.find({
            user: userId,
            status: "active"
        }).lean();

        const now = Date.now();
        const DAY_SECONDS = 86400;

        let generatedProfit = 0;
        let investedAmount = 0;

        const bulkUpdates = [];

        for (const inv of investments) {

            investedAmount += inv.amount;

            const last = new Date(inv.lastProfitAt || inv.startDate).getTime();

            const secondsPassed = (now - last) / 1000;

            const profitPerSecond = inv.dailyProfit / DAY_SECONDS;

            const profit = secondsPassed * profitPerSecond;

            if (profit > 0) {

                generatedProfit += profit;

                bulkUpdates.push({
                    updateOne: {
                        filter: { _id: inv._id },
                        update: { lastProfitAt: new Date(now) }
                    }
                });
            }
        }

        // 🔹 Update investments in ONE query
        if (bulkUpdates.length > 0) {
            await Investment.bulkWrite(bulkUpdates);
        }

        // 🔹 Update user balance
        if (generatedProfit > 0) {
            await User.updateOne(
                { _id: userId },
                { $inc: { balance: generatedProfit } }
            );
        }

        // 🔹 Get updated user
        const updatedUser = await User.findById(userId)
            .select("username email balance role investedAmount totalEarnings dailyProfit")
            .lean();

        const walletBalance = Math.round(updatedUser.balance * 100) / 100;

        const totalAssets = Math.round(
            (walletBalance + investedAmount) * 100
        ) / 100;

        // 🔹 Last confirmed recharge
        let lastConfirmedAmount = null;

        const lastRecharge = await Recharge.findOne({
            user: userId,
            status: "confirmed"
        })
            .sort({ createdAt: -1 })
            .select("amount")
            .lean();

        if (lastRecharge) {
            lastConfirmedAmount = lastRecharge.amount;
        }

        return NextResponse.json({
            data: {
                ...updatedUser,
                balance: walletBalance,
                investedAmount,
                generatedProfit: Math.round(generatedProfit * 100) / 100,
                totalAssets,
                lastConfirmedAmount
            }
        });

    } catch (err) {

        console.error("user/me error:", err);

        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}