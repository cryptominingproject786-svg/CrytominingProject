import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import { getAuthToken, getAuthUserId } from "../../../lib/authToken";

export const dynamic = "force-dynamic";

export async function POST(req) {
    try {
        const token = await getAuthToken(req);
        const userId = getAuthUserId(token);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (token?.role === "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const newPassword = String(body?.newPassword || "").trim();
        const confirmPassword = String(body?.confirmPassword || "").trim();

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
        }

        await connectDB();

        const user = await User.findById(userId).select("+password role");
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.role === "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        user.password = newPassword;
        await user.save();

        return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
    } catch (err) {
        console.error("user/password error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
