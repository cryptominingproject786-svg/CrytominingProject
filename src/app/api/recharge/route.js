import { NextResponse } from "next/server";
import connectDB from "../../lib/mongoDb";
import limiter from "../../lib/rateLimiter";
import Recharge from "../../models/Recharge";
import User from "../../models/User";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";

export async function POST(req) {
    try {
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "local";

        const { allowed, reset } = await limiter.consume(`recharge:${ip}`);
        if (!allowed) {
            return NextResponse.json(
                { error: "Too many requests" },
                { status: 429, headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) } }
            );
        }

        const body = await req.json();
        const { network, amount, txId, slip, email: submitterEmail, name: submitterName, userId: bodyUserId } = body || {};

        if (!network || !amount || !txId || !slip?.data) {
            console.warn("/api/recharge missing fields", { network, amount, txId, slipPresent: !!slip?.data });
            return NextResponse.json({ error: "Missing fields: network, amount, txId, and slip are required" }, { status: 400 });
        }

        const nAmount = Number(amount);
        if (Number.isNaN(nAmount) || nAmount < 2) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        await connectDB();

        // Optionally associate with an authenticated user
        let userId;
        let tokenEmail;
        try {
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (token) {
                tokenEmail = token.email;
                // Prefer finding the actual User document by token.sub (if it is an ObjectId)
                try {
                    let found = null;
                    if (token?.sub && mongoose.Types.ObjectId.isValid(token.sub)) {
                        found = await User.findById(token.sub).select("_id");
                    }
                    // fallback: find by token email
                    if (!found && token?.email) {
                        found = await User.findOne({ email: String(token.email).trim().toLowerCase() }).select("_id");
                    }
                    if (found) userId = found._id;
                    else if (token?.sub) userId = token.sub; // keep original if no match (we'll retry by email later)
                } catch (e) {
                    console.warn("recharge: error resolving token user", e);
                }
            }
        } catch (e) {
            // ignore if token retrieval fails
        }

        // Fallback: if client provided userId or email, try to link
        if (!userId) {
            if (bodyUserId) {
                userId = bodyUserId;
            } else if (submitterEmail) {
                try {
                    const found = await User.findOne({ email: String(submitterEmail).trim().toLowerCase() }).select("_id");
                    if (found) userId = found._id;
                } catch (e) {
                    console.warn("recharge: user lookup by email failed", e);
                }
            }
        }

        // Accept either a data URL (data:image/png;base64,...) or a raw base64 string
        let base64 = slip.data;
        let contentType = slip.contentType || "image/png";
        const filename = slip.filename || "upload.png";
        const m = typeof base64 === "string" && base64.match(/^data:(.+);base64,(.+)$/);
        if (m) {
            contentType = m[1];
            base64 = m[2];
        }

        const buffer = Buffer.from(base64, "base64");

        // reject extremely large uploads (server-side safeguard)
        const MAX_BYTES = 4 * 1024 * 1024; // 4MB
        if (buffer.length > MAX_BYTES) {
            return NextResponse.json({ error: "Image too large" }, { status: 413 });
        }

        const recharge = await Recharge.create({
            user: userId,
            network,
            amount: nAmount,
            txId,
            submitterEmail: submitterEmail ? String(submitterEmail).trim().toLowerCase() : undefined,
            submitterName: submitterName ? String(submitterName).trim() : undefined,
            slip: { data: buffer, contentType, filename, size: buffer.length },
        });

        console.info("/api/recharge created", {
            id: recharge._id.toString(),
            userId: userId ? String(userId) : null,
            txId: recharge.txId,
            amount: recharge.amount,
            slipFilename: recharge.slip?.filename,
            slipSize: recharge.slip?.size,
        });

        // If we detected an authenticated or discoverable user, attach the recharge to their profile
        if (userId) {
            try {
                let updateRes = await User.updateOne(
                    { _id: userId },
                    {
                        $addToSet: { recharges: recharge._id },
                        $set: {
                            lastRechargeAt: recharge.createdAt,
                            lastRechargeAmount: recharge.amount,
                            lastRechargeTxId: recharge.txId,
                            lastRechargeSlipFilename: recharge.slip?.filename,
                            lastRechargeSlipSize: recharge.slip?.size,
                        },
                    }
                );

                // If we didn't match by _id, attempt to resolve by token/email and retry
                if (!updateRes.matchedCount && tokenEmail) {
                    try {
                        const byEmail = await User.findOne({ email: String(tokenEmail).trim().toLowerCase() }).select("_id");
                        if (byEmail) {
                            updateRes = await User.updateOne(
                                { _id: byEmail._id },
                                { $addToSet: { recharges: recharge._id }, $set: { lastRechargeAt: recharge.createdAt } }
                            );
                            userId = byEmail._id; // update local var for logging
                        }
                    } catch (e) {
                        console.warn("recharge: fallback link by email failed", e);
                    }
                }

                console.info("/api/recharge user update result", { userId: String(userId), result: updateRes });

                if (!updateRes.matchedCount) {
                    console.warn("/api/recharge: user not found for linking", { userId });
                } else if (!updateRes.modifiedCount) {
                    // Possibly already linked — fetch the user document to inspect
                    try {
                        const updatedUser = await User.findById(userId).lean();
                        console.info("/api/recharge: fetched user after no-modify", {
                            userId: String(userId),
                            rechargesCount: (updatedUser?.recharges || []).length,
                            lastRechargeAt: updatedUser?.lastRechargeAt,
                        });
                    } catch (e) {
                        console.warn("/api/recharge: failed to fetch user after update", e);
                    }
                } else {
                    console.info("/api/recharge linked to user", { userId: String(userId), rechargeId: recharge._id.toString() });
                }
            } catch (e) {
                console.warn("failed to link recharge to user", e);
            }
        }

        return NextResponse.json({ status: "created", id: recharge._id, linkedToUser: !!userId }, { status: 201 });
    } catch (err) {
        console.error("/api/recharge error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await connectDB();

        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Resolve the real user id: prefer _id match, otherwise try the email
        let userId = token.sub;
        if (!mongoose.Types.ObjectId.isValid(userId) && token.email) {
            const found = await User.findOne({ email: String(token.email).trim().toLowerCase() }).select("_id");
            if (found) userId = found._id;
        } else if (mongoose.Types.ObjectId.isValid(userId)) {
            // additionally verify existence
            const exists = await User.exists({ _id: userId });
            if (!exists && token.email) {
                const found = await User.findOne({ email: String(token.email).trim().toLowerCase() }).select("_id");
                if (found) userId = found._id;
            }
        }

        const recharges = await Recharge.find({ user: userId }).sort({ createdAt: -1 }).limit(200).lean();

        const items = recharges.map((r) => {
            const slipData = r.slip?.data ? `data:${r.slip.contentType};base64,${Buffer.from(r.slip.data).toString("base64")}` : null;
            return { ...r, slip: { ...r.slip, dataUrl: slipData } };
        });

        return NextResponse.json({ data: items }, { status: 200 });
    } catch (err) {
        console.error("/api/recharge GET error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
