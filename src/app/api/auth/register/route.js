import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import limiter from "../../../lib/rateLimiter";
import bcrypt from "bcrypt";
import crypto from "crypto";

async function generateUniqueReferralCode(len = 8) {
    // Fast native crypto-based hex string, uppercase
    for (let i = 0; i < 6; i++) {
        const code = crypto.randomBytes(Math.ceil(len / 2)).toString("hex").slice(0, len).toUpperCase();
        const exists = await User.findOne({ referralCode: code }).lean();
        if (!exists) return code;
    }
    throw new Error("Unable to generate unique referral code");
}

export async function POST(req) {
    try {
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "local";

        // rate limit per IP
        const { allowed, reset } = await limiter.consume(`register:${ip}`);
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) } });
        }

        const body = await req.json();
        const { username, email, password, passwordConfirm, referral } = body || {};
        if (!username || !email || !password || !passwordConfirm) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        if (password !== passwordConfirm) {
            return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
        }

        await connectDB();

        const normalized = String(email).trim().toLowerCase();
        let user = await User.findOne({ email: normalized }).select("+isVerified");

        // If already verified, cannot register again with same email
        if (user && user.isVerified) {
            return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }

        // handle referrer (optional) — find the user who owns that code
        let referrerUser = null;
        if (referral) {
            const code = String(referral).trim().toUpperCase();
            referrerUser = await User.findOne({ referralCode: code }).lean();
        }

        // ensure the new user has a unique referralCode
        const myReferral = await generateUniqueReferralCode(8);

        if (!user) {
            user = await User.create({ username, email: normalized, password, isVerified: true, referralCode: myReferral, referredBy: referrerUser?._id || undefined });
        } else {
            // update existing unverified user
            user.username = username || user.username;
            user.isVerified = true;
            user.referralCode = user.referralCode || myReferral;
            if (referrerUser?._id) user.referredBy = referrerUser._id;
            await user.save();
        }

        // If there was a valid referrer, increment their referralCount (atomic)
        if (referrerUser?._id) {
            await User.updateOne({ _id: referrerUser._id }, { $inc: { referralCount: 1 } }).catch((e) => console.warn("increment referralCount failed", e));
        }

        return NextResponse.json({ status: "created" }, { status: 201 });
    } catch (err) {
        console.error("/api/auth/register error", err);

        // Helpful message for common misconfiguration during development
        if (err?.message?.includes("MONGODB_URI")) {
            return NextResponse.json({ error: "Server misconfiguration: missing MONGODB_URI" }, { status: 500 });
        }

        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
