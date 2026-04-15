import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        await connectDB();

        const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET });
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { amount } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 });
        }

        let userId = token.sub;

        // Resolve userId if token.sub is not ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId) && token.email) {
            const user = await User.findOne({ email: token.email });
            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            userId = user._id;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { balance: amount } },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            balance: updatedUser.balance
        });

    } catch (err) {
        console.error("credit-profit error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
