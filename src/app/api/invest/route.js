import { NextResponse } from "next/server";
import connectDB from "../../lib/mongoDb";
import User from "../../models/User";
import Investment from "../../models/Investment";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";


export async function POST(req) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!token || !token.id) {
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

        // Minimum investment is $10
        const MIN_INVESTMENT = 10;
        if (numAmount < MIN_INVESTMENT) {
            return NextResponse.json(
                { error: `Minimum investment is $${MIN_INVESTMENT}` },
                { status: 400 }
            );
        }

        // Find the user
        const user = await User.findById(token.id).select("balance username email");
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

        // Deduct amount from user balance with proper precision (round to 2 decimals)
        user.balance = Math.round((user.balance - numAmount) * 100) / 100;
        user.investedAmount = Math.round(((user.investedAmount || 0) + numAmount) * 100) / 100;
        await user.save();

        // Calculate maturity date based on investment cycle (in days)
        const startDate = new Date();
        const maturityDate = new Date(startDate.getTime() + investmentCycle * 24 * 60 * 60 * 1000);

        // Create investment record
        const investment = await Investment.create({
            user: token.id,
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

        // Add investment reference to user's investments array
        await User.updateOne(
            { _id: token.id },
            { $addToSet: { investments: investment._id } }
        );

        console.info("/api/invest created", {
            investmentId: investment._id.toString(),
            userId: token.id,
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
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!token || !token.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const investments = await Investment.find({ user: token.id })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        console.info("/api/invest GET fetched", { user: token.id, count: investments.length });
        return NextResponse.json({ data: investments }, { status: 200 });
    } catch (err) {
        console.error("/api/invest GET error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
