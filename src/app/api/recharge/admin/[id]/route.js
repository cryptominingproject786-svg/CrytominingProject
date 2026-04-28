import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoDb";
import Recharge from "../../../../models/Recharge";
import ReferralBonus from "../../../../models/ReferralBonus";
import User from "../../../../models/User";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";

const REFERRAL_BONUS_RATE = 0.10;

function inferContentType(filename, storedType) {
    if (storedType) return storedType;
    if (!filename) return "image/png";
    const lower = filename.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".gif")) return "image/gif";
    return "image/png";
}

function detectImageMimeType(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer)) return null;
    if (buffer.length >= 8 && buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
        return "image/png";
    }
    if (buffer.length >= 3 && buffer.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
        return "image/jpeg";
    }
    if (buffer.length >= 12 && buffer.slice(0, 4).toString() === "RIFF" && buffer.slice(8, 12).toString() === "WEBP") {
        return "image/webp";
    }
    if (buffer.length >= 6 && (buffer.slice(0, 6).toString() === "GIF87a" || buffer.slice(0, 6).toString() === "GIF89a")) {
        return "image/gif";
    }
    return null;
}

function serializeSlipData(data) {
    if (!data) return null;
    if (Buffer.isBuffer(data)) return data.toString("base64");
    if (typeof data === "string") {
        const match = data.match(/^data:(.+);base64,(.+)$/);
        return match ? match[2].trim() : data.trim();
    }
    if (data instanceof ArrayBuffer) {
        return Buffer.from(data).toString("base64");
    }
    if (ArrayBuffer.isView(data)) {
        return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString("base64");
    }
    if (data.buffer) {
        try {
            return Buffer.from(data.buffer).toString("base64");
        } catch (e) {
            console.warn("serializeSlipData: failed to convert data.buffer", e);
        }
    }
    if (Array.isArray(data)) {
        return Buffer.from(data).toString("base64");
    }
    if (data.data) {
        return serializeSlipData(data.data);
    }
    return null;
}

export async function GET(req, { params }) {
    try {
        const token = await getToken({
            req,
            secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET,
        });

        if (!token || token.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        await connectDB();

        const recharge = await Recharge.findById(id)
            .select("slip.contentType slip.filename slip.size slip.data")
            .lean();

        if (!recharge) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const slipBase64 = serializeSlipData(recharge.slip?.data);
        if (!slipBase64) {
            return NextResponse.json({ error: "Slip image data unavailable" }, { status: 404 });
        }

        const imageBuffer = Buffer.from(slipBase64, "base64");
        const detectedType = detectImageMimeType(imageBuffer);
        const contentType = detectedType || inferContentType(recharge.slip?.filename, recharge.slip?.contentType);
        const slipData = `data:${contentType};base64,${slipBase64}`;

        return NextResponse.json({
            data: {
                ...recharge,
                slip: {
                    contentType,
                    filename: recharge.slip.filename,
                    size: recharge.slip.size,
                    dataUrl: slipData,
                },
            },
        }, { status: 200 });
    } catch (err) {
        console.error("/api/recharge/admin/[id] GET error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const token = await getToken({
            req,
            secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET,
        });

        if (!token || token.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        const { status } = await req.json();

        // sanity check on incoming value
        if (!["pending", "confirmed", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        await connectDB();

        const recharge = await Recharge.findById(id)
            .select("status user amount slip")
            .lean();

        if (!recharge) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (recharge.status === status) {
            return NextResponse.json({ data: { _id: id, status } }, { status: 200 });
        }

        if (recharge.status === "confirmed" && status !== "confirmed") {
            return NextResponse.json(
                { error: "Cannot change status after confirmation" },
                { status: 400 }
            );
        }

        const now = new Date();
        const updates = { status };
        if (status === "confirmed") {
            updates.confirmedAt = now;
        }

        await Recharge.updateOne({ _id: id }, { $set: updates });

        if (status === "confirmed" && recharge.user) {
            const creditAmount = Number(recharge.amount);
            const bonusAmount = Math.round(creditAmount * REFERRAL_BONUS_RATE * 100) / 100;
            const rechargeUser = await User.findById(recharge.user)
                .select("referredBy")
                .lean();

            const childUpdates = {
                $inc: {
                    balance: creditAmount,
                },
                $set: {
                    lastRechargeAt: now,
                    lastRechargeAmount: recharge.amount,
                    lastRechargeSlipFilename: recharge.slip?.filename,
                    lastRechargeSlipSize: recharge.slip?.size,
                },
            };

            let shouldApplyReferralBonus = false;
            if (rechargeUser?.referredBy && mongoose.Types.ObjectId.isValid(rechargeUser.referredBy)) {
                const existingBonus = await ReferralBonus.exists({
                    parent: rechargeUser.referredBy,
                    referredUser: rechargeUser._id,
                    type: "firstReferralRechargeBonus",
                });
                shouldApplyReferralBonus = !existingBonus;
            }

            if (shouldApplyReferralBonus) {
                childUpdates.$inc.totalEarnings = bonusAmount;
                childUpdates.$inc.balance += bonusAmount;
            }

            await User.updateOne({ _id: recharge.user }, childUpdates);

            if (shouldApplyReferralBonus) {
                await Promise.all([
                    User.updateOne(
                        { _id: rechargeUser.referredBy },
                        {
                            $inc: {
                                balance: bonusAmount,
                                totalEarnings: bonusAmount,
                            },
                        }
                    ),
                    ReferralBonus.create({
                        parent: rechargeUser.referredBy,
                        referredUser: rechargeUser._id,
                        amount: bonusAmount,
                        description: "First referral recharge bonus",
                        awardedAt: now,
                        type: "firstReferralRechargeBonus",
                    }).catch((error) => {
                        if (error.code !== 11000) {
                            throw error;
                        }
                        return null;
                    }),
                ]);
            }
        }

        return NextResponse.json({ data: { _id: id, status } }, { status: 200 });

    } catch (err) {
        console.error("PATCH ERROR:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}