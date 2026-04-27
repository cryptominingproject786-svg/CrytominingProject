import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import connectDB from "../../../../../lib/mongoDb";
import User from "../../../../../models/User";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const body = await req.json();
    const operation = String(body.operation || "").trim();
    const amount = Number(body.amount);

    if (!["increase", "decrease"].includes(operation)) {
        return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
    }

    if (!amount || Number.isNaN(amount) || amount <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    await connectDB();

    let user;
    if (operation === "increase") {
        user = await User.findByIdAndUpdate(
            id,
            { $inc: { balance: amount } },
            { new: true, select: "username email phone balance investedAmount totalEarnings dailyProfit role" }
        ).lean();
    } else {
        user = await User.findOneAndUpdate(
            { _id: id, balance: { $gte: amount } },
            { $inc: { balance: -amount } },
            { new: true, select: "username email phone balance investedAmount totalEarnings dailyProfit role" }
        ).lean();
    }

    if (!user) {
        return NextResponse.json(
            { error: operation === "decrease" ? "Insufficient balance or user not found" : "User not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({ data: user });
}
