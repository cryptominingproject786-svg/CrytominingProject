// app/api/recharge/admin/route.js  (or pages/api/recharge/admin.js — adjust as needed)
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import Recharge from "../../../models/Recharge";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

/**
 * GET /api/recharge/admin?page=1&limit=20
 *
 * Returns a paginated list of recharges with full pagination metadata:
 *   { data, page, limit, total, pageCount, hasMore }
 *
 * Previously this endpoint was missing pageCount / hasMore, causing the
 * client-side Next/Previous buttons to stay permanently disabled.
 */
export async function GET(req) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const token = await getToken({
            req,
            secret:
                process.env.AUTH_SECRET ||
                process.env.NEXTAUTH_SECRET ||
                process.env.SECRET,
        });

        if (!token || token.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── Query params ─────────────────────────────────────────────────────────
        const { searchParams } = new URL(req.url);

        // page is 1-indexed; clamp to a safe minimum of 1
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

        // limit: default 20, max 100 to avoid oversized payloads
        const limit = Math.min(
            Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
            100
        );

        const skip = (page - 1) * limit;

        await connectDB();

        // ── Run count + data query in parallel for performance ───────────────────
        const [total, recharges] = await Promise.all([
            Recharge.countDocuments({}),
            Recharge.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate(
                    "user",
                    "username email phone balance investedAmount totalEarnings dailyProfit"
                )
                .lean(),
        ]);

        // ── Derive pagination metadata ────────────────────────────────────────────
        const pageCount = Math.max(1, Math.ceil(total / limit));
        const hasMore = page < pageCount;

        // ── Serialize: strip binary slip.data, expose only hasData flag ──────────
        const serialized = recharges.map((r) => ({
            _id: String(r._id),
            user: r.user
                ? {
                    _id: String(r.user._id),
                    username: r.user.username,
                    email: r.user.email,
                    phone: r.user.phone || null,
                    balance: r.user.balance ?? 0,
                    investedAmount: r.user.investedAmount ?? 0,
                    totalEarnings: r.user.totalEarnings ?? 0,
                    dailyProfit: r.user.dailyProfit ?? 0,
                }
                : null,
            amount: r.amount,
            network: r.network,
            txId: r.txId,
            status: r.status,
            createdAt: r.createdAt,
            // Only expose whether a slip exists — never send binary data in list view
            slip: { hasData: !!(r.slip?.data) },
        }));

        return NextResponse.json(
            {
                data: serialized,
                // ── Pagination metadata the client depends on ──────────────────────
                page,       // current page (1-indexed)
                limit,      // items per page
                total,      // total documents in collection
                pageCount,  // total number of pages
                hasMore,    // true if there is a next page
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("GET /api/recharge/admin error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}