import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoDb";
import Recharge from "../../../models/Recharge";
import User from "../../../models/User";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    try {
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token || token.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const url = new URL(req.url);
        const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);

        const recharges = await Recharge.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("user", "username email")
            .lean();

        const items = recharges.map((r) => {
            let slipData = null;

            if (r.slip?.data && r.slip?.contentType) {
                let base64String = null;

                // Case 1: Proper Buffer
                if (Buffer.isBuffer(r.slip.data)) {
                    base64String = r.slip.data.toString("base64");
                }

                // Case 2: MongoDB Binary object (when using lean())
                else if (r.slip.data?.buffer) {
                    base64String = Buffer.from(r.slip.data.buffer).toString("base64");
                }

                // Case 3: $binary format
                else if (r.slip.data?.$binary?.base64) {
                    base64String = r.slip.data.$binary.base64;
                }

                if (base64String) {
                    slipData = `data:${r.slip.contentType};base64,${base64String}`;
                }
            }


            return {
                ...r,
                slip: slipData ? { dataUrl: slipData } : null,
            };
        });


        return NextResponse.json({ data: items }, { status: 200 });

    } catch (err) {
        console.error("/api/recharge/admin error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
