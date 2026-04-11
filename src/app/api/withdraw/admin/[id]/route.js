import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import connectDB from "../../../../lib/mongoDb";
import Withdraw from "../../../../models/Withdraw";
import User from "../../../../models/User";

// ─── GET /api/withdraw/admin/[id] ────────────────────────────────────────────
export async function GET(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const w = await Withdraw.findById(id)
      .populate("user", "username email phone balance investedAmount referralCode")
      .lean();

    if (!w) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    let adminInvoice = null;
    if (w.adminInvoice?.data && w.adminInvoice?.contentType) {
      adminInvoice = `data:${w.adminInvoice.contentType};base64,${Buffer.from(
        w.adminInvoice.data
      ).toString("base64")}`;
    }

    return NextResponse.json({
      data: {
        _id: String(w._id),
        user: w.user
          ? {
            _id: String(w.user._id),
            username: w.user.username,
            email: w.user.email,
            phone: w.user.phone || null,
            balance: w.user.balance ?? 0,
            investedAmount: w.user.investedAmount ?? 0,
            referralCode: w.user.referralCode,
          }
          : null,
        network: w.network,
        txId: w.txId,
        amount: w.amount,
        fee: w.fee ?? Math.round(w.amount * 0.05 * 100) / 100,
        netAmount: w.netAmount ?? Math.round((w.amount - (w.fee ?? Math.round(w.amount * 0.05 * 100) / 100)) * 100) / 100,
        status: w.status,
        requestedAt: w.requestedAt,
        processedAt: w.processedAt,
        adminInvoice,
        note: w.note,
        createdAt: w.createdAt,
      },
    });
  } catch (err) {
    console.error("GET /api/withdraw/admin/[id] error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── Re-export PATCH from the existing route file ────────────────────────────
// The PATCH handler you already wrote lives in this same file path.
// Paste your existing PATCH logic below (or keep it in a separate file and
// import it). Shown here for completeness:

export async function PATCH(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    const { status, adminInvoice } = body || {};

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await connectDB();

    const withdraw = await Withdraw.findById(id);
    if (!withdraw) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    if (withdraw.status === "approved" && status !== "approved") {
      return NextResponse.json(
        { error: "Cannot change status from approved" },
        { status: 400 }
      );
    }

    if (withdraw.status === status) {
      return NextResponse.json({ data: withdraw }, { status: 200 });
    }

    if (status === "approved") {
      const user = await User.findById(withdraw.user);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (user.balance < withdraw.amount) {
        return NextResponse.json(
          { error: "User balance is lower than requested amount" },
          { status: 400 }
        );
      }
      user.balance -= withdraw.amount;
      await user.save();
      withdraw.processedAt = new Date();
      withdraw.processedBy = token.id;
    }

    if (status === "rejected") {
      withdraw.processedAt = new Date();
      withdraw.processedBy = token.id;
    }

    // Store admin invoice image
    if (adminInvoice?.data && adminInvoice?.contentType) {
      const base64 = adminInvoice.data;
      const match =
        typeof base64 === "string" && base64.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        withdraw.adminInvoice.data = Buffer.from(match[2], "base64");
        withdraw.adminInvoice.contentType = match[1];
      } else {
        withdraw.adminInvoice.data = Buffer.from(base64, "base64");
        withdraw.adminInvoice.contentType = adminInvoice.contentType || "image/png";
      }
      withdraw.adminInvoice.filename = adminInvoice.filename || "admin-invoice.png";
      withdraw.adminInvoice.size = withdraw.adminInvoice.data.length;
      // Bug 3 fixed: adminInvoice is a plain nested object (not a SubSchema),
      // so Mongoose won't detect mutations to its fields automatically.
      // markModified forces Mongoose to include it in the $set on save().
      withdraw.markModified("adminInvoice");
    }

    withdraw.status = status;
    await withdraw.save();

    // Re-populate user for the response — same fields as GET so client state stays consistent
    await withdraw.populate("user", "username email phone balance investedAmount");

    let adminInvoiceUrl = null;
    if (withdraw.adminInvoice?.data && withdraw.adminInvoice?.contentType) {
      adminInvoiceUrl = `data:${withdraw.adminInvoice.contentType};base64,${Buffer.from(
        withdraw.adminInvoice.data
      ).toString("base64")}`;
    }

    return NextResponse.json({
      data: {
        _id: String(withdraw._id),
        user: withdraw.user
          ? {
            _id: String(withdraw.user._id),
            username: withdraw.user.username,
            email: withdraw.user.email,
            phone: withdraw.user.phone || null,
            balance: withdraw.user.balance ?? 0,
            investedAmount: withdraw.user.investedAmount ?? 0,
          }
          : null,
        network: withdraw.network,
        txId: withdraw.txId,
        amount: withdraw.amount,
        fee: withdraw.fee ?? Math.round(withdraw.amount * 0.05 * 100) / 100,
        netAmount: withdraw.netAmount ?? Math.round((withdraw.amount - (withdraw.fee ?? Math.round(withdraw.amount * 0.05 * 100) / 100)) * 100) / 100,
        status: withdraw.status,
        requestedAt: withdraw.requestedAt,
        processedAt: withdraw.processedAt,
        adminInvoice: adminInvoiceUrl,
      },
    });
  } catch (err) {
    console.error("PATCH /api/withdraw/admin/[id] error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}