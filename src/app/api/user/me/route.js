import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import Recharge from "../../../models/Recharge";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        console.log("TOKEN:", token);

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // include balance and email
        const user = await User.findById(token.id).select("balance email");

        // determine amount of most recent *confirmed* recharge for display purposes
        let lastConfirmedAmount = null;
        try {
            const last = await Recharge.findOne({ user: token.id, status: "confirmed" })
                .sort({ confirmedAt: -1 })
                .select("amount")
                .lean();
            if (last) lastConfirmedAmount = last.amount;
        } catch (e) {
            console.warn("user/me: failed to lookup last confirmed recharge", e);
        }

        return NextResponse.json({ data: { ...user.toObject(), lastConfirmedAmount } });

    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
