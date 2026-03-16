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
        let activeInvestedAmount = 0;
        const bulkUpdates = [];
        let principalToReturn = 0; // Amount to return from matured investments

        for (const inv of investments) {
            const maturityTime = new Date(inv.maturityDate).getTime();
            const isMatured = now >= maturityTime;

            if (isMatured) {
                // 🔴 INVESTMENT MATURED - Return principal + full promised profit
                // Use the totalProfit field which was calculated and stored when investment was created
                // This ensures the full promised profit is returned regardless of actual maturity time
                const totalProfitForCycle = inv.totalProfit || (inv.dailyProfit * inv.cycleDays) || 0;
                const remainingProfit = Math.max(0, totalProfitForCycle - (inv.claimedProfit || 0));

                // Return principal + full remaining profit
                principalToReturn += inv.amount + remainingProfit;

                // Mark as completed
                bulkUpdates.push({
                    updateOne: {
                        filter: { _id: inv._id },
                        update: {
                            $set: {
                                status: "completed",
                                claimedProfit: totalProfitForCycle
                            }
                        }
                    }
                });

                console.log(`Investment ${inv._id} matured. Returning $${inv.amount} principal + $${remainingProfit.toFixed(2)} profit (Total: $${(inv.amount + remainingProfit).toFixed(2)})`);
            } else {
                // 🟢 ACTIVE INVESTMENT - Calculate daily profit
                activeInvestedAmount += inv.amount;

                const last = new Date(inv.lastProfitAt || inv.startDate).getTime();
                const secondsPassed = (now - last) / 1000;
                const profitPerSecond = inv.dailyProfit / DAY_SECONDS;
                const profit = secondsPassed * profitPerSecond;

                if (profit > 0) {
                    generatedProfit += profit;

                    bulkUpdates.push({
                        updateOne: {
                            filter: { _id: inv._id },
                            update: {
                                $set: {
                                    lastProfitAt: new Date(now)
                                },
                                $inc: { claimedProfit: profit }
                            }
                        }
                    });
                }
            }
        }

        // 🔹 Update investments in ONE query
        if (bulkUpdates.length > 0) {
            await Investment.bulkWrite(bulkUpdates);
        }

        // 🔹 Calculate total balance change
        const totalBalanceIncrease = generatedProfit + principalToReturn;

        // 🔹 Update user investments and balance
        if (totalBalanceIncrease > 0 || principalToReturn > 0) {
            const updatePayload = {};
            if (totalBalanceIncrease > 0) {
                updatePayload.$inc = { balance: totalBalanceIncrease };
            }
            // Update investedAmount to only active investments
            updatePayload.investedAmount = activeInvestedAmount;

            await User.updateOne({ _id: userId }, updatePayload);
        } else if (principalToReturn === 0 && activeInvestedAmount !== user.investedAmount) {
            // Just update investedAmount if no balance change
            await User.updateOne({ _id: userId }, { investedAmount: activeInvestedAmount });
        }

        // 🔹 Get updated user
        const updatedUser = await User.findById(userId)
            .select("username email balance role investedAmount totalEarnings dailyProfit")
            .lean();

        const walletBalance = Math.round(updatedUser.balance * 100) / 100;

        const totalAssets = Math.round(
            (walletBalance + activeInvestedAmount) * 100
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
                investedAmount: activeInvestedAmount,
                generatedProfit: Math.round(generatedProfit * 100) / 100,
                totalAssets,
                lastConfirmedAmount,
                maturedReturns: Math.round(principalToReturn * 100) / 100 // New field showing matured amounts
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