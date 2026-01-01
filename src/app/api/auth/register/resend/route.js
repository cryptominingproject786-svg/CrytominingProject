import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import bcrypt from "bcrypt";
import { sendOtpEmail } from "@/app/lib/mailer";

const OTP_EXPIRY_MINUTES = 10;

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

        await connectDB();
        const normalized = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalized }).select("+otp +isVerified");
        if (!user) return NextResponse.json({ error: "Email not found" }, { status: 404 });
        if (user.isVerified) return NextResponse.json({ error: "Already verified" }, { status: 400 });

        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        user.otp = hashedOtp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendOtpEmail(normalized, otp);
        return NextResponse.json({ status: "otp_sent" }, { status: 202 });
    } catch (err) {
        console.error("/api/auth/register/resend error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
