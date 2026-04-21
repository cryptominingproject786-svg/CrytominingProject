import { NextResponse } from "next/server";
import connectDB from "../../lib/mongoDb";
import User from "../../models/User";
import Investment from "../../models/Investment";
import ReferralBonus from "../../models/ReferralBonus";
import { getAuthToken, getAuthUserId } from "../../lib/authToken";
import mongoose from "mongoose";
export const dynamic = 'force-dynamic';


export async function POST(req) {
    try {
        const token = await getAuthToken(req);
        const userId = getAuthUserId(token);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await req.json();
        const { minerName, amount, investmentCycle, monthlyRoR, dailyProfit, totalProfit, totalReturn } = body || {};

        // Validate required fields
        if (!minerName || amount == null || investmentCycle == null || monthlyRoR == null ||
            dailyProfit == null || totalProfit == null || totalReturn == null) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const numAmount = Number(amount);
        if (Number.isNaN(numAmount) || numAmount <= 0) {
            return NextResponse.json(
                { error: "Invalid investment amount" },
                { status: 400 }
            );
        }

        // Minimum investment is $5
        const MIN_INVESTMENT = 5;
        if (numAmount < MIN_INVESTMENT) {
            return NextResponse.json(
                { error: `Minimum investment is $${MIN_INVESTMENT}` },
                { status: 400 }
            );
        }

        // Find the user
        const user = await User.findById(userId).select("balance username email referredBy activeInvestmentsCount referralDailyLastPaidAt firstInvestmentAt");
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has sufficient balance
        if (user.balance < numAmount) {
            return NextResponse.json(
                { error: "Insufficient balance", availableBalance: user.balance },
                { status: 400 }
            );
        }

        const priorInvestmentCount = await Investment.countDocuments({ user: user._id });
        const isFirstInvestment = priorInvestmentCount === 0;

        // Calculate maturity date based on investment cycle (in days)
        const startDate = new Date();
        const maturityDate = new Date(startDate.getTime() + investmentCycle * 24 * 60 * 60 * 1000);

        // Create investment record
        const investment = await Investment.create({
            user: userId,
            minerName,
            amount: numAmount,
            cycleDays: investmentCycle,  // Map to correct schema field name
            monthlyRoR,
            dailyProfit: Number(dailyProfit),
            totalProfit: Number(totalProfit),
            totalReturn: Number(totalReturn),
            startDate,
            maturityDate,
        });

        const userUpdate = {
            $inc: {
                balance: -numAmount,
                investedAmount: numAmount,
                activeInvestmentsCount: 1,
            },
            $addToSet: {
                investments: investment._id,
            },
        };

        if (isFirstInvestment) {
            userUpdate.$set = { firstInvestmentAt: startDate };
        }

        if (user.referredBy && !user.referralDailyLastPaidAt) {
            userUpdate.$set = {
                ...(userUpdate.$set || {}),
                referralDailyLastPaidAt: user.firstInvestmentAt || startDate,
            };
        }

        await User.updateOne({ _id: userId }, userUpdate);

        if (isFirstInvestment && user.referredBy) {
            const parentId = user.referredBy;
            const bonusAmount = 0.25;

            const bonus = await ReferralBonus.findOneAndUpdate(
                {
                    parent: parentId,
                    referredUser: user._id,
                    type: "firstReferralBonus",
                },
                {
                    $setOnInsert: {
                        parent: parentId,
                        referredUser: user._id,
                        investment: investment._id,
                        amount: bonusAmount,
                        description: "First referral investment bonus",
                        awardedAt: new Date(),
                        type: "firstReferralBonus",
                    },
                },
                {
                    upsert: true,
                    new: false,
                    setDefaultsOnInsert: true,
                }
            );

            if (!bonus) {
                await User.updateOne(
                    { _id: parentId },
                    { $inc: { balance: bonusAmount, teamEarnings: bonusAmount } }
                );
            }
        }

        console.info("/api/invest created", {
            investmentId: investment._id.toString(),
            userId,
            minerName,
            amount: numAmount,
            investmentCycle,
            maturityDate,
        });

        return NextResponse.json(
            {
                status: "success",
                data: {
                    investmentId: investment._id,
                    newBalance: user.balance,
                    investment,
                },
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("/api/invest error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

/**
 * GET /api/invest
 * Fetch user's investments
 */
export async function GET(req) {
    try {
        const token = await getAuthToken(req);
        const userId = getAuthUserId(token);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const investments = await Investment.find({ user: userId, status: "active" })
            .sort({ createdAt: -1 })
            .limit(100)
            .select("minerName amount dailyProfit totalProfit totalReturn startDate maturityDate claimedProfit")
            .lean();

        console.info("/api/invest GET fetched", { user: userId, count: investments.length });
        return NextResponse.json({ data: investments }, { status: 200 });
    } catch (err) {
        console.error("/api/invest GET error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
