import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import { getToken } from "next-auth/jwt";
import Withdraw from "../../../models/Withdraw";
import User from "../../../models/User";
export const dynamic = 'force-dynamic';

// ─── GET /api/withdraw/admin ─────────────────────────────────────────────────
// Returns all withdraw requests (newest first), populated with basic user info.
// Only accessible by admin role.
export async function GET(req) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Query params ─────────────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status"); // optional: pending|approved|rejected
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);

    await connectDB();

    const query = {};
    if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
      query.status = statusFilter;
    }

    const withdrawals = await Withdraw.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user", "username email phone balance investedAmount")
      .lean();

    // Serialize adminInvoice Buffer → base64 data URL for the client
    const serialized = withdrawals.map((w) => {
      let adminInvoice = null;
      if (w.adminInvoice?.data && w.adminInvoice?.contentType) {
        adminInvoice = `data:${w.adminInvoice.contentType};base64,${Buffer.from(
          w.adminInvoice.data
        ).toString("base64")}`;
      }

      return {
        _id: String(w._id),
        user: w.user
          ? {
            _id: String(w.user._id),
            username: w.user.username,
            email: w.user.email,
            phone: w.user.phone || null,
            balance: w.user.balance ?? 0,
            investedAmount: w.user.investedAmount ?? 0,
          }
          : null,
        network: w.network,
        txId: w.txId,
        amount: w.amount,
        status: w.status,
        requestedAt: w.requestedAt,
        processedAt: w.processedAt,
        adminInvoice,
        note: w.note,
        createdAt: w.createdAt,
      };
    });

    return NextResponse.json({ data: serialized }, { status: 200 });
  } catch (err) {
    console.error("GET /api/withdraw/admin error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
