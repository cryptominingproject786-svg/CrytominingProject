import crypto from "crypto";
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import { sendMail } from "../../../lib/mailer";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function isValidEmail(email) {
  return EMAIL_RE.test(String(email || "").trim());
}

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email }).select("email username");

    // Do not reveal whether the email exists to prevent account enumeration.
    if (!user) {
      return NextResponse.json(
        { success: true, message: "If the email is registered, a reset link has been sent." },
        { status: 200 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    user.resetToken = hashedToken;
    user.resetTokenExpiry = expiry;
    await user.save();

    const appUrl = String(process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_NEXTAUTH_URL || "http://localhost:3000").trim();
    const resetUrl = new URL("/reset-password", appUrl);
    resetUrl.searchParams.set("token", token);

    const subject = "Reset your password";
    const text = `Hello ${user.username || "user"},\n\n` +
      `You requested a password reset. Click the link below to reset your password:\n\n` +
      `${resetUrl.toString()}\n\n` +
      `This link will expire in 15 minutes. If you did not request this, ignore this email.`;
    const html = `
      <div style="font-family:system-ui, sans-serif; color:#111; line-height:1.5;">
        <p>Hello ${user.username || "user"},</p>
        <p>You requested a password reset. Click the button below to reset your password.</p>
        <p>
          <a href="${resetUrl.toString()}" style="display:inline-block;padding:12px 18px;background:#f59e0b;color:#111;border-radius:8px;text-decoration:none;">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${resetUrl.toString()}" style="color:#0f766e;">${resetUrl.toString()}</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request this, you can safely ignore this message.</p>
      </div>
    `;

    await sendMail({
      to: user.email,
      subject,
      text,
      html,
    });

    return NextResponse.json(
      { success: true, message: "If the email is registered, a reset link has been sent." },
      { status: 200 }
    );
  } catch (err) {
    console.error("/api/auth/forgot-password error:", err);
    return NextResponse.json({ error: "Unable to process forgot password request." }, { status: 500 });
  }
}
