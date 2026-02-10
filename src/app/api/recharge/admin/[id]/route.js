import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoDb";
import Recharge from "../../../../models/Recharge";
import User from "../../../../models/User";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";

export async function PATCH(req, { params }) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || token.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = params;
        if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

        const body = await req.json();
        const { status } = body || {};
        if (!status || !["pending", "confirmed", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        await connectDB();

        const recharge = await Recharge.findById(id);
        if (!recharge) return NextResponse.json({ error: "Not found" }, { status: 404 });

        recharge.status = status;
        if (status === "confirmed") {
            recharge.confirmedAt = new Date();
        }
        await recharge.save();

        // If confirmed and linked to a user, we could update user's totals here (optional)
        if (status === "confirmed" && recharge.user) {
            try {
                await User.updateOne({ _id: recharge.user }, { $inc: { totalEarnings: recharge.amount } }).catch(() => { });
            } catch (e) {
                console.warn("admin: failed to update user totals", e);
            }
        }

        const slipData = recharge.slip?.data ? `data:${recharge.slip.contentType};base64,${Buffer.from(recharge.slip.data).toString("base64")}` : null;

        return NextResponse.json({ data: { ...recharge.toObject(), slip: { ...recharge.slip, dataUrl: slipData } } }, { status: 200 });
    } catch (err) {
        console.error("/api/recharge/admin/[id] PATCH error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}