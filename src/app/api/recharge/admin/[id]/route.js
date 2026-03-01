import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoDb";
import Recharge from "../../../../models/Recharge";
import User from "../../../../models/User";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
export async function PATCH(req, { params }) {
    try {
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token || token.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ✅ NEXTJS 15 FIX — await params
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        const { status } = await req.json();

        // sanity check on incoming value
        if (!["pending", "confirmed", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        await connectDB();

        const recharge = await Recharge.findById(id);
        if (!recharge) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // if the requested status is identical to the current one, there's nothing to do
        if (recharge.status === status) {
            return NextResponse.json({ data: recharge }, { status: 200 });
        }

        // once a recharge has been confirmed we no longer allow it to change to another state
        if (recharge.status === "confirmed" && status !== "confirmed") {
            return NextResponse.json(
                { error: "Cannot change status after confirmation" },
                { status: 400 }
            );
        }

        // update status and handle confirmation side-effects below
        recharge.status = status;

        if (status === "confirmed") {
            recharge.confirmedAt = new Date();

            if (recharge.user) {
                // increment balance and also store last confirmed recharge info
                await User.updateOne(
                    { _id: recharge.user },
                    {
                        $inc: { balance: recharge.amount },
                        $set: {
                            lastRechargeAt: recharge.confirmedAt,
                            lastRechargeAmount: recharge.amount,
                            lastRechargeTxId: recharge.txId,
                            lastRechargeSlipFilename: recharge.slip?.filename,
                            lastRechargeSlipSize: recharge.slip?.size,
                        },
                    }
                );
            }
        }

        await recharge.save();

        return NextResponse.json({ data: recharge }, { status: 200 });

    } catch (err) {
        console.error("PATCH ERROR:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}