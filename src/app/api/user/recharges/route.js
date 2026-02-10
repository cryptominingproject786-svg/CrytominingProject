import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import Recharge from "../../../models/Recharge";
import User from "../../../models/User";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";

export async function GET(req) {
    try {
        await connectDB();

        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Resolve userId: prefer _id, else by email
        let userId = token.sub;
        if (!mongoose.Types.ObjectId.isValid(userId) && token.email) {
            const found = await User.findOne({ email: String(token.email).trim().toLowerCase() }).select("_id");
            if (found) userId = found._id;
        }

        const recharges = await Recharge.find({ user: userId }).sort({ createdAt: -1 }).lean();

        const items = recharges.map((r) => {
            const slipData = r.slip?.data ? `data:${r.slip.contentType};base64,${Buffer.from(r.slip.data).toString("base64")}` : null;
            return { ...r, slip: { ...r.slip, dataUrl: slipData } };
        });

        return NextResponse.json({ data: items }, { status: 200 });
    } catch (err) {
        console.error("/api/user/recharges error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}