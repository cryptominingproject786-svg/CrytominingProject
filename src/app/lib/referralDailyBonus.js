import ReferralBonus from "../models/ReferralBonus";
import User from "../models/User";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_REFERRAL_BONUS = 0.25;

function getReferralDailyAnchor(child) {
    if (child.referralDailyLastPaidAt) return new Date(child.referralDailyLastPaidAt);
    if (child.firstInvestmentAt) return new Date(child.firstInvestmentAt);
    return null;
}

export async function settleReferralDailyBonusForChild(childId, upTo = new Date()) {
    const child = await User.findById(childId)
        .select("referredBy activeInvestmentsCount referralDailyLastPaidAt firstInvestmentAt")
        .lean();

    if (!child || !child.referredBy || (child.activeInvestmentsCount || 0) <= 0) {
        return 0;
    }

    const anchor = getReferralDailyAnchor(child);
    if (!anchor) {
        return 0;
    }

    const duePeriods = Math.floor((new Date(upTo).getTime() - anchor.getTime()) / DAY_MS);
    if (duePeriods <= 0) {
        return 0;
    }

    const payoutAmount = Number((duePeriods * DAILY_REFERRAL_BONUS).toFixed(2));
    const nextPaidAt = new Date(anchor.getTime() + duePeriods * DAY_MS);

    const parentUpdated = await User.updateOne(
        { _id: child.referredBy },
        {
            $inc: {
                balance: payoutAmount,
                teamEarnings: payoutAmount,
            },
        }
    );

    if (parentUpdated.modifiedCount === 0) {
        return 0;
    }

    await User.updateOne(
        { _id: childId },
        {
            $set: {
                referralDailyLastPaidAt: nextPaidAt,
            },
        }
    );

    await ReferralBonus.create({
        parent: child.referredBy,
        referredUser: child._id,
        amount: payoutAmount,
        description: "Daily referral bonus for active referred investment",
        awardedAt: new Date(),
        type: "dailyReferralBonus",
    });

    return payoutAmount;
}

export async function processReferralDailyBonuses({ limit = 200, now = new Date() } = {}) {
    const threshold = new Date(now.getTime() - DAY_MS);

    const dueChildren = await User.find({
        referredBy: { $exists: true, $ne: null },
        activeInvestmentsCount: { $gt: 0 },
        $or: [
            { referralDailyLastPaidAt: { $lte: threshold } },
            { referralDailyLastPaidAt: null, firstInvestmentAt: { $lte: threshold } },
        ],
    })
        .select("_id")
        .sort({ referralDailyLastPaidAt: 1, firstInvestmentAt: 1 })
        .limit(limit)
        .lean();

    let processed = 0;
    let totalAmount = 0;

    for (const child of dueChildren) {
        const amount = await settleReferralDailyBonusForChild(child._id, now);
        if (amount > 0) {
            totalAmount += amount;
        }
        processed += 1;
    }

    return {
        processed,
        totalAmount,
        dueCount: dueChildren.length,
    };
}
