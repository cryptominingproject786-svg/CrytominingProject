import { NextResponse } from "next/server";
import connectDB from "../../lib/mongoDb";
import { getToken } from "next-auth/jwt";
import User from "../../models/User";
import Withdraw from "../../models/Withdraw";
export const dynamic = 'force-dynamic';

const WITHDRAW_AMOUNT_STEP = 10;

export async function POST(req) {
  try {
    const [token] = await Promise.all([
        getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET }),
        connectDB(),
    ]);

    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { network, amount, address, note } = body || {};

    if (!network || !amount || !address) {
      return NextResponse.json(
        { error: "Missing fields: network, amount, address are required" },
        { status: 400 }
      );
    }

    const nAmount = Number(amount);
    if (Number.isNaN(nAmount) || nAmount <= 0 || !Number.isFinite(nAmount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!Number.isInteger(nAmount / WITHDRAW_AMOUNT_STEP)) {
      return NextResponse.json({
        error: `Withdrawals must be requested in increments of ${WITHDRAW_AMOUNT_STEP} USDT (10, 20, 30, ...).`,
      }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: token.id,
        $expr: {
          $gte: [
            { $subtract: ["$balance", { $ifNull: ["$reservedBalance", 0] }] },
            nAmount,
          ],
        },
      },
      { $inc: { reservedBalance: nAmount } },
      { new: true, select: "balance reservedBalance" }
    ).lean();

    if (!updatedUser) {
      const exists = await User.exists({ _id: token.id });
      return NextResponse.json(
        { error: exists ? "Insufficient available balance" : "User not found" },
        { status: exists ? 400 : 404 }
      );
    }

    const feeAmount = Math.round(nAmount * 0.02 * 100) / 100;
    const netAmount = Math.round((nAmount - feeAmount) * 100) / 100;

    let withdraw;
    try {
      withdraw = await Withdraw.create({
        user: token.id,
        network,
        amount: nAmount,
        fee: feeAmount,
        netAmount,
        txId: String(address).trim(),
        note: note ? String(note).trim() : undefined,
        status: "pending",
        requestedAt: new Date(),
      });
    } catch (err) {
      await User.findByIdAndUpdate(token.id, { $inc: { reservedBalance: -nAmount } });
      if (err?.code === 11000) {
        return NextResponse.json(
          { error: "A pending withdrawal with this TXID already exists" },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json({ data: withdraw }, { status: 201 });
  } catch (err) {
    console.error("/api/withdraw POST error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const [token] = await Promise.all([
      getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET }),
      connectDB(),
    ]);
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const withdraws = await Withdraw.find({ user: token.id })
      .sort({ createdAt: -1 })
      .lean();

    const data = withdraws.map((w) => {
      let adminInvoice = null;
      if (w.adminInvoice?.data && w.adminInvoice?.contentType) {
        adminInvoice = `data:${w.adminInvoice.contentType};base64,${Buffer.from(w.adminInvoice.data).toString("base64")}`;
      }
      return {
        ...w,
        adminInvoice,
      };
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("/api/withdraw GET error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
