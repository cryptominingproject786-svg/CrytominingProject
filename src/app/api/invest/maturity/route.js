import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import Investment from "../../../models/Investment";
import { getToken } from "next-auth/jwt";
export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET });

        if (!token || !token.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { investmentId } = await req.json();

        if (!investmentId) {
            return NextResponse.json({ error: "Investment ID required" }, { status: 400 });
        }

        // Get the investment
        const investment = await Investment.findById(investmentId);

        if (!investment) {
            return NextResponse.json({ error: "Investment not found" }, { status: 404 });
        }

        if (investment.user.toString() !== token.id.toString()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Check if investment has matured
        const now = Date.now();
        const maturityTime = new Date(investment.maturityDate).getTime();

        if (now < maturityTime) {
            return NextResponse.json({
                error: "Investment has not matured yet",
                matureIn: Math.ceil((maturityTime - now) / (1000 * 60 * 60 * 24)) + " days"
            }, { status: 400 });
        }

        if (investment.status === "completed") {
            return NextResponse.json({ error: "Investment already claimed" }, { status: 400 });
        }

        // Calculate total profit - use stored totalProfit which is the full promised profit
        // This ensures full profit is returned regardless of actual maturity time
        const totalProfitForCycle = investment.totalProfit || (investment.dailyProfit * investment.cycleDays) || 0;

        // Amount to be returned (principal + full promised profit)
        const maturityAmount = investment.amount + totalProfitForCycle;

        // Update investment status
        await Investment.findByIdAndUpdate(investmentId, {
            status: "completed",
            claimedProfit: totalProfitForCycle
        });

        // Return principal and all profit to user's balance
        const updatedUser = await User.findByIdAndUpdate(
            token.id,
            {
                $inc: {
                    balance: maturityAmount,
                    investedAmount: -investment.amount  // Reduce invested amount
                }
            },
            { new: true }
        );

        console.log(`Investment ${investmentId} claimed. User ${token.id} received $${maturityAmount.toFixed(2)}`);

        return NextResponse.json({
            success: true,
            message: "Investment matured and claimed successfully",
            data: {
                principalReturned: investment.amount,
                profitEarned: Math.round(totalProfitForCycle * 100) / 100,
                totalReceived: Math.round(maturityAmount * 100) / 100,
                newBalance: Math.round(updatedUser.balance * 100) / 100,
                daysHeld: investment.cycleDays
            }
        });

    } catch (err) {
        console.error("invest/maturity error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

/**
 * GET /api/invest/maturity
 * Fetch matured investments ready to claim
 */
export async function GET(req) {
    try {
        const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET });

        if (!token || !token.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const now = Date.now();

        // Get active investments that have matured
        const maturedInvestments = await Investment.find({
            user: token.id,
            status: "active",
            maturityDate: { $lte: new Date(now) }
        }).lean();

        const investmentData = maturedInvestments.map(inv => {
            // Use stored totalProfit which is the full promised profit for the cycle
            const totalProfitForCycle = inv.totalProfit || (inv.dailyProfit * inv.cycleDays) || 0;

            return {
                investmentId: inv._id,
                minerName: inv.minerName,
                amount: inv.amount,
                cycleDays: inv.cycleDays,
                totalProfit: Math.round(totalProfitForCycle * 100) / 100,
                totalReceivable: Math.round((inv.amount + totalProfitForCycle) * 100) / 100,
                startDate: inv.startDate,
                maturityDate: inv.maturityDate
            };
        });

        return NextResponse.json({
            data: investmentData,
            count: investmentData.length,
            totalClaimable: Math.round(
                investmentData.reduce((sum, inv) => sum + inv.totalReceivable, 0) * 100
            ) / 100
        });

    } catch (err) {
        console.error("invest/maturity GET error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
