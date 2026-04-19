import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import { getToken } from "next-auth/jwt";
import User from "../../../models/User";
import Withdraw from "../../../models/Withdraw";
import Recharge from "../../../models/Recharge";
import ReferralBonus from "../../../models/ReferralBonus";
import Investment from "../../../models/Investment";

export const dynamic = "force-dynamic";

const DAY_SECONDS = 86_400;

// ─── Validators ──────────────────────────────────────────────────────────────
const VALIDATORS = {
    TRC20: (txid) => txid.length >= 20,
    BEP20: (txid) => txid.startsWith("0x"),
};

const ERROR_MSGS = {
    TRC20: "Invalid TRC20 TXID (minimum 20 characters)",
    BEP20: "BEP20 TXID must start with 0x",
};

// ─── Shared auth + db bootstrap ──────────────────────────────────────────────
async function bootstrap(req) {
    const [token] = await Promise.all([
        getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET }),
        connectDB(),           // connect while token is being verified
    ]);
    return token;
}

// ─── Reusable adminInvoice serialiser ────────────────────────────────────────
function serializeInvoice(adminInvoice) {
    if (!adminInvoice) return null;
    if (typeof adminInvoice === "string" && adminInvoice.startsWith("data:"))
        return adminInvoice;

    const { data, contentType } = adminInvoice ?? {};
    if (!data || !contentType) return null;

    let b64 = null;
    if (Buffer.isBuffer(data)) b64 = data.toString("base64");
    else if (data?.buffer) b64 = Buffer.from(data.buffer).toString("base64");
    else if (typeof data === "string") b64 = data;

    return b64 ? `data:${contentType};base64,${b64}` : null;
}

// ─── POST /api/withdraw ───────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const token = await bootstrap(req);
        if (!token?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json().catch(() => null);
        if (!body)
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

        const { network, txId, amount } = body;

        if (!["TRC20", "BEP20"].includes(network))
            return NextResponse.json({ error: "Invalid network" }, { status: 400 });

        if (!txId || typeof txId !== "string" || !txId.trim())
            return NextResponse.json({ error: "TXID is required" }, { status: 400 });

        const trimmedTxId = txId.trim();

        if (!VALIDATORS[network](trimmedTxId))
            return NextResponse.json({ error: ERROR_MSGS[network] }, { status: 400 });

        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0 || !isFinite(numAmount))
            return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });

        // ── Fire balance check + duplicate check in parallel ─────────────────────
        const [user, duplicate] = await Promise.all([
            User.findById(token.id).select("balance").lean(),
            Withdraw.findOne({ user: token.id, txId: trimmedTxId, status: "pending" })
                .select("_id")
                .lean(),
        ]);

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.balance < numAmount)
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

        if (duplicate)
            return NextResponse.json(
                { error: "A pending withdrawal with this TXID already exists" },
                { status: 409 }
            );

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
        const token = await bootstrap(req);
        if (!token?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // ── All 4 DB queries fire simultaneously ──────────────────────────────────
        const [user, withdrawRequests, totalWithdrawalsResult, activeInvestments, rechargeHistory, referralBonuses] =
            await Promise.all([
                User.findById(token.id)
                    .select("balance reservedBalance investedAmount totalEarnings teamEarnings dailyProfit referralCode referralCount")
                    .lean(),

                Withdraw.find({ user: token.id })
                    .sort({ requestedAt: -1 })
                    .limit(10)
                    .select("network txId amount status requestedAt adminInvoice")
                    .lean(),

                Withdraw.aggregate([
                    { $match: { user: token.id, status: "approved" } },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ]),

                Investment.find({ user: token.id, status: "active" })
                    .select("amount dailyProfit cycleDays claimedProfit lastProfitAt startDate maturityDate totalProfit")
                    .lean(),

                Recharge.find({ user: token.id })
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .select("network amount txId status createdAt")
                    .lean(),

                ReferralBonus.find({ parent: token.id })
                    .sort({ awardedAt: -1 })
                    .limit(20)
                    .select("amount description awardedAt type")
                    .lean(),
            ]);

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        // ── Compute locked profit ─────────────────────────────────────────────────
        const now = Date.now();
        let computedLockedProfit = 0;

        for (const inv of activeInvestments) {
            if (!inv?.startDate || !inv?.maturityDate) continue;
            if (now >= new Date(inv.maturityDate).getTime()) continue;

            const totalProfit = inv.totalProfit || inv.dailyProfit * inv.cycleDays || 0;
            const claimed = inv.claimedProfit || 0;
            const lastTimestamp = new Date(inv.lastProfitAt || inv.startDate).getTime();
            const secondsPassed = Math.max(0, (now - lastTimestamp) / 1000);

            computedLockedProfit += claimed + secondsPassed * (inv.dailyProfit / DAY_SECONDS);
        }

        const lockedProfit = Math.max(
            0,
            Math.round((computedLockedProfit || user.dailyProfit || 0) * 100) / 100
        );

        const qualifiedReferralCount = await User.countDocuments({
            referredBy: token.id,
            firstInvestmentAt: { $exists: true },
        });

        const availableBalance = Math.max(
            0,
            (user.balance ?? 0) - (user.reservedBalance ?? 0)
        );

        return NextResponse.json({
            data: {
                balance: availableBalance,
                rawBalance: user.balance ?? 0,
                reservedBalance: user.reservedBalance ?? 0,
                lockedProfit,
                investedAmount: user.investedAmount ?? 0,
                referralCode: user.referralCode || "—",
                teamMembersCount: user.referralCount ?? 0,
                qualifiedReferralsCount: qualifiedReferralCount,
                teamEarnings: user.teamEarnings ?? 0,
                totalWithdrawals: totalWithdrawalsResult[0]?.total ?? 0,
                referralCount: user.referralCount ?? 0,
                withdrawRequests: withdrawRequests.map((w) => ({
                    id: String(w._id),
                    network: w.network,
                    txId: w.txId,
                    amount: w.amount,
                    status: w.status,
                    requestedAt: w.requestedAt,
                    adminInvoice: serializeInvoice(w.adminInvoice),
                })),
                rechargeHistory: rechargeHistory.map((r) => ({
                    id: String(r._id),
                    network: r.network,
                    amount: r.amount,
                    txId: r.txId,
                    status: r.status,
                    createdAt: r.createdAt,
                })),
                referralBonuses: referralBonuses.map((bonus) => ({
                    id: String(bonus._id),
                    amount: bonus.amount,
                    description: bonus.description,
                    awardedAt: bonus.awardedAt,
                    type: bonus.type,
                })),
            },
        });
    } catch (err) {
        console.error("GET /api/user/wallet error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}