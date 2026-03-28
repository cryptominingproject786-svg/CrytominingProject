import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import { getToken } from "next-auth/jwt";
import User from "../../../models/User";
import Withdraw from "../../../models/Withdraw";
import Investment from "../../../models/Investment";

// ─── Validators (mirrors withdrawmodal.jsx client-side rules) ────────────────
const VALIDATORS = {
    TRC20: (txid) => txid.length >= 20,
    BEP20: (txid) => txid.startsWith("0x"),
};

const ERROR_MSGS = {
    TRC20: "Invalid TRC20 TXID (minimum 20 characters)",
    BEP20: "BEP20 TXID must start with 0x",
};

// ─── POST /api/withdraw ──────────────────────────────────────────────────────
export async function POST(req) {
    try {
        // ── Auth ─────────────────────────────────────────────────────────────────
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── Parse body ───────────────────────────────────────────────────────────
        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const { network, txId, amount } = body;

        // ── Input validation ─────────────────────────────────────────────────────
        if (!["TRC20", "BEP20"].includes(network)) {
            return NextResponse.json({ error: "Invalid network" }, { status: 400 });
        }

        if (!txId || typeof txId !== "string" || !txId.trim()) {
            return NextResponse.json({ error: "TXID is required" }, { status: 400 });
        }

        const trimmedTxId = txId.trim();

        if (!VALIDATORS[network](trimmedTxId)) {
            return NextResponse.json({ error: ERROR_MSGS[network] }, { status: 400 });
        }

        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0 || !isFinite(numAmount)) {
            return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
        }

        // ── DB ───────────────────────────────────────────────────────────────────
        await connectDB();

        const user = await User.findById(token.id).select("balance").lean();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.balance < numAmount) {
            return NextResponse.json(
                { error: "Insufficient balance" },
                { status: 400 }
            );
        }

        // Prevent duplicate pending withdrawals (same TXID + same user)
        const duplicate = await Withdraw.findOne({
            user: token.id,
            txId: trimmedTxId,
            status: "pending",
        }).lean();

        if (duplicate) {
            return NextResponse.json(
                { error: "A pending withdrawal with this TXID already exists" },
                { status: 409 }
            );
        }

        // ── Create withdraw request (balance NOT deducted until admin approves) ──
        const withdraw = await Withdraw.create({
            user: token.id,
            network,
            txId: trimmedTxId,
            amount: numAmount,
            status: "pending",
            requestedAt: new Date(),
        });

        return NextResponse.json(
            {
                message: "Withdrawal request submitted successfully",
                data: {
                    id: withdraw._id,
                    network: withdraw.network,
                    txId: withdraw.txId,
                    amount: withdraw.amount,
                    status: withdraw.status,
                    requestedAt: withdraw.requestedAt,
                },
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("POST /api/withdraw error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// ─── GET /api/user/wallet ─────────────────────────────────────────────────────
export async function GET(req) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(token.id)
            .select("balance investedAmount totalEarnings dailyProfit referralCode referralCount")
            .lean();

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const withdrawRequests = await Withdraw.find({ user: token.id })
            .sort({ requestedAt: -1 })
            .limit(10)
            .select("network txId amount status requestedAt adminInvoice")
            .lean();

        const totalWithdrawals = await Withdraw.aggregate([
            { $match: { user: user._id, status: "approved" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        const activeInvestments = await Investment.find({
            user: token.id,
            status: "active",
        })
            .select("amount dailyProfit cycleDays claimedProfit lastProfitAt startDate maturityDate")
            .lean();

        const now = Date.now();
        const DAY_SECONDS = 86400;

        let computedLockedProfit = 0;
        for (const inv of activeInvestments) {
            if (!inv || !inv.startDate || !inv.maturityDate) continue;

            const maturityTime = new Date(inv.maturityDate).getTime();
            if (now >= maturityTime) continue; // fully matured

            const totalProfit = inv.totalProfit || (inv.dailyProfit * inv.cycleDays) || 0;
            const claimed = inv.claimedProfit || 0;

            const lastTimestamp = new Date(inv.lastProfitAt || inv.startDate).getTime();
            const secondsPassed = Math.max(0, (now - lastTimestamp) / 1000);
            const profitSinceLast = secondsPassed * (inv.dailyProfit / DAY_SECONDS);

            computedLockedProfit += claimed + profitSinceLast;
        }

        // minimum fallback to current user.dailyProfit for old accounts
        const lockedProfit = Math.max(0, Math.round((computedLockedProfit || user.dailyProfit || 0) * 100) / 100);

        return NextResponse.json({
            data: {
                balance: user.balance ?? 0,
                lockedProfit,
                investedAmount: user.investedAmount ?? 0,
                referralCode: user.referralCode || "—",
                teamMembersCount: user.referralCount ?? 0,
                teamEarnings: user.totalEarnings ?? 0,
                totalWithdrawals: totalWithdrawals[0]?.total ?? 0,
                referralCount: user.referralCount ?? 0,
                withdrawRequests: withdrawRequests.map((w) => ({
                    id: String(w._id),
                    network: w.network,
                    txId: w.txId,
                    amount: w.amount,
                    status: w.status,
                    requestedAt: w.requestedAt,
                    adminInvoice: w.adminInvoice || null,
                })),
            },
        });
    } catch (err) {
        console.error("GET /api/user/wallet error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}