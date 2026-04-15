import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import Recharge from "../../../models/Recharge";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        console.log("[Admin-Profile API] 🔵 Request received");

        await connectDB();

        // Get the JWT token
        const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET });
        console.log("[Admin-Profile API] 🔑 Token check:", {
            hasToken: !!token,
            tokenEmail: token?.email,
            tokenRole: token?.role
        });

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // ✅ IMPORTANT: Only admins can access this endpoint
        if (token.role !== "admin") {
            console.error(`[Admin-Profile API] ❌ Access denied: token.role=${token.role} (expected 'admin')`);
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // Determine the user ID
        let userId = token.id || token.sub;
        if (!mongoose.Types.ObjectId.isValid(userId) && token.email) {
            const found = await User.findOne({ email: String(token.email).trim().toLowerCase() }).select("_id");
            if (found) userId = found._id;
        }

        console.log("[Admin-Profile API] 🔍 Looking up user:", { userId, email: token.email });

        // Fetch the admin user with relevant fields
        const user = await User.findById(userId)
            .select("username email role balance investedAmount totalEarnings dailyProfit recharges")
            .lean();

        if (!user) {
            console.error(`[Admin-Profile API] ❌ User not found: ${userId}`);
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        console.log("[Admin-Profile API] 📦 User found:", {
            username: user.username,
            email: user.email,
            role: user.role
        });

        // ✅ IMPORTANT: Verify user has role="admin", not user
        if (user.role !== "admin") {
            console.error(`[Admin-Profile API] ❌ Role mismatch: user.role=${user.role} (expected 'admin')`);
            return NextResponse.json({ error: "Forbidden - Admin account required" }, { status: 403 });
        }

        // ✅ IMPORTANT: Verify email matches (prevent token hijacking)
        if (user.email !== String(token.email).trim().toLowerCase()) {
            console.error(`[Admin-Profile API] ❌ Email mismatch: user.email=${user.email}, token.email=${token.email}`);
            return NextResponse.json({ error: "Unauthorized - Email mismatch" }, { status: 401 });
        }

        // Populate recent recharges
        const rechargeIds = (user.recharges || []).slice(-20).reverse();
        const recharges = await Recharge.find({ _id: { $in: rechargeIds } })
            .sort({ createdAt: -1 })
            .lean();

        const items = recharges.map((r) => {
            const slipData = r.slip?.data
                ? `data:${r.slip.contentType};base64,${Buffer.from(r.slip.data).toString("base64")}`
                : null;
            return { ...r, slip: { ...r.slip, dataUrl: slipData } };
        });

        // ✅ FINAL RESPONSE
        const responseData = {
            data: {
                ...user,
                recharges: items
            }
        };

        console.log("[Admin-Profile API] ✅ Returning response:", {
            username: user.username,
            email: user.email,
            role: user.role
        });

        return NextResponse.json(responseData, { status: 200 });

    } catch (err) {
        console.error("[Admin-Profile API] ❌ Server error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
