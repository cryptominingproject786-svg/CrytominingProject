import { NextResponse } from "next/server";
import connectDB from "../../lib/mongoDb";
import { getToken } from "next-auth/jwt";
import User from "../../models/User";
import Withdraw from "../../models/Withdraw";
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
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
    if (Number.isNaN(nAmount) || nAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(token.id).select("balance");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (nAmount > user.balance) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const feeAmount = Math.round(nAmount * 0.02 * 100) / 100;
    const netAmount = Math.round((nAmount - feeAmount) * 100) / 100;

    const withdraw = await Withdraw.create({
      user: token.id,
      network,
      amount: nAmount,
      fee: feeAmount,
      netAmount,
      txId: String(address).trim(),
      note: note ? String(note).trim() : undefined,
    });

    return NextResponse.json({ data: withdraw }, { status: 201 });
  } catch (err) {
    console.error("/api/withdraw POST error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

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
