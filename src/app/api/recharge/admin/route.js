import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import Recharge from "../../../models/Recharge";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || token.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const url = new URL(req.url);
        const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);

        const recharges = await Recharge.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("user", "username email")
            .lean();

        const items = recharges.map((r) => {
            const slipData = r.slip?.data ? `data:${r.slip.contentType};base64,${Buffer.from(r.slip.data).toString("base64")}` : null;
            return { ...r, slip: { ...r.slip, dataUrl: slipData } };
        });

        return NextResponse.json({ data: items }, { status: 200 });
    } catch (err) {
        console.error("/api/recharge/admin error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || token.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Find recharges that are not linked to a user but have a submitterEmail
        const candidates = await Recharge.find({ $or: [{ user: { $exists: false } }, { user: null }], submitterEmail: { $exists: true, $ne: null } }).lean();

        let linked = 0;
        for (const r of candidates) {
            try {
                const user = await (await import("../../../models/User")).default.findOne({ email: String(r.submitterEmail).trim().toLowerCase() }).select("_id");
                if (user) {
                    await (await import("../../../models/User")).default.updateOne({ _id: user._id }, { $addToSet: { recharges: r._id }, $set: { lastRechargeAt: r.createdAt } });
                    await Recharge.updateOne({ _id: r._id }, { $set: { user: user._id } });
                    linked += 1;
                }
            } catch (e) {
                console.warn("backfill: failed for recharge", r._id, e);
            }
        }

        return NextResponse.json({ status: "ok", linked }, { status: 200 });
    } catch (err) {
        console.error("/api/recharge/admin/backfill error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
