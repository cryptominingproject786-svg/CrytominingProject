import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import Recharge from "../../../models/Recharge";
import User from "../../../models/User";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";

export async function GET(req, { params }) {
    try {
        const { id } = params;
        if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

        await connectDB();

        const recharge = await Recharge.findById(id).populate("user", "username email").lean();
        if (!recharge) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }).catch(() => null);

        // Allow if admin or owner (by user id or by email fallback)
        if (token?.role !== "admin") {
            const tokenUserId = token?.sub;
            const tokenEmail = token?.email;

            let allowed = false;
            if (recharge.user && tokenUserId && recharge.user._id?.toString() === tokenUserId) allowed = true;
            if (!allowed && tokenEmail && recharge.submitterEmail && recharge.submitterEmail === String(tokenEmail).trim().toLowerCase()) allowed = true;

            if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const slipData = recharge.slip?.data ? `data:${recharge.slip.contentType};base64,${Buffer.from(recharge.slip.data).toString("base64")}` : null;

        return NextResponse.json({ data: { ...recharge, slip: { ...recharge.slip, dataUrl: slipData } } }, { status: 200 });
    } catch (err) {
        console.error("/api/recharge/[id] error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}