import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import connectDB from "../../../../lib/mongoDb";
import Withdraw from "../../../../models/Withdraw";
import User from "../../../../models/User";

// ─── Shared helpers ───────────────────────────────────────────────────────────
async function bootstrap(req) {
  const [token] = await Promise.all([
    getToken({ req, secret: process.env.NEXTAUTH_SECRET }),
    connectDB(),
  ]);
  return token;
}

function isAdminAuthed(token) {
  return token?.role === "admin";
}

function calcFee(amount, rate) {
  return Math.round(amount * rate * 100) / 100;
}

function calcNetAmount(amount, fee) {
  return Math.round((amount - fee) * 100) / 100;
}

function serializeInvoice(adminInvoice) {
  if (!adminInvoice?.data || !adminInvoice?.contentType) return null;
  const buf = Buffer.isBuffer(adminInvoice.data)
    ? adminInvoice.data
    : Buffer.from(adminInvoice.data);
  return `data:${adminInvoice.contentType};base64,${buf.toString("base64")}`;
}

function serializeUser(user) {
  if (!user) return null;
  return {
    _id: String(user._id),
    username: user.username,
    email: user.email,
    phone: user.phone || null,
    balance: user.balance ?? 0,
    investedAmount: user.investedAmount ?? 0,
    referralCode: user.referralCode,
  };
}

// ─── GET /api/withdraw/admin/[id] ────────────────────────────────────────────
export async function GET(req, { params }) {
  try {
    const [token, { id }] = await Promise.all([
      bootstrap(req),   // token + connectDB in parallel
      params,
    ]);

    if (!isAdminAuthed(token))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const w = await Withdraw.findById(id)
      .populate("user", "username email phone balance investedAmount referralCode")
      .lean();

    if (!w)
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });

    const fee = w.fee ?? calcFee(w.amount, 0.02);
    const netAmount = w.netAmount ?? calcNetAmount(w.amount, fee);

    return NextResponse.json({
      data: {
        _id: String(w._id),
        user: serializeUser(w.user),
        network: w.network,
        txId: w.txId,
        amount: w.amount,
        fee,
        netAmount,
        status: w.status,
        requestedAt: w.requestedAt,
        processedAt: w.processedAt,
        adminInvoice: serializeInvoice(w.adminInvoice),
        note: w.note,
        createdAt: w.createdAt,
      },
    });
  } catch (err) {
    console.error("GET /api/withdraw/admin/[id] error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── PATCH /api/withdraw/admin/[id] ──────────────────────────────────────────
export async function PATCH(req, { params }) {
  try {
    // connectDB + token + params + body — all in parallel
    const [token, { id }, body] = await Promise.all([
      bootstrap(req),
      params,
      req.json().catch(() => null),
    ]);

    if (!isAdminAuthed(token))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { status, adminInvoice } = body || {};

    if (!["pending", "approved", "rejected"].includes(status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const withdraw = await Withdraw.findById(id);

    if (!withdraw)
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });

    if (withdraw.status === "approved" && status !== "approved")
      return NextResponse.json(
        { error: "Cannot change status from approved" },
        { status: 400 }
      );

    // No-op: status unchanged
    if (withdraw.status === status)
      return NextResponse.json({ data: withdraw }, { status: 200 });

    // ── Atomic balance deduction (fixes race condition in original) ───────────
    if (status === "approved") {
      const updatedUser = await User.findOneAndUpdate(
        { _id: withdraw.user, balance: { $gte: withdraw.amount } },
        { $inc: { balance: -withdraw.amount } },
        { new: true, select: "username email phone balance investedAmount" }
      );

      if (!updatedUser) {
        // Either user missing or insufficient balance — check which
        const exists = await User.exists({ _id: withdraw.user });
        return NextResponse.json(
          { error: exists ? "User balance is lower than requested amount" : "User not found" },
          { status: 400 }
        );
      }

      withdraw.processedAt = new Date();
      withdraw.processedBy = token.id;
    }

    if (status === "rejected") {
      withdraw.processedAt = new Date();
      withdraw.processedBy = token.id;
    }

    // ── Store admin invoice ───────────────────────────────────────────────────
    if (adminInvoice?.data && adminInvoice?.contentType) {
      const base64 = adminInvoice.data;
      const match = typeof base64 === "string" && base64.match(/^data:(.+);base64,(.+)$/);

      withdraw.adminInvoice.data = Buffer.from(match ? match[2] : base64, "base64");
      withdraw.adminInvoice.contentType = match ? match[1] : (adminInvoice.contentType || "image/png");
      withdraw.adminInvoice.filename = adminInvoice.filename || "admin-invoice.png";
      withdraw.adminInvoice.size = withdraw.adminInvoice.data.length;
      withdraw.markModified("adminInvoice");
    }

    withdraw.status = status;

    // ── Save withdraw + re-fetch updated user in parallel ─────────────────────
    const [savedWithdraw] = await Promise.all([
      withdraw.save().then((w) =>
        w.populate("user", "username email phone balance investedAmount")
      ),
    ]);

    const fee = savedWithdraw.fee ?? calcFee(savedWithdraw.amount, 0.02);
    const netAmount = savedWithdraw.netAmount ?? calcNetAmount(savedWithdraw.amount, fee);

    return NextResponse.json({
      data: {
        _id: String(savedWithdraw._id),
        user: serializeUser(savedWithdraw.user),
        network: savedWithdraw.network,
        txId: savedWithdraw.txId,
        amount: savedWithdraw.amount,
        fee,
        netAmount,
        status: savedWithdraw.status,
        requestedAt: savedWithdraw.requestedAt,
        processedAt: savedWithdraw.processedAt,
        adminInvoice: serializeInvoice(savedWithdraw.adminInvoice),
      },
    });
  } catch (err) {
    console.error("PATCH /api/withdraw/admin/[id] error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}