import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET });
        if (!token?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(token.id)
            .select("referralCode referralCount teamEarnings")
            .lean();

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const referrals = await User.find({ referredBy: token.id })
            .select("username createdAt investedAmount firstInvestmentAt referralCount balance activeInvestmentsCount")
            .sort({ createdAt: -1 })
            .lean();

        const getReferralStatus = (ref) => {
            const invested = Boolean(
                ref.firstInvestmentAt ||
                ref.investedAmount > 0 ||
                ref.activeInvestmentsCount > 0
            );

            if (!invested) {
                return "pending";
            }

            return ref.balance === 0 ? "zero" : "qualified";
        };

        const directReferrals = referrals.map((ref) => {
            const status = getReferralStatus(ref);

            return {
                username: ref.username,
                joinedAt: ref.createdAt,
                investedAmount: ref.investedAmount ?? 0,
                balance: ref.balance ?? 0,
                firstInvestmentAt: ref.firstInvestmentAt || null,
                referralCount: ref.referralCount ?? 0,
                status,
                isQualified: status !== "pending",
            };
        });

        const qualifiedReferralsCount = directReferrals.filter((ref) => ref.isQualified).length;

        return NextResponse.json(
            {
                data: {
                    referralCode: user.referralCode || null,
                    teamMembersCount: user.referralCount ?? 0,
                    qualifiedReferralsCount,
                    teamEarnings: user.teamEarnings ?? 0,
                    directReferrals,
                },
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("GET /api/user/team error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
