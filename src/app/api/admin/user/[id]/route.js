import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import connectDB from "../../../../lib/mongoDb";
import User from "../../../../models/User";

export const dynamic = "force-dynamic";

export async function DELETE(req, { params }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(id).select("username email role isActive").lean();
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "admin") {
        return NextResponse.json({ error: "Cannot delete admin account" }, { status: 403 });
    }

    await User.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({ data: { id, deleted: true } }, { status: 200 });
}
