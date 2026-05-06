import connectDB from "./mongoDb";
import User from "../models/User";
import Investment from "../models/Investment";
import Recharge from "../models/Recharge";
import { getCachedJson, setCachedJson } from "./cache";

const USER_DASHBOARD_CACHE_TTL = 5;

export async function getUserDashboardData(userId) {
    const cacheKey = `user:dashboard:${userId}`;
    const cached = await getCachedJson(cacheKey);
    if (cached) {
        return cached;
    }

    await connectDB();

    const [user, investments, latestRecharge] = await Promise.all([
        User.findById(userId)
            .select("username email balance reservedBalance referralCode referralCount")
            .lean(),
        Investment.find({ user: userId, status: "active" })
            .sort({ createdAt: -1 })
            .limit(100)
            .select("minerName amount dailyProfit totalProfit totalReturn startDate maturityDate claimedProfit status")
            .lean(),
        Recharge.findOne({ user: userId, status: "confirmed" })
            .sort({ createdAt: -1 })
            .select("amount")
            .lean(),
    ]);

    if (!user) {
        return null;
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

    const reservedBalance = Math.max(0, user.reservedBalance || 0);
    const availableBalance = Math.max(0, (user.balance || 0) - reservedBalance);

    const payload = {
        profile: {
            username: user.username,
            email: user.email,
            balance: Math.round(availableBalance * 100) / 100,
            reservedBalance: Math.round(reservedBalance * 100) / 100,
            rawBalance: Math.round((user.balance || 0) * 100) / 100,
            investedAmount: Math.round(activeInvestedAmount * 100) / 100,
            lockedProfit: Math.round(totalLockedProfit * 100) / 100,
            referralCode: user.referralCode || null,
            referralCount: user.referralCount || 0,
            lastConfirmedAmount: latestRecharge?.amount ?? null,
        },
        investments: investments.map((inv) => ({
            ...inv,
            _id: String(inv._id),
            startDate: inv.startDate?.toISOString() || null,
            maturityDate: inv.maturityDate?.toISOString() || null,
        })),
    };

    await setCachedJson(cacheKey, payload, USER_DASHBOARD_CACHE_TTL);
    return payload;
}
