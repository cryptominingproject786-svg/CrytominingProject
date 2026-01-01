import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import bcrypt from "bcrypt";

export async function POST(req) {
    try {
        const body = await req.json();
        const { email, otp } = body || {};
        if (!email || !otp) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        await connectDB();
        const normalized = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalized }).select("+otp +otpExpiry +isVerified +password");
        if (!user) return NextResponse.json({ error: "Invalid code or email" }, { status: 400 });

        if (user.isVerified) return NextResponse.json({ error: "Already verified" }, { status: 400 });
        if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) return NextResponse.json({ error: "OTP expired or invalid" }, { status: 400 });

        const valid = await bcrypt.compare(String(otp), user.otp);
        if (!valid) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

        // mark verified and clear OTP
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return NextResponse.json({ status: "verified" }, { status: 200 });
    } catch (err) {
        console.error("/api/auth/register/verify error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
