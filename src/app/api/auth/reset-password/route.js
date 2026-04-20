import crypto from "crypto";
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const token = String(req.nextUrl.searchParams.get("token") || "").trim();
    if (!token) {
      return NextResponse.json({ valid: false, error: "Reset token is required." }, { status: 400 });
    }

    await connectDB();
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    }).select("_id");

    if (!user) {
      return NextResponse.json({ valid: false, error: "Invalid or expired reset token." }, { status: 400 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("/api/auth/reset-password GET error:", error);
    return NextResponse.json({ valid: false, error: "Unable to validate reset token." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const token = String(body?.token || "").trim();
    const newPassword = String(body?.newPassword || "").trim();

    if (!token) {
      return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    }).select("password resetToken resetTokenExpiry");

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: "Password reset successfully." }, { status: 200 });
  } catch (error) {
    console.error("/api/auth/reset-password error:", error);
    return NextResponse.json(
      { error: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
