import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import { processReferralDailyBonuses } from "../../../lib/referralDailyBonus";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const secret = url.searchParams.get("secret") || req.headers.get("x-daily-referral-secret");
        const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 200));

        if (!process.env.DAILY_REFERRAL_SECRET || secret !== process.env.DAILY_REFERRAL_SECRET) {
            console.log("ENV SECRET:", process.env.DAILY_REFERRAL_SECRET);
            console.log("REQUEST SECRET:", secret);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const result = await processReferralDailyBonuses({ limit, now: new Date() });

        return NextResponse.json(
            {
                message: "Referral daily bonuses processed",
                processed: result.processed,
                totalAmount: result.totalAmount,
                dueCount: result.dueCount,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("/api/referral/daily-bonus error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
